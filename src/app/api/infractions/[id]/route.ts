import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { description, date, recorded_by, order_name, employee_id } = body;

    if (!order_name) {
      return NextResponse.json({ error: 'Data tidak lengkap. Pastikan Order Produksi sudah dipilih.' }, { status: 400 });
    }

    db.prepare(
      'UPDATE infractions SET employee_id = ?, description = ?, date = ?, recorded_by = ?, order_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(employee_id, description || '', date, recorded_by, order_name, id);

    // Get the updated infraction details for the log
    const updatedInf = db.prepare(`
      SELECT i.faktur, e.name as employee_name 
      FROM infractions i
      JOIN employees e ON i.employee_id = e.id
      WHERE i.id = ?
    `).get(id) as { faktur: string, employee_name: string } | undefined;

    const rawData = JSON.stringify({
      employee_name: updatedInf?.employee_name || 'Unknown',
      description,
      faktur: updatedInf?.faktur,
      date,
      order_name
    });

    db.prepare(`
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('UPDATE', 'infractions', id, `Edit data kesalahan karyawan: ${updatedInf?.employee_name}`, rawData, recorded_by);

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
    
    // Grab the existing information before it's gone
    const existing = db.prepare(`
      SELECT i.*, e.name as employee_name
      FROM infractions i
      JOIN employees e ON i.employee_id = e.id
      WHERE i.id = ?
    `).get(id) as any;

    if (existing) {
      const rawData = JSON.stringify({
        employee_name: existing.employee_name,
        description: existing.description,
        faktur: existing.faktur,
        date: existing.date,
        order_name: existing.order_name
      });
      db.prepare(`
        INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('DELETE', 'infractions', id, `Hapus data kesalahan karyawan: ${existing.employee_name}`, rawData, 'Sistem');
    }

    db.prepare('DELETE FROM infractions WHERE id = ?').run(id);

    revalidatePath('/records');
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
