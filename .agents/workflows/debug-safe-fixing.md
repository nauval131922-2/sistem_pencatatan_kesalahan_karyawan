---
description: Prosedur aman untuk melakukan debugging dan bug-fixing menggunakan database dvelopment
---

Ikuti langkah-langkah ini setiap kali menerima permintaan perbaikan bug agar tidak mengganggu data produksi:

1. **Pastikan Environment**: Selalu gunakan `.env.development` atau pastikan `NODE_ENV=development` aktif.
2. **Verifikasi Database**: Periksa `src/lib/db.ts` untuk memastikan koneksi mengarah ke `database_dev.sqlite`.
3. **Konfirmasi AI**: Agen AI **WAJIB** menjalankan perintah di poin 6 dan melaporkan hasilnya ke User sebelum mulai melakukan perubahan kode apapun.
4. **Gunakan Dev Server**: Jalankan aplikasi dengan `/dev-with-timestamp` agar log terlihat jelas di terminal.
5. **Validasi Perubahan**: Setelah perbaikan selesai, lakukan testing pada menu yang bermasalah di local browser sebelum melakukan commit.
6. **Backup (Opsional)**: Jika melakukan perubahan pada schema, buat salinan `database_dev.sqlite` sebagai cadangan.

// turbo
7. Jalankan pengecekan koneksi database saat ini:
```powershell
npx tsx -e "import db from './src/lib/db'; console.log('AI Verified Connection:', db.name);"
```
