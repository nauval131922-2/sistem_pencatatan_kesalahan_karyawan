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

    const res = await db.execute({
      sql: `
        SELECT faktur, nama_prd, tgl, kd_pelanggan
        FROM bill_of_materials
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
