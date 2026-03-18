import { NextRequest, NextResponse } from 'next/server';

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
    const { filename, rows } = await req.json();

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    }

    const dataRows = rows.slice(START_ROW - 1);


    const batchOps: any[] = [
        { sql: `UPDATE employees SET is_active = 0 WHERE employee_no IS NOT NULL AND employee_no != ''`, args: [] }
    ];
    let importedCount = 0;

    const session = await getSession();
    const currentUser = session?.username || 'System';

    for (const row of dataRows) {
        const colA = String(row[COL_A] ?? '').trim();
        const colB = String(row[COL_B] ?? '').trim();
        if (!colB) continue;

        const name = String(row[COL_C] ?? '').trim();
        const position = String(row[COL_J] ?? '').trim();

        if (!name || /^\d+$/.test(name)) continue;

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
            args: [name, position || '-', '-', colA, currentUser]
        });
        importedCount++;
    }

    const chunkSize = 100;
    for (let i = 0; i < batchOps.length; i += chunkSize) {
        await db.batch(batchOps.slice(i, i + chunkSize), "write");
    }

    await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
            'IMPORT', 
            'employees', 
            0, 
            `Import Karyawan dari Excel (${importedCount} data)`, 
            JSON.stringify({ filename, imported: importedCount }),
            currentUser
        ]
    });
    return NextResponse.json({ success: true, imported: importedCount });
  } catch (err: any) {
    console.error('Import error:', err);
    return NextResponse.json({ error: `Error: ${err?.message || String(err)}` }, { status: 500 });
  }
}
