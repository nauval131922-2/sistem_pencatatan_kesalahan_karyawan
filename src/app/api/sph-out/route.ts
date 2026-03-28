import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError } from "@/lib/api-utils";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('q') || '';
    const fromDate = searchParams.get('from') || searchParams.get('start') || '';
    const toDate = searchParams.get('to') || searchParams.get('end') || '';
    const offset = (page - 1) * limit;

    const dateFilterSQL = (fromDate && toDate)
      ? ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2) BETWEEN ? AND ?)`
      : ``;

    let records: any[] = [];
    let total = 0;

    if (search) {
      const finalized = search.endsWith('.') || search.endsWith(' ');
      const tokens = search.replace(/[^\w\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
      
      // Better precision: Use Phrase-Prefix for multi-token inputs
      const ftsQuery = finalized 
        ? `"${tokens.join(' ')}"` 
        : tokens.length > 1 
          ? `"${tokens.join(' ')}"*` 
          : `${tokens[0]}*`;
      
      const ftsResults = await db.batch([
        {
          sql: `SELECT s.* FROM sph_out s JOIN sph_out_fts fts ON s.id = fts.rowid 
                WHERE sph_out_fts MATCH ? ${dateFilterSQL}
                ORDER BY substr(s.tgl, 7, 4) DESC, substr(s.tgl, 4, 2) DESC, substr(s.tgl, 1, 2) DESC, s.id DESC 
                LIMIT ? OFFSET ?`,
          args: [ftsQuery, ...(fromDate && toDate ? [fromDate, toDate] : []), limit, offset]
        },
        {
          sql: `SELECT COUNT(*) as count FROM sph_out s JOIN sph_out_fts fts ON s.id = fts.rowid 
                WHERE sph_out_fts MATCH ? ${dateFilterSQL}`,
          args: [ftsQuery, ...(fromDate && toDate ? [fromDate, toDate] : [])]
        }
      ], "read");
 
      records = ftsResults[0].rows as any[];
      total = Number((ftsResults[1].rows[0] as any).count);
 
      // 2. Fallback to LIKE if FTS fails
      if (total === 0) {
        const query = `%${search}%`;
        const likeArgs = [query, query, query, query];
        if (fromDate && toDate) { likeArgs.push(fromDate, toDate); }
 
        const likeResults = await db.batch([
          {
            sql: `SELECT * FROM sph_out 
                  WHERE (faktur LIKE ? OR kd_pelanggan LIKE ? OR barang LIKE ? OR raw_data LIKE ?) ${dateFilterSQL}
                  ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
                  LIMIT ? OFFSET ?`,
            args: [...likeArgs, limit, offset]
          },
          {
            sql: `SELECT COUNT(*) as count FROM sph_out 
                  WHERE (faktur LIKE ? OR kd_pelanggan LIKE ? OR barang LIKE ? OR raw_data LIKE ?) ${dateFilterSQL}`,
            args: likeArgs
          }
        ], "read");
 
        records = likeResults[0].rows as any[];
        total = Number((likeResults[1].rows[0] as any).count);
      }
    } else {
      // Regular Fetch (No Search)
      const baseArgs = [];
      if (fromDate && toDate) { baseArgs.push(fromDate, toDate); }

      const standardResults = await db.batch([
        {
          sql: `SELECT * FROM sph_out 
                WHERE 1=1 ${dateFilterSQL}
                ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
                LIMIT ? OFFSET ?`,
          args: [...baseArgs, limit, offset]
        },
        {
          sql: `SELECT COUNT(*) as count FROM sph_out
                WHERE 1=1 ${dateFilterSQL}`,
          args: baseArgs
        }
      ], "read");

      records = standardResults[0].rows as any[];
      total = Number((standardResults[1].rows[0] as any).count);
    }

    const metadataResults = await db.batch([
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_sph_out'`, args: [] },
      { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM sph_out`, args: [] }
    ], "read");

    const lastScrape = metadataResults[0].rows[0] as any;
    const lastUpdatedRaw = (metadataResults[1].rows[0] as any)?.lastUpdated;
    const lastUpdated = lastScrape?.value || lastUpdatedRaw;

    return NextResponse.json({
      success: true,
      data: records,
      total,
      lastUpdated,
      page,
      limit
    });

  } catch (error: any) {
    console.error("Fetch SPH Out error:", error);
    return apiError("Failed to fetch SPH Out", 500, { details: error.message });
  }
}
