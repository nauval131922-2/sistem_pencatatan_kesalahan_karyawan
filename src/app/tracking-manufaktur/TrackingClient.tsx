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
       spphOut: any[];
       sphIn: any[];
       purchaseOrders: any[];
       salesOrder?: any;
       productionOrder?: any;
       purchaseRequests: any[];
       delivery: any[];
       penerimaanPembelian: any[];
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
               bom: 500,
               sph: 500,
               spph: 500,
               sph_in: 500,
               purchase_orders: 500,
               so: 500,
               production: 500,
               pr: 500,
               penerimaan_pembelian: 500
            };
         }
         return {
            bom: 500,
            sph: 500,
            spph: 500,
            sph_in: 500,
            purchase_orders: 500,
            so: 500,
            production: 500,
            pr: 500,
            penerimaan_pembelian: 500
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
                 let displayVal = String(val);
                 const isRawField = key.toLowerCase() === 'id' || key.toLowerCase() === 'kode_cabang' || key.toLowerCase() === 'kd_cabang' || key.toLowerCase() === 'tgl' || key.toLowerCase() === 'status' || key.toLowerCase() === 'created_at' || key.toLowerCase() === 'edited_at' || key.toLowerCase() === 'kd_barang' || key.toLowerCase() === 'recid' || key.toLowerCase() === 'top_hari' || key.toLowerCase() === 'kd_gudang' || key.toLowerCase() === 'create_at' || key.toLowerCase() === 'updated_at' || key.toLowerCase() === 'kd_pelanggan' || key.toLowerCase() === 'datetime_mulai' || key.toLowerCase() === 'datetime_selesai' || key.toLowerCase() === 'qty_order' || key.toLowerCase() === 'qty_so' || key.toLowerCase() === 'tgl_dibutuhkan' || key.toLowerCase() === 'tgl_close' || key.toLowerCase() === 'status_close' || key.toLowerCase() === 'jthtmp' || key.toLowerCase() === 'faktur_supplier' || key.toLowerCase() === 'tgl_lunas';
                 if (!isRawField) {
                    const numVal = parseFloat(String(val).replace(/,/g, ''));
                    if (!isNaN(numVal)) {
                        displayVal = numVal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    }
                 }

                 return (
                   <div key={key} className="flex items-start justify-between gap-4 text-[12px] leading-tight">
                      <span className="text-gray-400 font-bold shrink-0">{key}</span>
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
                   <div className="text-[10px] font-bold text-gray-400 mb-1">1 Data Bill of Material</div>
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
                   <div className="text-[10px] font-bold text-gray-400 mb-1">1 Data SPH Out</div>
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
                   <div className="text-[10px] font-bold text-gray-400 mb-1">1 Data Sales Order</div>
                   <div className={`${cardClass} border border-slate-100`}>
                      <RenderAllFields data={data} excludeKeys={['raw_data']} />
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
                   <div className="text-[10px] font-bold text-gray-400 mb-1">1 Data Order Produksi</div>
                   <div className={`${cardClass} border border-slate-100`}>
                      <RenderAllFields data={data} excludeKeys={['raw_data']} />
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
                   <div className="text-[10px] font-bold text-gray-400 mb-1">{items.length} Data Purchase Request</div>
                   {items.map((pr: any, idx: number) => (
                      <div key={idx} className={`${cardClass} border border-slate-100`}>
                         <RenderAllFields data={pr} excludeKeys={['raw_data']} />
                      </div>
                   ))}
                </div>
              );
           }
        },
      {
         id: 'spph',
         header: 'SPPH Out',
         accessorKey: 'spphOut',
         size: columnWidths.spph,
         meta: { wrap: true, valign: 'top' },
         cell: ({ row }) => {
            const items = row.original.spphOut;
            if (!items || items.length === 0) return <div className={emptyStateClass}>Tidak Ada Data SPPH Out</div>;
            return (
               <div className="flex flex-col gap-2.5 pt-1.5 pb-3.5 w-full max-w-full overflow-hidden px-1">
                  <div className="text-[10px] font-bold text-gray-400 mb-1">{items.length} Data SPPH Out</div>
                  {items.map((spph: any, idx: number) => (
                     <div key={idx} className={`${cardClass} border border-slate-100`}>
                        <RenderAllFields data={spph} excludeKeys={['raw_data']} />
                     </div>
                  ))}
               </div>
             );
          }
       },
      {
         id: 'sph_in',
         header: 'SPH In',
         accessorKey: 'sphIn',
         size: columnWidths.sph_in,
         meta: { wrap: true, valign: 'top' },
         cell: ({ row }) => {
            const items = row.original.sphIn;
            if (!items || items.length === 0) return <div className={emptyStateClass}>Tidak Ada Data SPH In</div>;
            return (
               <div className="flex flex-col gap-2.5 pt-1.5 pb-3.5 w-full max-w-full overflow-hidden px-1">
                  <div className="text-[10px] font-bold text-gray-400 mb-1">{items.length} Data SPH In</div>
                  {items.map((sph: any, idx: number) => (
                     <div key={idx} className={`${cardClass} border border-slate-100`}>
                        <RenderAllFields data={sph} excludeKeys={['raw_data']} />
                     </div>
                  ))}
               </div>
             );
          }
       },
      {
         id: 'purchase_orders',
         header: 'Purchase Order',
         accessorKey: 'purchaseOrders',
         size: columnWidths.purchase_orders,
         meta: { wrap: true, valign: 'top' },
         cell: ({ row }) => {
            const items = row.original.purchaseOrders;
            if (!items || items.length === 0) return <div className={emptyStateClass}>Tidak Ada Data Purchase Order</div>;
            return (
               <div className="flex flex-col gap-2.5 pt-1.5 pb-3.5 w-full max-w-full overflow-hidden px-1">
                  <div className="text-[10px] font-bold text-gray-400 mb-1">{items.length} Data Purchase Order</div>
                  {items.map((po: any, idx: number) => (
                     <div key={idx} className={`${cardClass} border border-slate-100`}>
                        <RenderAllFields data={po} excludeKeys={['raw_data']} />
                     </div>
                  ))}
               </div>
            );
         }
       },
      {
         id: 'penerimaan_pembelian',
         header: 'Penerimaan Pembelian',
         accessorKey: 'penerimaanPembelian',
         size: columnWidths.penerimaan_pembelian,
         meta: { wrap: true, valign: 'top' },
         cell: ({ row }) => {
            const items = row.original.penerimaanPembelian;
            if (!items || items.length === 0) return <div className={emptyStateClass}>Tidak Ada Data Penerimaan Pembelian</div>;
            return (
               <div className="flex flex-col gap-2.5 pt-1.5 pb-3.5 w-full max-w-full overflow-hidden px-1">
                  <div className="text-[10px] font-bold text-gray-400 mb-1">{items.length} Data Penerimaan Pembelian</div>
                  {items.map((pb: any, idx: number) => (
                     <div key={idx} className={`${cardClass} border border-slate-100`}>
                        <RenderAllFields data={pb} excludeKeys={['raw_data']} />
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
                                       <span className={`text-[12px] font-black truncate ${trackingData?.id === s.faktur ? 'text-green-700' : 'text-gray-800 group-hover/item:text-white'}`}>{s.faktur}</span>
                                       <span className={`text-[12px] font-bold truncate ${trackingData?.id === s.faktur ? 'text-green-600/70' : 'text-gray-400 group-hover/item:text-white/85'}`}>{s.nama_prd}</span>
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
