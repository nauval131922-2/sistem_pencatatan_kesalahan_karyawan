import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const employeeId = parseInt(formData.get('employee_id') as string);
    const description = (formData.get('description') as string)?.trim() || '';
    const date = (formData.get('date') as string)?.trim();
    const recordedById = parseInt(formData.get('recorded_by_id') as string);
    const orderFaktur = (formData.get('order_faktur') as string)?.trim();
    const orderName = (formData.get('order_name') as string)?.trim();
    
    const itemFaktur = (formData.get('item_faktur') as string)?.trim();
    
    // New Fields
    const jenisBarang = (formData.get('jenis_barang') as string)?.trim();
    const namaBarang = (formData.get('nama_barang') as string)?.trim();
    const jenisHarga = (formData.get('jenis_harga') as string)?.trim();
    const jumlah = parseFloat(formData.get('jumlah') as string) || 0;
    const harga = parseFloat(formData.get('harga') as string) || 0;
    const total = parseFloat(formData.get('total') as string) || 0;
    const severity = 'Low'; // default
 
    if (!employeeId || !date || !recordedById || !orderFaktur) {
      return NextResponse.json({ error: 'Data tidak lengkap. Pastikan Order Produksi sudah dipilih.' }, { status: 400 });
    }

    // Append time if only date given
    let fullDate = date;
    if (date.length === 10) {
      const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
      fullDate = `${date} ${time}`;
    }

    // Generate faktur: DDMMYY-XXX berdasarkan tanggal input (bukan tanggal komputer/hari ini)
    // `date` formatnya YYYY-MM-DD
    const dateObj = new Date(date.substring(0, 10)); // pastikan mengambil YYYY-MM-DD saja
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).substring(2); // Ambil 2 digit tahun terakhir
    const datePrefix = `${dd}${mm}${yy}`; // misal 020126

    // Jalankan dalam transaksi agar nomor faktur tidak ganda meskipun bersamaan
    const result = db.transaction(() => {
      // 1. Hitung nomor seri terakhir
      const countRow = db.prepare(
        `SELECT last_seq FROM faktur_sequences WHERE prefix = ?`
      ).get(datePrefix) as { last_seq: number } | undefined;
      
      const newSeq = (countRow?.last_seq ?? 0) + 1;
      const seq = String(newSeq).padStart(3, '0');
      const faktur = `ERR-${datePrefix}-${seq}`;

      // 2. Simpan urutan nomor terakhir
      db.prepare(`
        INSERT INTO faktur_sequences (prefix, last_seq) 
        VALUES (?, ?)
        ON CONFLICT(prefix) DO UPDATE SET last_seq = ?, updated_at = CURRENT_TIMESTAMP
      `).run(datePrefix, newSeq, newSeq);

      // 3. Dapatkan data karyawan (Pelaku)
      const emp = db.prepare('SELECT name, employee_no FROM employees WHERE id = ?').get(employeeId) as { name: string, employee_no: string } | undefined;
      const empName = emp?.name || 'Unknown';
      const employeeNo = emp?.employee_no || null;

      // 3b. Dapatkan data karyawan (Pencatat)
      const rec = db.prepare('SELECT name, employee_no FROM employees WHERE id = ?').get(recordedById) as { name: string, employee_no: string } | undefined;
      const recName = rec?.name || 'Unknown';
      const recNo = rec?.employee_no || null;

      // 4. Masukkan data kesalahan
      const insertResult = db.prepare(
        `INSERT INTO infractions (
          employee_id, employee_no, description, severity, date, recorded_by, recorded_by_id, recorded_by_no, 
          order_name, order_faktur, item_faktur, faktur, jenis_barang, nama_barang, jenis_harga, jumlah, harga, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        employeeId, employeeNo, description, severity, fullDate, recName, recordedById, recNo,
        orderName, orderFaktur, itemFaktur, faktur, jenisBarang, namaBarang, jenisHarga, jumlah, harga, total
      );

      return { faktur, empName, employeeNo, recName, recordedByIdResult: recordedById, insertId: insertResult.lastInsertRowid };
    })();

    const { faktur, empName, employeeNo, recName, insertId } = result;

    // Log the created activity
    const rawData = JSON.stringify({
      employee_no: employeeNo,
      employee_name: empName,
      description,
      faktur,
      date: fullDate,
      order_name: orderName
    });

    db.prepare(`
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('INSERT', 'infractions', insertId, `Tambah data kesalahan: ${employeeNo ? `${employeeNo} - ` : ''}${empName}`, rawData, recName);

    return NextResponse.json({ success: true, faktur });
  } catch (err: any) {
    console.error('Add infraction error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
