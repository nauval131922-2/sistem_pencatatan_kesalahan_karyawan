'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import { splitDateRangeIntoMonths } from '@/lib/date-utils';
import { DataTable } from '@/components/ui/DataTable';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import { formatLastUpdate } from '@/lib/date-utils';
import { formatScrapedPeriodDate, getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod } from '@/lib/scraper-period';

// Helper to format Date to YYYY-MM-DD
function formatDateToYYYYMMDD(date: Date) {
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

export default function OrderProduksiClient() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{start: string, end: string} | null>(null);


  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const mountedRef = useRef(true);
  const isLoadingMore = useRef(false);

  // Batch states
  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');

  // Table state
  const { selectedIds, setSelectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orders_columnWidths');
      return saved ? JSON.parse(saved) : {
        faktur: 180,
        nama_prd: 350,
        nama_pelanggan: 250,
        tgl: 120,
        qty: 120,
        satuan: 100,
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('orders_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Debounce search with 100ms for instant feel
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 100);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Columns Definition
  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID', size: 80 },
    { accessorKey: 'faktur', header: 'Faktur', size: 160 },
    { accessorKey: 'faktur_bom', header: 'Faktur BOM', size: 160 },
    { accessorKey: 'faktur_so', header: 'Faktur SO', size: 160 },
    { accessorKey: 'faktur_pb', header: 'Faktur PB', size: 140 },
    { accessorKey: 'kd_cabang', header: 'Cabang', size: 80 },
    { accessorKey: 'kd_gudang', header: 'Gudang', size: 180 },
    { 
      accessorKey: 'tgl', 
      header: 'Tanggal',
      cell: (info: any) => formatIndoDateStr(info.getValue())
    },
    { accessorKey: 'kd_mtd', header: 'Metode', size: 140 },
    { 
      accessorKey: 'kd_pelanggan', 
      header: 'Pelanggan',
      size: 250,
      cell: (info: any) => {
        const val = info.getValue();
        return (
          <div className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100/60 text-gray-500 border border-gray-200/50">
            {val || '-'}
          </div>
        );
      }
    },
    { 
      accessorKey: 'nama_prd', 
      header: 'Nama Produk',
      size: 450,
      cell: (info: any) => (
        <div className="max-w-[450px] truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:relative group-hover:z-10 group-hover:bg-white group-hover:shadow-lg group-hover:p-2 group-hover:rounded-md transition-all">
          {info.getValue()}
        </div>
      )
    },
    { accessorKey: 'status', header: 'Sts', size: 60 },
    { accessorKey: 'perbaikan', header: 'Perbaikan', size: 80 },
    { 
      accessorKey: 'regu', 
      header: 'Regu', 
      size: 150,
      cell: (info: any) => {
        const val = info.getValue();
        if (!val) return '-';
        try {
          const parsed = typeof val === 'string' ? JSON.parse(val) : val;
          return parsed.keterangan || '-';
        } catch(e) { return '-'; }
      }
    },
    { 
      accessorKey: 'bbb', 
      header: 'BBB', 
      size: 110,
      cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
      meta: { align: 'right' }
    },
    { 
      accessorKey: 'pers_btkl', 
      header: '% BTKL', 
      size: 110,
      cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
      meta: { align: 'right' }
    },
    { 
      accessorKey: 'btkl', 
      header: 'BTKL', 
      size: 110,
      cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
      meta: { align: 'right' }
    },
    { 
      accessorKey: 'pers_bop', 
      header: '% BOP', 
      size: 110,
      cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
      meta: { align: 'right' }
    },
    { 
      accessorKey: 'bop', 
      header: 'BOP', 
      size: 110,
      cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
      meta: { align: 'right' }
    },
    { 
      accessorKey: 'hp', 
      header: 'Harga Pokok', 
      size: 110,
      cell: (info: any) => {
        const val = info.getValue();
        return (
          <span className="font-extrabold text-green-700">
            {Number(val || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
          </span>
        );
      },
      meta: { align: 'right' }
    },
    { accessorKey: 'datetime_mulai', header: 'Mulai', size: 160 },
    { accessorKey: 'datetime_selesai', header: 'Selesai', size: 160 },
    { accessorKey: 'fkt_selesai', header: 'Fkt Selesai', size: 160 },
    { accessorKey: 'created_at', header: 'Created', size: 160 },
    { accessorKey: 'username', header: 'User', size: 110 },
    { accessorKey: 'edited_at', header: 'Edited At', size: 160 },
    { accessorKey: 'username_edited', header: 'Edited By', size: 110 },
    { accessorKey: 'kd_barang', header: 'Kode Barang', size: 110 },
    { 
      accessorKey: 'qty_order', 
      header: 'Qty Order', 
      size: 180,
      cell: (info: any) => <div dangerouslySetInnerHTML={{ __html: info.getValue() || '-' }} />
    },
    { accessorKey: 'produk', header: 'Produk', size: 450 },
    { 
      accessorKey: 'progres', 
      header: 'Progres', 
      size: 120,
      cell: (info: any) => <div dangerouslySetInnerHTML={{ __html: info.getValue() || '-' }} />,
      meta: { align: 'center' }
    },
    { 
      accessorKey: 'spesifikasi', 
      header: 'Spesifikasi', 
      size: 300,
      cell: (info: any) => (
        <div className="max-w-[300px] truncate" title={info.getValue() as string}>
          {info.getValue()}
        </div>
      )
    },
    { accessorKey: 'qty_so', header: 'Qty SO', size: 180 },
    { accessorKey: 'kd_satuan', header: 'Satuan', size: 100 },
    { 
      accessorKey: 'faktur_pr', 
      header: 'Purchase Request (PR)', 
      size: 180,
      cell: (info: any) => <div dangerouslySetInnerHTML={{ __html: info.getValue() || '-' }} />
    },
    { 
      accessorKey: 'prdk_wip', 
      header: 'WIP', 
      size: 100,
      cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
      meta: { align: 'right' }
    },
    { 
      accessorKey: 'pers_hasil', 
      header: 'Hasil %', 
      size: 100,
      cell: (info: any) => `${Number(info.getValue() || 0).toFixed(2)}%`,
      meta: { align: 'right' }
    },
    { 
      accessorKey: 'cmd', 
      header: 'Status Komando', 
      size: 140,
      cell: (info: any) => <div dangerouslySetInnerHTML={{ __html: info.getValue() || '-' }} />,
      meta: { align: 'center' }
    },
    { accessorKey: 'kd_regu', header: 'Kode Regu', size: 140 },
    { 
      accessorKey: 'detil', 
      header: 'Opsi', 
      size: 120,
      cell: (info: any) => <div dangerouslySetInnerHTML={{ __html: info.getValue() || '-' }} />
    },
    { accessorKey: 'recid', header: 'RecID', size: 80 }
  ], []);
  // Restore state on mount with New Day Detection
  useEffect(() => {
    mountedRef.current = true;
    setIsMounted(true);

    const hydratedPeriod = hydrateScraperPeriod({ stateKey: 'orderProduksiState', periodKey: 'OrderProduksiClient_scrapedPeriod' });
    setScrapedPeriod(hydratedPeriod.scrapedPeriod);
    setStartDate(hydratedPeriod.startDate);
    setEndDate(hydratedPeriod.endDate);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        setRefreshKey(prev => prev + 1);
        router.refresh();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'alert' | 'error' | 'danger' | 'confirm', title: string, message: string}>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Fetch data
  useEffect(() => {
    let active = true;
    async function loadData() {
      if (mountedRef.current) setLoading(true);
      const startTime = performance.now();

      try {
        const res = await fetch(`/api/orders?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&from=${formatDateToYYYYMMDD(startDate)}&to=${formatDateToYYYYMMDD(endDate)}&_t=${Date.now()}`);
        if (!active) return;

        if (res.ok) {
          const json = await res.json();
          if (mountedRef.current && json.success) {
            const endTime = performance.now();
            setLoadTime(Math.round(endTime - startTime));
            
            if (page === 1) {
              setData((json.data || []).map((d: any) => {
                let parsed = {};
                if (d.raw_data) {
                  try { parsed = JSON.parse(d.raw_data); } catch(e){}
                }
                return { ...d, ...parsed };
              }));
            } else {
              setData(prev => {
                const currentData = prev || [];
                const newData = (json.data || []).map((d: any) => {
                  let parsed = {};
                  if (d.raw_data) {
                    try { parsed = JSON.parse(d.raw_data); } catch(e){}
                  }
                  return { ...d, ...parsed };
                });
                const existingIds = new Set(currentData.map((d: any) => d.id));
                const filteredNew = newData.filter((d: any) => !existingIds.has(d.id));
                return [...currentData, ...filteredNew];
              });
            }
            setTotalCount(json.total || 0);

            if (json.scrapedPeriod) {
              setScrapedPeriod(json.scrapedPeriod);
            }

            if (json.lastUpdated) {
              const latestDate = new Date(json.lastUpdated);
              if (!isNaN(latestDate.getTime())) {
                setLastUpdated(formatLastUpdate(latestDate));
              }
            } else {
              setLastUpdated(null);
            }
          }
        }
      } catch (err: any) {
        if (mountedRef.current) setError(err.message || 'Gagal memuat data');
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          isLoadingMore.current = false;
        }
      }
    }
    if (!isMounted) return;
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate, isMounted]);


  const handleFetch = async () => {
    if (!startDate || !endDate) {
      setError('Pilih tanggal mulai dan akhir terlebih dahulu.');
      return;
    }

    if (startDate > endDate) {
      setError('Tanggal mulai tidak boleh lebih dari tanggal akhir.');
      return;
    }

    // Save state to localStorage only when "Tarik Data" is clicked
    localStorage.setItem('orderProduksiState', JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sessionDate: new Date().toLocaleDateString('en-CA')
    }));

    setLoading(true);
    setError('');
    setData([]);
    setPage(1);
    setSearchQuery('');

    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    setIsBatching(true);
    setBatchProgress(0);
    
    let successCount = 0;
    let totalScraped = 0;
    let totalNewInserted = 0;
    let lastUpdatedFromScrape: string | null = null;
    let completedChunks = 0;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-orders?start=${chunk.start}&end=${chunk.end}&silent=true`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
          totalScraped += (json.total || 0);
          totalNewInserted += (json.newly_inserted || 0);
          if (json.lastUpdated) {
            lastUpdatedFromScrape = json.lastUpdated;
          }
        }
      } catch (err) {
        console.error("Chunk error:", err);
      } finally {
        completedChunks++;
        const progress = Math.round((completedChunks / chunks.length) * 100);
        setBatchProgress(progress);
        setBatchStatus(`Memproses ${completedChunks}/${chunks.length} bulan...`);
      }
    };
    
    try {
      const concurrency = 15;
      const queue = [...chunks];
      const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
        while (queue.length > 0) {
          const chunk = queue.shift();
          if (chunk) await processChunk(chunk);
        }
      });

      await Promise.all(workers);

      if (successCount > 0) {
        const periodStr = persistScraperPeriod({ stateKey: 'orderProduksiState', periodKey: 'OrderProduksiClient_scrapedPeriod' }, startDate, endDate);
        setScrapedPeriod(periodStr);
        setIsBatching(false);
        setBatchStatus('');
        setBatchProgress(0);

        await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'SCRAPE',
            table_name: 'orders',
            message: `Tarik Order Produksi Produksi (${startStr} s/d ${endStr})`,
            raw_data: JSON.stringify({ "Total Data Ditarik dari Digit": totalScraped, "Data Baru Ditambahkan": totalNewInserted })
          })
        });

        setRefreshKey(prev => prev + 1);
        
        const failCount = chunks.length - successCount;
        setDialog({
          isOpen: true,
          type: failCount > 0 ? 'alert' : 'success',
          title: failCount > 0 ? 'Selesai Sebagian' : 'Berhasil',
          message: failCount > 0 
            ? `Berhasil menarik ${totalScraped} Order Produksi dari Digit. (${failCount} bulan gagal)`
            : `Berhasil menarik ${totalScraped} Order Produksi dari Digit.`
        });

        localStorage.setItem('sintak_data_updated', Date.now().toString());

        if (lastUpdatedFromScrape) {
          const latestDate = new Date(lastUpdatedFromScrape);
          if (!isNaN(latestDate.getTime())) {
            const timestamp = latestDate.toLocaleString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
              timeZone: 'Asia/Jakarta'
            });
            setLastUpdated(timestamp);
          }
        }
      } else {
        setError("Gagal menarik data. Periksa koneksi atau log sistem.");
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err.message || 'Terjadi kesalahan saat menarik data');
    } finally {
      if (mountedRef.current) {
        setIsBatching(false);
        setLoading(false);
        setBatchStatus('');
        setBatchProgress(0);
        setRefreshKey(prev => prev + 1);
      }
    }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && !isLoadingMore.current && (data?.length || 0) < totalCount) {
      isLoadingMore.current = true;
      setPage(prev => prev + 1);
    }
  }, [loading, data, totalCount]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      <div className="bg-white rounded-[8px] border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-300 flex flex-col gap-5 shrink-0 relative z-50">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Rentang Tanggal</span>
              <div className="flex items-center gap-2">
                <div className="w-[140px] relative group">
                  <DatePicker 
                    name="startDate"
                    value={startDate}
                    onChange={setStartDate}
                  />
                </div>
                <div className="w-4 h-[1px] bg-gray-200 mx-1"></div>
                <div className="w-[140px] relative group">
                  <DatePicker 
                    name="endDate"
                    value={endDate}
                    onChange={setEndDate}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {isBatching && (
                <div className="flex flex-col items-end">
                    <div className="text-[10px] text-green-600 font-bold animate-pulse leading-none uppercase tracking-tighter">
                    {batchStatus}
                    </div>
                    <div className="w-24 h-1 bg-gray-50 rounded-full mt-1.5 overflow-hidden border border-gray-200">
                    <div 
                        className="h-full bg-green-500 transition-all duration-300" 
                        style={{ width: `${batchProgress}%` }}
                    />
                    </div>
                </div>
            )}
            
            <button 
              onClick={handleFetch}
              disabled={loading || isBatching || !startDate || !endDate}
              className="px-5 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-extrabold rounded-[8px] transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
            >
              {isBatching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} className={loading && (data?.length || 0) === 0 ? "animate-spin" : ""} />
              )}
              <span>{isBatching ? `${batchProgress}%` : 'Tarik Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-[8px] text-sm flex items-start gap-2 animate-in fade-in shrink-0">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="font-semibold">{error}</p>
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
                  <span className="opacity-40">|</span>
                  <span>Diperbarui: {lastUpdated}{scrapedPeriod ? ` (Periode: ${formatScrapedPeriodDate(scrapedPeriod.start)} s.d. ${formatScrapedPeriodDate(scrapedPeriod.end)})` : ''}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
                 {loading && (data?.length || 0) > 0 && (
                 <div className="flex items-center gap-2 text-[11px] font-bold text-green-600 animate-pulse bg-green-50 px-2.5 py-1 rounded-full border border-green-100 uppercase tracking-tighter leading-none">
                     <Loader2 size={12} className="animate-spin" />
                     <span>Memproses...</span>
                 </div>
                 )}
            </div>
          </div>

          <div className="relative w-full group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari ID, faktur, produk, atau pelanggan..." 
              className="w-full pl-12 pr-4 h-10 bg-white border border-gray-100 rounded-[8px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
          <DataTable
            columns={columns}
            data={data || []}
            isLoading={loading || data === null}
            totalCount={totalCount}
            onScroll={handleScroll}
            selectedIds={selectedIds}
            onRowClick={handleRowClick}
            columnWidths={columnWidths}
            onColumnWidthChange={setColumnWidths}
          />

          <div className="flex items-center justify-between shrink-0 px-1 mt-1">
            <span className="text-[12px] leading-none font-bold text-gray-400">
              {totalCount === 0 ? 'Tidak ada Order Produksi' : `Menampilkan ${data?.length || 0} dari ${totalCount} Order Produksi`}
            </span>
            <div className="flex items-center gap-4">
              {selectedIds.size > 0 && (
                 <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                    <span className="text-[12px] leading-none font-bold text-gray-400">{selectedIds.size} dipilih</span>
                    <button onClick={clearSelection} className="text-[12px] leading-none font-black text-rose-500 hover:text-rose-600 underline underline-offset-4">Batal</button>
                 </div>
              )}
              {loadTime !== null && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm border ${
                  loadTime < 300 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                  'bg-red-50 text-red-600 border-red-100'
                }`}>
                  <span className="animate-pulse">⚡</span>
                  <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}










