# Tutorial: Standardisasi Manual Modal & Sinkronisasi UI/UX (SOPd & Master Pekerjaan)

## Konteks
Panduan pengguna di dalam `ManualModal.tsx` sering kali tertinggal dibanding pembaruan fitur di layar. Tutorial ini menjelaskan cara menyelaraskan panduan manual agar sesuai dengan implementasi terbaru, khususnya untuk fitur **Inline Editing** dan **Upload Excel**.

## Langkah-Langkah Perubahan

### 1. Analisis Implementasi UI
Sebelum memperbarui manual, baca file Client Component (misal `SopdClient.tsx` atau `MasterPekerjaanClient.tsx`) untuk mengidentifikasi:
- Label tombol yang sebenarnya (misal: **Pilih & Upload Excel**).
- Placeholder pencarian.
- Interaksi khusus (misal: **Klik 2x** untuk edit).
- Filter yang tersedia (**Kategori**, **Sub Kategori**, dll).

### 2. Memperbarui ManualModal.tsx
Tambahkan atau perbarui objek panduan di dalam `allGuides` pada file `src/components/ManualModal.tsx`.

#### Contoh Struktur Objek:
```typescript
'/route-halaman': {
  title: 'Nama Menu',
  icon: IconLucide, // Sesuaikan dengan icon di sidebar/header
  description: 'Deskripsi singkat kegunaan menu.',
  steps: [
    'Instruksi langkah demi langkah...',
    'Gunakan **Teks Tebal** untuk label UI.',
    '  • Gunakan bullet point untuk sub-instruksi.'
  ]
}
```

### 3. Penyelarasan Istilah (Harmonisasi)
- **Judul Deskripsi**: Gunakan istilah yang disepakati (misal: **Order Produksi** bukan *Sisa Order Produksi*).
- **Referal Menu**: Pastikan nama menu tujuan benar (misal: **Jurnal Harian Produksi**).
- **Upload Card**: Selaraskan teks bantuan di kartu upload agar tidak destruktif (Gunakan: *"Sistem akan memperbarui daftar... berdasarkan versi terbaru"* daripada *"Data lama akan dihapus"*).

## Best Practices
- **Premium Aesthetics**: Gunakan bahasa yang profesional namun mudah dimengerti.
- **Teknis & Interaksi**: Sebutkan cara interaksi seperti "Klik 2x" agar user tahu ada fitur tersembunyi seperti inline edit.
- **Audit Rutin**: Setiap ada penambahan kolom atau tombol baru, wajib memperbarui `ManualModal.tsx` di turn yang sama.

## Contoh Kasus: SOPd & Master Pekerjaan
Pada sesi ini, kita menyelaraskan manual untuk SOPd dan Master Pekerjaan untuk mencakup:
- **SOPd**: Fitur edit harga dan tanggal secara langsung di tabel.
- **Master Pekerjaan**: Penggunaan filter kategori bertingkat.
