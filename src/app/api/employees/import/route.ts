import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

const SHEET_NAME = 'A.DATA KARYAWAN';
const START_ROW = 6; 

const COL_A = 0; // ID Karyawan (employee_no)
const COL_B = 1; // filter: tidak kosong (baris valid)
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
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      cellFormula: false,
      cellHTML: false,
      cellStyles: false,
      cellText: false,
      cellDates: false
    });

    if (!workbook.SheetNames.includes(SHEET_NAME)) {
      return NextResponse.json({
        error: `Sheet "${SHEET_NAME}" tidak ditemukan. Sheet yang ada: ${workbook.SheetNames.join(', ')}`
      }, { status: 400 });
    }

    const sheet = workbook.Sheets[SHEET_NAME];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const dataRows = rows.slice(START_ROW - 1);

    const batchOps: any[] = [
        { sql: `UPDATE employees SET is_active = 0 WHERE employee_no IS NOT NULL AND employee_no != ''`, args: [] }
    ];
    let importedCount = 0;

    for (const row of dataRows) {
        const colA = String(row[COL_A] ?? '').trim();
        const colB = String(row[COL_B] ?? '').trim();
        if (!colB) continue;

        const name = String(row[COL_C] ?? '').trim();
        const position = String(row[COL_J] ?? '').trim();

        if (!name || /^\d+$/.test(name)) continue;

        batchOps.push({
            sql: `
              INSERT INTO employees (name, position, department, employee_no, is_active) 
              VALUES (?, ?, ?, ?, 1)
              ON CONFLICT(employee_no) DO UPDATE SET
                name = excluded.name,
                position = excluded.position,
                is_active = 1
            `,
            args: [name, position || '-', '-', colA]
        });
        importedCount++;
    }

    const chunkSize = 100;
    for (let i = 0; i < batchOps.length; i += chunkSize) {
        await db.batch(batchOps.slice(i, i + chunkSize), "write");
    }

    const rawData = JSON.stringify({
      total_imported: importedCount,
      filename: file.name,
      file_size: file.size
    });
    
    const session = await getSession();

    await db.execute({
      sql: `
        INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
        VALUES (?, ?, 0, ?, ?, ?)
      `,
      args: ['IMPORT', 'employees', `Update Master Data Karyawan (${importedCount} baris)`, rawData, session?.username || 'System']
    });

    return NextResponse.json({ success: true, imported: importedCount });
  } catch (err: any) {
    console.error('Import error:', err);
    return NextResponse.json({ error: `Error: ${err?.message || String(err)}` }, { status: 500 });
  }
}
