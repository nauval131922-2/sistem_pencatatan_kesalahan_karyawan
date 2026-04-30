# 08 — Refinement Tata Letak & Validasi Pelacakan

Tutorial ini menjelaskan perbaikan UI/UX dan penambahan logika validasi pada modul Tracking Manufaktur untuk memastikan data yang ditampilkan selalu konsisten dan responsif.

## 1. Masalah yang Diselesaikan
- **UI Flickering**: Saat halaman direfresh, filter "Nama Barang" sering kali muncul secara tidak terduga karena status data yang belum sinkron.
- **Layout Overflow**: Nama barang yang sangat panjang mendorong filter "Rentang Tanggal" keluar dari layar.
- **Data Inconsistency**: User bisa memilih barang dari Supplier A meskipun filter Supplier yang aktif adalah Supplier B.
- **Redundant Labels**: Munculnya label "0 Data" ganda yang membingungkan user.

## 2. Perbaikan Tata Letak (Responsive Layout)
Untuk mencegah elemen terdorong keluar layar, diterapkan beberapa aturan CSS Flexbox:
- **`min-w-0`**: Diterapkan pada kontainer flex induk agar anak-anaknya (teks panjang) diperbolehkan menyusut (shrink) dan memicu pemotongan teks.
- **`shrink-0`**: Diterapkan pada kontainer "Rentang Tanggal" agar posisinya tetap stabil dan tidak "mengalah" saat teks di sebelahnya panjang.
- **`truncate`**: Memastikan teks yang terlalu panjang dipotong dengan tanda titik-titik (`...`).

## 3. Logika Validasi Jalur (Path-Based Logic)
Diterapkan pemisahan status antara jalur BOM dan jalur Rekap Pembelian:
- **`trackingPath` State**: Menyimpan status apakah user sedang melacak dari `'bom'` atau `'rekap'`.
- **LocalStorage Persistence**: Status ini disimpan ke browser agar saat refresh, UI langsung tahu mode mana yang harus ditampilkan tanpa menunggu data dari API selesai ditarik (mencegah flickering).

## 4. Validasi Supplier vs Barang
Ditambahkan mekanisme otomatis untuk membersihkan pilihan barang jika tidak sesuai dengan filter supplier:
- **Penyimpanan kd_supplier**: Saat barang dipilih, sistem mencatat kode supplier-nya.
- **Auto-Clear**: Jika user mengubah filter Supplier, sistem akan mengecek apakah barang yang sedang dipilih milik supplier tersebut. Jika tidak, pilihan barang otomatis di-reset.

## 5. Pembersihan Label & Status
- **Badge Header**: Jika data kosong (0 data) tapi terhubung ke Order Produksi, label berubah secara dinamis menjadi "Terlacak di Order Produksi: X" daripada sekadar "0 Data".
- **Hapus Redundansi**: Label status kecil di bagian bawah dihapus karena informasinya sudah terwakili di dalam badge header.

---
*Dokumentasi ini dibuat otomatis oleh AI Agent sebagai bagian dari standarisasi sistem SINTAK ERP.*
