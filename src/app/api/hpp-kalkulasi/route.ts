import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import * as xlsx from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderName = searchParams.get('order_name');

    let data;
    if (orderName) {
      data = db.prepare(`SELECT * FROM hpp_kalkulasi WHERE nama_order = ? ORDER BY id ASC`).all(orderName);
    } else {
      data = db.prepare(`SELECT * FROM hpp_kalkulasi ORDER BY id ASC`).all();
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
    // Assuming the first row is headers: e.g. ["No.", "Nama Order", "HPP Kalkulasi"]
    const rawData: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

    if (rawData.length === 0) {
       return NextResponse.json({ error: "File Excel kosong atau format tidak sesuai." }, { status: 400 });
    }

    // Prepare to save
    let importedCount = 0;

    // Delete existing rows
    db.prepare('DELETE FROM hpp_kalkulasi').run();

    const insertStmt = db.prepare(`
      INSERT INTO hpp_kalkulasi (nama_order, hpp_kalkulasi)
      VALUES (?, ?)
    `);

    db.transaction(() => {
      for (const row of rawData) {
        // Based on user's image, column names are likely "Nama Order" and "HPP Kalkulasi"
        // Let's find those keys flexibly (case insensitive, trim spaces)
        
        let namaOrder = '';
        let hppValue = 0;

        for (const key of Object.keys(row)) {
          const lowerKey = key.toLowerCase().trim();
          if (lowerKey.includes('nama order')) {
            namaOrder = String(row[key] || '').trim();
          } else if (lowerKey.includes('hpp kalkulasi')) {
            // Parse robustly since it could be a string or number in excel
            let val = row[key];
            if (typeof val === 'string') {
              // remove thousands separators (dot or comma depending on locale), parse
              val = val.replace(/[^0-9,-]+/g, "").replace(',', '.');
            }
            hppValue = parseFloat(val) || 0;
          }
        }

        if (!namaOrder || hppValue <= 0) continue; // Skip empty rows or invalid hpp

        try {
          insertStmt.run(namaOrder, hppValue);
          importedCount++;
        } catch (err: any) {
          // Might hit UNIQUE constraint if there are duplicate Nama Order in excel, ignore
          console.error("Duplicate or error in HPP import:", err.message);
        }
      }
    })();

    // Log Activity
    try {
      db.prepare(`
        INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        'UPLOAD', 
        'hpp_kalkulasi', 
        0, 
        `Upload data HPP Kalkulasi (${importedCount} baris)`, 
        JSON.stringify({ fileName: file.name, total: importedCount }), 
        'System'
      );
    } catch (e) {
      console.error("Failed to log activity:", e);
    }

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
