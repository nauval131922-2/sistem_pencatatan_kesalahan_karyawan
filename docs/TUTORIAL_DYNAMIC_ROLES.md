# Panduan Pembuatan & Sinkronisasi Hak Akses (Role-Based Access Control) Dinamis di SINTAK

Dokumen ini berisi rangkuman teknis tentang bagaimana transisi dari Role Hardcoded ke **Dynamic Database Roles** dilakukan di SINTAK, sekaligus merombak Sinkronisasi Data dan Tata Letak Sidebar.

## 1. Migrasi ke Role Database (Dinamis)
Sebelumnya aplikasi mencari role `['Super Admin', 'Admin', 'HRD', 'Kalkulasi']` secara *hardcoded* baik dalam komponen UI maupun validasi Middleware. 
Hal ini diubah secara permanen menjadi sistem cek silang (Cross-Check) langsung ke *Turso/SQLite* database.

**Langkah Implementasi:**
1. **Schema Tabel:** Dibuat tabel `app_roles` (untuk nama *Role* & *Deskripsi*) dan `role_permissions` (untuk pengaturan I/O modul berupa Boolean `can_access`).
2. **Global Auth Lookup:** Fungsi `auth.ts` sekarang menggunakan query `SELECT role_name FROM app_roles` untuk mevalidasi sesi *Cookie*. Jika role dihapus, pengguna tidak bisa *login* alias ter-*block*.
3. **Seed Perlindungan Utama:** Role `'Super Admin'` tidak dimasukkan ke dalam `app_roles` melainkan menjadi _bypass_ statis nomor satu di sistem agar tidak bisa secara tak sengaja dihapus atau di-*lockout*.
4. **Keamanan Penghapusan:** Pengaturan `block-on-delete` otomatis diaplikasikan untuk *user*. Apabila suatu *Role Config* dihapus dari Hak Akses, semua _User_ yang pernah memakai *Role* tersebut tidak akan bisa _login_ sampai *Super Admin* mengganti role mereka ke role lainnya yang *valid*.

## 2. Perbaikan Z-Index pada Dropdown Modal dan Tabel
Pada Form "Tambah Karyawan" / "Manajemen User", kita beralih menggunakan komponen Dropdown yang interaktif & bisa di-_search_ untuk role. Namun, list dropdown terpotong. 

**Solusinya:**
1. Hilangkan _class_ `overflow-hidden` pada kanvas pembungkus `Modal`. Komponen modal tidak boleh memiliki penutup `overflow` jika ingin elemen di dalamnya menjuntai tumpah secara _absolute_.
2. Tambahkan class `rounded-t-[8px]` pada elemen Header Modal itu sendiri (agar visual melengkungnya tetap dipertahankan meski `overflow` sudah dibuka).
3. Berikan `z-index` yang ekstrim seperti `z-[100]` pada pembungkus Modal _Dropdown_ itu agar mengudara murni di atas tabel data (yang memiliki filter _loading_ CSS sendiri).

## 3. Dinamisasi Dasboard Sinkronisasi All Data
Panel Sinkronisasi `SyncClient.tsx` secara bawaan menampilkan semua fitur yang tersedia dalam sistem _Scraper_. 
Untuk fitur keamanan & kenyamanan mata pengguna non-*Super Admin*, kita buat ia *Context-Aware* (paham konteks).

**Cara kerja:**
1. Menarik permission `userPermissions` milik si pengguna menggunakan metode asinkron `getRolePermissions(session.role)`.
2. Array konstanta *Sync Modules* (seperti `sync_pr`, `sync_bom`) dipetakan (_mapped_) ke konstanta kunci modul utamanya di `permissions-constants.ts` (misal `pembelian_pr`, `produksi_bom`).
3. Menjelang proses _Rendering UI_, kode menyaring (mem-*filter*) semua modul sinkronisasi: `if (!userPermissions[mappedKey]) return null`.
4. Jika salah satu kelompok besar ("Data Produksi") isi elemennya 0 (karena ditolak sistem _Role_), maka blok kontainer *Header* "Produksi" itu juga dihilangkan.

## 4. Pengorganisasian Sidebar Sesuai Struktur Bisnis
Seringkali Menu Sidebar membutuhkan penataan yang relevan dan terkumpul rapi untuk alur kerja divisi. Sesuai pesanan *User*: Karyawan, HPP Kalkulasi, Catatan, dan Statistik diubah tempatnya menjadi kelompok mandiri.

**Langkah:**
1. Cari berkas `src/components/Sidebar.tsx`.
2. Buat grup Menu (`SectionLabel`) baru bernama `Kesalahan Karyawan`.
3. Pindahkan Link `Catat Kesalahan` dan `Statistik Performa` ke grup bawah ini.
4. Buat komponen sisipan _FlyoutMenu_ (Dropdown lipat _Side-menu_) berlabel **"Data"**.
5. Masukkan rute asli dari `Karyawan` dan `HPP Kalkulasi` ke *array items* pada menu _Dropdown_ Data tadi dan non-aktifkan dari *render* tunggalnya di area atas. 

Sistem akan otomatis menjaga konsistensi state UI saat melakukan _routing_, sekaligus memastikan fungsi keamanan `canAccess(...)` bekerja berlapis-lapis menyesuaikan visibilitas masing-masing anak layarnya.
