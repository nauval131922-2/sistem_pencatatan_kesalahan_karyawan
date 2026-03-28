import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const result = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='pengiriman'");
  return NextResponse.json(result.rows[0]);
}
