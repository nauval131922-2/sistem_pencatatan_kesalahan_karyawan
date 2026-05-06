# 📖 Tutorial 14: Stabilisasi Jurnal Harian Produksi & Laporan Jadwal Harian

Tutorial ini menjelaskan langkah-langkah untuk memperkuat integritas data pada modul **Jurnal Harian Produksi (JHP)** dan pembuatan halaman laporan **Jadwal Harian** yang siap cetak.

---

## 1. Perlindungan Data Manual (`is_manual_input`)

Sistem kini dapat membedakan data hasil sinkronisasi otomatis (Excel) dan data yang diinput manual oleh user.

### Langkah Implementasi:
1. **Skema Database**: Tambahkan kolom `is_manual_input` pada tabel `jurnal_harian_produksi`.
   ```sql
   ALTER TABLE jurnal_harian_produksi ADD COLUMN is_manual_input INTEGER DEFAULT 0;
   ```
2. **Logika API (POST)**: Saat melakukan upload Excel, sistem hanya menghapus data lama yang memiliki `is_manual_input = 0` (atau NULL).
   ```typescript
   // Di src/app/api/jurnal-harian-produksi/route.ts
   await db.execute({
     sql: "DELETE FROM jurnal_harian_produksi WHERE tgl = ? AND (is_manual_input = 0 OR is_manual_input IS NULL)",
     args: [tgl]
   });
   ```
3. **Input Manual**: Setiap data yang dibuat melalui form aplikasi wajib menyertakan `is_manual_input: 1`.

---

## 2. Optimasi Pengurutan (Sorting)

Data pada Jurnal Harian kini diurutkan secara logis berdasarkan alur kerja pabrik:
1. **Tanggal** (`tgl` ASC)
2. **Bagian** (Custom order: SETTING -> QC -> CETAK -> FINISHING -> GUDANG -> TEKNISI)
3. **Absensi** (Nomor urut karyawan)
4. **Waktu Pembuatan** (`created_at`)

### Implementasi SQL:
```sql
ORDER BY 
  tgl ASC,
  CASE bagian
    WHEN 'SETTING' THEN 1
    WHEN 'QUALITY CONTROL' THEN 2
    WHEN 'CETAK' THEN 3
    WHEN 'FINISHING' THEN 4
    WHEN 'GUDANG' THEN 5
    WHEN 'TEKNISI' THEN 6
    ELSE 99
  END ASC,
  absensi ASC,
  created_at ASC
```

---

## 3. Halaman Jadwal Produksi Harian

Halaman baru di `/jurnal-harian-produksi/target` disediakan untuk kebutuhan cetak operasional.

### Fitur Utama:
- **Mapping Jam Otomatis**: Shift 1 (07.00-15.00), Shift 2 (15.00-23.00), Shift 3 (23.00-07.00).
- **Redesign UI**: Menggunakan komponen `PageHeader` standar dan layout yang bersih tanpa elemen interaktif yang mengganggu saat dicetak.
- **Ekspor Gambar**: Menggunakan library `modern-screenshot` untuk mengunduh laporan sebagai gambar PNG berkualitas tinggi (mendukung CSS modern seperti `oklch`).

---

## 4. Perbaikan Error `html2canvas`

Jika Anda menggunakan Tailwind v4, library `html2canvas` mungkin gagal memproses warna modern (`lab`, `oklch`). 

**Solusi**: Gunakan `modern-screenshot`.
1. **Install**: `npm install modern-screenshot`
2. **Penggunaan**:
   ```typescript
   import { domToPng } from 'modern-screenshot';
   
   const dataUrl = await domToPng(element, { scale: 2, backgroundColor: '#ffffff' });
   ```

---

## 5. Pembersihan Antarmuka

Untuk menjaga konsistensi dan profesionalisme:
- Gunakan **Sentence Case** (bukan `uppercase` paksa) pada header tabel dan nama perusahaan.
- Hilangkan elemen yang tidak perlu pada laporan cetak (tanda tangan, total target, watermark sistem) sesuai kebutuhan operasional.
- Gunakan `DatePicker` standar SINTAK untuk pemilihan tanggal yang konsisten.
