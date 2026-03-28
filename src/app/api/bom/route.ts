import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const query = searchParams.get("q") || "";
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const sortKey = searchParams.get("sort") || "tgl";
    const sortOrder = searchParams.get("order") || "desc";

    const offset = (page - 1) * pageSize;

    let whereClause = "WHERE 1=1";
    const args: any[] = [];

    if (query) {
      whereClause += ` AND (faktur LIKE ? OR nama_prd LIKE ? OR kd_pelanggan LIKE ?)`;
      args.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (startDate && endDate) {
      // Date format in DB is DD-MM-YYYY, but we receive YYYY-MM-DD
      // Convert current selection to match DB format for simple filtering if needed
      // or use SQLite date functions if we store as YYYY-MM-DD. 
      // Based on previous modules, we store as DD-MM-YYYY but we can use string manipulation
      
      whereClause += ` AND (
        substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2) 
        BETWEEN ? AND ?
      )`;
      args.push(startDate, endDate);
    }

    let orderBy = `ORDER BY ${sortKey} ${sortOrder}`;
    if (sortKey === 'tgl') {
        orderBy = `ORDER BY substr(tgl, 7, 4) ${sortOrder}, substr(tgl, 4, 2) ${sortOrder}, substr(tgl, 1, 2) ${sortOrder}`;
    }

    const [totalRes, dataRes, lastScrapeRes, lastUpdatedRawRes] = await db.batch([
      { sql: `SELECT COUNT(*) as count FROM bill_of_materials ${whereClause}`, args },
      { sql: `SELECT * FROM bill_of_materials ${whereClause} ${orderBy} LIMIT ? OFFSET ?`, args: [...args, pageSize, offset] },
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_bom'`, args: [] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM bill_of_materials`, args: [] }
    ], "read");

    console.log("DEBUG BOM RAW:", (dataRes.rows[0] as any)?.raw_data);
    const lastScrape = lastScrapeRes.rows[0] as any;
    const lastUpdatedRaw = (lastUpdatedRawRes.rows[0] as any)?.lastUpdated;
    const lastUpdated = lastScrape?.value || lastUpdatedRaw;

    return NextResponse.json({
      success: true,
      data: dataRes.rows,
      total: Number(totalRes.rows[0].count),
      lastUpdated
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
