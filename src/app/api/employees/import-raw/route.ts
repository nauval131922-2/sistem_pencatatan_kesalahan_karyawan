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
    const filename = req.headers.get('x-filename') || 'uploaded_file.xlsx';
    const contentLength = req.headers.get('content-length');
    console.log(`[IMPORT-RAW] Received request for: ${filename}`);
    console.log(`[IMPORT-RAW] Content-Length header: ${contentLength}`);

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[IMPORT-RAW] Buffer size: ${buffer.length} bytes`);
    console.log(`[IMPORT-RAW] Buffer header (hex): ${buffer.slice(0, 8).toString('hex')}`);
    
    if (contentLength && parseInt(contentLength) !== buffer.length) {
      console.warn(`[IMPORT-RAW] Mismatch: Content-Length ${contentLength} vs Received ${buffer.length}`);
    }

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

        const session = await getSession();

        batchOps.push({
            sql: `
              INSERT INTO employees (name, position, department, employee_no, is_active, recorded_by) 
              VALUES (?, ?, ?, ?, 1, ?)
              ON CONFLICT(employee_no) DO UPDATE SET
                name = excluded.name,
                position = excluded.position,
                is_active = 1,
                recorded_by = excluded.recorded_by
            `,
            args: [name, position || '-', '-', colA, session?.username || 'System']
        });
        importedCount++;
    }

    const chunkSize = 100;
    for (let i = 0; i < batchOps.length; i += chunkSize) {
        await db.batch(batchOps.slice(i, i + chunkSize), "write");
    }

    const session = await getSession();
    await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
            'IMPORT', 
            'employees', 
            0, 
            `Import Karyawan dari Excel (${importedCount} data)`, 
            JSON.stringify({ filename, imported: importedCount }),
            session?.username || 'System'
        ]
    });
    return NextResponse.json({ success: true, imported: importedCount });
  } catch (err: any) {
    console.error('Import error:', err);
    return NextResponse.json({ error: `Error: ${err?.message || String(err)}` }, { status: 500 });
  }
}
