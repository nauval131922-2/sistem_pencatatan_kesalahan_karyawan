# Git — Workflow Sehari-hari

---

## Perintah Dasar

```bash
# Tarik perubahan terbaru dari GitHub
git pull

# Lihat file apa saja yang berubah
git status

# Lihat history commit
git log --oneline -10
```

---

## Commit & Push Perubahan

```bash
# Tambahkan semua perubahan
git add .

# Buat commit (ganti pesannya sesuai isi perubahan)
git commit -m "feat: deskripsi perubahan"

# Push ke GitHub
git push
```

---

## Format Pesan Commit

| Prefix | Digunakan untuk |
|---|---|
| `feat:` | Fitur baru |
| `fix:` | Perbaikan bug |
| `perf:` | Optimasi performa |
| `refactor:` | Perapian kode (tanpa fitur/bug) |
| `style:` | Perubahan tampilan/CSS |
| `chore:` | Hal teknis (config, gitignore, dll) |
| `docs:` | Perubahan dokumentasi |

Contoh:
```bash
git commit -m "feat: tambah filter tanggal di menu records"
git commit -m "fix: upload Excel tidak refresh setelah berhasil"
git commit -m "chore: update PANDUAN_OPERASIONAL.md"
```

---

## Workflow Harian

```
1. Mulai kerja    → git pull
2. Kembangkan     → npm run dev
3. Selesai        → git add . → git commit → git push
4. Deploy prod    → (di PC server) git pull → build → start
```
