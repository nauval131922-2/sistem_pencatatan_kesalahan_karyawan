# AI Session Summary — SINTAK ERP

> Diperbarui: 2026-04-09 (Sesi Standardisasi Nomenklatur Modul)

---

## 1. Pekerjaan yang Diselesaikan Sesi Ini

### Standardisasi Nomenklatur Modul (Rename Massal)

Seluruh rename berikut telah diselesaikan dan di-commit ke branch `master`:

| Nama Lama | Nama Baru |
|---|---|
| SPPH Out | SPPH Keluar |
| SPH In | SPH Masuk |
| Purchase Order | Purchase Order (PO) |
| Penerimaan Pembelian | Penerimaan Barang |
| Pembelian Barang | Laporan Rekap Pembelian Barang |
| Bill of Material | Bill of Material Produksi |
| Bahan Baku | BBB Produksi |
| Barang Jadi | Penerimaan Barang Hasil Produksi |
| SPH Out | SPH Keluar |
| Sales Order | Sales Order Barang (+ dipindah ke SO > Laporan) |
| Pelunasan Piutang | Pelunasan Piutang Penjualan |

### Cakupan Audit per Rename (7 Titik Wajib)

Setiap rename disisir ke seluruh titik berikut:
1. **Sidebar** — menu navigasi (`Sidebar.tsx`)
2. **Metadata & PageHeader** — tab browser dan judul halaman (`page.tsx`)
3. **Client Component** — notifikasi sukses, footer tabel, log aktivitas
4. **SyncClient** — label modul di halaman Sinkronisasi Massal (`SyncClient.tsx`)
5. **ManualModal** — panduan pengguna tiap halaman (`ManualModal.tsx`)
6. **TrackingClient** — header kolom & relasi label tracking manufaktur
7. **Backend/API** — query JOIN & kondisi filter (`actions.ts`, `infractions/route.ts`, `items/route.ts`)

---

## 2. Catatan Teknis Penting

- **Database tidak berubah**: Tabel `bahan_baku`, `barang_jadi`, `sph_out`, `sales_orders` tetap menggunakan nama lama di schema dan query SQL. Hanya label UI yang diubah.
- **`jenis_barang` di infractions**: Nilai yang disimpan di database untuk pencatatan kesalahan kini menggunakan nama baru (BBB Produksi, Penerimaan Barang Hasil Produksi) untuk data BARU. Data lama tetap menggunakan nama lama — perlu dipertimbangkan apakah perlu migrasi data.
- **Sidebar Sales Order Barang**: Dipindah ke `Penjualan > Sales Order (SO) > Laporan > Sales Order Barang` (struktur 3 level).

---

## 3. Status Git

- **Branch**: `master`
- **Status**: Semua perubahan sudah di-commit dan di-push ke remote.
- **Commit groups**: Lihat log git untuk detail per kelompok.

---

## 4. Langkah Selanjutnya (Resume)

1. **Verifikasi migrasi data lama**: Cek apakah record `infractions` dengan `jenis_barang = 'Bahan Baku'` / `'Barang Jadi'` perlu di-update ke nama baru.
2. **Dashboard Utama**: Belum digarap — fokus ke `/dashboard/page.tsx` untuk perancangan tampilan utama.
3. **Pengujian UI**: Jalankan dev server dan verifikasi navigasi sidebar, modal panduan, dan form pencatatan kesalahan.
4. **Rename lanjutan** (jika ada): Gunakan panduan 7 titik di atas.

---

## 5. Aturan Rename Modul (Referensi Mandiri)

Setiap kali ada instruksi rename modul, selalu sisir **7 titik** berikut:

```
1. src/components/Sidebar.tsx              → label menu
2. src/app/[modul]/page.tsx               → metadata title + PageHeader title
3. src/app/[modul]/[Modul]Client.tsx      → notifikasi sukses + footer tabel
4. src/app/sync/SyncClient.tsx            → nama di MODULES array
5. src/components/ManualModal.tsx         → title + description + steps
6. src/app/tracking-manufaktur/TrackingClient.tsx → header + extraLabel kolom
7. src/lib/actions.ts + api routes         → kondisi JOIN & filter query
```

---

## 6. Struktur Sidebar Saat Ini (Referensi)

```
Pembelian
  ├── Penawaran
  │   ├── SPPH Keluar
  │   └── SPH Masuk
  ├── Purchase Order (PO)
  │   └── Purchase Order (PO)
  ├── Penerimaan
  │   └── Penerimaan Barang
  ├── Hutang
  │   └── Pelunasan Hutang
  └── Laporan
      └── Laporan Rekap Pembelian Barang

Produksi
  ├── Bill of Material Produksi
  ├── Order Produksi
  └── Laporan
      ├── BBB Produksi
      └── Penerimaan Barang Hasil Produksi

Penjualan
  ├── Penawaran
  │   └── SPH Keluar
  ├── Sales Order (SO)
  │   └── Laporan
  │       └── Sales Order Barang
  ├── Penjualan Barang
  │   └── Laporan
  │       └── Laporan Penjualan
  ├── Piutang
  │   └── Laporan
  │       └── Pelunasan Piutang Penjualan
  └── Pengiriman (SJ)
      └── Laporan
          └── Pengiriman
```
