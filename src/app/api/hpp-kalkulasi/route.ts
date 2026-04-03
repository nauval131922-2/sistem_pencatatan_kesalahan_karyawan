import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { buildFtsQuery } from "@/lib/fts";

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
      const queryValue = buildFtsQuery(search);
      try {
          if (queryValue) {
            const ftsMatch = await db.execute({
              sql: "SELECT id FROM hpp_kalkulasi_fts WHERE hpp_kalkulasi_fts MATCH ?",
              args: [queryValue]
            });

            if (ftsMatch.rows.length > 0) {
                const ids = ftsMatch.rows.map(r => r.id).join(',');
                sqlData = `SELECT * FROM hpp_kalkulasi WHERE id IN (${ids}) ORDER BY id ASC LIMIT ? OFFSET ?`;
                sqlTotal = `SELECT COUNT(*) as count FROM hpp_kalkulasi WHERE id IN (${ids})`;
                argsData = [limit, offset];
                argsTotal = [];
            }
          }

          if (!sqlData) {
            const qPattern = `%${search}%`;
            sqlData = `SELECT * FROM hpp_kalkulasi WHERE (nama_order LIKE ? OR keterangan LIKE ?) ORDER BY id ASC LIMIT ? OFFSET ?`;
            sqlTotal = `SELECT COUNT(*) as count FROM hpp_kalkulasi WHERE (nama_order LIKE ? OR keterangan LIKE ?)`;
            argsData = [qPattern, qPattern, limit, offset];
            argsTotal = [qPattern, qPattern];
          }
      } catch {
          // Safe fallback
          const qPattern = `%${search}%`;
          sqlData = `SELECT * FROM hpp_kalkulasi WHERE (nama_order LIKE ? OR keterangan LIKE ?) ORDER BY id ASC LIMIT ? OFFSET ?`;
          sqlTotal = `SELECT COUNT(*) as count FROM hpp_kalkulasi WHERE (nama_order LIKE ? OR keterangan LIKE ?)`;
          argsData = [qPattern, qPattern, limit, offset];
          argsTotal = [qPattern, qPattern];
      }
    } else {
      sqlData = "SELECT * FROM hpp_kalkulasi ORDER BY id ASC LIMIT ? OFFSET ?";
      sqlTotal = "SELECT COUNT(*) as count FROM hpp_kalkulasi";
      argsData = [limit, offset];
      argsTotal = [];
    }

    const batchResults = await db.batch([
      { sql: sqlData, args: argsData },
      { sql: sqlTotal, args: argsTotal },
      { sql: "SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM hpp_kalkulasi", args: [] }
    ], "read");

    const data = batchResults[0].rows;
    const total = Number((batchResults[1].rows[0] as any).count);
    const lastUpdated = (batchResults[2].rows[0] as any).lastUpdated;

    return NextResponse.json({ success: true, data, total, lastUpdated, page, limit });

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

    // 1. Prepare batch operations
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
        const rawVal = row[key];

        if (lowerKey.includes('nama order')) {
          namaOrder = String(rawVal || '').trim();
        } else if (lowerKey.includes('hpp kalkulasi')) {
          // High-precision numerical parser (Smart-Parsing)
          if (typeof rawVal === 'number') {
            hppValue = rawVal;
          } else if (typeof rawVal === 'string') {
            let cleanVal = rawVal.trim().replace(/\s/g, '');
            // Detect locale pattern: 1.500,50 (Indonesian) or 1,500.50 (US)
            if (cleanVal.includes(',') && cleanVal.includes('.')) {
                // If comma is after dot, treat as Indonesian (Dot=Thousand, Comma=Decimal)
                if (cleanVal.lastIndexOf(',') > cleanVal.lastIndexOf('.')) {
                    cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
                } else {
                    // Otherwise treat as US (Comma=Thousand, Dot=Decimal)
                    cleanVal = cleanVal.replace(/,/g, "");
                }
            } else if (cleanVal.includes(',')) {
                // Single separator found: comma. 
                // Likely a decimal for 379,1.
                cleanVal = cleanVal.replace(',', '.');
            }
            hppValue = parseFloat(cleanVal) || 0;
          }
        } else if (lowerKey.includes('keterangan')) {
          keterangan = String(rawVal || '').trim();
        }
      }

      if (!namaOrder) continue;

      batchOps.push({
        sql: `INSERT INTO hpp_kalkulasi (nama_order, hpp_kalkulasi, keterangan) VALUES (?, ?, ?)`,
        args: [namaOrder, hppValue, keterangan || null]
      });
      importedCount++;
    }

    // 2. Execute batch
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
