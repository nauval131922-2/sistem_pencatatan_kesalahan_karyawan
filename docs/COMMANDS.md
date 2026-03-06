# Commands — Menjalankan Project

Gunakan Git Bash untuk semua command di bawah ini.
Format timestamp: `[DD-MM-YYYY HH:MM:SS]` di setiap baris log.

---

## Development
> Live reload. Data di `database-dev.sqlite`.
```bash
start=$SECONDS; (npm run dev 2>&1) | while IFS= read -r line; do elapsed=$((SECONDS - start)); printf "[%(%d-%m-%Y %H:%M:%S)T] [%02d:%02d:%02d] %s\n" -1 "$((elapsed/3600))" "$((elapsed%3600/60))" "$((elapsed%60))" "$line"; done
```

## Build (Production)
> Wajib dijalankan setiap kali **kode berubah**.
```bash
start=$SECONDS; (npm run build 2>&1) | while IFS= read -r line; do elapsed=$((SECONDS - start)); printf "[%(%d-%m-%Y %H:%M:%S)T] [%02d:%02d:%02d] %s\n" -1 "$((elapsed/3600))" "$((elapsed%3600/60))" "$((elapsed%60))" "$line"; done
```

## Start (Production)
> Jalankan setelah build selesai. Data di `database.sqlite`.
```bash
start=$SECONDS; (npm start 2>&1) | while IFS= read -r line; do elapsed=$((SECONDS - start)); printf "[%(%d-%m-%Y %H:%M:%S)T] [%02d:%02d:%02d] %s\n" -1 "$((elapsed/3600))" "$((elapsed%3600/60))" "$((elapsed%60))" "$line"; done
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
