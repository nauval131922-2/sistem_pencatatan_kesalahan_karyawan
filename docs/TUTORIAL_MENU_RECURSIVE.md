# Tutorial Manajemen Menu Rekursif (ERP Style)

Sistem navigasi SINTAK sekarang menggunakan struktur rekursif yang memungkinkan menu di dalam menu (flyout). Berikut cara mengelolanya.

## 1. Menambah Menu Baru
Menu didefinisikan dalam array objek `items` di dalam `Sidebar.tsx`. 

### Struktur Objek Menu:
```tsx
interface MenuItem {
  label: string;      // Nama yang muncul di menu
  href?: string;      // Link tujuan (jika ini adalah klik akhir)
  icon: React.ReactNode; // Ikon Lucide (size 16 untuk level 2, 14 untuk level 3)
  items?: MenuItem[]; // Anak menu (jika ini adalah grup yang bisa dibuka lagi)
}
```

## 2. Contoh Implementasi 3 Level
Jika Anda ingin menambahkan grup "Laporan" di dalam "Produksi":

```tsx
{ 
  label: 'Laporan', 
  icon: <BarChart3 size={16} />,
  items: [
    { label: 'Bahan Baku', href: '/bahan-baku', icon: <Box size={14} /> },
    { label: 'Barang Jadi', href: '/barang-jadi', icon: <Package size={14} /> },
  ]
}
```

## 3. Logika Interaksi (Klik vs Hover)
Sistem sekarang menggunakan **Klik** untuk membuka menu.
- **Level 1:** Klik pada sidebar (Pembelian, Produksi, Penjualan).
- **Level 2 & 3:** Klik pada item yang memiliki ikon panah kanan (`ChevronRight`).
- **Penutup:** Klik di luar menu atau klik pada link akhir (`href`) akan menutup semua panel otomatis.

## 4. Penanganan Posisi (Debugging)
Jika menu melayang muncul di posisi yang salah:
- Sistem menggunakan `getBoundingClientRect()` saat klik dilakukan.
- Pastikan elemen `FlyoutItem` memiliki `ref={itemRef}` dan posisi dihitung berdasarkan `itemRef.current`.
- Jangan menggunakan ID statis karena nama menu bisa sama (misal: ada dua menu bernama "Laporan").

## 5. Tips Estetika
- Gunakan ikon yang berbeda untuk setiap level agar user memiliki panduan visual.
- Pastikan `label` tidak terlalu panjang agar tidak terpotong (truncate) di panel melayang yang lebarnya terbatas (default ~200px).
