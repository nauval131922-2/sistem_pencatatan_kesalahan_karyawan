import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError } from "@/lib/api-utils";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const fromDate = searchParams.get('from') || '';
    const toDate = searchParams.get('to') || '';
    const offset = (page - 1) * limit;

    const dateFilterSQL = (fromDate && toDate)
      ? ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2) BETWEEN ? AND ?)`
      : ``;

    let sqlWhere = " WHERE 1=1 ";
    let args: any[] = [];

    if (search) {
      const query = `%${search}%`;
      sqlWhere += ` AND (faktur LIKE ? OR kd_pelanggan LIKE ? OR barang LIKE ?) `;
      args.push(query, query, query);
    }

    if (fromDate && toDate) {
      sqlWhere += dateFilterSQL;
      args.push(fromDate, toDate);
    }

    const sqlRecords = `
      SELECT id, faktur, tgl, kd_pelanggan, barang, total, status, faktur_so, created_at
      FROM sph_out
      ${sqlWhere}
      ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC
      LIMIT ? OFFSET ?
    `;

    const sqlTotal = `
      SELECT COUNT(*) as count FROM sph_out
      ${sqlWhere}
    `;

    const [recordsRes, totalRes, settingsRes] = await db.batch([
      { sql: sqlRecords, args: [...args, limit, offset] },
      { sql: sqlTotal, args: args },
      { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_sph_out'`, args: [] }
    ], "read");

    return NextResponse.json({
      success: true,
      data: recordsRes.rows,
      total: Number(totalRes.rows[0].count),
      lastUpdated: settingsRes.rows[0]?.value || null,
      page,
      limit
    });

  } catch (error: any) {
    console.error("Fetch SPH Out error:", error);
    return apiError("Failed to fetch SPH Out", 500, { details: error.message });
  }
}
