/**
 * Type definitions for InfractionsTable and related hooks
 */

export interface Infraction {
  id: number;
  employee_name: string;
  employee_no?: string | null;
  employee_position?: string | null;
  description: string;
  date: string;
  recorded_by: string;
  recorded_by_name?: string | null;
  recorded_by_position?: string | null;
  recorded_by_id?: number | null;
  order_name: string | null;
  order_name_display?: string | null;
  order_faktur?: string | null;
  faktur: string | null;
  jenis_barang?: string | null;
  nama_barang?: string | null;
  nama_barang_display?: string | null;
  item_faktur?: string | null;
  jenis_harga?: string | null;
  jumlah?: number | null;
  harga?: number | null;
  total?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}
