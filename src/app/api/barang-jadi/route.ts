import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let records;
    let total;

    if (search) {
      const query = `%${search}%`;
      records = db.prepare(`
        SELECT id, tgl, nama_barang, kd_barang, qty, satuan, hp, nama_prd, faktur, faktur_prd, created_at 
        FROM barang_jadi 
        WHERE nama_barang LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?
        ORDER BY substr(tgl, 7, 4) ASC, substr(tgl, 4, 2) ASC, substr(tgl, 1, 2) ASC, id ASC 
        LIMIT ? OFFSET ?
      `).all(query, query, query, query, limit, offset);
      total = (db.prepare(`
        SELECT COUNT(*) as count FROM barang_jadi 
        WHERE nama_barang LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ? OR faktur LIKE ?
      `).get(query, query, query, query) as any).count;
    } else {
      records = db.prepare(`
        SELECT id, tgl, nama_barang, kd_barang, qty, satuan, hp, nama_prd, faktur, faktur_prd, created_at 
        FROM barang_jadi 
        ORDER BY substr(tgl, 7, 4) ASC, substr(tgl, 4, 2) ASC, substr(tgl, 1, 2) ASC, id ASC 
        LIMIT ? OFFSET ?
      `).all(limit, offset);
      total = (db.prepare(`SELECT COUNT(*) as count FROM barang_jadi`).get() as any).count;
    }

    const lastScrape = (db.prepare(`SELECT value FROM system_settings WHERE key = ?`).get('last_scrape_barang_jadi') as any);
    const lastUpdatedRaw = (db.prepare(`SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM barang_jadi`).get() as any).lastUpdated;
    const lastUpdated = lastScrape ? lastScrape.value : lastUpdatedRaw;

    return NextResponse.json({
      success: true,
      data: records,
      total,
      lastUpdated,
      page,
      limit
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch cached barang_jadi", details: error.message },
      { status: 500 }
    );
  }
}
