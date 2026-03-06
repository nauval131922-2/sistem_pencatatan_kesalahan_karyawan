# SIKKA - Analisis Arsitektur & Reverse Engineering

> **SIKKA = Sistem Informasi Pencatatan Kesalahan Karyawan**
> PT. Buya Barokah, Divisi Percetakan

---

## 0. Architecture Map (Gambaran Besar)

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         BROWSER                              │
│  ┌─────────┐    ┌──────────────────────────────────────┐    │
│  │ Sidebar │    │           Main Content Area           │    │
│  │ (Nav)   │    │  (Page Components per route)          │    │
│  └─────────┘    └──────────────────────────────────────┘    │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP / fetch()
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   NEXT.JS SERVER (App Router)                │
│                                                              │
│  ┌──────────────┐   ┌───────────────┐   ┌────────────────┐  │
│  │ Server Pages │   │  API Routes   │   │ Server Actions │  │
│  │ (RSC)        │   │ /api/...      │   │ lib/actions.ts │  │
│  └──────┬───────┘   └──────┬────────┘   └───────┬────────┘  │
│         │                  │                     │           │
│         └──────────────────┴─────────────────────┘           │
│                            │                                 │
│                     ┌──────▼──────┐                          │
│                     │  lib/db.ts  │  (SQLite via better-     │
│                     │  (Database) │   sqlite3)               │
│                     └─────────────┘                          │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP fetch (scraping)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              SISTEM DIGIT (ERP Eksternal)                    │
│   https://buyapercetakan.mdthoster.com/il/                   │
│   (Sumber data: Orders, Bahan Baku, Barang Jadi, Penjualan)  │
└──────────────────────────────────────────────────────────────┘
```

### Main Modules

| Modul | Folder | Peran |
|-------|--------|-------|
| **Pages** | `src/app/[route]/page.tsx` | Setiap halaman UI (Server Component) |
| **Components** | `src/components/` | UI yang bisa dipakai ulang |
| **API Layer** | `src/app/api/[route]/route.ts` | REST API endpoint |
| **Data Layer** | `src/lib/` | Database, Server Actions, Utilities |
| **Scraper** | `src/app/api/scrape-*/route.ts` | Tarik data dari sistem Digit |

### Request Flow

```
User klik menu "Order Produksi"
      │
      ▼
Next.js Router → /orders (page.tsx)  ← Server Component
      │
      ▼
OrderProduksiClient.tsx (Client Component)
      │ useEffect → fetch('/api/orders?page=1...')
      ▼
/api/orders/route.ts   ← API Route Handler
      │ db.prepare(...).all()
      ▼
lib/db.ts → database_dev.sqlite / database.sqlite
      │
      ▼
JSON response → UI dirender → Data muncul di tabel
```

### Data Flow

```
[Digit ERP] ──scrape──▶ /api/scrape-orders ──upsert──▶ [SQLite DB]
                                                              │
              ┌───────────────────────────────────────────────┘
              │
              ▼
/api/orders  ──JSON──▶  OrderProduksiClient.tsx  ──state──▶  <table>

[Form Catat Kesalahan]
      │ User isi form → submit
      ▼
RecordsForm.tsx  ──POST /api/infractions──▶  DB
      │
      ▼
/api/infractions/next-faktur  ──generate──▶  ERR-DDMMYY-XXX
```

---

## 1. Project Overview

### Tujuan Aplikasi
SIKKA adalah sistem **pencatatan kesalahan karyawan** untuk divisi percetakan PT. Buya Barokah. Sistem ini mengambil data dari ERP eksternal (Digit), lalu menggunakannya sebagai basis untuk mencatat dan melacak kesalahan karyawan.

### Teknologi Utama

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js 16** | 16.1.6 | Full-stack framework (App Router) |
| **React 19** | 19.2.3 | UI rendering |
| **TypeScript 5** | ^5 | Type safety |
| **better-sqlite3** | ^12 | Database SQLite (server-side only) |
| **Tailwind CSS 4** | ^4 | Styling utility-first |
| **lucide-react** | ^0.575 | Icon library |
| **jsPDF + autotable** | ^4 | Ekspor laporan PDF |
| **xlsx** | ^0.18 | Baca file Excel (upload HPP Kalkulasi) |
| **recharts** | ^3 | Chart/grafik (stats page) |

### Pola Arsitektur
- **App Router (Next.js 13+)**: Tiap halaman adalah Server Component yang bisa langsung fetch data.
- **RSC + Client Component hybrid**: Server Component fetch data dari DB, lalu props diteruskan ke Client Component.
- **API Routes**: Endpoint REST `GET/POST/PUT/DELETE` di `/api/*` untuk komunikasi frontend-backend.
- **File-based routing**: Struktur folder = URL halaman.

---

## 2. Folder Structure Analysis

```
src/
├── app/                     # App Router (Pages + API)
│   ├── layout.tsx           # ← ROOT LAYOUT (shell seluruh app)
│   ├── globals.css          # Global CSS + Tailwind
│   ├── icon.png             # Favicon
│   ├── page.tsx             # → Dashboard ( / )
│   ├── employees/           # → /employees
│   ├── orders/              # → /orders (Order Produksi)
│   ├── bahan-baku/          # → /bahan-baku
│   ├── barang-jadi/         # → /barang-jadi
│   ├── sales/               # → /sales (Laporan Penjualan)
│   ├── hpp-kalkulasi/       # → /hpp-kalkulasi
│   ├── records/             # → /records (Catat Kesalahan)
│   ├── stats/               # → /stats (Grafik Statistik)
│   └── api/                 # REST API layer
│       ├── infractions/     # CRUD kesalahan karyawan
│       ├── orders/          # Baca data orders dari DB
│       ├── scrape-orders/   # Scraping dari Digit
│       ├── scrape-bahan-baku/
│       ├── scrape-barang-jadi/
│       ├── scrape-sales/
│       ├── employees/       # CRUD karyawan
│       ├── hpp-kalkulasi/   # Read HPP dari DB
│       ├── items/           # Fetch bahan/barang untuk form
│       ├── sales/           # Read laporan penjualan
│       ├── bahan-baku/      # Read bahan baku dari DB
│       ├── barang-jadi/     # Read barang jadi dari DB
│       └── activity-log/    # Write log aktivitas
│
├── components/              # Reusable UI Components
│   ├── Sidebar.tsx          # ← Navigasi kiri (collapsible)
│   ├── MainContentWrapper.tsx # ← Shell layout (Sidebar + Main)
│   ├── RecordsForm.tsx      # ← Form utama catat kesalahan (BESAR, ~1160 baris)
│   ├── InfractionsTable.tsx # ← Tabel daftar kesalahan
│   ├── RecordsTabs.tsx      # ← Tab wrapper (Form | Daftar)
│   ├── ActivityTable.tsx    # ← Log aktivitas di Dashboard
│   ├── ManualModal.tsx      # ← Panduan per menu
│   ├── ConfirmDialog.tsx    # ← Dialog konfirmasi/alert
│   ├── DatePicker.tsx       # ← Komponen kalender custom
│   ├── EmployeeTable.tsx    # ← Tabel data karyawan
│   ├── ExcelUpload.tsx      # ← Upload file Excel (HPP)
│   ├── HelpButton.tsx       # ← Tombol "?" buka manual
│   └── Portal.tsx           # ← React Portal (mount di luar DOM)
│
└── lib/                     # Core utilities & data layer
    ├── db.ts                # ← DATABASE UTAMA (schema + migrasi)
    ├── actions.ts           # ← Server Actions (query DB langsung)
    ├── session-cache.ts     # ← Cache session login ke Digit
    └── date-utils.ts        # ← Helper split date range per bulan
```

---

## 3. Application Flow

### Pertama Kali Buka App
```
1. Browser akses localhost:3000
2. Next.js jalankan app/layout.tsx
3. layout.tsx render:
   - <MainContentWrapper>  ← wraps semua halaman
     ├── <Sidebar />        ← navigasi sidebar
     └── {children}         ← konten halaman aktif
   - <ManualModal />        ← modal panduan (global, tersembunyi)
4. Default route "/" → app/page.tsx dirender
5. page.tsx adalah Server Component:
   - fetch stats dari DB via getStats()
   - fetch activity logs via getActivityLogs()
6. Data diteruskan sebagai props ke <ActivityTable />
7. UI dirender → halaman Dashboard tampil
```

### Ketika User Klik Menu (misal: Order Produksi)
```
1. User klik "Order Produksi" di Sidebar
2. Next.js navigasi ke /orders
3. app/orders/page.tsx dirender (Server Component, tapi ringan)
4. Render <OrderProduksiClient /> (Client Component)
5. useEffect di client component:
   fetch('/api/orders?page=1&limit=50')
6. /api/orders/route.ts:
   db.prepare('SELECT ...').all() → kembalikan JSON
7. Client component update state → tabel data muncul
```

### Ketika User Menekan "Tarik Data"
```
1. User klik tombol "Tarik Data" di menu scraping (Orders, Bahan Baku, dll)
2. Date range dipecah per bulan (splitDateRangeIntoMonths)
3. Untuk tiap bulan, fetch ke /api/scrape-orders?start=...&end=...
4. API route:
   a. getSession() → cek cache → login ke Digit jika perlu
   b. Fetch data dari Digit API (date-by-date)
   c. UPSERT tiap record ke SQLite (tidak hapus data lama!)
   d. Return { total, newly_inserted, lastUpdated }
5. Setelah semua chunk selesai, refresh tabel
```

---

## 4. Component Architecture

### Komponen Utama

| Komponen | Tipe | Fungsi |
|----------|------|--------|
| `MainContentWrapper` | Client | Shell layout: sidebar + main area |
| `Sidebar` | Client | Navigasi. State: collapsed/expanded di localStorage |
| `RecordsForm` | Client | Form utama catat kesalahan (~1160 baris) |
| `InfractionsTable` | Client | Tabel riwayat kesalahan, filter, PDF |
| `RecordsTabs` | Client | Wrapper tab Form / Daftar di /records |

### Komponen Reusable

| Komponen | Digunakan di | Fungsi |
|----------|-------------|--------|
| `ConfirmDialog` | RecordsForm, halaman scraping | Dialog konfirmasi/error/sukses |
| `DatePicker` | RecordsForm, halaman scraping | Kalender kustom |
| `ManualModal` | Semua halaman (via HelpButton) | Panduan penggunaan per menu |
| `HelpButton` | Setiap page.tsx | Tombol "?" buka ManualModal |
| `Portal` | ManualModal, ConfirmDialog | Render ke luar DOM tree utama |
| `ActivityTable` | Dashboard | Tabel log aktivitas sistem |

### Hubungan Antar Komponen

```
layout.tsx
├── MainContentWrapper          ← wrapper global
│   ├── Sidebar                 ← navigasi
│   └── {page content}
│       ├── RecordsTabs         ← di /records
│       │   ├── RecordsForm     ← form tambah/edit
│       │   └── InfractionsTable ← daftar kesalahan
│       └── HelpButton ──opens──▶ ManualModal (global)
└── ManualModal                 ← global, selalu render
```

### Komunikasi Antar Komponen
- **Props**: Data dari Server Component → Client Component.
- **Custom Events**: Sidebar ↔ MainContentWrapper via `window.dispatchEvent('sidebar-toggle')`.
- **localStorage**: State sidebar (collapsed/expanded) dan draft form.
- **Callback Props**: `onRefreshInfractions`, `onEdit`, `onCancelEdit` dari RecordsTabs → RecordsForm/InfractionsTable.

---

## 5. Data Flow

### API → Frontend (Baca Data)
```
Server Component (page.tsx)
  │ import { getInfractions } from '@/lib/actions'
  │ Server Actions langsung query DB (tanpa HTTP)
  ▼
Data diteruskan sebagai props ke Client Component

Client Component (misal: OrderProduksiClient)
  │ useEffect → fetch('/api/orders?...')
  ▼
API Route → query DB → JSON → setData(json.data) → render tabel
```

### Form → Backend (Tulis Data)
```
User isi RecordsForm → submit
  │
  ▼
handleSubmit() → validasi → showDialog konfirmasi
  │ user klik "Ya, Simpan"
  ▼
executeSubmit() → fetch POST /api/infractions
  │
  ▼
/api/infractions/route.ts
  │ db.prepare(INSERT...).run(...)
  ▼
DB tersimpan → return { id, faktur } → sukses dialog
  │
  ▼
onRefreshInfractions() → fetch ulang daftar → tabel diperbarui
```

### State Management
- **React useState**: State lokal per komponen (data tabel, loading, dialog).
- **localStorage**: Persistensi sidebar state, *draft form* catat kesalahan.
- **Custom Events**: Komunikasi antar komponen yang tidak punya parent-child langsung.
- **TIDAK ADA** state management global (Redux/Zustand). State di setiap komponen itu mandiri.

---

## 6. Key Files

| File | Peran | Kenapa Penting |
|------|-------|----------------|
| [layout.tsx](file:///d:/repo%20github/sistem_pencatatan_kesalahan_karyawan/src/app/layout.tsx) | Root Layout | Titik masuk seluruh aplikasi |
| [lib/db.ts](file:///d:/repo%20github/sistem_pencatatan_kesalahan_karyawan/src/lib/db.ts) | Database | Skema, migrasi, koneksi SQLite |
| [lib/actions.ts](file:///d:/repo%20github/sistem_pencatatan_kesalahan_karyawan/src/lib/actions.ts) | Server Actions | Query DB dari Server Component |
| [lib/session-cache.ts](file:///d:/repo%20github/sistem_pencatatan_kesalahan_karyawan/src/lib/session-cache.ts) | Session Cache | Cegah login ulang ke Digit terus-menerus |
| [lib/date-utils.ts](file:///d:/repo%20github/sistem_pencatatan_kesalahan_karyawan/src/lib/date-utils.ts) | Date Utility | Split date range per bulan |
| [components/RecordsForm.tsx](file:///d:/repo%20github/sistem_pencatatan_kesalahan_karyawan/src/components/RecordsForm.tsx) | Form Utama | Logika kompleks untuk catat kesalahan |
| [components/Sidebar.tsx](file:///d:/repo%20github/sistem_pencatatan_kesalahan_karyawan/src/components/Sidebar.tsx) | Navigasi | Daftar menu dan active state |
| [api/scrape-orders/route.ts](file:///d:/repo%20github/sistem_pencatatan_kesalahan_karyawan/src/app/api/scrape-orders/route.ts) | Scraper | Contoh pola scraping dari Digit |
| [api/infractions/route.ts](file:///d:/repo%20github/sistem_pencatatan_kesalahan_karyawan/src/app/api/infractions/route.ts) | CRUD API | Pola standar API route |

---

## 7. Debugging Guide

### Flowchart Debug Berdasarkan Gejala

```
Bug: Data tidak muncul di tabel
  ├─ Buka Network tab di browser DevTools
  ├─ Cek apakah fetch() ke /api/... berhasil (status 200)?
  │   ├─ Tidak (4xx/5xx) → Cek API route file yang bersangkutan
  │   │   → Cek query SQL di route.ts
  │   │   → Cek apakah kolom DB ada (lihat db.ts migration)
  │   └─ Ya (200) → Cek response JSON
  │       ├─ Data kosong → Cek filter/WHERE clause di SQL
  │       └─ Data ada tapi tidak muncul → Cek komponen UI

Bug: Form submit gagal
  ├─ Cek validasi di handleSubmit() di RecordsForm.tsx
  ├─ Cek Network tab: payload yang dikirim benar?
  └─ Cek /api/infractions/route.ts: error apa yang dikembalikan?

Bug: Scraping gagal
  ├─ Cek session-cache.ts → login ke Digit berhasil?
  ├─ Cek .env.development → SCRAPER_EMAIL & SCRAPER_PASSWORD benar?
  └─ Cek respons dari Digit API (log console di server)
```

### Files yang Dicek Pertama per Fitur

| Fitur Bermasalah | File Pertama yang Dicek |
|-----------------|------------------------|
| Data tidak tampil | `src/app/api/[fitur]/route.ts` |
| Form tidak submit | `src/components/RecordsForm.tsx` → `handleSubmit()` |
| Scraping gagal | `src/app/api/scrape-[fitur]/route.ts` → `getSession()` |
| Harga tidak auto-fill | `RecordsForm.tsx` → `calculateAutoHarga()` |
| Layout berantakan | `MainContentWrapper.tsx`, `Sidebar.tsx`, `globals.css` |
| Database error | `src/lib/db.ts` → cek migration |
| Dropdown urutan salah | `src/lib/actions.ts` → `fetchProductionOrders()` |

---

## 8. Refactor Opportunities

### Yang Bisa Diperbaiki

| Area | Masalah | Solusi |
|------|---------|--------|
| `RecordsForm.tsx` (~1160 baris) | Terlalu besar, sulit di-maintain | Pecah jadi sub-komponen: `FormHeader`, `OrderSection`, `ItemSection`, `HargaSection` |
| State Management | State tersebar, saling bergantung | Pertimbangkan `useReducer` atau context untuk form state |
| API Routes | Logika query langsung di route, tidak ada service layer | Buat `src/lib/repositories/` untuk isolasi query DB |
| Error Handling | Respons error tidak konsisten antar API | Buat helper `apiResponse(data, error)` yang konsisten |
| `db.ts` | Migrasi inline tidak terstruktur | Gunakan file migrasi terpisah per versi |
| Magic Strings | Nilai jenis barang ("Bahan Baku", "Barang Jadi", dll.) tersebar | Buat constants/enum di satu file terpusat |

### Pola Lebih Baik di Production

```
src/
├── app/           # Hanya untuk routing & thin pages
├── components/    # UI saja, tidak ada business logic
├── lib/
│   ├── db.ts      # Koneksi database saja
│   ├── repositories/  # Query DB (1 file per domain)
│   │   ├── infractions.repo.ts
│   │   └── orders.repo.ts
│   ├── services/      # Business logic
│   │   └── faktur.service.ts
│   └── utils/         # Pure utility functions
└── types/             # TypeScript types terpusat
    └── index.ts
```

---

## 9. Rebuild Roadmap (Dari Nol)

Ini adalah urutan yang dipikirkan developer berpengalaman saat membangun sistem seperti ini:

### Tahap 1: Rancang Arsitektur (1-2 hari)
- Tentukan: teknologi apa? (Next.js + SQLite? atau Next.js + PostgreSQL?)
- Buat ERD (Entity Relationship Diagram): tabel apa saja? relasinya bagaimana?
- Tentukan halaman apa saja yang dibutuhkan
- Identifikasi data yang perlu diambil dari sistem eksternal

### Tahap 2: Setup Project (1 hari)
```bash
npx create-next-app@latest . --typescript --tailwind --app
npm install better-sqlite3 lucide-react jspdf
```
- Buat `src/lib/db.ts` dengan skema tabel dasar
- Setup `.env.development` dan `.env.production`

### Tahap 3: Buat Layout Shell (1 hari)
- Buat `Sidebar.tsx` dengan menu yang direncanakan
- Buat `MainContentWrapper.tsx` yang wrap sidebar + konten
- Update `layout.tsx` untuk menggunakan shell

### Tahap 4: Buat Routing & Halaman Kosong (1 hari)
- Buat folder & `page.tsx` untuk setiap menu
- Pastikan navigasi berfungsi dulu

### Tahap 5: Buat API Routes (2-3 hari)
- Buat `/api/[resource]/route.ts` untuk setiap entitas (CRUD)
- Test menggunakan browser/Postman sebelum ke UI

### Tahap 6: Buat Komponen Reusable (1-2 hari)
- `ConfirmDialog.tsx` (alert, confirm, success, error)
- `DatePicker.tsx` (kalender kustom)
- `SearchableSelect.tsx` (dropdown dengan search)

### Tahap 7: Bangun Fitur Utama (3-5 hari)
- Halaman scraping: DatePicker + tombol + progress + tabel
- Form catat kesalahan: field yang saling terhubung
- Tabel daftar dengan filter, search, dan ekspor PDF

### Tahap 8: Integrasi dengan Sistem Eksternal (2-3 hari)
- Buat `session-cache.ts` untuk efisiensi login
- Buat API scraping yang UPSERT ke database
- Test dengan data nyata

### Tahap 9: Polish & Testing (1-2 hari)
- Tambahkan panduan manual (`ManualModal`)
- Cek responsive layout
- Test semua flow dari awal sampai akhir

### Mental Model Developer Berpengalaman

> **"Database-first thinking"**: Desain struktur tabel dulu, baru bangun UI.
> 
> **"Thin components, fat services"**: Komponen hanya urusan tampilan, logic bisnis di tempat lain.
>
> **"API contract first"**: Tentukan dulu JSON payload yang dikirim/diterima, baru implement.
>
> **"Fail fast, fail loudly"**: Error harus jelas di development, tapi aman di production.
>
> **"Don't repeat yourself"**: Kalau kode sama muncul 2x, buat fungsi/komponen. 3x, refactor segera.

---

*Dokumen ini dibuat berdasarkan analisis seluruh source code project SIKKA.*
