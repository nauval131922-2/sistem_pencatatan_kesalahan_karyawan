# Commands — Menjalankan Project

Gunakan Git Bash untuk semua command di bawah ini.
Format timestamp: `[DD-MM-YYYY HH:MM:SS]` di setiap baris log.

---

## Development
> Live reload. Data di `database-dev.sqlite`.
```bash
(npm run dev 2>&1) | while IFS= read -r line; do printf "[%(%d-%m-%Y %H:%M:%S)T] %s\n" -1 "$line"; done
```

## Build (Production)
> Wajib dijalankan setiap kali **kode berubah**.
```bash
(npm run build 2>&1) | while IFS= read -r line; do printf "[%(%d-%m-%Y %H:%M:%S)T] %s\n" -1 "$line"; done
```

## Start (Production)
> Jalankan setelah build selesai. Data di `database.sqlite`.
```bash
(npm start 2>&1) | while IFS= read -r line; do printf "[%(%d-%m-%Y %H:%M:%S)T] %s\n" -1 "$line"; done
```

---

## Kapan Perlu Build Ulang?

| Situasi | Perlu Build? |
|---|---|
| Kode TypeScript / React berubah | ✅ Ya |
| Perubahan konfigurasi Next.js | ✅ Ya |
| Upload Excel / input data baru | ❌ Tidak |
| Hapus / reset database | ❌ Tidak |
| `git pull` tanpa perubahan kode | ❌ Tidak |
