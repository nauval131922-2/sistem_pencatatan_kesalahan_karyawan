import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const db = createClient({ url: `file:${process.env.DB_PATH || 'database_dev.sqlite'}` });

export async function GET() {
  try {
    const [bagianResult, karyawanResult] = await db.batch([
      { sql: `SELECT DISTINCT bagian FROM jurnal_harian_produksi WHERE bagian IS NOT NULL AND bagian != '' ORDER BY bagian ASC`, args: [] },
      { sql: `SELECT DISTINCT nama_karyawan, bagian FROM jurnal_harian_produksi WHERE nama_karyawan IS NOT NULL AND nama_karyawan != '' ORDER BY nama_karyawan ASC`, args: [] }
    ], 'read');

    const bagian = bagianResult.rows.map((r: any) => r.bagian as string);
    const karyawan = karyawanResult.rows.map((r: any) => ({ nama: r.nama_karyawan as string, bagian: r.bagian as string }));

    return NextResponse.json({ success: true, bagian, karyawan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
