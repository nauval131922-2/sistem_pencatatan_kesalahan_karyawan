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

    const offset = (page - 1) * pageSize;

    let whereClause = "WHERE 1=1";
    const args: any[] = [];

    if (query) {
      whereClause += ` AND (faktur LIKE ? OR keterangan LIKE ? OR faktur_prd LIKE ?)`;
      args.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (startDate && endDate) {
      whereClause += ` AND (
        substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2) 
        BETWEEN ? AND ?
      )`;
      args.push(startDate, endDate);
    }

    // 1. Get total count
    const totalRes = await db.execute({
      sql: `SELECT COUNT(*) as count FROM purchase_requests ${whereClause}`,
      args
    });
    const total = Number(totalRes.rows[0].count);

    // 2. Get data with default sorting (tgl desc, id desc)
    // Client-side will handle further sorting
    const orderBy = `ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC`;

    const dataRes = await db.execute({
      sql: `SELECT * FROM purchase_requests ${whereClause} ${orderBy} LIMIT ? OFFSET ?`,
      args: [...args, pageSize, offset]
    });

    // 3. Get last updated time from system_settings
    const settingsRes = await db.execute({
      sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_pr'`,
      args: []
    });
    const lastUpdated = settingsRes.rows[0]?.value || null;

    return NextResponse.json({
      success: true,
      data: dataRes.rows,
      total,
      lastUpdated
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
