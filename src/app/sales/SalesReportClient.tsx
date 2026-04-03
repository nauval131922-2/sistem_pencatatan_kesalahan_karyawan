'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import { splitDateRangeIntoMonths, formatLastUpdate } from '@/lib/date-utils';
import { formatScrapedPeriodDate, getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod } from '@/lib/scraper-period';
import { DataTable } from '@/components/ui/DataTable';

// Helper to format Date to YYYY-MM-DD
function formatDateToYYYYMMDD(date: Date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper to format "DD-MM-YYYY" string to "DD MMM YYYY"
function formatIndoDateStr(tglStr: string) {
  if (!tglStr) return '';
  const parts = tglStr.split('-');
  if (parts.length === 3) {
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return tglStr;
}

const PAGE_SIZE = 50;

export default function SalesReportClient() {
  const router = useRouter();
  const mountedRef = useRef(true);
  const isLoadingMore = useRef(false);
  
  // State
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{start: string, end: string} | null>(null);

  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Table State
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('salesReport_columnWidths');
      return saved ? JSON.parse(saved) : {
        tgl: 140, faktur: 180, nama_prd: 350, nama_pelanggan: 280, kd_barang: 200, 
        qty: 110, harga: 160, jumlah: 180, faktur_so: 180
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('salesReport_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Columns Definition
  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'faktur', header: 'Faktur' },
    { accessorKey: 'kd_pelanggan', header: 'Kode Pel.' },
    { 
        accessorKey: 'tgl', 
        header: 'Tanggal', 
        cell: (info: any) => formatIndoDateStr(info.getValue() as string)
    },
    { accessorKey: 'kd_barang', header: 'Kode Barang' },
    { accessorKey: 'faktur_so', header: 'Faktur SO' },
    { 
        accessorKey: 'jthtmp', 
        header: 'Jatuh Tempo', 
        cell: (info: any) => formatIndoDateStr(info.getValue() as string)
    },
    { 
        accessorKey: 'harga', 
        header: 'Harga', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { 
        accessorKey: 'qty', 
        header: 'Qty', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { 
        accessorKey: 'jumlah', 
        header: 'Jumlah', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { 
        accessorKey: 'ppn', 
        header: 'PPN', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { accessorKey: 'faktur_prd', header: 'Faktur Prd' },
    { accessorKey: 'nama_prd', header: 'Produk (Nama)' },
    { accessorKey: 'no_ref_pelanggan', header: 'No Ref Pel.' },
    { accessorKey: 'nama_pelanggan', header: 'Pelanggan' },
    { accessorKey: 'dati_2', header: 'Kota/Kab' },
    { accessorKey: 'gol_barang', header: 'Gol. Barang' },
    { accessorKey: 'keterangan_so', header: 'Ket. SO' },
    { accessorKey: 'recid', header: 'RecID' }
  ], []);

  useEffect(() => {
    setIsMounted(true);

    const hydratedPeriod = hydrateScraperPeriod({ stateKey: 'salesReportState', periodKey: 'SalesReportClient_scrapedPeriod' });
    setScrapedPeriod(hydratedPeriod.scrapedPeriod);
    setStartDate(hydratedPeriod.startDate);
    setEndDate(hydratedPeriod.endDate);
    
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        setRefreshKey(prev => prev + 1);
        router.refresh();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  // Main fetch data
  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!active || !mountedRef.current) return;
      setLoading(true);
      const startTime = performance.now();
      try {
        const res = await fetch(`/api/sales?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&from=${formatDateToYYYYMMDD(startDate)}&to=${formatDateToYYYYMMDD(endDate)}&_t=${Date.now()}`);
        
        if (res.ok && active) {
          const json = await res.json();
          if (json.success) {
            setLoadTime(Math.round(performance.now() - startTime));
            setData(prev => {
              if (page === 1) return json.data || [];
              const currentData = prev;
              const newData = json.data || [];
              const existingIds = new Set(currentData.map((d: any) => d.id));
              const filteredNew = newData.filter((d: any) => !existingIds.has(d.id));
              return [...currentData, ...filteredNew];
            });
            setTotalCount(json.total || 0);
            setLastUpdated(json.lastUpdated ? formatLastUpdate(new Date(json.lastUpdated)) : null);
            setError('');
          }
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Gagal memuat data');
      } finally {
        if (active) {
          setLoading(false);
          isLoadingMore.current = false;
        }
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate]);

  // Scrape Digit
  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');
  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'alert', title: string, message: string}>({
    isOpen: false, type: 'success', title: '', message: ''
  });

  const handleFetchDigit = async () => {
    if (!startDate || !endDate) return;
    if (startDate > endDate) {
      setError('Tanggal mulai tidak boleh lebih dari tanggal akhir.');
      return;
    }

    // Save state to localStorage only when "Tarik Data" is clicked
    localStorage.setItem('salesReportState', JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sessionDate: new Date().toLocaleDateString('en-CA')
    }));

    setError('');
    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    setIsBatching(true); setBatchProgress(0);
    
    let successCount = 0;
    let totalScraped = 0;
    let lastUpdatedFromScrape: string | null = null;
    let completedChunks = 0;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-sales?start=${chunk.start}&end=${chunk.end}`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
          totalScraped += (json.total || 0);
          if (json.lastUpdated) lastUpdatedFromScrape = json.lastUpdated;
        }
      } catch (err) {
        console.error("Chunk Error:", err);
      } finally {
        completedChunks++;
        setBatchProgress(Math.round((completedChunks / chunks.length) * 100));
        setBatchStatus(`Memproses ${completedChunks}/${chunks.length} bulan...`);
      }
    };

    try {
      const concurrency = 10;
      const queue = [...chunks];
      const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
        while (queue.length > 0) {
          const chunk = queue.shift();
          if (chunk) await processChunk(chunk);
        }
      });
      await Promise.all(workers);

      if (successCount > 0) {
        const periodStr = persistScraperPeriod({ stateKey: 'salesReportState', periodKey: 'SalesReportClient_scrapedPeriod' }, startDate, endDate);
        setScrapedPeriod(periodStr);
        if (lastUpdatedFromScrape) {
          setLastUpdated(formatLastUpdate(new Date(lastUpdatedFromScrape)));
        }
        localStorage.setItem('sintak_data_updated', Date.now().toString());
        setRefreshKey(prev => prev + 1);
        
        setDialog({
          isOpen: true,
          type: (chunks.length - successCount) > 0 ? 'alert' : 'success',
          title: (chunks.length - successCount) > 0 ? 'Selesai Sebagian' : 'Berhasil',
          message: `Berhasil menarik ${totalScraped} Laporan Penjualan dari Digit.`
        });
      } else {
        setError("Gagal menarik data. Cek koneksi.");
      }
    } finally {
      if (mountedRef.current) { setIsBatching(false); setBatchStatus(''); setBatchProgress(0); }
    }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && !isBatching && !isLoadingMore.current && data.length < totalCount) {
       isLoadingMore.current = true;
       setPage(prev => prev + 1);
    }
  }, [loading, isBatching, data.length, totalCount]);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-sm flex flex-col gap-5 shrink-0 relative z-50">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Rentang Tanggal</span>
              <div className="flex items-center gap-2">
                <div className="w-[140px] relative group"><DatePicker name="startDate" value={startDate} onChange={setStartDate} /></div>
                <div className="w-4 h-[1px] bg-gray-200 mx-1"></div>
                <div className="w-[140px] relative group"><DatePicker name="endDate" value={endDate} onChange={setEndDate} /></div>
              </div>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            {isBatching && (
                <div className="flex flex-col items-end">
                    <div className="text-[10px] text-green-600 font-bold animate-pulse leading-none uppercase tracking-tighter">{batchStatus}</div>
                    <div className="w-24 h-1 bg-gray-50 rounded-full mt-1.5 overflow-hidden border border-gray-200">
                    <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${batchProgress}%` }} />
                    </div>
                </div>
            )}
            <button 
                onClick={handleFetchDigit} 
                disabled={loading || isBatching || !startDate || !endDate} 
                className="px-5 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98]"
            >
              {isBatching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} className={loading && data.length === 0 ? "animate-spin" : ""} />}
              <span>{isBatching ? `${batchProgress}%` : 'Tarik Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm flex items-start gap-2 animate-in fade-in shrink-0">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><p className="font-semibold">{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-4">
              <h3 className="text-[14px] font-extrabold text-gray-800 flex items-center gap-2.5 leading-none">
                <Clock size={18} className="text-green-600" />
                <span>Hasil Scrapping</span>
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-[12px] font-medium leading-none" style={{ color: '#99a1af' }}>
                  <span className="opacity-40">|</span><span>Diperbarui: {lastUpdated}{scrapedPeriod ? ` (Periode: ${formatScrapedPeriodDate(scrapedPeriod.start)} s.d. ${formatScrapedPeriodDate(scrapedPeriod.end)})` : ''}</span>
                </div>
              )}
            </div>
          </div>
          <div className="relative w-full group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-500 transition-colors" />
            <input 
              type="text" placeholder="Cari faktur, pelanggan, atau barang..." 
              className="w-full pl-12 pr-4 h-10 bg-white border border-gray-200 rounded-[14px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm" 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
          <DataTable
            columns={columns} data={data} isLoading={loading} totalCount={totalCount} onScroll={handleScroll}
            selectedIds={selectedIds} onRowClick={(id) => {
              const next = new Set(selectedIds);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              setSelectedIds(next);
            }}
            columnWidths={columnWidths} onColumnWidthChange={setColumnWidths}
          />

          <div className="flex items-center justify-between shrink-0 px-1 mt-1">
            <span className="text-[12px] leading-none font-bold text-gray-400">
              {totalCount === 0 ? 'Tidak ada Laporan Penjualan' : `Menampilkan ${data.length} dari ${totalCount} Laporan Penjualan`}
            </span>
            <div className="flex items-center gap-4">
              {loadTime !== null && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm border ${loadTime < 300 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                  <span className="animate-pulse">⚡</span><span>{(loadTime / 1000).toFixed(2)}s</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmDialog isOpen={dialog.isOpen} type={dialog.type} title={dialog.title} message={dialog.message} onConfirm={() => setDialog({ ...dialog, isOpen: false })} />
    </div>
  );
}
