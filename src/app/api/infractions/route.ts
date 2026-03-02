import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const employeeId = parseInt(formData.get('employee_id') as string);
    const description = (formData.get('description') as string)?.trim() || '';
    const date = (formData.get('date') as string)?.trim();
    const recordedBy = (formData.get('recorded_by') as string)?.trim();
    const orderName = (formData.get('order_name') as string)?.trim();
    
    // New Fields
    const jenisBarang = (formData.get('jenis_barang') as string)?.trim();
    const namaBarang = (formData.get('nama_barang') as string)?.trim();
    const jenisHarga = (formData.get('jenis_harga') as string)?.trim();
    const jumlah = parseFloat(formData.get('jumlah') as string) || 0;
    const harga = parseFloat(formData.get('harga') as string) || 0;
    const total = parseFloat(formData.get('total') as string) || 0;

    const severity = 'Low'; // default, severitas dihapus dari UI

    if (!employeeId || !date || !recordedBy || !orderName) {
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

    // Hitung nomor seri terakhir untuk tanggal terkait dari tabel urutan permanen
    const countRow = db.prepare(
      `SELECT last_seq FROM faktur_sequences WHERE prefix = ?`
    ).get(datePrefix) as { last_seq: number } | undefined;
    
    const newSeq = (countRow?.last_seq ?? 0) + 1;
    const seq = String(newSeq).padStart(3, '0');
    const faktur = `ERR-${datePrefix}-${seq}`; // misal ERR-020126-001

    const insertResult = db.prepare(
      `INSERT INTO infractions (
        employee_id, description, severity, date, recorded_by, order_name, faktur,
        jenis_barang, nama_barang, jenis_harga, jumlah, harga, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      employeeId, description, severity, fullDate, recordedBy, orderName, faktur,
      jenisBarang, namaBarang, jenisHarga, jumlah, harga, total
    );

    // Update atau Simpan urutan nomor terakhir ke tabel permanen
    db.prepare(`
      INSERT INTO faktur_sequences (prefix, last_seq) 
      VALUES (?, ?)
      ON CONFLICT(prefix) DO UPDATE SET last_seq = ?, updated_at = CURRENT_TIMESTAMP
    `).run(datePrefix, newSeq, newSeq);

    // Dapatkan data karyawan untuk kebutuhan logging yang informatif
    const emp = db.prepare('SELECT name FROM employees WHERE id = ?').get(employeeId) as { name: string } | undefined;
    const empName = emp?.name || 'Unknown';

    // Log the created activity
    const rawData = JSON.stringify({
      employee_name: empName,
      description,
      faktur,
      date: fullDate,
      order_name: orderName
    });

    db.prepare(`
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('INSERT', 'infractions', insertResult.lastInsertRowid, `Tambah data kesalahan karyawan: ${empName}`, rawData, recordedBy);

    return NextResponse.json({ success: true, faktur });
  } catch (err: any) {
    console.error('Add infraction error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
