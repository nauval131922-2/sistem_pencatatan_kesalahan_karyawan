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
    const po = searchParams.get("po") || "";

    let whereClause = "WHERE 1=1";
    let args: any[] = [];

    if (q) {
      whereClause += " AND (faktur LIKE ? OR kd_barang LIKE ? OR faktur_po LIKE ?)";
      args.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (supplier) {
      whereClause += ` AND kd_supplier = ? `;
      args.push(supplier);
    }

    if (po) {
      whereClause += ` AND faktur_po LIKE ? `;
      args.push(`%${po}%`);
    }

    let sql = `
        SELECT faktur, kd_barang, tgl, kd_supplier, faktur_po
        FROM rekap_pembelian_barang
        ${whereClause}
    `;

    sql += `
        ORDER BY 
          substr(TRIM(tgl), 7, 4) DESC, 
          substr(TRIM(tgl), 4, 2) DESC, 
          substr(TRIM(tgl), 1, 2) DESC,
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
