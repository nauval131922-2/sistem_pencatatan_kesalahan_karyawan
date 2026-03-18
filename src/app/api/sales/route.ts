import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { logActivity } from "@/lib/activity";


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

    const dateFilterSQL = (fromDate && toDate) 
      ? ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2) BETWEEN ? AND ?)`
      : ``;

    let sqlData = "";
    let sqlTotal = "";
    let argsData: any[] = [];
    let argsTotal: any[] = [];

    if (orderName) {
      sqlData = "SELECT id, tgl, kd_barang, nama_prd, nama_pelanggan, dati_2, qty, harga, jumlah, faktur, created_at FROM sales_reports WHERE nama_prd = ? ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC LIMIT 1";
      argsData = [orderName];
      sqlTotal = "SELECT COUNT(*) as count FROM sales_reports WHERE nama_prd = ?";
      argsTotal = [orderName];
    } else if (search) {
      const query = `%${search}%`;
      const baseArgs = [query, query, query, query];
      if (fromDate && toDate) { baseArgs.push(fromDate, toDate); }
      
      sqlData = `
        SELECT id, tgl, kd_barang, nama_prd, nama_pelanggan, dati_2, qty, harga, jumlah, faktur, created_at 
        FROM sales_reports 
        WHERE (nama_prd LIKE ? OR nama_pelanggan LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?) ${dateFilterSQL}
        ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
        LIMIT ? OFFSET ?
      `;
      argsData = [...baseArgs, limit, offset];

      sqlTotal = `
        SELECT COUNT(*) as count FROM sales_reports 
        WHERE (nama_prd LIKE ? OR nama_pelanggan LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?) ${dateFilterSQL}
      `;
      argsTotal = baseArgs;
    } else {
      const baseArgs: any[] = [];
      if (fromDate && toDate) { baseArgs.push(fromDate, toDate); }

      sqlData = `
        SELECT id, tgl, kd_barang, nama_prd, nama_pelanggan, dati_2, qty, harga, jumlah, faktur, created_at 
        FROM sales_reports 
        ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
        ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
        LIMIT ? OFFSET ?
      `;
      argsData = [...baseArgs, limit, offset];

      sqlTotal = `
        SELECT COUNT(*) as count FROM sales_reports
        ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
      `;
      argsTotal = baseArgs;
    }

    // Execute everything in ONE round-trip
    const batchResults = await db.batch([
      { sql: sqlData, args: argsData },
      { sql: sqlTotal, args: argsTotal },
      { sql: "SELECT value FROM system_settings WHERE key = 'last_scrape_sales'", args: [] },
      { sql: "SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM sales_reports", args: [] }
    ], "read");

    const data = batchResults[0].rows;
    const total = Number((batchResults[1].rows[0] as any).count);
    const lastScrape = batchResults[2].rows[0] as any;
    const lastUpdatedRaw = (batchResults[3].rows[0] as any).lastUpdated;
    const lastUpdated = lastScrape ? lastScrape.value : lastUpdatedRaw;

    return NextResponse.json({ success: true, data, total, lastUpdated, page, limit });



  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
