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

    // Generate faktur: REK/YYYY/MM/XXXX
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${yyyy}-${mm}`;
    const countRow = db.prepare(
      `SELECT COUNT(*) as cnt FROM infractions WHERE faktur LIKE ?`
    ).get(`REK/${yyyy}/${mm}/%`) as { cnt: number };
    const seq = String((countRow?.cnt ?? 0) + 1).padStart(4, '0');
    const faktur = `REK/${yyyy}/${mm}/${seq}`;

    db.prepare(
      'INSERT INTO infractions (employee_id, description, severity, date, recorded_by, order_name, faktur) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(employeeId, description, severity, fullDate, recordedBy, orderName, faktur);

    return NextResponse.json({ success: true, faktur });
  } catch (err: any) {
    console.error('Add infraction error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
