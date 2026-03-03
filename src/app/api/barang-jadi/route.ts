import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let records;
    let total;

    if (search) {
      const query = `%${search}%`;
      records = db.prepare(`
        SELECT * FROM barang_jadi 
        WHERE nama_barang LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?
        ORDER BY tgl DESC, id DESC 
        LIMIT ? OFFSET ?
      `).all(query, query, query, query, limit, offset);
      total = (db.prepare(`
        SELECT COUNT(*) as count FROM barang_jadi 
        WHERE nama_barang LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?
      `).get(query, query, query, query) as any).count;
    } else {
      records = db.prepare(`SELECT * FROM barang_jadi ORDER BY tgl DESC, id DESC LIMIT ? OFFSET ?`).all(limit, offset);
      total = (db.prepare(`SELECT COUNT(*) as count FROM barang_jadi`).get() as any).count;
    }

    return NextResponse.json({
      success: true,
      data: records,
      total,
      page,
      limit
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch cached barang_jadi", details: error.message },
      { status: 500 }
    );
  }
}
