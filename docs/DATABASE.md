# Database — Panduan Manajemen

---

## Dev vs Production

| Mode | File Database | Keterangan |
|---|---|---|
| `npm run dev` | `database-dev.sqlite` | Otomatis, tidak perlu setting manual |
| `npm start` | `database.sqlite` | Data production sebenarnya |

> Kedua file **tidak di-commit** ke Git (sudah ada di `.gitignore`).
> Setiap PC/server punya database-nya sendiri.

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

## Override Path Database (Opsional)

Buat file `.env` di root project (tidak di-commit ke Git):
```
DB_PATH=D:/lokasi/lain/sikka.sqlite
```

Berlaku untuk semua mode (dev & production).
