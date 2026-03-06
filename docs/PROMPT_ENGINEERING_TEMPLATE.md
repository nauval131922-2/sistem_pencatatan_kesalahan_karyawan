# Template Prompt Master (AI App Builder)

Gunakan struktur ini untuk mendapatkan hasil terbaik setiap kali Anda meminta AI membangun fitur baru atau sistem baru. Struktur ini dirancang agar AI memahami **Konteks Bisnis**, **Teknis**, dan **Estetika** secara bersamaan.

---

## [Bagian 1: Peran & Konteks]
> *Tujuannya agar AI bertindak sebagai profesional, bukan sekadar bot.*

**Prompt:**
"Bertindaklah sebagai Senior Full-stack Developer dan UI/UX Designer. Saya ingin membangun [Nama Sistem/Fitur]. Sistem ini bertujuan untuk [Tujuan Utama, misal: mencatat kesalahan karyawan secara real-time]."

---

## [Bagian 2: Tech Stack & Konfigurasi]
> *Agar AI tidak memberikan kode yang tidak kompatibel.*

**Prompt:**
"Gunakan teknologi berikut:
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **Icons**: Lucide React
- **Styling**: Tailwind CSS & Vanilla CSS (untuk custom glassmorphism)."

---

## [Bagian 3: Panduan Desain (UI/UX)]
> *Kunci agar tampilan website langsung terlihat premium dan 'waow'.*

**Prompt:**
"Terapkan desain dengan aturan estetika berikut:
- **Tema Warna**: [Misal: Sleek Dark Mode / Clean Emerald Green].
- **Style**: Glassmorphism (subtle blur, thin borders, soft shadows).
- **Typography**: Gunakan font modern seperti 'Outfit' atau 'Inter Tight'.
- **Interaksi**: Berikan hover effects dan micro-animations pada tombol dan kartu.
- **Layout**: Pastikan Full-width, responsif, dan memberikan whitespace yang cukup (tidak terlihat sesak)."

---

## [Bagian 4: Logika Bisnis & Fitur Spesifik]
> *Jelaskan alur kerjanya sejelah mungkin.*

**Prompt:**
"Detail Fitur yang harus Anda buat:
1. **[Fitur A]**: Deskripsikan fungsi utamanya.
2. **[Logika Khusus]**: Jelaskan perhitungan atau validasi yang rumit (misal: Harga otomatis muncul jika X dipilih).
3. **[Integrasi]**: Bagaimana fitur ini berhubungan dengan database atau tab lain (misal: Cross-tab sync via localStorage)."

---

## [Bagian 5: Format Output & Best Practices]
> *Menentukan kualitas kode.*

**Prompt:**
"Aturan tambahan:
- Tulis kode yang modular dan reusable (pecah jadi komponen kecil).
- Berikan penanganan error (error handling) dan state loading di setiap proses fetch.
- Jangan gunakan data placeholder; implementasikan logika yang sesungguhnya.
- Sertakan komentar singkat pada bagian logika yang kompleks."

---

### Tips Penggunaan:
1. **Jangan gabungkan semua fitur dalam 1 prompt panjang**. Berikan prompt Bagian 1-3 dulu untuk Setup, baru kemudian masuk ke Bagian 4 per fitur.
2. **Kirim Gambar**: Jika Anda punya corat-coret atau screenshot referensi, lampirkan bersama prompt ini.
3. **Minta 'Plan' Dulu**: Sebelum AI menulis kode, katakan: *"Berikan saya rencana teknis (Implementation Plan) terlebih dahulu sebelum menulis kode."*
