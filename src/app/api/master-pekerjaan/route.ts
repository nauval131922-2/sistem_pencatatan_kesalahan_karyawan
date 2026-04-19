
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search') || '';
  const category = request.nextUrl.searchParams.get('category') || '';
  const subCategory = request.nextUrl.searchParams.get('sub_category') || '';
  const group = request.nextUrl.searchParams.get('group') || '';
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
  const debug = request.nextUrl.searchParams.get('debug') === 'true';
  const offset = (page - 1) * limit;

  try {
    let where = '1=1';
    const args: any[] = [];

    if (search) {
      where += ' AND (code LIKE ? OR name LIKE ?)';
      args.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      const prefix = category.trim().split(' ')[0].replace(/\.+$/, ''); // 'A.' -> 'A', 'PRA' -> 'PRA'
      if (prefix.length === 1 && /^[A-Z]$/i.test(prefix)) {
        where += ' AND code LIKE ?';
        args.push(`${prefix}.%`);
      } else {
        where += ' AND category LIKE ?';
        args.push(`%${category.trim()}%`);
      }
    }
    if (subCategory) {
      const prefix = subCategory.trim().split(' ')[0]; // 'A.a.'
      if (prefix.includes('.') || prefix.length <= 2) {
        where += ' AND code LIKE ?';
        args.push(`${prefix}%`);
      } else {
        where += ' AND sub_category LIKE ?';
        args.push(`%${subCategory.trim()}%`);
      }
    }
    if (group) {
      const prefix = group.trim().split(' ')[0]; // 'A.a.a.'
      if (prefix.includes('.') || prefix.length <= 2) {
        where += ' AND code LIKE ?';
        args.push(`${prefix}%`);
      } else {
        where += ' AND group_pekerjaan LIKE ?';
        args.push(`%${group.trim()}%`);
      }
    }

    if (debug) {
      const debugData = await db.execute('SELECT category, sub_category, group_pekerjaan, code FROM master_pekerjaan LIMIT 5');
      console.log('[DEBUG DB DATA]', JSON.stringify(debugData.rows, null, 2));
      return NextResponse.json({ debug: debugData.rows });
    }

    const result = await db.execute({ sql: `SELECT * FROM master_pekerjaan WHERE ${where}`, args });
    const allData = result.rows as any[];

    // Perform Natural Sort (e.g., C.a.d.19 comes before C.a.d.100)
    allData.sort((a, b) => {
      return String(a.code).localeCompare(String(b.code), undefined, { numeric: true, sensitivity: 'base' });
    });

    const totalCount = allData.length;
    const paginatedData = allData.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      total: totalCount,
      page,
      limit,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, data } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    }

    // Clear existing data before import (assuming full refresh like SOPd)
    const batchOps: any[] = [
      { sql: 'DELETE FROM master_pekerjaan', args: [] }
    ];

    let imported = 0;
    for (const item of data) {
      batchOps.push({
        sql: `INSERT INTO master_pekerjaan (
          code, name, category, sub_category, group_pekerjaan,
          target_value, standart_target,
          ket_1, ket_2, ket_3, ket_4, ket_5, ket_6, ket_7,
          unit_mesin, jumlah_plate, target_per_jam_plate,
          persiapan_mesin, waktu_ganti_plate, jml_gosok_plate, waktu_gosok_plate,
          asumsi_target_per_hari, target_per_hari, target_per_jam,
          efektif_jam_kerja, keterangan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          item.code, item.name,
          item.category || null, item.subCategory || null, item.groupPekerjaan || null,
          item.targetValue ?? null, item.standartTarget ?? null,
          item.ket1 ?? null, item.ket2 ?? null, item.ket3 ?? null,
          item.ket4 ?? null, item.ket5 ?? null, item.ket6 ?? null, item.ket7 ?? null,
          item.unitMesin || null, item.jumlahPlate ?? null, item.targetPerJamPlate ?? null,
          item.persiapanMesin ?? null, item.waktuGantiPlate ?? null,
          item.jmlGosokPlate ?? null, item.waktuGosokPlate ?? null,
          item.asumsiTargetPerHari ?? null, item.targetPerHari ?? null,
          item.targetPerJam ?? null, item.efektifJamKerja ?? null,
          item.keterangan || null,
        ],
      });

      imported++;
    }

    await db.batch(batchOps, 'write');

    const session = await getSession();

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        'UPLOAD', 
        'master_pekerjaan', 
        0, 
        `Upload Master Pekerjaan dari Excel (${imported} data)`, 
        JSON.stringify({ fileName: filename || 'Unknown File', imported }),
        session?.username || 'System'
      ]
    });

    return NextResponse.json({ success: true, imported });
  } catch (error: any) {
    console.error("Master Pekerjaan Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
