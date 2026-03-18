# Database — Panduan Manajemen

---

## Triple-Tier Database Strategy

| Environment | Platform | Storage | Database Filename / Provider |
|---|---|---|---|
| `npm run dev` | Lokal (PC) | File | `database_dev.sqlite` (Sandbox / Latihan) |
| `npm start` | Lokal (PC) | File | `database.sqlite` (Data Lokal Produksi) |
| **Override** | **Lokal (PC)** | **Cloud** | **Turso (Mode Online di Lokal)** |
| Production | **Vercel** | **Cloud** | **Turso (LibSQL)** |

> [!IMPORTANT]
> Sistem secara otomatis mendeteksi platform. Di PC Anda sendiri, aplikasi **dipaksa** menggunakan file `.sqlite` lokal agar tidak sengaja merusak data asli di Cloud (Turso), meskipun file `.env` sudah diisi.

---

## Reset Database Production

Tidak perlu build ulang. Cukup:
```bash
# 1. Stop server (Ctrl+C)
# 2. Hapus database lama
del database.sqlite
# 3. Start ulang — database baru + skema dibuat otomatis
(npm start 2>&1) | while IFS= read -r line; do printf "[%(%d-%m-%Y %H:%M:%S)T] %s\n" -1 "$line"; done

# 4. Jika Anda perlu mengembalikan data Catat Kesalahan (Penggantian Karyawan) dari tahun 2025:
npm run migrate:sales2025

# 5. Jika Anda perlu menerapkannya ke versi development (database-dev.sqlite):
# (Hanya jika pakai bash/linux)
NODE_ENV=development npm run migrate:sales2025
# (Khusus di CMD/Powershell Windows, pakai cross-env jika terinstall, atau:)
# npx cross-env NODE_ENV=development npm run migrate:sales2025

## Debug Bug dari Data Production

1. Copy file **`database.sqlite`** dari server/PC production
2. Rename menjadi **`database-dev.sqlite`**
3. Taruh di folder root project
4. Jalankan `npm run dev`
5. Bug bisa direproduksi dengan data asli tanpa mengubah data production

---

## Koneksi ke Cloud (Turso)

Untuk menghubungkan aplikasi ke database online, gunakan file `.env` (tidak di-commit):
```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
SESSION_SECRET=...
```

> Koneksi ke Turso (Cloud) secara default hanya aktif di **Vercel**. 
>
> **Cara Menghubungkan PC Lokal ke Turso (Database Online):**
> 1. Tambahkan baris ini ke file `.env`:
>    ```env
>    USE_REMOTE_DB=true
>    ```
> 2. Restart aplikasi (npm run dev atau npm start).
> 3. PC akan langsung membaca & menulis data ke Cloud. Hati-hati karena data ini adalah data "asli" yang diakses publik.
