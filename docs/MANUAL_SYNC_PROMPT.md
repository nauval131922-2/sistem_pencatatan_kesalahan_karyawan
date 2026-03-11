# 📜 Panduan Sinkronisasi Manual SIKKA (ManualModal.tsx)

Dokumen ini berisi instruksi dan prompt khusus untuk AI agar dapat memperbarui panduan dalam sistem SIKKA dengan tingkat akurasi 100% terhadap UI dan fitur teknis terbaru.

---

## 🚀 Prompt Utama (Gunakan Saat Fitur Berubah)

Salin dan tempel prompt di bawah ini jika terdapat perubahan fitur pada suatu menu atau jika ada penambahan menu baru:

> **Tugas:**
> Perbarui panduan di file `ManualModal.tsx` untuk menu **[Sebutkan Nama Menu Di Sini]**.
>
> **Langkah-langkah yang harus dilakukan AI:**
> 1. **Analisis Kode:** Baca file implementasi halaman menu tersebut (Page dan Client component) untuk memahami logika terbarunya (misalnya: Parallel Sync, Infinite Scroll, atau Filter baru).
> 2. **Harmonisasi Istilah:** Pastikan SEMUA nama tombol, label input, dan kolom tabel di panduan **PERSIS SAMA** dengan yang tertulis di kode UI. Jangan gunakan istilah umum jika di UI tertulis istilah spesifik.
> 3. **Format Standar SIKKA:**
>    - Gunakan format objek: `title`, `icon`, `description`, dan `steps`.
>    - Gunakan **bold** (`**teks**`) untuk istilah kunci/label UI.
>    - Jika ada sub-step, gunakan bullet point (`•`).
>    - Gunakan bahasa yang profesional namun mudah dipahami (Kualitas Premium).
>    - Sebutkan integrasi data: Dari mana data berasal dan ke mana data tersebut akan digunakan (Source/Integration).
> 4. **Poin Teknis Penting (Jika Ada):**
>    - Jika ada proses tarik data, sebutkan fitur **Parallel Sync** atau **Indikator Persentase**.
>    - Jika ada tabel besar, sebutkan fitur **Infinite Scroll**.
>    - Sebutkan fitur **Status Update/Nama File** jika ada di header.
>
> **Tujuan Akhir:**
> Pastikan pengguna yang membaca panduan ini merasa melihat cerminan langsung dari apa yang ada di layar mereka.

---

## 🛠️ Standar Penulisan Panduan SIKKA

Untuk menjaga konsistensi desain dan pengalaman pengguna, ikuti aturan berikut:

### 1. Struktur Objek Data
Setiap panduan dalam `ManualModal.tsx` harus mengikuti struktur ini:
```typescript
'/route-name': {
  title: 'Nama Menu di UI',
  icon: IconLucide, // pastikan di-import di bagian atas
  description: 'Kalimat singkat tentang kegunaan menu ini.',
  steps: [
    'Poin pertama menggunakan **Label Tombol** yang akurat.',
    'Poin kedua menjelaskan alur **Proses Sinkronisasi**.',
    'Poin ketiga tentang **Pencarian** dan filter data.',
    '  • Sub-poin detail menggunakan bullet point.'
  ],
  tips: 'Opsional: Berikan tips ekstra untuk efisiensi pengguna.'
}
```

### 2. Harmonisasi Istilah (Glossary SIKKA)
Jangan gunakan kata lain selain yang ada di UI:
- **SALAH:** "Klik tombol buat PDF" | **BENAR:** "Klik tombol **Cetak Rekap PDF**"
- **SALAH:** "Cari data di tabel" | **BENAR:** "Gunakan **Kotak Pencarian**"
- **SALAH:** "Ambil data dari Digit" | **BENAR:** "Klik tombol **Tarik Data** (Parallel Sync)"

### 3. Visual & Aesthetic
- Pastikan penggunaan **bold** merujuk pada elemen interaktif yang bisa dilihat pengguna.
- Kalimat pembuka (`description`) harus menjelaskan *value* dari menu tersebut bagi bisnis/admin.

---
*Dokumen ini diperbarui secara otomatis ketika fitur panduan disempurnakan.*
