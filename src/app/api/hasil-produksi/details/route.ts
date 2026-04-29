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

    // 1. Prepare all queries for batch execution to reduce round-trips (Turso optimization)
    const queries: any[] = [];

    // Query 1: Available sections
    queries.push({
      sql: `SELECT DISTINCT bagian FROM jurnal_harian_produksi WHERE (no_order = ? OR no_order_2 = ?) AND bagian != ''`,
      args: [noSopd, noSopd]
    });

    // Query 2: Available jobs (using jenis_pekerjaan_2 to match frontend)
    let jobSql = `SELECT DISTINCT jenis_pekerjaan_2 as jenis_pekerjaan FROM jurnal_harian_produksi WHERE (no_order = ? OR no_order_2 = ?) AND jenis_pekerjaan_2 != ''`;
    const jobArgs: any[] = [noSopd, noSopd];
    if (bagian) {
      jobSql += ` AND bagian = ?`;
      jobArgs.push(bagian);
    }
    queries.push({ sql: jobSql, args: jobArgs });

    // Query 3: Barang Jadi Items
    let bjSql = `SELECT tgl, qty, satuan, faktur, nama_barang, nama_prd, raw_data 
                 FROM barang_jadi 
                 WHERE (faktur_prd LIKE ? OR nama_prd LIKE ?)`;
    const bjArgs: any[] = [`%${noSopd}%`, `%${noSopd}%`];

    if (startDate) {
      bjSql += ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2)) >= ?`;
      bjArgs.push(startDate);
    }
    if (endDate) {
      bjSql += ` AND (substr(tgl, 7, 4) || '-' || substr(tgl, 4, 2) || '-' || substr(tgl, 1, 2)) <= ?`;
      bjArgs.push(endDate);
    }
    bjSql += ` ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC`;
    queries.push({ sql: bjSql, args: bjArgs });

    // Query 4: Jurnal Items
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
      jSql += ` AND jenis_pekerjaan_2 = ?`;
      jArgs.push(pekerjaan);
    }
    jSql += ` ORDER BY tgl ASC`;
    queries.push({ sql: jSql, args: jArgs });

    // Execute all in one go
    const batchResults = await db.batch(queries);
    
    const availableBagian = (batchResults[0].rows as any[]).map(r => r.bagian);
    const availablePekerjaan = (batchResults[1].rows as any[]).map(r => r.jenis_pekerjaan);
    const bjRows = batchResults[2].rows as any[];
    let jurnalRows = batchResults[3].rows as any[];

    // 1. Calculate first occurrence for each job to enable grouping by job starting date
    const jobFirstDate: Record<string, string> = {};
    jurnalRows.forEach(row => {
      const job = row.jenis_pekerjaan_2 || '';
      if (!jobFirstDate[job] || row.tgl < jobFirstDate[job]) {
        jobFirstDate[job] = row.tgl;
      }
    });

    // 2. Sort rows: by Job's first appearance (ASC), then by Job name, then by actual row date (ASC)
    jurnalRows.sort((a, b) => {
      const jobA = a.jenis_pekerjaan_2 || '';
      const jobB = b.jenis_pekerjaan_2 || '';
      const firstA = jobFirstDate[jobA] || '9999-12-31';
      const firstB = jobFirstDate[jobB] || '9999-12-31';
      
      if (firstA !== firstB) return firstA.localeCompare(firstB);
      if (jobA !== jobB) return jobA.localeCompare(jobB);
      return a.tgl.localeCompare(b.tgl);
    });

    // Group barang_jadi by date (keep original logic)
    const groupedByDate: Record<string, { date: string, items: any[], total: number }> = {};
    let grandTotal = 0;

    bjRows.forEach(row => {
      let parsedRaw = {};
      if (row.raw_data) {
        try { parsedRaw = JSON.parse(row.raw_data); } catch (e) {}
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

    // 3. Group jurnal by Job (since they are now sorted by job)
    const groupedJurnal: Array<{ date: string, items: any[], totalRealisasi: number, totalRijek: number }> = [];
    let currentGroup: any = null;
    let grandTotalRealisasi = 0;
    let grandTotalRijek = 0;

    jurnalRows.forEach(row => {
      const job = row.jenis_pekerjaan_2 || '';
      if (!currentGroup || currentGroup.job !== job) {
        currentGroup = { 
          job, 
          date: jobFirstDate[job], // Use first date as the group date
          items: [], 
          totalRealisasi: 0, 
          totalRijek: 0 
        };
        groupedJurnal.push(currentGroup);
      }
      currentGroup.items.push(row);
      currentGroup.totalRealisasi += Number(row.realisasi || 0);
      currentGroup.totalRijek += Number(row.rijek || 0);
      grandTotalRealisasi += Number(row.realisasi || 0);
      grandTotalRijek += Number(row.rijek || 0);
    });

    return NextResponse.json({ 
      success: true, 
      barang_jadi: Object.values(groupedByDate),
      jurnal: groupedJurnal,
      grandTotal,
      grandTotalRealisasi,
      grandTotalRijek,
      unit: bjRows[0]?.satuan || '',
      availableBagian,
      availablePekerjaan
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
