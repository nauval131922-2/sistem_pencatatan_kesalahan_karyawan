import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    
    // Optional date filters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const bagian = searchParams.get("bagian");
    const namaKaryawan = searchParams.get("namaKaryawan");

    let whereParts: string[] = [];
    let args: any[] = [];

    if (search) {
      whereParts.push(`(nama_karyawan LIKE ? OR nama_order LIKE ? OR no_order LIKE ? OR jenis_pekerjaan LIKE ? OR nama_order_2 LIKE ? OR no_order_2 LIKE ?)`);
      const searchStr = `%${search}%`;
      args.push(searchStr, searchStr, searchStr, searchStr, searchStr, searchStr);
    }

    if (startDate && endDate) {
      whereParts.push(`(tgl BETWEEN ? AND ?)`);
      args.push(startDate, endDate);
    }

    if (bagian) {
      whereParts.push(`bagian = ?`);
      args.push(bagian);
    }

    if (namaKaryawan) {
      whereParts.push(`nama_karyawan = ?`);
      args.push(namaKaryawan);
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const sqlData = `SELECT * FROM jurnal_harian_produksi ${whereClause} 
      ORDER BY 
        tgl ASC, 
        CASE UPPER(bagian)
          WHEN 'SETTING' THEN 1
          WHEN 'QUALITY CONTROL' THEN 2
          WHEN 'CETAK' THEN 3
          WHEN 'FINISHING' THEN 4
          WHEN 'GUDANG' THEN 5
          WHEN 'TEKNISI' THEN 6
          ELSE 7
        END ASC,
        CASE WHEN jenis_pekerjaan LIKE '%Koordinasi%' THEN 0 ELSE 1 END ASC,
        absensi ASC, 
        id ASC 
      LIMIT ? OFFSET ?`;
    const sqlTotal = `SELECT COUNT(*) as count FROM jurnal_harian_produksi ${whereClause}`;

    const batchResults = await db.batch([
      { sql: sqlData, args: [...args, limit, offset] },
      { sql: sqlTotal, args }
    ], "read");

    const data = batchResults[0].rows;
    const total = Number((batchResults[1].rows[0] as any).count);

    return NextResponse.json({ success: true, data, total, page, limit });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await getSession();

    // Deteksi jika ini adalah request single insert dari form CRUD
    if (body.action === 'insert_single') {
      if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const {
        posisi, absensi, tgl, shift, nama_karyawan, no_order, nama_order,
        jenis_pekerjaan, keterangan, target, realisasi,
        no_order_2, nama_order_2, jenis_pekerjaan_2,
        bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala, bagian
      } = body.data;

      const cleanNumberOrText = (val: any) => {
        if (val === undefined || val === null || val === '') return '';
        const str = String(val).trim();
        // Cek jika murni angka dengan titik sebagai pemisah ribuan
        if (/^[0-9]+(\.[0-9]+)*$/.test(str)) {
          return Number(str.replace(/\./g, ''));
        }
        return str;
      };

      const cleanTarget = cleanNumberOrText(target);
      const cleanRealisasi = cleanNumberOrText(realisasi);

      try {
        await db.execute("ALTER TABLE jurnal_harian_produksi ADD COLUMN is_manual_input INTEGER DEFAULT 0");
      } catch (e) {} // Kolom sudah ada
      
      await db.execute({
        sql: `INSERT INTO jurnal_harian_produksi (
          posisi, absensi, tgl, shift, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, target, realisasi,
          no_order_2, nama_order_2, jenis_pekerjaan_2, bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala, bagian, is_manual_input
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        args: [
          posisi || '', Number(absensi) || 0, tgl || null, shift || '', nama_karyawan || '',
          no_order || '', nama_order || '', jenis_pekerjaan || '', keterangan || '', cleanTarget, cleanRealisasi,
          no_order_2 || '', nama_order_2 || '', jenis_pekerjaan_2 || '', bahan_kertas || '', Number(jml_plate) || 0,
          warna || '', Number(inscheet) || 0, Number(rijek) || 0, jam || '', kendala || '', bagian || ''
        ]
      });

      await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['INSERT', 'jurnal_harian_produksi', 0, `Tambah Jurnal Harian Produksi Baru`, JSON.stringify(body.data), session.username || 'System']
      });

      return NextResponse.json({ success: true });
    }

    // Default flow untuk bulk upload Excel
    const { filename, data: rawData, chunkIndex = 0, totalChunks = 1 } = body;

    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
       return NextResponse.json({ error: "Data Excel kosong atau format tidak sesuai." }, { status: 400 });
    }

    // Hanya hapus data lama jika ini adalah chunk pertama atau tanpa chunking, dan hanya hapus data hasil unggahan (is_manual_input = 0)
    if (chunkIndex === 0) {
      try {
        await db.execute("ALTER TABLE jurnal_harian_produksi ADD COLUMN is_manual_input INTEGER DEFAULT 0");
      } catch (e) {} // Kolom sudah ada
      await db.execute("DELETE FROM jurnal_harian_produksi WHERE is_manual_input = 0 OR is_manual_input IS NULL");
    }

    let importedCount = 0;
    let debugInfo: any = null;
    
    // Cari baris header untuk deteksi index kolom secara dinamis
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rawData.length, 20); i++) {
      if (rawData[i] && rawData[i].includes('Tanggal') && rawData[i].includes('Nama Karyawan')) {
        headerRowIndex = i;
        break;
      }
    }

    const getIdx = (name: string, defaultIdx: number) => {
      if (headerRowIndex === -1) return defaultIdx;
      const idx = rawData[headerRowIndex].findIndex((h: any) => String(h || '').toLowerCase().includes(name.toLowerCase()));
      return idx === -1 ? defaultIdx : idx;
    };

    // Deteksi index (dengan fallback ke index standar jika tidak ketemu)
    const idxPosisi = getIdx('Posisi', 1);
    const idxAbsensi = getIdx('Abs.', 2);
    const idxTgl = getIdx('Tanggal', 3);
    const idxShift = getIdx('Sift', 4);
    const idxNama = getIdx('Nama Karyawan', 5);
    const idxNoOrder = getIdx('NO. Order (PPIC)', 6);
    const idxNamaOrder = getIdx('Nama Order', 7);
    const idxJenisPekerjaan = getIdx('Jenis Pekerjaan', 8);
    const idxKeterangan = getIdx('Keterangan', 9);
    const idxTarget = getIdx('Target', 10);
    const idxRealisasi = getIdx('Realisasi', 11);
    const idxNoOrder2 = 12; // Biasanya sesudah Realisasi
    const idxNamaOrder2 = 13;
    const idxJenisPekerjaan2 = 14;
    const idxBahanKertas = getIdx('Bahan Kertas', 15);
    const idxJmlPlate = getIdx('Jml. Plate', 16);
    const idxWarna = getIdx('Warna', 17);
    const idxInscheet = getIdx('Inscheet', 18);
    const idxRijek = getIdx('Rijek', 19);
    const idxJam = getIdx('Jam', 20);
    const idxKendala = getIdx('Kendala', 21);
    const idxBagian = getIdx('Bagian', 23);
    
    // Fungsi untuk eksekusi bulk insert guna performa maksimal
    const BATCH_SIZE = 1000;
    let pendingRows: any[][] = [];
    
    const flushRows = async (rows: any[][]) => {
      if (rows.length === 0) return;
      const placeholders = rows.map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).join(', ');
      const args = rows.flat();
      const sql = `INSERT INTO jurnal_harian_produksi (
                posisi, absensi, tgl, shift, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, target, realisasi,
                no_order_2, nama_order_2, jenis_pekerjaan_2, bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala, bagian
              ) VALUES ${placeholders}`;
      await db.execute({ sql, args });
    };

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      // Lewati baris header itu sendiri
      if (headerRowIndex !== -1 && i <= headerRowIndex) continue;
      if (String(row[idxNama] || '').toLowerCase() === 'nama karyawan') continue;

      const posisi = String(row[idxPosisi] || '').trim();
      const absensi = parseFloat(row[idxAbsensi]) || 0;
      
      let tgl = null;
      if (row[idxTgl]) {
        if (typeof row[idxTgl] === 'number') {
           const excelEpoch = new Date(Date.UTC(1899, 11, 30));
           const dateObj = new Date(excelEpoch.getTime() + row[idxTgl] * 86400000);
           const yyyy = dateObj.getUTCFullYear();
           const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
           const dd = String(dateObj.getUTCDate()).padStart(2, '0');
           tgl = `${yyyy}-${mm}-${dd}`;
        } else {
           tgl = String(row[idxTgl]).trim();
        }
      }

      const shift = String(row[idxShift] || '').trim();
      const namaKaryawan = String(row[idxNama] || '').trim();
      
      // Validasi ketat: 
      // 1. Nama karyawan tidak boleh kosong, 'null', atau diawali tanda '-' (baris kategori)
      // 2. Tanggal harus valid (mengandung '-' untuk format YYYY-MM-DD atau merupakan angka Excel)
      const isValidDate = tgl && (tgl.includes('-') || typeof row[idxTgl] === 'number');
      const isCategoryRow = namaKaryawan.startsWith('-') || namaKaryawan.toLowerCase().includes('setting') || namaKaryawan.toLowerCase().includes('quality control');

      if (!tgl || !namaKaryawan || namaKaryawan === 'null' || !isValidDate || isCategoryRow) continue;

      const noOrder = String(row[idxNoOrder] || '').trim();
      const namaOrder = String(row[idxNamaOrder] || '').trim();
      const jenisPekerjaan = String(row[idxJenisPekerjaan] || '').trim();
      const keterangan = String(row[idxKeterangan] || '').trim();
      const target = Number(String(row[idxTarget] || '0').replace(/[^0-9.-]+/g, "")) || 0;
      const realisasi = Number(String(row[idxRealisasi] || '0').replace(/[^0-9.-]+/g, "")) || 0;
      const noOrder2 = String(row[idxNoOrder2] || '').trim();
      const namaOrder2 = String(row[idxNamaOrder2] || '').trim();
      const jenisPekerjaan2 = String(row[idxJenisPekerjaan2] || '').trim();
      const bahanKertas = String(row[idxBahanKertas] || '').trim();
      const jmlPlate = parseFloat(row[idxJmlPlate]) || 0;
      const warna = String(row[idxWarna] || '').trim();
      const inscheet = parseFloat(row[idxInscheet]) || 0;
      const rijek = parseFloat(row[idxRijek]) || 0;
      const jam = String(row[idxJam] || '').trim();
      const kendala = String(row[idxKendala] || '').trim();
      const bagian = String(row[idxBagian] || '').trim();

      pendingRows.push([
        posisi, absensi, tgl, shift, namaKaryawan, noOrder, namaOrder, jenisPekerjaan, keterangan, target, realisasi,
        noOrder2, namaOrder2, jenisPekerjaan2, bahanKertas, jmlPlate, warna, inscheet, rijek, jam, kendala, bagian
      ]);

      importedCount++;

      // Eksekusi batch saat ukuran batch tercapai
      if (pendingRows.length >= BATCH_SIZE) {
        await flushRows(pendingRows);
        pendingRows = [];
      }
    }

    // Eksekusi sisa baris
    await flushRows(pendingRows);

    // Log activity hanya pada chunk terakhir atau jika tidak ada chunking
    if (chunkIndex === totalChunks - 1) {
      const session = await getSession();
      await db.execute({
        sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          'UPLOAD', 
          'jurnal_harian_produksi', 
          0, 
          `Upload Jurnal Harian Produksi dari Excel (${filename})`, 
          JSON.stringify({ fileName: filename, chunks: totalChunks }),
          session?.username || 'System'
        ]
      });
    }

    return NextResponse.json({ 
      success: true, 
      importedCount, 
      debug: debugInfo 
    });

  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses file Excel", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...fields } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID tidak ditemukan' }, { status: 400 });

    const cleanNumberOrText = (val: any) => {
      if (val === undefined || val === null || val === '') return '';
      const str = String(val).trim();
      if (/^[0-9]+(\.[0-9]+)*$/.test(str)) {
        return Number(str.replace(/\./g, ''));
      }
      return str;
    };

    const updateParts: string[] = [];
    const updateArgs: any[] = [];

    const allowedFields = [
      'posisi', 'absensi', 'tgl', 'shift', 'nama_karyawan', 'no_order', 'nama_order',
      'jenis_pekerjaan', 'keterangan', 'target', 'realisasi',
      'no_order_2', 'nama_order_2', 'jenis_pekerjaan_2',
      'bahan_kertas', 'jml_plate', 'warna', 'inscheet', 'rijek', 'jam', 'kendala', 'bagian'
    ];

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        updateParts.push(`${key} = ?`);
        if (key === 'target' || key === 'realisasi') {
          updateArgs.push(cleanNumberOrText(value));
        } else if (['absensi', 'jml_plate', 'inscheet', 'rijek'].includes(key)) {
          updateArgs.push(Number(value) || 0);
        } else {
          updateArgs.push(value || (key === 'tgl' ? null : ''));
        }
      }
    }

    if (updateParts.length > 0) {
      updateArgs.push(id);
      await db.execute({
        sql: `UPDATE jurnal_harian_produksi SET ${updateParts.join(', ')} WHERE id = ?`,
        args: updateArgs
      });
    }

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['UPDATE', 'jurnal_harian_produksi', id, `Update Jurnal Harian Produksi ID #${id}`, JSON.stringify({ id }), session.username || 'System']
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs tidak valid' }, { status: 400 });
    }

    const placeholders = ids.map(() => '?').join(', ');
    await db.execute({
      sql: `DELETE FROM jurnal_harian_produksi WHERE id IN (${placeholders})`,
      args: ids
    });

    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['DELETE', 'jurnal_harian_produksi', 0, `Hapus ${ids.length} baris Jurnal Harian Produksi`, JSON.stringify({ ids }), session.username || 'System']
    });

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
