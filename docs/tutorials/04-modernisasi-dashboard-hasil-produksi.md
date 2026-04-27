# Tutorial 04: Modernisasi Dashboard Hasil Produksi

Tutorial ini menjelaskan langkah-langkah perbaikan dan optimasi yang dilakukan pada dashboard **Hasil Produksi** untuk meningkatkan performa, stabilitas UI, dan pengalaman pengguna di berbagai ukuran layar.

## 1. Optimasi Tata Letak Filter (Responsif)

Untuk memaksimalkan ruang kerja pada layar monitor ultra-lebar (2XL), seluruh kontrol filter digabungkan ke dalam satu baris horizontal.

### Langkah-langkah:
1. Mengubah container filter utama menjadi `flex-row` pada breakpoint `2xl`.
2. Mengatur `items-end` agar label dan input sejajar secara vertikal di bagian bawah.
3. Memberikan bobot `flex-1` pada pilihan SOPd dan `flex-[2]` pada grup filter lainnya untuk distribusi lebar yang proporsional.

```tsx
// src/app/hasil-produksi/HasilProduksiClient.tsx
<div className="flex flex-col 2xl:flex-row items-stretch 2xl:items-end gap-6 relative">
  {/* SOPd Selection */}
  <div className="flex-1 min-w-[300px]">...</div>
  {/* Combined Date, Bagian, Pekerjaan */}
  <div className="flex-[2] flex flex-col lg:flex-row lg:items-end gap-6">...</div>
</div>
```

## 2. Perbaikan "Leak" pada Sticky Header

Masalah konten yang "mengintip" di atas sticky header saat di-scroll diperbaiki dengan teknik **Background Extension**.

### Masalah:
Karena parent container memiliki padding, posisi `sticky top-0` atau `-top-6` meninggalkan celah transparan di mana konten dari bawah terlihat saat melintasi area tersebut.

### Solusi:
Menambahkan elemen dekoratif `absolute` di dalam header yang memanjang ke atas untuk menutupi zona bocor tersebut.

```tsx
// src/app/hasil-produksi/page.tsx
<div id="sticky-page-header" className="sticky -top-6 z-[80] bg-[var(--bg-deep)] py-6 -mt-6 relative">
  {/* Menutup area bocor 64px ke atas */}
  <div className="absolute inset-x-0 -top-16 h-16 bg-[var(--bg-deep)]" />
  <PageHeader ... />
</div>
```

## 3. Optimasi Performa Dropdown (Virtualization Ringan)

Dropdown "Pekerjaan" dan "Bagian" yang memiliki ratusan item menyebabkan lag saat dibuka. Hal ini diperbaiki dengan membatasi jumlah elemen yang di-render.

### Langkah-langkah:
1. Menggunakan `useMemo` untuk memfilter data berdasarkan input pencarian.
2. Membatasi (`slice`) hasil yang di-render maksimal 30 item pertama.
3. Menampilkan indikator jika ada lebih banyak data yang belum ditampilkan.

```tsx
// src/app/hasil-produksi/HasilProduksiClient.tsx
const filteredPekerjaan = useMemo(() => {
  const all = ['', ...availablePekerjaan].filter(c => ...);
  return { items: all.slice(0, 30), total: all.length };
}, [availablePekerjaan, searchQuery]);
```

## 4. Stabilisasi Popup UI (Portal)

Elemen seperti **DatePicker** dan **Custom Dropdown** sering kali terpotong jika berada di dalam kontainer dengan `overflow-hidden`. Semua popup dipindahkan menggunakan **React Portal**.

### Implementasi:
1. Menghitung koordinat elemen pemicu (trigger) menggunakan `getBoundingClientRect()`.
2. Me-render popup di luar struktur DOM komponen menggunakan `<Portal>`.
3. Menyesuaikan posisi popup secara dinamis agar selalu terlihat di viewport.

---

> [!TIP]
> Gunakan `whitespace-nowrap` pada teks tab atau tombol panjang untuk mencegah teks pecah menjadi dua baris di layar menengah.

## 5. Sinkronisasi Sticky UI dan Native Scrolling

Masalah terbesar pada versi sebelumnya adalah efek *layout jumping* dan *nested scroll* yang membuat pergerakan halaman menjadi tersendat-sendat, serta tab menu yang tidak menempel dengan baik saat layar di-_scroll_.

### Langkah-langkah Perbaikan:
1. **Pemisahan Kontainer Tab**: Mengeluarkan elemen navigasi (tab) dari dalam kontainer filter menjadi elemen mandiri dengan _behavior_ `sticky` sehingga dapat tetap menempel mulus pada saat _scroll_ meskipun di perangkat _mobile_.
2. **Kalkulasi Offset Dinamis**: Memperbarui kalkulasi `ResizeObserver` agar mampu mendeteksi perubahan tinggi secara dinamis antara mode _desktop_ (di mana filter memiliki _sticky_) dan _mobile_.
3. **Penghapusan Nested Scroll**: Menghapus kelas seperti `overflow-y-auto`, `flex-1`, dan tinggi statis (`calc(100dvh - ...)`) dari kontainer isi tabel. Ini mengizinkan _native document scrolling_, mengeliminasi masalah "terperangkap" dalam _scrollbar_ ganda dan menjadikan pergerakan halaman satu-kesatuan yang _smooth_.

## 6. Standarisasi Komponen Footer Pagination

Tampilan footer yang berisi pagination dirombak ulang agar sejalan secara presisi dengan gaya yang ada di layar `SOPdClient` (serta seluruh desain _Neobrutalism_).

### Detail Standarisasi:
- **Layout Terbagi (Kiri-Kanan)**: Memisahkan tampilan ke sisi kiri untuk "Keterangan Data" dan "Total Rekapitulasi", serta sisi kanan untuk "Kontrol Pagination" dan "Load Speed Badge".
- **Penyembunyian Responsif**: Menggunakan `hidden md:flex` dan `hidden md:block` pada teks informasi (Menampilkan X dari Y) serta *badge load speed*, memastikan di layar ponsel hanya tombol kontrol angka halamannya saja yang tampil agar UI tidak kepenuhan.
- **Konsistensi Ikonografi**: Mengganti teks statis "Prev" dan "Next" menggunakan ikon panah dari `lucide-react` dengan desain tombol presisi (proporsi 1:1, lebar dan tinggi sama `w-8 h-8`) persis dengan standardisasi komponen.
