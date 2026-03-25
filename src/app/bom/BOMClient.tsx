'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Package, Calendar, User, Tag, Hash, RefreshCw, BarChart3, Download, Printer, Loader2, AlertCircle, Clock, ArrowUp, ArrowDown, ArrowUpDown, Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';

function SortIcon({ config, sortKey }: { config: any, sortKey: string }) {
  if (config.key !== sortKey || !config.direction) {
    return <ArrowUpDown size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
  }
  return config.direction === 'asc'
    ? <ArrowUp size={12} className="text-green-600" />
    : <ArrowDown size={12} className="text-green-600" />;
}

import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import PageHeader from '@/components/PageHeader';
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

export default function BOMClient() {
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date>(new Date(2026, 0, 1));
  const [endDate, setEndDate] = useState<Date>(new Date(2026, 0, 1));
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

  // Table state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null
  });

  // Resizable Columns State
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    id: 80,
    faktur: 220,
    faktur_tplt: 160,
    kd_cabang: 120,
    kd_gudang: 200,
    tgl: 140,
    kd_mtd: 120,
    kd_pelanggan: 200,
    nama_prd: 350,
    status: 100,
    bbb: 160,
    pers_btkl: 100,
    btkl: 160,
    pers_bop: 100,
    bop: 160,
    hp: 160,
    created_at: 160,
    username: 120,
    edited_at: 160,
    username_edited: 120,
    deleted_at: 160,
    username_deleted: 120,
    spesifikasi: 350,
    produk: 350,
    faktur_prd: 250,
    kd_barang: 160,
    qty_order: 100,
    faktur_sph: 250,
    cmd: 250,
    detil: 250,
    recid: 100
  });

  const totalTableWidth = useMemo(() => {
    return Object.values(columnWidths).reduce((a, b) => a + b, 0);
  }, [columnWidths]);

  const resizerRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const isLoadingMore = useRef(false);
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
  }, []);

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
    let active = true;
    async function loadData() {
      if (!isLoadingMore.current) setLoading(true);
      const startTimer = Date.now();
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: PAGE_SIZE.toString(),
          q: debouncedQuery,
          start: formatDateToYYYYMMDD(startDate),
          end: formatDateToYYYYMMDD(endDate)
        });

        const res = await fetch(`/api/bom?${queryParams.toString()}`);
        const json = await res.json();
        
        if (active) {
          setData(prev => {
            if (page === 1) return json.data || [];
            const existingIds = new Set(prev?.map(i => i.id) || []);
            const newData = (json.data || []).filter((i: any) => !existingIds.has(i.id));
            return [...(prev || []), ...newData];
          });
          setTotalCount(json.total || 0);
          
          if (json.lastUpdated) {
            const latestDate = new Date(json.lastUpdated);
            if (!isNaN(latestDate.getTime())) {
              setLastUpdated(latestDate.toLocaleString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
              }));
            }
          }
          setLoadTime(Date.now() - startTimer);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Gagal memuat data');
          setData([]);
        }
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

  // Sync with other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sikka_data_updated') {
        setRefreshKey(prev => prev + 1);
        router.refresh();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  const [isMounted, setIsMounted] = useState(false);

  // Restore state on mount with New Day Detection
  useEffect(() => {
    setIsMounted(true);
    const todayStr = new Date().toLocaleDateString('en-CA');
    const defaultStartDate = new Date(2026, 0, 1);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let initialStart = defaultStartDate;
    let initialEnd = today;

    const saved = localStorage.getItem('bomReportState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedDate = parsed.sessionDate || '';
        if (savedDate === todayStr) {
          initialStart = new Date(parsed.startDate);
          initialEnd = new Date(parsed.endDate);
        }
        if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
      } catch(e) {}
    }
    setStartDate(initialStart);
    setEndDate(initialEnd);
  }, []);

  const handleFetch = async () => {
    if (!startDate || !endDate) return;

    // Save state to localStorage only when "Tarik Data" is clicked
    localStorage.setItem('bomReportState', JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      lastUpdated: lastUpdated,
      sessionDate: new Date().toLocaleDateString('en-CA')
    }));

    setError('');
    setData(null);
    setPage(1);
    setSearchQuery('');

    const chunks = splitDateRangeIntoMonths(formatDateToYYYYMMDD(startDate), formatDateToYYYYMMDD(endDate));
    setIsBatching(true);
    setLoading(true);
    setBatchProgress(0);

    let successCount = 0;
    let totalScraped = 0;
    let completedChunks = 0;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-bom?start=${chunk.start}&end=${chunk.end}`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
          totalScraped += (json.total || 0);
          if (json.lastUpdated) {
            setLastUpdated(new Date(json.lastUpdated).toLocaleString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            }));
          }
        }
      } catch (err) {
        console.error("Chunk error:", err);
      } finally {
        completedChunks++;
        setBatchProgress(Math.round((completedChunks / chunks.length) * 100));
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
        setIsBatching(false);
        setBatchStatus('');
        setBatchProgress(0);

        // Post activity log
        const fullStart = formatDateToYYYYMMDD(startDate);
        const fullEnd = formatDateToYYYYMMDD(endDate);
        await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'SCRAPE',
            table_name: 'bom',
            message: `Tarik Data Bill of Material (${fullStart} s/d ${fullEnd})`,
            raw_data: JSON.stringify({ "Total Data Ditarik dari Digit": totalScraped })
          })
        });

        setRefreshKey(prev => prev + 1);
        localStorage.setItem('sikka_data_updated', Date.now().toString());
        
        const failCount = chunks.length - successCount;
        setDialog({
          isOpen: true,
          type: failCount > 0 ? 'alert' : 'success',
          title: failCount > 0 ? 'Selesai Sebagian' : 'Berhasil',
          message: failCount > 0 
            ? `Berhasil menarik ${totalScraped} data Bill of Material dari Digit. (${failCount} bulan gagal)`
            : `Berhasil menarik ${totalScraped} data Bill of Material dari Digit.`
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal sinkronasi');
    } finally {
      setIsBatching(false);
      setLoading(false);
    }
  };

  const [dialog, setDialog] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const toggleSelectRow = (id: number, e: React.MouseEvent) => {
    const newSelected = new Set(selectedIds);
    if (e.shiftKey && lastSelectedId !== null && data) {
      const startIdx = data.findIndex(i => i.id === lastSelectedId);
      const endIdx = data.findIndex(i => i.id === id);
      if (startIdx !== -1 && endIdx !== -1) {
        const [min, max] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
        for (let i = min; i <= max; i++) newSelected.add(data[i].id);
      }
    } else {
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setLastSelectedId(id);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 150 && !loading && !isLoadingMore.current && data && data.length < totalCount) {
      isLoadingMore.current = true;
      setPage(prev => prev + 1);
    }
  };

  const toggleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key, direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  const paginatedData = useMemo(() => {
    let result = [...(data || [])].map(item => {
      let parsed = {};
      if (item.raw_data) {
        try { parsed = JSON.parse(item.raw_data); } catch(e){}
      }
      return { ...item, ...parsed };
    });
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key!];
        let bValue = b[sortConfig.key!];
        if (sortConfig.key === 'tgl') {
          const pa = String(aValue).split('-');
          const pb = String(bValue).split('-');
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

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-sm flex flex-col gap-5 shrink-0 relative z-50">
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
              className="px-5 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
            >
              {isBatching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} className={loading && data === null ? "animate-spin" : ""} />
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
      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-4">
              <h3 className="text-15px font-extrabold text-gray-800 flex items-center gap-2 leading-none">
                <Clock size={18} className="text-green-600" />
                <span>Hasil Scrapping</span>
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-[12px] font-medium leading-none" style={{ color: '#99a1af' }}>
                  <span className="opacity-40">|</span>
                  <span>Diperbarui: {lastUpdated}</span>
                </div>
              )}
            </div>

            {loading && data !== null && (
              <div className="text-[11px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 animate-pulse uppercase tracking-tighter leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses...</span>
              </div>
            )}
          </div>

          <div className="relative w-full group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari faktur, produk, pelanggan..."
              className="w-full pl-12 pr-4 h-10 bg-white border border-gray-200 rounded-[14px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table & Footer Wrapper */}
        <div className="flex-1 flex flex-col min-h-0 gap-2 overflow-hidden">
          {data === null ? (
            <div className="flex-1 bg-white border border-gray-200 rounded-[10px] shadow-sm overflow-hidden flex flex-col min-h-0">
              <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-3.5 flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              <div className="flex-1 p-5 space-y-4">
                 {Array(10).fill(0).map((_, i) => (
                   <div key={i} className="flex items-center gap-4 w-full">
                     <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
                     <div className="h-4 flex-1 bg-gray-50 rounded animate-pulse"></div>
                     <div className="h-4 w-40 bg-gray-100 rounded animate-pulse"></div>
                     <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                   </div>
                 ))}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white border border-gray-200 shadow-sm rounded-[10px] overflow-hidden flex-1 flex flex-col min-h-0 relative">
                <div className="overflow-auto custom-scrollbar flex-1 min-h-0" onScroll={handleScroll}>
                  <table className="text-left relative border-collapse table-fixed" style={{ width: totalTableWidth, minWidth: '100%' }}>
                    <thead className="sticky top-0 z-20 bg-white shadow-sm">
                      <tr>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.id }} onClick={() => toggleSort('id')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">ID</span>
                            <SortIcon config={sortConfig} sortKey="id" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('id', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.faktur }} onClick={() => toggleSort('faktur')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Faktur</span>
                            <SortIcon config={sortConfig} sortKey="faktur" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('faktur', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.faktur_tplt }} onClick={() => toggleSort('faktur_tplt')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Faktur TPLT</span>
                            <SortIcon config={sortConfig} sortKey="faktur_tplt" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('faktur_tplt', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.kd_cabang }} onClick={() => toggleSort('kd_cabang')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Kode Cabang</span>
                            <SortIcon config={sortConfig} sortKey="kd_cabang" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('kd_cabang', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.kd_gudang }} onClick={() => toggleSort('kd_gudang')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Kode Gudang</span>
                            <SortIcon config={sortConfig} sortKey="kd_gudang" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('kd_gudang', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.tgl }} onClick={() => toggleSort('tgl')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Tanggal</span>
                            <SortIcon config={sortConfig} sortKey="tgl" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('tgl', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.kd_mtd }} onClick={() => toggleSort('kd_mtd')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Kode MTD</span>
                            <SortIcon config={sortConfig} sortKey="kd_mtd" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('kd_mtd', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.kd_pelanggan }} onClick={() => toggleSort('kd_pelanggan')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Kode Pelanggan</span>
                            <SortIcon config={sortConfig} sortKey="kd_pelanggan" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('kd_pelanggan', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.nama_prd }} onClick={() => toggleSort('nama_prd')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Nama PRD</span>
                            <SortIcon config={sortConfig} sortKey="nama_prd" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('nama_prd', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.status }} onClick={() => toggleSort('status')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Status</span>
                            <SortIcon config={sortConfig} sortKey="status" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('status', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.bbb }} onClick={() => toggleSort('bbb')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">BBB</span>
                            <SortIcon config={sortConfig} sortKey="bbb" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('bbb', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.pers_btkl }} onClick={() => toggleSort('pers_btkl')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">% BTKL</span>
                            <SortIcon config={sortConfig} sortKey="pers_btkl" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('pers_btkl', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.btkl }} onClick={() => toggleSort('btkl')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">BTKL</span>
                            <SortIcon config={sortConfig} sortKey="btkl" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('btkl', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.pers_bop }} onClick={() => toggleSort('pers_bop')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">% BOP</span>
                            <SortIcon config={sortConfig} sortKey="pers_bop" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('pers_bop', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.bop }} onClick={() => toggleSort('bop')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">BOP</span>
                            <SortIcon config={sortConfig} sortKey="bop" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('bop', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.hp }} onClick={() => toggleSort('hp')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">HP</span>
                            <SortIcon config={sortConfig} sortKey="hp" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('hp', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.created_at }} onClick={() => toggleSort('created_at')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Created At</span>
                            <SortIcon config={sortConfig} sortKey="created_at" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('created_at', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.username }} onClick={() => toggleSort('username')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Username</span>
                            <SortIcon config={sortConfig} sortKey="username" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('username', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.edited_at }} onClick={() => toggleSort('edited_at')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Edited At</span>
                            <SortIcon config={sortConfig} sortKey="edited_at" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('edited_at', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.username_edited }} onClick={() => toggleSort('username_edited')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Username Edited</span>
                            <SortIcon config={sortConfig} sortKey="username_edited" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('username_edited', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.deleted_at }} onClick={() => toggleSort('deleted_at')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Deleted At</span>
                            <SortIcon config={sortConfig} sortKey="deleted_at" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('deleted_at', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.username_deleted }} onClick={() => toggleSort('username_deleted')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Username Deleted</span>
                            <SortIcon config={sortConfig} sortKey="username_deleted" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('username_deleted', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.spesifikasi }} onClick={() => toggleSort('spesifikasi')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Spesifikasi</span>
                            <SortIcon config={sortConfig} sortKey="spesifikasi" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('spesifikasi', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.produk }} onClick={() => toggleSort('produk')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Produk</span>
                            <SortIcon config={sortConfig} sortKey="produk" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('produk', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.faktur_prd }} onClick={() => toggleSort('faktur_prd')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Faktur PRD</span>
                            <SortIcon config={sortConfig} sortKey="faktur_prd" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('faktur_prd', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.kd_barang }} onClick={() => toggleSort('kd_barang')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Kode Barang</span>
                            <SortIcon config={sortConfig} sortKey="kd_barang" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('kd_barang', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.qty_order }} onClick={() => toggleSort('qty_order')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">QTY Order</span>
                            <SortIcon config={sortConfig} sortKey="qty_order" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('qty_order', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.faktur_sph }} onClick={() => toggleSort('faktur_sph')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Faktur SPH</span>
                            <SortIcon config={sortConfig} sortKey="faktur_sph" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('faktur_sph', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.cmd }} onClick={() => toggleSort('cmd')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Aksi</span>
                            <SortIcon config={sortConfig} sortKey="cmd" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('cmd', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.detil }} onClick={() => toggleSort('detil')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Detail</span>
                            <SortIcon config={sortConfig} sortKey="detil" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('detil', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.recid }} onClick={() => toggleSort('recid')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider overflow-hidden">
                            <span className="truncate">Recid</span>
                            <SortIcon config={sortConfig} sortKey="recid" />
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('recid', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        </tr>
                    </thead>
                    <tbody className="">
                      {paginatedData.map((row, idx) => {
                        const isSelected = selectedIds.has(row.id);
                        return (
                        <tr 
                          key={row.id || idx} 
                          onClick={(e) => toggleSelectRow(row.id, e)}
                          className={`transition-all duration-150 group h-9 cursor-pointer select-none border-b border-gray-200 ${
                            isSelected ? 'bg-green-50 shadow-[inset_4px_0_0_0_#16a34a]' : idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                          } hover:bg-green-50/40`}
                        >
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.id || ''}>
                              {row.id || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.faktur || ''}>
                              {row.faktur || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.faktur_tplt || ''}>
                              {row.faktur_tplt || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.kd_cabang || ''}>
                              {row.kd_cabang || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.kd_gudang || ''}>
                              {row.kd_gudang || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.tgl || ''}>
                              {formatIndoDateStr(row.tgl)}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.kd_mtd || ''}>
                              {row.kd_mtd || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.kd_pelanggan || ''}>
                              {row.kd_pelanggan || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.nama_prd || ''}>
                              {row.nama_prd || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.status || ''}>
                              {row.status || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors text-right justify-end w-full tabular-nums ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.bbb || ''}>
                               <div className="flex items-baseline justify-between gap-1 w-full overflow-hidden">
                                 <span className={`text-[10px] font-medium shrink-0 ${isSelected ? 'text-green-400' : 'text-gray-300'}`}>Rp</span>
                                 <span className="truncate">{Number(row.bbb || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                               </div>
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors text-right justify-end w-full tabular-nums ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.pers_btkl || ''}>
                              {Number(row.pers_btkl || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors text-right justify-end w-full tabular-nums ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.btkl || ''}>
                               <div className="flex items-baseline justify-between gap-1 w-full overflow-hidden">
                                 <span className={`text-[10px] font-medium shrink-0 ${isSelected ? 'text-green-400' : 'text-gray-300'}`}>Rp</span>
                                 <span className="truncate">{Number(row.btkl || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                               </div>
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors text-right justify-end w-full tabular-nums ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.pers_bop || ''}>
                              {Number(row.pers_bop || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors text-right justify-end w-full tabular-nums ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.bop || ''}>
                               <div className="flex items-baseline justify-between gap-1 w-full overflow-hidden">
                                 <span className={`text-[10px] font-medium shrink-0 ${isSelected ? 'text-green-400' : 'text-gray-300'}`}>Rp</span>
                                 <span className="truncate">{Number(row.bop || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                               </div>
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors text-right justify-end w-full tabular-nums ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.hp || ''}>
                               <div className="flex items-baseline justify-between gap-1 w-full overflow-hidden">
                                 <span className={`text-[10px] font-medium shrink-0 ${isSelected ? 'text-green-400' : 'text-gray-300'}`}>Rp</span>
                                 <span className="truncate">{Number(row.hp || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                               </div>
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.created_at || ''}>
                              {row.created_at || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.username || ''}>
                              {row.username || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.edited_at || ''}>
                              {row.edited_at || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.username_edited || ''}>
                              {row.username_edited || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.deleted_at || ''}>
                              {row.deleted_at || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.username_deleted || ''}>
                              {row.username_deleted || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                               <span dangerouslySetInnerHTML={{ __html: row.spesifikasi || '–' }} />
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.produk || ''}>
                              {row.produk || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                               <span dangerouslySetInnerHTML={{ __html: row.faktur_prd || '–' }} />
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.kd_barang || ''}>
                              {row.kd_barang || '–'}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors text-right justify-end w-full tabular-nums ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.qty_order || ''}>
                              {Number(row.qty_order || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                               <span dangerouslySetInnerHTML={{ __html: row.faktur_sph || '–' }} />
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors text-center justify-center w-full ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                               <span dangerouslySetInnerHTML={{ __html: row.cmd || '–' }} />
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors text-center justify-center w-full ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                               <span dangerouslySetInnerHTML={{ __html: row.detil || '–' }} />
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`} title={row.recid || ''}>
                              {row.recid || '–'}
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Info Banner */}
              <div className="flex items-center justify-between shrink-0 px-1 mt-1">
                <span className="text-[12px] leading-none font-bold text-gray-400">
                  {totalCount === 0 ? 'Tidak ada data BOM' : `Menampilkan ${paginatedData.length} dari ${totalCount} Bill of Materials`}
                </span>
                <div className="flex items-center gap-4">
                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                      <span className="text-[12px] leading-none font-bold text-gray-400">{selectedIds.size} dipilih</span>
                      <button onClick={() => setSelectedIds(new Set())} className="text-[12px] leading-none font-black text-rose-500 hover:text-rose-600 underline underline-offset-4">Batal</button>
                    </div>
                  )}
                  {loadTime !== null && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm border ${
                      loadTime < 300 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      <span className="animate-pulse">⚡</span>
                      <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
                    </span>
                  )}
                  {loading && page > 1 && (
                    <div className="flex items-center gap-2 text-green-600 font-bold text-[11px] animate-pulse">
                      <Loader2 size={12} className="animate-spin" />
                      <span>Memuat...</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
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
