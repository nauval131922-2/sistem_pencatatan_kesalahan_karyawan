import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getScrapedPeriodSettingKey, parseScrapedPeriod } from '@/lib/server-scraped-period';

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

    let query = `SELECT * FROM pengiriman WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) as total FROM pengiriman WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      const searchPattern = `%${search}%`;
      const searchSql = ` AND (faktur LIKE ? OR recid LIKE ? OR kd_supir LIKE ? OR status_faktur LIKE ? OR kd_eks LIKE ?)`;
      query += searchSql;
      countQuery += searchSql;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (from && to) {
      const filterSql = ` AND (
        substr(tgl,7,4) || '-' || substr(tgl,4,2) || '-' || substr(tgl,1,2)
      ) BETWEEN ? AND ?`;
      query += filterSql;
      countQuery += filterSql;
      params.push(from, to);
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
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_pengiriman'`, args: [] },
      { sql: `SELECT value FROM system_settings WHERE key = ?`, args: [getScrapedPeriodSettingKey('last_scrape_pengiriman')] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM pengiriman`, args: [] }
    ], "read");

    const lastScrape = metadataResults[0].rows[0] as any;
    const lastUpdatedRaw = (metadataResults[2].rows[0] as any).lastUpdated;
    const lastUpdated = lastScrape?.value || lastUpdatedRaw;

    return NextResponse.json({
      success: true,
      data: dataResults.rows,
      total,
      lastUpdated,
      scrapedPeriod: parseScrapedPeriod((metadataResults[1].rows[0] as any)?.value)
    });

  } catch (error: any) {
    console.error('API Error (pengiriman):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
