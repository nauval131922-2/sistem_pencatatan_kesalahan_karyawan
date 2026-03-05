import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action_type, table_name, message, raw_data, recorded_by } = body;

    if (!action_type || !table_name || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    db.prepare(`
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES (?, ?, 0, ?, ?, ?)
    `).run(action_type, table_name, message, raw_data || '{}', recorded_by || 'System');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
