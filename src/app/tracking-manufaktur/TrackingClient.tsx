'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Loader2, Calculator, ArrowRight, AlertCircle, Clock, ChevronDown } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';

// Unified date formatter for MDT Host source data (YYYY-MM-DD -> DD-MM-YYYY)
const formatMdtDate = (str: string) => {
   if (!str) return '-';
   const clean = str.trim();
   if (/^\d{2}-\d{2}-\d{4}/.test(clean)) return clean; // Already DD-MM-YYYY
   const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})(.*)/);
   if (match) {
      const [_, y, m, d, rest] = match;
      const time = rest.trim().slice(0, 5); // Take HH:mm if available
      return `${d}-${m}-${y}${time ? ' ' + time : ''}`;
   }
   return clean;
};

const parseLooseNumber = (value: unknown) => {
   if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
   if (value === null || value === undefined) return 0;

   const plain = String(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').trim();
   if (!plain) return 0;

   const match = plain.match(/-?\d[\d.,]*/);
   if (!match) return 0;

   const normalized = match[0].replace(/,/g, '');
   const parsed = Number(normalized);
   return Number.isFinite(parsed) ? parsed : 0;
};

const chipClass = "px-1.5 py-0.5 rounded border text-[11px] font-bold whitespace-nowrap";
const cardClass = "bg-white rounded-lg p-3 shadow-sm flex flex-col gap-2.5 w-full max-w-full text-left";
const infoCardClass = "bg-slate-50 p-2 rounded border border-gray-100/50";
const infoLabelClass = "text-[10px] text-gray-400 font-bold tracking-tight";
const refLabelClass = "text-gray-400 font-bold min-w-[60px]";
const refRowClass = "flex items-center gap-1.5 text-[11px] text-gray-500";
const productTitleClass = "text-[12px] font-bold text-slate-800 leading-snug mt-1";
const productMetaClass = "flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400 font-medium tracking-tight mt-1";
const customerTextClass = "text-[11px] font-bold";
const locationBadgeClass = "text-[11px] text-gray-400 px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100 tracking-tighter font-bold whitespace-nowrap";
const emptyStateClass = "py-6 text-center text-[11px] font-bold uppercase tracking-widest text-gray-300 italic";
const headerDateClass = "text-[10px] text-gray-400 shrink-0 text-right";
const auditSectionClass = "pt-1 mt-1 border-t border-gray-100 flex flex-col gap-0.5 text-[11px] text-gray-400 italic";

// Tambahkan di atas component (baris 48)
const toTitleCase = (str: string) => {
   const abbreviations: Record<string, string> = {
      'kd': 'Kode', 'brg': 'Barang',
      'qty': 'Qty', 'ppn': 'PPN', 'hp': 'HP',
      'bbb': 'BBB', 'btkl': 'BTKL', 'bop': 'BOP',
      'so': 'SO', 'pr': 'PR', 'op': 'OP', 'bom': 'BOM',
      'sph': 'SPH', 'spph': 'SPPH', 'po': 'PO',
      'mtd': 'Metode', 'regu': 'Regu', 'wip': 'WIP', 'id': 'ID'
   };

   return str
      .split('_')
      .map(word => {
         const lower = word.toLowerCase();
         return abbreviations[lower] || word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
};

export default function TrackingClient() {
   const [q, setQ] = useState('');
   const [suggestions, setSuggestions] = useState<any[]>([]);
   const [loadingSuggestions, setLoadingSuggestions] = useState(false);
   const [loadingData, setLoadingData] = useState(false);
   const [error, setError] = useState('');
   const [trackingData, setTrackingData] = useState<{
      bom: any;
      sphOut: any;
      salesOrder?: any;
      productionOrder?: any;
      purchaseRequests: any[];
      delivery: any[];
      id?: string;
   } | null>(null);
   const [suggestionPage, setSuggestionPage] = useState(1);
   const [hasMoreSuggestions, setHasMoreSuggestions] = useState(true);
   const [loadTime, setLoadTime] = useState<number | null>(null);

   const suggestionRef = useRef<HTMLDivElement>(null);
   const [open, setOpen] = useState(false);

   // Column Widths for Resizing - Persisted in localStorage
   const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
      if (typeof window !== 'undefined') {
         const saved = localStorage.getItem('tracking_columnWidths');
         return saved ? JSON.parse(saved) : {
            bom: 280,
            sph: 220,
            so: 220,
            production: 220,
            pr: 320
         };
      }
      return {
         bom: 280,
         sph: 220,
         so: 220,
         production: 220,
         pr: 320
      };
   });

   useEffect(() => {
      localStorage.setItem('tracking_columnWidths', JSON.stringify(columnWidths));
   }, [columnWidths]);

   // Helper to render all fields that are not explicitly handled
   const RenderAllFields = ({ data, excludeKeys = [] }: { data: any, excludeKeys?: string[] }) => {
      if (!data) return null;
      const normalizeKey = (key: string) => String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
      const handledKeys = new Set([...excludeKeys].map(normalizeKey));
      const entries = Object.entries(data).filter(([key]) => !handledKeys.has(normalizeKey(String(key))));

      if (entries.length === 0) return null;

      return (
         <div className="grid grid-cols-1 gap-1.5 overflow-hidden">
            {entries.map(([key, val]) => {
               // if (val === null || val === undefined || val === '') return null;
               // Format based on type
               let displayVal = String(val);
               if (typeof val === 'number') {
                   const normalizedKey = key.toLowerCase();
                   const isIdField = normalizedKey === 'id' || normalizedKey === 'recid';
                   const isCurrencyField =
                      !normalizedKey.includes('pers') &&
                      !normalizedKey.includes('berat') &&
                      !normalizedKey.includes('qty') &&
                      !normalizedKey.includes('kg') &&
                      (
                         normalizedKey.includes('total') ||
                         normalizedKey.includes('harga') ||
                         normalizedKey.includes('jumlah') ||
                         normalizedKey.includes('hp') ||
                         normalizedKey.includes('biaya') ||
                         normalizedKey.includes('bbb') ||
                         normalizedKey.includes('btkl') ||
                         normalizedKey.includes('bop')
                      );

                   if (isIdField) {
                      displayVal = String(val);
                   } else if (isCurrencyField) {
                      displayVal = 'Rp ' + val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                   } else {
                      displayVal = val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                   }
                }

               return (
                  <div key={key} className="flex items-start justify-between gap-4 text-[10px] leading-tight">
                     <span className="text-gray-400 font-bold shrink-0">{toTitleCase(key)}</span>
                     <span className="text-gray-600 font-medium text-right break-words">{displayVal}</span>
                  </div>
               );
            })}
         </div>
      );
   };

   // Table Columns Definition
   const columns = useMemo<ColumnDef<any>[]>(() => [
      {
         id: 'bom',
         header: 'Bill of Material',
         accessorKey: 'bom',
         size: columnWidths.bom,
         meta: { wrap: true, valign: 'top' },
         cell: ({ row }) => {
            const data = row.original.bom;
            if (!data) return <div className={emptyStateClass}>Tidak Ada Data BOM</div>;
            return (
               <div className="flex flex-col gap-2.5 pt-1.5 pb-3.5 w-full max-w-full overflow-hidden px-1">
                  <div className={`${cardClass} border border-slate-100`}>
                     <RenderAllFields data={data} excludeKeys={['raw_data']} />
                  </div>
               </div>
            );
         }
      },
      {
         id: 'sph',
         header: 'SPH Out',
         accessorKey: 'sphOut',
         size: columnWidths.sph,
         meta: { wrap: true, valign: 'top' },
         cell: ({ row }) => {
            const data = row.original.sphOut;
            if (!data) return <div className={emptyStateClass}>Tidak Ada Data SPH Out</div>;
            return (
               <div className="flex flex-col gap-2.5 pt-1.5 pb-3.5 w-full max-w-full overflow-hidden px-1">
                  <div className={`${cardClass} border border-slate-100`}>
                     <RenderAllFields data={data} excludeKeys={['raw_data']} />
                  </div>
               </div>
            );
         }
      },
      {
         id: 'so',
         header: 'Sales Order',
         accessorKey: 'salesOrder',
         size: columnWidths.so,
         meta: { wrap: true, valign: 'top' },
         cell: ({ row }) => {
            const data = row.original.salesOrder;
            if (!data) return <div className={emptyStateClass}>Tidak Ada Data Sales Order</div>;
            return (
               <div className="flex flex-col gap-2.5 pt-1.5 pb-3.5 w-full max-w-full overflow-hidden px-1">
                  <div className={`${cardClass} border border-indigo-100`}>
                     <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 pb-1.5 pt-1 rounded-lg border border-indigo-100 block w-fit ml-0 text-left truncate">{data.faktur}</span>
                        <span className={headerDateClass}>{data.tgl ? formatMdtDate(data.tgl) : '-'}</span>
                     </div>
                     <div className="space-y-2 px-0.5">
                        <div className="flex items-center justify-between gap-4">
                           <p className={`${customerTextClass} text-indigo-700`}>{data.nama_pelanggan || data.pelanggan || data.kd_pelanggan}</p>
                        </div>
                        <div className={infoCardClass}>
                           <p className={infoLabelClass}>Produk / Barang</p>
                           <p className={productTitleClass}>{data.nama_prd || '-'}</p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                           <div className="flex items-center gap-2.5">
                              <p className="text-[11px] text-gray-700 font-bold">Qty: {Number(data.qty || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {data.satuan || 'Unit'}</p>
                              <span className="text-gray-300">|</span>
                              <p className="text-[11px] text-gray-500 font-medium">@ Rp {Number(data.harga || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                           </div>
                           <div className={`${infoCardClass} flex flex-col gap-1`}>
                              <div className="flex items-center justify-between text-[11px]">
                                 <span className="text-gray-400 font-bold uppercase">Subtotal</span>
                                 <span className="font-bold text-slate-600">Rp {Number(data.subtotal || data.jumlah || (Number(data.qty || 0) * Number(data.harga || 0))).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                 <span className="text-emerald-600 font-bold uppercase">PPN ({data.pers_ppn || '11'}%)</span>
                                 <span className="font-bold text-emerald-600">Rp {Number(data.ppn || data.ppn_rp || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="pt-1 mt-1 border-t border-dashed border-indigo-100 flex items-center justify-between text-[11px]">
                                 <span className="text-gray-800 font-bold uppercase">Total</span>
                                 <span className="text-[12px] font-bold text-slate-900">Rp {(
                                    Number(data.total_akhir || data.total || 0) ||
                                    (Number(data.subtotal || data.jumlah || 0) + Number(data.ppn || data.ppn_rp || 0))
                                 ).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col gap-1 py-1">
                           <div className="flex items-center gap-2">
                              <span className={`${chipClass} text-indigo-600 bg-indigo-50 border-indigo-100 shrink-0`}>TOP: {data.top_hari || 0} Hari</span>
                           </div>
                        </div>
                        <div className="flex flex-col gap-1.5 border-t border-indigo-50 pt-1.5">
                           {data.faktur_sph && <div className={refRowClass}><span className={refLabelClass}>Ref SPH:</span><span className="truncate">{data.faktur_sph}</span></div>}
                           {data.faktur_prd && <div className={refRowClass}><span className={refLabelClass}>Ref Prd:</span><span className="truncate">{data.faktur_prd}</span></div>}
                           {data.kd_barang && <div className={refRowClass}><span className={refLabelClass}>Kd Brg:</span><span className="truncate">{data.kd_barang}</span></div>}
                           {data.gol_barang && <div className={refRowClass}><span className={refLabelClass}>Gol:</span><span className="truncate">{data.gol_barang}</span></div>}
                           {data.dati_2 && <div className={refRowClass}><span className={refLabelClass}>Kota:</span><span className="truncate">{data.dati_2}</span></div>}
                        </div>
                        {(data.spesifikasi || data.keterangan) && (
                           <div className="bg-amber-50/10 p-2 rounded border border-amber-100/50 mt-1 space-y-1">
                              {data.spesifikasi && <div className="flex flex-col gap-0.5"><span className="text-[11px] text-amber-600 font-bold uppercase tracking-tight">Spesifikasi</span><p className="text-[11px] text-slate-600 leading-snug">{data.spesifikasi}</p></div>}
                              {data.keterangan && <div className="flex flex-col gap-0.5 border-t border-amber-100/30 pt-1"><span className="text-[11px] text-amber-600 font-bold uppercase tracking-tight">Keterangan</span><p className="text-[11px] text-slate-600 leading-snug italic">{data.keterangan}</p></div>}
                           </div>
                        )}
                        {(data.username || data.created_at || data.updated_at || data.username_edited || data.edited_at) && (
                           <div className={auditSectionClass}>
                              <p>Created: @{data.username || '-'} ({data.created_at || '-'})</p>
                              {data.updated_at && <p>Updated: {data.updated_at}</p>}
                              {data.username_edited && <p>Edited: @{data.username_edited} ({data.edited_at || '-'})</p>}
                           </div>
                        )}
                        <RenderAllFields data={data} excludeKeys={['id', 'tgl', 'nama_prd', 'kd_barang', 'gol_barang', 'qty', 'satuan', 'harga', 'subtotal', 'jumlah', 'pers_ppn', 'ppn', 'ppn_rp', 'total_akhir', 'total', 'nama_pelanggan', 'pelanggan', 'kd_pelanggan', 'dati_2', 'top_hari', 'faktur_sph', 'faktur_prd', 'spesifikasi', 'keterangan', 'username', 'created_at', 'updated_at', 'edited_at', 'username_edited', 'recid', 'mydata', 'my_data', 'mydataso', 'myDataSo', 'my_data_so', 'my data', 'my data so']} />
                     </div>
                  </div>
               </div>
            );
         }
      },
      {
         id: 'production',
         header: 'Order Produksi',
         accessorKey: 'productionOrder',
         size: columnWidths.production,
         meta: { wrap: true, valign: 'top' },
         cell: ({ row }) => {
            const data = row.original.productionOrder;
            if (!data) return <div className={emptyStateClass}>Tidak Ada Data Order Produksi</div>;
            return (
               <div className="flex flex-col gap-2.5 pt-1.5 pb-3.5 w-full max-w-full overflow-hidden px-1">
                  <div className={`${cardClass} border border-amber-100`}>
                     <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 pb-1.5 pt-1 rounded-lg border border-amber-100 block w-fit ml-0 text-left truncate">{data.faktur}</span>
                        <span className={headerDateClass}>{data.tgl ? formatMdtDate(data.tgl) : '-'}</span>
                     </div>
                     <div className="space-y-2 px-0.5">
                        <div className="flex items-center justify-between gap-4">
                           <p className={`${customerTextClass} text-amber-700`}>{data.nama_pelanggan || data.pelanggan || data.kd_pelanggan || '-'}</p>
                           <span className={locationBadgeClass}>{data.kd_cabang || '-'} / {data.kd_gudang || '-'}</span>
                        </div>
                        <div className={infoCardClass}>
                           <p className={infoLabelClass}>Produk / Barang</p>
                           <p className={productTitleClass}>{data.nama_prd || '-'}</p>
                           <div className={productMetaClass}>
                              <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200 truncate max-w-[140px]">{data.kd_barang || '-'}</span>
                              <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">{data.kd_mtd || 'Reguler'}</span>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                           <div className={`${infoCardClass} flex flex-col gap-1`}>
                              <span className="text-gray-400 font-bold uppercase tracking-tight">Kuantitas</span>
                              <p className="text-slate-700 font-bold">Qty Produksi: {parseLooseNumber(data.qty).toLocaleString('id-ID', { minimumFractionDigits: 2 })} {data.satuan || data.kd_satuan || ''}</p>
                              <p className="text-slate-600">Qty Order: {parseLooseNumber(data.qty_order).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</p>
                              <p className="text-slate-600">Qty SO: {parseLooseNumber(data.qty_so).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</p>
                           </div>
                           <div className="flex flex-col gap-0.5 bg-amber-50/30 p-2 rounded border border-amber-100/30">
                              <span className="text-amber-600 font-bold uppercase tracking-tight">Tim / Regu</span>
                              <p className="text-slate-700 font-bold truncate">{data.kd_regu || '-'}</p>
                              <p className="text-gray-500 italic text-[10px] truncate">{(() => {
                                 try {
                                    const parsed = typeof data.regu === 'string' ? JSON.parse(data.regu) : data.regu;
                                    return parsed?.keterangan || '-';
                                 } catch (e) { return '-'; }
                              })()}</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                           <div className={`${infoCardClass} space-y-1.5`}>
                              <div className="flex items-center justify-between text-[11px]">
                                 <span className="text-gray-500 font-bold uppercase">Progres Produksi</span>
                                 <span className="text-amber-600 font-bold">Hasil: {Number(data.pers_hasil || 0).toFixed(2)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden border border-gray-200/50">
                                 <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, Number(data.pers_hasil || 0))}%` }} />
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-medium text-gray-500">
                                 <span>WIP: {Number(data.prdk_wip || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
                                 <span>Fkt Selesai: {data.fkt_selesai || '-'}</span>
                              </div>
                           </div>
                           <div className={`${infoCardClass} flex flex-col gap-0.5`}>
                              <span className="text-gray-400 font-bold uppercase tracking-tight">Timeline</span>
                              <p className="text-slate-600 font-medium whitespace-nowrap">Mulai: {data.datetime_mulai || '-'}</p>
                              <p className="text-slate-600 font-medium whitespace-nowrap">Selesai: {data.datetime_selesai || '-'}</p>
                              <p className="text-slate-500 text-[10px] font-mono">Tgl OP: {data.tgl || '-'}</p>
                           </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-dashed border-gray-100">
                           {data.perbaikan === '1' && <span className={`${chipClass} bg-rose-50 text-rose-500 border-rose-100 uppercase`}>Perbaikan</span>}
                           {data.status && <span className={`${chipClass} bg-amber-50 text-amber-600 border-amber-100 uppercase`}>Sts: {data.status}</span>}
                           {data.faktur_bom && <span className={`${chipClass} bg-slate-50 text-gray-500 border-gray-100 break-all`}>BOM: {data.faktur_bom}</span>}
                           {data.faktur_so && <span className={`${chipClass} bg-indigo-50 text-indigo-600 border-indigo-100 break-all`}>SO: {data.faktur_so}</span>}
                           {data.faktur_pb && <span className={`${chipClass} bg-emerald-50 text-emerald-600 border-emerald-100 break-all`}>PB: {data.faktur_pb}</span>}
                           {data.faktur_pr && <span className={`${chipClass} bg-sky-50 text-sky-600 border-sky-100 break-all`}>PR: {String(data.faktur_pr).replace(/<[^>]*>?/gm, '')}</span>}
                        </div>
                        <div className="flex flex-col gap-1.5 pt-1 border-t border-dashed border-gray-100">
                           <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="flex flex-col gap-0.5"><span className="text-gray-400 font-bold uppercase">BBB</span><span className="font-bold text-slate-700">Rp {Number(data.bbb || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span></div>
                              <div className="flex flex-col gap-0.5 text-right"><span className="text-amber-600 font-bold uppercase">HP Unit</span><span className="font-bold text-amber-700">Rp {Number(data.hp || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span></div>
                           </div>
                           <div className="grid grid-cols-2 gap-2 text-[11px] bg-amber-50/20 p-1.5 rounded border border-amber-100/30 mt-0.5">
                              <div className="flex flex-col gap-0.5">
                                 <span className="text-gray-400 font-bold uppercase text-[9px]">BTKL ({data.pers_btkl || '0'}%)</span>
                                 <span className="font-bold text-slate-600">Rp {Number(data.btkl || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex flex-col gap-0.5 text-right">
                                 <span className="text-gray-400 font-bold uppercase text-[9px]">BOP ({data.pers_bop || '0'}%)</span>
                                 <span className="font-bold text-slate-600">Rp {Number(data.bop || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
                              </div>
                           </div>
                        </div>
                        {data.spesifikasi && (
                           <div className="bg-gray-50/50 p-2 rounded border border-gray-100 text-[11px]">
                              <p className="text-gray-400 font-bold uppercase mb-0.5 tracking-tight">Spesifikasi</p>
                              <p className="text-gray-600 italic leading-snug">{data.spesifikasi}</p>
                           </div>
                        )}
                        <div className={auditSectionClass}>
                           <div className="flex items-center justify-between"><p>Created: @{data.username || '-'} ({data.created_at || '-'})</p><p className="font-mono text-gray-300 text-[10px]">Tgl: {data.tgl || '-'}</p></div>
                           {data.username_edited && <p>Edited: @{data.username_edited} ({data.edited_at || '-'})</p>}
                        </div>
                        <RenderAllFields data={data} excludeKeys={['id', 'tgl', 'perbaikan', 'status', 'nama_prd', 'faktur_bom', 'faktur_so', 'faktur_pb', 'faktur_pr', 'faktur_prd', 'datetime_mulai', 'datetime_selesai', 'kd_regu', 'regu', 'pers_hasil', 'prdk_wip', 'kd_mtd', 'kd_barang', 'kd_cabang', 'kd_gudang', 'qty', 'satuan', 'kd_satuan', 'qty_order', 'qty_so', 'qty_wip_awal', 'qty_wip_akhir', 'fkt_selesai', 'selesai', 'bbb', 'hp', 'hp_detil', 'hp_total', 'btkl', 'bop', 'pers_btkl', 'pers_bop', 'spesifikasi', 'produk', 'progres', 'nama_barang', 'nama_pelanggan', 'pelanggan', 'kd_pelanggan', 'username', 'created_at', 'edited_at', 'username_edited', 'harga', 'jumlah', 'jmlhp', 'mtd_alokasi_hp', 'tgl_expired', 'cmd', 'cmd2', 'detil', 'recid']} />
                     </div>
                  </div>
               </div>
            );
         }
      },
      {
         id: 'pr',
         header: 'Purchase Request',
         accessorKey: 'purchaseRequests',
         size: columnWidths.pr,
         meta: { wrap: true, valign: 'top' },
         cell: ({ row }) => {
            const items = row.original.purchaseRequests;
            if (!items || items.length === 0) return <div className={emptyStateClass}>Tidak Ada Data PR</div>;
            return (
               <div className="flex flex-col gap-2.5 pt-1.5 pb-3.5 w-full max-w-full overflow-hidden px-1">
                  {items.map((pr: any, idx: number) => (
                     <div key={idx} className={`${cardClass} border border-sky-100`}>
                        <div className="flex items-start justify-between gap-2.5">
                           <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 pb-1.5 pt-1 rounded border border-sky-100 block w-fit ml-0 text-left truncate" title={pr.faktur}>{pr.faktur}</span>
                           <span className={headerDateClass}>{formatMdtDate(pr.tgl)}</span>
                        </div>
                        <div className="space-y-1.5 px-0.5">
                           <div className={infoCardClass}>
                              <p className={infoLabelClass}>Produk / Barang</p>
                              <p className={productTitleClass}>{pr.nama_prd || '-'}</p>
                              <div className={productMetaClass}>
                                 <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">{pr.kd_brg || '-'}</span>
                                 <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">{pr.kd_cabang || '-'} / {pr.kd_gudang || '-'}</span>
                                 {pr.status && <span className="bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 text-sky-600 uppercase">Sts: {pr.status}</span>}
                              </div>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                           <div className="flex flex-col gap-0.5 bg-slate-50 p-2 rounded border border-gray-100/50">
                              <span className="text-gray-400 font-bold uppercase tracking-tight">Kuantitas</span>
                              <span className="font-bold text-slate-800">Qty: {Number(pr.qty || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {pr.satuan || '-'}</span>
                           </div>
                           <div className="flex flex-col gap-0.5 bg-slate-50 p-2 rounded border border-gray-100/50">
                              <span className="text-gray-400 font-bold uppercase tracking-tight">Dibutuhkan</span>
                              <span className="font-medium text-slate-700">{formatMdtDate(pr.tgl_dibutuhkan || '-')}</span>
                           </div>
                        </div>
                        {(pr.faktur_prd || pr.faktur_spph || pr.faktur_po) && (
                           <div className="pt-1 border-t border-sky-100 flex flex-col gap-1 text-[11px]">
                              {pr.faktur_prd && <div className={refRowClass}><span className={refLabelClass}>Ref OP:</span><span className="text-sky-700 font-medium truncate">{String(pr.faktur_prd).replace(/<[^>]*>?/gm, '')}</span></div>}
                              {pr.faktur_spph && <div className={refRowClass}><span className={refLabelClass}>Ref SPPH:</span><span className="text-sky-700 font-medium truncate">{String(pr.faktur_spph).replace(/<[^>]*>?/gm, '')}</span></div>}
                              {pr.faktur_po && <div className={refRowClass}><span className={refLabelClass}>Ref PO:</span><span className="text-sky-700 font-medium truncate">{String(pr.faktur_po).replace(/<[^>]*>?/gm, '')}</span></div>}
                           </div>
                        )}
                        {pr.keterangan && <div className="bg-slate-50 p-2 rounded border border-slate-100"><p className="text-[11px] text-gray-500 italic leading-snug">"{pr.keterangan}"</p></div>}
                        <div className={auditSectionClass}>
                           <p>Created: @{pr.username || '-'} ({pr.created_at || '-'})</p>
                           {pr.updated_at && <p>Updated: {pr.updated_at}</p>}
                           {pr.username_edited && <p>Edited: @{pr.username_edited} ({pr.edited_at || '-'})</p>}
                        </div>
                        <RenderAllFields data={pr} excludeKeys={['id', 'tgl', 'tgl_dibutuhkan', 'faktur_prd', 'kd_gudang', 'kd_cabang', 'status', 'username', 'created_at', 'updated_at', 'edited_at', 'username_edited', 'keterangan', 'faktur_spph', 'faktur_po', 'nama_prd', 'kd_brg', 'qty', 'satuan', 'recid']} />
                     </div>
                  ))}
               </div>
            );
         }
      }
   ], [columnWidths]);

   // Search logic for dropdown
   useEffect(() => {
      let active = true;
      const fetchNames = async (query: string, pageNum: number) => {
         if (pageNum === 1) setLoadingSuggestions(true);
         try {
            const res = await fetch(`/api/tracking/names?q=${encodeURIComponent(query)}&page=${pageNum}&pageSize=20`);
            const json = await res.json();
            if (json.success && active) {
               if (pageNum === 1) { setSuggestions(json.data); }
               else { setSuggestions(prev => [...prev, ...json.data]); }
               setHasMoreSuggestions(json.data.length === 20);
            }
         } catch (e) { } finally {
            if (active && pageNum === 1) setLoadingSuggestions(false);
         }
      };

      if (open) {
         if (q.trim().length === 0) { fetchNames('', 1); }
         else if (q.trim().length >= 2) {
            const handler = setTimeout(() => fetchNames(q, 1), 300);
            return () => { active = false; clearTimeout(handler); };
         }
      }
      return () => { active = false; };
   }, [q, open]);

   // Click outside listener
   useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
         if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
            setOpen(false);
         }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   const handleSelect = async (selected: any) => {
      setOpen(false);
      setQ('');
      setLoadingData(true);
      setTrackingData(null);
      setError('');
      const start = Date.now();
      try {
         const res = await fetch(`/api/tracking?target_faktur=${encodeURIComponent(selected.faktur)}`);
         const json = await res.json();
         if (json.success) {
            setTrackingData({ ...json.data, id: json.data.productionOrder?.faktur || json.data.bom?.faktur || 'N/A' });
            setLoadTime(Date.now() - start);
         } else {
            setError(json.error || 'Gagal memuat data tracking');
         }
      } catch (e: any) { setError(e.message || 'Terjadi kesalahan sistem'); }
      finally { setLoadingData(false); }
   };

   const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight + 50 && !loadingSuggestions && hasMoreSuggestions) {
         setSuggestionPage(prev => prev + 1);
      }
   };

   return (
      <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700 overflow-hidden">
         <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-sm flex flex-col gap-5 shrink-0 relative z-50">
            <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
               <div className="flex-1">
                  <div className="flex flex-col gap-2.5 mb-2">
                     <span className="text-[11px] font-bold text-gray-700 uppercase tracking-widest ml-1">Pilih BOM (Pencarian Bill of Material)</span>
                  </div>
                  <div className="relative" ref={suggestionRef}>
                     <div
                        className={`w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 h-11 text-sm flex items-center justify-between transition-all text-gray-800 cursor-pointer hover:border-gray-300 hover:bg-gray-100/50 shadow-sm ${open ? 'ring-4 ring-green-500/10 border-green-500 bg-white' : ''}`}
                        onClick={() => { setOpen(!open); setQ(''); }}
                     >
                        <div className="flex items-center gap-3 truncate">
                           <Calculator size={16} className={trackingData ? 'text-green-600' : 'text-gray-400'} />
                           <span className={trackingData ? 'text-gray-700 truncate font-bold text-[12px]' : 'text-gray-400 font-medium truncate text-[12px]'}>
                              {trackingData ? `[${trackingData?.bom?.faktur || trackingData?.productionOrder?.faktur}] ${trackingData?.bom?.nama_prd || trackingData?.productionOrder?.nama_prd}` : 'Cari nomor BOM atau nama produk...'}
                           </span>
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${open ? 'rotate-180 text-green-500' : ''}`} />
                     </div>

                     {open && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-4 ring-black/5">
                           <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                              <div className="relative">
                                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                 <input autoFocus type="text" placeholder="Ketik nomor BOM atau nama produk..." className="w-full pl-11 pr-4 h-11 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 bg-white font-bold" value={q} onChange={(e) => setQ(e.target.value)} />
                                 {loadingSuggestions && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 size={16} className="animate-spin text-green-500" /></div>}
                              </div>
                           </div>
                           <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2" onScroll={handleListScroll}>
                              {suggestions.length > 0 ? suggestions.map((s: any, idx: number) => (
                                 <button key={`${s.faktur}-${idx}`} onClick={() => handleSelect(s)} className={`w-full px-4 py-3 text-left rounded-xl transition-all flex items-center justify-between group/item mb-1 last:mb-0 ${trackingData?.id === s.faktur ? 'bg-green-50 text-green-700 font-black' : 'hover:bg-green-600 hover:text-white group/item'}`}>
                                    <div className="flex flex-col min-w-0">
                                       <span className={`text-[11px] font-black truncate ${trackingData?.id === s.faktur ? 'text-green-700' : 'text-gray-800 group-hover/item:text-white'}`}>{s.faktur}</span>
                                       <span className={`text-[11px] font-bold truncate ${trackingData?.id === s.faktur ? 'text-green-600/70' : 'text-gray-400 group-hover/item:text-white/85'}`}>{s.nama_prd}</span>
                                    </div>
                                    <ArrowRight size={14} className="shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity translate-x-1" />
                                 </button>
                              )) : <div className="p-10 text-center flex flex-col items-center gap-3"><p className="text-sm font-black text-gray-400">Tidak Ada Hasil</p></div>}
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {error && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm flex items-start gap-3 animate-in fade-in shrink-0">
               <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
               <p className="font-semibold">{error}</p>
            </div>
         )}

         <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
            <div className="flex flex-col gap-4 shrink-0 px-1">
               <div className="flex items-center justify-between gap-4 min-h-[32px]">
                  <h3 className="text-[14px] font-extrabold text-gray-800 flex items-center gap-3.5 leading-snug">
                     <Clock size={18} className="text-green-600" />
                     <span>Hasil Pelacakan</span>
                  </h3>
               </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
               <DataTable
                  columns={columns} data={trackingData ? [trackingData] : []}
                  isLoading={loadingData} columnWidths={columnWidths} onColumnWidthChange={setColumnWidths}
                  rowHeight="h-auto" className="flex-1" onRowClick={() => { }}
                  hideSorting={true} disableHover={true} rowCursor="cursor-grab"
               />
               <div className="flex items-center justify-between shrink-0 px-1 mt-1">
                  <span className="text-[12px] leading-snug font-bold text-gray-400">
                     {trackingData ? 'Data Pelacakan: 1 Siklus Manufaktur Ditemukan' : 'Silakan pilih BOM di atas untuk melihat pelacakan'}
                  </span>
                  {loadTime !== null && trackingData && (
                     <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-2.5 shadow-sm border ${loadTime < 300 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        <span className="animate-pulse">⚡</span>
                        <span className="leading-snug">{(loadTime / 1000).toFixed(2)}s</span>
                     </span>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
