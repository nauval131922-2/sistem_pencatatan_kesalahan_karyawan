import { NextRequest, NextResponse } from 'next/server';
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noSopd = searchParams.get('no_sopd');
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD
    const endDate = searchParams.get('endDate');     // YYYY-MM-DD
    const bagian = searchParams.get('bagian');
    const pekerjaan = searchParams.get('pekerjaan');

    if (!noSopd) {
      return NextResponse.json({ error: 'no_sopd is required' }, { status: 400 });
    }

    // Fetch available sections for this SOPd (for the filter dropdown)
    const sectionsRes = await db.execute({
      sql: `SELECT DISTINCT bagian FROM jurnal_harian_produksi WHERE (no_order = ? OR no_order_2 = ?) AND bagian != ''`,
      args: [noSopd, noSopd]
    });
    const availableBagian = (sectionsRes.rows as any[]).map(r => r.bagian);

    // Fetch available jobs (jenis_pekerjaan) for this SOPd and Bagian
    let jobSql = `SELECT DISTINCT jenis_pekerjaan FROM jurnal_harian_produksi WHERE (no_order = ? OR no_order_2 = ?) AND jenis_pekerjaan != ''`;
    const jobArgs: any[] = [noSopd, noSopd];
    if (bagian) {
      jobSql += ` AND bagian = ?`;
      jobArgs.push(bagian);
    }
    const jobsRes = await db.execute({
      sql: jobSql,
      args: jobArgs
    });
    const availablePekerjaan = (jobsRes.rows as any[]).map(r => r.jenis_pekerjaan);

    // Build conditions for barang_jadi
    let bjSql = `SELECT tgl, qty, satuan, faktur, nama_barang, raw_data 
                 FROM barang_jadi 
                 WHERE faktur_prd LIKE ?`;
    const bjArgs: any[] = [`%${noSopd}%`];

    if (startDate) {
      // Convert DD-MM-YYYY to YYYY-MM-DD for comparison
      bjSql += ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2)) >= ?`;
      bjArgs.push(startDate);
    }
    if (endDate) {
      bjSql += ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2)) <= ?`;
      bjArgs.push(endDate);
    }
    bjSql += ` ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC`;

    const res = await db.execute({
      sql: bjSql,
      args: bjArgs
    });

    const rows = res.rows as any[];
    
    // Build conditions for jurnal
    let jSql = `SELECT tgl, nama_karyawan, realisasi, target, keterangan, jam, kendala, bagian,
                       no_order_2, nama_order_2, jenis_pekerjaan_2, bahan_kertas, jml_plate, warna, inscheet, rijek
                FROM jurnal_harian_produksi
                WHERE (no_order = ? OR no_order_2 = ?)`;
    const jArgs: any[] = [noSopd, noSopd];

    if (startDate) {
      jSql += ` AND tgl >= ?`;
      jArgs.push(startDate);
    }
    if (endDate) {
      jSql += ` AND tgl <= ?`;
      jArgs.push(endDate);
    }
    if (bagian) {
      jSql += ` AND bagian = ?`;
      jArgs.push(bagian);
    }
    if (pekerjaan) {
      jSql += ` AND jenis_pekerjaan = ?`;
      jArgs.push(pekerjaan);
    }
    jSql += ` ORDER BY tgl DESC`;

    const jurnalRes = await db.execute({
      sql: jSql,
      args: jArgs
    });
    const jurnalRows = jurnalRes.rows as any[];

    // Group barang_jadi by date
    const groupedByDate: Record<string, { date: string, items: any[], total: number }> = {};
    let grandTotal = 0;

    rows.forEach(row => {
      // Parse raw_data if exists to get missing fields like 'satuan'
      let parsedRaw = {};
      if (row.raw_data) {
        try {
          parsedRaw = JSON.parse(row.raw_data);
        } catch (e) {}
      }
      
      const mergedRow = { ...row, ...parsedRaw };
      const date = mergedRow.tgl;
      if (!groupedByDate[date]) {
        groupedByDate[date] = { date, items: [], total: 0 };
      }
      groupedByDate[date].items.push(mergedRow);
      groupedByDate[date].total += Number(mergedRow.qty || 0);
      grandTotal += Number(mergedRow.qty || 0);
    });

    // Group jurnal by date
    const groupedJurnal: Record<string, { date: string, items: any[], totalRealisasi: number, totalRijek: number }> = {};
    let grandTotalRealisasi = 0;
    let grandTotalRijek = 0;

    jurnalRows.forEach(row => {
      // Date in jurnal is YYYY-MM-DD
      const date = row.tgl; 
      if (!groupedJurnal[date]) {
        groupedJurnal[date] = { date, items: [], totalRealisasi: 0, totalRijek: 0 };
      }
      groupedJurnal[date].items.push(row);
      groupedJurnal[date].totalRealisasi += Number(row.realisasi || 0);
      groupedJurnal[date].totalRijek += Number(row.rijek || 0);
      grandTotalRealisasi += Number(row.realisasi || 0);
      grandTotalRijek += Number(row.rijek || 0);
    });

    return NextResponse.json({ 
      success: true, 
      barang_jadi: Object.values(groupedByDate),
      jurnal: Object.values(groupedJurnal),
      grandTotal,
      grandTotalRealisasi,
      grandTotalRijek,
      unit: rows[0]?.satuan || '',
      availableBagian,
      availablePekerjaan
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
