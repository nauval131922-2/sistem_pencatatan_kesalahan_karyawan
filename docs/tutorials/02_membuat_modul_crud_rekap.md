# Tutorial: Membuat Modul Data Tabel dengan Filter Dinamis (Rekap Sales Order)

**Tujuan:**  
Membuat halaman yang menarik *(aesthetic)*, berforma tinggi (memiliki server-side pagination), dilengkapi filter harga, dan menggunakan antarmuka konsisten layaknya fitur utama SINTAK lainnya.

---

### Langkah 1: Registrasi Izin Baru (Permissions)
Pertama, kita harus mendaftarkan "Kunci" fiturnya agar bisa diatur dari panel Admin.
Buka `src/lib/permissions-constants.ts` dan tambahkan:
```typescript
{ key: 'kalkulasi_rekap_so', label: 'Rekap Sales Order Barang', group: 'Kalkulasi' }
```
Jangan lupa petakan label tersebut ke rutenya di `src/lib/permissions.ts`.

### Langkah 2: Memunculkan di Sidebar (`src/components/Sidebar.tsx`)
Gunakan fungsi `canAccess('kalkulasi_rekap_so')` untuk mengecek apakah user boleh melihat menu baru ini. 

```tsx
{/* KALKULASI SECTION */}
{canAccess('kalkulasi_rekap_so') && (
  <>
    <SectionLabel label="Kalkulasi" />
    <div className="space-y-1">
      <Link href="/rekap-sales-order" className={navItemClasses('/rekap-sales-order')}>
        <Calculator size={18} />
        {isExpanded && <span className="truncate">Rekap Sales Order Barang</span>}
      </Link>
    </div>
  </>
)}
```

### Langkah 3: Membuat Server/Route Handler Module Baru
Buat folder `src/app/rekap-sales-order`. Karena ini adalah Next.js (App Router), kita akan membutuhkan dua file: `page.tsx` (Server Component) dan `RekapSalesOrderClient.tsx` (Client Component).

**`page.tsx`:** Hanya berfungsi untuk pengecekan akses aman dan memberikan metadata.
```tsx
export default async function RekapSalesOrderPage() {
  await requirePermission("kalkulasi_rekap_so");
  return (
    <div className="...">
       <PageHeader title="Rekap Sales Order" />
       <RekapSalesOrderClient />
    </div>
  );
}
```

### Langkah 4: Membuat Filter & Pemanggilan API (`RekapSalesOrderClient.tsx`)
Bungkus bagian atas aplikasi menggunakan struktur kontainer filter SINTAK.

1. **State:** Buat state React untuk pencarian, tanggal, kolom (untuk penyesuaian lebar DataTable), dan Filter Harga.
2. **Outside Click Filter Harga:** Untuk mencegah tutupnya antarmuka harga akibat salah klik, siapkan `useRef` di sekitar DOM dropdown harga, lalu integrasikan dengan efek event `mousedown`.

```tsx
const hargaFilterRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (hargaFilterRef.current && !hargaFilterRef.current.contains(event.target as Node)) {
      setShowHargaFilter(false); // Tutup pelan-pelan tanpa mereset isinya
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showHargaFilter]);
```

3. **Data Fetching Backend**: Tulis `useEffect` yang membaca state `page`, `searchQuery`, dan nilai khusus `appliedMin` & `appliedMax` lalu memanggil API baru kita `/api/rekap-sales-order`.

### Langkah 5: Membuat Endpoint API (`src/app/api/rekap-sales-order/route.ts`)
Pemfilteran harus terjadi di Server (SQLite), BUKAN di Client, agar tidak membuat lemot browser saat data mencapai puluhan ribu basis data.

```typescript
// Ambil query HTTP
const searchParams = req.nextUrl.searchParams;
const fromDate = searchParams.get('from');
let minHarga = searchParams.get('minHarga');

// Tulis query SQL bersyarat
let sqlQuery = `SELECT * FROM sales_orders WHERE ...`;
if (minHarga) {
    sqlQuery += ` AND CAST(harga AS REAL) >= CAST(? AS REAL)`;
    params.push(minHarga);
}
```
Kunci utamanya adalah memberikan klausa `LIMIT` dan `OFFSET` untuk Pagination Numeric yang lebih baik.

### Langkah 6: Gunakan `DataTable` Component!
Jangan bikin tabel HTML manual! Gunakan `DataTable` buatan SINTAK yang super mutakhir untuk me-render data ke browser.
```tsx
<DataTable
  columns={columns} // Definisi field database => Judul Header
  data={data}
  isLoading={loading}
/>
```

Dengan langkah di atas, terciptalah modul antarmuka premium di SINTAK. 🚀
