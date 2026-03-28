import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
     const res = await db.execute(`
        SELECT bom.faktur as bom_faktur, COUNT(sph.faktur) as sph_count, GROUP_CONCAT(sph.faktur) as sph_list
        FROM bill_of_materials bom
        JOIN sph_out sph ON (sph.barang LIKE '%' || bom.faktur || '%' OR sph.raw_data LIKE '%' || bom.faktur || '%')
        GROUP BY bom.faktur
        HAVING sph_count > 1
     `);
     return NextResponse.json({ success: true, count: res.rows.length, rows: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
