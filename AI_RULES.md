# AI Project Rules & Guidelines

Dokumen ini adalah **Hukum Tertinggi** bagi asisten AI yang bekerja pada repository ini. **BACA DAN PATUHI** sebelum melakukan perubahan kode apa pun.

---

## 🎨 Standar UI/UX (Prioritas Utama)

### 1. Tipografi & Keterbacaan
- **Font Size**: Untuk konten data padat (terutama tabel), gunakan ukuran font antara **10px - 12px**.
- **Line Height**: Selalu gunakan `leading-normal` atau `leading-relaxed` agar teks tidak terlihat "dempet" meskipun fontnya kecil.
- **Warna**: Gunakan palet warna yang harmonis (misal: `slate-800` untuk teks utama, `gray-500` untuk metadata). Hindari warna dasar (pure red/blue).

### 2. Layout Modul (Card-Based)
- **Struktur**: Semua sel data dalam dashboard pelacakan (Tracking Manufaktur, dll) harus dibungkus dalam kontainer **Card**.
- **Styling Card**: `bg-white border border-gray-100 rounded-lg p-3 shadow-sm`.
- **Alignment**: Semua lencana (*badge*), nomor faktur, dan teks identitas harus **Rata Kiri (Left-Aligned)**. Jangan direntangkan (*stretch*) atau diketengahkan.

### 3. Jarak & Spasi (High-Density)
- Gunakan spasi yang padat namun memiliki "ruang bernapas".
- Standar padding sel: `pt-1.5 pb-3.5` (agar dekat dengan header tapi ada jarak antar baris).
- Standar gap antar elemen dalam kartu: `gap-2` sampai `gap-2.5`.

---

## 🛠️ Standar Fungsional & Interaksi

### 1. Fitur Drag-to-Scroll
- Tabel dengan data lebar **WAJIB** mendukung fitur geser dengan klik-tahan (*drag-to-scroll*).
- **Kursor**: Gunakan `cursor-grab` saat sorot (*hover*) dan `active:cursor-grabbing` saat diklik/geser.
- Gunakan `select-none` saat proses geser berlangsung agar teks tidak sengaja tersorot.

### 2. Efek Hover
- Untuk tabel data sangat padat (seperti Tracking Manufaktur), nonaktifkan warna background hover baris (`disableHover={true}`) jika kartu di dalamnya sudah memberikan kontras yang cukup.

### 3. Integritas Data
- **Paritas 1:1**: Jangan pernah melakukan improvisasi atau "mengarang" label/status jika tidak ada di database. Tampilkan nilai mentah dari database sebagaimana adanya.
- **Keamanan**: Selalu gunakan null-safe check (opsional chaining `?.`) dan fallback value (misal: `|| 0`) agar aplikasi tidak crash saat data kosong.

---

## 📝 Aturan Penulisan Kode & Kerja

- **Commit Messages**: Selalu sampaikan pesan commit dalam **Bahasa Indonesia** yang deskriptif.
- **No Placeholders**: Jangan gunakan gambar placeholder. Gunakan `generate_image` atau data asli.
- **Workflow**: Jika melakukan perbaikan bug, ikuti workflow `/debug-safe-fixing`.
- **Dokumentasi**: Perbarui `AI_SESSION_SUMMARY.md` atau `task.md` secara berkala untuk menjaga kesinambungan antar sesi.

---

> [!IMPORTANT]
> Aturan ini bersifat dinamis. Jika ada instruksi baru dari USER yang bersifat permanen, segera perbarui dokumen ini.
