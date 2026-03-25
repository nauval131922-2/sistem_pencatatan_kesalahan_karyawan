import { NextResponse } from "next/server";
import db from "@/lib/db";
import { logActivity } from "@/lib/activity";


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

    let records: any[] = [];
    let total = 0;

    if (search) {
      // 1. Try FTS5 First (High Performance)
      const ftsResults = await db.batch([
        {
          sql: `SELECT bj.* FROM barang_jadi bj JOIN barang_jadi_fts fts ON bj.id = fts.rowid 
                WHERE barang_jadi_fts MATCH ? ${dateFilterSQL}
                ORDER BY substr(bj.tgl, 7, 4) DESC, substr(bj.tgl, 4, 2) DESC, substr(bj.tgl, 1, 2) DESC, bj.id DESC 
                LIMIT ? OFFSET ?`,
          args: [search, ...(fromDate && toDate ? [fromDate, toDate] : []), limit, offset]
        },
        {
          sql: `SELECT COUNT(*) as count FROM barang_jadi bj JOIN barang_jadi_fts fts ON bj.id = fts.rowid 
                WHERE barang_jadi_fts MATCH ? ${dateFilterSQL}`,
          args: [search, ...(fromDate && toDate ? [fromDate, toDate] : [])]
        }
      ], "read");

      records = ftsResults[0].rows;
      total = Number((ftsResults[1].rows[0] as any).count);

      // 2. Fallback to LIKE if FTS fails (Robustness)
      if (total === 0) {
        const query = `%${search}%`;
        const likeArgs = Array(7).fill(query);
        if (fromDate && toDate) { likeArgs.push(fromDate, toDate); }

        const likeResults = await db.batch([
          {
            sql: `SELECT * FROM barang_jadi 
                  WHERE (CAST(id AS TEXT) LIKE ? OR nama_barang LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ? OR faktur LIKE ? OR faktur_prd LIKE ? OR satuan LIKE ?) ${dateFilterSQL}
                  ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
                  LIMIT ? OFFSET ?`,
            args: [...likeArgs, limit, offset]
          },
          {
            sql: `SELECT COUNT(*) as count FROM barang_jadi 
                  WHERE (CAST(id AS TEXT) LIKE ? OR nama_barang LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ? OR faktur LIKE ? OR faktur_prd LIKE ? OR satuan LIKE ?) ${dateFilterSQL}`,
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
          sql: `SELECT * FROM barang_jadi 
                ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}
                ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
                LIMIT ? OFFSET ?`,
          args: [...baseArgs, limit, offset]
        },
        {
          sql: `SELECT COUNT(*) as count FROM barang_jadi
                ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}`,
          args: baseArgs
        }
      ], "read");

      records = standardResults[0].rows;
      total = Number((standardResults[1].rows[0] as any).count);
    }

    // Execute metadata queries separately for clarity
    const metadataResults = await db.batch([
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_barang_jadi'`, args: [] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM barang_jadi`, args: [] }
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
    console.error("Fetch barang-jadi error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cached barang_jadi", details: error.message },
      { status: 500 }
    );
  }
}
