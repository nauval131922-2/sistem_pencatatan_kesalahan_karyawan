import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import * as xlsx from "xlsx";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderName = searchParams.get('order_name');

    let data;
    if (orderName) {
      const result = await db.execute({
        sql: `SELECT * FROM hpp_kalkulasi WHERE TRIM(nama_order) = ? ORDER BY id ASC`,
        args: [orderName.trim()]
      });
      data = result.rows;
    } else {
      const result = await db.execute(`SELECT * FROM hpp_kalkulasi ORDER BY id ASC`);
      data = result.rows;
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Gagal mengambil data HPP Kalkulasi", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File Excel tidak ditemukan" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel workbook
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON array
    const rawData: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

    if (rawData.length === 0) {
       return NextResponse.json({ error: "File Excel kosong atau format tidak sesuai." }, { status: 400 });
    }

    // Prepare batch operations
    const batchOps: any[] = [
      { sql: 'DELETE FROM hpp_kalkulasi', args: [] }
    ];

    let importedCount = 0;
    for (const row of rawData) {
      let namaOrder = '';
      let hppValue = 0;

      for (const key of Object.keys(row)) {
        const lowerKey = key.toLowerCase().trim();
        if (lowerKey.includes('nama order')) {
          namaOrder = String(row[key] || '').trim();
        } else if (lowerKey.includes('hpp kalkulasi')) {
          let val = row[key];
          if (typeof val === 'string') {
            val = val.replace(/[^0-9,-]+/g, "").replace(',', '.');
          }
          hppValue = parseFloat(val) || 0;
        }
      }

      if (!namaOrder || hppValue <= 0) continue;

      batchOps.push({
        sql: `INSERT INTO hpp_kalkulasi (nama_order, hpp_kalkulasi) VALUES (?, ?)`,
        args: [namaOrder, hppValue]
      });
      importedCount++;
    }

    // Execute batch
    await db.batch(batchOps, "write");

    const session = await getSession();



    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${importedCount} data HPP Kalkulasi.`,
      imported: importedCount
    });

  } catch (error: any) {
    console.error("Upload Excel Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses file Excel", details: error.message },
      { status: 500 }
    );
  }
}
