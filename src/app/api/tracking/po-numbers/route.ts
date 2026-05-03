import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const supplier = searchParams.get("supplier") || "";

    let whereClause = "WHERE (faktur LIKE ? OR ket_pr LIKE ?) AND faktur IS NOT NULL AND faktur != ''";
    const args = [`%${q}%`, `%${q}%`];

    if (supplier) {
      whereClause += " AND kd_supplier = ?";
      args.push(supplier);
    }

    const res = await db.execute({
      sql: `
        SELECT faktur, tgl, ket_pr
        FROM purchase_orders
        ${whereClause}
        GROUP BY faktur
        ORDER BY 
          substr(TRIM(tgl), 7, 4) DESC, 
          substr(TRIM(tgl), 4, 2) DESC, 
          substr(TRIM(tgl), 1, 2) DESC,
          faktur DESC
        LIMIT 100
      `,
      args: args
    });

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
