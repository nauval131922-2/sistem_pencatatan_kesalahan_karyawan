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
        SELECT id, faktur, nama_prd, nama_pelanggan, tgl, qty, created_at 
        FROM orders 
        WHERE nama_prd LIKE ? OR nama_pelanggan LIKE ? OR faktur LIKE ?
        ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
        LIMIT ? OFFSET ?
      `).all(query, query, query, limit, offset);
      total = (db.prepare(`
        SELECT COUNT(*) as count FROM orders 
        WHERE nama_prd LIKE ? OR nama_pelanggan LIKE ? OR faktur LIKE ?
      `).get(query, query, query) as any).count;
    } else {
      records = db.prepare(`
        SELECT id, faktur, nama_prd, nama_pelanggan, tgl, qty, created_at 
        FROM orders 
        ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC 
        LIMIT ? OFFSET ?
      `).all(limit, offset);
      total = (db.prepare(`SELECT COUNT(*) as count FROM orders`).get() as any).count;
    }

    const lastScrape = (db.prepare(`SELECT value FROM system_settings WHERE key = ?`).get('last_scrape_orders') as any);
    const lastUpdatedRaw = (db.prepare(`SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM orders`).get() as any).lastUpdated;
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
      { error: "Failed to fetch cached orders", details: error.message },
      { status: 500 }
    );
  }
}
