import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderName = searchParams.get('order_name');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let data;
    let total;

    if (orderName) {
      data = db.prepare('SELECT * FROM sales_reports WHERE nama_prd = ? ORDER BY tgl DESC LIMIT 1').all(orderName);
      total = data.length;
    } else if (search) {
      const query = `%${search}%`;
      data = db.prepare(`
        SELECT * FROM sales_reports 
        WHERE nama_prd LIKE ? OR nama_pelanggan LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?
        ORDER BY tgl DESC, id DESC 
        LIMIT ? OFFSET ?
      `).all(query, query, query, query, limit, offset);
      total = (db.prepare(`
        SELECT COUNT(*) as count FROM sales_reports 
        WHERE nama_prd LIKE ? OR nama_pelanggan LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?
      `).get(query, query, query, query) as any).count;
    } else {
      data = db.prepare('SELECT * FROM sales_reports ORDER BY tgl DESC, id DESC LIMIT ? OFFSET ?').all(limit, offset);
      total = (db.prepare('SELECT COUNT(*) as count FROM sales_reports').get() as any).count;
    }
    
    return NextResponse.json({ success: true, data, total, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
