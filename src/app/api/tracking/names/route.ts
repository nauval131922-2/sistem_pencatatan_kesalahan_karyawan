import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const offset = (page - 1) * pageSize;

    // Search from 'orders' table (which stores Order Produksi)
    // and link it back to BOM if possible, but the user wants to pick the 'Nama Order'
    // in the suggestions. We will return the 'faktur' and 'nama_prd' from orders table.
    
    const res = await db.execute({
      sql: `
        SELECT faktur, nama_prd, tgl, nama_pelanggan as kd_pelanggan
        FROM orders
        WHERE faktur LIKE ? OR nama_prd LIKE ?
        ORDER BY 
          substr(tgl, 7, 4) DESC, 
          substr(tgl, 4, 2) DESC, 
          substr(tgl, 1, 2) DESC,
          faktur DESC
        LIMIT ? OFFSET ?
      `,
      args: [`%${q}%`, `%${q}%`, pageSize, offset]
    });

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
