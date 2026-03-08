'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Package, Hash, Calendar, Loader2, Download, Search, AlertCircle, ChevronLeft, ChevronRight, Clock, Box, RefreshCw, BarChart3, Printer, User, Tag } from 'lucide-react';
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
            }
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
    const saved = localStorage.getItem('bahanBakuState');
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
              lastUpdated: timestamp
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
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      {/* Control Panel */}
      <div className="flex justify-start w-full shrink-0">
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-3 px-5 w-fit">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Periode</span>
            <div className="w-[140px] relative">
              <DatePicker 
                name="startDate"
                value={startDate}
                onChange={setStartDate}
              />
            </div>
            <span className="text-slate-400 font-medium whitespace-nowrap">-</span>
            <div className="w-[140px] relative">
              <DatePicker 
                name="endDate"
                value={endDate}
                onChange={setEndDate}
              />
            </div>

            <div className="flex flex-col gap-2">
                <button 
                  key={isBatching ? "btn-syncing" : "btn-idle"}
                  onClick={handleFetch}
                  disabled={loading || isBatching || !startDate || !endDate}
                  className="w-full sm:w-auto shrink-0 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isBatching ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      {batchProgress || 0}%
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                      Tarik Data
                    </span>
                  )}
                </button>
                {isBatching && (
                  <div className="text-[10px] text-green-600 font-medium animate-pulse text-center">
                    {batchStatus}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm flex items-start gap-2 max-w-2xl mx-auto shrink-0">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Results View */}
      {data === null && !loading && !error && (
        <div className="card text-center py-20 text-slate-500 flex flex-col items-center bg-slate-50/50 border-dashed justify-center flex-1">
          <Loader2 size={48} className="mb-4 opacity-20 text-amber-500 animate-spin" />
          <p className="font-medium text-slate-600">Sedang memuat data dari database...</p>
        </div>
      )}

      {data !== null && (
        <div className="flex flex-col flex-1 gap-4 overflow-hidden min-h-0 relative">
          {/* Global Loading Overlay (Subtle) */}
          {loading && data !== null && (
            <div className="absolute top-2 right-2 z-30 transition-all animate-in fade-in">
              <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm border border-amber-100">
                <Loader2 size={14} className="text-amber-500 animate-spin" />
              </div>
            </div>
          )}

          {loading && data === null && (
            <div className="absolute inset-0 z-30 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl transition-all">
              <div className="bg-white p-3 rounded-full shadow-lg border border-amber-100">
                <Loader2 size={24} className="text-amber-500 animate-spin" />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  Hasil Scrapping
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock size={12} className="text-gray-300" />
                  Diperbarui: {lastUpdated}
                </div>
              )}
            </div>
          </div>

          <div className="relative shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari faktur, barang, supplier..." 
              className="w-full pl-10 pr-4 h-9 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-sm"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {data.length === 0 ? (
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-20 text-center flex flex-col items-center justify-center flex-1">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search className="text-slate-100" size={32} />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Tidak ada data ditemukan</h3>
              <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                Coba sesuaikan kata kunci pencarian atau rentang tanggal.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-0 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="overflow-auto bg-white flex-1 min-h-0 custom-scrollbar" onScroll={handleScroll}>
                  <table className="w-full text-left relative min-w-[800px]">
                    <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm">
                      <tr className="text-[11px] uppercase tracking-wider text-gray-400 font-medium border-b border-gray-100">
                        <th className="px-5 py-3">Tanggal</th>
                        <th className="px-5 py-3">Faktur</th>
                        <th className="px-5 py-3">Faktur PRD</th>
                        <th className="px-5 py-3">Nama Barang</th>
                        <th className="px-5 py-3 text-right">Qty</th>
                        <th className="px-5 py-3">Satuan</th>
                        <th className="px-5 py-3 text-right">HPP</th>
                        <th className="px-5 py-3">Prd</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedData.map((item: any, idx) => (
                        <tr key={item.id || idx} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-5 py-3 text-gray-400 text-sm whitespace-nowrap">
                            {formatIndoDateStr(item.tgl)}
                          </td>
                          <td className="px-5 py-3 font-mono text-[10px] text-gray-500">
                            {item.faktur || '-'}
                          </td>
                          <td className="px-5 py-3 font-mono text-[10px] text-gray-400">
                            {item.faktur_prd || '-'}
                          </td>
                          <td className="px-5 py-3 font-medium text-gray-700 text-sm">
                            <div className="max-w-xs md:max-w-xs xl:max-w-md truncate" title={item.nama_barang}>
                              {item.nama_barang}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-700 font-medium text-right tabular-nums text-sm">
                            {item.qty}
                          </td>
                          <td className="px-5 py-3 text-gray-400 whitespace-nowrap text-[10px] uppercase tracking-wide">
                            {item.satuan}
                          </td>
                          <td className="px-5 py-3 text-gray-600 text-right tabular-nums text-sm">
                            {item.hp ? item.hp.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="px-5 py-3 text-gray-400 text-[10px]">
                            <div className="truncate max-w-[150px]" title={item.nama_prd}>
                                {item.nama_prd}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer info banner */}
              <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="">
                    {totalCount === 0
                      ? 'Tidak ada data tersedia'
                      : `Menampilkan ${paginatedData.length} dari ${totalCount} data bahan baku`}
                  </span>
                  {loadTime !== null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                      loadTime < 200 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                      loadTime < 800 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                      'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      <span className="opacity-70">⚡</span> {loadTime}ms
                    </span>
                  )}
                </div>
                
                {loading && page > 1 && (
                  <span className="text-amber-500 font-medium flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" />
                    Memuat data...
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
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
