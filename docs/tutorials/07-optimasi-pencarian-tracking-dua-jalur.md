# Tutorial 07: Optimasi Pencarian Tracking Dua Jalur (BOM & Rekap)

Tutorial ini menjelaskan pengembangan fitur **Tracking Manufaktur** yang kini mendukung dua pintu masuk pencarian: via **BOM (Top-Down)** dan via **Nama Barang/Rekap Pembelian (Bottom-Up)**.

## 1. Latar Belakang
Sebelumnya, pelacakan hanya bisa dimulai dari nomor BOM. User yang ingin melacak status material dari sisi pembelian (Rekap Pembelian) harus mencari manual nomor BOM-nya terlebih dahulu. Hal ini tidak efisien untuk tim logistik dan pembelian.

## 2. Perubahan Utama

### A. UI Filter Ganda
Dashboard kini memiliki dua kartu filter berdampingan (50/50 width):
1.  **Pilih BOM**: Untuk pelacakan progres produksi dari awal.
2.  **Pilih Nama Barang**: Untuk pelacakan mundur dari dokumen pembelian (Faktur PB).

**Fitur UI:**
-   **Mutual Exclusion**: Memilih salah satu filter akan otomatis mengosongkan pilihan filter lainnya.
-   **Clean UI**: Menghapus tombol "Bersihkan" manual demi tampilan yang lebih minimalis.

### B. Logika Backward Tracing (API)
Implementasi di `src/app/api/tracking/route.ts` memungkinkan sistem merunut balik dokumen dari bawah ke atas jika user mencari berdasarkan Faktur PB:
`Rekap Pembelian (PB) -> PO -> SPH In -> SPPH -> PR -> Order Produksi -> BOM`

### C. Kolom Dinamis & Label Cerdas
Untuk menjaga kebersihan data, tabel akan menyembunyikan kolom produksi jika user sedang melacak dari sisi pembelian (Rekap).
-   **Dynamic Labels**: Kolom PO akan menampilkan label `(via Rekap.faktur_po = PO.faktur)` jika dilacak dari Rekap, dan `(via SPH In.faktur = PO.faktur_sph)` jika dilacak dari BOM.
-   **Deep Linking BBB**: Pencarian Bahan Baku kini melakukan pencarian ke dalam JSON `raw_data` (field `hp_detil`) untuk menemukan pemakaian spesifik Faktur PB tersebut.

## 3. Implementasi Kode Penting

### Backend: Pencarian di JSON `raw_data`
```typescript
// Mencari penggunaan Faktur PB spesifik di dalam detail bahan baku
prdFaktur ? db.execute({
  sql: `SELECT * FROM bahan_baku WHERE faktur_prd = ? OR raw_data LIKE ?`,
  args: [prdFaktur, `%${targetFaktur}%`]
}) : ...
```

### Frontend: Kolom Dinamis
```typescript
if (trackingData && !trackingData.bom) {
   const hideIds = ['bom', 'sph', 'so', 'production', 'pr', 'spph', 'sph_in', ...];
   return allCols.filter(col => !hideIds.includes(col.id));
}
```

## 4. Hasil Akhir
User kini memiliki fleksibilitas penuh untuk memantau manufaktur, baik dari sisi perencanaan (BOM) maupun dari sisi realitas pengadaan material (Rekap Pembelian).
