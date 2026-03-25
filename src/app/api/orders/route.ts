import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const fromDate = searchParams.get('from') || '';
    const toDate = searchParams.get('to') || '';
    const offset = (page - 1) * limit;

    const dateFilterSQL = (fromDate && toDate)
      ? ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2) BETWEEN ? AND ?)`
      : ``;

    let records: any[] = [];
    let total = 0;

    if (search) {
      // 1. Try FTS5 First (High Performance)
      const ftsResults = await db.batch([
        {
          sql: `SELECT o.* FROM orders o JOIN orders_fts fts ON o.id = fts.rowid 
                WHERE orders_fts MATCH ? ${dateFilterSQL}
                ORDER BY substr(o.tgl, 7, 4) DESC, substr(o.tgl, 4, 2) DESC, substr(o.tgl, 1, 2) DESC, o.id DESC 
                LIMIT ? OFFSET ?`,
          args: [search, ...(fromDate && toDate ? [fromDate, toDate] : []), limit, offset]
        },
        {
          sql: `SELECT COUNT(*) as count FROM orders o JOIN orders_fts fts ON o.id = fts.rowid 
                WHERE orders_fts MATCH ? ${dateFilterSQL}`,
          args: [search, ...(fromDate && toDate ? [fromDate, toDate] : [])]
        }
      ], "read");

      records = ftsResults[0].rows;
      total = Number((ftsResults[1].rows[0] as any).count);

      // 2. Fallback to LIKE if FTS fails (Robustness)
      if (total === 0) {
        const query = `%${search}%`;
        const likeArgs = [query, query, query, query];
        if (fromDate && toDate) { likeArgs.push(fromDate, toDate); }

        const likeResults = await db.batch([
          {
            sql: `SELECT * FROM orders 
                  WHERE (CAST(id AS TEXT) LIKE ? OR faktur LIKE ? OR nama_prd LIKE ? OR nama_pelanggan LIKE ?) ${dateFilterSQL}
                  ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
                  LIMIT ? OFFSET ?`,
            args: [...likeArgs, limit, offset]
          },
          {
            sql: `SELECT COUNT(*) as count FROM orders 
                  WHERE (CAST(id AS TEXT) LIKE ? OR faktur LIKE ? OR nama_prd LIKE ? OR nama_pelanggan LIKE ?) ${dateFilterSQL}`,
            args: likeArgs
          }
        ], "read");

        records = likeResults[0].rows;
        total = Number((likeResults[1].rows[0] as any).count);
      }
    } else {
      // Regular Fetch (No Search)
      const baseArgs = [];
      if (fromDate && toDate) { baseArgs.push(fromDate, toDate); }

      const standardResults = await db.batch([
        {
          sql: `SELECT * FROM orders 
                ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
                ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
                LIMIT ? OFFSET ?`,
          args: [...baseArgs, limit, offset]
        },
        {
          sql: `SELECT COUNT(*) as count FROM orders
                ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}`,
          args: baseArgs
        }
      ], "read");

      records = standardResults[0].rows;
      total = Number((standardResults[1].rows[0] as any).count);
    }

    // Execute metadata queries
    const metadataResults = await db.batch([
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_orders'`, args: [] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM orders`, args: [] }
    ], "read");

    const lastScrape = metadataResults[0].rows[0] as any;
    const lastUpdatedRaw = (metadataResults[1].rows[0] as any).lastUpdated;
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
    console.error("Fetch orders error:", error);
    return apiError("Failed to fetch orders", 500, { details: error.message });
  }
}