import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") || "";

    const res = await db.execute({
      sql: `
        SELECT DISTINCT kd_supplier as supplier 
        FROM rekap_pembelian_barang 
        WHERE kd_supplier LIKE ? AND kd_supplier IS NOT NULL AND kd_supplier != ''
        ORDER BY kd_supplier ASC
        LIMIT 50
      `,
      args: [`%${q}%`]
    });

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
