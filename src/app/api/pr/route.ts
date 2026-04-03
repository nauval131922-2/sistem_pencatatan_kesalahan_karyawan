import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getScrapedPeriodSettingKey, parseScrapedPeriod } from "@/lib/server-scraped-period";

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

    const orderBy = `ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC`;

    const [totalRes, dataRes, lastScrapeRes, scrapedPeriodRes, lastUpdatedRawRes] = await db.batch([
      { sql: `SELECT COUNT(*) as count FROM purchase_requests ${whereClause}`, args },
      { sql: `SELECT * FROM purchase_requests ${whereClause} ${orderBy} LIMIT ? OFFSET ?`, args: [...args, pageSize, offset] },
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_pr'`, args: [] },
      { sql: `SELECT value FROM system_settings WHERE key = ?`, args: [getScrapedPeriodSettingKey('last_scrape_pr')] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM purchase_requests`, args: [] }
    ], "read");

    const lastScrape = lastScrapeRes.rows[0] as any;
    const lastUpdatedRaw = (lastUpdatedRawRes.rows[0] as any)?.lastUpdated;
    const lastUpdated = lastScrape?.value || lastUpdatedRaw;

    return NextResponse.json({
      success: true,
      data: dataRes.rows,
      total: Number(totalRes.rows[0].count),
      lastUpdated,
      scrapedPeriod: parseScrapedPeriod((scrapedPeriodRes.rows[0] as any)?.value)
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
