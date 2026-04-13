import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let sqlData = "";
    let sqlTotal = "";
    let argsData: any[] = [];
    let argsTotal: any[] = [];

    if (search) {
      const qPattern = `%${search}%`;
      sqlData = `SELECT * FROM sopd WHERE (no_sopd LIKE ? OR nama_order LIKE ?) ORDER BY id ASC LIMIT ? OFFSET ?`;
      sqlTotal = `SELECT COUNT(*) as count FROM sopd WHERE (no_sopd LIKE ? OR nama_order LIKE ?)`;
      argsData = [qPattern, qPattern, limit, offset];
      argsTotal = [qPattern, qPattern];
    } else {
      sqlData = "SELECT * FROM sopd ORDER BY id ASC LIMIT ? OFFSET ?";
      sqlTotal = "SELECT COUNT(*) as count FROM sopd";
      argsData = [limit, offset];
      argsTotal = [];
    }

    const batchResults = await db.batch([
      { sql: sqlData, args: argsData },
      { sql: sqlTotal, args: argsTotal }
    ], "read");

    const data = batchResults[0].rows;
    const total = Number((batchResults[1].rows[0] as any).count);

    return NextResponse.json({ success: true, data, total, page, limit });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { filename, data: rawData } = await request.json();

    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
       return NextResponse.json({ error: "Data Excel kosong atau format tidak sesuai." }, { status: 400 });
    }

    const batchOps: any[] = [
      { sql: 'DELETE FROM sopd', args: [] }
    ];

    let importedCount = 0;
    for (const row of rawData) {
      const noSopd = String(row.no_sopd || '').trim();
      const namaOrder = String(row.nama_order || '').trim();
      let qtySopd = 0;
      const unit = String(row.unit || '').trim();

      // Qty Parsing
      const rawQty = row.qty_sopd;
      if (typeof rawQty === 'number') {
        qtySopd = rawQty;
      } else if (typeof rawQty === 'string') {
        let cleanVal = rawQty.trim().replace(/\s/g, '');
        if (cleanVal.includes(',') && cleanVal.includes('.')) {
          if (cleanVal.lastIndexOf(',') > cleanVal.lastIndexOf('.')) {
            cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
          } else {
            cleanVal = cleanVal.replace(/,/g, "");
          }
        } else if (cleanVal.includes(',')) {
          cleanVal = cleanVal.replace(',', '.');
        }
        qtySopd = parseFloat(cleanVal) || 0;
      }

      if (!noSopd && !namaOrder) continue;

      batchOps.push({
        sql: `INSERT INTO sopd (no_sopd, nama_order, qty_sopd, unit) VALUES (?, ?, ?, ?)`,
        args: [noSopd, namaOrder, qtySopd, unit || null]
      });
      importedCount++;
    }

    await db.batch(batchOps, "write");

    const session = await getSession();

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        'UPLOAD', 
        'sopd', 
        0, 
        `Upload SOPD dari Excel (${importedCount} data)`, 
        JSON.stringify({ fileName: filename, imported: importedCount }),
        session?.username || 'System'
      ]
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${importedCount} data SOPD.`,
      imported: importedCount
    });

  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses file Excel", details: error.message },
      { status: 500 }
    );
  }
}
