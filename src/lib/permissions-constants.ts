// permissions-constants.ts
// Shared constants - safe to import from both client and server components.
// No server-only imports here.

export const MODULE_REGISTRY = [
  // Utilitas / Dashboard
  { key: 'dashboard',              label: 'Dashboard',                        group: 'Dashboard' },
  { key: 'sync',                   label: 'Sinkronisasi All Data',            group: 'Data Digit' },

  // Umum
  { key: 'tracking_manufaktur',    label: 'Tracking Manufaktur',              group: 'Sistem - Umum' },
  { key: 'karyawan',               label: 'Karyawan',                         group: 'Sistem - Umum' },

  // HRD
  { key: 'catat_kesalahan',        label: 'Catat Kesalahan',                  group: 'Sistem - HRD' },
  { key: 'statistik',              label: 'Statistik Performa',               group: 'Sistem - HRD' },

  // Kalkulasi
  { key: 'kalkulasi_rekap_so',     label: 'Rekap Sales Order Barang',         group: 'Sistem - Penjualan' },
  { key: 'hpp_kalkulasi',          label: 'HPP Kalkulasi',                    group: 'Sistem - Kalkulasi' },

  // Pembelian
  { key: 'pembelian_pr',           label: 'Purchase Request (PR)',            group: 'Data Digit - Pembelian' },
  { key: 'pembelian_spph',         label: 'SPPH Keluar',                      group: 'Data Digit - Pembelian' },
  { key: 'pembelian_sph_in',       label: 'SPH Masuk',                        group: 'Data Digit - Pembelian' },
  { key: 'pembelian_po',           label: 'Purchase Order (PO)',              group: 'Data Digit - Pembelian' },
  { key: 'pembelian_penerimaan',   label: 'Penerimaan Barang',                group: 'Data Digit - Pembelian' },
  { key: 'pembelian_rekap',        label: 'Rekap Pembelian Barang',           group: 'Data Digit - Pembelian' },
  { key: 'pembelian_hutang',       label: 'Pelunasan Hutang',                 group: 'Data Digit - Pembelian' },

  // Produksi (Data Digit)
  { key: 'produksi_bom',           label: 'BOM Produksi',                     group: 'Data Digit - Produksi' },
  { key: 'produksi_orders',        label: 'Order Produksi',                   group: 'Data Digit - Produksi' },
  { key: 'produksi_bahan_baku',    label: 'BBB Produksi',                     group: 'Data Digit - Produksi' },
  { key: 'produksi_barang_jadi',   label: 'Penerimaan Barang Hasil Produksi', group: 'Data Digit - Produksi' },

  // Sistem - Produksi
  { key: 'produksi_jhp_sopd',      label: 'SOPd',                             group: 'Sistem - Produksi' },
  { key: 'produksi_jhp_master_pekerjaan', label: 'Master Pekerjaan',          group: 'Sistem - Produksi' },
  { key: 'produksi_jhp_target',    label: 'Target Harian',                    group: 'Sistem - Produksi' },
  { key: 'produksi_jhp',           label: 'Jurnal Harian Produksi',           group: 'Sistem - Produksi' },
  { key: 'produksi_hasil',         label: 'Hasil Produksi',                   group: 'Sistem - Produksi' },

  // Sistem - User
  { key: 'hak_akses',              label: 'Hak Akses',                        group: 'Sistem - User' },
  { key: 'kelola_user',            label: 'Kelola User',                      group: 'Sistem - User' },

  // Sistem - Settings
  { key: 'settings_konversi_data', label: 'Konversi Data - Jurnal Harian Produksi', group: 'Sistem - Settings' },

  // Penjualan
  { key: 'penjualan_sph_out',      label: 'SPH Keluar (Penjualan)',           group: 'Data Digit - Penjualan' },
  { key: 'penjualan_so',           label: 'Sales Order Barang',               group: 'Data Digit - Penjualan' },
  { key: 'penjualan_laporan',      label: 'Laporan Penjualan',                group: 'Data Digit - Penjualan' },
  { key: 'penjualan_piutang',      label: 'Pelunasan Piutang',                group: 'Data Digit - Penjualan' },
  { key: 'penjualan_pengiriman',   label: 'Pengiriman (SJ)',                  group: 'Data Digit - Penjualan' },
] as const;

export type ModuleKey = typeof MODULE_REGISTRY[number]['key'];
export type PermissionMap = Record<string, boolean>;
