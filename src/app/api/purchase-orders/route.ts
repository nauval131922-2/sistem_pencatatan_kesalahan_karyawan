import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

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
      whereClause += " AND (id LIKE ? OR faktur LIKE ? OR kd_supplier LIKE ? OR faktur_pr LIKE ? OR faktur_sph LIKE ?)";
      const searchTag = `%${q}%`;
      args.push(searchTag, searchTag, searchTag, searchTag, searchTag);
    }

    if (start && end) {
      whereClause += " AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2)) BETWEEN ? AND ?";
      args.push(start, end);
    }

    const dataQuery = `
      SELECT * FROM purchase_orders 
      ${whereClause}
      ORDER BY 
        substr(TRIM(tgl), 7, 4) DESC, 
        substr(TRIM(tgl), 4, 2) DESC, 
        substr(TRIM(tgl), 1, 2) DESC, 
        id DESC
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `SELECT COUNT(*) as total FROM purchase_orders ${whereClause}`;
    
    const [recordsRes, totalRes, lastScrapeRes, lastUpdatedRawRes] = await db.batch([
      { sql: dataQuery, args: [...args, pageSize, offset] },
      { sql: countQuery, args: args },
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_purchase_orders'`, args: [] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM purchase_orders`, args: [] }
    ], "read");

    const lastScrape = lastScrapeRes.rows[0] as any;
    const lastUpdatedRaw = (lastUpdatedRawRes.rows[0] as any)?.lastUpdated;
    const lastUpdated = lastScrape?.value || lastUpdatedRaw;

    return NextResponse.json({
      success: true,
      data: recordsRes.rows,
      total: Number((totalRes.rows[0] as any).total || 0),
      lastUpdated,
      page,
      pageSize
    });
  } catch (err: any) {
    console.error("[API-PO] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
