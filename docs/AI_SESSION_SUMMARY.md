# Ringkasan Sesi AI - 03 April 2026

## Ringkas
Sesi ini fokus pada:
1. **Standardisasi API routes** - Penambahan `export const dynamic = 'force-dynamic'` di semua endpoint API
2. **Standardisasi UI Client components** - Penambahan cache-buster `_t` di semua fetch client-side
3. **Improvement Tracking Manufaktur** - Refactor UI BOM card, helper `toTitleCase`, formatting number, debug tools
4. **Utility baru** - FTS query helper, scraper period helper, debug endpoint
5. **Schema database** - Penambahan kolom dan index baru

## Perubahan Utama

### 1. Standardisasi API Routes (33 files)
- Tambah `export const dynamic = 'force-dynamic'` di semua route.ts
- Endpoint: bahan-baku, barang-jadi, bom, employees, hpp-kalkulasi, orders, pelunasan-hutang, pelunasan-piutang, penerimaan-pembelian, pengiriman, pr, purchase-orders, rekap-pembelian-barang, sales-orders, sales, sph-in, sph-out, spph-out, tracking

### 2. Standardisasi UI Client Components (16 files)
- Tambah cache-buster `_t` di fetch client-side
- Komponen: BahanBakuClient, BarangJadiClient, BOMClient, OrderProduksiClient, PelunasanHutangClient, PelunasanPiutangClient, PenerimaanPembelianClient, PengirimanClient, PRClient, PurchaseOrderClient, PembelianBarangClient, SalesOrderClient, SalesReportClient, SphInClient, SPHOutClient, SpphOutClient

### 3. Tracking Manufaktur (TrackingClient.tsx)
- Refactor layout BOM card dengan section yang lebih rapi
- Tambah helper `toTitleCase` untuk formatting field names
- Fix formatting number: ID field tanpa separator ribuan, currency field dengan prefix Rp
- Tambah debug endpoint `/api/debug-raw-data`

### 4. Utility Baru
- `src/lib/fts.ts` - Helper query FTS terpusat
- `src/lib/server-scraped-period.ts` - Helper scraper period
- `src/app/api/bom/scrape-period/` - Endpoint scrape period

### 5. Schema Database
- Penambahan kolom dan index di `src/lib/schema.ts`
- Update scraper period di `src/lib/scraper-period.ts`

## Dampak
- Semua API endpoint sekarang force-dynamic, tidak ada caching di server
- Client-side fetch menggunakan cache-buster untuk data fresh
- UI Tracking lebih terstruktur dan mudah di-maintain
- FTS query konsisten antar endpoint

## Cara Cek Singkat
1. Uji pencarian di halaman Tracking Manufaktur
2. Cek format angka di RenderAllFields (ID tanpa separator, currency dengan Rp)
3. Uji scraping data dan pastikan cache-buster bekerja
4. Test FTS search di Orders, Bahan Baku, dll

## Testing
- `npm.cmd run init-db` berhasil
- `npm.cmd run lint` masih gagal karena backlog lint repo yang sudah ada sejak sebelumnya

## Lokasi untuk Sinkronisasi
- **Rumah**: Pull dari origin/master
- **Kantor**: Pull dari origin/master
- Pastikan `.env` dan database tidak ikut ter-push (sudah di .gitignore)
