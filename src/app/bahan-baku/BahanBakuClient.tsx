'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Package, Hash, Calendar, Loader2, Download, Search, AlertCircle, ChevronLeft, ChevronRight, Clock, Box, RefreshCw, BarChart3, Printer, User, Tag, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

function SortIcon({ config, sortKey }: { config: any, sortKey: string }) {
  if (config.key !== sortKey || !config.direction) {
    return <ArrowUpDown size={12} className="text-gray-300 transition-opacity" />;
  }
  return config.direction === 'asc' 
    ? <ArrowUp size={12} className="text-green-600" /> 
    : <ArrowDown size={12} className="text-green-600" />;
}

import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import { splitDateRangeIntoMonths } from '@/lib/date-utils';

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

export default function BahanBakuClient() {
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const mountedRef = useRef(true);

  // Table state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null
  });

  // Resizable Columns State
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    tgl: 110,
    faktur: 120,
    faktur_prd: 120,
    nama_barang: 300,
    qty: 80,
    satuan: 80,
    hp: 120,
    nama_prd: 140
  });

  const totalTableWidth = useMemo(() => {
    return Object.values(columnWidths).reduce((a, b) => a + b, 0);
  }, [columnWidths]);

  const resizerRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const isResizingDone = useRef(false);
  const widthsRef = useRef(columnWidths);
  
  useEffect(() => {
    widthsRef.current = columnWidths;
  }, [columnWidths]);

  const startResizing = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizerRef.current = {
      key,
      startX: e.pageX,
      startWidth: widthsRef.current[key] || 0
    };
    document.addEventListener('mousemove', onResizing);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, [columnWidths]);

  const onResizing = useCallback((e: MouseEvent) => {
    if (!resizerRef.current) return;
    const { key, startX, startWidth } = resizerRef.current;
    const delta = e.pageX - startX;
    setColumnWidths(prev => ({
      ...prev,
      [key]: Math.max(50, startWidth + delta)
    }));
  }, []);

  const stopResizing = useCallback(() => {
    resizerRef.current = null;
    isResizingDone.current = true;
    setTimeout(() => { isResizingDone.current = false; }, 100);
    document.removeEventListener('mousemove', onResizing);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, [onResizing]);

  // Batch states
  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Sync with other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sikka_data_updated') {
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

  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'error' | 'danger' | 'confirm' | 'alert', title: string, message: string}>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Fetch data
  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      const startTime = performance.now();
      try {
        const res = await fetch(`/api/bahan-baku?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&from=${formatDateToYYYYMMDD(startDate)}&to=${formatDateToYYYYMMDD(endDate)}&_t=${Date.now()}`);
        if (res.ok && active) {
          const json = await res.json();
          const endTime = performance.now();
          setLoadTime(Math.round(endTime - startTime));
          setData(prev => page === 1 ? (json.data || []) : [...(prev || []), ...(json.data || [])]);
          setTotalCount(json.total || 0);

          if (json.lastUpdated) {
            const latestDate = new Date(json.lastUpdated);
            if (!isNaN(latestDate.getTime())) {
              const timestamp = latestDate.toLocaleString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
              });
              setLastUpdated(timestamp);
            } else {
              setLastUpdated(null);
            }
          } else {
            setLastUpdated(null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate]);

  // Restore state on mount
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const saved = localStorage.getItem('bahanBakuState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const sessionDate = parsed.sessionDate ? new Date(parsed.sessionDate) : null;
        if (sessionDate) sessionDate.setHours(0, 0, 0, 0);

        // Jika ganti hari, paksa ke hari ini. Jika hari yang sama, gunakan yang tersimpan.
        if (!sessionDate || sessionDate.getTime() !== today.getTime()) {
          setStartDate(today);
          setEndDate(today);
        } else {
          if (parsed.startDate) setStartDate(new Date(parsed.startDate));
          if (parsed.endDate) setEndDate(new Date(parsed.endDate));
        }

        if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
      } catch(e) {}
    } else {
      setStartDate(today);
      setEndDate(today);
    }
  }, []);

  const handleFetch = async () => {
    if (!startDate || !endDate) {
      setError('Pilih tanggal mulai dan akhir terlebih dahulu.');
      return;
    }

    if (startDate > endDate) {
      setError('Tanggal mulai tidak boleh lebih dari tanggal akhir.');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);
    setPage(1);
    setSearchQuery('');

    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    setIsBatching(true);
    setLoading(true);
    setBatchProgress(0);
    
    let successCount = 0;
    let totalScraped = 0;
    let totalNewInserted = 0;
    let lastUpdatedFromScrape: string | null = null;
    let completedChunks = 0;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-bahan-baku?start=${chunk.start}&end=${chunk.end}&silent=true`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
          totalScraped += (json.total || 0);
          totalNewInserted += (json.newly_inserted || 0);
          if (json.lastUpdated) {
            lastUpdatedFromScrape = json.lastUpdated;
          }
        } else {
          console.error(`Failed to scrape chunk: ${chunk.start} - ${chunk.end}`);
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
      // Parallel execution with concurrency limit 15 (Pol Mentok)
      const concurrency = 15;
      const queue = [...chunks];
      const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
        while (queue.length > 0) {
          const chunk = queue.shift();
          if (chunk) await processChunk(chunk);
        }
      });

      await Promise.all(workers);
      
      setBatchProgress(100);
      setBatchStatus('Selesai! Memperbarui tampilan...');
      
      if (successCount > 0) {
        // Clear batch state immediately before dialog to avoid stuck UI
        setIsBatching(false);
        setBatchStatus('');
        setBatchProgress(0);

        // Post one summary log for the full range
        await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'SCRAPE',
            table_name: 'bahan_baku',
            message: `Tarik Data Bahan Baku Produksi (${startStr} s/d ${endStr})`,
            raw_data: JSON.stringify({ "Total Data Ditarik dari Digit": totalScraped, "Data Baru Ditambahkan": totalNewInserted })
          })
        });

        // Trigger refresh
        setRefreshKey(prev => prev + 1);
        
        const failCount = chunks.length - successCount;
        const message = failCount > 0 
          ? `Selesai dengan catatan: ${successCount} bulan berhasil, ${failCount} bulan gagal.` 
          : `Berhasil menarik data untuk ${successCount} periode (Parallel Sync).`;
        
        setDialog({
          isOpen: true,
          type: failCount > 0 ? 'alert' : 'success',
          title: failCount > 0 ? 'Selesai Sebagian' : 'Berhasil',
          message: message
        });

        localStorage.setItem('sikka_data_updated', Date.now().toString());

        if (lastUpdatedFromScrape) {
          const latestDate = new Date(lastUpdatedFromScrape);
          if (!isNaN(latestDate.getTime())) {
            const timestamp = latestDate.toLocaleString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            setLastUpdated(timestamp);

            localStorage.setItem('bahanBakuState', JSON.stringify({
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              lastUpdated: timestamp,
              sessionDate: new Date().toISOString()
            }));
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
        setBatchProgress(0); // Clear progress when done
        setRefreshKey(prev => prev + 1);
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset page on search
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && !loading) {
      if (data && data.length < totalCount) {
        setPage(prev => prev + 1);
      }
    }
  };

  const toggleSort = (key: string) => {
    if (isResizingDone.current) return;
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key, direction: null };
        return { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const toggleSelectRow = (id: number, e: React.MouseEvent) => {
    let next = new Set(selectedIds);
    if (e.shiftKey && lastSelectedId !== null && data) {
      const currentIndex = data.findIndex((o: any) => o.id === id);
      const lastIndex = data.findIndex((o: any) => o.id === lastSelectedId);
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        for (let i = start; i <= end; i++) {
          next.add(data[i].id);
        }
      }
    } else if (e.ctrlKey || e.metaKey) {
      if (next.has(id)) next.delete(id);
      else next.add(id);
    } else {
      // Single click (no modifier)
      if (next.has(id)) {
        // If already selected, deselect (toggle off)
        next.clear();
      } else {
        next.clear();
        next.add(id);
      }
    }
    setLastSelectedId(id);
    setSelectedIds(next);
  };

  const paginatedData = useMemo(() => {
    let result = [...(data || [])];
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key!];
        let bValue = b[sortConfig.key!];
        if (sortConfig.key === 'tgl') {
          const pa = aValue ? String(aValue).split('-') : [];
          const pb = bValue ? String(bValue).split('-') : [];
          aValue = pa.length === 3 ? `${pa[2]}${pa[1]}${pa[0]}` : aValue;
          bValue = pb.length === 3 ? `${pb[2]}${pb[1]}${pb[0]}` : bValue;
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, sortConfig]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-[16px] border border-gray-100 p-5 shadow-sm flex flex-col gap-5 shrink-0 relative z-20">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Rentang Tanggal</span>
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
                <div className="w-24 h-1 bg-gray-50 rounded-full mt-1.5 overflow-hidden border border-gray-100">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300" 
                    style={{ width: `${batchProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            <button 
              key={isBatching ? "btn-syncing" : "btn-idle"}
              onClick={handleFetch}
              disabled={loading || isBatching || !startDate || !endDate}
              className="px-5 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
            >
              {isBatching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              )}
              <span>{isBatching ? `${batchProgress}%` : 'Tarik Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm flex items-start gap-2 animate-in fade-in shrink-0">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Results View */}
      <div className="flex-1 flex flex-col gap-5 overflow-hidden min-h-0 relative">
        {/* Results Header & Search */}
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-15px font-extrabold text-gray-800 flex items-center gap-2">
                <Clock size={18} className="text-green-600" />
                <span>Hasil Scrapping</span>
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-[12px] text-gray-400 font-medium">
                  <span className="text-gray-200">|</span>
                  <span>Diperbarui: {lastUpdated}</span>
                </div>
              )}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                  <span className="text-gray-200">|</span>
                  <span className="text-[11px] font-bold text-gray-400">{selectedIds.size} dipilih</span>
                  <button 
                    onClick={() => setSelectedIds(new Set())}
                    className="text-[11px] font-black text-rose-500 hover:text-rose-600 underline underline-offset-4"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
            
            {loading && data !== null && (
              <div className="flex items-center gap-2 text-[11px] font-bold text-green-600 animate-pulse bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses...</span>
              </div>
            )}
          </div>

          <div className="relative w-full group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari faktur, barang, supplier..." 
              className="w-full pl-12 pr-4 h-12 bg-white border border-gray-200 rounded-[14px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        {data === null && !loading ? (
          <div className="flex-1 bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[10px] flex flex-col items-center justify-center text-center p-10">
            <Loader2 size={40} className="text-green-200 animate-spin mb-4" />
            <p className="text-sm font-bold text-gray-400">Sedang memuat data dari database...</p>
          </div>
        ) : data === null && loading ? (
          <div className="flex-1 bg-white border border-gray-100 rounded-[10px] shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3.5 flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="flex-1 p-5 space-y-4">
               {Array(7).fill(0).map((_, i) => (
                 <div key={i} className="flex items-center gap-4 w-full">
                   <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
                   <div className="h-4 flex-1 bg-gray-50 rounded animate-pulse"></div>
                   <div className="h-4 w-40 bg-gray-100 rounded animate-pulse"></div>
                   <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                 </div>
               ))}
            </div>
          </div>
        ) : data && data.length === 0 ? (
          <div className="flex-1 bg-white border border-gray-200 rounded-[10px] flex flex-col items-center justify-center text-center p-20 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-5">
              <Search className="text-gray-200" size={32} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">Tidak ada data ditemukan</h3>
            <p className="text-[12px] text-gray-400 max-w-[260px] mx-auto leading-relaxed font-medium">
              Coba sesuaikan kata kunci pencarian atau ganti rentang tanggal periode di atas.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 shadow-sm rounded-[10px] overflow-hidden flex-1 flex flex-col min-h-0 relative">
              <div className="overflow-auto custom-scrollbar flex-1 min-h-0" onScroll={handleScroll}>
                <table 
                  className="text-left relative border-collapse table-fixed" 
                  style={{ width: totalTableWidth, minWidth: '100%' }}
                >
                  <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                    <tr className="text-[13px] text-gray-400 font-bold uppercase tracking-wider">
                      <th 
                        className="px-5 py-3.5 border-r border-gray-100 border-r border-gray-100 relative group/h cursor-pointer hover:bg-gray-100 transition-colors" 
                        style={{ width: columnWidths.tgl }}
                        onClick={() => toggleSort('tgl')}
                      >
                        <div className="flex items-center gap-2 nowrap overflow-hidden">TANGGAL <SortIcon config={sortConfig} sortKey="tgl" /></div>
                        <div 
                          className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                          onMouseDown={(e) => startResizing('tgl', e)} 
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                        </div>
                      </th>
                      <th 
                        className="px-5 py-3.5 border-r border-gray-100 relative group/h cursor-pointer hover:bg-gray-100 transition-colors" 
                        style={{ width: columnWidths.faktur }}
                        onClick={() => toggleSort('faktur')}
                      >
                        <div className="flex items-center gap-2 nowrap overflow-hidden">FAKTUR <SortIcon config={sortConfig} sortKey="faktur" /></div>
                        <div 
                          className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                          onMouseDown={(e) => startResizing('faktur', e)} 
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                        </div>
                      </th>
                      <th 
                        className="px-5 py-3.5 border-r border-gray-100 relative group/h cursor-pointer hover:bg-gray-100 transition-colors" 
                        style={{ width: columnWidths.faktur_prd }}
                        onClick={() => toggleSort('faktur_prd')}
                      >
                        <div className="flex items-center gap-2 nowrap overflow-hidden">FAKTUR PRD <SortIcon config={sortConfig} sortKey="faktur_prd" /></div>
                        <div 
                          className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                          onMouseDown={(e) => startResizing('faktur_prd', e)} 
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                        </div>
                      </th>
                      <th 
                        className="px-5 py-3.5 border-r border-gray-100 relative group/h cursor-pointer hover:bg-gray-100 transition-colors" 
                        style={{ width: columnWidths.nama_barang }}
                        onClick={() => toggleSort('nama_barang')}
                      >
                        <div className="flex items-center gap-2 nowrap overflow-hidden">NAMA BARANG <SortIcon config={sortConfig} sortKey="nama_barang" /></div>
                        <div 
                          className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                          onMouseDown={(e) => startResizing('nama_barang', e)} 
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                        </div>
                      </th>
                      <th 
                        className="px-5 py-3.5 border-r border-gray-100 relative group/h text-right cursor-pointer hover:bg-gray-100 transition-colors" 
                        style={{ width: columnWidths.qty }}
                        onClick={() => toggleSort('qty')}
                      >
                        <div className="flex items-center justify-end gap-2 nowrap overflow-hidden">QTY <SortIcon config={sortConfig} sortKey="qty" /></div>
                        <div 
                          className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                          onMouseDown={(e) => startResizing('qty', e)} 
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                        </div>
                      </th>
                      <th 
                        className="px-5 py-3.5 border-r border-gray-100 relative group/h cursor-pointer hover:bg-gray-100 transition-colors" 
                        style={{ width: columnWidths.satuan }}
                        onClick={() => toggleSort('satuan')}
                      >
                        <div className="flex items-center gap-2 nowrap overflow-hidden">SATUAN <SortIcon config={sortConfig} sortKey="satuan" /></div>
                        <div 
                          className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                          onMouseDown={(e) => startResizing('satuan', e)} 
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                        </div>
                      </th>
                      <th 
                        className="px-5 py-3.5 border-r border-gray-100 relative group/h text-right cursor-pointer hover:bg-gray-100 transition-colors" 
                        style={{ width: columnWidths.hp }}
                        onClick={() => toggleSort('hp')}
                      >
                        <div className="flex items-center justify-end gap-2 nowrap overflow-hidden">HPP <SortIcon config={sortConfig} sortKey="hp" /></div>
                        <div 
                          className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                          onMouseDown={(e) => startResizing('hp', e)} 
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                        </div>
                      </th>
                      <th 
                        className="px-5 py-3.5 border-r border-gray-100 relative group/h cursor-pointer hover:bg-gray-100 transition-colors" 
                        style={{ width: columnWidths.nama_prd }}
                        onClick={() => toggleSort('nama_prd')}
                      >
                        <div className="flex items-center gap-2 nowrap overflow-hidden">PRD <SortIcon config={sortConfig} sortKey="nama_prd" /></div>
                        <div 
                          className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                          onMouseDown={(e) => startResizing('nama_prd', e)} 
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedData.map((item: any, idx) => {
                      const isSelected = selectedIds.has(item.id);
                      return (
                      <tr 
                        key={item.id || idx} 
                        onClick={(e) => toggleSelectRow(item.id, e)}
                        className={`transition-all duration-150 group h-11 cursor-pointer select-none border-b border-gray-100 ${
                          isSelected ? 'bg-green-50 shadow-[inset_4px_0_0_0_#16a34a]' : idx % 2 === 1 ? 'bg-slate-50/20' : 'bg-white'
                        } hover:bg-green-50/40`}
                      >
                        <td className={`px-5 py-1 border-r border-gray-100 text-[13px] font-bold whitespace-nowrap transition-colors ${isSelected ? 'text-green-700' : 'text-gray-400'}`}>
                          {formatIndoDateStr(item.tgl)}
                        </td>
                        <td className={`px-5 py-1 border-r border-gray-100 text-[13px] font-bold tracking-tight transition-colors ${isSelected ? 'text-green-600' : 'text-gray-700 group-hover:text-gray-900'}`}>
                          {item.faktur || '-'}
                        </td>
                        <td className={`px-5 py-1 border-r border-gray-100 text-[13px] font-bold tracking-tight transition-colors ${isSelected ? 'text-green-500' : 'text-gray-500 group-hover:text-gray-700'}`}>
                          {item.faktur_prd || '-'}
                        </td>
                        <td className={`px-5 py-1 border-r border-gray-100 font-bold text-[13px] transition-colors nowrap overflow-hidden ${isSelected ? 'text-green-800' : 'text-gray-700 group-hover:text-gray-900'}`}>
                          {item.nama_barang}
                        </td>
                        <td className={`px-5 py-1 border-r border-gray-100 text-right font-extrabold text-[13px] transition-colors nowrap overflow-hidden ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>
                          {Number(item.qty).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`px-5 py-1 border-r border-gray-100 text-[13px] font-bold transition-colors nowrap overflow-hidden ${isSelected ? 'text-green-500' : 'text-gray-400'}`}>
                          {item.satuan}
                        </td>
                        <td className={`px-5 py-1 border-r border-gray-100 text-right font-bold text-[13px] tabular-nums transition-colors nowrap overflow-hidden ${isSelected ? 'text-green-700' : 'text-gray-700 group-hover:text-gray-900'}`}>
                          {item.hp ? item.hp.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className={`px-5 py-1 text-[13px] font-bold transition-colors nowrap overflow-hidden ${isSelected ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'}`}>
                          {item.nama_prd}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer info Banner */}
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[12px] font-bold text-gray-400">
                {totalCount === 0
                  ? 'Tidak ada data tersedia'
                  : `Menampilkan ${paginatedData.length} dari ${totalCount} data bahan baku`}
              </span>
              <div className="flex items-center gap-4">
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-bold text-gray-400">{selectedIds.size} dipilih</span>
                    <button 
                      onClick={() => setSelectedIds(new Set())}
                      className="text-[12px] font-black text-rose-500 hover:text-rose-600 underline underline-offset-4"
                    >
                      Batal
                    </button>
                  </div>
                )}
                {loadTime !== null && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm border ${
                    loadTime < 300 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                    'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    <span className="animate-pulse">⚡</span>
                    <span>{loadTime}ms</span>
                  </span>
                )}
                {loading && page > 1 && (
                  <div className="flex items-center gap-2 text-green-600 font-bold text-[11px] animate-pulse">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Memuat hal. berikutnya...</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <ConfirmDialog 
        isOpen={dialog.isOpen}
        type={dialog.type as any}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
