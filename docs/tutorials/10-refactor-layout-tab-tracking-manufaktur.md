# 튜토리얼 10: Refaktor Layout Tab pada Tracking Manufaktur

## 📝 Deskripsi
Modul Tracking Manufaktur telah diperbarui dari layout tabel multi-kolom horizontal yang kaku menjadi sistem navigasi berbasis **Tab**. Perubahan ini meningkatkan kejelasan data untuk setiap tahapan produksi (BOM, SO, BBB, dll) dengan tetap mempertahankan kemampuan pelacakan dua jalur (BOM vs Rekap Pembelian).

## 🚀 Langkah-langkah Implementasi

### 1. Definisi Konfigurasi Tab
Dibuat sebuah array `tabs` yang memetakan setiap ID tahapan ke label, badge status, dan fungsi pengambil data (`getData`) dari `trackingData`.

```typescript
const tabs = useMemo(() => {
   const allTabs = [
      { id: 'bom', label: 'Bill of Material', getData: () => trackingData.bom ? [trackingData.bom] : [] },
      { id: 'bahan_baku', label: 'BBB Produksi', getData: () => trackingData.bahanBaku || [] },
      // ... tab lainnya
   ];
   // Filter tab berdasarkan jalur trackingPath (BOM vs Rekap)
   return isBomPath ? allTabs : allTabs.filter(t => !hideIds.includes(t.id));
}, [trackingData, trackingPath]);
```

### 2. Logic Filtering Terpusat (`filterRows`)
Menggunakan `useCallback` untuk menerapkan filter teks (`debouncedFilterText`) dan filter tanggal (`startDate`/`endDate`) secara konsisten baik pada data tabel yang aktif maupun pada perhitungan badge jumlah data di header tab.

```typescript
const filterRows = useCallback((rawRows: any[]) => {
   let rows = [...rawRows];
   // Filter Tanggal (Khusus Jalur Barang)
   if (trackingPath === 'rekap' && (startDate || endDate)) {
      rows = rows.filter(r => { /* logic parseIndoDate */ });
   }
   // Filter Teks
   if (debouncedFilterText) {
      rows = rows.filter(r => /* logic search */);
   }
   return rows;
}, [trackingPath, startDate, endDate, debouncedFilterText]);
```

### 3. Rendering Tabel Dinamis
Tabel di-render secara otomatis dengan mendeteksi kunci (keys) dari data mentah (`activeTabData.columns`) untuk dijadikan header kolom, sehingga tabel selalu sinkron dengan struktur data API tanpa perlu hardcoding kolom.

### 4. Pagination & Footer Premium
- **Pagination**: Implementasi pagination manual (25 baris per halaman) yang diletakkan di sisi kanan footer.
- **Dynamic Badges**: Jumlah data pada setiap tab di header diperbarui secara real-time saat filter teks atau tanggal berubah.
- **Total Qty Badge**: Menampilkan akumulasi `qty` secara otomatis di footer khusus untuk tab **BBB Produksi** dan **Barang Hasil Produksi** pada jalur Filter Barang.

## 💡 Tips UX
- Tab yang memiliki data akan berwarna hijau pada badge-nya, memudahkan identifikasi tahapan yang terisi.
- Filter tanggal hanya aktif pada jalur "Cari Barang" untuk menghindari kebingungan saat melacak via struktur BOM yang bersifat statis.
