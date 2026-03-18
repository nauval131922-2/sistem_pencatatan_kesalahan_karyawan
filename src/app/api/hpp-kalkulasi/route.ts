import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

import { getSession } from "@/lib/session";

import { logActivity } from "@/lib/activity";


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
    const { filename, data: rawData } = await request.json();

    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
       return NextResponse.json({ error: "Data Excel kosong atau format tidak sesuai." }, { status: 400 });
    }


    // Prepare batch operations
    const batchOps: any[] = [
      { sql: 'DELETE FROM hpp_kalkulasi', args: [] }
    ];

    let importedCount = 0;
    for (const row of rawData) {
      let namaOrder = '';
      let hppValue = 0;
      let keterangan = '';

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
        } else if (lowerKey.includes('keterangan')) {
          keterangan = String(row[key] || '').trim();
        }
      }

      if (!namaOrder) continue;

      batchOps.push({
        sql: `INSERT INTO hpp_kalkulasi (nama_order, hpp_kalkulasi, keterangan) VALUES (?, ?, ?)`,
        args: [namaOrder, hppValue, keterangan || null]
      });
      importedCount++;
    }


    // Execute batch
    await db.batch(batchOps, "write");

    const session = await getSession();

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        'UPLOAD', 
        'hpp_kalkulasi', 
        0, 
        `Upload HPP Kalkulasi dari Excel (${importedCount} data)`, 
        JSON.stringify({ fileName: filename, imported: importedCount }),

        session?.username || 'System'
      ]
    });
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
