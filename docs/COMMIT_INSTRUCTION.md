# 📋 COMMIT_INSTRUCTION.md

## 🚀 Prompt: Commit & Push Semua Perubahan

Gunakan prompt ini di akhir sesi untuk menyimpan semua perubahan ke GitHub.
Cukup copy-paste prompt di bawah ini ke AI agent.

---

```
Tolong lakukan commit dan push semua perubahan terbaru. Ikuti langkah-langkah berikut secara berurutan:

---

### 🗂️ LANGKAH 1 — Pastikan Struktur Dokumentasi
Pastikan struktur folder dokumentasi berikut sudah ada, buat jika belum:
docs/
├── COMMIT_INSTRUCTION.md      ← panduan akhir sesi
├── RESUME_SESSION.md          ← panduan awal sesi di PC baru
├── BUILD_FROM_SCRATCH.md      ← tutorial rebuild sistem dari nol
├── AI_SESSION_SUMMARY.md      ← ringkasan sesi terakhir
├── task.md                    ← backlog & progress
└── tutorials/
    ├── 01-setup.md
    ├── 02-fitur-[nama].md
    └── ...                    ← satu file per fitur/perbaikan

---

### 📝 LANGKAH 2 — Buat/Perbarui Dokumentasi Tutorial Mandiri
Berdasarkan semua perubahan di sesi ini (lihat Changes di Source Control),
buatkan atau perbarui file tutorial step-by-step di dalam `docs/tutorials/`.
Satu file per fitur atau perbaikan, dengan penamaan:
  - `01-nama-fitur.md`, `02-nama-fitur.md`, dst.

---

### 🔄 LANGKAH 3 — Perbarui BUILD_FROM_SCRATCH.md
Ini wajib dilakukan setiap sesi. Tinjau seluruh perubahan di sesi ini, lalu
perbarui `docs/BUILD_FROM_SCRATCH.md` agar selalu mencerminkan kondisi sistem
terkini secara lengkap.

Yang harus diperbarui:
  - Jika ada fitur baru       → tambahkan langkah pembuatannya secara kronologis
  - Jika ada bug fix          → perbarui langkah yang berubah cara kerjanya
  - Jika ada perubahan folder → perbarui bagian struktur proyek
  - Jika ada dependency baru  → perbarui bagian instalasi & konfigurasi
  - Jika ada perubahan skema  → perbarui bagian setup database
  - Jika ada env var baru     → perbarui bagian konfigurasi .env

Prinsip utama:
  ⚠️ BUILD_FROM_SCRATCH.md harus selalu bisa digunakan oleh siapapun
     untuk membangun ulang sistem ini dari nol dan menghasilkan sistem
     yang IDENTIK dengan kondisi saat ini.

---

### 🔍 LANGKAH 4 — Audit .gitignore
Periksa file `.gitignore`:
  - Pastikan tidak ada file sampah, cache, log, atau database yang ikut ter-push.
  - Periksa pola yang terlalu luas seperti wildcard `*` atau ekstensi terlalu
    umum yang bisa secara tidak sengaja mengabaikan file penting seperti
    `.md`, `.env.example`, atau file konfigurasi lainnya.
  - Jika ada masalah, perbaiki dan jelaskan perubahannya ke saya.

---

### 👥 LANGKAH 5 — Tanya Dulu Sebelum Push
Sebelum melanjutkan, **tanyakan ke saya**:
"Apakah kamu sedang bekerja sendiri atau dalam tim?"
  - Jika **sendiri** → push langsung ke branch `master` (atau branch aktif saat ini).
  - Jika **tim**     → push ke branch `dev` atau branch fitur, JANGAN langsung ke `master`.
Tunggu jawaban saya sebelum melanjutkan ke langkah berikutnya.

---

### ✅ LANGKAH 6 — Review Sebelum Commit
Jalankan perintah berikut dan tampilkan hasilnya ke saya:
  git status
  git diff --staged

Tinjau output-nya bersama saya:
  - Pastikan tidak ada file yang tidak sengaja ikut ter-staged.
  - Pastikan tidak ada file penting yang terlewat (belum di-staged).
  - Jika ada yang perlu diperbaiki, lakukan dulu sebelum commit.

---

### 📦 LANGKAH 7 — Kelompokkan & Commit
Kelompokkan perubahan berdasarkan fitur atau perbaikan (jangan digabung jadi satu).
Gunakan format Conventional Commits untuk setiap pesan commit:

  Tipe yang tersedia:
  - feat     → fitur baru
  - fix      → perbaikan bug
  - docs     → perubahan dokumentasi
  - refactor → refaktor kode tanpa mengubah fungsi
  - chore    → tugas maintenance (update dependency, konfigurasi, dll)
  - test     → menambah atau memperbaiki test
  - style    → perubahan formatting/style (tidak mengubah logika)

  Format: <tipe>: <deskripsi singkat dalam bahasa Indonesia>

  Contoh:
  - feat: tambah fitur login dengan Google OAuth
  - fix: perbaiki bug validasi form registrasi
  - docs: perbarui README dan tutorial onboarding
  - refactor: sederhanakan logika kalkulasi harga
  - chore: update versi dependency axios dan tailwind

---

### 📋 LANGKAH 8 — Perbarui Ringkasan Sesi AI
Buat atau perbarui file berikut:

  `docs/AI_SESSION_SUMMARY.md` → ringkasan lengkap sesi ini:
    * Tanggal & waktu sesi
    * PC yang digunakan (Rumah / Kantor)
    * Fitur/perbaikan yang dikerjakan
    * Keputusan teknis penting yang diambil
    * Hal yang belum selesai / perlu dilanjutkan

  `docs/task.md` → perbarui status task:
    * ✅ Selesai (dengan tanggal)
    * 🔄 Sedang berjalan
    * 📌 Akan datang / backlog
    * 📊 Perbarui statistik di bagian bawah

---

### 🚀 LANGKAH 9 — Commit Semua Dokumentasi & Push
Commit semua file dokumentasi berikut dalam satu commit:
  - `docs/AI_SESSION_SUMMARY.md`
  - `docs/task.md`
  - `docs/BUILD_FROM_SCRATCH.md`
  - semua file baru/diperbarui di `docs/tutorials/`

Dengan pesan commit:
  docs: perbarui ringkasan sesi, tutorial, dan BUILD_FROM_SCRATCH

Kemudian push sesuai keputusan di Langkah 5.
Tampilkan konfirmasi hasil push ke saya.
```

---

## 💡 Referensi Cepat Format Commit

| Tipe | Kapan Digunakan | Contoh |
|------|----------------|--------|
| `feat:` | Fitur baru | `feat: tambah halaman profil pengguna` |
| `fix:` | Perbaikan bug | `fix: perbaiki crash saat upload foto` |
| `docs:` | Dokumentasi | `docs: perbarui README instalasi` |
| `refactor:` | Refaktor kode | `refactor: pisahkan logika auth ke service` |
| `chore:` | Maintenance | `chore: update dependency ke versi terbaru` |
| `test:` | Penambahan test | `test: tambah unit test untuk user model` |
| `style:` | Formatting/style | `style: rapikan indentasi file controller` |
