# 🔄 RESUME_SESSION.md

## Prompt: Melanjutkan Sesi di PC Lain (Rumah/Kantor)

Gunakan prompt ini setiap kali membuka sesi baru di perangkat berbeda.
Cukup copy-paste prompt di bawah ini ke AI agent.

---

```
Saya baru membuka sesi baru / pindah PC. Tolong lakukan langkah-langkah
berikut secara berurutan sebelum kita mulai bekerja:

---

### 🔄 LANGKAH 1 — Sinkronisasi Repository
Jalankan perintah berikut dan tampilkan hasilnya:
  git pull

Jika ada konflik:
  - Tampilkan file mana saja yang konflik
  - Bantu saya menyelesaikan konflik tersebut satu per satu
  - Jangan lanjut ke langkah berikutnya sebelum konflik selesai

Jika tidak ada konflik, tampilkan ringkasan perubahan yang baru di-pull
(file apa saja yang berubah).

---

### 📋 LANGKAH 2 — Baca Ringkasan Sesi Terakhir
Baca file `docs/AI_SESSION_SUMMARY.md` dan tampilkan:
  - Tanggal & waktu sesi terakhir
  - PC yang digunakan di sesi terakhir (Rumah / Kantor)
  - Fitur/perbaikan apa yang dikerjakan di sesi terakhir
  - Keputusan teknis penting yang diambil
  - Hal yang belum selesai / perlu dilanjutkan

Jika file tidak ditemukan, informasikan ke saya dan lewati langkah ini.

---

### ✅ LANGKAH 3 — Baca Status Task
Baca file `docs/task.md` dan tampilkan dalam format berikut:

  ✅ SELESAI
  → [daftar task yang sudah selesai]

  🔄 SEDANG BERJALAN
  → [daftar task yang masih in-progress]

  📌 SELANJUTNYA / BACKLOG
  → [daftar task yang belum dikerjakan]

  🐛 BUG DIKETAHUI
  → [daftar bug yang belum diselesaikan]

Jika file tidak ditemukan, informasikan ke saya dan lewati langkah ini.

---

### 🗂️ LANGKAH 4 — Periksa Kondisi Repository
Jalankan perintah berikut dan tampilkan hasilnya:
  git status

Laporkan ke saya:
  - Apakah ada file yang belum ter-commit dari sesi sebelumnya?
  - Apakah working directory bersih?
  - Branch apa yang sedang aktif sekarang?

Jika ada file yang belum ter-commit:
  - Tampilkan daftar filenya
  - Tanyakan ke saya: "Ada file yang belum ter-commit dari sesi sebelumnya.
    Apakah ingin di-commit sekarang atau diabaikan dulu?"
  - Tunggu jawaban saya sebelum lanjut.

---

### 🏗️ LANGKAH 5 — Periksa Kelengkapan Dokumentasi
Periksa apakah file-file dokumentasi berikut ada dan tidak kosong:

  docs/
  ├── COMMIT_INSTRUCTION.md      ← panduan akhir sesi
  ├── RESUME_SESSION.md          ← panduan awal sesi di PC baru (file ini)
  ├── BUILD_FROM_SCRATCH.md      ← tutorial rebuild sistem dari nol
  ├── AI_SESSION_SUMMARY.md      ← ringkasan sesi terakhir
  ├── task.md                    ← backlog & progress
  └── tutorials/                 ← tutorial per fitur/perbaikan

Laporkan status setiap file:
  ✅ Ada & lengkap
  ⚠️  Ada tapi kosong / perlu diperbarui
  ❌  Tidak ditemukan

Jika ada file yang ❌ tidak ditemukan atau ⚠️ perlu diperbarui:
  - Tanyakan ke saya: "Apakah ingin saya buatkan/perbarui sekarang?"
  - Tunggu jawaban saya.

---

### 🎯 LANGKAH 6 — Tampilkan Ringkasan & Rekomendasi
Setelah semua langkah di atas selesai, tampilkan ringkasan dalam format:

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📍 SESI TERAKHIR
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Tanggal   : [tanggal sesi terakhir]
  PC        : [Rumah / Kantor]
  Dikerjakan: [ringkasan singkat]
  Belum selesai: [jika ada]

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📌 REKOMENDASI MULAI DARI MANA
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [Berikan 1-3 rekomendasi task yang paling logis untuk dikerjakan
   selanjutnya berdasarkan konteks sesi terakhir dan task.md]

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔧 STATUS REPOSITORY
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Branch aktif : [nama branch]
  Working dir  : [bersih / ada perubahan]
  Dokumentasi  : [lengkap / ada yang kurang]
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Setelah ringkasan ditampilkan, tanyakan ke saya:
  "Dari rekomendasi di atas, mana yang ingin kamu kerjakan duluan?
   Atau ada task lain yang ingin kamu prioritaskan?"

Tunggu instruksi saya — jangan mulai mengerjakan apapun sebelum saya
memberikan konfirmasi.
```

---

## 💡 Kapan File Ini Digunakan?

| Situasi | Lakukan |
|--------|---------|
| Pindah dari PC kantor ke PC rumah | Jalankan prompt ini |
| Pindah dari PC rumah ke PC kantor | Jalankan prompt ini |
| Membuka sesi baru setelah lama tidak coding | Jalankan prompt ini |
| Melanjutkan pekerjaan di hari berikutnya | Jalankan prompt ini |
| Setelah install ulang / PC baru | Jalankan prompt ini + `git clone` dulu |

---

## 🖥️ Jika PC Baru / Belum Ada Repository

Jika kamu membuka sesi di PC yang belum pernah ada repository-nya,
jalankan prompt ini terlebih dahulu **sebelum** prompt di atas:

```
Saya di PC baru dan belum ada repository-nya. Tolong bantu saya:
  1. Clone repository dari [URL_REPOSITORY_KAMU]
  2. Masuk ke folder proyek
  3. Install semua dependency
  4. Setup file .env berdasarkan .env.example
  5. Jalankan migration database jika ada
  6. Verifikasi sistem bisa dijalankan

Setelah selesai, lanjutkan dengan membaca docs/RESUME_SESSION.md
untuk memahami konteks sesi terakhir.
```

---

## 🔗 Hubungan dengan File Lain

```
RESUME_SESSION.md (file ini)
  │
  ├── membaca   → docs/AI_SESSION_SUMMARY.md  (konteks sesi terakhir)
  ├── membaca   → docs/task.md                (status task)
  ├── memeriksa → docs/BUILD_FROM_SCRATCH.md  (jika perlu rebuild)
  │
  └── setelah sesi selesai, jalankan:
        → COMMIT_INSTRUCTION.md              (untuk commit & push)
```
