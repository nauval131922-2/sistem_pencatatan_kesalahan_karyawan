import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { apiError, validateRequest } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity';


export const dynamic = 'force-dynamic';

// Helper functions moved out of handler
function getTimeString(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function parseIndoNum(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const clean = value.replace(/\./g, '').replace(/,/g, '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

function generateDatePrefix(dateStr: string): string {
  const dateObj = new Date(dateStr.substring(0, 10));
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yy = String(dateObj.getFullYear()).substring(2);
  return `${dd}${mm}${yy}`;
}

/**
 * GET handler - Fetch infractions with optional date filter
 */
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
      query += ` WHERE i.date >= ? AND i.date <= ?`;
      params.push(`${start} 00:00:00`, `${end} 23:59:59`);
    }

    query += ` ORDER BY i.date DESC, i.id DESC`;

    const result = await db.execute({ sql: query, args: params });

    return NextResponse.json({ data: result.rows });


  } catch (err: any) {
    console.error('Infractions GET error:', err);
    return apiError('Failed to fetch infractions', 500, { stack: err.stack });
  }
}

/**
 * POST handler - Create new infraction
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body (JSON or form-data)
    const contentType = req.headers.get('content-type') || '';
    let data: any = {};

    if (contentType.includes('application/json')) {
      data = await req.json();
    } else {
      data = await req.formData();
      // Convert FormData to plain object
      const plain: any = {};
      data.forEach((value: FormDataEntryValue, key: string) => {
        plain[key] = value;
      });

      data = plain;
    }

    // Validate required fields
    const requiredFields = ['employee_id', 'date', 'order_faktur', 'description'];
    const validation = validateRequest(data, requiredFields);
    if (!validation.valid) {
      return apiError(validation.error!, 400);
    }

    // Extract and parse fields
    const employeeId = parseInt(data.employee_id as string);
    const description = (data.description as string)?.trim();
    const date = (data.date as string)?.trim();
    const orderFaktur = (data.order_faktur as string)?.trim();
    const orderName = (data.order_name as string)?.trim() || null;
    const itemFaktur = (data.item_faktur as string)?.trim() || null;
    const jenisBarang = (data.jenis_barang as string)?.trim() || null;
    const namaBarang = (data.nama_barang as string)?.trim() || null;
    const jenisHarga = (data.jenis_harga as string)?.trim() || null;

    // Parse Indonesian number format
    const jumlah = parseIndoNum(data.jumlah);
    const harga = parseIndoNum(data.harga);
    const total = parseIndoNum(data.total);

    if (isNaN(jumlah) || isNaN(harga) || isNaN(total)) {
      return apiError('Format angka (jumlah/harga/total) tidak valid.', 400);
    }

    const severity = (data.severity as string) || 'Low';

    // Check session
    const session = await getSession();
    if (!session) {
      return apiError('Sesi tidak ditemukan. Silakan login kembali.', 401);
    }

    // Build full date with time
    const fullDate = date.length === 10 ? `${date} ${getTimeString()}` : date;
    const datePrefix = generateDatePrefix(date);

    // Fetch sequence and employee/recorder info in parallel
    const [seqRes, empRes, recRes] = await Promise.all([
      db.execute({ sql: `SELECT last_seq FROM faktur_sequences WHERE prefix = ?`, args: [datePrefix] }),
      db.execute({ sql: 'SELECT name, position, employee_no FROM employees WHERE id = ?', args: [employeeId] }),
      db.execute({ sql: 'SELECT id, name, position, employee_no FROM employees WHERE name = ? ORDER BY id ASC LIMIT 1', args: [session.name] })
    ]);

    const seqRow = seqRes.rows[0] as any;
    const lastSeq = seqRow?.last_seq;
    const newSeq = (typeof lastSeq === 'number' ? lastSeq : 0) + 1;
    const faktur = `ERR-${datePrefix}-${String(newSeq).padStart(3, '0')}`;

    const emp = empRes.rows[0] as any;
    const rec = recRes.rows[0] as any;

    if (!emp) {
      return apiError('Karyawan tidak ditemukan di database.', 404);
    }

    // Prepare batch operations
    const batchOps: any[] = [
      {
        sql: `
          INSERT INTO faktur_sequences (prefix, last_seq) VALUES (?, ?)
          ON CONFLICT(prefix) DO UPDATE SET last_seq = ?, updated_at = CURRENT_TIMESTAMP
        `,
        args: [datePrefix, newSeq, newSeq]
      },
      {
        sql: `
          INSERT INTO infractions (
            employee_id, employee_no, employee_name, employee_position,
            description, severity, date,
            recorded_by, recorded_by_id, recorded_by_no, recorded_by_name, recorded_by_position,
            order_name, order_faktur, item_faktur, faktur, jenis_barang, nama_barang, jenis_harga, jumlah, harga, total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          employeeId, emp.employee_no, emp.name, emp.position,
          description, severity, fullDate,
          rec?.name || session.name, rec?.id || 0, rec?.employee_no || null, rec?.name || session.name, rec?.position || 'User',
          orderName, orderFaktur, itemFaktur, faktur, jenisBarang, namaBarang, jenisHarga, jumlah, harga, total
        ]
      }
    ];

    await db.batch(batchOps, 'write');

    return NextResponse.json({ success: true, faktur });
  } catch (err: any) {
    console.error('Add infraction error:', err);
    return apiError('Gagal mencatat kesalahan. Silakan coba lagi.', 500, { stack: err.stack });
  }
}
