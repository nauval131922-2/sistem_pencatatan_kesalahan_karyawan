import { NextRequest, NextResponse } from 'next/server';
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    // Dates are stored as DD-MM-YYYY, so we use substr to sort them as YYYY-MM-DD
    const sortExpr = `substr(tgl,7,4)||'-'||substr(tgl,4,2)||'-'||substr(tgl,1,2)`;
    
    let sopdSql = `SELECT DISTINCT no_sopd, nama_order, tgl, qty_sopd, unit FROM sopd WHERE no_sopd IS NOT NULL AND no_sopd != ''`;
    let ordersSql = `SELECT DISTINCT faktur as no_sopd, nama_prd as nama_order, tgl, qty as qty_sopd, satuan as unit FROM orders WHERE faktur IS NOT NULL AND faktur != ''`;
    const args: any[] = [];

    if (search) {
      sopdSql += ` AND (no_sopd LIKE ? OR nama_order LIKE ?)`;
      ordersSql += ` AND (faktur LIKE ? OR nama_prd LIKE ?)`;
      const searchPattern = `%${search}%`;
      args.push(searchPattern, searchPattern);
    }

    sopdSql += ` ORDER BY ${sortExpr} DESC LIMIT ${search ? 500 : 300}`;
    ordersSql += ` ORDER BY ${sortExpr} DESC LIMIT ${search ? 500 : 300}`;

    const [sopdResult, ordersResult] = await db.batch([
      { sql: sopdSql, args },
      { sql: ordersSql, args }
    ], 'read');

    const combined = [
      ...ordersResult.rows.map((r: any) => ({ 
        no_sopd: r.no_sopd, 
        nama_order: r.nama_order, 
        tgl: r.tgl,
        qty: Number(r.qty_sopd || 0),
        unit: r.unit || ''
      })),
      ...sopdResult.rows.map((r: any) => ({ 
        no_sopd: r.no_sopd, 
        nama_order: r.nama_order, 
        tgl: r.tgl,
        qty: Number(r.qty_sopd || 0),
        unit: r.unit || ''
      }))
    ];

    // Deduplicate by no_sopd, keeping the last occurrence (which is now SOPD due to the reversed spread)
    const unique = Array.from(new Map(combined.map(item => [item.no_sopd, item])).values());

    return NextResponse.json({ success: true, data: unique });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
