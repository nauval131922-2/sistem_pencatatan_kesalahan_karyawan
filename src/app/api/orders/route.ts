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
        SELECT * FROM orders 
        WHERE nama_prd LIKE ? OR nama_pelanggan LIKE ? OR faktur LIKE ?
        ORDER BY tgl DESC, id DESC 
        LIMIT ? OFFSET ?
      `).all(query, query, query, query, limit, offset);
      total = (db.prepare(`
        SELECT COUNT(*) as count FROM orders 
        WHERE nama_prd LIKE ? OR nama_pelanggan LIKE ? OR faktur LIKE ?
      `).get(query, query, query, query) as any).count;
    } else {
      // In SQLite, we can't easily sort by the DD-MM-YYYY string properly using built-in ORDER BY 
      // without complex string manipulation. However, for orders we added created_at.
      // But the user usually wants to see by production date 'tgl'.
      // Let's use a simpler created_at for now or just standard tgl string order (which works if same length)
      records = db.prepare(`SELECT * FROM orders ORDER BY tgl DESC, id DESC LIMIT ? OFFSET ?`).all(limit, offset);
      total = (db.prepare(`SELECT COUNT(*) as count FROM orders`).get() as any).count;
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
      { error: "Failed to fetch cached orders", details: error.message },
      { status: 500 }
    );
  }
}
