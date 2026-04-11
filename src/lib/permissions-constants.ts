// permissions-constants.ts
// Shared constants - safe to import from both client and server components.
// No server-only imports here.

export const MODULE_REGISTRY = [
  // Data Digit
  { key: 'dashboard',              label: 'Dashboard',                        group: 'Umum' },
  { key: 'sync',                   label: 'Sinkronisasi All Data',            group: 'Umum' },
  // Pembelian
  { key: 'pembelian_pr',           label: 'Purchase Request (PR)',            group: 'Pembelian' },
  { key: 'pembelian_spph',         label: 'SPPH Keluar',                      group: 'Pembelian' },
  { key: 'pembelian_sph_in',       label: 'SPH Masuk',                        group: 'Pembelian' },
  { key: 'pembelian_po',           label: 'Purchase Order (PO)',              group: 'Pembelian' },
  { key: 'pembelian_penerimaan',   label: 'Penerimaan Barang',                group: 'Pembelian' },
  { key: 'pembelian_rekap',        label: 'Rekap Pembelian Barang',           group: 'Pembelian' },
  { key: 'pembelian_hutang',       label: 'Pelunasan Hutang',                 group: 'Pembelian' },
  // Produksi
  { key: 'produksi_bom',           label: 'BOM Produksi',                     group: 'Produksi' },
  { key: 'produksi_orders',        label: 'Order Produksi',                   group: 'Produksi' },
  { key: 'produksi_bahan_baku',    label: 'BBB Produksi',                     group: 'Produksi' },
  { key: 'produksi_barang_jadi',   label: 'Penerimaan Barang Hasil Produksi', group: 'Produksi' },
  // Penjualan
  { key: 'penjualan_sph_out',      label: 'SPH Keluar (Penjualan)',           group: 'Penjualan' },
  { key: 'penjualan_so',           label: 'Sales Order Barang',               group: 'Penjualan' },
  { key: 'penjualan_laporan',      label: 'Laporan Penjualan',                group: 'Penjualan' },
  { key: 'penjualan_piutang',      label: 'Pelunasan Piutang',                group: 'Penjualan' },
  { key: 'penjualan_pengiriman',   label: 'Pengiriman (SJ)',                  group: 'Penjualan' },
  // Kalkulasi
  { key: 'kalkulasi_rekap_so',     label: 'Rekap Sales Order Barang',         group: 'Kalkulasi' },
  // Data Master & Kinerja
  { key: 'karyawan',               label: 'Karyawan',                         group: 'Data Master' },
  { key: 'hpp_kalkulasi',          label: 'HPP Kalkulasi',                    group: 'Data Master' },
  { key: 'statistik',              label: 'Statistik Performa',               group: 'Kesalahan Karyawan' },
  { key: 'catat_kesalahan',        label: 'Catat Kesalahan',                  group: 'Kesalahan Karyawan' },
  { key: 'tracking_manufaktur',    label: 'Tracking Manufaktur',              group: 'Tracking' },
] as const;

export type ModuleKey = typeof MODULE_REGISTRY[number]['key'];
export type PermissionMap = Record<string, boolean>;
