# Produksi — Deployment & FAQ

---

## Alur Deploy ke Production

```bash
# Di PC server / PC yang dipakai sebagai production:

# 1. Tarik kode terbaru
git pull

# 2. Stop server yang sedang jalan (Ctrl+C)

# 3. Build ulang
(npm run build 2>&1) | while IFS= read -r line; do printf "[%(%d-%m-%Y %H:%M:%S)T] %s\n" -1 "$line"; done

# 4. Jalankan server production
(npm start 2>&1) | while IFS= read -r line; do printf "[%(%d-%m-%Y %H:%M:%S)T] %s\n" -1 "$line"; done
```

---

## Akses dari Jaringan LAN

Saat `npm start` berjalan, aplikasi bisa diakses dari PC lain di jaringan yang sama:
```
http://<IP-PC-SERVER>:3000
```
Contoh: `http://192.168.2.39:3000`

Cek IP PC server dengan command:
```bash
ipconfig
```

---

## FAQ

### Ada bug dari user — database mana yang di-copy?
Copy **`database.sqlite`** di folder root project.
> Debug lokal: rename ke `database-dev.sqlite` → jalankan `npm run dev`.

### Fitur baru sudah di-commit — langkah deploy?
```bash
git pull → npm run build → npm start
```
Lihat detail di [COMMANDS.md](COMMANDS.md).

### Mau reset semua data production?
```bash
# Stop server → hapus database lama → start ulang
del database.sqlite
(npm start 2>&1) | while IFS= read -r line; do printf "[%(%d-%m-%Y %H:%M:%S)T] %s\n" -1 "$line"; done
```
Database baru + skema dibuat otomatis saat start.

### Data tidak muncul setelah upload Excel / reload halaman?
Pastikan sudah build ulang setelah perubahan kode terbaru (termasuk penambahan `force-dynamic` di semua halaman). Jalankan `npm run build` lalu `npm start`.

### Terminal tidak bergerak setelah "Ready" di production — normal?
Ya, **normal**. Production tidak menampilkan log request seperti dev. Terminal hanya akan aktif jika ada error serius.

---

## Struktur File Penting

```
/
├── src/
│   ├── app/          # Halaman & API routes
│   ├── components/   # Komponen React
│   └── lib/
│       ├── db.ts     # Inisialisasi database & skema
│       └── actions.ts
├── docs/             # Folder dokumentasi ini
├── database.sqlite        # Database PRODUCTION (tidak di-commit)
├── database-dev.sqlite    # Database DEVELOPMENT (tidak di-commit)
└── PANDUAN_OPERASIONAL.md # Indeks dokumentasi
```
