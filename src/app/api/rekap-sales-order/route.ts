import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { buildFtsQuery } from '@/lib/fts';
import { getScrapedPeriodSettingKey, parseScrapedPeriod } from '@/lib/server-scraped-period';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page    = parseInt(searchParams.get('page')  || '1');
    const limit   = parseInt(searchParams.get('limit') || '50');
    const search  = searchParams.get('q') || '';
    const from    = searchParams.get('from');
    const to      = searchParams.get('to');
    const minHarga = searchParams.get('min');
    const maxHarga = searchParams.get('max');
    const offset  = (page - 1) * limit;

    let query      = `SELECT *, jumlah AS total FROM sales_orders WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) as total FROM sales_orders WHERE 1=1`;
    const params: any[] = [];

    // ─── FTS5 Search ──────────────────────────────────────────────────────
    if (search) {
      const ftsQuery = buildFtsQuery(search);
      let ftsUsed = false;

      if (ftsQuery) {
        try {
          const ftsSql = `SELECT id FROM sales_orders_fts WHERE sales_orders_fts MATCH ?`;
          const ftsResult = await db.execute({ sql: ftsSql, args: [ftsQuery] });
          if (ftsResult.rows.length > 0) {
            const ids = ftsResult.rows.map(r => r.id).join(',');
            query      += ` AND id IN (${ids})`;
            countQuery += ` AND id IN (${ids})`;
            ftsUsed = true;
          }
        } catch { /* fallback below */ }
      }

      if (!ftsUsed) {
        const pat = `%${search}%`;
        const clause = ` AND (faktur LIKE ? OR faktur_sph LIKE ? OR kd_barang LIKE ? OR faktur_prd LIKE ? OR nama_prd LIKE ?)`;
        query      += clause;
        countQuery += clause;
        params.push(pat, pat, pat, pat, pat);
      }
    }

    // ─── Date Filter ──────────────────────────────────────────────────────
    if (from && to) {
      const clause = ` AND (substr(tgl,7,4)||substr(tgl,4,2)||substr(tgl,1,2)) BETWEEN ? AND ?`;
      query      += clause;
      countQuery += clause;
      params.push(from.replace(/-/g, ''), to.replace(/-/g, ''));
    }

    // ─── Harga Filter ─────────────────────────────────────────────────────
    if (minHarga !== null && minHarga !== '') {
      const clause = ` AND jumlah >= ?`;
      query      += clause;
      countQuery += clause;
      params.push(parseFloat(minHarga));
    }
    if (maxHarga !== null && maxHarga !== '') {
      const clause = ` AND jumlah <= ?`;
      query      += clause;
      countQuery += clause;
      params.push(parseFloat(maxHarga));
    }

    // ─── Sorting + Pagination ─────────────────────────────────────────────
    query += ` ORDER BY substr(tgl,7,4) DESC, substr(tgl,4,2) DESC, substr(tgl,1,2) DESC, id DESC LIMIT ? OFFSET ?`;
    const queryParams = [...params, limit, offset];

    const [dataResults, countResults] = await Promise.all([
      db.execute({ sql: query,      args: queryParams }),
      db.execute({ sql: countQuery, args: params }),
    ]);

    const total = (countResults.rows[0]?.total as number) || 0;

    const metadataResults = await db.batch([
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_sales_orders'`, args: [] },
      { sql: `SELECT value FROM system_settings WHERE key = ?`, args: [getScrapedPeriodSettingKey('last_scrape_sales_orders')] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM sales_orders`, args: [] }
    ], 'read');

    const lastScrape     = metadataResults[0].rows[0] as any;
    const lastUpdatedRaw = (metadataResults[2].rows[0] as any).lastUpdated;
    const lastUpdated    = lastScrape?.value || lastUpdatedRaw;

    return NextResponse.json({
      success: true,
      data: dataResults.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      lastUpdated,
      scrapedPeriod: parseScrapedPeriod((metadataResults[1].rows[0] as any)?.value),
    });

  } catch (error: any) {
    console.error('API Error (rekap-sales-order):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
