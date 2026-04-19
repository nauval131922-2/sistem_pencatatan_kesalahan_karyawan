
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@libsql/client';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
}

loadEnv();

async function main() {
  const dbPath = process.env.DB_PATH || 'database_dev.sqlite';
  const dbUrl = `file:${path.join(process.cwd(), dbPath)}`;
  console.log(`[IMPORT] Connecting to: ${dbUrl}`);

  const db = createClient({ url: dbUrl, authToken: process.env.TURSO_AUTH_TOKEN });

  const filePath = path.join(process.cwd(), 'Referensi', '060105 MASTER PEKERJAAN.xlsm');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets['Pekerjaan-Kode'];
  if (!worksheet) {
    console.error("Sheet 'Pekerjaan-Kode' not found!");
    return;
  }

  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Determine category per column group from row index 3
  const categoryRow: any[] = rawData[3] || [];

  // Fill forward categories for each col group (offset 2 = name col within a 4-col block starting at offset 1)
  // Block structure: col+0=separator, col+1=code, col+2=name, col+3=target
  const colGroupCategories: Record<number, string> = {};
  let lastCat = '';
  for (let col = 0; col < categoryRow.length; col += 4) {
    const catVal = String(categoryRow[col + 2] ?? '').trim();
    if (catVal && !['TARGET', 'KET', 'STANDART'].some(h => catVal.includes(h))) {
      lastCat = catVal;
    }
    colGroupCategories[col] = lastCat;
  }

  // Extract items
  const items: { code: string; name: string; category: string; subCategory: string; target: number | null }[] = [];
  const seenCodes = new Set<string>();

  for (let rowIdx = 0; rowIdx < rawData.length; rowIdx++) {
    const row = rawData[rowIdx] as any[];
    if (!row) continue;

    for (let col = 0; col < row.length; col += 4) {
      const code = row[col + 1];
      const name = row[col + 2];
      const target = row[col + 3];

      if (
        code && name &&
        typeof code === 'string' &&
        /\w+\.\w+/.test(code) &&
        typeof name === 'string' &&
        name.trim() &&
        !seenCodes.has(code.trim())
      ) {
        seenCodes.add(code.trim());
        items.push({
          code: code.trim(),
          name: name.trim(),
          category: colGroupCategories[col] || '',
          subCategory: '',
          target: typeof target === 'number' ? target : null,
        });
      }
    }
  }

  console.log(`[IMPORT] Extracted ${items.length} unique items`);
  const withTarget = items.filter(x => x.target !== null).length;
  console.log(`[IMPORT] Items with target value: ${withTarget}`);

  // Ensure target_value column exists (safe migration)
  try {
    await db.execute('ALTER TABLE master_pekerjaan ADD COLUMN target_value REAL;');
    console.log('[IMPORT] Column target_value added.');
  } catch {
    console.log('[IMPORT] Column target_value already exists, skipping ALTER.');
  }

  // Batch insert
  const batchSize = 50;
  let imported = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const queries = batch.map(item => ({
      sql: 'INSERT OR REPLACE INTO master_pekerjaan (code, name, category, sub_category, target_value) VALUES (?, ?, ?, ?, ?)',
      args: [item.code, item.name, item.category, item.subCategory || null, item.target],
    }));
    await db.batch(queries, 'write');
    imported += batch.length;
    if (i % 500 === 0) console.log(`[IMPORT] Processed ${imported}/${items.length}...`);
  }

  console.log(`[IMPORT] Done! Imported ${imported} items.`);
}

main().catch(console.error);
