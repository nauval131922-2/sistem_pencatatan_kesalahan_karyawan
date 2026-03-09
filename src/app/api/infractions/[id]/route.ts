import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

function getTimeString() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    const body = await req.json();
    const { 
      description, date, recorded_by_id, order_name, order_faktur, item_faktur, employee_id,
      jenis_barang, nama_barang, jenis_harga, jumlah, harga, total, faktur: bodyFaktur
    } = body;

    const severity = body.severity || 'Low';

    if (!order_name || !recorded_by_id || !order_faktur) {
      return NextResponse.json({ error: 'Data tidak lengkap. Pastikan Order Produksi dan Pencatat sudah dipilih.' }, { status: 400 });
    }

    const fullDate = date && typeof date === 'string' && date.length === 10
      ? `${date} ${getTimeString()}`
      : date;

    // 1. Fetch snapshots
    const [empRes, recRes] = await Promise.all([
      db.execute({ sql: 'SELECT name, position, employee_no FROM employees WHERE id = ?', args: [employee_id] }),
      db.execute({ sql: 'SELECT name, position, employee_no FROM employees WHERE id = ?', args: [parseInt(recorded_by_id)] })
    ]);

    const emp = empRes.rows[0] as any;
    const rec = recRes.rows[0] as any;

    const employeeNo = emp?.employee_no || null;
    const employeeName = emp?.name || 'Unknown';
    const employeePosition = emp?.position || '-';
    const recName = rec?.name || 'Unknown';
    const recPos = rec?.position || '-';
    const recNo = rec?.employee_no || null;

    // 2. Execute batch update and log
    const rawData = JSON.stringify({ employee_no: employeeNo, employee_name: employeeName, description, faktur: bodyFaktur, date, order_name });
    await db.execute(
      {
        sql: `
          UPDATE infractions
          SET
            employee_id = ?, employee_no = ?, employee_name = ?, employee_position = ?,
            description = ?, severity = ?, date = ?,
            recorded_by = ?, recorded_by_id = ?, recorded_by_no = ?, recorded_by_name = ?, recorded_by_position = ?,
            order_name = ?, order_faktur = ?, item_faktur = ?, jenis_barang = ?, nama_barang = ?, jenis_harga = ?,
            jumlah = ?, harga = ?, total = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        args: [
          employee_id, employeeNo, employeeName, employeePosition,
          description || '', severity, fullDate,
          recName, parseInt(recorded_by_id), recNo, recName, recPos,
          order_name, order_faktur, item_faktur, jenis_barang, nama_barang, jenis_harga,
          parseFloat(jumlah) || 0, parseFloat(harga) || 0, parseFloat(total) || 0,
          id
        ]
      }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    // 1. Fetch existing for log
    const existingRes = await db.execute({
      sql: `SELECT faktur, employee_name, employee_no, description, date, order_name FROM infractions WHERE id = ?`,
      args: [id]
    });
    const existing = existingRes.rows[0] as any;

    if (existing) {
      const rawData = JSON.stringify({
        employee_id: existing.employee_no || 'Unknown',
        employee_name: existing.employee_name,
        description: existing.description,
        faktur: existing.faktur,
        date: existing.date,
        order_name: existing.order_name
      });

      await db.execute({ sql: 'DELETE FROM infractions WHERE id = ?', args: [id] });
    } else {
      await db.execute({ sql: 'DELETE FROM infractions WHERE id = ?', args: [id] });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
