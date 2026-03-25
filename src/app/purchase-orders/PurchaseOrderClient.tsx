'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, RefreshCw, Loader2, AlertCircle, Clock, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
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
import { splitDateRangeIntoMonths } from '@/lib/date-utils';

function formatDateToYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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

export default function PurchaseOrderClient() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(2026, 0, 1));
  const [endDate, setEndDate] = useState<Date>(new Date(2026, 0, 1));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null
  });

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    tgl: 120,
    faktur: 220,
    kd_supplier: 300,
    faktur_pr: 200,
    faktur_sph: 200,
    total: 180,
    faktur_pb: 300
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

  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
      setSelectedIds(new Set()); // Reset selection when searching
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      // Remove the 'if (loading) return' to avoid skipping pulls after sync
      setLoading(true);
      const startTimer = Date.now();
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: PAGE_SIZE.toString(),
          q: debouncedQuery,
          start: formatDateToYYYYMMDD(startDate),
          end: formatDateToYYYYMMDD(endDate)
        });

        const res = await fetch(`/api/purchase-orders?${queryParams.toString()}`);
        const json = await res.json();
        
        if (active) {
          if (page === 1) {
            setData(json.data || []);
          } else {
            setData(prev => [...(prev || []), ...(json.data || [])]);
          }
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
        setLoading(false);
        isLoadingMore.current = false;
      }
    }
    if (!isMounted) return;
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate, isMounted]);

  useEffect(() => {
    setIsMounted(true);
    const todayStr = new Date().toLocaleDateString('en-CA');
    const defaultStartDate = new Date(2026, 0, 1);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let initialStart = defaultStartDate;
    let initialEnd = today;

    const saved = localStorage.getItem('poState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedDate = parsed.sessionDate || '';
        if (savedDate === todayStr) {
          initialStart = new Date(parsed.startDate);
          initialEnd = new Date(parsed.endDate);
        }
      } catch(e) {}
    }
    setStartDate(initialStart);
    setEndDate(initialEnd);
  }, []);

  const handleFetch = async () => {
    if (!startDate || !endDate) return;

    // Save state to localStorage only when "Tarik Data" is clicked
    localStorage.setItem('poState', JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sessionDate: new Date().toLocaleDateString('en-CA')
    }));

    setError('');
    setData(null);
    setPage(1);
    setIsBatching(true);
    setLoading(true);
    setSearchQuery('');
    setBatchProgress(0);

    const chunks = splitDateRangeIntoMonths(formatDateToYYYYMMDD(startDate), formatDateToYYYYMMDD(endDate));
    let successCount = 0;
    let totalScraped = 0;
    let completedChunks = 0;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-purchase-orders?start=${chunk.start}&end=${chunk.end}`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
          totalScraped += (json.total || 0);
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
      const queue = [...chunks];
      // Reduce concurrent workers for PO to avoid SQLite locking (limit to 2 workers)
      const workers = Array(Math.min(2, queue.length)).fill(null).map(async () => {
        while (queue.length > 0) {
          const chunk = queue.shift();
          if (chunk) await processChunk(chunk);
        }
      });
      await Promise.all(workers);

      if (successCount > 0) {
        setIsBatching(false);
        setRefreshKey(prev => prev + 1);
        localStorage.setItem('sikka_data_updated', Date.now().toString());

        await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'SCRAPE',
            table_name: 'purchase_orders',
            message: `Tarik Data Purchase Order (${formatDateToYYYYMMDD(startDate)} s/d ${formatDateToYYYYMMDD(endDate)})`,
            raw_data: JSON.stringify({ totalScraped })
          })
        });

        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Berhasil menarik ${totalScraped} data Purchase Order.`
        });
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('locked')) {
        setError('Database sedang sibuk (locked). Silakan coba lagi dalam beberapa detik.');
      } else {
        setError(msg || 'Gagal sinkronasi');
      }
    } finally {
      setIsBatching(false);
      setLoading(false);
    }
  };

  const [dialog, setDialog] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const toggleSelectRow = (id: number, e: React.MouseEvent) => {
    let next = new Set(selectedIds);
    const numId = Number(id);

    if (e.shiftKey && lastSelectedId !== null && paginatedData) {
      const currentIndex = paginatedData.findIndex(item => Number(item.id) === numId);
      const lastIndex = paginatedData.findIndex(item => Number(item.id) === Number(lastSelectedId));
      
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        
        if (!e.ctrlKey && !e.metaKey) next = new Set();
        for (let i = start; i <= end; i++) {
          next.add(Number(paginatedData[i].id));
        }
      }
    } else if (e.ctrlKey || e.metaKey) {
      if (next.has(numId)) next.delete(numId);
      else next.add(numId);
    } else {
      // Single click: deselect if already selected alone, otherwise select only this
      if (next.has(numId) && next.size === 1) {
        next.clear();
      } else {
        next = new Set([numId]);
      }
    }

    setSelectedIds(next);
    setLastSelectedId(numId);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 150 && !loading && data && data.length < totalCount) {
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
    let result = [...(data || [])];
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
      <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-sm flex flex-col gap-5 shrink-0 relative z-50">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Rentang Tanggal</span>
              <div className="flex items-center gap-2">
                {!isMounted ? (
                  <div className="w-[300px] h-10 bg-gray-50 animate-pulse rounded-lg" />
                ) : (
                  <>
                    <div className="w-[140px]">
                      <DatePicker value={startDate} onChange={setStartDate} name="startDate" />
                    </div>
                    <div className="w-4 h-[1px] bg-gray-200 mx-1"></div>
                    <div className="w-[140px]">
                      <DatePicker value={endDate} onChange={setEndDate} name="endDate" />
                    </div>
                  </>
                )}
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
              onClick={handleFetch}
              disabled={loading || isBatching}
              className="px-5 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
            >
              <RefreshCw size={16} className={isBatching ? "animate-spin" : ""} />
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
              <div className="flex items-center gap-2 text-[11px] font-bold text-green-600 animate-pulse bg-green-50 px-2.5 py-1 rounded-full border border-green-100 uppercase tracking-tighter leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses...</span>
              </div>
            )}
          </div>
          <div className="relative w-full group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari faktur, supplier, PR, SPH..."
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
              <div className="bg-white border border-gray-200 shadow-sm rounded-[10px] flex-1 flex flex-col min-h-0 relative overflow-hidden">
                <div className="overflow-auto custom-scrollbar flex-1 min-h-0" onScroll={handleScroll}>
                  <table className="text-left relative border-collapse table-fixed" style={{ width: totalTableWidth, minWidth: '100%' }}>
                    <thead className="sticky top-0 z-40 bg-white shadow-sm">
                      <tr>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.tgl }} onClick={() => toggleSort('tgl')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider">
                            <span className="truncate flex-1">Tanggal</span>
                            <div className="shrink-0"><SortIcon config={sortConfig} sortKey="tgl" /></div>
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('tgl', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.faktur }} onClick={() => toggleSort('faktur')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider">
                            <span className="truncate flex-1">Faktur PO</span>
                            <div className="shrink-0"><SortIcon config={sortConfig} sortKey="faktur" /></div>
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('faktur', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.kd_supplier }} onClick={() => toggleSort('kd_supplier')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider">
                            <span className="truncate flex-1">Supplier</span>
                            <div className="shrink-0"><SortIcon config={sortConfig} sortKey="kd_supplier" /></div>
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('kd_supplier', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.faktur_pr }} onClick={() => toggleSort('faktur_pr')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider">
                            <span className="truncate flex-1">Ref. PR</span>
                            <div className="shrink-0"><SortIcon config={sortConfig} sortKey="faktur_pr" /></div>
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('faktur_pr', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.faktur_sph }} onClick={() => toggleSort('faktur_sph')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider">
                            <span className="truncate flex-1">Ref. SPH</span>
                            <div className="shrink-0"><SortIcon config={sortConfig} sortKey="faktur_sph" /></div>
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('faktur_sph', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-r border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.total }} onClick={() => toggleSort('total')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider">
                            <span className="truncate flex-1">Total</span>
                            <div className="shrink-0"><SortIcon config={sortConfig} sortKey="total" /></div>
                          </div>
                          <div className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer" onMouseDown={(e) => startResizing('total', e)} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                          </div>
                        </th>
                        <th className="px-6 py-3 border-b border-gray-200 relative group cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap overflow-hidden" style={{ width: columnWidths.faktur_pb }} onClick={() => toggleSort('faktur_pb')}>
                          <div className="flex items-center gap-2 text-[12px] leading-none text-[#6b7280] font-bold tracking-wider">
                            <span className="truncate flex-1">Status Penerimaan</span>
                            <div className="shrink-0"><SortIcon config={sortConfig} sortKey="faktur_pb" /></div>
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
                          } hover:bg-green-50/20`}
                        >
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                             <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors ${isSelected ? 'text-green-700' : 'text-[#364153]'}`}>
                               {formatIndoDateStr(row.tgl)}
                             </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors ${isSelected ? 'text-green-600' : 'text-[#364153]'}`}>
                               <div dangerouslySetInnerHTML={{ __html: row.faktur || '-' }} />
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium truncate transition-colors ${isSelected ? 'text-green-800' : 'text-[#364153]'}`}>
                               {row.kd_supplier}
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
                               <div className="truncate" dangerouslySetInnerHTML={{ __html: row.faktur_pr || '-' }} />
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden">
                            <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center text-[12px] leading-none font-medium transition-colors ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
                               <div className="truncate" dangerouslySetInnerHTML={{ __html: row.faktur_sph || '-' }} />
                            </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden text-right">
                             <div className={`px-6 py-1 border-r border-gray-200 h-fit flex items-center justify-end font-medium tabular-nums text-[12px] leading-none transition-colors whitespace-nowrap ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                                <span className="shrink-0 text-gray-400 font-medium text-[10px] mr-1">Rp</span>
                                <span className="truncate">{(row.total || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                             </div>
                          </td>
                          <td className="p-0 border-b border-gray-200 whitespace-nowrap overflow-hidden truncate font-medium text-[12px] leading-none">
                             <div className={`px-6 py-1 h-fit flex items-center transition-colors ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>
                                <span className="flex items-center gap-1.5" dangerouslySetInnerHTML={{ __html: row.faktur_pb || '-' }} />
                             </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                  {data.length < totalCount && (
                    <div className="p-4 flex justify-center border-t border-gray-100 bg-gray-50/30">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest animate-pulse leading-none">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Memuat data selanjutnya...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Info Banner */}
              <div className="flex items-center justify-between shrink-0 px-1 mt-1">
                <span className="text-[12px] leading-none font-bold text-gray-400">
                  {totalCount === 0 ? 'Tidak ada data Purchase Order' : `Menampilkan ${paginatedData.length} dari ${totalCount} data Purchase Order`}
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
        onConfirm={() => setDialog({ ...dialog, isOpen: false })}
      />
    </div>
  );
}
