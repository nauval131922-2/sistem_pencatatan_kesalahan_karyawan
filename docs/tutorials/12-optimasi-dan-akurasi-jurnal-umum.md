# Tutorial 12: Optimasi dan Akurasi Jurnal Umum

Tutorial ini menjelaskan langkah-langkah yang diambil untuk menstabilkan modul Jurnal Umum, mulai dari integritas data hingga akurasi kalkulasi Laba/Rugi.

## 1. Problem Statement
- **Missing Rows**: Data melompat saat scrolling cepat karena race condition pada infinite scroll.
- **Saldo Awal Tidak Akurat**: Kalkulasi saldo awal tidak mematuhi filter rentang tanggal utama.
- **Inkonsistensi Format Tanggal**: Format tanggal dari API Digit tidak seragam (ada `DD-MM-YYYY`, `D/M/YY`, dll) yang merusak filter SQL.
- **Integritas Child Rows**: Baris anak (item transaksi) tidak memiliki timestamp `create_at` sehingga tidak bisa difilter secara kronologis.

## 2. Solusi Teknis

### A. Resiliensi Infinite Scroll
Mencegah lonjakan halaman yang tidak diinginkan dengan menggunakan `useRef` sebagai gembok (blocker) sinkron:

```typescript
const isLoadingMore = useRef(false);

const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
  const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
  if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && !isLoadingMore.current && (data?.length || 0) < totalCount) {
    isLoadingMore.current = true; // Lock
    setPage(prev => prev + 1);
  }
}, [loading, data, totalCount]);
```

### B. Normalisasi Tanggal & Migrasi
Mengubah semua format tanggal di database menjadi standar `YYYY-MM-DD` dan memperbarui scraper agar melakukan normalisasi sebelum `INSERT`.

```typescript
const normalizeDate = (raw: string) => {
  if (!raw) return '';
  const parts = raw.split(/[-/]/);
  if (parts.length !== 3) return raw;
  const d = parts[0].padStart(2, '0');
  const m = parts[1].padStart(2, '0');
  let y = parts[2];
  if (y.length === 2) y = '20' + y;
  return `${y}-${m}-${d}`;
};
```

### C. Pewarisan Timestamp (Inheritance)
Memastikan baris `child` mewarisi `create_at` dari `parent` saat proses scraping agar filter server-side tetap akurat untuk item di dalam faktur.

### D. Akurasi Saldo Awal (Server-Side)
Query Saldo Awal sekarang mematuhi tiga lapis filter:
1. `tgl BETWEEN ? AND ?` (Rentang laporan).
2. `create_at < ?` (Dibuat sebelum tanggal filter).
3. `search` (Pencarian teks).

## 3. Hasil Akhir
- Transaksi tidak lagi "hilang" saat di-scroll.
- Saldo berlanjut (running total) konsisten meskipun berpindah halaman (pagination).
- Notasi `(L)` untuk Laba dan `(R)` untuk Rugi mempermudah pembacaan laporan.
