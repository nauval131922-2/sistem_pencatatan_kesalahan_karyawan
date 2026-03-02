import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { 
      description, date, recorded_by_id, order_name, order_faktur, item_faktur, employee_id,
      jenis_barang, nama_barang, jenis_harga, jumlah, harga, total
    } = body;

    const severity = body.severity || 'Low';

    if (!order_name || !recorded_by_id || !order_faktur) {
      return NextResponse.json({ error: 'Data tidak lengkap. Pastikan Order Produksi dan Pencatat sudah dipilih.' }, { status: 400 });
    }

    // Append time if only date given
    let fullDate = date;
    if (date && (typeof date === 'string') && date.length === 10) {
      const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
      fullDate = `${date} ${time}`;
    }

    const empLookup = db.prepare('SELECT employee_no FROM employees WHERE id = ?').get(employee_id) as { employee_no: string } | undefined;
    const employeeNo = empLookup?.employee_no || null;

    const recordedById = parseInt(recorded_by_id);

    // Fetch recorder details
    const rec = db.prepare('SELECT name, employee_no FROM employees WHERE id = ?').get(recordedById) as { name: string, employee_no: string } | undefined;
    const recName = rec?.name || 'Unknown';
    const recNo = rec?.employee_no || null;

    db.prepare(`
      UPDATE infractions
      SET
        employee_id = ?, employee_no = ?, description = ?, severity = ?, date = ?,
        recorded_by = ?, recorded_by_id = ?, recorded_by_no = ?,
        order_name = ?, order_faktur = ?, item_faktur = ?, jenis_barang = ?, nama_barang = ?, jenis_harga = ?,
        jumlah = ?, harga = ?, total = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      employee_id, employeeNo, description || '', severity, fullDate,
      recName, recordedById, recNo,
      order_name, order_faktur, item_faktur, jenis_barang, nama_barang, jenis_harga,
      parseFloat(jumlah) || 0, parseFloat(harga) || 0, parseFloat(total) || 0,
      id
    );

    // Get the updated infraction details for the log
    const updatedInf = db.prepare(`
      SELECT i.faktur, e.name as employee_name, e.employee_no
      FROM infractions i
      LEFT JOIN employees e ON (i.employee_id = e.id OR (i.employee_no IS NOT NULL AND i.employee_no = e.employee_no))
      WHERE i.id = ?
    `).get(id) as { faktur: string, employee_name: string, employee_no: string } | undefined;

    const rawData = JSON.stringify({
      employee_id: updatedInf?.employee_no || 'Unknown',
      employee_name: updatedInf?.employee_name || 'Unknown',
      description,
      faktur: updatedInf?.faktur,
      date,
      order_name
    });

    db.prepare(`
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('UPDATE', 'infractions', id, `Edit data kesalahan: ${updatedInf?.employee_no ? `${updatedInf.employee_no} - ` : ''}${updatedInf?.employee_name}`, rawData, recName);

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
      SELECT i.*, e.name as employee_name, e.employee_no
      FROM infractions i
      LEFT JOIN employees e ON (i.employee_id = e.id OR (i.employee_no IS NOT NULL AND i.employee_no = e.employee_no))
      WHERE i.id = ?
    `).get(id) as any;

    if (existing) {
      const rawData = JSON.stringify({
        employee_id: existing.employee_no || 'Unknown',
        employee_name: existing.employee_name,
        description: existing.description,
        faktur: existing.faktur,
        date: existing.date,
        order_name: existing.order_name
      });
      db.prepare(`
        INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('DELETE', 'infractions', id, `Hapus data kesalahan: ${existing.employee_no ? `${existing.employee_no} - ` : ''}${existing.employee_name}`, rawData, 'Sistem');
    }

    db.prepare('DELETE FROM infractions WHERE id = ?').run(id);

    revalidatePath('/records');
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
