// permissions-laporan-pekerjaan-constants.ts
// Shared constants & types - safe to import from both client and server components.

export const LAPORAN_PEKERJAAN_COLUMNS = [
  { key: 'no', label: 'No' },
  { key: 'bagian', label: 'Bagian' },
  { key: 'pic', label: 'PIC' },
  { key: 'task', label: 'Task / Aktivitas' },
  { key: 'priority', label: 'Priority' },
  { key: 'start_end', label: 'Start ~ End' },
  { key: 'work_days', label: 'Work Days' },
  { key: 'status', label: 'Status' },
  { key: 'note', label: 'Note' },
] as const;

export type LaporanPekerjaanColumnKey = typeof LAPORAN_PEKERJAAN_COLUMNS[number]['key'];

export const LAPORAN_PEKERJAAN_BAGIAN_LIST = [
  'SETTING',
  'QUALITY CONTROL',
  'CETAK',
  'FINISHING',
  'GUDANG',
  'TEKNISI',
  'MESIN',
] as const;

export type LaporanPekerjaanDeleteScope = 'none' | 'table_only' | 'card_only' | 'all';

export interface RoleLaporanPekerjaanConfig {
  role: string;
  allowed_bagian: string[];   // [] berarti SEMUA Bagian diizinkan
  allowed_pic: string[];      // [] berarti SEMUA PIC diizinkan
  excluded_pic?: string[];    // [] atau undefined berarti TIDAK ADA PIC yang dikecualikan (misal: @role:X atau nama PIC)
  visible_columns: string[];  // [] berarti SEMUA Kolom ditampilkan
  can_add?: boolean;          // Default true (Izin Tambah Pekerjaan Baru)
  can_edit?: boolean;         // Default true (Izin Edit / Ubah Pekerjaan)
  can_delete?: boolean;       // Legacy boolean: jika false setara 'none', true setara 'all'
  delete_scope?: LaporanPekerjaanDeleteScope; // 'none' | 'table_only' | 'card_only' | 'all'
}
