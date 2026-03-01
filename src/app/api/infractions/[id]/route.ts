import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { description, date, recorded_by, order_name } = body;

    db.prepare(
      'UPDATE infractions SET description = ?, date = ?, recorded_by = ?, order_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(description || '', date, recorded_by, order_name || null, id);

    revalidatePath('/records');
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    db.prepare('DELETE FROM infractions WHERE id = ?').run(id);

    revalidatePath('/records');
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
