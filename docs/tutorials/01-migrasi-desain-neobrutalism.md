# 🎨 Tutorial 01: Migrasi Desain Neobrutalism SINTAK ERP

Tutorial ini menjelaskan langkah-langkah dan standar yang digunakan dalam migrasi desain visual SINTAK ERP dari gaya modern minimalis ke gaya **Neobrutalism** (Boxy, Kaku, Kontras Tinggi).

## 🎯 Konsep Utama
Neobrutalism dalam SINTAK ERP ditandai dengan:
- **Zero Radius**: Seluruh elemen menggunakan `rounded-none`.
- **Bold Borders**: Border hitam solid minimal `3px` untuk kontainer utama.
- **Solid Shadows**: Shadow kaku tanpa blur (hard offset) menggunakan warna hitam.
- **High Contrast**: Kombinasi warna cerah (Mechanical Yellow `#fde047`) dengan teks hitam pekat.
- **Typography**: Penggunaan `uppercase` dan `font-black` untuk label dan tombol aksi.

## 🛠️ Langkah-Langkah Migrasi

### 1. Standarisasi Komponen Global
Pastikan komponen dasar sudah mengikuti gaya Neobrutalist:
- `PageHeader`: Judul uppercase dengan font black.
- `DataTable`: Loading overlay berwarna kuning kotak tajam.
- `Badge`: Badge status menggunakan border hitam dan warna solid.

### 2. Migrasi Halaman Login
- Hapus semua `rounded-lg` atau `rounded-full`.
- Tambahkan `border-[3px] border-black` pada card login.
- Gunakan `shadow-[8px_8px_0_0_#000]` untuk efek melayang kaku.

### 3. Migrasi Modul Manajemen (User, Role, Profil)
- **Tabel**: Standarisasi header tabel dan sel dengan border tajam.
- **Modal/Dialog**: Ganti animasi lembut dengan transisi cepat dan border tebal.
- **Input**: Seluruh input menggunakan `rounded-none` dan shadow saat fokus.

### 4. Implementasi Switch & Toggle (Khusus Role)
- Jangan gunakan toggle bergaya iOS yang melengkung.
- Gunakan switch kotak dengan border hitam dan indikator warna Mechanical Yellow saat aktif.

## 🎨 Palet Warna Standar
- **Primary**: `#fde047` (Mechanical Yellow)
- **Secondary**: `#000000` (Black)
- **Background**: `#ffffff` (White)
- **Danger**: `#ff5e5e` (Red Neo)

## ⚠️ Catatan Teknis (Turbopack)
Saat melakukan migrasi pada file TSX yang kompleks (seperti `ProfilePage.tsx`), pastikan:
1. Setiap pembukaan tag `div` tertutup dengan benar sebelum penutupan ekspresi JSX `)}`.
2. Hati-hati dengan template literal pada `className`. Pastikan backtick tertutup: `` className={`... ${cond ? 'a' : 'b'}`} ``.
3. Gunakan indentasi yang rapi untuk memudahkan pelacakan tag penutup yang tidak seimbang.
