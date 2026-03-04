import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;
    const fromDate = searchParams.get('from') || '';
    const toDate = searchParams.get('to') || '';
    console.log(`[API] Fetching bahan-baku: page=${page}, limit=${limit}, search="${search}", from="${fromDate}", to="${toDate}"`);

    let records;
    let total;

    const dateFilterSQL = (fromDate && toDate) 
      ? ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2) BETWEEN ? AND ?)`
      : ``;

    if (search) {
      const query = `%${search}%`;
      const sqlParams: any[] = [query, query, query, query];
      if (fromDate && toDate) { sqlParams.push(fromDate, toDate); }
      sqlParams.push(limit, offset);

      records = db.prepare(`
        SELECT id, tgl, nama_barang, kd_barang, qty, satuan, hp, nama_prd, faktur, faktur_prd, created_at 
        FROM bahan_baku 
        WHERE (nama_barang LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?) ${dateFilterSQL}
        ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
        LIMIT ? OFFSET ?
      `).all(...sqlParams);

      const totalSqlParams = [query, query, query, query];
      if (fromDate && toDate) { totalSqlParams.push(fromDate, toDate); }

      total = ((db.prepare(`
        SELECT COUNT(*) as count FROM bahan_baku 
        WHERE (nama_barang LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?) ${dateFilterSQL}
      `).get(...totalSqlParams)) as any).count;
    } else {
      const sqlParams: any[] = [];
      if (fromDate && toDate) { sqlParams.push(fromDate, toDate); }
      sqlParams.push(limit, offset);

      records = db.prepare(`
        SELECT id, tgl, nama_barang, kd_barang, qty, satuan, hp, nama_prd, faktur, faktur_prd, created_at 
        FROM bahan_baku 
        ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
        ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
        LIMIT ? OFFSET ?
      `).all(...sqlParams);
      console.log(`[API] Default branch returned ${records.length} records`);

      const totalSqlParams = [];
      if (fromDate && toDate) { totalSqlParams.push(fromDate, toDate); }

      total = ((db.prepare(`
        SELECT COUNT(*) as count FROM bahan_baku
        ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
      `).get(...totalSqlParams)) as any).count;
    }

    const lastScrape = (db.prepare(`SELECT value FROM system_settings WHERE key = ?`).get('last_scrape_bahan_baku') as any);
    const lastUpdatedRaw = (db.prepare(`SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM bahan_baku`).get() as any).lastUpdated;
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
      { error: "Failed to fetch cached bahan_baku", details: error.message },
      { status: 500 }
    );
  }
}
