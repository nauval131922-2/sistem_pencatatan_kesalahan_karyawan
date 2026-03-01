import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const employeeId = parseInt(formData.get('employee_id') as string);
    const description = (formData.get('description') as string)?.trim() || '';
    const date = (formData.get('date') as string)?.trim();
    const recordedBy = (formData.get('recorded_by') as string)?.trim();
    const orderName = (formData.get('order_name') as string)?.trim() || null;
    const severity = 'Low'; // default, severitas dihapus dari UI

    if (!employeeId || !date || !recordedBy) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 });
    }

    // Append time if only date given
    let fullDate = date;
    if (date.length === 10) {
      const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
      fullDate = `${date} ${time}`;
    }

    // Generate faktur: DDMMYY-XXX berdasarkan tanggal input (bukan tanggal komputer/hari ini)
    // `date` formatnya YYYY-MM-DD
    const dateObj = new Date(date.substring(0, 10)); // pastikan mengambil YYYY-MM-DD saja
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).substring(2); // Ambil 2 digit tahun terakhir
    const datePrefix = `${dd}${mm}${yy}`; // misal 020126

    // Hitung prefix ini sudah ada berapa di database
    const countRow = db.prepare(
      `SELECT COUNT(*) as cnt FROM infractions WHERE faktur LIKE ?`
    ).get(`ERR-${datePrefix}-%`) as { cnt: number };
    
    // Nomor urut per hari (3 digit)
    const seq = String((countRow?.cnt ?? 0) + 1).padStart(3, '0');
    const faktur = `ERR-${datePrefix}-${seq}`; // misal ERR-020126-001

    db.prepare(
      'INSERT INTO infractions (employee_id, description, severity, date, recorded_by, order_name, faktur) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(employeeId, description, severity, fullDate, recordedBy, orderName, faktur);

    return NextResponse.json({ success: true, faktur });
  } catch (err: any) {
    console.error('Add infraction error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
