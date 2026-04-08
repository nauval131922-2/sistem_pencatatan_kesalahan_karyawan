# Instruksi Commit & Push (Prompt Template)

Gunakan prompt ini jika Anda ingin saya melakukan commit dan push semua perubahan yang telah kita buat ke GitHub:

---

**Prompt:**
"Tolong lakukan commit dan push semua perubahan terbaru. Pastikan:
1. Kelompokkan commit berdasarkan fitur atau perbaikan (jangan digabung semua jadi satu).
2. Tulis pesan commit yang deskriptif dalam bahasa Indonesia.
3. Periksa `.gitignore` agar tidak ada file sampah atau database yang ikut ter-push.
4. **PENTING**: Periksa pola `.gitignore` yang terlalu serakah (seperti tanda bintang `*`). Pastikan file penting (seperti `.md`) tidak terabaikan secara tidak sengaja seperti kasus sebelumnya.
5. **Sinkronisasi AI**: Sebelum mengakhiri sesi, minta AI membuat ringkasan status di `docs/AI_SESSION_SUMMARY.md` atau perbarui `task.md` agar progres bisa dilanjutkan di perangkat lain (Rumah/Kantor).
6. **Tutorial Mandiri**: Jika selama sesi ini ada perbaikan bug atau penambahan fitur yang logiknya mungkin diulangi, buatkan/perbarui dokumentasi tutorial *step-by-step*, agar saya bisa melakukannya secara mandiri di lain waktu.
7. Lakukan push ke branch master."

---

## Cara Melanjutkan Sesi di PC Lain (Rumah/Kantor)

Saat Anda berpindah PC dan membuka chat baru, gunakan prompt ini agar saya langsung paham konteks terakhir:

**Prompt:**
"Saya baru pindah PC. Tolong lakukan `git pull` terlebih dahulu, lalu baca `docs/AI_SESSION_SUMMARY.md` dan `docs/task.md` (jika ada) untuk memahami progres terakhir, lalu lanjutkan tugas kita."

---

## Ringkasan Perubahan Sesi Ini
- **Optimasi Performa**: Upload data karyawan lebih cepat, penanganan timeout SQLite, dan penyederhanaan log aktivitas.
- **Perbaikan Bug & UI**: Sinkronisasi HPP Kalkulasi, perbaikan logic HPP vs Barang Jadi, dan sticky sidebar.
- **Fitur Baru**: Total keseluruhan di laporan PDF, script migrasi saldo 2025, dan dokumentasi operasional/database.
