import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT message, raw_data, created_at 
      FROM activity_logs 
      WHERE action_type = 'SCRAPE' 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    return NextResponse.json({ logs: result.rows });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
