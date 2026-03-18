---
description: langkah deploy production, reset data, dan penanganan error dari user
---

Gunakan workflow ini hanya setelah fitur yang diperbaiki di database development sudah dinyatakan stabil:

1. **Commit Perubahan**: Lakukan `git add` dan `git commit` untuk semua file yang telah diperbaiki.
2. **Switch ke Prod**: Pastikan project berjalan di `NODE_ENV=production`.
3. **Migrasi Schema (Jika Ada)**: Jika ada perubahan struktur tabel, pastikan script migrasi di `src/lib/db.ts` berjalan otomatis saat startup.
4. **Verifikasi Dashboard**: Cek menu statistik untuk memastikan data terbaca dengan benar.
5. **Monitoring Log**: Cek `activity_logs` di database produksi untuk memastikan aktivitas tercatat.

// turbo
6. Jalankan build production untuk memastikan tidak ada error saat kompilasi:
```bash
npm run build
```
