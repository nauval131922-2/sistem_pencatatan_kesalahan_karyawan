# Tutorial: Pengaturan Interaksi Sidebar (Click-Outside)

Tutorial ini menjelaskan logika di balik fitur "Tutup Flyout Saat Klik Area Kosong" di Sidebar dan cara menambah elemen baru tanpa merusak fitur ini.

## Konsep Dasar
Sidebar SINTAK menggunakan portal untuk menampilkan menu berlevel (flyout). Masalah umum adalah menu tetap terbuka meskipun pengguna mengklik area kosong di sidebar. Kita ingin menu tertutup kecuali jika pengguna mengklik tombol menu itu sendiri.

## Mekanisme Kerja

### 1. Listener Global
Di dalam `Sidebar.tsx`, terdapat listener `mousedown` pada level `document`:
```tsx
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  // Jangan tutup jika klik terjadi di dalam Flyout itu sendiri
  if (target.closest('[data-sidebar-flyout]')) return;

  setActivePath([]); // Menutup semua menu terbuka
};
```

### 2. Menghentikan Propagasi (Stop Propagation)
Agar menu TIDAK tertutup saat kita mengklik tombol yang seharusnya membuka menu, kita harus menggunakan `e.stopPropagation()`. Tanpa ini, klik pada tombol akan "bocor" ke document dan memicu penutupan menu seketika.

## Cara Menambah Menu/Link Baru

Jika Anda menambah tombol atau link (`<Link>`) baru di Sidebar, pastikan untuk menambahkan properti `onMouseDown`:

```tsx
<button
  onClick={handleFungsiAnda}
  onMouseDown={(e) => e.stopPropagation()} // PENTING!
>
  ...
</button>
```

Atau pada komponen Link:

```tsx
<Link 
  href="/halaman-baru"
  onMouseDown={(e) => e.stopPropagation()} // PENTING!
>
  ...
</Link>
```

## Kenapa Menggunakan `onMouseDown`?
Kita menggunakan `onMouseDown` karena listener penutup di `document` juga menggunakan `mousedown`. Urutan kejadiannya adalah:
1. `mousedown` pada tombol (ditangkap oleh `e.stopPropagation()`).
2. Event tidak sampai ke `document`.
3. Menu tetap terbuka atau menjalankan fungsi togglenya.

Jika kita hanya menggunakan `onClick`, maka `mousedown` akan tetap bocor ke `document` sebelum `click` sempat dieksekusi, sehingga menu akan tertutup secara prematur.
