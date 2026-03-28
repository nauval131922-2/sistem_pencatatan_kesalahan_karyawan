import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM rekap_pembelian_barang WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) as total FROM rekap_pembelian_barang WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      const searchPattern = `%${search}%`;
      const searchSql = ` AND (faktur LIKE ? OR kd_supplier LIKE ? OR kd_barang LIKE ? OR faktur_po LIKE ? OR username LIKE ?)`;
      query += searchSql;
      countQuery += searchSql;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (from && to) {
      const filterSql = ` AND (substr(tgl,7,4)||substr(tgl,4,2)||substr(tgl,1,2)) BETWEEN ? AND ?`;
      const fromFormatted = from.replace(/-/g, '');
      const toFormatted = to.replace(/-/g, '');
      query += filterSql;
      countQuery += filterSql;
      params.push(fromFormatted, toFormatted);
    }

    query += ` ORDER BY substr(tgl,7,4) DESC, substr(tgl,4,2) DESC, substr(tgl,1,2) DESC, id DESC LIMIT ? OFFSET ?`;
    const queryParams = [...params, limit, offset];

    const [dataResults, countResults] = await Promise.all([
      db.execute({ sql: query, args: queryParams }),
      db.execute({ sql: countQuery, args: params })
    ]);

    const total = (countResults.rows[0]?.total as number) || 0;
    
    // Get metadata
    const metadataResults = await db.batch([
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_rekap_pembelian_barang'`, args: [] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM rekap_pembelian_barang`, args: [] }
    ], "read");

    const lastScrape = metadataResults[0].rows[0] as any;
    const lastUpdatedRaw = (metadataResults[1].rows[0] as any).lastUpdated;
    const lastUpdated = lastScrape?.value || lastUpdatedRaw;

    return NextResponse.json({
      success: true,
      data: dataResults.rows,
      total,
      lastUpdated
    });

  } catch (error: any) {
    console.error('API Error (rekap-pembelian-barang):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
