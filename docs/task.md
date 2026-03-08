# Task List

- [x] Research database initialization and locking issues
- [x] Investigate `/api/bahan-baku` implementation
- [x] Check for background processes using the database
- [x] Implement fix (e.g., WAL mode, busy timeout, or build-time optimization)
- [x] Fix import/export mismatch in init-db.ts
- [x] Verify database initialization manually
- [x] Verify fix by running build again
- [x] Update sync documentation dengan langkah `git pull`
- [x] Sinkronisasi status sesi untuk environment PC baru
- [x] **Migrasi ke Cloud (Turso + Vercel)**
    - [x] Refactor database driver ke LibSQL (Async)
    - [x] Refactor seluruh API & Actions ke Async
    - [x] Integrasi `db.batch()` untuk bulk ops
    - [x] Inisialisasi Remote Database (Turso)
    - [x] Hapus dependency `better-sqlite3` (fix Vercel 500 error)
    - [x] Migrasi data produksi lokal ke Cloud (Turso)
