import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

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

    const result = await db.execute({ sql: query, args: params });
    return NextResponse.json({ data: result.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getTimeString() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let data: any = {};
    
    if (contentType.includes('application/json')) {
      data = await req.json();
    } else {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        data[key] = value;
      });
    }

    const employeeId = parseInt(data.employee_id as string) || 0;
    const description = (data.description as string)?.trim() || '';
    const date = (data.date as string)?.trim();
    const orderFaktur = (data.order_faktur as string)?.trim();
    const orderName = (data.order_name as string)?.trim();
    const itemFaktur = (data.item_faktur as string)?.trim();
    const jenisBarang = (data.jenis_barang as string)?.trim();
    const namaBarang = (data.nama_barang as string)?.trim();
    const jenisHarga = (data.jenis_harga as string)?.trim();
    const jumlah = parseFloat(data.jumlah as string) || 0;
    const harga = parseFloat(data.harga as string) || 0;
    const total = parseFloat(data.total as string) || 0;
    const severity = 'Low';

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan. Silakan login kembali.' }, { status: 401 });
    }

    if (!employeeId || !date || !orderFaktur) {
      return NextResponse.json({ error: 'Data tidak lengkap. Pastikan Order Produksi sudah dipilih.' }, { status: 400 });
    }

    const fullDate = date.length === 10 ? `${date} ${getTimeString()}` : date;

    const dateObj = new Date(date.substring(0, 10));
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).substring(2);
    const datePrefix = `${dd}${mm}${yy}`;

    // 1. Fetch sequence and snapshots first
    // Prefer lookup by session name for recorded by details
    const [seqRes, empRes, recRes] = await Promise.all([
      db.execute({ sql: `SELECT last_seq FROM faktur_sequences WHERE prefix = ?`, args: [datePrefix] }),
      db.execute({ sql: 'SELECT name, position, employee_no FROM employees WHERE id = ?', args: [employeeId] }),
      db.execute({ sql: 'SELECT id, name, position, employee_no FROM employees WHERE name = ? ORDER BY id ASC LIMIT 1', args: [session.name] })
    ]);

    const countRow = seqRes.rows[0] as any;
    const lastSeq = countRow?.last_seq;
    const newSeq = (typeof lastSeq === 'number' ? lastSeq : 0) + 1;
    const faktur = `ERR-${datePrefix}-${String(newSeq).padStart(3, '0')}`;

    const emp = empRes.rows[0] as any;
    const rec = recRes.rows[0] as any;

    const empName = emp?.name || 'Unknown';
    const empPos = emp?.position || '-';
    const employeeNo = emp?.employee_no || null;

    // Use session value if employee match not found
    const recordedById = rec?.id || 0;
    const recName = rec?.name || session.name;
    const recPos = rec?.position || 'User';
    const recNo = rec?.employee_no || null;

    // 2. Execute writes in a batch
    const batchOps: any[] = [
      {
        sql: `
          INSERT INTO faktur_sequences (prefix, last_seq) VALUES (?, ?)
          ON CONFLICT(prefix) DO UPDATE SET last_seq = ?, updated_at = CURRENT_TIMESTAMP
        `,
        args: [datePrefix, newSeq, newSeq]
      },
      {
        sql: `INSERT INTO infractions (
          employee_id, employee_no, employee_name, employee_position,
          description, severity, date,
          recorded_by, recorded_by_id, recorded_by_no, recorded_by_name, recorded_by_position,
          order_name, order_faktur, item_faktur, faktur, jenis_barang, nama_barang, jenis_harga, jumlah, harga, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          employeeId, employeeNo, empName, empPos,
          description, severity, fullDate,
          recName, recordedById, recNo, recName, recPos,
          orderName, orderFaktur, itemFaktur, faktur, jenisBarang, namaBarang, jenisHarga, jumlah, harga, total
        ]
      }
    ];

    const batchRes = await db.batch(batchOps, "write");
    const infractionInsertRowsAffected = batchRes[1] as any;
    


    return NextResponse.json({ success: true, faktur });
  } catch (err: any) {
    console.error('Add infraction error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
