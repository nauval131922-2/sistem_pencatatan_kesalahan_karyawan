import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { getRolePermissions } from '@/lib/permissions';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 menit max (diperlukan untuk proses batch MDT)

const MODULE_ENDPOINTS: Record<string, string> = {
  'bom': '/api/scrape-bom',
  'orders': '/api/scrape-orders',
  'bahan-baku': '/api/scrape-bahan-baku',
  'barang-jadi': '/api/scrape-barang-jadi',
  'pr': '/api/scrape-pr',
  'spph-out': '/api/scrape-spph-out',
  'sph-in': '/api/scrape-sph-in',
  'purchase-orders': '/api/scrape-purchase-orders',
  'penerimaan-pembelian': '/api/scrape-penerimaan-pembelian',
  'rekap-pembelian-barang': '/api/scrape-rekap-pembelian-barang',
  'pelunasan-hutang': '/api/scrape-pelunasan-hutang',
  'sph-out': '/api/scrape-sph-out',
  'sales-orders': '/api/scrape-sales-orders',
  'sales': '/api/scrape-sales',
  'pengiriman': '/api/scrape-pengiriman',
  'pelunasan-piutang': '/api/scrape-pelunasan-piutang',
};

const SYNC_TO_PERM_MAP: Record<string, string> = {
  'pr': 'pembelian_pr',
  'spph-out': 'pembelian_spph',
  'sph-in': 'pembelian_sph_in',
  'purchase-orders': 'pembelian_po',
  'penerimaan-pembelian': 'pembelian_penerimaan',
  'rekap-pembelian-barang': 'pembelian_rekap',
  'pelunasan-hutang': 'pembelian_hutang',
  'bom': 'produksi_bom',
  'orders': 'produksi_orders',
  'bahan-baku': 'produksi_bahan_baku',
  'barang-jadi': 'produksi_barang_jadi',
  'sph-out': 'penjualan_sph_out',
  'sales-orders': 'penjualan_so',
  'sales': 'penjualan_laporan',
  'pengiriman': 'penjualan_pengiriman',
  'pelunasan-piutang': 'penjualan_piutang',
};

/**
 * Safe fetch wrapper — handles non-JSON response (HTML error pages) which commonly
 * occur when the scraper can't reach the MDT host or Next.js dev returns an error page.
 */
async function safeFetchJson(url: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return { ok: res.ok, data };
    } catch {
      const preview = text.slice(0, 200).replace(/\s+/g, ' ').trim();
      return { ok: false, error: `Respons bukan JSON (status ${res.status}): ${preview}` };
    }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Koneksi gagal' };
  }
}

/** Process a single module, update its DB status */
async function processModule(
  jobId: string,
  modId: string,
  start: string,
  end: string,
  origin: string
): Promise<void> {
  const endpoint = MODULE_ENDPOINTS[modId];
  if (!endpoint) return;

  try {
    await db.execute({
      sql: `INSERT INTO sync_job_modules (job_id, module_id, status)
            VALUES (?, ?, 'running')
            ON CONFLICT(job_id, module_id) DO UPDATE SET status = 'running', updated_at = CURRENT_TIMESTAMP`,
      args: [jobId, modId],
    });
  } catch {}

  const url = `${origin}${endpoint}?start=${start}&end=${end}`;
  const { ok, data, error } = await safeFetchJson(url);

  if (ok && data && (data.success || !data.error)) {
    const count = data.total || data.count || data.processed || 0;
    try {
      await db.execute({
        sql: `INSERT INTO sync_job_modules (job_id, module_id, status, records_count)
              VALUES (?, ?, 'done', ?)
              ON CONFLICT(job_id, module_id) DO UPDATE SET status = 'done', records_count = ?, updated_at = CURRENT_TIMESTAMP`,
        args: [jobId, modId, count, count],
      });
    } catch {}
  } else {
    const errMsg = error || data?.error || 'Gagal sinkronisasi';
    try {
      await db.execute({
        sql: `INSERT INTO sync_job_modules (job_id, module_id, status, error_message)
              VALUES (?, ?, 'error', ?)
              ON CONFLICT(job_id, module_id) DO UPDATE SET status = 'error', error_message = ?, updated_at = CURRENT_TIMESTAMP`,
        args: [jobId, modId, errMsg, errMsg],
      });
    } catch {}
  }
}

/**
 * Process all modules in parallel batches (max 4 at a time).
 * Parallel is ~4x faster and avoids Vercel's 60s serverless timeout.
 */
async function runModulesInBackground(
  jobId: string,
  modules: string[],
  start: string,
  end: string,
  origin: string
): Promise<void> {
  const CONCURRENCY = 4;
  for (let i = 0; i < modules.length; i += CONCURRENCY) {
    const batch = modules.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((modId) => processModule(jobId, modId, start, end, origin)));
  }

  try {
    await db.execute({
      sql: `UPDATE sync_jobs SET status = 'done', current_module = NULL,
            completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE job_id = ?`,
      args: [jobId],
    });
  } catch {}
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { modules, start, end } = body;

    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json({ error: 'No modules specified' }, { status: 400 });
    }

    const perms = session.role === 'Super Admin' ? null : await getRolePermissions(session.role);
    const allowedModules = modules.filter((modId: string) => {
      if (!perms) return true;
      const permKey = SYNC_TO_PERM_MAP[modId];
      if (!permKey) return true;
      return perms[permKey] !== false;
    });

    if (allowedModules.length === 0) {
      return NextResponse.json({ error: 'Tidak ada modul yang diizinkan.' }, { status: 403 });
    }

    // Ensure tables exist
    try {
      await db.batch([
        `CREATE TABLE IF NOT EXISTS sync_jobs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_id TEXT UNIQUE NOT NULL,
          status TEXT DEFAULT 'pending',
          current_module TEXT,
          started_by TEXT,
          total_modules INTEGER DEFAULT 0,
          start_date TEXT,
          end_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME
        )`,
        `CREATE TABLE IF NOT EXISTS sync_job_modules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_id TEXT NOT NULL,
          module_id TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          records_count INTEGER DEFAULT 0,
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(job_id, module_id)
        )`,
      ], 'write');
    } catch {}

    const jobId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await db.execute({
      sql: `INSERT INTO sync_jobs (job_id, status, started_by, total_modules, start_date, end_date)
            VALUES (?, 'running', ?, ?, ?, ?)`,
      args: [jobId, session.username || session.name, allowedModules.length, start, end],
    });

    for (const modId of allowedModules) {
      try {
        await db.execute({
          sql: `INSERT OR IGNORE INTO sync_job_modules (job_id, module_id, status) VALUES (?, ?, 'pending')`,
          args: [jobId, modId],
        });
      } catch {}
    }

    // Fire-and-forget: server processes in background, client polls for status
    const origin = request.nextUrl.origin;
    runModulesInBackground(jobId, allowedModules, start, end, origin);

    return NextResponse.json({ success: true, jobId, totalModules: allowedModules.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
