import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let query = `
      SELECT 
        i.*,
        COALESCE(i.employee_name, e.name) as employee_name,
        i.employee_no,
        COALESCE(i.employee_position, e.position) as employee_position,
        COALESCE(i.recorded_by_name, r.name, i.recorded_by) as recorded_by_name,
        COALESCE(i.recorded_by_position, r.position) as recorded_by_position,
        COALESCE(i.order_name, o.nama_prd) as order_name_display,
        COALESCE(i.nama_barang, bb.nama_barang, bj.nama_barang) as nama_barang_display
      FROM infractions i
      LEFT JOIN employees e ON i.employee_id = e.id
      LEFT JOIN employees r ON i.recorded_by_id = r.id
      LEFT JOIN orders o ON i.order_faktur = o.faktur
      LEFT JOIN bahan_baku bb ON (i.item_faktur = bb.faktur AND i.jenis_barang = 'Bahan Baku')
      LEFT JOIN barang_jadi bj ON (i.item_faktur = bj.faktur AND i.jenis_barang = 'Barang Jadi')
    `;
    const params: any[] = [];
    if (start && end) {
      query += ` WHERE substr(i.date, 1, 10) BETWEEN ? AND ?`;
      params.push(start, end);
    }
    query += ` ORDER BY i.date DESC, i.id DESC`;

    const data = db.prepare(query).all(...params);
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Fast manual time formatter (avoids toLocaleTimeString locale overhead)
function getTimeString() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const employeeId = parseInt(formData.get('employee_id') as string);
    const description = (formData.get('description') as string)?.trim() || '';
    const date = (formData.get('date') as string)?.trim();
    const recordedById = parseInt(formData.get('recorded_by_id') as string);
    const orderFaktur = (formData.get('order_faktur') as string)?.trim();
    const orderName = (formData.get('order_name') as string)?.trim();
    const itemFaktur = (formData.get('item_faktur') as string)?.trim();
    const jenisBarang = (formData.get('jenis_barang') as string)?.trim();
    const namaBarang = (formData.get('nama_barang') as string)?.trim();
    const jenisHarga = (formData.get('jenis_harga') as string)?.trim();
    const jumlah = parseFloat(formData.get('jumlah') as string) || 0;
    const harga = parseFloat(formData.get('harga') as string) || 0;
    const total = parseFloat(formData.get('total') as string) || 0;
    const severity = 'Low';
 
    if (!employeeId || !date || !recordedById || !orderFaktur) {
      return NextResponse.json({ error: 'Data tidak lengkap. Pastikan Order Produksi sudah dipilih.' }, { status: 400 });
    }

    const fullDate = date.length === 10 ? `${date} ${getTimeString()}` : date;

    // Generate faktur datePrefix from the input date
    const dateObj = new Date(date.substring(0, 10));
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).substring(2);
    const datePrefix = `${dd}${mm}${yy}`;

    // All DB writes in one transaction (saves 1 fsync vs separate INSERT calls)
    const result = db.transaction(() => {
      // Faktur sequence
      const countRow = db.prepare(
        `SELECT last_seq FROM faktur_sequences WHERE prefix = ?`
      ).get(datePrefix) as { last_seq: number } | undefined;
      const newSeq = (countRow?.last_seq ?? 0) + 1;
      const faktur = `ERR-${datePrefix}-${String(newSeq).padStart(3, '0')}`;
      db.prepare(`
        INSERT INTO faktur_sequences (prefix, last_seq) VALUES (?, ?)
        ON CONFLICT(prefix) DO UPDATE SET last_seq = ?, updated_at = CURRENT_TIMESTAMP
      `).run(datePrefix, newSeq, newSeq);

      // Separate .get() per employee — avoids IN(?,?) type-coercion issues
      const emp = db.prepare('SELECT name, position, employee_no FROM employees WHERE id = ?').get(employeeId) as { name: string, position: string, employee_no: string } | undefined;
      const rec = db.prepare('SELECT name, position, employee_no FROM employees WHERE id = ?').get(recordedById) as { name: string, position: string, employee_no: string } | undefined;

      const empName = emp?.name || 'Unknown';
      const empPos = emp?.position || '-';
      const employeeNo = emp?.employee_no || null;
      const recName = rec?.name || 'Unknown';
      const recPos = rec?.position || '-';
      const recNo = rec?.employee_no || null;

      const insertResult = db.prepare(
        `INSERT INTO infractions (
          employee_id, employee_no, employee_name, employee_position,
          description, severity, date,
          recorded_by, recorded_by_id, recorded_by_no, recorded_by_name, recorded_by_position,
          order_name, order_faktur, item_faktur, faktur, jenis_barang, nama_barang, jenis_harga, jumlah, harga, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        employeeId, employeeNo, empName, empPos,
        description, severity, fullDate,
        recName, recordedById, recNo, recName, recPos,
        orderName, orderFaktur, itemFaktur, faktur, jenisBarang, namaBarang, jenisHarga, jumlah, harga, total
      );

      // Activity log in same transaction (one fewer commit/fsync)
      const rawData = JSON.stringify({ employee_no: employeeNo, employee_name: empName, description, faktur, date: fullDate, order_name: orderName });
      db.prepare(`
        INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('INSERT', 'infractions', insertResult.lastInsertRowid, `Tambah data kesalahan: ${employeeNo ? `${employeeNo} - ` : ''}${empName}`, rawData, recName);

      return { faktur };
    })();

    return NextResponse.json({ success: true, faktur: result.faktur });
  } catch (err: any) {
    console.error('Add infraction error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
