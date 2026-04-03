# Ringkasan Sesi AI - 03 April 2026

## Ringkas
Sesi ini fokus pada:
1. **Standardisasi API routes** - Penambahan `export const dynamic = 'force-dynamic'` di semua endpoint API
2. **Standardisasi UI Client components** - Penambahan cache-buster `_t` di semua fetch client-side
3. **Improvement Tracking Manufaktur** - Refactor UI, helper `toTitleCase`, formatting number
4. **Pure raw_data** - Pastikan raw_data menyimpan data murni dari API MDT tanpa transformasi
5. **RenderAllFields** - Simplifikasi display Tracking Manufaktur dengan RenderAllFields

## Perubahan Utama

### 1. Standardisasi API Routes (33 files)
- Tambah `export const dynamic = 'force-dynamic'` di semua route.ts
- Endpoint: bahan-baku, barang-jadi, bom, employees, hpp-kalkulasi, orders, pelunasan-hutang, pelunasan-piutang, penerimaan-pembelian, pengiriman, pr, purchase-orders, rekap-pembelian-barang, sales-orders, sales, sph-in, sph-out, spph-out, tracking

### 2. Standardisasi UI Client Components (16 files)
- Tambah cache-buster `_t` di fetch client-side
- Komponen: BahanBakuClient, BarangJadiClient, BOMClient, OrderProduksiClient, PelunasanHutangClient, PelunasanPiutangClient, PenerimaanPembelianClient, PengirimanClient, PRClient, PurchaseOrderClient, PembelianBarangClient, SalesOrderClient, SalesReportClient, SphInClient, SPHOutClient, SpphOutClient

### 3. Pure raw_data dari API MDT
- `src/app/api/scrape-orders/route.ts`: Simpan data mentah MDT ke raw_data tanpa transformasi
- `src/app/api/tracking/route.ts`: Semua section (BOM, SPH, SO, Produksi, PR) pakai raw_data murni

### 4. Tracking Manufaktur Display (TrackingClient.tsx)
- helper `toTitleCase` untuk formatting field names
- Fix formatting number dengan separator ribuan Indonesia
- `RenderAllFields` untuk semua section (BOM, SPH Out, Sales Order, Order Produksi, Purchase Request)
- Code berkurang 200+ baris karena display menjadi generik dari raw_data

### 5. Utility Baru
- `src/lib/fts.ts` - Helper query FTS terpusat
- `src/lib/server-scraped-period.ts` - Helper scraper period
- `src/app/api/bom/scrape-period/` - Endpoint scrape period

## Dampak
- Semua API endpoint sekarang force-dynamic, tidak ada caching di server
- Client-side fetch menggunakan cache-buster untuk data fresh
- raw_data sekarang murni dari API MDT (tanpa transformasi)
- Tracking Manufaktur lebih sederhana dan konsisten
- Performa halaman scraper (list view) tetap bagus karena pakai definisi kolom manual

## Cara Cek Singkat
1. Uji scraping Order Produksi - cek raw_data apakah murni dari MDT
2. Uji Tracking Manufaktur - semua section tampil dari raw_data
3. Cek format angka di RenderAllFields (separator ribuan Indonesia)
4. Test FTS search di Orders, Bahan Baku, dll

## Testing
- `npm.cmd run init-db` berhasil
- `npm.cmd run lint` masih gagal karena backlog lint repo

## Lokasi untuk Sinkronisasi
- **Rumah**: Pull dari origin/master
- **Kantor**: Pull dari origin/master
- Pastikan `.env` dan database tidak ikut ter-push (sudah di .gitignore)
