'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Package, Calendar, User, Tag, Hash, RefreshCw, BarChart3, Download, Printer, Loader2, AlertCircle, Clock } from 'lucide-react';


import { useRouter } from 'next/navigation';

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

export default function OrderProduksiClient() {
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
  const [refreshKey, setRefreshKey] = useState(0); // Add this to force refresh

  // Batch states
  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');

  const mountedRef = useRef(true);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
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
        const res = await fetch(`/api/orders?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&from=${formatDateToYYYYMMDD(startDate)}&to=${formatDateToYYYYMMDD(endDate)}&_t=${Date.now()}`);
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
  }, [page, debouncedQuery, refreshKey, startDate, endDate]); // Add dates and refreshKey here

  // Restore state on mount
  useEffect(() => {
    const saved = localStorage.getItem('orderProduksiState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.startDate) setStartDate(new Date(parsed.startDate));
        if (parsed.endDate) setEndDate(new Date(parsed.endDate));
        if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
      } catch(e) {}
    }
  }, []);

  const handleFetch = async () => {
    if (!startDate || !endDate) {
      alert("Pilih rentang tanggal terlebih dahulu");
      return;
    }

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
      // Parallel execution with concurrency limit 5 (Safe & Stable)
      const concurrency = 5;
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
        const fullStart = formatDateToYYYYMMDD(startDate);
        const fullEnd = formatDateToYYYYMMDD(endDate);
        await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'SCRAPE',
            table_name: 'orders',
            message: `Tarik Data Order Produksi (${fullStart} s/d ${fullEnd})`,
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

            // Save to localStorage
            localStorage.setItem('orderProduksiState', JSON.stringify({
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              lastUpdated: timestamp
            }));
          }
        }
      } else {
        setError("Gagal menarik data. Periksa koneksi atau log sistem.");
      }
    } catch (error: any) {
      console.error("Scrape error:", error);
      if (!mountedRef.current) return;
      setError(error.message || "Terjadi kesalahan saat menarik data");
    } finally {
      if (mountedRef.current) {
        setIsBatching(false);
        setLoading(false);
        setBatchStatus('');
        setBatchProgress(0); // Clear progress when done
        // Trigger one final refresh to show results
        setRefreshKey(prev => prev + 1);
      }
    }
  };

  const paginatedData = data || [];

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

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700 overflow-hidden">
      {/* Control Panel - Horizontal Card */}
      <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="bg-white border border-gray-200 shadow-sm rounded-[10px] px-5 py-3.5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2.5">
              <Calendar size={16} className="text-green-600" />
              <span className="text-[13px] font-extrabold text-gray-400 uppercase tracking-wider">Periode</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-[140px] relative group">
                <DatePicker 
                  name="startDate"
                  value={startDate}
                  onChange={setStartDate}
                />
              </div>
              <span className="text-gray-300 font-bold">—</span>
              <div className="w-[140px] relative group">
                <DatePicker 
                  name="endDate"
                  value={endDate}
                  onChange={setEndDate}
                />
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
      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
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
            </div>
            
            {loading && data !== null && (
              <div className="flex items-center gap-2 text-[11px] font-bold text-green-600 animate-pulse bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses...</span>
              </div>
            )}
          </div>

          <div className="relative w-full group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari faktur, produk, pelanggan..." 
              className="w-full pl-11 pr-4 h-10 bg-white border border-gray-200 rounded-[10px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-medium placeholder:text-gray-300 shadow-sm"
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
           <div className="flex-1 bg-white border border-gray-100 rounded-[10px] flex flex-col items-center justify-center text-center p-10">
            <Loader2 size={40} className="text-green-500 animate-spin mb-4" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-800">Menghubungkan ke Server...</p>
              <p className="text-xs text-gray-400">Mohon tunggu sebentar, kami sedang menyiapkan data.</p>
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
                <table className="w-full text-left relative min-w-[850px] border-collapse">
                  <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                    <tr className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                      <th className="px-5 py-3.5 w-32">No. Faktur</th>
                      <th className="px-5 py-3.5">Nama Produk</th>
                      <th className="px-5 py-3.5 w-48">Pelanggan</th>
                      <th className="px-5 py-3.5 w-32">Tanggal</th>
                      <th className="px-5 py-3.5 w-24 text-right">Qty Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedData.map((order: any, idx) => (
                      <tr key={order.id || idx} className="hover:bg-green-50/30 transition-colors even:bg-[#f9fafb] group h-10">
                        <td className="px-5 py-1 font-bold text-gray-400 text-[12px] tracking-tight">
                          {order.faktur}
                        </td>
                        <td className="px-5 py-1 font-bold text-gray-700 text-[13px]">
                          <div className="max-w-[300px] xl:max-w-md truncate" title={order.nama_prd}>
                            {order.nama_prd}
                          </div>
                        </td>
                        <td className="px-5 py-1 text-gray-500 text-[13px] font-medium">
                          <div className="truncate max-w-[150px]" title={order.nama_pelanggan || order.kd_pelanggan}>
                            {order.nama_pelanggan || order.kd_pelanggan}
                          </div>
                        </td>
                        <td className="px-5 py-1 text-gray-400 text-[12px] font-bold whitespace-nowrap">
                          {formatIndoDateStr(order.tgl)}
                        </td>
                        <td className="px-5 py-1 text-gray-800 text-right font-extrabold text-[13px]">
                          {order.qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer info Banner */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-bold text-gray-400">
                  {totalCount === 0
                    ? 'Tidak ada data tersedia'
                    : `Menampilkan ${paginatedData.length} dari ${totalCount} data order`}
                </span>
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
              </div>
              
              {loading && page > 1 && (
                <div className="flex items-center gap-2 text-green-600 font-bold text-[11px] animate-pulse">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Memuat hal. berikutnya...</span>
                </div>
              )}
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
