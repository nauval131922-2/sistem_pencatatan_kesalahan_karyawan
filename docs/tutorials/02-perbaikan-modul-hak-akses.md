# 02 — Perbaikan Modul Hak Akses (Roles & Permissions)

Tutorial ini menjelaskan langkah-langkah perbaikan fungsional dan visual pada modul Pengaturan Hak Akses untuk meningkatkan kejelasan informasi dan kemudahan penggunaan.

## 1. Perbaikan Pengelompokan (Grouping)
Modul Hak Akses kini memiliki pengelompokan yang lebih cerdas untuk sub-modul yang tersebar:
- **Data Digit**: Menggabungkan seluruh modul yang berawalan `Data Digit - ` ke dalam satu grup "Data Digit" (Kata "Grup" dihapus dari label untuk kesederhanaan).
- **Sistem**: Menggabungkan seluruh modul yang berawalan `Sistem - ` ke dalam satu grup "Sistem".
- **Grup Utama**: Modul lainnya tetap berada pada grup standarnya.

## 2. Logika "Smart Expand" (Collapsible)
Untuk mengurangi kepadatan visual, modul kini menerapkan logika buka-tutup otomatis:
- **Default Tertutup**: Semua grup tertutup secara default saat halaman dimuat.
- **Auto-Open**: Grup yang memiliki hak akses aktif (minimal 1 permission yang dicentang) akan otomatis terbuka.
- **Toggle Manual**: Pengguna tetap bisa membuka/tutup grup secara manual dengan klik pada header grup. Perbaikan dilakukan pada fungsi `toggleCollapse` agar merespons pada klik pertama (sebelumnya memerlukan klik ganda).
- **Dashboard Non-Collapsible**: Modul Dashboard kini selalu terbuka dan tidak memiliki fitur buka-tutup untuk memudahkan akses cepat.

## 3. Standardisasi Tipografi & Visual
- **Header Grup**: Menggunakan font size **13px Bold** (sebelumnya tidak konsisten).
- **Warna Badge**: Menggunakan skema warna Emerald untuk badge status aktif.
- **Deskripsi**: Deskripsi modul diubah menjadi "**Pengaturan Hak Akses pada Sistem**" agar lebih formal.

## 4. Bulk Toggles
- Tombol **On All** dan **Off All** pada setiap grup modul telah diselaraskan posisinya dan diberikan pemisah visual yang lebih jelas.
- **Sinkronisasi All Data**: Ditambahkan sebagai opsi pengaturan langsung (top-level) di dalam grup "Data Digit" untuk kemudahan konfigurasi tanpa harus membuka folder tambahan.
