import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderName = searchParams.get('order_name');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;
    const fromDate = searchParams.get('from') || '';
    const toDate = searchParams.get('to') || '';

    let data;
    let total = 0;

    const dateFilterSQL = (fromDate && toDate) 
      ? ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2) BETWEEN ? AND ?)`
      : ``;

    if (orderName) {
      const result = await db.execute({
        sql: "SELECT id, tgl, kd_barang, nama_prd, nama_pelanggan, dati_2, qty, harga, jumlah, faktur, created_at FROM sales_reports WHERE nama_prd = ? ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC LIMIT 1",
        args: [orderName]
      });
      data = result.rows;
      total = data.length;
    } else if (search) {
      const query = `%${search}%`;
      const sqlParams: any[] = [query, query, query, query];
      if (fromDate && toDate) { sqlParams.push(fromDate, toDate); }
      const searchSqlParams = [...sqlParams, limit, offset];

      const result = await db.execute({
        sql: `
          SELECT id, tgl, kd_barang, nama_prd, nama_pelanggan, dati_2, qty, harga, jumlah, faktur, created_at 
          FROM sales_reports 
          WHERE (nama_prd LIKE ? OR nama_pelanggan LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?) ${dateFilterSQL}
          ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
          LIMIT ? OFFSET ?
        `,
        args: searchSqlParams
      });
      data = result.rows;

      const totalRes = await db.execute({
        sql: `
          SELECT COUNT(*) as count FROM sales_reports 
          WHERE (nama_prd LIKE ? OR nama_pelanggan LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?) ${dateFilterSQL}
        `,
        args: sqlParams
      });
      total = Number((totalRes.rows[0] as any).count);
    } else {
      const sqlParams: any[] = [];
      if (fromDate && toDate) { sqlParams.push(fromDate, toDate); }
      const listSqlParams = [...sqlParams, limit, offset];

      const result = await db.execute({
        sql: `
          SELECT id, tgl, kd_barang, nama_prd, nama_pelanggan, dati_2, qty, harga, jumlah, faktur, created_at 
          FROM sales_reports 
          ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
          ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
          LIMIT ? OFFSET ?
        `,
        args: listSqlParams
      });
      data = result.rows;

      const totalRes = await db.execute({
        sql: `
          SELECT COUNT(*) as count FROM sales_reports
          ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
        `,
        args: sqlParams
      });
      total = Number((totalRes.rows[0] as any).count);
    }
    
    const [lastScrapeRes, lastUpdatedRes] = await Promise.all([
      db.execute({ sql: 'SELECT value FROM system_settings WHERE key = ?', args: ['last_scrape_sales'] }),
      db.execute("SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM sales_reports")
    ]);

    const lastScrape = lastScrapeRes.rows[0] as any;
    const lastUpdatedRaw = (lastUpdatedRes.rows[0] as any).lastUpdated;
    const lastUpdated = lastScrape ? lastScrape.value : lastUpdatedRaw;
    
    return NextResponse.json({ success: true, data, total, lastUpdated, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
