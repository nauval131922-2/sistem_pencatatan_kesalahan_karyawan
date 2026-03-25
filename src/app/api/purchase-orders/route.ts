import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const q = searchParams.get('q') || '';
    const start = searchParams.get('start'); // YYYY-MM-DD
    const end = searchParams.get('end');     // YYYY-MM-DD

    const offset = (page - 1) * pageSize;

    let whereClause = "WHERE 1=1";
    const args: any[] = [];

    if (q) {
      whereClause += " AND (faktur LIKE ? OR kd_supplier LIKE ? OR faktur_pr LIKE ? OR faktur_sph LIKE ?)";
      const searchTag = `%${q}%`;
      args.push(searchTag, searchTag, searchTag, searchTag);
    }

    if (start && end) {
      whereClause += " AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2)) BETWEEN ? AND ?";
      args.push(start, end);
    }

    const dataQuery = `
      SELECT * FROM purchase_orders 
      ${whereClause}
      ORDER BY 
        substr(TRIM(tgl), 7, 4) DESC, 
        substr(TRIM(tgl), 4, 2) DESC, 
        substr(TRIM(tgl), 1, 2) DESC, 
        id DESC
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `SELECT COUNT(*) as count FROM purchase_orders ${whereClause}`;
    
    const [dataRes, countRes] = await Promise.all([
      db.execute({ sql: dataQuery, args: [...args, pageSize, offset] }),
      db.execute({ sql: countQuery, args })
    ]);

    const total = Number((countRes.rows[0] as any).count);
    
    const settingRes = await db.execute({
      sql: "SELECT value FROM system_settings WHERE key = ?",
      args: ['last_scrape_purchase_orders']
    });
    const lastUpdated = (settingRes.rows[0] as any)?.value || null;

    // Convert rows to plain objects to ensure they are properly serialized
    const rows = (dataRes.rows || []).map((r: any) => ({ ...r }));

    return NextResponse.json({
      success: true,
      data: rows,
      total,
      lastUpdated
    });
  } catch (err: any) {
    console.error("[API-PO] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
