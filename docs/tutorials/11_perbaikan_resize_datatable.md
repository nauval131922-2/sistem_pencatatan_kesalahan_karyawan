# Perbaikan Bug: Resize Kolom DataTable Saling Tarik-Menarik

Dokumen ini menjelaskan *root cause* (penyebab) dan solusi mengapa sebelumnya saat kita melebarkan satu kolom (misal "No"), kolom lain (misal "Nama") malah ikut menyusut, sehingga terlihat seperti saling tarik-menarik.

## Penyebab Masalah

Secara default, jika sebuah `<table />` HTML diberikan style `min-width: 100%` (atau class `min-w-full` / `w-full`) tetapi gabungan ukuran *piksel asli* dari seluruh kolomnya ternyata **lebih kecil** dari lebar layar, browser akan dipaksa untuk merekahkan tabel tersebut hingga memenuhi 100% layar.

Karena dipaksa merekah (distribusi ruang ekstra):
- Browser akan membagikan "sisa ruang kosong" ke setiap kolom berdasarkan rasio ukuran pikselnya.
- **Kasus**: Jika kita melebarkan Kolom A dari 50px ke 200px, porsi/rasio kolom A menjadi lebih besar ketimbang kolom B. 
- Karena porsi kolom B terlihat lebih kecil secara matematis, browser memotong jatah tambahan lebar untuk kolom B.
- Secara visual, hasil jadinya adalah Kolom A melebar, sedangkan Kolom B justru terlihat otomatis menyusut (*pulling effect*).

## Solusi

Untuk menggunakan *strict fixed standard column widths* pada `tanstack-table` sehingga kolom sepenuhnya independen:
1. Kita **TIDAK BOLEH** memaksa tabel untuk merentang 100% lebar parent jika total kolom tidak cukup panjang.
2. Kita harus menghapus `min-width: 100%` pada pembungkus tabel (wrapper).
3. Kita memastikan menggunakan nilai *state pixel absolut* dari Tanstack Table.

### Perubahan yang Dilakukan di `src/components/ui/DataTable.tsx`

**Sebelum:**
```tsx
<div style={{ width: totalWidth, minWidth: '100%' }}>
  <table 
    className="text-left relative border-separate border-spacing-0 min-w-full"
    style={{ tableLayout: 'fixed', width: totalWidth }}
  >
```

**Sesudah:**
```tsx
<div style={{ width: totalWidth }}>
  <table 
    className="text-left relative border-separate border-spacing-0"
    style={{ tableLayout: 'fixed', width: totalWidth }}
  >
```

### Hasil
- Proses *resizing* menggunakan properti `columnResizeMode: 'onChange'`.
- Ketika *header col-resizer* digeser, ia hanya update statenya sendiri (besaran `totalWidth` tabel akan memanjang/menciut).
- Tabel akan menampilkan **horizontal-scrollbar** utuh jika total lebarnya melebihi lebar kontainer/layar, menjaga rigiditas bentuk dan tulisan di dalamnya agar tidak rusak atau "penyet".
