import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const fromDate = searchParams.get('from') || '';
    const toDate = searchParams.get('to') || '';
    const offset = (page - 1) * limit;

    let records;
    let total = 0;

    const dateFilterSQL = (fromDate && toDate) 
      ? ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2) BETWEEN ? AND ?)`
      : ``;

    if (search) {
      const query = `%${search}%`;
      const sqlParams: any[] = [query, query, query];
      if (fromDate && toDate) { sqlParams.push(fromDate, toDate); }
      const searchSqlParams = [...sqlParams, limit, offset];

      const recordsRes = await db.execute({
        sql: `
          SELECT id, faktur, nama_prd, nama_pelanggan, tgl, qty, created_at 
          FROM orders 
          WHERE (nama_prd LIKE ? OR nama_pelanggan LIKE ? OR faktur LIKE ?) ${dateFilterSQL}
          ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
          LIMIT ? OFFSET ?
        `,
        args: searchSqlParams
      });
      records = recordsRes.rows;

      const totalRes = await db.execute({
        sql: `
          SELECT COUNT(*) as count FROM orders 
          WHERE (nama_prd LIKE ? OR nama_pelanggan LIKE ? OR faktur LIKE ?) ${dateFilterSQL}
        `,
        args: sqlParams
      });
      total = Number((totalRes.rows[0] as any).count);
    } else {
      const sqlParams: any[] = [];
      if (fromDate && toDate) { sqlParams.push(fromDate, toDate); }
      const listSqlParams = [...sqlParams, limit, offset];

      const recordsRes = await db.execute({
        sql: `
          SELECT id, faktur, nama_prd, nama_pelanggan, tgl, qty, created_at 
          FROM orders 
          ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
          ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
          LIMIT ? OFFSET ?
        `,
        args: listSqlParams
      });
      records = recordsRes.rows;

      const totalRes = await db.execute({
        sql: `
          SELECT COUNT(*) as count FROM orders
          ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
        `,
        args: sqlParams
      });
      total = Number((totalRes.rows[0] as any).count);
    }

    const [lastScrapeRes, lastUpdatedRes] = await Promise.all([
      db.execute({ sql: `SELECT value FROM system_settings WHERE key = ?`, args: ['last_scrape_orders'] }),
      db.execute(`SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM orders`)
    ]);

    const lastScrape = lastScrapeRes.rows[0] as any;
    const lastUpdatedRaw = (lastUpdatedRes.rows[0] as any).lastUpdated;
    const lastUpdated = lastScrape ? lastScrape.value : lastUpdatedRaw;

    return NextResponse.json({
      success: true,
      data: records,
      total,
      lastUpdated,
      page,
      limit
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch cached orders", details: error.message },
      { status: 500 }
    );
  }
}
