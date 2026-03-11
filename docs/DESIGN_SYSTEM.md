# SIKKA Design System & UI Standard

Dokumen ini berisi standar teknis untuk menjaga konsistensi UI/UX di seluruh aplikasi SIKKA. **Setiap penambahan halaman baru WAJIB mengikuti standar ini.**

## 1. Komponen PageHeader
`src/components/PageHeader.tsx` adalah komponen tunggal untuk judul halaman.

### Aturan Implementasi:
- **Wajib di Server Component**: Letakkan `PageHeader` di file `page.tsx` (Server), bukan di dalam `ClientComponent.tsx`. Ini memastikan posisi vertikal yang identik saat navigasi.
- **Props**:
  - `title`: Judul halaman (String).
  - `description`: Penjelasan singkat (String/Node).
  - `showHelp`: Default `true`. Set `false` untuk halaman internal/manajemen seperti Statistik, Kelola User, dan Profil.
  - `rightElement`: Elemen opsional di pojok kanan (misal: Button Tambah).

## 2. Struktur Root Container Halaman
Setiap halaman utama harus dibungkus oleh `div` dengan spesifikasi kelas berikut:

```tsx
<div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
  <PageHeader title="..." description="..." />
  {/* Konten selanjutnya */}
</div>
```

### Penjelasan Kelas:
- `flex-1 min-h-0`: Penting agar kontainer bisa discroll secara internal (terutama table).
- `gap-6`: Standar jarak antar elemen (Header -> Control Panel -> Tabel).
- `animate-in ...`: Standar animasi transisi masuk halaman (Soft Slide Up).

## 3. Pola "Control Panel"
Interaksi utama seperti Search, Filter, dan Tombol diletakkan dalam kartu horizontal tepat di bawah Header.

### Standar Styling:
- **Container**: `bg-white border border-gray-200 shadow-sm rounded-[10px] px-5 py-3.5 flex items-center justify-between`
- **Search Input**: Tinggi `h-10`, rounded `rounded-xl`, background `bg-slate-50`.
- **Primary Button**: Warna `#16a34a` (Emerald 600), tinggi `h-10`, rounded `rounded-lg`, font `font-extrabold`.

## 4. Spasi Vertikal (Vertical Spacing)
- Hilangkan margin internal pada komponen. Gunakan `gap` pada parent container untuk mengontrol jarak.
- Jarak antar baris tabel: `h-10` (40px) untuk menjaga kepadatan data namun tetap terbaca dengan baik.

---
*Terakhir diperbarui: 11 Maret 2026*
