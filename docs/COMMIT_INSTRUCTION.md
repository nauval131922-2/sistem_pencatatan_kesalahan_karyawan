Tolong lakukan commit dan push semua perubahan terbaru. Ikuti langkah-langkah berikut secara berurutan:

---

### 🗂️ LANGKAH 1 — Pastikan Struktur Dokumentasi
Pastikan struktur folder dokumentasi berikut sudah ada, buat jika belum:
docs/
├── AI_SESSION_SUMMARY.md   # Ringkasan & status sesi terakhir
├── task.md                 # Backlog, in-progress, done
└── tutorials/
    ├── 01-setup.md
    ├── 02-fitur-[nama].md
    └── ...                 # Satu file per fitur/perbaikan

---

### 📝 LANGKAH 2 — Buat/Perbarui Dokumentasi Tutorial Mandiri
Berdasarkan semua perubahan di sesi ini (lihat Changes di Source Control),
buatkan atau perbarui file tutorial step-by-step di dalam `docs/tutorials/`.
Satu file per fitur atau perbaikan, dengan penamaan:
  - `01-nama-fitur.md`, `02-nama-fitur.md`, dst.

---

### 🔍 LANGKAH 3 — Audit .gitignore
Periksa file `.gitignore`:
- Pastikan tidak ada file sampah, cache, log, atau database yang ikut ter-push.
- Periksa pola yang terlalu luas seperti wildcard `*` atau ekstensi terlalu
  umum yang bisa secara tidak sengaja mengabaikan file penting seperti
  `.md`, `.env.example`, atau file konfigurasi lainnya.
- Jika ada masalah, perbaiki dan jelaskan perubahannya ke saya.

---

### 👥 LANGKAH 4 — Tanya Dulu Sebelum Push
Sebelum melanjutkan, **tanyakan ke saya**:
"Apakah kamu sedang bekerja sendiri atau dalam tim?"
  - Jika **sendiri** → push langsung ke branch `master` (atau branch aktif saat ini).
  - Jika **tim** → push ke branch `dev` atau branch fitur, JANGAN langsung ke `master`.
Tunggu jawaban saya sebelum melanjutkan ke langkah berikutnya.

---

### ✅ LANGKAH 5 — Review Sebelum Commit
Jalankan perintah berikut dan tampilkan hasilnya ke saya:
  git status
  git diff --staged
Tinjau output-nya bersama saya:
- Pastikan tidak ada file yang tidak sengaja ikut ter-staged.
- Pastikan tidak ada file penting yang terlewat (belum di-staged).
- Jika ada yang perlu diperbaiki, lakukan dulu sebelum commit.

---

### 📦 LANGKAH 6 — Kelompokkan & Commit
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

### 📋 LANGKAH 7 — Perbarui Ringkasan Sesi AI
Buat atau perbarui file berikut:
  - `docs/AI_SESSION_SUMMARY.md` → ringkasan lengkap sesi ini:
      * Tanggal & waktu sesi
      * Fitur/perbaikan yang dikerjakan
      * Keputusan teknis penting yang diambil
      * Hal yang belum selesai / perlu dilanjutkan
  - `docs/task.md` → perbarui status task:
      * ✅ Selesai
      * 🔄 Sedang berjalan
      * 📌 Akan datang / backlog

---

### 🚀 LANGKAH 8 — Commit Dokumentasi & Push
Commit semua file dokumentasi (AI_SESSION_SUMMARY.md, task.md, semua
tutorial baru/diperbarui) dengan pesan:
  docs: perbarui ringkasan sesi dan dokumentasi tutorial

Kemudian push sesuai keputusan di Langkah 4.
Tampilkan konfirmasi hasil push ke saya.