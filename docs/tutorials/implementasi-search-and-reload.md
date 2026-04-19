# Tutorial: Implementasi Komponen SearchAndReload

Tutorial ini menjelaskan cara menggunakan komponen `SearchAndReload` untuk menstandarisasi fitur pencarian dan refresh data di seluruh aplikasi SINTAK.

## Deskripsi Komponen
Komponen `SearchAndReload` menggabungkan input pencarian dengan tombol refresh (reload) dalam satu baris yang seragam. Komponen ini dirancang untuk mengurangi duplikasi kode dan memberikan pengalaman pengguna yang konsisten.

## Cara Menggunakan

### 1. Import Komponen
Tambahkan import di bagian atas file client component Anda:
```tsx
import SearchAndReload from '@/components/SearchAndReload';
```

### 2. Persiapkan State
Pastikan Anda memiliki state untuk query pencarian dan fungsi untuk me-refresh data (biasanya menggunakan `setRefreshKey` atau memanggil ulang fungsi fetch):
```tsx
const [searchQuery, setSearchQuery] = useState('');
const [loading, setLoading] = useState(false);

const handleReload = () => {
  setRefreshKey(prev => prev + 1);
};
```

### 3. Implementasi di JSX
Ganti blok input pencarian lama dengan komponen `SearchAndReload`:

```tsx
<SearchAndReload 
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery} // Bisa juga (v) => { setSearchQuery(v); setPage(1); }
  onReload={handleReload}
  loading={loading}
  placeholder="Cari berdasarkan..." // Opsional
/>
```

## Properti (Props)
| Prop | Tipe | Deskripsi |
|------|------|-----------|
| `searchQuery` | `string` | Nilai string dari input pencarian. |
| `setSearchQuery` | `(val: string) => void` | Fungsi untuk memperbarui state query. |
| `onReload` | `() => void` | Fungsi yang dijalankan saat tombol refresh diklik. |
| `loading` | `boolean` | Status loading untuk menganimasikan ikon refresh. |
| `placeholder` | `string` | (Opsional) Teks placeholder pada input. |

## Keuntungan
- **UI Konsisten**: Semua halaman memiliki ukuran, warna, dan posisi tombol yang sama.
- **Responsif**: Desain otomatis menyesuaikan lebar kontainer.
- **Animasi**: Tombol refresh otomatis berputar saat status `loading` bernilai true.
