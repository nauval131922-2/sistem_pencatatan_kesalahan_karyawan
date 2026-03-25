import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const result = await db.execute("SELECT COUNT(*) as count FROM purchase_orders");
  const lastFive = await db.execute("SELECT faktur, tgl FROM purchase_orders ORDER BY created_at DESC LIMIT 5");
  const settings = await db.execute("SELECT * FROM system_settings WHERE key = 'last_scrape_purchase_orders'");
  
  return NextResponse.json({
    count: result.rows[0]?.count,
    lastFive: lastFive.rows,
    settings: settings.rows
  });
}
