import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate"); // DD-MM-YYYY
    const endDate = searchParams.get("endDate");     // DD-MM-YYYY
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Helper: convert DD-MM-YYYY to YYYY-MM-DD for comparisons
    const toISO = (ddmmyyyy: string | null) => {
      if (!ddmmyyyy) return null;
      const p = ddmmyyyy.split('-');
      if (p.length !== 3) return null;
      return `${p[2]}-${p[1]}-${p[0]}`;
    };

    const CUTOFF = '2025-01-01';
    const startISO = toISO(startDate);
    const endISO = toISO(endDate);

    // Determines which tables to include based on date range
    const useSopd   = !startDate || !endDate || startISO! < CUTOFF;
    const useOrders = !startDate || !endDate || endISO! >= CUTOFF;

    // Date filter expression for sopd (stored as DD-MM-YYYY)
    const sopdDateExpr = `substr(tgl,7,4)||'-'||substr(tgl,4,2)||'-'||substr(tgl,1,2)`;
    // Date filter expression for orders (stored as DD-MM-YYYY)
    const ordersDateExpr = `substr(tgl,7,4)||'-'||substr(tgl,4,2)||'-'||substr(tgl,1,2)`;

    // Build the upper bound for sopd: either endDate or just before cutoff
    const sopdEndISO   = (endISO && endISO < CUTOFF) ? endISO : /* day before cutoff */ '2024-12-31';
    // Build lower bound for orders: either startDate or cutoff
    const ordersStartISO = (startISO && startISO > CUTOFF) ? startISO : CUTOFF;


    const qPattern = search ? `%${search}%` : null;

    // Mode khusus untuk dropdown (tanpa filter tanggal, ambil semua)
    const allMode = searchParams.get('all') === 'true';
    if (allMode) {
      const whereClause = search ? `WHERE no_sopd LIKE ? OR nama_order LIKE ?` : '';
      const args: any[] = search ? [`%${search}%`, `%${search}%`, limit] : [limit];
      const sql = `
        SELECT no_sopd, nama_order FROM (
          SELECT no_sopd, nama_order FROM sopd
          UNION
          SELECT faktur as no_sopd, nama_prd as nama_order FROM orders
        ) ${whereClause} ORDER BY no_sopd DESC LIMIT ?`;
      const result = await db.execute({ sql, args });
      return NextResponse.json({ success: true, data: result.rows, total: result.rows.length });
    }

    let sqlData: string;
    let sqlTotal: string;
    let argsData: any[] = [];
    let argsTotal: any[] = [];

    const ORDER_BY = `ORDER BY substr(tgl,7,4) DESC, substr(tgl,4,2) DESC, substr(tgl,1,2) DESC, no_sopd DESC`;

    if (useSopd && useOrders) {
      // Both tables – UNION ALL, then join with sopd_harga
      const sopdWhereParts: string[] = [`${sopdDateExpr} BETWEEN ? AND ?`];
      if (search) sopdWhereParts.push(`(s.no_sopd LIKE ? OR s.nama_order LIKE ?)`);
      const sopdWhere = `WHERE ${sopdWhereParts.join(' AND ')}`;

      const ordersWhereParts: string[] = [`${ordersDateExpr} BETWEEN ? AND ?`];
      if (search) ordersWhereParts.push(`(o.faktur LIKE ? OR o.nama_prd LIKE ?)`);
      const ordersWhere = `WHERE ${ordersWhereParts.join(' AND ')}`;

      sqlData = `
        SELECT u.*, h.perkiraan_harga, h.keterangan, h.deadline_date, h.finished_date FROM (
          SELECT s.id, s.no_sopd, s.tgl, s.nama_order, s.qty_sopd, s.unit, 'sopd' as src FROM sopd s ${sopdWhere}
          UNION ALL
          SELECT o.id, o.faktur as no_sopd, o.tgl, o.nama_prd as nama_order, o.qty as qty_sopd, o.satuan as unit, 'orders' as src FROM orders o ${ordersWhere}
        ) u LEFT JOIN sopd_harga h ON h.no_sopd = u.no_sopd
        ${ORDER_BY} LIMIT ? OFFSET ?`;
      
      sqlTotal = `
        SELECT (
          (SELECT COUNT(*) FROM sopd s ${sopdWhere.replace(/s\./g,'')}) +
          (SELECT COUNT(*) FROM orders o ${ordersWhere.replace(/o\./g,'')})
        ) as count`;

      const sopdA = [startISO!, sopdEndISO, ...(search ? [qPattern!, qPattern!] : [])];
      const ordersA = [ordersStartISO, endISO!, ...(search ? [qPattern!, qPattern!] : [])];
      const sopdAnoAlias = [startISO!, sopdEndISO, ...(search ? [qPattern!, qPattern!] : [])];
      const ordersAnoAlias = [ordersStartISO, endISO!, ...(search ? [qPattern!, qPattern!] : [])];

      argsData = [...sopdA, ...ordersA, limit, offset];
      argsTotal = [...sopdAnoAlias, ...ordersAnoAlias];

    } else if (useSopd) {
      const whereParts: string[] = [];
      if (startDate && endDate) whereParts.push(`${sopdDateExpr} BETWEEN ? AND ?`);
      if (search) whereParts.push(`(s.no_sopd LIKE ? OR s.nama_order LIKE ?)`);
      const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
      const whereCount = where.replace(/s\./g, '');

      sqlData = `SELECT s.id, s.no_sopd, s.tgl, s.nama_order, s.qty_sopd, s.unit, 'sopd' as src, h.perkiraan_harga, h.keterangan, h.deadline_date, h.finished_date FROM sopd s LEFT JOIN sopd_harga h ON h.no_sopd = s.no_sopd ${where} ${ORDER_BY} LIMIT ? OFFSET ?`;
      sqlTotal = `SELECT COUNT(*) as count FROM sopd ${whereCount}`;

      const a: any[] = [];
      if (startDate && endDate) a.push(startISO!, sopdEndISO);
      if (search) a.push(qPattern!, qPattern!);
      argsData = [...a, limit, offset];
      argsTotal = a;

    } else {
      // Only orders
      const whereParts: string[] = [];
      if (startDate && endDate) whereParts.push(`${ordersDateExpr} BETWEEN ? AND ?`);
      if (search) whereParts.push(`(o.faktur LIKE ? OR o.nama_prd LIKE ?)`);
      const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
      const whereCount = where.replace(/o\./g, '');

      sqlData = `SELECT o.id, o.faktur as no_sopd, o.tgl, o.nama_prd as nama_order, o.qty as qty_sopd, o.satuan as unit, 'orders' as src, h.perkiraan_harga, h.keterangan, h.deadline_date, h.finished_date FROM orders o LEFT JOIN sopd_harga h ON h.no_sopd = o.faktur ${where} ${ORDER_BY} LIMIT ? OFFSET ?`;
      sqlTotal = `SELECT COUNT(*) as count FROM orders ${whereCount}`;

      const a: any[] = [];
      if (startDate && endDate) a.push(ordersStartISO, endISO!);
      if (search) a.push(qPattern!, qPattern!);
      argsData = [...a, limit, offset];
      argsTotal = a;
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
      const tgl = String(row.tgl || '').trim();
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
        sql: `INSERT INTO sopd (no_sopd, tgl, nama_order, qty_sopd, unit) VALUES (?, ?, ?, ?, ?)`,
        args: [noSopd, tgl || null, namaOrder, qtySopd, unit || null]
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
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { no_sopd, perkiraan_harga, keterangan, deadline_date, finished_date } = body;

    if (!no_sopd) {
      return NextResponse.json({ error: 'no_sopd diperlukan' }, { status: 400 });
    }

    if (perkiraan_harga !== undefined) {
        let harga: any = perkiraan_harga;
        if (perkiraan_harga === '' || perkiraan_harga === null) {
            harga = null;
        } else {
            const clean = String(perkiraan_harga).replace(/\./g, "").replace(',', '.');
            const num = Number(clean);
            if (!isNaN(num)) harga = num;
            else harga = String(perkiraan_harga);
        }

        await db.execute({
          sql: `INSERT INTO sopd_harga (no_sopd, perkiraan_harga, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(no_sopd) DO UPDATE SET perkiraan_harga = excluded.perkiraan_harga, updated_at = CURRENT_TIMESTAMP`,
          args: [no_sopd, harga]
        });
        return NextResponse.json({ success: true, no_sopd, perkiraan_harga: harga });
    }

    if (keterangan !== undefined) {
        await db.execute({
          sql: `INSERT INTO sopd_harga (no_sopd, keterangan, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(no_sopd) DO UPDATE SET keterangan = excluded.keterangan, updated_at = CURRENT_TIMESTAMP`,
          args: [no_sopd, keterangan]
        });
        return NextResponse.json({ success: true, no_sopd, keterangan });
    }

    if (deadline_date !== undefined) {
        await db.execute({
          sql: `INSERT INTO sopd_harga (no_sopd, deadline_date, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(no_sopd) DO UPDATE SET deadline_date = excluded.deadline_date, updated_at = CURRENT_TIMESTAMP`,
          args: [no_sopd, deadline_date]
        });
        return NextResponse.json({ success: true, no_sopd, deadline_date });
    }

    if (finished_date !== undefined) {
        await db.execute({
          sql: `INSERT INTO sopd_harga (no_sopd, finished_date, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(no_sopd) DO UPDATE SET finished_date = excluded.finished_date, updated_at = CURRENT_TIMESTAMP`,
          args: [no_sopd, finished_date]
        });
        return NextResponse.json({ success: true, no_sopd, finished_date });
    }

    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
