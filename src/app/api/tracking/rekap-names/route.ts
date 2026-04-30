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
    const supplier = searchParams.get("supplier") || "";

    let sql = `
        SELECT faktur, kd_barang, tgl, kd_supplier
        FROM rekap_pembelian_barang
        WHERE (faktur LIKE ? OR kd_barang LIKE ?)
    `;
    let args: any[] = [`%${q}%`, `%${q}%`];

    if (supplier) {
      sql += ` AND kd_supplier = ? `;
      args.push(supplier);
    }

    sql += `
        ORDER BY 
          substr(tgl, 7, 4) DESC, 
          substr(tgl, 4, 2) DESC, 
          substr(tgl, 1, 2) DESC,
          faktur DESC
        LIMIT ? OFFSET ?
    `;
    args.push(pageSize, offset);

    const res = await db.execute({ sql, args });

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
