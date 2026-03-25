import { NextResponse } from "next/server";
import db from "@/lib/db";
import { logActivity } from "@/lib/activity";


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;
    const fromDate = searchParams.get('from') || '';
    const toDate = searchParams.get('to') || '';

    const dateFilterSQL = (fromDate && toDate)
      ? ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2) BETWEEN ? AND ?)`
      : ``;

    console.log(`[API] Fetching bahan-baku: page=${page}, limit=${limit}, search="${search}", from="${fromDate}", to="${toDate}"`);

    let sqlRecords = "";
    let sqlTotal = "";
    let argsRecords: any[] = [];
    let argsTotal: any[] = [];

    if (search) {
      // Split by space and clean each word for FTS
      const words = search.trim().split(/\s+/).filter(w => w.length > 0);
      const ftsQuery = words.map(w => `${w.replace(/"/g, '""')}*`).join(' AND ');
      
      const baseArgs = [ftsQuery];
      if (fromDate && toDate) { baseArgs.push(fromDate, toDate); }
      
      const sqlFtsRecords = `
        SELECT 
          id, tgl, nama_barang, kd_barang, faktur, faktur_prd, 
          faktur_aktifitas, kd_cabang, kd_gudang, qty, satuan, 
          status, hp, hp_total, keterangan, fkt_hasil, 
          nama_prd, aktifitas, username, kd_pelanggan, recid, 
          created_at 
        FROM bahan_baku 
        WHERE id IN (SELECT rowid FROM bahan_baku_fts WHERE bahan_baku_fts MATCH ?) ${dateFilterSQL}
        ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
        LIMIT ? OFFSET ?
      `;
      
      const sqlFtsTotal = `
        SELECT COUNT(*) as count FROM bahan_baku 
        WHERE id IN (SELECT rowid FROM bahan_baku_fts WHERE bahan_baku_fts MATCH ?) ${dateFilterSQL}
      `;

      // 1. Try FTS5 First (Fast)
      let results = await db.batch([
        { sql: sqlFtsRecords, args: [...baseArgs, limit, offset] },
        { sql: sqlFtsTotal, args: baseArgs }
      ], "read");

      let records = results[0].rows;
      let total = Number((results[1].rows[0] as any).count);

      // 2. Fallback to LIKE if FTS fails to find anything (Robustness)
      if (total === 0) {
        const query = `%${search}%`;
        // Search in ALL relevant text columns for TRUE GLOBAL SEARCH fallback
        const likeArgs = Array(13).fill(query); 
        if (fromDate && toDate) { likeArgs.push(fromDate, toDate); }
        
        const sqlLikeRecords = `
          SELECT * FROM bahan_baku 
          WHERE (
            CAST(id AS TEXT) LIKE ? OR
            nama_barang LIKE ? OR 
            nama_prd LIKE ? OR 
            kd_barang LIKE ? OR 
            faktur LIKE ? OR
            faktur_prd LIKE ? OR
            faktur_aktifitas LIKE ? OR
            kd_pelanggan LIKE ? OR
            keterangan LIKE ? OR
            username LIKE ? OR
            aktifitas LIKE ? OR
            kd_cabang LIKE ? OR
            kd_gudang LIKE ?
          ) ${dateFilterSQL}
          ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
          LIMIT ? OFFSET ?
        `;
        const sqlLikeTotal = `
          SELECT COUNT(*) as count FROM bahan_baku 
          WHERE (
            CAST(id AS TEXT) LIKE ? OR
            nama_barang LIKE ? OR 
            nama_prd LIKE ? OR 
            kd_barang LIKE ? OR 
            faktur LIKE ? OR
            faktur_prd LIKE ? OR
            faktur_aktifitas LIKE ? OR
            kd_pelanggan LIKE ? OR
            keterangan LIKE ? OR
            username LIKE ? OR
            aktifitas LIKE ? OR
            kd_cabang LIKE ? OR
            kd_gudang LIKE ?
          ) ${dateFilterSQL}
        `;

        const likeResults = await db.batch([
          { sql: sqlLikeRecords, args: [...likeArgs, limit, offset] },
          { sql: sqlLikeTotal, args: likeArgs }
        ], "read");

        records = likeResults[0].rows;
        total = Number((likeResults[1].rows[0] as any).count);
      }

      const extraResults = await db.batch([
        { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_bahan_baku'`, args: [] },
        { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM bahan_baku`, args: [] }
      ], "read");

      return NextResponse.json({
        success: true,
        data: records,
        total,
        lastUpdated: extraResults[0].rows[0]?.value || extraResults[1].rows[0]?.lastUpdated,
        page,
        limit
      });
    } else {
      const baseArgs = [];
      if (fromDate && toDate) { baseArgs.push(fromDate, toDate); }

      const results = await db.batch([
        {
          sql: `SELECT * FROM bahan_baku ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''} 
                ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
                LIMIT ? OFFSET ?`,
          args: [...baseArgs, limit, offset]
        },
        {
          sql: `SELECT COUNT(*) as count FROM bahan_baku ${(fromDate && toDate) ? `WHERE 1=1 ${dateFilterSQL}` : ''}`,
          args: baseArgs
        },
        { sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_bahan_baku'`, args: [] },
        { sql: `SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM bahan_baku`, args: [] }
      ], "read");

      return NextResponse.json({
        success: true,
        data: results[0].rows,
        total: Number((results[1].rows[0] as any).count),
        lastUpdated: results[2].rows[0]?.value || results[3].rows[0]?.lastUpdated,
        page,
        limit
      });
    }
  } catch (error: any) {
    console.error("Fetch bahan-baku error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cached bahan_baku", details: error.message },
      { status: 500 }
    );
  }
}
