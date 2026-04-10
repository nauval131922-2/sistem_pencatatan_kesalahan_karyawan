import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { getRolePermissions } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

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

// Runs scrape modules in background (fire & forget pattern)
async function runModulesInBackground(
  jobId: string,
  modules: string[],
  start: string,
  end: string,
  origin: string
) {
  for (const modId of modules) {
    const endpoint = MODULE_ENDPOINTS[modId];
    if (!endpoint) continue;

    // Update status to "running"
    try {
      await db.execute({
        sql: `UPDATE sync_jobs SET status = 'running', current_module = ?, updated_at = CURRENT_TIMESTAMP WHERE job_id = ?`,
        args: [modId, jobId]
      });
      await db.execute({
        sql: `INSERT INTO sync_job_modules (job_id, module_id, status) VALUES (?, ?, 'running')
              ON CONFLICT(job_id, module_id) DO UPDATE SET status = 'running', updated_at = CURRENT_TIMESTAMP`,
        args: [jobId, modId]
      });
    } catch {}

    try {
      const url = `${origin}${endpoint}?start=${start}&end=${end}&job_id=${jobId}`;
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      const data = await res.json();

      const count = data.total || data.count || data.processed || 0;
      await db.execute({
        sql: `INSERT INTO sync_job_modules (job_id, module_id, status, records_count)
              VALUES (?, ?, 'done', ?)
              ON CONFLICT(job_id, module_id) DO UPDATE SET status = 'done', records_count = ?, updated_at = CURRENT_TIMESTAMP`,
        args: [jobId, modId, count, count]
      });
    } catch (err: any) {
      try {
        await db.execute({
          sql: `INSERT INTO sync_job_modules (job_id, module_id, status, error_message)
                VALUES (?, ?, 'error', ?)
                ON CONFLICT(job_id, module_id) DO UPDATE SET status = 'error', error_message = ?, updated_at = CURRENT_TIMESTAMP`,
          args: [jobId, modId, err.message, err.message]
        });
      } catch {}
    }
  }

  // Mark job as completed
  try {
    await db.execute({
      sql: `UPDATE sync_jobs SET status = 'done', current_module = NULL, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE job_id = ?`,
      args: [jobId]
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

    // Filter by permissions
    const perms = session.role === 'Super Admin' ? null : await getRolePermissions(session.role);
    const allowedModules = modules.filter((modId: string) => {
      if (!perms) return true; // Super Admin bypass
      const permKey = SYNC_TO_PERM_MAP[modId];
      if (!permKey) return true;
      return perms[permKey] !== false;
    });

    if (allowedModules.length === 0) {
      return NextResponse.json({ error: 'Tidak ada modul yang diizinkan.' }, { status: 403 });
    }

    // Ensure sync job tables exist
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
        )`
      ], 'write');
    } catch {}

    // Create job record
    const jobId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await db.execute({
      sql: `INSERT INTO sync_jobs (job_id, status, started_by, total_modules, start_date, end_date)
            VALUES (?, 'running', ?, ?, ?, ?)`,
      args: [jobId, session.username || session.name, allowedModules.length, start, end]
    });

    // Insert pending entries for each module
    for (const modId of allowedModules) {
      try {
        await db.execute({
          sql: `INSERT OR IGNORE INTO sync_job_modules (job_id, module_id, status) VALUES (?, ?, 'pending')`,
          args: [jobId, modId]
        });
      } catch {}
    }

    // Fire & forget — run in background without awaiting
    const origin = request.nextUrl.origin;
    runModulesInBackground(jobId, allowedModules, start, end, origin);

    return NextResponse.json({ success: true, jobId, totalModules: allowedModules.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
