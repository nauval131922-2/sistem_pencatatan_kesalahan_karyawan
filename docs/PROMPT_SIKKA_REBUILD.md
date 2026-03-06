# Prompt Master untuk Membangun SIKKA (Modular)

Gunakan daftar prompt ini secara berurutan untuk membangun sistem serupa SIKKA. Setiap prompt dirancang agar AI fokus pada satu bagian spesifik sehingga hasilnya lebih detail dan minim bug.

---

## 1. Fondasi & Arsitektur Database
**Tujuan**: Menyiapkan struktur folder, skema database, dan tema visual utama.

```text
Saya ingin membangun website internal bernama SIKKA (Sistem Pencatatan Kesalahan) menggunakan Next.js 14 App Router, TypeScript, dan SQLite (better-sqlite3).

Tampilan: Gunakan desain premium dengan nuansa Emerald/Green, Glassmorphism, dan font modern (Inter/Inter Tight).

Langkah Pertama:
1. Buat skema database SQLite yang mencakup tabel:
   - employees: id, name, position, employee_no, is_active.
   - orders: id, faktur, nama_prd, tgl, status.
   - infractions: id, faktur (auto-gen), employee_id, description, severity, date, harga, jumlah, total, order_name, item_faktur, jenis_barang, jenis_harga.
   - activity_logs: pencatatan log sistem.
2. Siapkan API route dasar untuk CRUD ke tabel-tabel tersebut.
3. Buat layout utama dengan sidebar navigasi yang responsif menggunakan Lucide Icons.
```

---

## 2. Fitur Master Data Karyawan & Excel Upload
**Tujuan**: Manajemen data dasar dan import data massal.

```text
Buat fitur Manajemen Karyawan:
1. Halaman Daftar Karyawan: Gunakan tabel dengan fitur Pencarian (Search), Pagination, dan Infinite Scrolling.
2. Komponen Excel Upload: Gunakan library 'xlsx' untuk membaca file Excel.
   - Fitur harus memiliki "Preview" sebelum data disimpan ke database.
   - Gunakan Dialog Konfirmasi (ConfirmDialog) yang cantik sebelum proses upload dimulai.
   - Tambahkan Activity Log setiap kali ada data yang di-import.
```

---

## 3. Fitur Scraper Data Eksternal (Digit)
**Tujuan**: Mengambil data dinamis dari API pihak ketiga.

```text
Bangun modul Scraper untuk mengambil data dari sistem 'Digit':
1. Buat API Route yang melakukan fetch ke endpoint eksternal berdasarkan rentang tanggal.
2. Buat Client Component (misal: OrderProduksiClient) yang memiliki:
   - DatePicker untuk memilih rentang waktu.
   - Progress bar saat proses scraping berlangsung.
   - Fitur Batch Processing: Jika rentang waktu panjang, bagi fetch menjadi per-bulan agar tidak timeout.
   - Simpan hasilnya ke tabel 'orders', 'bahan_baku', atau 'barang_jadi'.
```

---

## 4. Fitur Utama: Form Pencatatan Kesalahan (Smart Form)
**Tujuan**: Form kompleks dengan logika harga otomatis (VBA-style Logic).

```text
Buat form 'RecordsForm' untuk mencatat kesalahan karyawan dengan logika cerdas:
1. Dropdown Pencarian: Gunakan SearchableSelect (Custom Component) untuk mencari Karyawan dan Order.
2. Logika Harga Otomatis:
   - Jika Pilih 'Bahan Baku', ambil harga dari tabel 'bahan_baku' berdasarkan Order yang dipilih.
   - Jika Pilih 'HPP Kalkulasi', ambil harga dari tabel 'hpp_kalkulasi' (Excel manual upload).
   - Jika Pilih 'Barang Jadi', ambil harga pokok (HP) dari tabel 'barang_jadi'.
3. Input Jumlah & Total: Total harus terhitung otomatis (Jumlah * Harga) dan diformat dengan pemisah ribuan (titik) serta desimal (koma).
4. Validasi: Pastikan semua field wajib terisi sebelum tombol "Simpan" aktif.
```

---

## 5. Sinkronisasi Antar Tab & UX Optimization
**Tujuan**: Membuat aplikasi terasa "Real-time" tanpa manual reload.

```text
Terapkan fitur Sinkronisasi Sistem (Cross-Tab Sync):
1. Gunakan localStorage 'storage' event listener. Setiap kali ada data yang di-upload atau di-save di satu tab, tab lain harus tahu.
2. Saat event terdeteksi, gunakan 'router.refresh()' di dalam 'startTransition' agar data diperbarui secara halus tanpa menampilkan loading screen/white flash (smooth refresh).
3. Tambahkan fitur 'Draft Persistence': Simpan inputan form yang belum selesai ke localStorage agar jika halaman tidak sengaja di-refresh, isian form tidak hilang.
4. Optimasi Input: Gunakan Debouncing pada setiap search bar untuk meningkatkan performa.
```
