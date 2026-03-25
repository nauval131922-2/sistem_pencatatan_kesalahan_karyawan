'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, Search, AlertCircle, Clock, RefreshCw 
} from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import { splitDateRangeIntoMonths } from '@/lib/date-utils';
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

export default function SalesOrderClient() {
  const router = useRouter();
  const mountedRef = useRef(true);
  
  // State
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(2025, 0, 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
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
      const saved = localStorage.getItem('salesOrder_columnWidths');
      return saved ? JSON.parse(saved) : {
        tgl: 120,
        faktur: 180,
        nama_pelanggan: 280,
        nama_prd: 350,
        qty: 110,
        satuan: 100,
        jumlah: 180,
        faktur_sph: 180,
        faktur_prd: 180,
        keterangan: 300
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('salesOrder_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 100);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Columns Definition
  const columns = useMemo(() => [
    { 
        accessorKey: 'tgl', 
        header: 'Tanggal', 
        cell: (info: any) => formatIndoDateStr(info.getValue()) 
    },
    { accessorKey: 'faktur', header: 'Faktur SO' },
    { accessorKey: 'nama_pelanggan', header: 'Pelanggan', size: 280 },
    { accessorKey: 'nama_prd', header: 'Nama Barang', size: 350 },
    { 
        accessorKey: 'qty', 
        header: 'QTY', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { accessorKey: 'satuan', header: 'Satuan' },
    { 
        accessorKey: 'jumlah', 
        header: 'Jumlah', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { accessorKey: 'faktur_sph', header: 'Faktur SPH' },
    { accessorKey: 'faktur_prd', header: 'Faktur PRD' },
    { accessorKey: 'keterangan', header: 'Keterangan', size: 300 }
  ], []);

  // Sync with other tabs
  useEffect(() => {
    mountedRef.current = true;
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

  // Persistence
  useEffect(() => {
    setIsMounted(true);
    const todayStr = new Date().toLocaleDateString('en-CA');
    const defaultStartDate = new Date(2026, 0, 1);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let initialStart = defaultStartDate;
    let initialEnd = today;

    const saved = localStorage.getItem('salesOrderState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedDate = parsed.sessionDate || '';
        if (savedDate === todayStr) {
          initialStart = new Date(parsed.startDate);
          initialEnd = new Date(parsed.endDate);
        }
      } catch (e) {}
    }
    setStartDate(initialStart);
    setEndDate(initialEnd);
  }, []);

  // Note: Date persistence moved to handleFetchDigit to follow "Scrape-First" requirement

  // Main fetch data
  useEffect(() => {
    let active = true;
    async function loadData() {
      if (mountedRef.current) setLoading(true);
      const startTime = performance.now();
      try {
        const res = await fetch(`/api/sales-orders?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&from=${formatDateToYYYYMMDD(startDate)}&to=${formatDateToYYYYMMDD(endDate)}&_t=${Date.now()}`);
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success && mountedRef.current) {
            setLoadTime(Math.round(performance.now() - startTime));
            if (page === 1) {
              setData(json.data || []);
            } else {
              setData(prev => {
                const currentData = prev || [];
                const newData = json.data || [];
                const existingIds = new Set(currentData.map((d: any) => d.id));
                const filteredNew = newData.filter((d: any) => !existingIds.has(d.id));
                return [...currentData, ...filteredNew];
              });
            }
            setTotalCount(json.total || 0);
            if (json.lastUpdated) {
                const date = new Date(json.lastUpdated);
                if (!isNaN(date.getTime())) {
                  setLastUpdated(date.toLocaleString('id-ID', { 
                      day: '2-digit', month: 'short', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit', second: '2-digit' 
                  }));
                }
            }
            setError('');
          }
        }
      } catch (err: any) {
        if (mountedRef.current) setError(err.message || 'Gagal memuat data');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }
    if (!isMounted) return;
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate, isMounted]);

  // Batch states
  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');
  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'alert', title: string, message: string}>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const handleFetchDigit = async () => {
    if (!startDate || !endDate) return;

    // Save state ONLY when Tarik Data is clicked
    localStorage.setItem('salesOrderState', JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sessionDate: new Date().toLocaleDateString('en-CA')
    }));

    setError(''); setData([]); setPage(1); setSearchQuery('');
    
    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    setIsBatching(true); setBatchProgress(0);
    
    let successCount = 0;
    let totalScraped = 0;
    let completedChunks = 0;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-sales-orders?start=${chunk.start}&end=${chunk.end}`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
          totalScraped += (json.total || 0);
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
        setDialog({
          isOpen: true,
          type: (chunks.length - successCount) > 0 ? 'alert' : 'success',
          title: (chunks.length - successCount) > 0 ? 'Selesai Sebagian' : 'Berhasil',
          message: `Berhasil menarik ${totalScraped} data Sales Order dari Digit.`
        });
        localStorage.setItem('sikka_data_updated', Date.now().toString());
        setRefreshKey(prev => prev + 1);
      } else {
        setError("Gagal menarik data. Cek koneksi.");
      }
    } finally {
      if (mountedRef.current) { setIsBatching(false); setBatchStatus(''); setBatchProgress(0); }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && !isBatching && data.length < totalCount) {
       setPage(prev => prev + 1);
    }
  };

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
            {loading && data.length > 0 && (
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
              placeholder="Cari faktur, pelanggan, atau barang..." 
              className="w-full pl-12 pr-4 h-10 bg-white border border-gray-200 rounded-[14px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data}
          isLoading={loading}
          totalCount={totalCount}
          onScroll={handleScroll}
          selectedIds={selectedIds}
          onRowClick={(id) => {
            const next = new Set(selectedIds);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setSelectedIds(next);
          }}
          columnWidths={columnWidths}
          onColumnWidthChange={setColumnWidths}
        />

        {/* Footer info Banner */}
        <div className="flex items-center justify-between shrink-0 px-1 mt-1">
          <span className="text-[12px] leading-none font-bold text-gray-400">
            {totalCount === 0 ? 'Tidak ada data Sales Order' : `Menampilkan ${data.length} dari ${totalCount} Sales Order`}
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
      
      <ConfirmDialog isOpen={dialog.isOpen} type={dialog.type} title={dialog.title} message={dialog.message} onConfirm={() => setDialog({ ...dialog, isOpen: false })} />
    </div>
  );
}
