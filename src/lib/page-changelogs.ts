import type { PermissionMap } from '@/lib/permissions-constants';

export type PageChangelog = {
  pageKey: string;
  version: string;
  title: string;
  items: string[];
  /** Tampilan: "25 Jul 2026" */
  date?: string;
  /** Sort: "2026-07-25" — terbaru di atas di /log-perubahan */
  sortDate: string;
  /** User lihat entry ini jika canAccess salah satu key (OR) */
  permissionKeys: string[];
  /** Label versi (opsional): "v1", "v2" — untuk multi-rilis di hari sama */
  versionLabel?: string;
};

/** Satu gelombang catch-up: 78 commit lokal + perubahan belum commit (25 Jul 2026). */
const CATCHUP_VERSION = '2026-07-25-catchup-1';
const CATCHUP_DATE = '25 Jul 2026';
const CATCHUP_SORT = '2026-07-25';

/** Hanya Super Admin (tidak ada di role_permissions biasa). */
const SUPER_ADMIN_ONLY = ['_super_admin_only'] as const;

const UI_POLISH = [
  'Tampilan diseragamkan dengan desain SINTAK terbaru (kartu, label, empty state)',
  'Teks dan label lebih mudah dibaca',
] as const;

function entry(
  partial: Omit<PageChangelog, 'sortDate' | 'date' | 'version'> & {
    version?: string;
    date?: string;
    sortDate?: string;
  }
): PageChangelog {
  const version = partial.version || (partial.sortDate ? `${partial.pageKey}-${partial.sortDate}` : CATCHUP_VERSION);
  return {
    version,
    date: CATCHUP_DATE,
    sortDate: CATCHUP_SORT,
    ...partial,
  };
}

export const PAGE_CHANGELOGS: Record<string, PageChangelog> = {
  // ─── Tracking Manufaktur ───
  'tracking-manufaktur-2026-08-28': entry({
    pageKey: 'tracking_manufaktur',
    title: 'Tracking Manufaktur',
    permissionKeys: ['tracking_manufaktur'],
    sortDate: '2026-08-28',
    date: '28 Agu 2026',
    version: '2026-08-28-1',
    items: [
      'Migrasi seluruh selector manual (Pilih BOM, Supplier, Nomor PO, dan Faktur PB/Barang) ke komponen standar SearchableDropdown',
      'Pembaruan SearchableDropdown dengan auto-width menyesuaikan panjang teks item tanpa terpotong batas layar (smart auto-align)',
      'Penyelarasan visual label Rentang Tanggal agar seragam dengan SearchableDropdown',
      'Pembersihan header redundant Visualisasi Alur Manufaktur untuk tampilan yang lebih ringkas dan fokus',
    ],
  }),

  // ─── Sync All Data ───
  'sync-2026-08-28': entry({
    pageKey: 'sync',
    title: 'Sinkronisasi All Data',
    permissionKeys: ['sync'],
    sortDate: '2026-08-28',
    date: '28 Agu 2026',
    version: '2026-08-28-1',
    items: [
      'Penyelarasan z-index control bar (relative z-30) agar popup DatePicker tidak tertutup oleh card modul di bawahnya',
    ],
  }),

  // ─── Kelola User ───
  'users-2026-08-28': entry({
    pageKey: 'users',
    title: 'Kelola User',
    permissionKeys: [...SUPER_ADMIN_ONLY],
    sortDate: '2026-08-28',
    date: '28 Agu 2026',
    version: '2026-08-28-1',
    items: [
      'Penyatuan bar filter dan pencarian menjadi satu bar terpadu mengikuti standar antarmuka Laporan Pekerjaan',
      'Penggantian komponen filter role dan status menggunakan SquareDropdown yang lebih ringkas dan konsisten',
      'Penambahan tombol reset filter cepat saat pencarian atau filter sedang aktif',
      'Pembaruan modal tambah/edit akun: dukungan unselect role tunggal dan tombol hapus langsung pada badge peran akses',
    ],
  }),

  // ─── Pricelist Multi-Produk ───
  'pricelist-2026-09-06': entry({
    pageKey: 'pricelist',
    title: 'Pricelist & Navigasi Hak Akses Sistem',
    permissionKeys: ['pricelist_kalkulasi'],
    sortDate: '2026-09-06',
    date: '06 Sep 2026',
    version: '2026-09-06-1',
    items: [
      'Perbaikan Visibilitas Menu Sidebar: Memperbaiki kondisi guard parent section SISTEM pada Sidebar agar pengguna dengan izin tunggal "Pricelist" (pricelist_kalkulasi) dapat langsung melihat dan mengakses menu Kalkulasi > Pricelist tanpa harus memiliki izin HPP Kalkulasi',
      'Refaktorisasi Guard Navigasi Dinamis: Mengganti evaluasi hardcoded izin manual di Sidebar.tsx dengan deteksi dinamis berbasis grup MODULE_REGISTRY (grup Sistem dan Data Digit) guna mencegah tersembunyinya modul baru di masa mendatang',
    ],
  }),
  'pricelist-2026-09-03': entry({
    pageKey: 'pricelist',
    title: 'Pricelist & Simulator Multi-Produk (Integrasi Real-Time Rekap Pembelian Barang & Modal Lookup Cerdas)',
    permissionKeys: ['pricelist_kalkulasi'],
    sortDate: '2026-09-03',
    date: '03 Sep 2026',
    version: '2026-09-03-1',
    items: [
      'Integrasi Tarif Master Parameter Global dengan Rekap Pembelian Barang: Menambahkan tombol aksi "🛒 Rekap" pada setiap field tarif Master Parameter Global untuk mengambil data harga beli riil dari transaksi pembelian',
      'Modal Lookup Cerdas Rekap Pembelian (RekapLookupModal): Menyediakan pencarian cepat riwayat transaksi faktur, filter kata kunci responsif dengan debouncing 200ms, serta pembatalan request usang (AbortController)',
      'Smart Auto-Converter Satuan Kertas ke /Kg: Sistem otomatis mendeteksi dimensi plano dan gramatur kertas lembaran/rim (contoh: LEMBAR - HVS 70-65 Rp 705) lalu mengonversikannya menjadi tarif per Kg master (Rp 15.500/kg)',
      'Optimasi Antarmuka Modal: Header tabel riwayat pembelian dibuat sticky permanen (sticky top-0 z-30), penataan vertikal baris dan tombol "Pilih" simetris, tombol pintasan ke halaman /rekap-pembelian-barang di tab baru, serta navigasi pagination muat bertahap (+50)',
      'Pembaruan Tampilan Halaman Error Sistem (error.tsx): Desain kartu error modern, log debug terstruktur pada mode dev, pembersihan istilah teknis yang tidak relevan, serta penampilan nama menu aktif secara dinamis',
    ],
  }),
  'pricelist-2026-09-01': entry({
    pageKey: 'pricelist',
    title: 'Pricelist & Simulator Multi-Produk (Ekspansi 30 Produk, Sync DB Multi-Device & Mode Edit)',
    permissionKeys: ['pricelist_kalkulasi'],
    sortDate: '2026-09-01',
    date: '01 Sep 2026',
    version: '2026-09-01-1',
    items: [
      'Ekspansi 30 Modul Produk Percetakan: Penambahan lengkap modul baru meliputi Buku Soft Cover (A4/B5 & 10,5×14,8 & 14,5×20,25), Buku Hard Cover (10,5×14,8 & 14,5×20,25 & 21×29,7), Poster, Majalah 14,5×20,25, Stiker, Kalender Kop, Packaging, dan Paperbag dengan formula HPP terverifikasi, Master Parameter, Simulator, dan Matriks harga',
      'Sinkronisasi Database Server Multi-Device: Riwayat kalkulasi kini otomatis tersimpan di SQLite server (pricelist_saved_calculations) sehingga dapat diakses, diperbarui, dan disalin lintas perangkat dan staff secara instan',
      'Snapshot Master Parameter Historis & Modal Detail: Setiap kalkulasi yang disimpan merekam snapshot parameter aktif saat itu dan dapat diinspeksi melalui modal popup "Detail HPP & Parameter Historis" di tab Daftar Kalkulasi',
      'Fitur Mode Edit Lengkap (Simpan Baru & Update Perubahan): Seluruh 30 simulator kini mendukung pembaruan kalkulasi lama (Update Perubahan) atau penyimpanan sebagai riwayat terpisah (Simpan Baru) tanpa menimpa data asli',
      'Indikator Aksen Oranye & Proteksi Parameter: Pill tab Master Parameter dan Simulator otomatis menampilkan aksen oranye dan badge "Edit" saat kalkulasi dimuat; Master Parameter aktif di-backup dan otomatis dipulihkan saat keluar mode edit, ganti produk, atau berpindah tab',
      'Pencatatan Audit Log Otomatis: Setiap aksi simpan kalkulasi baru, perbarui data, atau hapus kalkulasi otomatis tercatat ke log aktivitas sistem (activity_logs)',
      'Stabilisasi Layout Matriks Murni CSS: Migrasi seluruh modul matriks dari hook resize observer ke Responsive CSS Grid murni (grid-cols-1 md:grid-cols-2 xl:grid-cols-3) mencegah layout kolaps 1 kolom saat bolak-balik mode Matriks dan Tabel',
      'Standardisasi Grid 2 Kolom Master Parameter: Restrukturisasi kartu parameter pada seluruh modul produk menjadi layout grid 2 kolom seimbang (2x2 grid) yang rapi di layar desktop maupun laptop',
      'Master Parameter Global & Modal Panduan: Penambahan mesin cetak Toko/Ryobi, tarif desain standar, margin/nego default ke sinkronisasi global real-time, serta modal panduan pemetaan 30 sumber file master Excel percetakan',
    ],
  }),
  'pricelist-2026-08-31': entry({
    pageKey: 'pricelist',
    title: 'Pricelist & Simulator Multi-Produk (Label KHQ & Brosur Gramatur)',
    permissionKeys: ['pricelist_kalkulasi'],
    sortDate: '2026-08-31',
    date: '31 Agu 2026',
    version: '2026-08-31-1',
    items: [
      'Modul baru Label KHQ: 3 varian botol (220 ml, 330 ml, 600 ml) dengan simulator, matriks per kardus/lembar, Master Parameter terpisah, dan simpan riwayat ke Daftar Kalkulasi',
      'Dukungan multi-gramatur Brosur 2026: pilihan bahan Art Paper 120 gsm & 150 gsm terintegrasi di Simulator, Matriks, Flat Table, dan format penawaran WhatsApp',
      'Navigasi tab diperbarui: daftar tab dapat di-scroll horizontal saat layar sempit dan filter Jenis Produk tetap menempel di kanan dalam satu baris',
      'Perbaikan impor Master Parameter Label KHQ agar halaman Pricelist dapat dimuat tanpa error build',
    ],
  }),
  'pricelist-2026-08-29': entry({
    pageKey: 'pricelist',
    title: 'Pricelist & Simulator Multi-Produk (Master Global & Sinkronisasi)',
    permissionKeys: ['pricelist_kalkulasi'],
    sortDate: '2026-08-29',
    date: '29 Agu 2026',
    version: '2026-08-29-1',
    items: [
      'Fitur Master Parameter Global (Shared Rates): modal pengaturan terpusat untuk tarif mesin offset Oliver, harga kertas dasar per kg, digital print POD A3+, laminasi, dan packing umum lintas seluruh lini produk',
      'Penyederhanaan Master Parameter Produk: pembersihan field bersama menuju Single Source of Truth sehingga tiap master produk hanya mengelola komponen biaya spesifiknya',
      'Restorasi Snapshot & Tombol "Hitung Tarif Master": memuat riwayat kalkulasi dengan parameter asli saat disimpan sekaligus menyediakan opsi hitung ulang dengan tarif Master Global terkini',
      'Sinkronisasi Reaktif Alur Edit: tombol Edit di Daftar Kalkulasi otomatis berpindah ke kategori produk yang sesuai dan langsung mengisi seluruh spesifikasi form input simulator',
      'Penyempurnaan Akurasi Badge "Dimodifikasi": deteksi modifikasi parameter kini hanya mengevaluasi field-field aktif yang ditampilkan pada form produk terkait',
      'Generalisasi Header & Panduan: judul halaman "Pricelist & Simulator" dan panduan pengguna (?) digeneralkan agar siap menampung penambahan jenis produk baru berikutnya',
    ],
  }),
  'pricelist-2026-08-27': entry({
    pageKey: 'pricelist',
    title: 'Pricelist & Simulator Brosur 2026',
    permissionKeys: ['pricelist_kalkulasi'],
    sortDate: '2026-08-27',
    date: '27 Agu 2026',
    version: '2026-08-27-1',
    items: [
      'Penambahan modul Brosur 2026 (📋 Brosur Art Paper 120gsm) — 5 ukuran (10,5×21 s.d 29,7×42), 2 muka (1/2 Muka), 2 mesin (Print Inter & Oliver), tier oplah 100–3000 pcs',
      'Simulator Brosur: form input lengkap (ukuran, muka, mesin, laminasi, sisir, packing), 4 kartu finansial (HPP, Harga Jual, Nego, Total), tabel breakdown komponen HPP, tombol salin penawaran WA',
      'Pricelist Matriks Brosur: grid 5 ukuran × 11 tier oplah dengan 4 sub-baris (Print 1M, Print 2M, Oliver 1M, Oliver 2M) per sel + Flat Table rinci',
      'Master Parameter Brosur: 4 card (kertas Art Paper, cetak Print Inter/Oliver, finishing laminasi/sisir/packing, margin) + modal pemetaan cell Excel referensi',
      'Riwayat simulasi Brosur tersimpan di browser (localStorage sintak_saved_brosur_simulations) + filter "🗞️ Brosur" di tab Daftar Kalkulasi',
    ],
  }),
  'pricelist-2026-08-24': entry({
    pageKey: 'pricelist',
    title: 'Pricelist Kalender & Simulator',
    permissionKeys: ['pricelist_kalkulasi'],
    sortDate: '2026-08-24',
    date: '24 Agu 2026',
    version: '2026-08-24-1',
    items: [
      'Penambahan parameter input PPN / Margin Kertas secara independen per jenis kertas (HVS 70, AP 120, AP 150) pada Master Parameter',
      'Penambahan toggle pensaklaran profil Spiral/Klem secara langsung di header tab Master Parameter',
      'Penyempurnaan kalkulasi HPP bahan kertas pada simulator dan matriks dengan membaca PPN spesifik kertas secara dinamis',
    ],
  }),
  'pricelist-2026-08-23': entry({
    pageKey: 'pricelist',
    title: 'Pricelist Kalender & Simulator',
    permissionKeys: ['pricelist_kalkulasi'],
    sortDate: '2026-08-23',
    date: '23 Agu 2026',
    version: '2026-08-23-1',
    items: [
      'Dukungan penuh finishing jilid Klem Seng (Jepit Kaleng) pada tab Master Parameter, Simulator, dan Pricelist Matriks',
      'Pemisahan profil penyimpanan Master Parameter secara dinamis antara mode Spiral dan Klem (localStorage terpisah agar tidak saling menimpa)',
      'Penambahan parameter tarif jilid Klem Seng per ukuran (32x48, 38x54, 46x64, 48x64) di Master Parameter',
      'Toggle pilihan finishing Spiral vs Klem Seng pada bar filter pricelist dengan rekalkulasi instan 216 kombinasi',
      'Penyelarasan formula finishing Klem Seng dengan 72 file master Excel Klem Agustus (Folder 30 Source/*.xlsm)',
      'Pembaruan dokumentasi dan panduan interaktif manual modal untuk mendukung kalkulasi Spiral & Klem',
    ],
  }),
  'pricelist-2026-08-22': entry({
    pageKey: 'pricelist',
    title: 'Pricelist Kalender & Simulator',
    permissionKeys: ['pricelist_kalkulasi'],
    sortDate: '2026-08-22',
    date: '22 Agu 2026',
    version: '2026-08-22-1',
    items: [
      'Penambahan tab Master Parameter untuk mengelola seluruh acuan tarif kertas, mesin cetak (Oliver & SM), ongkos finishing, ukuran plano, dan konstanta grafika secara dinamis',
      'Penambahan tab Simulator & Kalkulator Kalender Spiral untuk simulasi biaya produksi instan per pesanan dengan rincian 11 komponen HPP, target margin (+%), dan diskon nego (-%)',
      'Sinkronisasi instan reaktif: perubahan di Master Parameter langsung mengalkulasi ulang seluruh 216 kombinasi matriks pricelist dan simulator tanpa reload halaman',
      'Penyelarasan formula 11 komponen biaya dengan 72 file master Excel percetakan (Folder Source/*.xlsm) dengan tingkat akurasi 100%',
      'Penyempurnaan input angka menggunakan ThousandInput dengan dukungan format mata uang Indonesia, persentase (%), dan penanganan angka 0 (nullish coalescing)',
      'Penyimpanan otomatis preferensi tab aktif (activeTab) dan mode tampilan (viewMode) di localStorage saat halaman dimuat ulang',
      'Penambahan modal panduan interaktif lengkap dengan pemetaan 4 kelompok parameter dan rincian formula pembentuk Total HPP (KALENDER!DA7)',
    ],
  }),
  'pricelist-2026-08-16': entry({
    pageKey: 'pricelist',
    title: 'Pricelist Kalender',
    permissionKeys: ['pricelist_kalkulasi'],
    sortDate: '2026-08-16',
    date: '16 Agu 2026',
    version: '2026-08-16-1',
    items: [
      'Penambahan menu baru Pricelist Kalender pada hierarki Sistem > Kalkulasi > Pricelist (/pricelist)',
      'Dukungan upload dan parser otomatis sheet HARGA dari file master Pricelist Kalender 2027 Spiral.xlsx / xlsm',
      'Fitur validasi ketat file Excel (wajib sheet HARGA dan struktur header yang sesuai)',
      'Tampilan matriks perbandingan harga per oplah dan ukuran mirip format Excel asli serta tampilan tabel rinci',
      'Bar filter SquareDropdown untuk Jenis Kalender & Bahan, bar pencarian live, serta toggle mode tampilan',
      'Responsif mobile dengan accordion card upload otomatis tersimpan di localStorage',
    ],
  }),

  // ─── Login ───
  'login-2026-08-14': entry({
    pageKey: 'login',
    title: 'Halaman Login',
    permissionKeys: [],
    sortDate: '2026-08-14',
    date: '14 Agu 2026',
    version: '2026-08-14-1',
    items: [
      'Penyempurnaan alur redirect pasca-login: pengguna yang masa sesinya habis saat mengakses halaman terproteksi kini otomatis diarahkan kembali ke halaman awal yang sedang dibuka',
    ],
  }),
  'login-2026-08-02': entry({
    pageKey: 'login',
    title: 'Halaman Login',
    permissionKeys: [],
    sortDate: '2026-08-02',
    date: '02 Agt 2026',
    version: '2026-08-02-1',
    items: [
      'Header brand SINTAK pada tampilan mobile (373px) dipindah ke pojok kiri atas',
      'Penulisan sub-judul "Sistem Informasi Cetak" disesuaikan menjadi title case',
    ],
  }),

  // ─── Dashboard ───
  'dashboard-2026-07-25': entry({
    pageKey: 'dashboard',
    title: 'Dashboard',
    permissionKeys: ['dashboard'],
    items: [
      'Tampilan diseragamkan: kartu lebih rapi, warna hijau, teks lebih mudah dibaca',
      'Latar halaman lebih nyaman di mata (bukan putih menyilau / abu-abu gradasi)',
      'Scroll dan header lebih stabil saat melihat ringkasan',
      'Beberapa ringkasan data dimuat lebih ringan',
    ],
  }),

  // ─── Dashboard Manufaktur ───
  'dashboard-manufaktur-2026-07-25': entry({
    pageKey: 'dashboard-manufaktur',
    title: 'Dashboard Manufaktur',
    permissionKeys: ['produksi_dashboard'],
    items: [
      'Kartu dan grafik diseragamkan dengan desain SINTAK terbaru',
      'Teks label lebih jelas (ukuran minimum diperbaiki)',
      'Scroll halaman lebih nyaman',
      'Data ringkasan produksi dimuat lebih ringan',
    ],
  }),

  // ─── Dashboard Akunting ───
  'dashboard-akunting-2026-07-25': entry({
    pageKey: 'dashboard-akunting',
    title: 'Dashboard Akunting',
    permissionKeys: ['akt_dashboard'],
    items: [
      'Kartu jurnal, tren, dan peringatan barang jadi tampilan lebih rapi',
      'Label dan angka lebih mudah dibaca',
      'Scroll dan layout diseragamkan dengan dashboard lain',
    ],
  }),

  // ─── Dashboard HRD ───
  'dashboard-hrd-2026-07-25': entry({
    pageKey: 'dashboard-hrd',
    title: 'Dashboard HRD',
    permissionKeys: ['hrd_dashboard'],
    items: [
      'Kartu statistik dan tren pelanggaran tampilan lebih rapi',
      'Filter dan tabel catatan lebih ringkas',
      'Teks label lebih jelas di seluruh kartu',
    ],
  }),

  // ─── Jurnal Harian Produksi ───
  'jurnal-harian-produksi-2026-09-07': entry({
    pageKey: 'jurnal-harian-produksi',
    title: 'Jurnal Harian Produksi',
    version: '2026-09-07-1',
    date: '07 Sep 2026',
    sortDate: '2026-09-07',
    permissionKeys: ['produksi_jhp'],
    items: [
      'Perbaikan scroll tabel (DataTable): posisi scroll horizontal dan vertikal kini tetap dipertahankan (tidak reset ke posisi awal) saat melakukan update data in-place pada baris tabel (seperti edit keterangan JHP)',
    ],
  }),
  'jurnal-harian-produksi-2026-08-20': entry({
    pageKey: 'jurnal-harian-produksi',
    title: 'Jurnal Harian Produksi',
    version: '2026-08-20-1',
    date: '20 Agu 2026',
    sortDate: '2026-08-20',
    permissionKeys: ['produksi_jhp'],
    items: [
      'Perbaikan posisi popup kalender di modal Copy Jadwal: sekarang ngitung ruang dari edge modal, bukan window',
      'Popup datepicker tidak lagi memicu scroll horizontal di dalam modal',
    ],
  }),
  'jurnal-harian-produksi-2026-08-11': entry({
    pageKey: 'jurnal-harian-produksi',
    title: 'Jurnal Harian Produksi',
    version: '2026-08-11-1',
    date: '11 Agu 2026',
    sortDate: '2026-08-11',
    permissionKeys: ['produksi_jhp'],
    items: [
      'Perbaikan viewport mobile: tombol Simpan di form input dan pagination di tab daftar sekarang selalu terlihat di real device HP',
      'Layout menggunakan dynamic viewport height (100dvh) agar menyesuaikan dengan address bar dan navigation bar browser HP',
    ],
  }),
  'jurnal-harian-produksi-2026-08-09': entry({
    pageKey: 'jurnal-harian-produksi',
    title: 'Jurnal Harian Produksi',
    version: '2026-08-09-1',
    date: '09 Agu 2026',
    sortDate: '2026-08-09',
    permissionKeys: ['produksi_jhp'],
    items: [
      'Penyelarasan tata letak responsif dan scroll navigation lintas viewport',
    ],
  }),
  'jurnal-harian-produksi-2026-08-03': entry({
    pageKey: 'jurnal-harian-produksi',
    title: 'Jurnal Harian Produksi',
    version: '2026-08-03-1',
    date: '03 Agu 2026',
    sortDate: '2026-08-03',
    permissionKeys: ['produksi_jhp'],
    items: [
      'Optimasi Zoom 80% menyeluruh untuk Tablet & Laptop (768px – 1919px), sementara Monitor PC Desktop (≥1920px) otomatis 100%',
      'Peningkatan Tampilan Mobile (Card View): row info umum truncate (untruncate saat diklik), label Pekerjaan Realisasi terpisah & rapi',
      'Popup portal (DatePicker & Dropdown) terkalibrasi presisi di tablet & laptop',
      'Form Input JHP disempurnakan: Tab Target/Realisasi & tombol Simpan/Batal terkunci diam (fixed header & footer) saat isi form di-scroll',
    ],
  }),
  'jurnal-harian-produksi-2026-08-02': entry({
    pageKey: 'jurnal-harian-produksi',
    title: 'Jurnal Harian Produksi',
    version: '2026-08-02-1',
    date: '02 Agu 2026',
    sortDate: '2026-08-02',
    permissionKeys: ['produksi_jhp'],
    items: [
      'Filter Pekerjaan sekarang mengikuti Order + semua filter aktif (tanggal, bagian, karyawan)',
      'Dropdown Pekerjaan hanya tampilkan pekerjaan yang ada di data sesuai filter',
      'Mencakup pekerjaan dari kolom target dan realisasi',
    ],
  }),
  'jurnal-harian-produksi-2026-07-25': entry({
    pageKey: 'jurnal-harian-produksi',
    title: 'Jurnal Harian Produksi',
    permissionKeys: ['produksi_jhp'],
    items: [
      'Tampilan kartu dan tabel diseragamkan dengan desain SINTAK',
      'Performa pemuatan data ditingkatkan',
    ],
  }),

  // ─── Excel SOPd ───
  'excel-sopd-2026-07-25': entry({
    pageKey: 'excel-sopd',
    title: 'Data Excel SOPd',
    permissionKeys: ['produksi_jhp_sopd'],
    items: [
      'Tampilan tabel dan filter diseragamkan dengan modul JHP lain',
      'Label dan empty state lebih mudah dibaca',
      'Kartu filter tanggal kembali ke pola yang stabil',
    ],
  }),

  // ─── Master Pekerjaan ───
  'master-pekerjaan-2026-07-25': entry({
    pageKey: 'master-pekerjaan',
    title: 'Master Pekerjaan',
    permissionKeys: ['produksi_jhp_master_pekerjaan'],
    items: [
      'Tampilan daftar dan upload diseragamkan dengan desain SINTAK terbaru',
      'Label dan empty state lebih mudah dibaca',
    ],
  }),

  // ─── Master Pekerjaan Jurnal Produksi ───
  'master-pekerjaan-jurnal-produksi-2026-07-26': entry({
    pageKey: 'master-pekerjaan-jurnal-produksi',
    title: 'Master Pekerjaan Jurnal Produksi',
    sortDate: '2026-07-26',
    date: '26 Jul 2026',
    version: '2026-07-26-1',
    permissionKeys: ['produksi_jhp_master_pekerjaan_jurnal_produksi'],
    items: [
      'Input manual: tambah, edit, dan hapus per baris',
      'Bulk hapus: pilih baris (klik / Ctrl / Shift) lalu Hapus N',
      'Upload Excel jadi merge-only — data manual tidak terhapus',
      'Modal form tidak tertutup saat klik di luar; kolom Aksi dengan teks Edit & Hapus',
    ],
  }),
  'master-pekerjaan-jurnal-produksi-2026-07-25': entry({
    pageKey: 'master-pekerjaan-jurnal-produksi',
    title: 'Master Pekerjaan Jurnal Produksi',
    permissionKeys: ['produksi_jhp_master_pekerjaan_jurnal_produksi'],
    items: [
      'Tampilan daftar diseragamkan',
      'Ikon log perubahan ditambahkan di header',
    ],
  }),

  // ─── Target Jurnal Harian Produksi ───
  'jurnal-harian-produksi-target-2026-08-17': entry({
    pageKey: 'jurnal-harian-produksi-target',
    title: 'Target Jurnal Harian Produksi',
    permissionKeys: ['produksi_jhp_target'],
    sortDate: '2026-08-17',
    date: '17 Agu 2026',
    version: '2026-08-17-1',
    items: [
      'Dropdown pilihan bagian/shift/karyawan/order/pekerjaan pada baris draft kini membuka tepat di bawah kolomnya (sebelumnya posisinya meleset di layar laptop/tablet)',
    ],
  }),
  'jurnal-harian-produksi-target-2026-07-25': entry({
    pageKey: 'jurnal-harian-produksi-target',
    title: 'Target Jurnal Harian Produksi',
    permissionKeys: ['produksi_jhp_target'],
    items: [
      'Tampilan dan label diseragamkan dengan modul JHP',
      'Performa halaman ditingkatkan agar lebih ringan dipakai',
    ],
  }),

  // ─── Analisa Jurnal Harian Produksi ───
  'jurnal-harian-produksi-analisa-2026-07-25': entry({
    pageKey: 'jurnal-harian-produksi-analisa',
    title: 'Analisa Jurnal Harian Produksi',
    permissionKeys: ['produksi_jhp_analisa'],
    items: [
      'Tampilan kartu dan panel diseragamkan dengan desain SINTAK terbaru',
      'Label lebih jelas dan mudah dibaca',
    ],
  }),

  // ─── Tracking Manufaktur ───
  'tracking-manufaktur-2026-07-30': entry({
    pageKey: 'tracking-manufaktur',
    title: 'Tracking Manufaktur',
    sortDate: '2026-07-30',
    date: '30 Jul 2026',
    version: '2026-07-30-1',
    permissionKeys: ['tracking_manufaktur'],
    items: [
      'Pemuatan data tracking lebih ringan dan stabil',
      'Dropdown dan filter lebih responsif',
    ],
  }),
  'tracking-manufaktur-2026-07-25': entry({
    pageKey: 'tracking-manufaktur',
    title: 'Tracking Manufaktur',
    permissionKeys: ['tracking_manufaktur'],
    items: [
      'Tampilan tabel dan label diseragamkan',
    ],
  }),

  // ─── Log Aktivitas ───
  'log-aktivitas-2026-09-07-2': entry({
    pageKey: 'log-aktivitas',
    title: 'Log Aktivitas',
    sortDate: '2026-09-07',
    date: '07 Sep 2026',
    version: '2026-09-07-2',
    permissionKeys: ['activity_log_view', 'activity_log'],
    items: [
      'Viewport Clamping & Auto-Shift SearchableDropdown: panel dropdown filter tabel, aksi, dan user kini otomatis menyesuaikan orientasi (auto-shift ke kiri) dan tidak lagi memicu horizontal scrollbar di layar HP',
      'Mobile Responsive Redesign: toolbar filter collapsible ringkas dengan indikator aktif, toggle sembunyikan/tampilkan grafik tren harian, dan tombol dropdown adaptif full-width',
      'Card List View Khusus Mobile: tampilan log di layar sempit beralih otomatis dari tabel menjadi daftar kartu interaktif berurutan lengkap dengan status aksi, user, waktu relatif, dan panel perbandingan field',
      'Desktop Layout Redesign: viewport tinggi tabel dinaikkan hingga 70vh (760px) untuk memuat lebih banyak baris log, baris pencarian terpadu dengan status live-refresh, dan kontainer badge agregasi scrollable',
      'Tab Switcher Detail Log: penambahan tab navigasi pada baris expanded di desktop untuk beralih antara tabel perbandingan kolom (Diff) yang lebar penuh dan tampilan raw JSON (Before / After)',
      'Penyederhanaan Detail Audit: menghapus filter penyembunyian ID dan tanggal sistem sehingga seluruh rekaman audit field perubahan ditampilkan utuh',
    ],
  }),
  'log-aktivitas-2026-09-07': entry({
    pageKey: 'log-aktivitas',
    title: 'Log Aktivitas',
    sortDate: '2026-09-07',
    date: '07 Sep 2026',
    version: '2026-09-07-1',
    permissionKeys: ['activity_log_view', 'activity_log'],
    items: [
      'Tampilan tabel detail expandable: baris riwayat aktivitas kini dapat diperluas untuk melihat rincian perubahan data langsung pada tabel',
      'Daftar pengguna (user badges) interaktif dengan toggle tampilkan lebih banyak/sedikit untuk filter yang lebih ringkas dan rapi',
      'Optimasi endpoint API log aktivitas untuk respons pemuatan riwayat data yang lebih cepat',
    ],
  }),
  'log-aktivitas-2026-07-18': entry({
    pageKey: 'log-aktivitas',
    title: 'Log Aktivitas',
    sortDate: '2026-07-18',
    date: '18 Jul 2026',
    version: '2026-07-18-1',
    permissionKeys: ['activity_log_view', 'activity_log'],
    items: [
      'Fitur Undo cepat untuk membatalkan perubahan',
      'Filter cepat berdasarkan aksi atau tabel',
      'Pencarian berdasarkan ID Log',
      'Visualisasi JSON detail yang lebih rapi',
    ],
  }),
  'log-aktivitas-2026-07-25': entry({
    pageKey: 'log-aktivitas',
    title: 'Log Aktivitas',
    permissionKeys: ['activity_log_view', 'activity_log'],
    items: [
      'Tampilan daftar dan grafik diseragamkan',
      'Label dan empty state lebih mudah dibaca',
      'Query log dimuat lebih ringan',
    ],
  }),
  'log-aktivitas-2026-08-09': entry({
    pageKey: 'log-aktivitas',
    title: 'Log Aktivitas',
    sortDate: '2026-08-09',
    date: '09 Agu 2026',
    version: '2026-08-09-1',
    permissionKeys: ['activity_log_view', 'activity_log'],
    items: [
      'Grafik log aktivitas kini selalu tampil secara permanen tanpa accordion',
      'Container grafik dibuat stabil tanpa shift layout saat dimuat',
    ],
  }),
  'log-aktivitas-2026-08-24': entry({
    pageKey: 'log-aktivitas',
    title: 'Log Aktivitas',
    sortDate: '2026-08-24',
    date: '24 Agu 2026',
    version: '2026-08-24-1',
    permissionKeys: ['activity_log_view', 'activity_log'],
    items: [
      'Penyempurnaan audit trail: pelengkapan pencatatan log otomatis pada modul Pencatatan Kesalahan (Infractions), manajemen Role (Tambah, Ubah, Hapus), dan Master Pekerjaan Jurnal Produksi',
      'Penyertaan metadata aktor (recorded_by) dan payload diff data saat aksi perubahan dieksekusi',
    ],
  }),
  'log-aktivitas-2026-08-10': entry({
    pageKey: 'log-aktivitas',
    title: 'Log Aktivitas',
    sortDate: '2026-08-10',
    date: '10 Agu 2026',
    version: '2026-08-10-1',
    permissionKeys: ['activity_log_view', 'activity_log'],
    items: [
      'Perbaikan posisi tooltip deskripsi header pada layar HP (layar kecil) agar tidak terpotong tepi layar',
    ],
  }),

  // ─── Records ───
  'records-2026-09-06': entry({
    pageKey: 'records',
    title: 'Catatan / Records',
    sortDate: '2026-09-06',
    date: '06 Sep 2026',
    version: '2026-09-06-1',
    permissionKeys: ['catat_kesalahan'],
    items: [
      'Perbaikan stacking context z-index pada form pencatatan kesalahan (tab form) agar card Tingkat Bahaya tidak menutupi popup dropdown pencarian Nama Karyawan saat dibuka ke bawah',
    ],
  }),
  'records-2026-08-24': entry({
    pageKey: 'records',
    title: 'Catatan / Records',
    sortDate: '2026-08-24',
    date: '24 Agu 2026',
    version: '2026-08-24-1',
    permissionKeys: ['catat_kesalahan'],
    items: [
      'Pencatatan audit log otomatis pada seluruh siklus hidup catatan kesalahan (Tambah data baru, Edit data, dan Hapus data)',
      'Penyelarasan nomor sequence faktur dan snapshot data karyawan saat pencatatan kesalahan',
    ],
  }),
  'records-2026-07-26': entry({
    pageKey: 'records',
    title: 'Catatan / Records',
    sortDate: '2026-07-26',
    date: '26 Jul 2026',
    version: '2026-07-26-1',
    permissionKeys: ['catat_kesalahan'],
    items: [
      'Bilah filter lebih ringkas (satu baris, tombol outline)',
      'Integrasi cepat data HPP Digit',
    ],
  }),
  'records-2026-07-25': entry({
    pageKey: 'records',
    title: 'Catatan / Records',
    permissionKeys: ['catat_kesalahan'],
    items: [
      'Kartu dan form diseragamkan dengan desain SINTAK',
      'Teks label lebih jelas di seluruh halaman',
    ],
  }),

  // ─── BOM ───
  'bom-2026-08-17': entry({
    pageKey: 'bom',
    title: 'Bill of Materials (BOM)',
    permissionKeys: ['produksi_bom'],
    sortDate: '2026-08-17',
    date: '17 Agu 2026',
    version: '2026-08-17-1',
    items: [
      'Kolom detail BOM kini tampil sebagai teks bersih — tombol/widget warisan sistem lama yang tidak berfungsi dihilangkan',
    ],
  }),
  'bom-2026-07-25': entry({
    pageKey: 'bom',
    title: 'Bill of Materials (BOM)',
    permissionKeys: ['produksi_bom'],
    items: [
      'Daftar BOM dimuat lebih ringan',
      'Tampilan tabel dan label diseragamkan',
    ],
  }),

  // ─── Hasil Produksi ───
  'hasil-produksi-2026-09-05': entry({
    pageKey: 'hasil-produksi',
    title: 'Hasil Produksi',
    permissionKeys: ['produksi_hasil'],
    sortDate: '2026-09-05',
    date: '05 Sep 2026',
    version: '2026-09-05-1',
    items: [
      'Perbaikan agregasi Level 1 saat pengurutan kolom: seluruh baris dari jenis pekerjaan yang sama diagregasi menjadi tepat satu kartu/baris subtotal utuh tanpa duplikasi',
      'Penyempurnaan subtotal pekerjaan tunggal: pekerjaan yang hanya memiliki 1 baris data kini selalu dibuatkan subtotal sehingga tetap tampil lengkap pada filter Level 1 saat data disortir',
      'Peningkatan akurasi rentang tanggal dan akumulasi kuantiti pada kartu ringkasan pekerjaan saat sorting non-pekerjaan aktif',
    ],
  }),
  'hasil-produksi-2026-09-04': entry({
    pageKey: 'hasil-produksi',
    title: 'Hasil Produksi',
    permissionKeys: ['produksi_hasil'],
    sortDate: '2026-09-04',
    date: '04 Sep 2026',
    version: '2026-09-04-1',
    items: [
      'Redesign tata letak kontrol menjadi 3 baris terstruktur: Baris 1 Parameter SOPd & Tanggal, Baris 2 Toolbar Data & Filter (Style Laporan Pekerjaan), dan Baris 3 Status Produksi, Tren Melar Fleksibel & Kontrol Tampilan',
      'Dukungan pencarian live kata kunci sebagian (partial search) pada nama pekerjaan, karyawan, kendala, dan keterangan',
      'Format lengkap kartu detail Pekerjaan terpilih: Pekerjaan, Realisasi, Hasil Akhir (Realisasi Bersih), dan WIP dengan kalkulasi akurat',
      'Progress bar Tren produksi dibuat melar fleksibel (flex-1) mengisi penuh ruang kosong antar kontrol tanpa celah',
      'Pemindahan selector Level (1 | 2) ke Baris 3 di antara Tren dan Tab Switcher untuk navigasi yang lebih ergonomis',
      'Peningkatan responsif view mobile: Card 2 otomatis mengikuti toggle collapse/expand filter, tombol Reload & Search berdampingan 1 baris, tombol Reset melar penuh, status KPI & Pekerjaan terdistribusi rapi per baris, dan penyesuaian tinggi bar Tren agar tidak gepeng',
      'Penyempurnaan komponen SquareDropdown: panel popup otomatis memanjang (w-max min-w-full) mengikuti teks opsi terpanjang tanpa terpotong',
      'Optimasi query database disjunction pada endpoint /api/hasil-produksi/details dengan multi-index scan (peningkatan kecepatan hingga 220x lipat)',
    ],
  }),
  'hasil-produksi-2026-08-16': entry({
    pageKey: 'hasil-produksi',
    title: 'Hasil Produksi',
    permissionKeys: ['produksi_hasil'],
    sortDate: '2026-08-16',
    date: '16 Agu 2026',
    version: '2026-08-16-1',
    items: [
      'Penyelarasan arsitektur auto alignment (right-0/left-0) & proteksi batas aman sidebar laptop pada SearchableDropdown dan DatePicker',
      'Penyelarasan filter Level 1 di mode Card agar hanya menampilkan kartu subtotal ringkasan',
      'Penambahan metrik Target pada kartu Subtotal (JurnalSubtotalCard) dengan tata letak 2 baris rapi',
      'Penambahan quick sort bar (Tanggal, Realisasi, Target, Pekerjaan, Kode) pada mode Card',
      'Indikator visual warna thead tabel saat ada sortir kolom aktif dan perbaikan akurasi hitungan baris data di footer',
    ],
  }),
  'hasil-produksi-2026-08-11': entry({
    pageKey: 'hasil-produksi',
    title: 'Hasil Produksi',
    permissionKeys: ['produksi_hasil'],
    sortDate: '2026-08-11',
    date: '11 Agu 2026',
    version: '2026-08-11-1',
    items: [
      'Penyesuaian z-index tombol navigasi scroll floating (up/down) agar berada di bawah lapisan sidebar',
    ],
  }),
  'hasil-produksi-2026-08-10': entry({
    pageKey: 'hasil-produksi',
    title: 'Hasil Produksi',
    permissionKeys: ['produksi_hasil'],
    sortDate: '2026-08-10',
    date: '10 Agu 2026',
    version: '2026-08-10-1',
    items: [
      'Refactor panel SearchableDropdown menjadi inline absolute untuk menempel real-time saat sidebar hover/collapse',
      'Penyesuaian z-index stacking agar panel dropdown SOPd tampil paling depan di atas seluruh komponen',
    ],
  }),
  'hasil-produksi-2026-08-09': entry({
    pageKey: 'hasil-produksi',
    title: 'Hasil Produksi',
    permissionKeys: ['produksi_hasil'],
    sortDate: '2026-08-09',
    date: '09 Agu 2026',
    version: '2026-08-09-1',
    items: [
      'Penyelarasan tata letak responsif dan scroll navigation lintas viewport',
    ],
  }),
  'hasil-produksi-2026-08-02': entry({
    pageKey: 'hasil-produksi',
    title: 'Hasil Produksi',
    permissionKeys: ['produksi_hasil'],
    sortDate: '2026-08-02',
    date: '02 Agt 2026',
    version: '2026-08-02-1',
    items: [
      'Layout responsif kartu statistik (Card Order & Pekerjaan 50/50 di SM, Card Tren 100%, Grand Total mendatar di SM+)',
      'Nama pekerjaan otomatis truncate 1 baris dengan floating tooltip presisi saat diklik (hanya jika terpotong)',
      'Standardisasi sudut rounded-xl dan bayangan shadow-sm seragam di seluruh dashboard',
    ],
  }),
  'hasil-produksi-2026-07-28': entry({
    pageKey: 'hasil-produksi',
    title: 'Hasil Produksi',
    sortDate: '2026-07-28',
    date: '28 Jul 2026',
    version: '2026-07-28-1',
    permissionKeys: ['produksi_hasil'],
    items: [
      'Filter Level & SOPd diseragamkan dengan ketinggian h-10',
    ],
  }),
  'hasil-produksi-2026-07-25': entry({
    pageKey: 'hasil-produksi',
    title: 'Hasil Produksi',
    permissionKeys: ['produksi_hasil'],
    items: [
      'Standardisasi nama produksi dan data sumber di dashboard',
      'Tampilan kartu dan grafik diseragamkan',
    ],
  }),

  // ─── Log Perubahan ───
  'log-perubahan-2026-07-26': entry({
    pageKey: 'log-perubahan',
    title: 'Log Perubahan',
    permissionKeys: [],
    sortDate: '2026-07-26',
    date: '26 Jul 2026',
    version: '2026-07-26-1',
    items: [
      'Menu Log Perubahan di profil (sidebar) — arsip update per tanggal dan per menu',
      'Hanya menampilkan log untuk menu yang Anda bisa akses',
      'Accordion per menu; tombol Buka ke halaman terkait',
      'Icon log di header halaman yang punya entry rilis',
    ],
  }),

  // —— Catch-up sisa path vs origin/master (design system massal) ——
  'rek-akuntansi-2026-07-25': entry({
    pageKey: 'rek-akuntansi',
    title: 'Rek Akuntansi',
    permissionKeys: ['akt_mrek'],
    items: [...UI_POLISH],
  }),
  'jurnal-umum-2026-07-25': entry({
    pageKey: 'jurnal-umum',
    title: 'Jurnal Umum',
    permissionKeys: ['akt_jurnal_umum'],
    items: [...UI_POLISH],
  }),
  'bahan-baku-2026-07-25': entry({
    pageKey: 'bahan-baku',
    title: 'BBB Produksi',
    permissionKeys: ['produksi_bahan_baku'],
    items: [...UI_POLISH, 'Daftar dan filter lebih rapi'],
  }),
  'barang-jadi-2026-07-25': entry({
    pageKey: 'barang-jadi',
    title: 'Penerimaan Barang Hasil Produksi',
    permissionKeys: ['produksi_barang_jadi'],
    items: [...UI_POLISH, 'Daftar dan filter lebih rapi'],
  }),
  'barang-jadi-2026-08-10': entry({
    pageKey: 'barang-jadi',
    title: 'Penerimaan Barang Hasil Produksi',
    permissionKeys: ['produksi_barang_jadi'],
    sortDate: '2026-08-10',
    date: '10 Agt 2026',
    version: '2026-08-10-1',
    items: [
      'Kolom "Profit 30%" ditambahkan di sebelah kanan kolom "HP Barang Jadi" — menampilkan harga dengan markup profit 30%',
      'Kolom "HP Rata-rata" sekarang menampilkan 2 angka desimal untuk presisi lebih baik',
    ],
  }),
  'produksi-selesai-2026-07-25': entry({
    pageKey: 'produksi-selesai',
    title: 'Produksi Selesai',
    permissionKeys: ['produksi_selesai'],
    items: [...UI_POLISH],
  }),
  'master-barang-2026-07-25': entry({
    pageKey: 'master-barang',
    title: 'Master Barang',
    permissionKeys: ['stok_master_barang'],
    items: [...UI_POLISH],
  }),
  'hpp-kalkulasi-2026-07-25': entry({
    pageKey: 'hpp-kalkulasi',
    title: 'HPP Kalkulasi',
    permissionKeys: ['hpp_kalkulasi'],
    items: [...UI_POLISH],
  }),
  'orders-2026-08-17': entry({
    pageKey: 'orders',
    title: 'Order Produksi',
    permissionKeys: ['produksi_orders'],
    sortDate: '2026-08-17',
    date: '17 Agu 2026',
    version: '2026-08-17-1',
    items: [
      'Kolom detail order kini tampil sebagai teks bersih — tombol warisan sistem lama yang tidak berfungsi dihilangkan',
    ],
  }),
  'orders-2026-07-25': entry({
    pageKey: 'orders',
    title: 'Order Produksi',
    permissionKeys: ['produksi_orders'],
    items: [...UI_POLISH, 'Daftar order lebih rapi'],
  }),
  'pelunasan-hutang-2026-08-17': entry({
    pageKey: 'pelunasan-hutang',
    title: 'Pelunasan Hutang',
    permissionKeys: ['pembelian_hutang'],
    sortDate: '2026-08-17',
    date: '17 Agu 2026',
    version: '2026-08-17-1',
    items: [
      'Kolom detail pelunasan kini tampil sebagai teks bersih — tombol/widget warisan sistem lama yang tidak berfungsi dihilangkan',
    ],
  }),
  'pelunasan-hutang-2026-07-25': entry({
    pageKey: 'pelunasan-hutang',
    title: 'Pelunasan Hutang',
    permissionKeys: ['pembelian_hutang'],
    items: [...UI_POLISH],
  }),
  'pelunasan-piutang-2026-08-17': entry({
    pageKey: 'pelunasan-piutang',
    title: 'Pelunasan Piutang',
    permissionKeys: ['penjualan_piutang'],
    sortDate: '2026-08-17',
    date: '17 Agu 2026',
    version: '2026-08-17-1',
    items: [
      'Kolom detail pelunasan kini tampil sebagai teks bersih — tombol/widget warisan sistem lama yang tidak berfungsi dihilangkan',
    ],
  }),
  'pelunasan-piutang-2026-07-25': entry({
    pageKey: 'pelunasan-piutang',
    title: 'Pelunasan Piutang',
    permissionKeys: ['penjualan_piutang'],
    items: [...UI_POLISH],
  }),
  'penerimaan-pembelian-2026-07-25': entry({
    pageKey: 'penerimaan-pembelian',
    title: 'Penerimaan Barang Pembelian',
    permissionKeys: ['pembelian_penerimaan'],
    items: [...UI_POLISH],
  }),
  'pengiriman-2026-07-25': entry({
    pageKey: 'pengiriman',
    title: 'Pengiriman',
    permissionKeys: ['penjualan_pengiriman'],
    items: [...UI_POLISH],
  }),
  'pr-2026-07-25': entry({
    pageKey: 'pr',
    title: 'Purchase Request (PR)',
    permissionKeys: ['pembelian_pr'],
    items: [...UI_POLISH],
  }),
  'profile-2026-07-25': entry({
    pageKey: 'profile',
    title: 'Pengaturan Profil',
    permissionKeys: [],
    items: [...UI_POLISH],
  }),
  'purchase-orders-2026-07-25': entry({
    pageKey: 'purchase-orders',
    title: 'Purchase Order (PO)',
    permissionKeys: ['pembelian_po'],
    items: [...UI_POLISH],
  }),
  'rekap-pembelian-barang-2026-09-03': entry({
    pageKey: 'rekap-pembelian-barang',
    title: 'Rekap Pembelian Barang',
    permissionKeys: ['pembelian_rekap'],
    sortDate: '2026-09-03',
    date: '03 Sep 2026',
    version: '2026-09-03-1',
    items: [
      'Fitur Pencarian dengan Keyword Highlighting: Kata kunci pencarian pada kolom Faktur, Supplier, Barang, Keterangan, dan User kini otomatis di-highlight dengan tanda visual kuning yang jelas',
      'Perbaikan Infinite Scroll & Stabilitas Posisi Scroll: Memperbaiki bug scroll melompat/reset ke atas saat memuat data halaman berikutnya (infinite scroll) sehingga posisi baca pengguna tetap dipertahankan',
      'Peningkatan Fleksibilitas Pengaturan Lebar Kolom: Kolom tabel kini memiliki batas garis vertikal yang rapi, garis resizer dapat di-drag langsung secara real-time dengan area sentuh/klik yang lebih luas (20px)',
      'Optimasi Kueri & Indeks Database: Penambahan expression index pada tanggal dan ID (idx_rekap_pembelian_barang_expr_tgl) untuk mempercepat pengurutan data serta penyesuaian debounce pencarian menjadi 350ms yang lebih responsif',
    ],
  }),
  'rekap-pembelian-barang-2026-07-25': entry({
    pageKey: 'rekap-pembelian-barang',
    title: 'Rekap Pembelian Barang',
    permissionKeys: ['pembelian_rekap'],
    items: [...UI_POLISH],
  }),
  'rekap-sales-order-2026-08-17': entry({
    pageKey: 'rekap-sales-order',
    title: 'Rekap Sales Order',
    permissionKeys: ['kalkulasi_rekap_so'],
    sortDate: '2026-08-17',
    date: '17 Agu 2026',
    version: '2026-08-17-1',
    items: [
      'Panel kalender pemilihan tanggal tidak lagi tertutup komponen lain saat dibuka',
      'Kalender tanggal Mulai/Selesai kini tampil di atas kartu filter harga, daftar hasil, dan tabel',
      'Panel Filter Harga kini membuka tepat di bawah tombolnya dan tetap menempel saat halaman di-scroll',
    ],
  }),
  'rekap-sales-order-2026-07-25': entry({
    pageKey: 'rekap-sales-order',
    title: 'Rekap Sales Order',
    permissionKeys: ['kalkulasi_rekap_so'],
    items: [...UI_POLISH],
  }),
  // ─── Hak Akses (Roles) ───
  'roles-2026-09-03': entry({
    pageKey: 'roles',
    title: 'Hak Akses (Roles)',
    permissionKeys: [...SUPER_ADMIN_ONLY],
    sortDate: '2026-09-03',
    date: '03 Sep 2026',
    version: '2026-09-03-1',
    items: [
      'Fitur Pengecualian Dinamis PIC Berbasis Role: Penambahan opsi "Kecuali Role..." pada modal Setting Hak Akses Laporan Pekerjaan (tab PIC) sehingga admin dapat memilih semua PIC sekaligus mengecualikan role tertentu (misal: "Semua (Kecuali Admin/Keuangan)")',
      'Sistem Token Pengecualian Role (@exclude_role:<Role>): Mendukung pemilihan multi-role pengecualian dengan integrasi filter dinamis ke database schema config',
      'Penyempurnaan UI Modal Setting: Pembersihan tombol quick-action redundan dan optimalisasi antarmuka seleksi PIC & Bagian',
    ],
  }),
  'roles-2026-07-25': entry({
    pageKey: 'roles',
    title: 'Hak Akses (Roles)',
    permissionKeys: [...SUPER_ADMIN_ONLY],
    items: [...UI_POLISH],
  }),
  'roles-2026-09-08': entry({
    pageKey: 'roles',
    title: 'Hak Akses (Roles)',
    permissionKeys: [...SUPER_ADMIN_ONLY],
    sortDate: '2026-09-08',
    date: '08 Sep 2026',
    version: '2026-09-08-1',
    items: [
      'Penambahan opsi cakupan izin hapus untuk Laporan Pekerjaan: Tidak bisa hapus, Hanya bisa hapus di table utama, Hanya bisa hapus di card detail, atau Bisa hapus di manapun',
    ],
  }),
  'roles-2026-08-24': entry({
    pageKey: 'roles',
    title: 'Hak Akses (Roles)',
    permissionKeys: [...SUPER_ADMIN_ONLY],
    sortDate: '2026-08-24',
    date: '24 Agu 2026',
    version: '2026-08-24-1',
    items: [
      'Modal konfigurasi khusus Laporan Pekerjaan per Role: pembatasan Bagian, PIC, Hak Aksi, dan Kolom Modal Detail',
      'Mode dinamis kunci PIC ke akun login (@me), filter PIC dinamis berbasis role user (@role:NamaRole), dan opsi tugas "Tanpa PIC" (@unassigned)',
      'Pemisahan hak aksi menjadi 3 settingan mandiri: Tambah Pekerjaan Baru (can_add), Ubah/Edit Pekerjaan (can_edit), dan Hapus Pekerjaan (can_delete)',
      'Pembersihan opsi aksi dari tab kolom modal detail dan penyesuaian otomatis visibilitas kolom aksi',
    ],
  }),
  'roles-2026-08-07': entry({
    pageKey: 'roles',
    title: 'Hak Akses (Roles)',
    permissionKeys: [...SUPER_ADMIN_ONLY],
    sortDate: '2026-08-07',
    date: '07 Agu 2026',
    items: [
      'Penambahan hak akses baru: Laporan Pekerjaan di grup Sistem Produksi',
      'Perbaikan layout 1 layar penuh (100vh) dan penambahan scrollbar internal khusus di Card Role & pohon Hak Akses',
      'Auto-scroll pada form edit role saat tombol edit diklik sehingga tombol Batal & Update tidak terpotong',
    ],
  }),
  'sales-2026-08-15': entry({
    pageKey: 'sales',
    title: 'Laporan Penjualan',
    permissionKeys: ['penjualan_laporan'],
    sortDate: '2026-08-15',
    date: '15 Agu 2026',
    items: [
      'Penambahan kolom Faktur Prd dan Kode Barang (tanpa prefix satuan) pada tabel Laporan Penjualan',
    ],
  }),
  'sales-2026-07-25': entry({
    pageKey: 'sales',
    title: 'Laporan Penjualan',
    permissionKeys: ['penjualan_laporan'],
    items: [...UI_POLISH],
  }),
  'sales-orders-2026-08-20': entry({
    pageKey: 'sales-orders',
    title: 'Sales Order',
    sortDate: '2026-08-20',
    date: '20 Agu 2026',
    version: '2026-08-20-1',
    permissionKeys: ['penjualan_so'],
    items: [
      'Perbaikan UPSERT sync scraper menggunakan recid agar revisi item dari Digit langsung menimpa data lama dan tidak menimbulkan duplikasi',
    ],
  }),
  'sales-orders-2026-07-25': entry({
    pageKey: 'sales-orders',
    title: 'Sales Order',
    permissionKeys: ['penjualan_so'],
    items: [...UI_POLISH],
  }),
  'konversi-hpp-2026-07-25': entry({
    pageKey: 'konversi-hpp',
    title: 'Konversi Data HPP',
    permissionKeys: ['settings_konversi_data_hpp'],
    items: [...UI_POLISH],
  }),
  'telegram-users-2026-08-09': entry({
    pageKey: 'telegram-users',
    title: 'Telegram Users',
    sortDate: '2026-08-09',
    date: '09 Agu 2026',
    version: '2026-08-09-1',
    permissionKeys: ['telegram_users'],
    items: [
      'Perbaikan modal konfirmasi approve/reject agar tidak terpotong skala container & logging integer ID yang sesuai',
    ],
  }),
  'telegram-users-2026-08-03': entry({
    pageKey: 'telegram-users',
    title: 'Telegram Users',
    sortDate: '2026-08-03',
    date: '03 Agu 2026',
    version: '2026-08-03-1',
    permissionKeys: ['telegram_users'],
    items: [
      'Panduan notifikasi push untuk penanganan akses HTTP/IP dan izin diblokir browser',
    ],
  }),
  'telegram-users-2026-07-30': entry({
    pageKey: 'telegram-users',
    title: 'Telegram Users',
    sortDate: '2026-07-30',
    date: '30 Jul 2026',
    version: '2026-07-30-1',
    permissionKeys: ['telegram_users'],
    items: [
      'Kartu statistik lebih ringkas dengan tampilan inline',
    ],
  }),
  'telegram-users-2026-07-25': entry({
    pageKey: 'telegram-users',
    title: 'Telegram Users',
    permissionKeys: ['telegram_users'],
    items: [...UI_POLISH],
  }),
  'sph-in-2026-07-25': entry({
    pageKey: 'sph-in',
    title: 'SPH Masuk',
    permissionKeys: ['pembelian_sph_in'],
    items: [...UI_POLISH],
  }),
  'sph-out-2026-07-25': entry({
    pageKey: 'sph-out',
    title: 'SPH Keluar',
    permissionKeys: ['penjualan_sph_out'],
    items: [...UI_POLISH],
  }),
  'spph-out-2026-07-25': entry({
    pageKey: 'spph-out',
    title: 'SPPH Keluar',
    permissionKeys: ['pembelian_spph'],
    items: [...UI_POLISH],
  }),
  'sync-2026-07-25': entry({
    pageKey: 'sync',
    title: 'Sinkronisasi Data',
    permissionKeys: ['sync'],
    items: [...UI_POLISH],
  }),
  'users-2026-08-24': entry({
    pageKey: 'users',
    title: 'Kelola User',
    permissionKeys: [...SUPER_ADMIN_ONLY],
    sortDate: '2026-08-24',
    date: '24 Agu 2026',
    version: '2026-08-24-1',
    items: [
      'Fitur penautan akun user ke master data karyawan (kolom employee_id) sebagai sumber tunggal nama akun',
      'Penghapusan field manual "Nama Lengkap" pada form user modal; nama dan username otomatis terisi saat karyawan dipilih',
      'Pembaruan SearchableDropdown dengan lebar panel presisi 1:1 dan orientasi auto-flip ke atas saat posisi form mepet ke bawah layar',
      'Auto-migration schema SQLite penambahan kolom employee_id pada tabel users',
    ],
  }),
  'users-2026-08-09': entry({
    pageKey: 'users',
    title: 'Kelola User',
    permissionKeys: [...SUPER_ADMIN_ONLY],
    sortDate: '2026-08-09',
    date: '09 Agu 2026',
    items: [
      'Perbaikan posisi dropdown Peran Akses (Role) di modal Tambah/Edit User agar presisi sesuai koordinat tombol pada skala zoom layar',
    ],
  }),
  'users-2026-07-25': entry({
    pageKey: 'users',
    title: 'Kelola User',
    permissionKeys: [...SUPER_ADMIN_ONLY],
    items: [...UI_POLISH],
  }),
  'laporan-pekerjaan-2026-08-07': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-07',
    date: '07 Agu 2026',
    items: [
      'Modul baru: Laporan Pekerjaan terhubung live dari Google Spreadsheet (DATABASE_REPORT)',
      'Statistik real-time 5 kategori & 4 grafik visualisasi Recharts (PIC, Divisi, Donut Status %, Prioritas Horizontal)',
      'Fitur tabel interaktif: global column sorting, resizable column dengan 60fps smooth dragging, & tooltip sel terpotong',
      'Responsif HP: Card View modern khusus mobile dengan fitur klik untuk untruncate teks',
      'Pemisah ribuan (fmtNumber) & sinkronisasi data 100% konsisten antara card, donut, dan grafik',
      'Optimasi performa tinggi: in-memory TTL cache (< 5ms response) & useDeferredValue search',
    ],
  }),
  'laporan-pekerjaan-2026-08-09': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-09',
    date: '09 Agu 2026',
    items: [
      'Penyesuaian tata letak responsif lintas perangkat: HP (Poco X7 Pro), Tablet (Advan Sketsa 5), Laptop (T470), dan Desktop 24"',
      'Accordion Ringkasan Statistik & Grafik Analisis dengan penyimpanan status otomatis (localStorage)',
      'Filter interaktif via Klik Stat Card (Total, Selesai, In Progress, Pending, Cancel) dengan penanda aktif',
      'Optimasi mode 1 layar (Accordion tertutup) & navigasi scroll melayang (Accordion terbuka) tanpa merusak layout header',
    ],
  }),

  // ─── Laporan Pekerjaan ───
  'laporan-pekerjaan-2026-09-08': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-09-08',
    date: '08 Sep 2026',
    version: '2026-09-08-1',
    items: [
      'Penyelarasan hak akses hapus order di tabel utama dan aktivitas di card detail modal sesuai konfigurasi delete_scope dari Hak Akses',
    ],
  }),
  'laporan-pekerjaan-2026-09-07': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-09-07',
    date: '07 Sep 2026',
    version: '2026-09-07-1',
    items: [
      'Sinkronisasi perhitungan persentase progress tabel: kini menggunakan seluruh task order sehingga selalu konsisten dengan rincian modal Detail Pekerjaan',
    ],
  }),
  'laporan-pekerjaan-2026-09-06': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-09-06',
    date: '06 Sep 2026',
    version: '2026-09-06-1',
    items: [
      'Perbaikan scroll vertikal di viewport mobile landscape: document-level scroll agar address bar browser otomatis tersembunyi saat menggulir',
      'Fixed thead tanpa Portal yang mengunci ke atas viewport saat tabel di-scroll, dengan sinkronisasi horizontal via transform DOM langsung tanpa re-render (nol lag)',
      'Reset scroll dokumen otomatis saat rotasi kembali ke portrait agar header halaman tidak stuck tersembunyi',
      'Penyeragaman jarak bawah collapse vs expand di semua viewport (HP landscape, laptop, 2XL) dengan satu sumber padding',
      'Optimasi performa: AbortController anti-race pada fetch data dan indeks filter pic/bagian/status/faktur',
    ],
  }),
  'laporan-pekerjaan-2026-09-03': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-09-03',
    date: '03 Sep 2026',
    version: '2026-09-03-1',
    items: [
      'Integrasi Pengecualian PIC Dinamis (@exclude_role): Daftar opsi PIC pada filter halaman dan dropdown form otomatis mengecualikan pengguna dari role yang diatur di konfigurasi hak akses',
      'Perbaikan Pemetaan PIC Dropdown: Memastikan kompatibilitas struktur nilai-label pada opsi PIC di InlineEditRow dan InlineAddRow sehingga nama PIC terpilih muncul dengan tepat tanpa error mapping',
    ],
  }),
  'laporan-pekerjaan-2026-09-02': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-09-02',
    date: '02 Sep 2026',
    version: '2026-09-02-1',
    items: [
      'Peningkatan responsivitas & UI/UX multi-viewport: perbaikan scroll vertikal pada mobile card view sehingga daftar pekerjaan dapat di-scroll lancar di semua ukuran HP',
      'Fitur collapsible & expandable pada toolbar Pencarian & Filter di layar mobile dengan indikator titik hijau saat ada filter aktif dan penyimpanan preferensi otomatis',
      'Penataan layout filter mobile proporsional (grid 50%:50% untuk rentang tanggal & jam, 50%:50% untuk Bagian & PIC, serta 100% penuh untuk Status)',
      'Optimalisasi auto-clamping pada TimePicker dan DatePicker agar panel popover waktu tidak terpotong tepi layar HP',
      'Peningkatan ergonomi grafik PIC di mobile: penambahan rotasi kemiringan label sumbu X dan penyingkatan nama cerdas (smart truncate) agar label tidak saling bertumpuk',
      'Penyelarasan tampilan modal di layar sempit / mobile landscape (simulasi keyboard virtual) dengan scroll form mandiri dan pembatas tinggi maksimal adaptif',
    ],
  }),
  'laporan-pekerjaan-2026-09-01': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-09-01',
    date: '01 Sep 2026',
    version: '2026-09-01-1',
    items: [
      'Penambahan fitur input order manual untuk pekerjaan produksi yang belum terdaftar di sistem Digit',
      'Pencatatan waktu pengerjaan dengan input Jam Mulai dan Jam Selesai (HH:mm) pada setiap aktivitas tugas',
      'Filter rentang tanggal (Dari - Sampai) dan rentang jam pengerjaan dengan penyimpanan preferensi harian otomatis',
      'Pengatur ukuran font tabel interaktif presisi ala Excel (input angka custom 6px–48px, pilihan preset, dan tombol - / +) yang terintegrasi ke modal detail',
      'Pemberian hak akses tambah pekerjaan untuk anggota/operator',
      'Otomatisasi pengisian PIC dan Bagian saat tambah pekerjaan jika kolomnya disembunyikan lewat konfigurasi role',
      'Penyelarasan modal detail agar daftar rincian pekerjaan tidak terpotong oleh filter status di tabel utama',
      'Perbaikan pembatalan form modal: data ketikan tidak tersimpan ke database jika pengguna menutup modal tanpa menekan tombol Simpan',
      'Optimalisasi lis warna status baris tabel menggunakan inset shadow agar tidak tembus keluar header saat di-scroll',
      'Penyempurnaan navigasi sidebar: popup profil pengguna otomatis menutup (auto-collapse) saat sidebar menciut',
    ],
  }),
  'laporan-pekerjaan-2026-08-30': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-30',
    date: '30 Agu 2026',
    version: '2026-08-30-1',
    items: [
      'Penyempurnaan hak akses role: order baru SOPD tanpa subtask kini hanya muncul untuk role yang memiliki izin tambah pekerjaan (can_add)',
      'Perbaikan inisialisasi default filter agar tombol Reset tidak muncul otomatis saat halaman pertama kali dibuka',
      'Penambahan kolom Note yang dapat di-sort setelah Pekerjaan Selanjutnya pada tabel order utama',
      'Pembaruan default sorting urutan order: tanggal order terbaru dan nomor project terbesar otomatis di atas (natural sort desc), tanggal kosong di posisi paling bawah',
      'Penyelarasan tata letak status badge rata kiri pada kolom tabel di modal detail tugas',
      'Perbaikan kalkulasi posisi portal SquareDropdown dan DatePicker saat level zoom browser berubah',
      'Penyempurnaan tombol navigasi melayang (Up & Down) yang kini murni mengendalikan scroll halaman (viewport) tanpa mengganggu scroll internal tabel',
      'Pembaruan kalkulasi posisi DatePicker dengan smart viewport clamping horizontal agar kalender presisi di tengah/tidak terpotong pada batas layar sempit',
    ],
  }),
  'laporan-pekerjaan-2026-08-29': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-29',
    date: '29 Agu 2026',
    version: '2026-08-29-1',
    items: [
      'Penyelarasan tata letak Filter & Search bar menjadi 1 baris terpadu pada mode HP Landscape dengan lebar dropdown adaptif agar kotak pencarian tetap lapang',
      'Optimalisasi scroll natural dokumen pada viewport HP Landscape untuk mendukung auto-hide address bar browser bawaan',
      'Perbaikan responsif modal detail tugas (TaskDetailModal) dan modal resolusi konflik spreadsheet dengan penambahan scroll horizontal tabel serta layout tombol fleksibel',
      'Penyempurnaan tombol navigasi melayang (Up & Down) untuk mendukung sinkronisasi scroll vertikal tabel dan viewport landscape secara bersamaan',
      'Optimasi performa backend & frontend: penambahan index database B-Tree, subquery point-lookup tgl order, single-pass task summary, dan in-memory cache master pekerjaan',
    ],
  }),
  'laporan-pekerjaan-2026-08-24': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-24',
    date: '24 Agu 2026',
    version: '2026-08-24-1',
    items: [
      'Penerapan batasan hak akses role pada Laporan Pekerjaan (filter otomatis Bagian & PIC, serta pembatasan hak aksi)',
      'Otomatis menyembunyikan dropdown filter Bagian / PIC jika role user hanya memiliki akses ke tepat 1 opsi',
      'Pencegahan tugas tanpa PIC/tanpa Bagian lolos saat role user dalam mode terkunci (kecuali opsi @unassigned diaktifkan)',
      'Dukungan filter "Tanpa PIC" pada dropdown filter PIC dan penyelarasan pencocokan task tanpa PIC (empty/null)',
      'Pengaturan independen hak aksi (Tambah Pekerjaan, Edit Pekerjaan, Hapus Pekerjaan) pada modal detail order',
      'Optimasi performa tinggi: O(1) Set filter lookup dan batch single-query resolusi @role untuk kecepatan render maksimal',
    ],
  }),
  'laporan-pekerjaan-2026-08-16': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-16',
    date: '16 Agu 2026',
    version: '2026-08-16-1',
    items: [
      'Penyelarasan tata letak responsif Form Tambah Pekerjaan & Daftar Pekerjaan di resolusi laptop (fixed bottom action button) dan sm landscape',
      'Perbaikan scrollability halaman saat Accordion Grafik Analisis diekspansi di resolusi laptop',
      'Ekstraksi komponen SquareDropdown modular dan penyeragaman orientasi popup otomatis (right-0 / left-0)',
    ],
  }),
  'laporan-pekerjaan-2026-08-15': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-15',
    date: '15 Agu 2026',
    version: '2026-08-15-1',
    items: [
      'Penyempurnaan tata letak responsif lintas perangkat (HP Portrait, HP Landscape, Tablet & Desktop)',
      'Optimalisasi sticky header navigasi tab dan filter bar khusus HP portrait tanpa celah/transparansi',
      'Pencatatan Audit Trail / Log Aktivitas lengkap untuk setiap aksi CRUD (Tambah, Edit, Hapus) & Bulk Import dengan dukungan visualisasi Diff (Before/After)',
      'Penambahan notifikasi Toast feedback (sukses/gagal) saat aksi simpan dan hapus data pekerjaan',
      'Pemisahan nilai Divisi pada data baru (dikosongkan agar murni menggunakan Bagian) serta preservasi Divisi asli saat edit',
      'Pembersihan auto-refresh timer berkala & penyelarasan teks indikator/loading menjadi murni SINTAK',
    ],
  }),
  'laporan-pekerjaan-2026-08-14': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-14',
    date: '14 Agu 2026',
    version: '2026-08-14-1',
    items: [
      'Peralihan total dari mode hybrid ke Full Input & Kelola di SINTAK (Single Source of Truth)',
      'Modul Konversi Data baru di Settings (/settings/konversi-data/laporan-pekerjaan) untuk reset/reseed data fresh dari Google Spreadsheet dengan kolom Bagian default "SETTING"',
      'Penambahan filter Bagian & cascade filtering (Bagian, PIC, Status saling terkait) dengan penanda aktif hijau + tombol Reset cepat',
      'Smart horizontal shift pada dropdown filter untuk deteksi batas layar otomatis agar panel tidak terpotong tepi layar',
      'Peningkatan UX Mobile Card View: penambahan info Bagian/Divisi serta tombol Edit & Hapus di setiap card HP',
      'Optimasi performa tab: pemuatan dropdown non-blocking & preservasi data form Tambah Pekerjaan agar tidak ter-reset saat berpindah tab',
      'Penyesuaian tata letak form 1 layar utuh tanpa scroll luar & perbaikan parser tanggal fleksibel (termasuk format 3-Jan-26)',
      'Pembersihan UI: penyelarasan nama modul menjadi "Laporan Pekerjaan", penghapusan card header sekunder & pembuangan tombol Tambah Data duplikat di bar filter',
    ],
  }),
  'laporan-pekerjaan-2026-08-12-crud': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-12',
    date: '12 Agu 2026',
    version: '2026-08-12-1',
    items: [
      'Penambahan kolom "Bagian" terpisah di database & tabel Laporan Pekerjaan',
      'Penyempurnaan Form Input JHP Style: dropdown Bagian tersimpan ke kolom Bagian, Divisi mempertahankan data bawaan Spreadsheet',
      'Deteksi otomatis Jenis Pekerjaan di form saat mengedit baris pekerjaan',
      'Penyempurnaan konfirmasi simpan (alert dialog), pembersihan draft sessionStorage saat edit, dan pencegahan duplikasi row saat UPDATE',
      'Pengecualian tabel laporan_pekerjaan dari auto-trigger audit log (menghemat puluhan ribu log beraudit sync)',
      'Memoization item & label Order Produksi untuk performa render 4.500+ data instan tanpa nge-lag',
    ],
  }),
  'laporan-pekerjaan-2026-08-11': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-11',
    date: '11 Agu 2026',
    version: '2026-08-11-1',
    items: [
      'Penyesuaian z-index tombol navigasi scroll floating (up/down) agar tidak menutupi sidebar saat dibuka',
    ],
  }),
  'laporan-pekerjaan-2026-08-13-1': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-13',
    date: '13 Agu 2026',
    version: '2026-08-13-1',
    versionLabel: 'v1',
    items: [
      'Penyelarasan style footer tabel (TableFooter) berdiri sendiri di luar card tabel 100% konsisten dengan halaman SOPd',
      'Perbaikan bug tombol floating nav (up/down) yang tertahan active saat idle di HP & touchscreen',
    ],
  }),
  'laporan-pekerjaan-2026-08-13-2': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-13',
    date: '13 Agu 2026',
    version: '2026-08-13-2',
    versionLabel: 'v2',
    items: [
      'Pembaruan komponen DatePicker dengan smart horizontal shift (transform: translateX) untuk cegah kalender terpotong tepi layar',
      'Penyelarasan hierarki z-index aplikasi (Modal/Overlay z-[300-400] di atas Sidebar z-[100], Tombol Nav z-[80] di bawah Sidebar z-[100])',
    ],
  }),
  'excel-sopd-2026-08-13-1': entry({
    pageKey: 'excel-sopd',
    title: 'Data Order Produksi (SOPd)',
    permissionKeys: ['jurnal_harian_produksi'],
    sortDate: '2026-08-13',
    date: '13 Agu 2026',
    version: '2026-08-13-1',
    items: [
      'Pembaruan komponen DatePicker dengan smart horizontal shift (transform: translateX) untuk cegah kalender terpotong tepi layar',
      'Penyelarasan z-index DateRangeCard (z-30) dan DataTable (z-[20]) agar panel DatePicker tidak tertutup header tabel SOPd',
    ],
  }),
  'laporan-pekerjaan-2026-08-12': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-12',
    date: '12 Agu 2026',
    version: '2026-08-12-1',
    items: [
      'Perbaikan dropdown filter yang tembus keluar card saat dipilih di HP',
      'Perbaikan badge status yang keluar dari card saat toggle expand/collapse card di HP',
      'Header halaman utama SINTAK dimasukkan ke area scroll utama di HP agar ter-scroll ke atas saat halaman di-scroll',
      'Header kolom tabel mobile (Task/Project | PIC | Priority | Status) dipindah ke level terluar (sticky top-0 z-30) sehingga di HP portrait & landscape header selalu menempel di atas layar saat di-scroll',
    ],
  }),
  'laporan-pekerjaan-2026-08-10': entry({
    pageKey: 'laporan-pekerjaan',
    title: 'Laporan Pekerjaan',
    permissionKeys: ['produksi_laporan_pekerjaan'],
    sortDate: '2026-08-10',
    date: '10 Agu 2026',
    version: '2026-08-10-3',
    items: [
      'Mode Hybrid: gabungan data manual (SINTAK) dan live dari Google Spreadsheet dalam satu tabel',
      'Data dari Spreadsheet read-only (badge "Sheet"), data manual bisa diedit & dihapus',
      'Edit data spreadsheet otomatis convert jadi data manual (tidak kembali ke spreadsheet)',
      'Conflict resolution: jika data spreadsheet berubah padahal sudah ada versi manual, modal konflik muncul untuk pilih versi mana yang dipakai',
      'Tombol "Sync Spreadsheet" untuk paksa sinkronisasi manual dengan spreadsheet (ganti dari "Refresh Live")',
      'Fitur CRUD lengkap: Tambah, Edit, Hapus data manual langsung di aplikasi',
    ],
  }),

  // ─── Log Aktivitas User ───
  'log-aktivitas-user-2026-08-10': entry({
    pageKey: 'log-aktivitas-user',
    title: 'Log Aktivitas User',
    permissionKeys: ['usr_log_view'],
    sortDate: '2026-08-10',
    date: '10 Agu 2026',
    version: '2026-08-10-1',
    versionLabel: 'v1',
    items: [
      'Halaman baru: riwayat aktivitas pengguna dari sistem Digit',
      'Filter berdasarkan rentang tanggal awal dan akhir',
      'Tampilkan level log (INFO/WARN/ERROR), channel, user, dan pesan',
      'Detail data tambahan dapat dibuka per baris untuk melihat informasi lengkap',
    ],
  }),
  'log-aktivitas-user-2026-08-10-2': entry({
    pageKey: 'log-aktivitas-user',
    title: 'Log Aktivitas User',
    permissionKeys: ['usr_log_view'],
    sortDate: '2026-08-10',
    date: '10 Agu 2026',
    version: '2026-08-10-2',
    versionLabel: 'v2',
    items: [
      'Tarik Data menyimpan log ke database lokal — reload halaman data tetap ada',
      'Filter rentang tanggal, pencarian teks (channel/user/pesan), dan infinite scroll',
      'Export Excel mengambil semua data (bukan hanya yang sudah di-scroll)',
      'Lebar kolom tersimpan otomatis setelah di-resize',
    ],
  }),
};

/** pathname → pageKey (hanya path yang punya log) */
export const PAGE_CHANGELOG_PATHS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard-manufaktur': 'dashboard-manufaktur',
  '/dashboard-akunting': 'dashboard-akunting',
  '/dashboard-hrd': 'dashboard-hrd',
  '/jurnal-harian-produksi': 'jurnal-harian-produksi',
  '/jurnal-harian-produksi/data/excel-sopd': 'excel-sopd',
  '/jurnal-harian-produksi/data/master-pekerjaan': 'master-pekerjaan',
  '/jurnal-harian-produksi/data/master-pekerjaan-jurnal-produksi':
    'master-pekerjaan-jurnal-produksi',
  '/jurnal-harian-produksi/target': 'jurnal-harian-produksi-target',
  '/jurnal-harian-produksi/analisa': 'jurnal-harian-produksi-analisa',
  '/tracking-manufaktur': 'tracking-manufaktur',
  '/laporan-pekerjaan': 'laporan-pekerjaan',
  '/log-aktivitas': 'log-aktivitas',
  '/records': 'records',
  '/bom': 'bom',
  '/hasil-produksi': 'hasil-produksi',
  '/log-perubahan': 'log-perubahan',
  '/akuntansi/data/rek-akuntansi': 'rek-akuntansi',
  '/akuntansi/laporan/jurnal-umum': 'jurnal-umum',
  '/bahan-baku': 'bahan-baku',
  '/barang-jadi': 'barang-jadi',
  '/data-digit/produksi/produksi-selesai': 'produksi-selesai',
  '/data-digit/stok/master-barang': 'master-barang',
  '/data-digit/sistem/log-aktivitas-user': 'log-aktivitas-user',
  '/hpp-kalkulasi': 'hpp-kalkulasi',
  '/orders': 'orders',
  '/pelunasan-hutang': 'pelunasan-hutang',
  '/pelunasan-piutang': 'pelunasan-piutang',
  '/penerimaan-pembelian': 'penerimaan-pembelian',
  '/pengiriman': 'pengiriman',
  '/pr': 'pr',
  '/pricelist': 'pricelist',
  '/profile': 'profile',
  '/purchase-orders': 'purchase-orders',
  '/rekap-pembelian-barang': 'rekap-pembelian-barang',
  '/rekap-sales-order': 'rekap-sales-order',
  '/roles': 'roles',
  '/sales': 'sales',
  '/sales-orders': 'sales-orders',
  '/settings/konversi-data/kalkulasi/hpp-kalkulasi': 'konversi-hpp',
  '/settings/telegram-users': 'telegram-users',
  '/sph-in': 'sph-in',
  '/sph-out': 'sph-out',
  '/spph-out': 'spph-out',
  '/sync': 'sync',
  '/users': 'users',
};

/** Get latest changelog for a pageKey (untuk modal per-halaman) */
export function getPageChangelog(pageKey: string): PageChangelog | null {
  // Cari entry terbaru untuk pageKey ini
  const entries = Object.values(PAGE_CHANGELOGS).filter(e => e.pageKey === pageKey);
  if (entries.length === 0) return null;
  entries.sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''));
  return entries[0];
}

/** Get all changelog releases for a pageKey (untuk modal multi-history) */
export function getAllPageChangelogs(pageKey: string): PageChangelog[] {
  const entries = Object.values(PAGE_CHANGELOGS).filter(e => e.pageKey === pageKey);
  entries.sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''));
  return entries;
}

export function getPageChangelogByPath(pathname: string | null): PageChangelog | null {
  if (!pathname) return null;
  const pageKey = PAGE_CHANGELOG_PATHS[pathname];
  if (!pageKey) return null;
  return getPageChangelog(pageKey);
}

/** Get all changelog releases by pathname (untuk modal multi-history) */
export function getAllPageChangelogsByPath(pathname: string | null): PageChangelog[] {
  if (!pathname) return [];
  const pageKey = PAGE_CHANGELOG_PATHS[pathname];
  if (!pageKey) return [];
  return getAllPageChangelogs(pageKey);
}

export function getPathForPageKey(pageKey: string): string | null {
  for (const [path, key] of Object.entries(PAGE_CHANGELOG_PATHS)) {
    if (key === pageKey) return path;
  }
  return null;
}

export function changelogDismissKey(pageKey: string, version: string) {
  return `sintak_changelog_dismissed:${pageKey}:${version}`;
}

function userCanSeeChangelog(
  entry: PageChangelog,
  permissions: PermissionMap,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  // permissionKeys kosong = hub publik untuk semua user login
  if (!entry.permissionKeys?.length) return true;
  return entry.permissionKeys.some((k) => permissions[k] === true);
}

/** Daftar log untuk hub /log-perubahan: filter permission, terbaru di atas */
export function listChangelogsForUser(
  permissions: PermissionMap,
  options?: { isSuperAdmin?: boolean }
): Array<PageChangelog & { path: string | null }> {
  const isSuperAdmin = options?.isSuperAdmin === true;
  const rows = Object.values(PAGE_CHANGELOGS)
    .filter((e) => userCanSeeChangelog(e, permissions, isSuperAdmin))
    .map((e) => ({
      ...e,
      path: getPathForPageKey(e.pageKey),
    }));

  rows.sort((a, b) => {
    const d = (b.sortDate || '').localeCompare(a.sortDate || '');
    if (d !== 0) return d;
    return (a.title || '').localeCompare(b.title || '', 'id');
  });

  return rows;
}

export type ChangelogDateGroup = {
  sortDate: string;
  label: string;
  entries: Array<PageChangelog & { path: string | null }>;
};

/** Group daftar log per tanggal (terbaru di atas), menu di dalam group. */
export function groupChangelogsBySortDate(
  entries: Array<PageChangelog & { path: string | null }>
): ChangelogDateGroup[] {
  const map = new Map<string, ChangelogDateGroup>();

  for (const e of entries) {
    const key = e.sortDate || e.date || '';
    let g = map.get(key);
    if (!g) {
      g = {
        sortDate: key,
        label: e.date || e.sortDate || 'Tanpa tanggal',
        entries: [],
      };
      map.set(key, g);
    }
    g.entries.push(e);
  }

  const groups = [...map.values()];
  groups.sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''));
  for (const g of groups) {
    g.entries.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'id'));
  }
  return groups;
}
