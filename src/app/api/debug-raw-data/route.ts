import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

const TABLE_MAP: Record<string, string> = {
  bom: 'bill_of_materials',
  sph_out: 'sph_out',
  sph_in: 'sph_in',
  spph_out: 'spph_out',
  purchase_orders: 'purchase_orders',
  sales_orders: 'sales_orders',
  orders: 'orders',
  purchase_requests: 'purchase_requests',
  pengiriman: 'pengiriman',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get("table") || "bom";
    const faktur = searchParams.get("faktur");

    if (!faktur) {
      return NextResponse.json({ error: "Parameter 'faktur' wajib diisi" }, { status: 400 });
    }

    const tableName = TABLE_MAP[table];
    if (!tableName) {
      return NextResponse.json({ 
        error: `Table '${table}' tidak valid. Available: ${Object.keys(TABLE_MAP).join(', ')}` 
      }, { status: 400 });
    }

    const res = await db.execute({
      sql: `SELECT raw_data FROM ${tableName} WHERE faktur = ?`,
      args: [faktur]
    });

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    const rawData = res.rows[0].raw_data as string | null;
    let parsed = {};
    
    if (!rawData) {
      parsed = { error: "raw_data is null" };
    } else {
      try {
        parsed = JSON.parse(rawData);
      } catch (e) {
        parsed = { error: "Gagal parse JSON", raw: rawData };
      }
    }

    return NextResponse.json({
      success: true,
      table: tableName,
      faktur,
      raw_data: parsed,
      keys: Object.keys(parsed)
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
