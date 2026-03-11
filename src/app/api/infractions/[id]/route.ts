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
    const contentType = req.headers.get('content-type') || '';
    let data: any = {};
    if (contentType.includes('application/json')) {
      data = await req.json();
    } else {
      const formData = await req.formData();
      formData.forEach((v, k) => { data[k] = v; });
    }

    const { 
      description, date, order_name, order_faktur, item_faktur, employee_id,
      jenis_barang, nama_barang, jenis_harga, jumlah, harga, total, faktur: bodyFaktur
    } = data;

    // Use provided recorded_by_id or find current session user
    let recordedById = parseInt(data.recorded_by_id as string);
    if (!recordedById && session?.name) {
      const recLookup = await db.execute({ 
        sql: 'SELECT id FROM employees WHERE name = ? ORDER BY id ASC LIMIT 1', 
        args: [session.name] 
      });
      recordedById = (recLookup.rows[0] as any)?.id || 0;
    }

    const parseIndoNum = (v: any) => {
      if (typeof v === 'number') return v;
      if (typeof v !== 'string') return 0;
      const clean = v.replace(/\./g, '').replace(/,/g, '.');
      return parseFloat(clean) || 0;
    };

    const employeeId = parseInt(String(employee_id));
    const cleanJumlah = parseIndoNum(jumlah);
    const cleanHarga = parseIndoNum(harga);
    const cleanTotal = parseIndoNum(total);

    if (isNaN(cleanJumlah) || isNaN(cleanHarga) || isNaN(cleanTotal)) {
      return NextResponse.json({ error: 'Format angka tidak valid.' }, { status: 400 });
    }

    if (!order_name || !order_faktur || !employeeId) {
      return NextResponse.json({ error: 'Data tidak lengkap. Pastikan Karyawan dan Order sudah dipilih.' }, { status: 400 });
    }

    const fullDate = date && typeof date === 'string' && date.length === 10
      ? `${date} ${getTimeString()}`
      : date;

    // 1. Fetch snapshots
    const [empRes, recRes] = await Promise.all([
      db.execute({ sql: 'SELECT name, position, employee_no FROM employees WHERE id = ?', args: [employeeId] }),
      db.execute({ sql: 'SELECT name, position, employee_no FROM employees WHERE id = ?', args: [recordedById] })
    ]);

    const emp = empRes.rows[0] as any;
    const rec = recRes.rows[0] as any;

    if (!emp) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan.' }, { status: 404 });
    }

    const employeeNo = emp?.employee_no || null;
    const employeeName = emp?.name || 'Unknown';
    const employeePosition = emp?.position || '-';
    const recName = rec?.name || session?.name || 'Unknown';
    const recPos = rec?.position || 'User';
    const recNo = rec?.employee_no || null;

    const severity = data.severity || 'Low';
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
          employeeId, employeeNo, employeeName, employeePosition,
          description || '', severity, fullDate,
          recName, recordedById, recNo, recName, recPos,
          order_name, order_faktur, item_faktur, jenis_barang, nama_barang, jenis_harga,
          cleanJumlah, cleanHarga, cleanTotal,
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
