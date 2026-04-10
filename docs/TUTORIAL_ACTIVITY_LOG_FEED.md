# Tutorial: Activity Log Feed di Dashboard

**Tanggal Dibuat**: 10 April 2026  
**Relevan untuk**: Developer

---

## Gambaran Umum

Halaman `/logs` dihapus dan digabung sepenuhnya ke Dashboard. Kini `ActivityTable.tsx` menjadi **satu-satunya** tempat menampilkan log aktivitas di seluruh aplikasi SINTAK.

---

## Fitur-Fitur ActivityTable

### 1. Header & Search Bar
- Judul **"Aktivitas Terkini"** dengan ikon hijau
- Badge `X HASIL` muncul otomatis saat ada filter aktif
- Search bar gaya lama (putih, border tipis, ikon berubah hijau saat fokus)
- Loader kecil muncul saat router sedang refresh

### 2. Infinite Scroll Otomatis
- Initial load: **50 item**
- Saat scroll ke bawah mendekati akhir list → otomatis load 50 item berikutnya
- Menggunakan `IntersectionObserver` (tanpa klik tombol "Muat Lebih Banyak")
- Spinner kecil muncul di bawah list saat sedang memuat

### 3. Search Multi-Field
Search bar mencari di:
- `action_type` (INSERT, UPDATE, DELETE, LOGIN, dll.)
- `table_name` (nama tabel DB)
- `message` (deskripsi aksi)
- `recorded_by` (username pelaku)
- **`raw_data`** (isi JSON Snapshot Data!)

### 4. Chip Snapshot Match
Ketika search menemukan kecocokan di `raw_data` (bukan di field biasa), kartu akan menampilkan chip ungu:
```
Snapshot: kd_barang : SP23-Buku Manasik Haji…
```
- Maksimal 3 chip per kartu
- Hanya muncul jika match berasal dari `raw_data`, bukan dari message/tabel/user

### 5. Footer
```
Menampilkan 50 dari 500 total aktivitas    ⚡ 0.05s
```
- Kiri: jumlah yang ditampilkan vs total hasil filter
- Kanan: badge load time (hijau < 300ms, amber < 1s, merah ≥ 1s)

### 6. Modal Detail (Mesin Waktu)
Klik baris mana pun → buka modal yang menampilkan:
- **Snapshot** (data saat kejadian, dari `raw_data` di DB)
- **Live Record** (data saat ini di DB, fresh dari server)
- Bisa dibandingkan langsung untuk melihat perubahan

---

## Struktur Kode

```
src/components/ActivityTable.tsx
├── State: search, visibleCount, loadTime, sentinelRef
├── useMemo: filteredLogs (wajib SEBELUM useEffect yang pakai filteredLogs!)
├── displayedLogs = filteredLogs.slice(0, visibleCount)
├── useEffect: load time measurement
├── useEffect: IntersectionObserver (infinite scroll)
├── useEffect: storage event listener (auto-refresh saat sync)
├── useEffect: getLiveRecord (saat modal dibuka)
├── getActionColor() → warna badge per action_type
└── getSnapshotMatches() → cari field cocok di raw_data JSON
```

---

## Aturan Urutan Hook — PENTING!

JavaScript `const` tidak bisa di-hoist. Artinya, variabel yang dideklarasikan dengan `const` atau `useMemo` harus ditulis **sebelum** digunakan di `useEffect` dependency array.

**❌ Salah** (menyebabkan error "Cannot access before initialization"):
```typescript
useEffect(() => { ... }, [filteredLogs]); // error! filteredLogs belum ada

const filteredLogs = useMemo(() => { ... });
```

**✅ Benar**:
```typescript
const filteredLogs = useMemo(() => { ... }); // deklarasi dulu

useEffect(() => { ... }, [filteredLogs]); // baru pakai
```

---

## Cara Menambah Field Baru ke Search

Buka `src/components/ActivityTable.tsx`, temukan fungsi `filteredLogs`:

```typescript
const filteredLogs = useMemo(() => {
  const term = search.toLowerCase();
  if (!term) return initialLogs;
  return initialLogs.filter(log => (
    (log.action_type || '').toLowerCase().includes(term) ||
    (log.table_name || '').toLowerCase().includes(term) ||
    (log.message || '').toLowerCase().includes(term) ||
    (log.recorded_by || '').toLowerCase().includes(term) ||
    (log.raw_data || '').toLowerCase().includes(term)
    // Tambahkan field baru di sini:
    // || (log.field_baru || '').toLowerCase().includes(term)
  ));
}, [initialLogs, search]);
```

---

## Cara Mengubah Jumlah Item per Load

Cari baris ini di `ActivityTable.tsx`:
```typescript
const [visibleCount, setVisibleCount] = useState(50); // initial
```
Dan di sentinel:
```typescript
const loadMore = useCallback(() => {
  setVisibleCount(v => v + 50); // tambahan per scroll
}, []);
```

---

## Cara Menambah Warna Badge Aksi Baru

Cari fungsi `getActionColor`:
```typescript
const getActionColor = (action: string) => {
  switch (action) {
    case 'INSERT': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-200';
    // Tambahkan action baru:
    case 'EXPORT': return 'bg-orange-50 text-orange-700 border-orange-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};
```

---

## Dependensi Penting

Fitur modal Detail bergantung pada:
1. **`raw_data`** tersedia di setiap baris log (jangan hapus di query `getActivityLogs`)
2. **`getLiveRecord`** di `src/lib/actions.ts` — fetch data live dari DB saat modal dibuka
