'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
   Package, Calculator, Search, ChevronDown, RefreshCw, AlertCircle, 
   Clock, ArrowRight, Loader2, ChevronLeft, ChevronRight, X, Truck, ShoppingCart
} from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import SearchAndReload from '@/components/SearchAndReload';


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

// Helper to parse DD-MM-YYYY or DD/MM/YYYY to Date object
const parseIndoDate = (tglStr: string) => {
   if (!tglStr || typeof tglStr !== 'string') return null;
   // Clean up string and handle different separators
   const cleanStr = tglStr.trim().replace(/\//g, '-');
   const parts = cleanStr.split('-');
   if (parts.length !== 3) return null;
   
   let day, month, year;
   
   // Detect format: YYYY-MM-DD or DD-MM-YYYY
   if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1;
      day = parseInt(parts[2]);
   } else {
      // DD-MM-YYYY
      day = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1;
      year = parseInt(parts[2]);
   }
   
   if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
   
   const d = new Date(year, month, day);
   if (isNaN(d.getTime())) return null;
   d.setHours(0, 0, 0, 0);
   return d;
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

// Premium Light Theme Classes
const chipClass = "px-2.5 py-1 rounded-lg border border-gray-100 text-[10px] font-bold whitespace-nowrap bg-gray-50 text-gray-500";
const cardClass = "bg-white rounded-xl p-4 flex flex-col gap-2.5 w-full max-w-full text-left [content-visibility:auto] [contain-intrinsic-size:100px] border border-gray-50 shadow-sm hover:shadow-sm hover:shadow-green-900/5 hover:border-green-100 transition-all duration-300";
const infoCardClass = "bg-gray-50/50 p-3 rounded-lg border border-gray-100";
const infoLabelClass = "text-[9px] text-gray-400 font-bold tracking-widest";
const refLabelClass = "text-gray-300 font-bold min-w-[60px]text-[10px] tracking-widest";
const refRowClass = "flex items-center gap-1.5 text-[11px] text-gray-700 font-bold";
const productTitleClass = "text-[12px] font-bold text-gray-800 leading-tight mt-1";
const productMetaClass = "flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400 font-bold tracking-widest mt-1";
const customerTextClass = "text-[11px] font-boldtext-gray-600";
const locationBadgeClass = "text-[10px] text-green-700 px-2.5 py-1 bg-green-50 rounded-lg border border-green-100 tracking-wider font-bold whitespace-nowrap";
const emptyStateClass = "px-1 text-[11px] font-bold text-gray-300 italic py-2 mt-0.5";
const headerDateClass = "text-[10px] text-gray-300 shrink-0 text-right font-bold tracking-widest";
const auditSectionClass = "pt-2 mt-2 border-t border-gray-50 flex flex-col gap-0.5 text-[10px] text-gray-300 italic font-bold";

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
               <mark key={i} className="bg-green-100 text-green-800 px-0.5 font-bold rounded-sm">
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
const DataField = React.memo(({ v, isRaw, highlight }: { v: any, isRaw: boolean, highlight: string }) => {
   // Strip HTML tags if value is a string
   let displayVal = typeof v === 'string' ? v.replace(/<[^>]*>?/gm, '').trim() : String(v);

   if (!isRaw) {
      const numVal = parseFloat(displayVal.replace(/,/g, ''));
      if (!isNaN(numVal) && displayVal.includes('.') && displayVal.length > 5) {
         displayVal = numVal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
   }

   return <HighlightedText text={displayVal} highlight={highlight} />;
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
      <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1.5 overflow-hidden">
         {entries.map(([key, val]) => (
            <div key={key} className="flex gap-4 items-start text-[11px] group/field">
               <div className="w-[120px] shrink-0 font-medium text-gray-400">
                  {toTitleCase(key)}
               </div>
               <div className="flex-1 text-gray-800 font-bold break-words group-hover/field:text-green-600 transition-colors">
                  <DataField v={val} isRaw={rawFields.includes(key.toLowerCase())} highlight={highlightText} />
               </div>
            </div>
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
   }, []);

   return (
      <div 
         ref={cardRef} 
         className={cardClass}
      >
         {isVisible ? (
            <RenderAllFields 
               data={item} 
               excludeKeys={[
                  'raw_data', 'id', 'kd_gudang', 'kd_cabang', 'status', 'status_close', 
                  'mydata', 'create_at', 'created_at', 'updated_at', 'edited_at', 
                  'username', 'username_edited', 'deleted_at', 'username_deleted', 
                  'pr_edited_at', 'sph_edited_at', 'cmd', 'detil', 'redid', 'recid'
               ]} 
               highlightText={highlightText} 
            />
         ) : (
            <div className="flex flex-col gap-2.5 animate-pulse">
               <div className="h-3 w-3/4 bg-gray-50 rounded-lg" />
               <div className="h-3 w-1/2 bg-gray-50 rounded-lg" />
               <div className="h-10 w-full bg-gray-50 rounded-lg" />
            </div>
         )}
      </div>
   );
});
DataCard.displayName = 'DataCard';

// Helper component for uniform column rendering
const RenderColumnContent = React.memo(({ label, data, items, debouncedFilterText, matchesFilter, extraLabel, subLabels = [], startDate, endDate, parseIndoDate }: any) => {
   const containerRef = useRef<HTMLDivElement>(null);

   // Unified date filtering for cards
   const filterByDate = (item: any) => {
      if (!item) return false;
      if (!startDate && !endDate) return true;
      
      // Check multiple common date keys (case-insensitive)
      const tglStr = item.tgl || item.tanggal || item.date || item.Tgl || item.Tanggal || item.Date;
      if (!tglStr) return false; // If filter is active and no date found, hide it

      const itemDate = parseIndoDate(tglStr);
      if (!itemDate) return true; // Keep if can't parse (prevent accidental hiding of valid but weird data)

      if (startDate) {
         const start = new Date(startDate);
         start.setHours(0, 0, 0, 0);
         if (itemDate < start) return false;
      }
      if (endDate) {
         const end = new Date(endDate);
         end.setHours(23, 59, 59, 999);
         if (itemDate > end) return false;
      }
      return true;
   };

   // Process items array
   const finalItems = useMemo(() => {
      let filtered = items || [];
      if (startDate || endDate) {
         filtered = filtered.filter(filterByDate);
      }
      if (debouncedFilterText) {
         filtered = filtered.filter((it: any) => matchesFilter(it, debouncedFilterText));
      }
      return filtered;
   }, [items, startDate, endDate, debouncedFilterText, matchesFilter, parseIndoDate]);

   // Process single data
   const finalData = useMemo(() => {
      if (!data) return null;
      if (!filterByDate(data)) return null;
      if (debouncedFilterText && !matchesFilter(data, debouncedFilterText)) return null;
      return data;
   }, [data, startDate, endDate, debouncedFilterText, matchesFilter, parseIndoDate]);

   const totalCount = finalItems.length || (finalData ? 1 : 0);
   const filterLabel = debouncedFilterText ? `(HASIL CARI: "${debouncedFilterText}")` : '';

   return (
      <div className="flex flex-col h-full min-h-0">
         { (totalCount === 0 || extraLabel || subLabels.length > 0) && (
            <div className="mt-2.5 mb-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg shadow-sm">
               <p className="text-[11px] text-green-900 leading-tight">
                  <span className="font-bold underline decoration-green-300 underline-offset-4">{totalCount} Data {label}</span>
               </p>
               {extraLabel && <p className="text-[10px] text-green-700 mt-1.5 font-medium italic">{extraLabel}</p>}
               {subLabels.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-green-100 flex flex-col gap-1">
                     {subLabels.map((sl: string, i: number) => {
                        const isSubItem = /^\d+\./.test(sl.trim());
                        return (
                           <div key={i} className={`flex items-start gap-1.5 text-[10px] text-gray-800 leading-tight ${isSubItem ? 'ml-4' : ''}`}>
                              {!isSubItem && <span className="text-green-600 font-bold shrink-0">•</span>}
                              <span className="font-medium">{sl}</span>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
         )}
         
         <div className="flex flex-col gap-2 pt-0 pb-5 w-full max-w-full overflow-hidden px-1">
            {totalCount === 0 ? (
               <div className="pt-2 pb-4 w-full"></div>
            ) : (
               <>
                  {finalItems.map((item: any, idx: number) => (
                     <DataCard key={`${item.id || item.faktur || idx}-${idx}`} item={item} highlightText={debouncedFilterText} />
                  ))}
                  {finalData && <DataCard item={finalData} highlightText={debouncedFilterText} />}
               </>
            )}
         </div>
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
         productionOrders?: any[];
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
   const [trackingPath, setTrackingPath] = useState<'bom' | 'rekap' | null>(null);

   // State for Rekap Pembelian filter
   const [qRekap, setQRekap] = useState('');
   const [rekapSuggestions, setRekapSuggestions] = useState<any[]>([]);
   const [loadingRekapSuggestions, setLoadingRekapSuggestions] = useState(false);
   const [rekapPage, setRekapPage] = useState(1);
   const [hasMoreRekapSuggestions, setHasMoreRekapSuggestions] = useState(true);
   const [openRekap, setOpenRekap] = useState(false);
   const rekapSuggestionRef = useRef<HTMLDivElement>(null);
   const [startDate, setStartDate] = useState<Date | null>(null);
   const [endDate, setEndDate] = useState<Date | null>(null);

   const [selectedFakturSupplier, setSelectedFakturSupplier] = useState<string | null>(null);
   // State for Supplier filter
   const [qSupplier, setQSupplier] = useState('');
   const [suppliers, setSuppliers] = useState<any[]>([]);
   const [loadingSuppliers, setLoadingSuppliers] = useState(false);
   const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
   const [openSupplier, setOpenSupplier] = useState(false);
   const supplierSuggestionRef = useRef<HTMLDivElement>(null);

   const [filterText, setFilterText] = useState('');
   const [debouncedFilterText, setDebouncedFilterText] = useState(''); // We use this for the actual table filtering

   useEffect(() => {
      const handler = setTimeout(() => setDebouncedFilterText(filterText), 300);
      return () => clearTimeout(handler);
   }, [filterText]);

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

   // Tab definitions — each tab maps to a slice of trackingData
   const tabs = useMemo(() => {
      if (!trackingData) return [];
      const isBomPath = trackingPath === 'bom';
      const allTabs = [
         { id: 'bom',                  label: 'Bill of Material',         badge: isBomPath ? '(titik awal)' : '',         getData: () => trackingData.bom ? [trackingData.bom] : [] },
         { id: 'sph',                  label: 'SPH Keluar',               badge: '',                                     getData: () => trackingData.sphOut ? [trackingData.sphOut] : [] },
         { id: 'so',                   label: 'Sales Order',              badge: '',                                     getData: () => trackingData.salesOrder ? [trackingData.salesOrder] : [] },
         { id: 'production',           label: 'Order Produksi',           badge: '',                                     getData: () => trackingData.productionOrders || [] },
         { id: 'pr',                   label: 'Purchase Request',         badge: '',                                     getData: () => trackingData.purchaseRequests || [] },
         { id: 'spph',                 label: 'SPPH Keluar',              badge: '',                                     getData: () => trackingData.spphOut || [] },
         { id: 'sph_in',              label: 'SPH Masuk',                badge: '',                                     getData: () => trackingData.sphIn || [] },
         { id: 'purchase_orders',     label: 'Purchase Order (PO)',      badge: '',                                     getData: () => trackingData.purchaseOrders || [] },
         { id: 'penerimaan',          label: 'Penerimaan Barang',        badge: '',                                     getData: () => trackingData.penerimaanPembelian || [] },
         { id: 'rekap_pembelian',     label: 'Rekap Pembelian',          badge: !isBomPath ? '(titik awal)' : '',       getData: () => trackingData.pembelianBarang || [] },
         { id: 'pelunasan_hutang',    label: 'Pelunasan Hutang',         badge: '',                                     getData: () => trackingData.pelunasanHutang || [] },
         { id: 'bahan_baku',          label: 'BBB Produksi',             badge: '',                                     getData: () => trackingData.bahanBaku || [] },
         { id: 'barang_jadi',         label: 'Barang Hasil Produksi',    badge: '',                                     getData: () => trackingData.barangJadi || [] },
         { id: 'laporan_penjualan',   label: 'Laporan Penjualan',        badge: '',                                     getData: () => trackingData.laporanPenjualan || [] },
         { id: 'pengiriman',          label: 'Pengiriman',               badge: '',                                     getData: () => trackingData.pengiriman || [] },
         { id: 'pelunasan_piutang',   label: 'Pelunasan Piutang',        badge: '',                                     getData: () => trackingData.pelunasanPiutang || [] },
      ];
      if (!isBomPath) {
         const hideIds = ['bom','sph','so','production','pr','spph','sph_in','penerimaan','pelunasan_hutang','laporan_penjualan','pengiriman','pelunasan_piutang'];
         return allTabs.filter(t => !hideIds.includes(t.id));
      }
      return allTabs;
   }, [trackingData, trackingPath]);

   // Currently active tab
   const [activeTab, setActiveTab] = useState<string>('');

   // Auto-select first tab when data loads
   useEffect(() => {
      if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
         setActiveTab(tabs[0].id);
      }
   }, [tabs]);

   // Helper to apply current filters (date and text) to a list of rows
   const filterRows = useCallback((rawRows: any[]) => {
      let rows = [...rawRows];
      
      // Apply date filter ONLY for "Jalur Barang" (rekap)
      if (trackingPath === 'rekap' && (startDate || endDate)) {
         rows = rows.filter((r: any) => {
            const tglStr = r.tgl || r.tanggal || r.date || r.Tgl || r.Tanggal || r.Date;
            if (!tglStr) return true; // Keep items without date field
            const itemDate = parseIndoDate(tglStr);
            if (!itemDate) return true;
            
            if (startDate) {
               const start = new Date(startDate);
               start.setHours(0, 0, 0, 0);
               if (itemDate < start) return false;
            }
            if (endDate) {
               const end = new Date(endDate);
               end.setHours(23, 59, 59, 999);
               if (itemDate > end) return false;
            }
            return true;
         });
      }

      // Apply text filter
      if (debouncedFilterText) {
         const lower = debouncedFilterText.toLowerCase();
         rows = rows.filter((r: any) =>
            Object.values(r || {}).some(v => String(v).toLowerCase().includes(lower))
         );
      }
      return rows;
   }, [trackingPath, startDate, endDate, debouncedFilterText]);

   // Get raw items for the active tab, applying text search filter
   const activeTabData = useMemo(() => {
      const tab = tabs.find(t => t.id === activeTab);
      if (!tab) return { rows: [], columns: [] as string[], totalQty: 0 };
      
      const rows = filterRows(tab.getData());
      
      // Calculate totalQty for specific tabs (ONLY for Jalur Barang / rekap)
      let totalQty = 0;
      if (trackingPath === 'rekap' && (activeTab === 'bahan_baku' || activeTab === 'barang_jadi')) {
         totalQty = rows.reduce((sum: number, r: any) => {
            const qtyStr = String(r.qty || 0).replace(/,/g, '');
            return sum + (parseFloat(qtyStr) || 0);
         }, 0);
      }

      // Derive column keys from union of all row keys, excluding noise
      const excludeKeys = new Set(['raw_data','mydata','cmd','detil','redid']);
      const colSet = new Set<string>();
      rows.forEach((r: any) => Object.keys(r || {}).forEach(k => { if (!excludeKeys.has(k)) colSet.add(k); }));
      
      return { rows, columns: Array.from(colSet), totalQty };
   }, [tabs, activeTab, trackingPath, filterRows]);

   // Pagination
   const PAGE_SIZE = 25;
   const [currentPage, setCurrentPage] = useState(1);

   // Reset to page 1 when tab or filter changes
   useEffect(() => { setCurrentPage(1); }, [activeTab, debouncedFilterText]);

   const totalPages = Math.max(1, Math.ceil(activeTabData.rows.length / PAGE_SIZE));
   const paginatedRows = activeTabData.rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);


   // Initial load for persistence and new day reset
   useEffect(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const savedStart = localStorage.getItem('tracking_startDate');
      if (savedStart) {
         const d = new Date(savedStart);
         if (!isNaN(d.getTime())) setStartDate(d);
      }
      
      const savedEnd = localStorage.getItem('tracking_endDate');
      const lastVisit = localStorage.getItem('tracking_lastVisitDate');
      const todayStr = today.toDateString();
      localStorage.setItem('tracking_lastVisitDate', todayStr);

      const isNewDay = lastVisit !== todayStr;
      if (savedEnd && !isNewDay) {
         const d = new Date(savedEnd);
         if (!isNaN(d.getTime())) setEndDate(d);
      } else {
         setEndDate(today);
         localStorage.setItem('tracking_endDate', today.toISOString());
      }

      const savedSupplier = localStorage.getItem('tracking_selectedSupplier');
      if (savedSupplier) {
         setSelectedSupplier(savedSupplier);
      }
   }, []);

   // Persist dates on change
   useEffect(() => {
      if (startDate) localStorage.setItem('tracking_startDate', startDate.toISOString());
      else localStorage.removeItem('tracking_startDate');
   }, [startDate]);

   useEffect(() => {
      if (endDate) localStorage.setItem('tracking_endDate', endDate.toISOString());
      else localStorage.removeItem('tracking_endDate');
   }, [endDate]);

   useEffect(() => {
      if (selectedSupplier) localStorage.setItem('tracking_selectedSupplier', selectedSupplier);
      else localStorage.removeItem('tracking_selectedSupplier');
   }, [selectedSupplier]);

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

   // Search logic for Rekap dropdown
   useEffect(() => {
      let active = true;
      const fetchRekapNames = async (query: string, pageNum: number) => {
         if (pageNum === 1) setLoadingRekapSuggestions(true);
         try {
            const fmtDate = (d: Date | null) => {
               if (!d) return '';
               const y = d.getFullYear();
               const m = String(d.getMonth() + 1).padStart(2, '0');
               const day = String(d.getDate()).padStart(2, '0');
               return `${y}-${m}-${day}`;
            };

            const params = new URLSearchParams({
               q: query,
               page: pageNum.toString(),
               pageSize: '20',
               supplier: selectedSupplier || ''
            });

            const res = await fetch(`/api/tracking/rekap-names?${params.toString()}`);
            const json = await res.json();
            if (json.success && active) {
               if (pageNum === 1) { setRekapSuggestions(json.data); }
               else { setRekapSuggestions(prev => [...prev, ...json.data]); }
               setHasMoreRekapSuggestions(json.data.length === 20);
            }
         } catch (e) { } finally {
            if (active && pageNum === 1) setLoadingRekapSuggestions(false);
         }
      };

      if (openRekap) {
         if (qRekap.trim().length === 0) { fetchRekapNames('', 1); }
         else if (qRekap.trim().length >= 2) {
            const handler = setTimeout(() => fetchRekapNames(qRekap, 1), 300);
            return () => { active = false; clearTimeout(handler); };
         }
      }
      return () => { active = false; };
   }, [qRekap, openRekap, selectedSupplier]);

   // Search logic for Supplier dropdown
   useEffect(() => {
      let active = true;
      const fetchSuppliers = async (query: string) => {
         setLoadingSuppliers(true);
         try {
            const res = await fetch(`/api/tracking/suppliers?q=${encodeURIComponent(query)}`);
            const json = await res.json();
            if (json.success && active) {
               setSuppliers(json.data);
            }
         } catch (e) { } finally {
            if (active) setLoadingSuppliers(false);
         }
      };

      if (openSupplier) {
         if (qSupplier.trim().length === 0) { fetchSuppliers(''); }
         else {
            const handler = setTimeout(() => fetchSuppliers(qSupplier), 300);
            return () => { active = false; clearTimeout(handler); };
         }
      }
      return () => { active = false; };
   }, [qSupplier, openSupplier]);

   // Click outside listener
   useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
         if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
            setOpen(false);
         }
         if (rekapSuggestionRef.current && !rekapSuggestionRef.current.contains(event.target as Node)) {
            setOpenRekap(false);
         }
         if (supplierSuggestionRef.current && !supplierSuggestionRef.current.contains(event.target as Node)) {
            setOpenSupplier(false);
         }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);



   // Memoized filtered data based on text and dates
   const filteredData = useMemo(() => {
      if (!trackingData) return [];
            // Handle single flow object (standard API response)
      let items: any[] = Array.isArray(trackingData) ? [...trackingData] : [trackingData];
      
      if (items.length === 0) return [];

      // Date Range Filtering - ONLY apply for Rekap (Barang) path
      // If trackingData is the flow object, check trackingData.bom
      // If it's the wrapped object, check trackingData.bom or type
       const isRekapPath = trackingPath === 'rekap';

      if (isRekapPath && (startDate || endDate)) {
         items = items.filter(row => {
            // Collect ALL possible dates from this sequence components
            const dateStrings: string[] = [
               row.rekap?.tgl,
               row.bom?.tgl,
               row.salesOrder?.tgl,
               ...(row.pembelianBarang || []).map((i: any) => i.tgl),
               ...(row.bahanBaku || []).map((i: any) => i.tgl),
               ...(row.barangJadi || []).map((i: any) => i.tgl),
               ...(row.productionOrders || []).map((i: any) => i.tgl),
               ...(row.penerimaanPembelian || []).map((i: any) => i.tgl),
               ...(row.purchaseOrders || []).map((i: any) => i.tgl),
               ...(row.purchaseRequests || []).map((i: any) => i.tgl),
               ...(row.spphOut || []).map((i: any) => i.tgl),
               ...(row.sphIn || []).map((i: any) => i.tgl),
               ...(row.laporanPenjualan || []).map((i: any) => i.tgl),
               ...(row.pengiriman || []).map((i: any) => i.tgl),
               ...(row.pelunasanPiutang || []).map((i: any) => i.tgl),
               ...(row.pelunasanHutang || []).map((i: any) => i.tgl),
            ].filter(Boolean);

            if (dateStrings.length === 0) return true;

            // Check if ANY date in this sequence matches the range
            return dateStrings.some(dStr => {
               const itemDate = parseIndoDate(dStr);
               if (!itemDate) return false;

               let matchesStart = true;
               if (startDate) {
                  const start = new Date(startDate);
                  start.setHours(0, 0, 0, 0);
                  matchesStart = itemDate >= start;
               }

               let matchesEnd = true;
               if (endDate) {
                  const end = new Date(endDate);
                  end.setHours(23, 59, 59, 999);
                  matchesEnd = itemDate <= end;
               }

               return matchesStart && matchesEnd;
            });
         });
      }

      return items;
   }, [trackingData, startDate, endDate]);

   const fetchTrackingData = async (faktur: string) => {
      setLoadingData(true);
      setTrackingData(null);
      setError('');
      const start = Date.now();
      try {
         const res = await fetch(`/api/tracking?target_faktur=${encodeURIComponent(faktur)}`);
         const json = await res.json();
         if (json.success) {
            setTrackingData({ ...json.data, id: json.data.productionOrders?.[0]?.faktur || json.data.bom?.faktur || 'N/A' });
            setLoadTime(Date.now() - start);
         } else {
            setError(json.error || 'Gagal memuat data tracking');
         }
      } catch (e: any) { setError(e.message || 'Terjadi kesalahan sistem'); }
      finally { setLoadingData(false); }
   };

   const handleSelect = async (selected: any) => {
      setSelectedFaktur(selected.faktur);
      setSelectedNama(selected.nama_prd);
      setTrackingData(null);
      setOpen(false);
      setSelectedSupplier(null);
      setTrackingPath('bom');
      // Persist to localStorage so it survives refresh
      localStorage.setItem('tracking_selected_faktur', selected.faktur);
      localStorage.setItem('tracking_selected_nama', selected.nama_prd || '');
      localStorage.setItem('tracking_selected_path', 'bom');
      await fetchTrackingData(selected.faktur);
   };

   // Hydrate selection from localStorage on mount
   useEffect(() => {
      const savedFaktur = localStorage.getItem('tracking_selected_faktur');
      const savedNama = localStorage.getItem('tracking_selected_nama');
      const savedSupplier = localStorage.getItem('tracking_selected_faktur_supplier');
      const savedPath = localStorage.getItem('tracking_selected_path') as 'bom' | 'rekap' | null;
      if (savedFaktur) {
         setSelectedFaktur(savedFaktur);
         setSelectedNama(savedNama || '');
         setSelectedFakturSupplier(savedSupplier || null);
         setTrackingPath(savedPath);
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
    // Validation: Clear selected item if it doesn't match the selected supplier
    useEffect(() => {
       if (selectedSupplier && trackingPath === 'rekap') {
          if (!selectedFakturSupplier || selectedFakturSupplier !== selectedSupplier) {
             setSelectedFaktur(null);
             setSelectedNama('');
             setSelectedFakturSupplier(null);
             setTrackingPath(null);
             setTrackingData(null);
             localStorage.removeItem('tracking_selected_faktur');
             localStorage.removeItem('tracking_selected_nama');
             localStorage.removeItem('tracking_selected_faktur_supplier');
             localStorage.removeItem('tracking_selected_path');
          }
       }
    }, [selectedSupplier, selectedFakturSupplier, trackingPath]);
   }, [selectedFaktur]);

   const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight + 50 && !loadingSuggestions && hasMoreSuggestions) {
         setSuggestionPage(prev => prev + 1);
      }
   };

   return (
      <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
         {/* SELECTORS SECTION */}
         <div className="flex flex-col xl:flex-row gap-6 shrink-0 relative z-50 min-w-0">
            {/* BOM Selector Card - Dynamic flex based on open state */}
            <div 
               style={{ 
                  flex: open ? 5 : (openRekap || openSupplier ? 2 : 3),
                  transition: 'flex 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
               }}
               className="bg-white border border-gray-100 py-4 px-6 shadow-sm shadow-green-900/5 rounded-2xl flex flex-col relative min-w-0"
            >
               <div className="flex flex-col relative z-10 w-full">
                  <div className="flex items-center justify-between mb-2 pl-1 whitespace-nowrap">
                     <span className="text-[13px] font-semibold text-gray-500">Pilih BOM (Bill of Material)</span>
                  </div>
                  <div className="relative" ref={suggestionRef}>
                     <div
                        className={`w-full bg-white border border-gray-100 rounded-xl px-4 h-12 text-sm flex items-center justify-between transition-all text-gray-700 cursor-pointer shadow-sm hover:shadow-sm hover:shadow-green-900/5 hover:border-green-200 ${open ? 'ring-4 ring-green-500/5 border-green-200' : ''}`}
                        onClick={() => { setOpen(!open); setQ(''); }}
                     >
                        <div className="flex items-center gap-4 min-w-0 flex-1 overflow-hidden">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${loadingData && trackingData?.bom ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                              {loadingData && trackingData?.bom ? (
                                 <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                 <Package size={16} />
                              )}
                           </div>
                           <div className="flex items-center min-w-0 flex-1 overflow-hidden leading-tight">
                              <span className={`truncate text-[13px] ${selectedFaktur && trackingPath === 'bom' ? 'text-gray-800 font-bold' : 'text-gray-400 font-normal'}`}>
                                 {selectedFaktur && trackingPath === 'bom' 
                                    ? `[${selectedFaktur}] ${selectedNama}` 
                                    : 'Cari BOM atau Produk'}
                              </span>
                           </div>
                        </div>
                        <ChevronDown size={20} className={`text-gray-300 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                     </div>

                     {open && (
                        <div className="absolute top-[calc(100%+12px)] left-0 min-w-full w-max bg-white border border-gray-100 rounded-xl shadow-md z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                           <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                              <div className="relative">
                                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                 <input 
                                    autoFocus 
                                    type="text" 
                                    placeholder="Cari nomor BOM atau nama produk..." 
                                    className="w-full pl-12 pr-4 h-12 text-[13px] border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-200 bg-white font-bold placeholder:text-gray-300" 
                                    value={q} 
                                    onChange={(e) => setQ(e.target.value)} 
                                 />
                                 {loadingSuggestions && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 size={18} className="animate-spin text-green-600" /></div>}
                              </div>
                           </div>
                           <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2" onScroll={handleListScroll}>
                              {suggestions.length > 0 ? suggestions.map((s: any, idx: number) => (
                                 <button 
                                    key={`${s.faktur}-${idx}`} 
                                    onClick={() => handleSelect(s)} 
                                    className={`w-full px-5 py-4 text-left rounded-lg transition-all flex items-center justify-between group/item mb-1 last:mb-0 ${selectedFaktur === s.faktur && trackingData?.bom ? 'bg-green-600 text-white shadow-sm shadow-green-200' : 'text-gray-700 hover:bg-green-50 hover:text-green-600'}`}
                                 >
                                       <div className="flex flex-col min-w-0">
                                          <span className="text-[12px] font-bold">{s.faktur}</span>
                                          <span className={`text-[11px] font-bold ${selectedFaktur === s.faktur && trackingData?.bom ? 'text-white/70' : 'text-gray-400'}`}>{s.nama_prd}</span>
                                       </div>
                                    </button>
                              )) : (
                                 <div className="p-12 text-center flex flex-col items-center gap-3">
                                    <p className="text-[12px] font-bold text-gray-300">Data Tidak Ditemukan</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
            {/* Nama Barang Selector Card - Dynamic flex based on open state */}
            <div 
               style={{ 
                  flex: openRekap || openSupplier ? 10 : (open ? 7 : 9),
                  transition: 'flex 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
               }}
               className="bg-white border border-gray-100 py-4 px-8 shadow-sm shadow-green-900/5 rounded-2xl flex flex-col relative min-w-0"
            >
               <div className="flex flex-col lg:flex-row gap-6 relative z-10 min-w-0">
                  {/* Left: Searchable Selects (Supplier & Barang) */}
                  <div className="flex-[1.5] flex flex-col lg:flex-row gap-4 min-w-0">
                     
                     {/* Supplier Selector */}
                     <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center justify-between mb-2 pl-1">
                           <span className="text-[13px] font-semibold text-gray-500">Pilih Supplier (Opsional)</span>
                           {selectedSupplier && (
                              <button 
                                 onClick={() => setSelectedSupplier(null)}
                                 className="text-[10px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                              >
                                 <X size={12} /> Hapus
                              </button>
                           )}
                        </div>
                        <div className="relative" ref={supplierSuggestionRef}>
                           <div
                              className={`w-full bg-white border border-gray-100 rounded-xl px-4 h-12 text-sm flex items-center justify-between transition-all text-gray-700 cursor-pointer shadow-sm hover:shadow-sm hover:shadow-green-900/5 hover:border-green-200 ${openSupplier ? 'ring-4 ring-green-500/5 border-green-200' : ''}`}
                              onClick={() => { setOpenSupplier(!openSupplier); setQSupplier(''); }}
                           >
                              <div className="flex items-center gap-4 min-w-0 flex-1 overflow-hidden">
                                 <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                    <Truck size={16} />
                                 </div>
                                 <div className="flex items-center min-w-0 flex-1 overflow-hidden leading-tight">
                                    <span className={`truncate text-[13px] ${selectedSupplier ? 'text-gray-800 font-bold' : 'text-gray-400 font-normal'}`}>
                                       {selectedSupplier || 'Cari Supplier...'}
                                    </span>
                                 </div>
                              </div>
                              <ChevronDown size={20} className={`text-gray-300 transition-transform duration-300 ${openSupplier ? 'rotate-180' : ''}`} />
                           </div>

                           {openSupplier && (
                              <div className="absolute top-[calc(100%+12px)] left-0 min-w-full w-max bg-white border border-gray-100 rounded-xl shadow-md z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                 <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                    <div className="relative">
                                       <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                       <input 
                                          autoFocus 
                                          type="text" 
                                          placeholder="Ketik nama supplier..." 
                                          className="w-full pl-12 pr-4 h-12 text-[13px] border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-200 bg-white font-bold placeholder:text-gray-300" 
                                          value={qSupplier} 
                                          onChange={(e) => setQSupplier(e.target.value)} 
                                       />
                                       {loadingSuppliers && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 size={18} className="animate-spin text-green-600" /></div>}
                                    </div>
                                 </div>
                                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                                    {suppliers.length > 0 ? suppliers.map((s: any, idx: number) => (
                                       <button 
                                          key={`${s.supplier}-${idx}`} 
                                          onClick={() => {
                                             setOpenSupplier(false);
                                             setSelectedSupplier(s.supplier);
                                             
                                             // VALIDATION: If we have a selected item (Rekap path) and its supplier doesn't match the new supplier, clear it
                                             if (trackingPath === 'rekap' && selectedFakturSupplier && selectedFakturSupplier !== s.supplier) {
                                                setSelectedFaktur(null);
                                                setSelectedNama('');
                                                setSelectedFakturSupplier(null);
                                                setTrackingPath(null);
                                                setTrackingData(null);
                                                localStorage.removeItem('tracking_selected_faktur');
                                                localStorage.removeItem('tracking_selected_nama');
                                                localStorage.removeItem('tracking_selected_faktur_supplier');
                                                localStorage.removeItem('tracking_selected_path');
                                             }
                                          }} 
                                          className={`w-full px-5 py-4 text-left rounded-lg transition-all flex items-center justify-between group/item mb-1 last:mb-0 ${selectedSupplier === s.supplier ? 'bg-green-600 text-white shadow-sm shadow-green-200' : 'text-gray-700 hover:bg-green-50 hover:text-green-600'}`}
                                       >
                                          <div className="flex flex-col min-w-0">
                                             <span className="text-[12px] font-bold">{s.supplier}</span>
                                          </div>
                                       </button>
                                    )) : (
                                       <div className="p-8 text-center flex flex-col items-center gap-3">
                                          <p className="text-[12px] font-bold text-gray-300">Data Tidak Ditemukan</p>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Item Selector */}
                     <div className="flex-[1.5] flex flex-col min-w-0">
                        <div className="flex items-center justify-between mb-2 pl-1">
                           <span className="text-[13px] font-semibold text-gray-500">Pilih Nama Barang (Rekap Pembelian)</span>
                        </div>
                        <div className="relative" ref={rekapSuggestionRef}>
                           <div
                              className={`w-full bg-white border border-gray-100 rounded-xl px-4 h-12 text-sm flex items-center justify-between transition-all text-gray-700 cursor-pointer shadow-sm hover:shadow-sm hover:shadow-green-900/5 hover:border-green-200 ${openRekap ? 'ring-4 ring-green-500/5 border-green-200' : ''}`}
                              onClick={() => { setOpenRekap(!openRekap); setQRekap(''); }}
                           >
                              <div className="flex items-center gap-4 min-w-0 flex-1 overflow-hidden">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${loadingData && trackingPath === 'rekap' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                    {loadingData && trackingPath === 'rekap' ? (
                                       <RefreshCw size={16} className="animate-spin" />
                                    ) : (
                                       <ShoppingCart size={16} />
                                    )}
                                 </div>
                                 <div className="flex items-center min-w-0 flex-1 overflow-hidden leading-tight">
                                    <span className={`truncate text-[13px] ${selectedFaktur && trackingPath === 'rekap' ? 'text-gray-800 font-bold' : 'text-gray-400 font-normal'}`}>
                                       {selectedFaktur && trackingPath === 'rekap' 
                                          ? `[${selectedFaktur}] ${selectedNama}` 
                                          : 'Cari Faktur PB atau Barang'}
                                    </span>
                                 </div>
                              </div>
                              <ChevronDown size={20} className={`text-gray-300 transition-transform duration-300 ${openRekap ? 'rotate-180' : ''}`} />
                           </div>

                           {openRekap && (
                              <div className="absolute top-[calc(100%+12px)] left-0 min-w-full w-max bg-white border border-gray-100 rounded-xl shadow-md z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                 <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                    <div className="relative">
                                       <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                       <input 
                                          autoFocus 
                                          type="text" 
                                          placeholder={selectedSupplier ? `Cari barang dari ${selectedSupplier}...` : "Cari faktur atau nama barang..."}
                                          className="w-full pl-12 pr-4 h-12 text-[13px] border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-200 bg-white font-bold placeholder:text-gray-300" 
                                          value={qRekap} 
                                          onChange={(e) => setQRekap(e.target.value)} 
                                       />
                                       {loadingRekapSuggestions && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 size={18} className="animate-spin text-green-600" /></div>}
                                    </div>
                                 </div>
                                 <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2">
                                    {rekapSuggestions.length > 0 ? rekapSuggestions.map((s: any, idx: number) => (
                                       <button 
                                          key={`${s.faktur}-${s.kd_barang}-${idx}`} 
                                          onClick={() => {
                                             setOpenRekap(false);
                                             setQRekap('');
                                             setSelectedFaktur(s.faktur);
                                             setSelectedNama(s.nm_barang || s.kd_barang || '');
                                             setSelectedFakturSupplier(s.kd_supplier || null);
                                             setTrackingPath('rekap');
                                             localStorage.setItem('tracking_selected_faktur', s.faktur);
                                             localStorage.setItem('tracking_selected_nama', s.nm_barang || s.kd_barang || '');
                                             localStorage.setItem('tracking_selected_faktur_supplier', s.kd_supplier || '');
                                             localStorage.setItem('tracking_selected_path', 'rekap');
                                             fetchTrackingData(s.faktur);
                                          }} 
                                          className={`w-full px-5 py-4 text-left rounded-lg transition-all flex items-center justify-between group/item mb-1 last:mb-0 ${selectedFaktur === s.faktur && trackingPath === 'rekap' ? 'bg-green-600 text-white shadow-sm shadow-green-200' : 'text-gray-700 hover:bg-green-50 hover:text-green-600'}`}
                                       >
                                          <div className="flex flex-col min-w-0">
                                             <div className="flex items-center gap-2">
                                                <span className="text-[12px] font-bold">{s.faktur}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-bold">{s.tgl}</span>
                                             </div>
                                             <span className={`text-[11px] font-bold ${selectedFaktur === s.faktur && trackingPath === 'rekap' ? 'text-white/70' : 'text-gray-400'}`}>{s.nm_barang || s.kd_barang}</span>
                                          </div>
                                       </button>
                                    )) : (
                                       <div className="p-12 text-center flex flex-col items-center gap-3">
                                          <p className="text-[12px] font-bold text-gray-300">Data Tidak Ditemukan</p>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Part 2: Date Range */}
                  <div className="lg:w-auto lg:min-w-[300px] flex flex-col shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-8">
                     <div className="flex flex-col mb-2.5">
                        <span className="block text-[13px] font-semibold text-gray-500 mb-2 ml-1 tracking-tight select-none">Rentang Tanggal</span>
                        <div className="flex items-center gap-3">
                           <div className="flex-1 relative group">
                              <DatePicker 
                                 name="startDate" 
                                 value={startDate} 
                                 onChange={(d) => setStartDate(d)} 
                              />
                           </div>
                           <div className="w-4 h-0.5 bg-gray-100 rounded-full shrink-0"></div>
                           <div className="flex-1 relative group">
                              <DatePicker 
                                 name="endDate" 
                                 value={endDate} 
                                 onChange={(d) => setEndDate(d)} 
                                 popupAlign="right"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

               </div>
            </div>

         </div>

         {error && (
            <div className="p-5 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm shadow-red-900/5 text-sm flex items-start gap-4 animate-in fade-in shrink-0">
               <AlertCircle size={20} className="shrink-0 mt-0.5" />
               <p className="font-bold leading-tight">{error}</p>
            </div>
         )}

         {/* RESULTS SECTION */}
         <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
            {/* Header */}
            <div className="flex flex-col gap-4 shrink-0 px-1">
               <div className="flex items-center justify-between gap-4 min-h-[32px]">
                  <h3 className="text-[14px] font-bold text-gray-800 flex items-center gap-3 leading-none">
                     <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shadow-sm shrink-0">
                        <Clock size={16} />
                     </div>
                     <span>Visualisasi Alur Manufaktur</span>
                  </h3>
                  {isAutoRefreshing && (
                     <div className="flex items-center gap-3 text-[10px] font-bold text-green-600 animate-pulse bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm leading-none">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Memproses Data...</span>
                     </div>
                  )}
               </div>
               <SearchAndReload
                  searchQuery={filterText}
                  setSearchQuery={setFilterText}
                  onReload={() => { if (selectedFaktur) fetchTrackingData(selectedFaktur); }}
                  loading={loadingData}
                  placeholder="Cari dalam hasil pelacakan (faktur, barang, pelanggan, dll)..."
               />
            </div>

            {/* Tab bar + table area */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
               {loadingData ? (
                  <div className="flex-1 flex items-center justify-center">
                     <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-gray-100 rounded-full border-t-green-600 animate-spin" />
                        <span className="text-[12px] font-bold text-gray-500 animate-pulse">Menelusuri alur produksi...</span>
                     </div>
                  </div>
               ) : !trackingData ? (
                  <div className="flex-1 flex items-center justify-center">
                     <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                           <Clock className="text-gray-200" size={32} />
                        </div>
                        <p className="text-[13px] font-bold text-gray-400">Pilih BOM atau Barang untuk memulai pelacakan</p>
                     </div>
                  </div>
               ) : (
                  <>
                     {/* Scrollable Tab Bar */}
                     <div className="flex overflow-x-auto custom-scrollbar shrink-0 border-b border-gray-100 px-2 pt-2 gap-1">
                        {tabs.map(tab => {
                           const count = filterRows(tab.getData()).length;
                           const isActive = activeTab === tab.id;
                           return (
                              <button
                                 key={tab.id}
                                 onClick={() => setActiveTab(tab.id)}
                                 className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg whitespace-nowrap text-[12px] font-bold transition-all shrink-0 border-b-2 ${
                                    isActive
                                       ? 'bg-green-50 text-green-700 border-green-500'
                                       : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50'
                                 }`}
                              >
                                 <span>{tab.label}</span>
                                 {tab.badge && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-bold tracking-wide">{tab.badge}</span>
                                 )}
                                 <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                    count > 0 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
                                 }`}>{count}</span>
                              </button>
                           );
                        })}
                     </div>

                     {/* Tab Content — Horizontal Table */}
                     <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                        {activeTabData.rows.length === 0 ? (
                           <div className="flex flex-col items-center justify-center py-24 text-center">
                              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                 <AlertCircle className="text-gray-200" size={28} />
                              </div>
                              <p className="text-[13px] font-bold text-gray-400">Tidak ada data pada tahap ini</p>
                              {debouncedFilterText && (
                                 <p className="text-[11px] text-gray-300 mt-1">untuk pencarian &quot;{debouncedFilterText}&quot;</p>
                              )}
                           </div>
                        ) : (
                           <table className="w-full text-left border-separate border-spacing-0 text-[12px]">
                              <thead className="sticky top-0 z-10">
                                 <tr>
                                    <th className="px-4 py-3 bg-gray-50 border-b border-r border-gray-100 text-[10px] font-bold text-gray-400 tracking-widest whitespace-nowrap w-10">#</th>
                                    {activeTabData.columns.map(col => (
                                       <th
                                          key={col}
                                          className="px-4 py-3 bg-gray-50 border-b border-r border-gray-100 text-[10px] font-bold text-gray-500 tracking-wide whitespace-nowrap last:border-r-0"
                                       >
                                          {toTitleCase(col)}
                                       </th>
                                    ))}
                                 </tr>
                              </thead>
                              <tbody>
                                 {paginatedRows.map((row: any, rowIdx: number) => {
                                    const globalIdx = (currentPage - 1) * PAGE_SIZE + rowIdx;
                                    return (
                                    <tr
                                       key={rowIdx}
                                       className={`border-b border-gray-50 transition-colors hover:bg-green-50/40 ${
                                          rowIdx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'
                                       }`}
                                    >
                                       <td className="px-4 py-2.5 border-r border-gray-50 text-[11px] text-gray-300 font-bold tabular-nums">{globalIdx + 1}</td>
                                       {activeTabData.columns.map(col => {
                                          const val = row[col];
                                          let display = val === null || val === undefined ? '-' : typeof val === 'string' ? val.replace(/<[^>]*>?/gm, '').trim() || '-' : String(val);
                                          // Format numbers
                                          const num = parseFloat(display.replace(/,/g, ''));
                                          if (!isNaN(num) && display.includes('.') && display.length > 5) {
                                             display = num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                          }
                                          // Highlight search text
                                          const lowerSearch = debouncedFilterText.toLowerCase();
                                          const isMatch = debouncedFilterText && display.toLowerCase().includes(lowerSearch);
                                          return (
                                             <td
                                                key={col}
                                                className="px-4 py-2.5 border-r border-gray-50 last:border-r-0 font-medium text-gray-700 whitespace-nowrap max-w-[280px] overflow-hidden text-ellipsis"
                                             >
                                                {isMatch ? (
                                                   <HighlightedText text={display} highlight={debouncedFilterText} />
                                                ) : display}
                                             </td>
                                          );
                                       })}
                                    </tr>
                                    );
                                 })}
                              </tbody>
                           </table>
                        )}
                     </div>
                     {/* Footer */}
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between shrink-0 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30 gap-3">
                        {/* Left: Info Section */}
                        <div className="flex flex-wrap items-center gap-4">
                           {/* Count Info */}
                           <span className="text-[11px] font-bold text-gray-400">
                              {activeTabData.rows.length > 0
                                 ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, activeTabData.rows.length)} dari ${activeTabData.rows.length} data`
                                 : '0 data'}
                              {debouncedFilterText ? ` untuk "${debouncedFilterText}"` : ''}
                           </span>

                           {/* Load Time */}
                           {loadTime !== null && (
                              <div className={`text-[9px] px-2 py-1 rounded-full font-bold flex items-center gap-1.5 border tracking-wide ${
                                 loadTime < 300 ? 'bg-green-50 text-green-600 border-green-100' : loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                              }`}>
                                 <span>⚡</span>
                                 <span>{(loadTime / 1000).toFixed(2)}s</span>
                              </div>
                           )}

                           {/* Total Qty (Only for specific tabs and Jalur Barang) */}
                           {trackingPath === 'rekap' && (activeTab === 'bahan_baku' || activeTab === 'barang_jadi') && activeTabData.rows.length > 0 && (
                              <div className="text-[11px] font-bold text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
                                 <span>Total Qty:</span>
                                 <span className="text-green-700 text-[12px]">{activeTabData.totalQty.toLocaleString('id-ID')}</span>
                              </div>
                           )}
                        </div>

                        {/* Right: Pagination Controls */}
                        {totalPages > 1 && (
                           <div className="flex items-center gap-1 shrink-0">
                              <button
                                 onClick={() => setCurrentPage(1)}
                                 disabled={currentPage === 1}
                                 className="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold text-gray-400 hover:bg-green-50 hover:text-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                 title="Halaman pertama"
                              >
                                 «
                              </button>
                              <button
                                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                 disabled={currentPage === 1}
                                 className="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold text-gray-400 hover:bg-green-50 hover:text-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              >
                                 <ChevronLeft size={14} />
                              </button>

                              {/* Page number pills */}
                              {Array.from({ length: totalPages }, (_, i) => i + 1)
                                 .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                 .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                                    acc.push(p);
                                    return acc;
                                 }, [])
                                 .map((p, i) =>
                                    p === 'ellipsis' ? (
                                       <span key={`e-${i}`} className="w-7 text-center text-[11px] text-gray-300 font-bold">…</span>
                                    ) : (
                                       <button
                                          key={p}
                                          onClick={() => setCurrentPage(p as number)}
                                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                                             currentPage === p
                                                ? 'bg-green-600 text-white shadow-sm'
                                                : 'text-gray-500 hover:bg-green-50 hover:text-green-700'
                                          }`}
                                       >
                                          {p}
                                       </button>
                                    )
                                 )
                              }

                              <button
                                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                 disabled={currentPage === totalPages}
                                 className="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold text-gray-400 hover:bg-green-50 hover:text-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              >
                                 <ChevronRight size={14} />
                              </button>
                              <button
                                 onClick={() => setCurrentPage(totalPages)}
                                 disabled={currentPage === totalPages}
                                 className="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold text-gray-400 hover:bg-green-50 hover:text-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                 title="Halaman terakhir"
                              >
                                 »
                              </button>
                           </div>
                        )}
                     </div>
                  </>
               )}
            </div>
         </div>
      </div>
   );
;
}



