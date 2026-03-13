# Checklist Detail Pembaruan SIKKA - 13 Maret 2026

Berikut adalah daftar rincian pekerjaan dan letak spesifik perubahannya:

## 1. Optimalisasi Performa & Rendering
- [x] **Virtual Scrolling (Dashboard Only)**: Implementasi `@tanstack/react-virtual` khusus pada komponen `ActivityTable.tsx`. Menangani data aktivitas besar tanpa membebani browser.
- [x] **SARGable Database Queries**: Optimasi pencarian data pada `src/lib/actions.ts` untuk fungsi:
    - `getInfractions`: Filter tanggal menggunakan perbandingan rentang (`>=` dan `<=`).
    - `getStats`: Perbaikan query statistik agar menggunakan index.
    - `getDashboardSummary` & `getDetailedStats`: Perbaikan filter tanggal agar lebih efisien.
- [x] **Search Debouncing (Dashboard Only)**: Penambahan delay 300ms pada pencarian di `ActivityTable.tsx` untuk mencegah *re-render* berlebihan saat mengetik.
- [x] **Date Formatting Optimization**: Menggunakan satu *instance* `Intl.DateTimeFormat` (dateFormatter) yang di-cache di luar komponen `ActivityTable` untuk kecepatan render datetime.

## 2. Fitur Tabel Aktivitas & Kontrol Pengguna
- [x] **Manual Column Resizing (Dashboard)**: 
    - Penambahan state `columnWidths` untuk kontrol lebar manual.
    - Penanganan event `onMouseDown`, `onMouseMove`, dan `onMouseUp` untuk logika drag.
- [x] **Interface Stability**:
    - Perbaikan `stopPropagation` pada handle resize agar tidak bentrok dengan fungsi *sorting*.
    - Perbaikan posisi *Header* yang menempel (Sticky) agar tidak menutupi baris data paling atas.
    - Penghapusan `flex-grow` pada kolom Keterangan agar lebar kolom bersifat statis sesuai keinginan user.

## 3. Sistem Audit & Pemantauan Data
- [x] **Enhanced Audit Triggers (Schema-level)**: Pembaruan trigger pada tabel:
    - `infractions`: Sekarang mencatat ID, Faktur, Qty, Harga, Total, dan Referensi Order ke JSON `raw_data`.
    - `users` & `employees`: Mencatat data profil lengkap saat terjadi perubahan.
    - `orders`: Mencatat detail transaksi kedalam log audit.
- [x] **Live Record Comparison**: Penambahan tombol detail pada `ActivityTable` yang memanggil `getLiveRecord` (lib/actions.ts) untuk membandingkan data snapshot historis dengan data aktual di database.
- [x] **Professional Audit UI**: Desain ulang modal detail aktivitas dengan dual-panel JSON viewer (Snapshot vs Live).

## 4. Sinkronisasi & Stabilitas Sistem
- [x] **Cross-Tab Synchronization Fix**:
    - Penambahan pemicu sinyal `sikka_data_updated` pada `RecordsForm.tsx` (saat Submit/Edit).
    - Penambahan pemicu sinyal pada `InfractionsTable.tsx` (saat Delete).
    - Perbaikan *Listener* di `ActivityTable.tsx` agar dashboard terupdate otomatis.
- [x] **Initialization Safety**: Perbaikan urutan inisialisasi *hooks* React untuk mencegah error "Cannot access 'virtualizer' before initialization".
- [x] **Transaction Guard**: Menstandardisasi format waktu pada `addInfraction` menjadi `HH:mm:ss` agar konsisten dengan filter database.

---
*Catatan: Optimalisasi performa saat ini difokuskan pada Dashboard (`ActivityTable`) karena merupakan menu dengan volume data paling tinggi.*
