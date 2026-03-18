import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;
    const fromDate = searchParams.get('from') || '';
    const toDate = searchParams.get('to') || '';

    const dateFilterSQL = (fromDate && toDate)
      ? ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2) BETWEEN ? AND ?)`
      : ``;

    console.log(`[API] Fetching bahan-baku: page=${page}, limit=${limit}, search="${search}", from="${fromDate}", to="${toDate}"`);

    let sqlRecords = "";
    let sqlTotal = "";
    let argsRecords: any[] = [];
    let argsTotal: any[] = [];

    if (search) {
      const query = `%${search}%`;
      const baseArgs = [query, query, query, query];
      if (fromDate && toDate) { baseArgs.push(fromDate, toDate); }
      
      sqlRecords = `
        SELECT id, tgl, nama_barang, kd_barang, qty, satuan, hp, nama_prd, faktur, faktur_prd, created_at 
        FROM bahan_baku 
        WHERE (nama_barang LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?) ${dateFilterSQL}
        ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
        LIMIT ? OFFSET ?
      `;
      argsRecords = [...baseArgs, limit, offset];

      sqlTotal = `
        SELECT COUNT(*) as count FROM bahan_baku 
        WHERE (nama_barang LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?) ${dateFilterSQL}
      `;
      argsTotal = baseArgs;
    } else {
      const baseArgs = [];
      if (fromDate && toDate) { baseArgs.push(fromDate, toDate); }

      sqlRecords = `
        SELECT id, tgl, nama_barang, kd_barang, qty, satuan, hp, nama_prd, faktur, faktur_prd, created_at 
        FROM bahan_baku 
        ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
        ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
        LIMIT ? OFFSET ?
      `;
      argsRecords = [...baseArgs, limit, offset];

      sqlTotal = `
        SELECT COUNT(*) as count FROM bahan_baku
        ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
      `;
      argsTotal = baseArgs;
    }

    // Execute everything in ONE round-trip
    const batchResults = await db.batch([
      { sql: sqlRecords, args: argsRecords },
      { sql: sqlTotal, args: argsTotal },
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_bahan_baku'`, args: [] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM bahan_baku`, args: [] }
    ], "read");

    const records = batchResults[0].rows;
    const total = Number((batchResults[1].rows[0] as any).count);
    const lastScrape = batchResults[2].rows[0] as any;
    const lastUpdatedRaw = (batchResults[3].rows[0] as any).lastUpdated;
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
    console.error("Fetch bahan-baku error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cached bahan_baku", details: error.message },
      { status: 500 }
    );
  }
}
