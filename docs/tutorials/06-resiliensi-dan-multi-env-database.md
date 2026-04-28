# Tutorial 06: Resiliensi dan Multi-Environment Database

Tutorial ini menjelaskan bagaimana SINTAK mengelola tiga lingkungan database yang berbeda dan menangani batasan kuota pada Turso Database agar tidak menghambat proses deployment.

## 1. Pemisahan 3 Lingkungan Database

Untuk menjaga integritas data, sistem membagi koneksi menjadi tiga jalur yang dikontrol melalui variabel lingkungan (`.env`).

| Environment | Database Target | Pemicu |
|-------------|-----------------|---------|
| **Development** | `database_dev.sqlite` | `npm run dev` + `USE_REMOTE_DB=false` |
| **Production Lokal** | `database.sqlite` | `npm start` + `USE_REMOTE_DB=false` |
| **Real Production** | **Turso (Cloud)** | Deployment di **Vercel** |

### Konfigurasi `.env`:
Gunakan `USE_REMOTE_DB=false` di komputer lokal Anda untuk memastikan aktivitas koding tidak mengubah data asli di Cloud.

```env
USE_REMOTE_DB=false
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

## 2. Resiliensi Build (Penanganan Error "BLOCKED")

Saat melakukan build di Vercel, terkadang Turso memblokir operasi penulisan (*write*) jika kuota paket gratis tercapai. Sebelumnya, hal ini menyebabkan build gagal total.

### Solusi:
Memodifikasi `scripts/init-db.ts` agar tetap mengizinkan proses build berlanjut meskipun akses tulis diblokir, selama tabel-tabel utama sudah tersedia di database.

```typescript
// scripts/init-db.ts
try {
  await initSchema(db);
} catch (error: any) {
  if (error.code === 'BLOCKED' || error.message.includes('blocked')) {
    // Cek apakah tabel sudah ada
    const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
    if (tables.rows.length > 0) {
      console.warn("[WARNING] Database diblokir (kuota penuh), tapi tabel sudah ada. Melanjutkan build...");
      return;
    }
  }
  throw error; // Gagal jika tabel benar-benar belum ada
}
```

## 3. Kesimpulan
Dengan arsitektur ini, proses pengembangan menjadi lebih aman (karena terpisah dari data asli) dan proses deployment menjadi lebih stabil (tidak mudah gagal hanya karena masalah kuota database).
