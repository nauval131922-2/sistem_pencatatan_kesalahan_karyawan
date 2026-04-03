import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const faktur = searchParams.get("faktur");

    if (!faktur) {
      return NextResponse.json({ error: "Parameter 'faktur' wajib diisi" }, { status: 400 });
    }

    const res = await db.execute({
      sql: `SELECT raw_data FROM bill_of_materials WHERE faktur = ?`,
      args: [faktur]
    });

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    const rawData = res.rows[0].raw_data;
    let parsed = {};
    
    try {
      parsed = JSON.parse(rawData);
    } catch (e) {
      parsed = { error: "Gagal parse JSON", raw: rawData };
    }

    return NextResponse.json({
      success: true,
      faktur,
      raw_data: parsed,
      keys: Object.keys(parsed)
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
