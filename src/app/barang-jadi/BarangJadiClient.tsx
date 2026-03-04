'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Package, Hash, Calendar, Loader2, Download, Search, AlertCircle, ChevronLeft, ChevronRight, Clock, Star, RefreshCw, User, Tag, BarChart3, Printer } from 'lucide-react';
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

const PAGE_SIZE = 10;

export default function BarangJadiClient() {
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
    return () => { mountedRef.current = false; };
  }, []);

  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'error' | 'danger' | 'confirm' | 'alert', title: string, message: string}>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Fetch data from API
  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      const startTime = performance.now();
      try {
        const res = await fetch(`/api/barang-jadi?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&from=${formatDateToYYYYMMDD(startDate)}&to=${formatDateToYYYYMMDD(endDate)}&_t=${Date.now()}`);
        if (res.ok && active) {
          const json = await res.json();
          const endTime = performance.now();
          setLoadTime(Math.round(endTime - startTime));
          setData(json.data || []);
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
    const saved = localStorage.getItem('barangJadiState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.startDate) setStartDate(new Date(parsed.startDate));
        if (parsed.endDate) setEndDate(new Date(parsed.endDate));
        if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
      } catch(e) {}
    }
    
    try {
      const sess = sessionStorage.getItem('barangJadiState');
      if (sess) {
        const parsed = JSON.parse(sess);
        if (parsed.startDate) setStartDate(new Date(parsed.startDate));
        if (parsed.endDate) setEndDate(new Date(parsed.endDate));
      }
    } catch (e) {}
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

    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    setIsBatching(true);
    setLoading(true);
    setBatchProgress(0);
    
    let successCount = 0;
    let lastUpdatedFromScrape: string | null = null;
    let completedChunks = 0;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-barang-jadi?start=${chunk.start}&end=${chunk.end}`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
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

        if (lastUpdatedFromScrape) {
          const latestDate = new Date(lastUpdatedFromScrape);
          if (!isNaN(latestDate.getTime())) {
            const timestamp = latestDate.toLocaleString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            setLastUpdated(timestamp);

            localStorage.setItem('barangJadiState', JSON.stringify({
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
      alert(error.message || "Terjadi kesalahan saat menarik data");
    } finally {
      if (mountedRef.current) {
        setIsBatching(false);
        setLoading(false);
        setBatchStatus('');
        setRefreshKey(prev => prev + 1);
      }
    }
  };

  // Filter and paginate data
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedData = data || [];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset page on search
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      {/* Control Panel */}
      <div className="flex justify-center w-full shrink-0">
        <div className="card glass relative z-20 overflow-visible p-3 px-5 border border-indigo-500/10 w-fit">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Periode</span>
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
                  className="w-full sm:w-auto shrink-0 h-[38px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white px-6 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap lg:ml-2"
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
                  <div className="text-[10px] text-indigo-600 font-medium animate-pulse text-center">
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
          <Loader2 size={48} className="mb-4 opacity-20 text-indigo-600 animate-spin" />
          <p className="font-medium text-slate-600">Sedang memuat data dari database...</p>
        </div>
      )}

      {data !== null && (
        <div className="flex flex-col flex-1 gap-4 overflow-hidden min-h-0 relative">
          {/* Global Loading Overlay (Subtle) */}
          {loading && data !== null && (
            <div className="absolute top-2 right-2 z-30 transition-all animate-in fade-in">
              <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm border border-indigo-100">
                <Loader2 size={14} className="text-indigo-500 animate-spin" />
              </div>
            </div>
          )}

          {loading && data === null && (
            <div className="absolute inset-0 z-30 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl transition-all">
              <div className="bg-white p-3 rounded-full shadow-lg border border-indigo-100">
                <Loader2 size={24} className="text-indigo-500 animate-spin" />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                  <Star size={16} className="text-indigo-500" /> Hasil Scrapping
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded shadow-sm">
                  <Clock size={12} className="text-indigo-500/80" />
                  Diperbarui: {lastUpdated}
                </div>
              )}
            </div>
          </div>

          <div className="relative shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari barang, tanggal, order produksi..." 
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {data.length === 0 ? (
            <div className="card text-center py-20 text-slate-500 flex flex-col items-center justify-center flex-1 bg-white border-dashed">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Tidak ada data ditemukan.</p>
              <p className="text-xs opacity-60 mt-1">Coba sesuaikan kata kunci pencarian atau rentang tanggal.</p>
            </div>
          ) : (
            <>
              <div className="card p-0 overflow-hidden border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">

            <div className="overflow-auto bg-white flex-1 min-h-0">
              <table className="w-full text-left relative min-w-[800px]">
                <thead className="sticky top-0 z-10">
                  <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm">
                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">Tanggal</th>
                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">Faktur</th>
                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap text-[10px] uppercase tracking-wider text-slate-400">Faktur PRD</th>
                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">Nama Barang</th>
                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap text-right">Qty</th>
                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">Satuan</th>
                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap text-right">HPP</th>
                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">Prd</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 italic text-sm">
                        Pencarian "{searchQuery}" tidak ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item: any, idx) => (
                      <tr key={item.id || idx} className="text-xs hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-2 text-slate-500 text-[11px] whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar size={12} className="opacity-40" />
                            {formatIndoDateStr(item.tgl)}
                          </div>
                        </td>
                        <td className="px-5 py-2 font-mono text-[10px] text-slate-400">
                          {item.faktur || '-'}
                        </td>
                        <td className="px-5 py-2 font-mono text-[10px] text-slate-400/70 italic">
                          {item.faktur_prd || '-'}
                        </td>
                        <td className="px-5 py-2 font-medium text-slate-700">
                          <div className="max-w-xs md:max-w-xs xl:max-w-md truncate" title={item.nama_barang}>
                            {item.nama_barang}
                          </div>
                        </td>
                        <td className="px-5 py-2 text-emerald-600 font-semibold text-right tabular-nums">
                          {item.qty}
                        </td>
                        <td className="px-5 py-2 text-slate-500 whitespace-nowrap text-[10px] uppercase tracking-wide">
                          {item.satuan}
                        </td>
                        <td className="px-5 py-2 text-slate-600 font-medium text-right tabular-nums text-[11px]">
                          {item.hp ? item.hp.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="px-5 py-2 text-slate-500 text-[10px]">
                           <div className="truncate max-w-[150px] border border-slate-200 bg-white rounded px-2 py-0.5 inline-block" title={item.nama_prd}>
                               {item.nama_prd}
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span>
                {totalCount === 0
                  ? 'Tidak ada data'
                  : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, totalCount)} dari ${totalCount} data`}
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

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="px-2">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        currentPage === p
                          ? 'bg-indigo-500 text-white border border-indigo-600'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
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
