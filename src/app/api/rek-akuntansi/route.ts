import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('q') || '';
    
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];
    
    if (search) {
      whereClause = `WHERE kode LIKE ? OR keterangan LIKE ? OR jenis LIKE ? OR arus_kas LIKE ?`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const [dataResult, countResult, settingsResult] = await Promise.all([
      db.execute({
        sql: `SELECT * FROM rek_akuntansi ${whereClause} ORDER BY kode ASC LIMIT ? OFFSET ?`,
        args: [...params, limit, offset]
      }),
      db.execute({
        sql: `SELECT COUNT(*) as total FROM rek_akuntansi ${whereClause}`,
        args: params
      }),
      db.execute("SELECT value FROM system_settings WHERE key = 'last_scrape_rek_akuntansi'")
    ]);

    const total = (countResult.rows[0] as any)?.total || 0;
    const lastUpdated = (settingsResult.rows[0] as any)?.value || null;

    return NextResponse.json({
      success: true,
      data: dataResult.rows,
      total,
      lastUpdated,
      page,
      limit
    });

  } catch (error: any) {
    console.error("API Error (rek-akuntansi):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
