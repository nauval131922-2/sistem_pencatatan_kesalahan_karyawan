import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getScrapedPeriodSettingKey, parseScrapedPeriod } from '@/lib/server-scraped-period';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const q = searchParams.get('q') || '';
    const start = searchParams.get('start'); // YYYY-MM-DD
    const end = searchParams.get('end');     // YYYY-MM-DD

    const offset = (page - 1) * pageSize;

    let whereClause = "WHERE 1=1";
    const args: any[] = [];

    if (q) {
      whereClause += " AND (faktur LIKE ? OR kd_supplier LIKE ? OR faktur_po LIKE ? OR keterangan_pr LIKE ?)";
      const searchTag = `%${q}%`;
      args.push(searchTag, searchTag, searchTag, searchTag);
    }

    if (start && end) {
      whereClause += " AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2)) BETWEEN ? AND ?";
      args.push(start, end);
    }

    const dataQuery = `
      SELECT * FROM penerimaan_pembelian 
      ${whereClause}
      ORDER BY 
        substr(TRIM(tgl), 7, 4) DESC, 
        substr(TRIM(tgl), 4, 2) DESC, 
        substr(TRIM(tgl), 1, 2) DESC, 
        id DESC
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `SELECT COUNT(*) as total FROM penerimaan_pembelian ${whereClause}`;
    
    const [recordsRes, totalRes, lastScrapeRes, scrapedPeriodRes, lastUpdatedRawRes] = await db.batch([
      { sql: dataQuery, args: [...args, pageSize, offset] },
      { sql: countQuery, args: args },
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_penerimaan_pembelian'`, args: [] },
      { sql: `SELECT value FROM system_settings WHERE key = ?`, args: [getScrapedPeriodSettingKey('last_scrape_penerimaan_pembelian')] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM penerimaan_pembelian`, args: [] }
    ], "read");

    const lastScrape = lastScrapeRes.rows[0] as any;
    const lastUpdatedRaw = (lastUpdatedRawRes.rows[0] as any)?.lastUpdated;
    const lastUpdated = lastScrape?.value || lastUpdatedRaw;

    return NextResponse.json({
      success: true,
      data: recordsRes.rows,
      total: Number((totalRes.rows[0] as any).total || 0),
      lastUpdated,
      scrapedPeriod: parseScrapedPeriod((scrapedPeriodRes.rows[0] as any)?.value),
      page,
      pageSize
    });
  } catch (err: any) {
    console.error("[API-PB] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
