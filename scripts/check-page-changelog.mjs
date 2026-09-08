/**
 * Cek path coverage: halaman user-facing yang berubah harus punya entry
 * di PAGE_CHANGELOG_PATHS + PAGE_CHANGELOGS (bukan cuma "file changelog disentuh").
 *
 * Manual: npm run check:changelog
 *
 * Scope default:
 *   - working tree (unstaged + staged + untracked)
 *   - commit lokal sejak origin/master (origin/master...HEAD)
 *
 * SKIP_CHANGELOG_CHECK=1  → selalu lulus
 * --allow-skip            → sama
 * --working-tree-only     → hanya dirty tree
 * CHANGELOG_BASE=ref      → ganti base (default origin/master)
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHANGELOG_FILE = 'src/lib/page-changelogs.ts';
const SKIP_BASENAMES = new Set([
  'loading.tsx',
  'loading.jsx',
  'error.tsx',
  'error.jsx',
  'layout.tsx',
  'layout.jsx',
  'template.tsx',
  'template.jsx',
  'not-found.tsx',
  'not-found.jsx',
  'global-error.tsx',
  'global-error.jsx',
  'default.tsx',
  'default.jsx',
]);

/** Route sistem — tidak wajib page changelog */
const SKIP_ROUTES = new Set(['/login', '/unauthorized']);

const args = process.argv.slice(2);
const allowSkip =
  process.env.SKIP_CHANGELOG_CHECK === '1' || args.includes('--allow-skip');
const workingTreeOnly = args.includes('--working-tree-only');
const baseRef = process.env.CHANGELOG_BASE || 'origin/master';

if (allowSkip) {
  console.log('check:changelog — dilewati (SKIP_CHANGELOG_CHECK / --allow-skip).');
  process.exit(0);
}

function norm(p) {
  return p.replace(/\\/g, '/').trim();
}

function gitLines(cmd) {
  try {
    const out = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });
    return out
      .split(/\r?\n/)
      .map(norm)
      .filter(Boolean);
  } catch {
    return [];
  }
}

function gitOk(cmd) {
  try {
    execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });
    return true;
  } catch {
    return false;
  }
}

function isPageIsh(file) {
  const f = norm(file);
  if (!f.startsWith('src/app/')) return false;
  if (f.startsWith('src/app/api/')) return false;
  if (!/\.(tsx|jsx)$/i.test(f)) return false;
  const base = f.split('/').pop()?.toLowerCase() || '';
  if (SKIP_BASENAMES.has(base)) return false;
  return true;
}

/** src/app/foo/bar/Client.tsx → /foo/bar ; src/app/foo/page.tsx → /foo */
function fileToRoute(file) {
  const f = norm(file);
  if (!f.startsWith('src/app/')) return null;
  let rest = f.slice('src/app/'.length);
  const parts = rest.split('/');
  const last = parts[parts.length - 1] || '';
  if (/\.(tsx|jsx)$/i.test(last)) {
    parts.pop();
  }
  if (parts.length === 0) return '/';
  return '/' + parts.join('/');
}

function loadChangelogRegistry() {
  const full = path.join(process.cwd(), CHANGELOG_FILE);
  if (!fs.existsSync(full)) {
    return { paths: new Map(), pageKeys: new Set(), error: `File tidak ada: ${CHANGELOG_FILE}` };
  }
  const src = fs.readFileSync(full, 'utf8');

  // '/path': 'pageKey'  (juga multi-line value)
  const paths = new Map();
  const pathRe = /['"](\/[^'"]*)['"]\s*:\s*['"]([^'"]+)['"]/g;
  // Hanya ambil di blok PAGE_CHANGELOG_PATHS — potong kasar
  const pathsBlock = src.match(
    /PAGE_CHANGELOG_PATHS[^=]*=\s*\{([\s\S]*?)\n\};/
  );
  const pathSrc = pathsBlock ? pathsBlock[1] : src;
  let m;
  while ((m = pathRe.exec(pathSrc)) !== null) {
    paths.set(m[1], m[2]);
  }

  // pageKey di PAGE_CHANGELOGS:  key: {  atau  'key': {  atau entry({ pageKey: 'x'
  const pageKeys = new Set();
  const logsBlock = src.match(/PAGE_CHANGELOGS[^=]*=\s*\{([\s\S]*?)\n\};/);
  const logsSrc = logsBlock ? logsBlock[1] : src;
  const keyRe = /(?:^|\n)\s*(?:['"]([\w-]+)['"]|(\w+))\s*:\s*(?:entry\s*\(|\{)/g;
  while ((m = keyRe.exec(logsSrc)) !== null) {
    pageKeys.add(m[1] || m[2]);
  }
  // pageKey: '...' di dalam entry()
  const pkRe = /pageKey:\s*['"]([^'"]+)['"]/g;
  while ((m = pkRe.exec(logsSrc)) !== null) {
    pageKeys.add(m[1]);
  }

  return { paths, pageKeys, error: null };
}
function getWorkingTreeChangelogKeys() {
  const diffCmds = [
    'git diff -U0 -- ' + CHANGELOG_FILE,
    'git diff --cached -U0 -- ' + CHANGELOG_FILE,
  ];
  const addedLines = [];
  for (const cmd of diffCmds) {
    const lines = gitLines(cmd);
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        addedLines.push(line);
      }
    }
  }
  const keys = new Set();
  for (const line of addedLines) {
    const mPk = line.match(/pageKey:\s*['"]([^'"]+)['"]/);
    if (mPk) keys.add(mPk[1]);
    const mKey = line.match(/['"]([a-z0-9-]+)-\d{4}-\d{2}-\d{2}/);
    if (mKey) keys.add(mKey[1]);
  }
  return keys;
}

function getLastChangelogCommitForPage(pageKey) {
  if (workingTreeOnly || !gitOk(`git rev-parse --verify ${baseRef}`)) return null;
  const commits = gitLines(`git log --format="%H" ${baseRef}..HEAD -- ${CHANGELOG_FILE}`);
  for (const h of commits) {
    const diff = gitLines(`git show -U0 ${h} -- ${CHANGELOG_FILE}`);
    const hasKey = diff.some(
      (l) =>
        l.startsWith('+') &&
        !l.startsWith('+++') &&
        (l.includes(`pageKey: '${pageKey}'`) ||
          l.includes(`pageKey: "${pageKey}"`) ||
          l.includes(`'${pageKey}-`))
    );
    if (hasKey) return h;
  }
  return null;
}



const fromUnstaged = gitLines('git diff --name-only');
const fromStaged = gitLines('git diff --cached --name-only');
const fromUntracked = gitLines('git ls-files --others --exclude-standard');
const treeSet = new Set([...fromUnstaged, ...fromStaged, ...fromUntracked]);

let fromCommits = [];
let commitScopeNote = '';
if (!workingTreeOnly) {
  if (!gitOk(`git rev-parse --verify ${baseRef}`)) {
    commitScopeNote = `warning: base ${baseRef} tidak ada — hanya cek working tree.`;
  } else {
    fromCommits = gitLines(`git diff --name-only ${baseRef}...HEAD`);
    commitScopeNote = `vs ${baseRef}...HEAD`;
  }
} else {
  commitScopeNote = 'working-tree-only';
}

const commitSet = new Set(fromCommits);
const changed = new Set([...treeSet, ...commitSet]);
const pageFiles = [...changed].filter(isPageIsh).sort();

if (pageFiles.length === 0) {
  console.log(
    workingTreeOnly
      ? 'check:changelog — OK (tidak ada ubahan halaman user-facing di working tree).'
      : `check:changelog — OK (tidak ada ubahan halaman user-facing di working tree atau ${commitScopeNote}).`
  );
  if (commitScopeNote.startsWith('warning:')) console.log(`  ${commitScopeNote}`);
  process.exit(0);
}

const registry = loadChangelogRegistry();
if (registry.error) {
  console.error('check:changelog — GAGAL');
  console.error(registry.error);
  process.exit(1);
}
const workingTreeChangelogKeys = getWorkingTreeChangelogKeys();



// route → { files, sources }
const routeMap = new Map();
for (const f of pageFiles) {
  const route = fileToRoute(f);
  if (!route) continue;
  if (!routeMap.has(route)) {
    routeMap.set(route, { files: [], fromTree: false, fromCommits: false });
  }
  const rec = routeMap.get(route);
  rec.files.push(f);
  if (treeSet.has(f)) rec.fromTree = true;
  if (commitSet.has(f)) rec.fromCommits = true;
}

const missing = [];
const covered = [];

for (const [route, rec] of [...routeMap.entries()].sort((a, b) =>
  a[0].localeCompare(b[0])
)) {
  if (SKIP_ROUTES.has(route)) continue;

  const pageKey = registry.paths.get(route);
  if (!pageKey) {
    missing.push({
      route,
      reason: 'path belum di PAGE_CHANGELOG_PATHS',
      ...rec,
    });
    continue;
  }
  if (!registry.pageKeys.has(pageKey)) {
    missing.push({
      route,
      reason: `pageKey "${pageKey}" belum di PAGE_CHANGELOGS`,
      ...rec,
    });
    continue;
  }
  // 1. Verifikasi jika file halaman dimodifikasi di working tree
  if (rec.fromTree && !workingTreeChangelogKeys.has(pageKey)) {
    missing.push({
      route,
      reason: `file halaman dimodifikasi di working tree tetapi belum ada entri baru untuk pageKey "${pageKey}" di working tree ${CHANGELOG_FILE}`,
      ...rec,
    });
    continue;
  }

  // 2. Verifikasi jika file halaman dimodifikasi di commit lokal
  if (rec.fromCommits) {
    const lastChangelogCommit = getLastChangelogCommitForPage(pageKey);
    if (!lastChangelogCommit) {
      missing.push({
        route,
        reason: `halaman diubah pada commit lokal tetapi belum ada entri changelog untuk pageKey "${pageKey}" di range ${baseRef}..HEAD`,
        ...rec,
      });
      continue;
    }

    // Cek commit terakhir yang menyentuh file-file halaman ini
    const pageFilesEscaped = rec.files.join(' ');
    const lastPageCommit = gitLines(
      `git log -n 1 --format="%H" ${baseRef}..HEAD -- ${pageFilesEscaped}`
    )[0];

    if (lastPageCommit && lastPageCommit !== lastChangelogCommit) {
      const afterCount = Number(
        gitLines(
          `git rev-list --count ${lastChangelogCommit}..${lastPageCommit}`
        )[0] || 0
      );
      if (afterCount > 0) {
        missing.push({
          route,
          reason: `halaman dimodifikasi lagi pada commit ${lastPageCommit.slice(0, 7)} (${afterCount} commit setelah update changelog terakhir ${lastChangelogCommit.slice(0, 7)}), changelog perlu diperbarui`,
          ...rec,
        });
        continue;
      }
    }
  }
  covered.push({ route, pageKey, ...rec });
}

if (missing.length === 0) {
  console.log('check:changelog — OK (semua path halaman yang berubah punya entry changelog).');
  console.log(
    `  Scope: working tree${workingTreeOnly ? '' : ` + ${commitScopeNote}`}`
  );
  console.log(`  Path tercakup (${covered.length}):`);
  for (const c of covered) {
    const src = [
      c.fromTree ? 'tree' : null,
      c.fromCommits ? 'commit' : null,
    ]
      .filter(Boolean)
      .join('+');
    console.log(`    - ${c.route}  → ${c.pageKey}  [${src}]`);
  }
  process.exit(0);
}

console.error('check:changelog — GAGAL');
console.error('');
console.error(
  'Ada path halaman user-facing yang berubah tanpa entry lengkap di page-changelogs.ts.'
);
console.error(
  '(Cukup menyentuh file page-changelogs.ts saja TIDAK cukup — tiap path harus terdaftar.)'
);
console.error('Update PAGE_CHANGELOG_PATHS + PAGE_CHANGELOGS (permissionKeys, sortDate,');
console.error(' bump version / replace items). Lihat AGENTS.md → Page Changelog.');
console.error('');
console.error(`Path belum tercakup (${missing.length}):`);
for (const m of missing) {
  const src = [
    m.fromTree ? 'working tree' : null,
    m.fromCommits ? `commit vs ${baseRef}` : null,
  ]
    .filter(Boolean)
    .join(', ');
  console.error(`  - ${m.route}`);
  console.error(`      ${m.reason}  [${src}]`);
  for (const f of m.files.slice(0, 3)) {
    console.error(`      file: ${f}`);
  }
  if (m.files.length > 3) {
    console.error(`      … +${m.files.length - 3} file lain`);
  }
}
if (covered.length) {
  console.error('');
  console.error(`Sudah OK (${covered.length} path):`);
  for (const c of covered) {
    console.error(`  - ${c.route} → ${c.pageKey}`);
  }
}
console.error('');
console.error('Sengaja skip?  SKIP_CHANGELOG_CHECK=1 npm run check:changelog');
console.error('            atau  npm run check:changelog -- --allow-skip');
console.error('Hanya working tree?  npm run check:changelog -- --working-tree-only');
process.exit(1);
