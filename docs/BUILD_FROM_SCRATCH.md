# 🏗️ BUILD_FROM_SCRATCH.md

## Prompt: Generate Tutorial Full dari Nol

Gunakan prompt ini untuk meminta AI agent menganalisis seluruh sistem yang ada
dan menghasilkan tutorial lengkap untuk membangun ulang sistem dari nol.

---

```
Tolong analisis seluruh codebase dan sistem yang ada saat ini, kemudian buatkan
tutorial lengkap step-by-step untuk membangun ulang sistem ini dari nol hingga
menghasilkan sistem yang IDENTIK dengan kondisi saat ini.

---

### 🔍 LANGKAH 1 — Analisis Sistem
Sebelum menulis tutorial, lakukan analisis menyeluruh terlebih dahulu:

Jalankan perintah berikut untuk memahami struktur sistem:
  - Tampilkan struktur folder lengkap (tree atau ls -la recursive)
  - Baca package.json / requirements.txt / composer.json (sesuai tech stack)
  - Baca file konfigurasi utama (.env.example, config/, dll)
  - Baca file database/schema (migration, prisma.schema, models/, dll)
  - Identifikasi semua teknologi, framework, dan library yang digunakan

Setelah analisis selesai, tampilkan ringkasan ke saya:
  ✅ Tech stack yang ditemukan
  ✅ Struktur folder utama
  ✅ Fitur-fitur yang ada
  ✅ Dependensi eksternal (API pihak ketiga, service, dll)
Tunggu konfirmasi saya sebelum lanjut menulis tutorial.

---

### 📋 LANGKAH 2 — Tulis Tutorial dengan Struktur Berikut

Tulis tutorial lengkap dengan struktur ini secara berurutan:

---

## 📌 Bagian 1: Gambaran Umum Sistem
  - Apa sistem ini dan apa fungsinya
  - Tech stack lengkap yang digunakan (beserta versi)
  - Arsitektur sistem (frontend, backend, database, dsb)
  - Diagram alur sistem jika memungkinkan (gunakan format ASCII atau Mermaid)

---

## 📌 Bagian 2: Prasyarat & Persiapan Lingkungan
  - Software yang harus diinstall (beserta versi minimum)
  - Akun atau akses eksternal yang dibutuhkan (API key, cloud service, dsb)
  - Cara verifikasi bahwa semua prasyarat sudah terpenuhi

---

## 📌 Bagian 3: Inisialisasi Proyek
  - Buat folder proyek
  - Inisialisasi project (npm init / laravel new / dll)
  - Setup Git repository
  - Konfigurasi .gitignore (tampilkan isi lengkapnya)
  - Install semua dependency (tampilkan perintah lengkapnya)

---

## 📌 Bagian 4: Struktur Folder & File
  - Tampilkan struktur folder lengkap sistem ini
  - Jelaskan fungsi setiap folder dan file penting
  - Buat semua folder yang diperlukan

---

## 📌 Bagian 5: Konfigurasi Environment
  - Buat file .env dengan semua variable yang dibutuhkan
  - Jelaskan setiap variable — apa fungsinya dan cara mendapatkan nilainya
  - Tampilkan contoh isi .env.example lengkap

---

## 📌 Bagian 6: Setup Database
  - Buat database
  - Jalankan migration / buat schema
  - Tampilkan struktur tabel/collection lengkap beserta relasinya
  - Jalankan seeder jika ada
  - Cara verifikasi database sudah benar

---

## 📌 Bagian 7: Implementasi Fitur (per fitur)
Untuk SETIAP fitur yang ada di sistem ini, tulis sub-bagian dengan format:

  ### Fitur: [Nama Fitur]
  **Deskripsi:** Apa yang dilakukan fitur ini

  **File yang terlibat:**
    - `path/ke/file.js` → fungsinya apa
    - `path/ke/file2.js` → fungsinya apa

  **Langkah implementasi:**
    1. Buat file ...
    2. Tulis kode berikut ... (tampilkan kode lengkap)
    3. Daftarkan ke ... (route, provider, dll)
    4. Cara test fitur ini

  **Hal penting yang perlu diperhatikan:**
    - Gotcha atau jebakan umum
    - Keputusan teknis dan alasannya

---

## 📌 Bagian 8: Integrasi & Konfigurasi Tambahan
  - Setup service pihak ketiga (jika ada)
  - Konfigurasi email, storage, payment, dsb (jika ada)
  - Setup cron job / queue / worker (jika ada)

---

## 📌 Bagian 9: Menjalankan Sistem
  - Perintah untuk menjalankan di mode development
  - Perintah untuk menjalankan di mode production
  - Cara verifikasi sistem berjalan dengan benar
  - URL dan endpoint penting

---

## 📌 Bagian 10: Troubleshooting
  - Error umum yang sering muncul dan cara mengatasinya
  - Cara reset sistem ke kondisi awal jika ada masalah
  - Cara mengecek log dan debugging

---

### ⚠️ LANGKAH 3 — Prinsip Penulisan Tutorial

Saat menulis tutorial, wajib ikuti prinsip berikut:
  1. **Lengkap & Mandiri** — orang yang belum pernah melihat sistem ini
     harus bisa mengikutinya tanpa bertanya apapun.
  2. **Tampilkan kode lengkap** — jangan tulis "tambahkan kode berikut"
     tanpa menampilkan isi kodenya secara penuh.
  3. **Urutan kronologis** — langkah harus bisa diikuti dari atas ke bawah
     tanpa perlu melompat-lompat.
  4. **Verifikasi di setiap tahap** — setiap bagian penting harus ada
     cara untuk memverifikasi bahwa langkah tersebut berhasil.
  5. **Jangan asumsikan** — jelaskan setiap perintah, jangan anggap
     pembaca sudah tahu.
  6. **Tandai bagian kritis** — gunakan ⚠️ untuk hal yang sering salah
     atau wajib diperhatikan.

---

### 🔄 LANGKAH 4 — Simpan & Verifikasi
Setelah tutorial selesai ditulis:
  1. Simpan ke `docs/BUILD_FROM_SCRATCH.md`
  2. Tampilkan daftar semua bagian yang berhasil ditulis
  3. Tandai jika ada bagian yang tidak bisa diisi karena informasi
     tidak tersedia di codebase (misalnya API key pihak ketiga)
  4. Tanyakan ke saya: "Apakah ada fitur atau bagian yang terlewat?"
```

---

## 🔄 Kapan File Ini Diperbarui?

File `BUILD_FROM_SCRATCH.md` wajib diperbarui setiap kali menjalankan
`COMMIT_INSTRUCTION.md`. Bagian yang diperbarui disesuaikan dengan
perubahan yang terjadi di sesi tersebut:

| Jenis Perubahan | Bagian yang Diperbarui |
|----------------|----------------------|
| Fitur baru | Bagian 7 — tambah sub-bagian fitur baru |
| Bug fix yang mengubah cara kerja | Bagian 7 — perbarui langkah terkait |
| Dependency baru | Bagian 2 & 3 — perbarui prasyarat & instalasi |
| Perubahan struktur folder | Bagian 4 — perbarui struktur |
| Perubahan skema database | Bagian 6 — perbarui schema & migration |
| Environment variable baru | Bagian 5 — perbarui .env.example |
| Integrasi service baru | Bagian 8 — tambah konfigurasi |
| Error baru ditemukan & solved | Bagian 10 — tambah troubleshooting |

---

## ⚠️ Catatan Penting

> `BUILD_FROM_SCRATCH.md` adalah **sumber kebenaran tunggal** untuk
> merekonstruksi sistem ini. Jaga agar selalu sinkron dengan kondisi
> sistem terkini. Jika file ini outdated, sistem tidak bisa dibangun ulang
> dengan benar.
