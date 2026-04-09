# Tutorial Mandiri: Fitur & Perbaikan Sesi Ini

> Dibuat: 2026-04-09 | Berlaku untuk proyek SINTAK (sintak_pt_buya_barokah)

---

## Tutorial 1: Rename Nama Modul ERP (7 Titik Wajib)

### Kapan digunakan?
Setiap kali ada instruksi seperti _"Ganti nama modul X menjadi Y"_ di sidebar atau seluruh sistem.

### Langkah-langkah

#### Langkah 1 — Sidebar Navigation
**File:** `src/components/Sidebar.tsx`

Cari label lama menggunakan `Ctrl+F` (atau grep), lalu ganti dengan nama baru:
```tsx
// Sebelum
{ label: 'Nama Lama', href: '/path', icon: <Icon size={14} /> }

// Sesudah
{ label: 'Nama Baru', href: '/path', icon: <Icon size={14} /> }
```
> ⚠️ Jangan ubah `href` — URL path tetap sama, hanya label yang berubah.

---

#### Langkah 2 — Metadata & PageHeader
**File:** `src/app/[nama-modul]/page.tsx`

Ubah 2 tempat: `title` di metadata dan `title` di `<PageHeader>`:
```tsx
// Metadata
export const metadata: Metadata = {
  title: 'SINTAK | Nama Baru',  // ← ubah ini
};

// PageHeader
<PageHeader title="Nama Baru" ... />  // ← ubah ini
```

---

#### Langkah 3 — Client Component (Notifikasi & Footer)
**File:** `src/app/[nama-modul]/[NamaModul]Client.tsx`

Cari dengan `Ctrl+F` "Nama Lama" dan ganti di:
- Pesan sukses dialog: `` `Berhasil menarik ${n} data Nama Lama.` ``
- Pesan activity log: `` `Tarik Nama Lama (${start} s/d ${end})` ``
- Footer tabel: `` `Menampilkan ${n} dari ${total} Nama Lama` ``

---

#### Langkah 4 — SyncClient (Daftar Modul Sync)
**File:** `src/app/sync/SyncClient.tsx`

Temukan objek modul di `MODULE_GROUPS`, ubah field `name`:
```tsx
{ id: 'id-modul', name: 'Nama Baru', endpoint: '...', description: '...' }
```

---

#### Langkah 5 — ManualModal (Panduan Pengguna)
**File:** `src/components/ManualModal.tsx`

Cari key path (misal `'/nama-modul'`) dan ubah:
```tsx
'/nama-modul': {
  title: 'Nama Baru',         // ← ubah
  description: '... Nama Baru ...',  // ← ubah jika ada
  steps: [...]
}
```

---

#### Langkah 6 — TrackingClient (Header Kolom Tracking)
**File:** `src/app/tracking-manufaktur/TrackingClient.tsx`

Cari kolom dengan `id` yang sesuai, ubah `header` dan `label` di dalam `cell`:
```tsx
{
  id: 'id_kolom', header: 'Nama Baru', ...
  cell: ({ row }) => <RenderColumnContent label="Nama Baru" extraLabel="(via ... = Nama Baru.field)" ... />
}
```

---

#### Langkah 7 — Backend API & Actions (jika ada kondisi string)
**Files:** `src/lib/actions.ts`, `src/app/api/items/route.ts`, `src/app/api/infractions/route.ts`

Cari kondisi SQL yang menggunakan nama lama, ganti dengan nama baru:
```ts
// Sebelum
WHERE jenis_barang = 'Nama Lama'
// atau
LEFT JOIN ... ON jenis_barang = 'Nama Lama'

// Sesudah
WHERE jenis_barang = 'Nama Baru'
```

> ⚠️ **Integritas Data**: Nama tabel database **JANGAN** diubah. Hanya nilai string kondisi yang diubah.

---

#### Verifikasi Akhir
```bash
npm run build
```
Pastikan `Exit code: 0` dan tidak ada TypeScript error.

---

---

## Tutorial 2: Mengelompokkan Kartu di Halaman Sinkronisasi All Data

### Kapan digunakan?
Ketika ada modul baru ditambahkan atau modul perlu dipindahkan ke kelompok yang berbeda di halaman `/sync`.

### Struktur Data
**File:** `src/app/sync/SyncClient.tsx`

Kartu dikelompokkan menggunakan `MODULE_GROUPS`:

```tsx
const MODULE_GROUPS = [
  {
    group: 'Produksi',      // nama label grup
    color: 'green',         // warna: 'green' | 'blue' | 'purple'
    modules: [
      { id: 'bom', name: 'Bill of Material Produksi', endpoint: '/api/scrape-bom', description: 'Data formula produksi' },
      // tambah modul lain di sini...
    ]
  },
  {
    group: 'Pembelian',
    color: 'blue',
    modules: [
      { id: 'pr', name: 'Purchase Request (PR)', endpoint: '/api/scrape-pr', description: '...' },
      // ...
    ]
  },
  {
    group: 'Penjualan',
    color: 'purple',
    modules: [
      // ...
    ]
  },
];

// Baris ini WAJIB ada agar batch sync tetap berjalan:
const MODULES = MODULE_GROUPS.flatMap(g => g.modules);
```

### Menambah Modul Baru ke Grup
1. Buka `SyncClient.tsx`
2. Temukan grup yang tepat (Produksi/Pembelian/Penjualan)
3. Tambahkan objek modul ke array `modules`:
```tsx
{ id: 'id-baru', name: 'Nama Modul', endpoint: '/api/scrape-id-baru', description: 'Keterangan singkat' }
```
4. Pastikan `id` sesuai dengan key di `PERSISTENCE_KEYS` (jika modul menggunakan localStorage period)

### Menambah Grup Baru
1. Tambah objek baru di `MODULE_GROUPS`
2. Pilih `color` dari: `'green'`, `'blue'`, `'purple'`
3. Jika butuh warna baru, tambahkan entry di `groupColorMap` di dalam render:
```tsx
const groupColorMap = {
  // ...
  orange: {
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    header: 'border-orange-500',
    dot: 'bg-orange-500',
  },
};
```

---

## Tutorial 3: Menambah Menu Baru di Sidebar (3 Level)

### Kapan digunakan?
Saat ada modul baru yang perlu muncul di navigasi sidebar.

**File:** `src/components/Sidebar.tsx`

### Struktur Menu (maksimal 3 level)

```
Level 1: FlyoutMenu        → Pembelian / Produksi / Penjualan
Level 2: FlyoutItem        → Penawaran / Sales Order (SO) / dll
Level 3: Link akhir        → Halaman tujuan (href)
```

### Contoh — Menambah submenu di Penjualan > Sales Order (SO)
```tsx
{
  label: 'Sales Order (SO)',
  icon: <FileCheck size={16} />,
  items: [
    {
      label: 'Laporan',
      icon: <BarChart3 size={14} />,
      items: [
        { label: 'Sales Order Barang', href: '/sales-orders', icon: <FileCheck size={12} /> },
        { label: 'Modul Baru', href: '/modul-baru', icon: <FileText size={12} /> },  // ← tambah di sini
      ]
    }
  ]
}
```

### Aturan Ikon
- Level 2 (submenu grup): `size={16}`
- Level 3 (link akhir): `size={14}`
- Level 4 (jika ada): `size={12}`

---

## Checklist Sebelum Push

```
[ ] npm run build → Exit code: 0
[ ] git status --short → pastikan hanya file yang diinginkan ter-staging
[ ] Tidak ada file .sqlite, .env, atau node_modules yang ikut
[ ] Commit dikelompokkan per fitur (bukan satu commit besar)
[ ] docs/AI_SESSION_SUMMARY.md diperbarui
```
