import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import db from '@/lib/db';

const SHEET_NAME = 'A.DATA KARYAWAN';
const START_ROW = 6; // data mulai baris 6 (1-indexed)

// Kolom index (0-based): A=0, B=1, C=2, J=9
const COL_B = 1; // filter: tidak kosong
const COL_C = 2; // Nama
const COL_J = 9; // Jabatan/Bagian

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Cari sheet "A.DATA KARYAWAN"
    if (!workbook.SheetNames.includes(SHEET_NAME)) {
      return NextResponse.json({
        error: `Sheet "${SHEET_NAME}" tidak ditemukan. Sheet yang ada: ${workbook.SheetNames.join(', ')}`
      }, { status: 400 });
    }

    const sheet = workbook.Sheets[SHEET_NAME];

    // Baca sebagai array-of-arrays (raw), tanpa header auto
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // Baris mulai dari START_ROW (1-indexed), jadi index = START_ROW - 1
    const dataRows = rows.slice(START_ROW - 1);

    // Nonaktifkan foreign key di luar transaksi (SQLite tidak izinkan di dalam transaksi)
    db.pragma('foreign_keys = OFF');

    const upsert = db.prepare(`
      INSERT INTO employees (name, position, department, employee_no) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(employee_no) DO UPDATE SET
        name = excluded.name,
        position = excluded.position
    `);

    const insertMany = db.transaction((validRows: any[][]) => {
      let count = 0;
      for (const row of validRows) {
        const colB = String(row[COL_B] ?? '').trim();
        if (!colB) continue;

        const name = String(row[COL_C] ?? '').trim();
        const position = String(row[COL_J] ?? '').trim();

        if (!name || /^\d+$/.test(name)) continue;

        upsert.run(name, position || '-', '-', colB);
        count++;
      }
      return count;
    });

    const imported = insertMany(dataRows);

    // Aktifkan kembali foreign key setelah selesai
    db.pragma('foreign_keys = ON');

    // Log the mass upload
    const rawData = JSON.stringify({
      total_imported: imported,
      filename: file.name,
      file_size: file.size
    });
    db.prepare(`
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES (?, ?, 0, ?, ?, 'Admin')
    `).run('IMPORT', 'employees', `Update Master Data Karyawan (${imported} baris)`, rawData);

    return NextResponse.json({ success: true, imported });
  } catch (err: any) {
    console.error('Import error:', err);
    return NextResponse.json({ error: `Error: ${err?.message || String(err)}` }, { status: 500 });
  }
}
