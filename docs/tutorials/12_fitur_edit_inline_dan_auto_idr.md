# 📖 Tutorial: Implementasi Edit Inline & Auto-Formatting IDR

Tutorial ini menjelaskan cara kerja fitur edit langsung di tabel (mencakup kolom Harga & Keterangan) serta cara menangani input angka rupiah yang "pintar".

## 1. Konsep Dasar `EditableCell`
Komponen ini dirancang agar bisa digunakan kembali di kolom mana saja. Trigger utamanya adalah **Double Click** (Klik 2x) untuk meminimalkan salah edit.

### Cara Kerja:
- **Double Click**: Mengaktifkan mode input.
- **Enter / Blur (Klik di luar)**: Menyimpan data secara optimis (langsung update di layar) lalu mengirim request ke server melalui API.
- **Esc**: Membatalkan perubahan.

## 2. Penanganan Format Rupiah yang "Pintar"
Sistem menggunakan fungsi `formatIDR` yang secara real-time membersihkan input user:
- Jika user mengetik `1000.5`, sistem secara otomatis mengubahnya menjadi `1.000,5`.
- **Logika Pencegah Error**: Sistem menghapus semua titik ribuan terlebih dahulu, mendeteksi titik desimal di akhir, baru memformat ulang seluruh angka agar posisi titik ribuan (`.`) dan koma desimal (`,`) selalu benar.

## 3. Sinkronisasi Antar Tab (Cross-Tab Sync)
Agar data di tab lain (misal Dashboard) tetap sinkron saat data di edit di tab SOPd:
1. Setiap kali simpan sukses, kita memicu `localStorage.setItem('sintak_data_updated', Date.now())`.
2. Komponen lain mendengarkan event `storage`.
3. Keuntungannya: Tidak ada reload di tab yang sedang aktif (mulus), tapi tab lain akan otomatis refresh sendiri.

## 4. Troubleshooting Bug Database
Jika Anda menambahkan tabel baru dan Audit Log tidak mencatat perubahan, periksa `schema.ts`.
- Pastikan di fungsi `generateAuditTriggers`, tabel yang tidak punya kolom `id` (seperti `sopd_harga`) memiliki penanganan khusus (fallback ke `0` atau menggunakan Primary Key-nya).
- Error common: `SQLITE_ERROR: no such column: NEW.id` terjadi jika trigger mencoba mengambil `id` dari tabel yang memang tidak memilikinya.

## 5. Standarisasi Tampilan Card
Untuk membuat Card terlihat premium:
- Gunakan `border-[1.5px] border-gray-200`.
- Jangan gunakan `border-gray-100` yang terlalu tipis karena akan terlihat menyatu dengan background di beberapa monitor.
- Tambahkan `hover:border-gray-300 transition-all` untuk efek interaktif.
