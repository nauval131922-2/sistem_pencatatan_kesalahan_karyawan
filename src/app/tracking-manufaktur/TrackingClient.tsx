'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Loader2, Calculator, ArrowRight, AlertCircle, Clock, ChevronDown, RefreshCw } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, ScrollContext } from '@/components/ui/DataTable';
import { useContext } from 'react';

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

// Neobrutalist Classes
const chipClass = "px-2 py-0.5 rounded-none border-[2px] border-black text-[10px] font-black whitespace-nowrap bg-white shadow-[2px_2px_0_0_#000] uppercase tracking-tighter";
const cardClass = "bg-white rounded-none p-3.5 flex flex-col gap-2.5 w-full max-w-full text-left [content-visibility:auto] [contain-intrinsic-size:100px] border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all";
const infoCardClass = "bg-black/5 p-2.5 rounded-none border-[2px] border-black";
const infoLabelClass = "text-[9px] text-black/40 font-black tracking-widest uppercase";
const refLabelClass = "text-black/30 font-black min-w-[60px] uppercase text-[10px]";
const refRowClass = "flex items-center gap-1.5 text-[11px] text-black font-bold";
const productTitleClass = "text-[12px] font-black text-black leading-tight mt-1 uppercase tracking-tighter";
const productMetaClass = "flex flex-wrap items-center gap-1.5 text-[10px] text-black/40 font-black tracking-widest mt-1 uppercase";
const customerTextClass = "text-[11px] font-black uppercase";
const locationBadgeClass = "text-[10px] text-black px-2 py-0.5 bg-[#fde047] rounded-none border-[2px] border-black tracking-tighter font-black whitespace-nowrap shadow-[2px_2px_0_0_#000] uppercase";
const emptyStateClass = "px-1 text-[11px] font-black text-black/20 italic py-2 mt-0.5 uppercase tracking-widest";
const headerDateClass = "text-[10px] text-black/30 shrink-0 text-right font-black";
const auditSectionClass = "pt-2 mt-2 border-t-[2px] border-black/10 flex flex-col gap-0.5 text-[10px] text-black/30 italic font-black uppercase tracking-tighter";

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

// Helper to highlight search keywords in text
const HighlightedText = React.memo(({ text, highlight }: { text: string; highlight: string }) => {
   if (!highlight.trim()) return <span>{text}</span>;
   const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
   const parts = text.split(regex);

   return (
      <span>
         {parts.map((part, i) => 
            regex.test(part) ? (
               <mark key={i} className="bg-[#fde047] text-black px-0.5 font-black border-b-[2px] border-black">
                  {part}
               </mark>
            ) : (
               <span key={i}>{part}</span>
            )
         )}
      </span>
   );
});
HighlightedText.displayName = 'HighlightedText';

// Memoized individual field to reduce render work
const DataField = React.memo(({ k, v, isRaw, highlight }: { k: string, v: any, isRaw: boolean, highlight: string }) => {
   let displayVal = String(v);
   if (!isRaw) {
      const numVal = parseFloat(String(v).replace(/,/g, ''));
      if (!isNaN(numVal)) {
         displayVal = numVal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
   }

   return (
      <div className="flex items-start justify-between gap-4 text-[12px] leading-tight group/field">
         <span className="text-black/30 font-black shrink-0 uppercase text-[10px] tracking-widest">{k}</span>
         <span className="text-black font-bold text-right break-words group-hover/field:text-black transition-colors uppercase tracking-tighter">
            <HighlightedText text={displayVal} highlight={highlight} />
         </span>
      </div>
   );
});
DataField.displayName = 'DataField';

const RenderAllFieldsRaw = ({ data, excludeKeys = [], highlightText = '' }: { data: any, excludeKeys?: string[], highlightText?: string }) => {
   if (!data) return null;
   const normalizeKey = (key: string) => String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
   const handledKeys = useMemo(() => new Set([...excludeKeys].map(normalizeKey)), [excludeKeys]);
   const entries = useMemo(() => Object.entries(data).filter(([key]) => !handledKeys.has(normalizeKey(String(key)))), [data, handledKeys]);

   if (entries.length === 0) return null;

   const rawFields = ['id', 'kode_cabang', 'kd_cabang', 'tgl', 'status', 'created_at', 'edited_at', 'kd_barang', 'recid', 'top_hari', 'kd_gudang', 'create_at', 'updated_at', 'kd_pelanggan', 'datetime_mulai', 'datetime_selesai', 'tgl_dibutuhkan', 'tgl_close', 'status_close', 'jthtmp', 'faktur_supplier', 'tgl_lunas', 'kd_porsekot', 'kd_bank', 'kd_supir', 'kd_armada', 'kd_eks', 'waktu_kirim', 'waktu_selesai', 'tgl_expired', 'gol_barang', 'no_ref_pelanggan'];

   return (
      <div className="grid grid-cols-1 gap-2 overflow-hidden">
         {entries.map(([key, val]) => (
            <DataField key={key} k={key} v={val} isRaw={rawFields.includes(key.toLowerCase())} highlight={highlightText} />
         ))}
      </div>
   );
};

// Use memo to prevent unnecessary re-renders of data cards
const RenderAllFields = React.memo(RenderAllFieldsRaw);

// Optimized Card component with lazy rendering (Intersection Observer)
const DataCard = React.memo(({ item, highlightText }: { item: any, highlightText: string }) => {
   const [isVisible, setIsVisible] = useState(false);
   const cardRef = useRef<HTMLDivElement>(null);
   const scrollContainer = useContext(ScrollContext);

   useEffect(() => {
      if (!cardRef.current) return;

      const observer = new IntersectionObserver(
         ([entry]) => {
            if (entry.isIntersecting) {
               setIsVisible(true);
               observer.disconnect();
            }
         },
         { 
            rootMargin: '800px 0px', // Pre-render 800px before/after viewport for smooth scrolling
            threshold: 0.01 
         }
      );

      observer.observe(cardRef.current);
      return () => observer.disconnect();
   }, [scrollContainer]);

   return (
      <div 
         ref={cardRef} 
         className={cardClass}
      >
         {isVisible ? (
            <RenderAllFields data={item} excludeKeys={['raw_data']} highlightText={highlightText} />
         ) : (
            <div className="flex flex-col gap-2.5 animate-pulse">
               <div className="h-3 w-3/4 bg-black/5 rounded-none" />
               <div className="h-3 w-1/2 bg-black/5 rounded-none" />
               <div className="h-10 w-full bg-black/5 rounded-none" />
            </div>
         )}
      </div>
   );
});
DataCard.displayName = 'DataCard';

// Helper component for uniform column rendering
const RenderColumnContent = React.memo(({ label, data, items, debouncedFilterText, matchesFilter, extraLabel }: any) => {
   const filterLabel = debouncedFilterText ? `(HASIL CARI: "${debouncedFilterText}")` : extraLabel;

   if (items) {
      const filtered = useMemo(() => 
         debouncedFilterText ? items.filter((it: any) => matchesFilter(it, debouncedFilterText)) : items
      , [items, debouncedFilterText]);

      if (!filtered || filtered.length === 0) return (
         <div className="flex flex-col gap-3 pt-2 pb-4 w-full max-w-full overflow-hidden px-1">
            <div className="text-[10px] font-black text-black/30 mb-1 uppercase tracking-widest">0 DATA {label} {filterLabel && <span className="text-black/20">{filterLabel}</span>}</div>
         </div>
      );
      return (
         <div className="flex flex-col gap-4 pt-2 pb-5 w-full max-w-full overflow-hidden px-1">
            <div className="text-[10px] font-black text-black/30 mb-1 uppercase tracking-widest">{filtered.length} DATA {label} {filterLabel && <span className="text-black/20">{filterLabel}</span>}</div>
            {filtered.map((item: any, idx: number) => (
               <DataCard key={item.id || idx} item={item} highlightText={debouncedFilterText} />
            ))}
         </div>
      );
   }
   
   if (!data || (debouncedFilterText && !matchesFilter(data, debouncedFilterText))) return (
      <div className="flex flex-col gap-3 pt-2 pb-4 w-full max-w-full overflow-hidden px-1">
         <div className="text-[10px] font-black text-black/30 mb-1 uppercase tracking-widest">0 DATA {label} {filterLabel && <span className="text-black/20">{filterLabel}</span>}</div>
      </div>
   );
   return (
      <div className="flex flex-col gap-4 pt-2 pb-5 w-full max-w-full overflow-hidden px-1">
         <div className="text-[10px] font-black text-black/30 mb-1 uppercase tracking-widest">1 DATA {label} {filterLabel && <span className="text-black/20">{filterLabel}</span>}</div>
         <DataCard item={data} highlightText={debouncedFilterText} />
      </div>
   );
});
RenderColumnContent.displayName = 'RenderColumnContent';

export default function TrackingClient() {
   const [q, setQ] = useState('');
   const [suggestions, setSuggestions] = useState<any[]>([]);
   const [loadingSuggestions, setLoadingSuggestions] = useState(false);
   const [loadingData, setLoadingData] = useState(false);
   const [error, setError] = useState('');
   const [selectedFaktur, setSelectedFaktur] = useState<string | null>(null);
   const [selectedNama, setSelectedNama] = useState<string>('');
   const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
   const [trackingData, setTrackingData] = useState<{
         bom: any;
         sphOut: any;
         spphOut: any[];
         sphIn: any[];
         purchaseOrders: any[];
         salesOrder?: any;
         productionOrder?: any;
         purchaseRequests: any[];
         pengiriman: any[];
         pelunasanPiutang: any[];
         penerimaanPembelian: any[];
         pembelianBarang: any[];
         pelunasanHutang: any[];
         bahanBaku: any[];
         barangJadi: any[];
         laporanPenjualan: any[];
         id?: string;
      } | null>(null);
   const [suggestionPage, setSuggestionPage] = useState(1);
   const [hasMoreSuggestions, setHasMoreSuggestions] = useState(true);
   const [loadTime, setLoadTime] = useState<number | null>(null);

   const [filterText, setFilterText] = useState('');
   const [debouncedFilterText, setDebouncedFilterText] = useState(''); // We use this for the actual table filtering

   const handleSearchTrigger = () => {
      setDebouncedFilterText(filterText);
   };

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
                penerimaan_pembelian: 500,
                pembelian_barang: 500,
                pelunasan_hutang: 500,
                bahan_baku: 500,
                barang_jadi: 500,
                laporan_penjualan: 500,
                pengiriman: 500,
                pelunasan_piutang: 500
             };
          }
          return {
             bom: 500, sph: 500, spph: 500, sph_in: 500, purchase_orders: 500, so: 500, production: 500, pr: 500,
             penerimaan_pembelian: 500, pembelian_barang: 500, pelunasan_hutang: 500, bahan_baku: 500,
             barang_jadi: 500, laporan_penjualan: 500, pengiriman: 500, pelunasan_piutang: 500
          };
     });

   useEffect(() => {
      localStorage.setItem('tracking_columnWidths', JSON.stringify(columnWidths));
   }, [columnWidths]);

   // Helper for deep filtering data for cards
   const matchesFilter = React.useCallback((data: any, text: string) => {
      if (!text) return true;
      const lowerText = text.toLowerCase();
      return Object.values(data || {}).some(val => 
         String(val).toLowerCase().includes(lowerText)
      );
   }, []);

   // Table Columns Definition
   const columns = useMemo<ColumnDef<any>[]>(() => [
       {
          id: 'bom', header: 'Bill of Material Produksi', accessorKey: 'bom', size: columnWidths.bom,
          meta: { wrap: true, valign: 'top' },
          cell: ({ row }: any) => <RenderColumnContent label="Bill of Material Produksi" data={row.original.bom} debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
           id: 'sph', header: 'SPH Keluar', accessorKey: 'sphOut', size: columnWidths.sph,
           meta: { wrap: true, valign: 'top' },
           cell: ({ row }: any) => <RenderColumnContent label="SPH Keluar" data={row.original.sphOut} extraLabel="(VIA BOM.FAKTUR = SPH KELUAR.FAKTUR_BOM)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
           id: 'so', header: 'Sales Order Barang', accessorKey: 'salesOrder', size: columnWidths.so,
           meta: { wrap: true, valign: 'top' },
           cell: ({ row }: any) => <RenderColumnContent label="Sales Order Barang" data={row.original.salesOrder} extraLabel="(VIA SPH KELUAR.FAKTUR = SO.FAKTUR_SPH)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
           id: 'production', header: 'Order Produksi', accessorKey: 'productionOrder', size: columnWidths.production,
           meta: { wrap: true, valign: 'top' },
           cell: ({ row }: any) => <RenderColumnContent label="Order Produksi" data={row.original.productionOrder} extraLabel="(VIA SO.FAKTUR = PRD.FAKTUR_SO)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
         id: 'pr', header: 'Purchase Request (PR)', accessorKey: 'purchaseRequests', size: columnWidths.pr,
         meta: { wrap: true, valign: 'top' },
         cell: ({ row }: any) => <RenderColumnContent label="Purchase Request (PR)" items={row.original.purchaseRequests} extraLabel="(VIA PRD.FAKTUR = PR.FAKTUR_PRD)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
            id: 'spph', header: 'SPPH Keluar', accessorKey: 'spphOut', size: columnWidths.spph,
           meta: { wrap: true, valign: 'top' },
            cell: ({ row }: any) => <RenderColumnContent label="SPPH Keluar" items={row.original.spphOut} extraLabel="(VIA PR.FAKTUR = SPPH.FAKTUR_PR)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
           id: 'sph_in', header: 'SPH Masuk', accessorKey: 'sphIn', size: columnWidths.sph_in,
           meta: { wrap: true, valign: 'top' },
           cell: ({ row }: any) => <RenderColumnContent label="SPH Masuk" items={row.original.sphIn} extraLabel="(VIA SPPH.FAKTUR = SPH IN.FAKTUR_SPPH)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
           id: 'purchase_orders', header: 'Purchase Order (PO)', accessorKey: 'purchaseOrders', size: columnWidths.purchase_orders,
           meta: { wrap: true, valign: 'top' },
           cell: ({ row }: any) => <RenderColumnContent label="Purchase Order (PO)" items={row.original.purchaseOrders} extraLabel="(VIA SPH IN.FAKTUR = PO.FAKTUR_SPH)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
       {
          id: 'penerimaan_pembelian', header: 'Penerimaan Barang', accessorKey: 'penerimaanPembelian', size: columnWidths.penerimaan_pembelian,
          meta: { wrap: true, valign: 'top' },
          cell: ({ row }: any) => <RenderColumnContent label="Penerimaan Barang" items={row.original.penerimaanPembelian} extraLabel="(VIA PO.FAKTUR = PB.FAKTUR_PO)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
           id: 'pembelian_barang', header: 'Rekap Pembelian Barang', accessorKey: 'pembelianBarang', size: columnWidths.pembelian_barang,
           meta: { wrap: true, valign: 'top' },
           cell: ({ row }: any) => <RenderColumnContent label="Rekap Pembelian Barang" items={row.original.pembelianBarang} extraLabel="(VIA PB.FAKTUR = BELI.FAKTUR_PB)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
           id: 'pelunasan_hutang', header: 'Pelunasan Hutang', accessorKey: 'pelunasanHutang', size: columnWidths.pelunasan_hutang,
           meta: { wrap: true, valign: 'top' },
           cell: ({ row }: any) => <RenderColumnContent label="Pelunasan Hutang" items={row.original.pelunasanHutang} extraLabel="(VIA BELI.FAKTUR = HUTANG.FAKTUR_PB)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
           id: 'bahan_baku', header: 'BBB Produksi', accessorKey: 'bahanBaku', size: columnWidths.bahan_baku,
           meta: { wrap: true, valign: 'top' },
           cell: ({ row }: any) => <RenderColumnContent label="BBB Produksi" items={row.original.bahanBaku} extraLabel="(VIA PRD.FAKTUR = BBB.FAKTUR_PRD)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
           id: 'barang_jadi', header: 'Barang Hasil Produksi', accessorKey: 'barangJadi', size: columnWidths.barang_jadi,
           meta: { wrap: true, valign: 'top' },
           cell: ({ row }: any) => <RenderColumnContent label="Barang Hasil Produksi" items={row.original.barangJadi} extraLabel="(VIA PRD.FAKTUR = JADI.FAKTUR_PRD)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
           id: 'laporan_penjualan', header: 'Laporan Penjualan', accessorKey: 'laporanPenjualan', size: columnWidths.laporan_penjualan,
           meta: { wrap: true, valign: 'top' },
           cell: ({ row }: any) => <RenderColumnContent label="Laporan Penjualan" items={row.original.laporanPenjualan} extraLabel="(VIA SO.FAKTUR = JUAL.FAKTUR_SO)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
           id: 'pengiriman', header: 'Pengiriman', accessorKey: 'pengiriman', size: columnWidths.pengiriman,
           meta: { wrap: true, valign: 'top' },
           cell: ({ row }: any) => <RenderColumnContent label="Pengiriman" items={row.original.pengiriman} extraLabel="(VIA JUAL.FAKTUR = KIRIM.FAKTUR)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        },
        {
           id: 'pelunasan_piutang', header: 'Pelunasan Piutang', accessorKey: 'pelunasanPiutang', size: columnWidths.pelunasan_piutang,
           meta: { wrap: true, valign: 'top' },
           cell: ({ row }: any) => <RenderColumnContent label="Pelunasan Piutang" items={row.original.pelunasanPiutang} extraLabel="(VIA JUAL.FAKTUR = PIUTANG.FKT)" debouncedFilterText={debouncedFilterText} matchesFilter={matchesFilter} />
        }
    ], [columnWidths, debouncedFilterText, matchesFilter]);

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

   const fetchTrackingData = async (faktur: string) => {
      setLoadingData(true);
      setTrackingData(null);
      setError('');
      const start = Date.now();
      try {
         const res = await fetch(`/api/tracking?target_faktur=${encodeURIComponent(faktur)}`);
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

   const handleSelect = async (selected: any) => {
      setOpen(false);
      setQ('');
      setSelectedFaktur(selected.faktur);
      setSelectedNama(selected.nama_prd || '');
      // Persist to localStorage so it survives refresh
      localStorage.setItem('tracking_selected_faktur', selected.faktur);
      localStorage.setItem('tracking_selected_nama', selected.nama_prd || '');
      await fetchTrackingData(selected.faktur);
   };

   // Hydrate selected BOM from localStorage on mount
   useEffect(() => {
      const savedFaktur = localStorage.getItem('tracking_selected_faktur');
      const savedNama = localStorage.getItem('tracking_selected_nama');
      if (savedFaktur) {
         setSelectedFaktur(savedFaktur);
         setSelectedNama(savedNama || '');
         fetchTrackingData(savedFaktur);
      }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   // Auto-refresh when sync happens from another tab
   useEffect(() => {
      const handleStorageChange = (e: StorageEvent) => {
         if (e.key === 'sintak_data_updated' && selectedFaktur) {
            setIsAutoRefreshing(true);
            fetchTrackingData(selectedFaktur).finally(() => {
               setTimeout(() => setIsAutoRefreshing(false), 3000);
            });
         }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [selectedFaktur]);

   const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight + 50 && !loadingSuggestions && hasMoreSuggestions) {
         setSuggestionPage(prev => prev + 1);
      }
   };

   return (
      <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-700 overflow-hidden">
         {/* BOM SELECTOR SECTION */}
         <div className="bg-white border-[3px] border-black p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-5 shrink-0 relative z-50">
            <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
               <div className="flex-1">
                  <div className="flex flex-col gap-1.5">
                     <span className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-1">Pilih BOM (Bill of Material) Utama</span>
                  </div>
                  <div className="relative mt-2" ref={suggestionRef}>
                     <div
                        className={`w-full bg-white border-[3px] border-black rounded-none px-4 h-14 text-sm flex items-center justify-between transition-all text-black cursor-pointer shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] ${open ? 'bg-[#fde047]' : ''}`}
                        onClick={() => { setOpen(!open); setQ(''); }}
                     >
                        <div className="flex items-center gap-4 truncate">
                           {loadingData ? (
                              <RefreshCw size={20} className="animate-spin text-black" strokeWidth={3} />
                           ) : (
                              <Calculator size={20} className="text-black" strokeWidth={3} />
                           )}
                           <div className="flex flex-col truncate leading-tight">
                              <span className="text-black/40 font-black text-[9px] uppercase tracking-widest">Target Pelacakan:</span>
                              <span className="text-black truncate font-black text-[13px] uppercase tracking-tighter">
                                 {loadingData 
                                    ? (selectedFaktur ? `[${selectedFaktur}] SINKRONISASI DATA...` : 'MENELUSURI JALUR...')
                                    : trackingData 
                                      ? `[${trackingData?.bom?.faktur || trackingData?.productionOrder?.faktur}] ${trackingData?.bom?.nama_prd || trackingData?.productionOrder?.nama_prd}` 
                                      : 'PILIH NOMOR BOM ATAU NAMA PRODUK...'}
                              </span>
                           </div>
                        </div>
                        <ChevronDown size={20} strokeWidth={4} className={`text-black transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                     </div>

                     {open && (
                        <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white border-[4px] border-black shadow-[3.5px_3.5px_0_0_#000] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                           <div className="p-4 border-b-[4px] border-black bg-[#fde047]">
                              <div className="relative">
                                 <Search size={18} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
                                 <input 
                                    autoFocus 
                                    type="text" 
                                    placeholder="CARI NOMOR BOM ATAU NAMA PRODUK..." 
                                    className="w-full pl-12 pr-4 h-12 text-[13px] border-[3px] border-black rounded-none focus:outline-none focus:bg-white bg-white/50 font-black uppercase tracking-tighter placeholder:text-black/20" 
                                    value={q} 
                                    onChange={(e) => setQ(e.target.value)} 
                                 />
                                 {loadingSuggestions && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 size={18} className="animate-spin text-black" strokeWidth={3} /></div>}
                              </div>
                           </div>
                           <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2" onScroll={handleListScroll}>
                              {suggestions.length > 0 ? suggestions.map((s: any, idx: number) => (
                                 <button 
                                    key={`${s.faktur}-${idx}`} 
                                    onClick={() => handleSelect(s)} 
                                    className={`w-full px-4 py-3 text-left rounded-none transition-all flex items-center justify-between group/item mb-1 last:mb-0 border-[2px] border-transparent hover:border-black hover:bg-[#fde047] ${trackingData?.id === s.faktur ? 'bg-black text-[#fde047]' : 'text-black'}`}
                                 >
                                    <div className="flex flex-col min-w-0">
                                       <span className="text-[12px] font-black truncate uppercase tracking-tighter">{s.faktur}</span>
                                       <span className={`text-[11px] font-bold truncate uppercase tracking-tight ${trackingData?.id === s.faktur ? 'text-[#fde047]/60' : 'text-black/40'}`}>{s.nama_prd}</span>
                                    </div>
                                    <ArrowRight size={18} strokeWidth={4} className="shrink-0 opacity-0 group-hover/item:opacity-100 transition-all translate-x-2" />
                                 </button>
                              )) : (
                                 <div className="p-12 text-center flex flex-col items-center gap-3">
                                    <p className="text-[12px] font-black text-black/20 uppercase tracking-widest">Data Tidak Ditemukan</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {error && (
            <div className="p-4 bg-[#ff5e5e] text-white border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] text-sm flex items-start gap-4 animate-in fade-in shrink-0">
               <AlertCircle size={20} strokeWidth={3} className="shrink-0 mt-0.5" />
               <p className="font-black uppercase tracking-tight leading-tight">{error}</p>
            </div>
         )}

         {/* RESULTS SECTION */}
         <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
            <div className="flex flex-col gap-4 shrink-0">
               <div className="flex items-center justify-between gap-4 min-h-[32px]">
                  <h3 className="text-[14px] font-black text-black flex items-center gap-3 leading-none uppercase tracking-widest">
                     <Clock size={20} className="text-black" strokeWidth={3} />
                     <span>Visualisasi Alur Manufaktur</span>
                  </h3>
                  {isAutoRefreshing && (
                     <div className="flex items-center gap-2 text-[10px] font-black text-black animate-pulse bg-[#fde047] px-3 py-1.5 border-[2px] border-black shadow-[2px_2px_0_0_#000] uppercase tracking-tighter leading-none">
                       <Loader2 size={12} className="animate-spin" strokeWidth={3} />
                       <span>Sinkronisasi Otomatis...</span>
                     </div>
                  )}
               </div>
               <div className="relative w-full group">
                  <Search size={18} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black transition-colors" />
                  <input 
                     type="text" 
                     placeholder="CARI DALAM HASIL PELACAKAN (FAKTUR, BARANG, PELANGGAN, DLL)..." 
                     className="w-full pl-12 pr-4 h-12 bg-white border-[3px] border-black rounded-none focus:outline-none shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[2.5px_2.5px_0_0_#000] transition-all text-[13px] font-black placeholder:text-black/20 uppercase tracking-tighter" 
                     value={filterText} 
                     onChange={(e) => setFilterText(e.target.value)} 
                     onBlur={handleSearchTrigger}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearchTrigger();
                     }}
                  />
               </div>
            </div>
            
            <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
               {useMemo(() => (
                  <DataTable
                     columns={columns} data={trackingData ? [trackingData] : []}
                     isLoading={loadingData} columnWidths={columnWidths} onColumnWidthChange={setColumnWidths}
                     rowHeight="h-auto" className="flex-1" onRowClick={() => { }}
                     hideSorting={true} disableHover={true} rowCursor="cursor-grab"
                  />
               ), [columns, trackingData, loadingData, columnWidths])}
               
               {/* FOOTER INFO BANNER */}
               <div className="flex items-center justify-between shrink-0 px-1 mt-1">
                  <span className="text-[12px] leading-none font-black text-black/30 uppercase tracking-tighter">
                     {loadingData ? (
                        <span className="flex items-center gap-2">
                           <Loader2 size={14} className="animate-spin text-black" strokeWidth={3} />
                           SEDANG MENELUSURI ALUR PRODUKSI...
                        </span>
                     ) : trackingData ? 'STATUS: 1 SIKLUS PRODUKSI BERHASIL DILACAK' : 'INFO: SILAKAN PILIH NOMOR BOM UNTUK MEMULAI PELACAKAN'}
                  </span>
                  {loadTime !== null && trackingData && (
                     <div className="flex items-center gap-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-none font-black flex items-center gap-1.5 shadow-[2px_2px_0_0_#000] border-[2px] border-black uppercase tracking-tight ${loadTime < 300 ? 'bg-[#93c5fd] text-black' : loadTime < 1000 ? 'bg-[#fde047] text-black' : 'bg-[#ff5e5e] text-white'}`}>
                           <span className="animate-pulse">⚡</span>
                           <span>{(loadTime / 1000).toFixed(2)}S</span>
                        </span>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
