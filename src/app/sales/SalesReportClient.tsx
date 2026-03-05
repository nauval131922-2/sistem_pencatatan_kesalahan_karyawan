'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Package, Calendar, User, Tag, Hash, RefreshCw, BarChart3, Download, Printer, Loader2, TrendingUp, History } from 'lucide-react';
import { splitDateRangeIntoMonths } from '@/lib/date-utils';
import ConfirmDialog from '@/components/ConfirmDialog';
import DatePicker from '@/components/DatePicker';

const PAGE_SIZE = 10;

// Helper to format Date to YYYY-MM-DD
function formatDateToYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper to format date string to "DD MMM YYYY"
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

export default function SalesReportClient() {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Batch states
  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');

  const mountedRef = useRef(true);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);
  
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

  // Fetch data from API with pagination and search
  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      const startTime = performance.now();
      try {
        const res = await fetch(`/api/sales?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&from=${formatDateToYYYYMMDD(startDate)}&to=${formatDateToYYYYMMDD(endDate)}&_t=${Date.now()}`);
        if (res.ok && active) {
           const json = await res.json();
           const endTime = performance.now();
           setLoadTime(Math.round(endTime - startTime));
           setData(json.data || []);
           setTotalCount(json.total || 0);

           // Update last updated if we have it from API
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
         console.error('Gagal mengambil data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate]);

  // Restore dates from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('salesReportState');
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

    const chunks = splitDateRangeIntoMonths(formatDateToYYYYMMDD(startDate), formatDateToYYYYMMDD(endDate));
    setIsBatching(true);
    setLoading(true);
    setBatchProgress(0);
    
    let successCount = 0;
    let lastUpdatedFromScrape: string | null = null;
    let completedChunks = 0;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-sales?start=${chunk.start}&end=${chunk.end}&silent=true`);
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
        // Post one summary log for the full range
        const fullStart = formatDateToYYYYMMDD(startDate);
        const fullEnd = formatDateToYYYYMMDD(endDate);
        await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'SCRAPE',
            table_name: 'sales_reports',
            message: `Tarik Laporan Penjualan (${fullStart} s/d ${fullEnd}) — ${successCount} periode`,
            raw_data: JSON.stringify({ chunks: chunks.length, success: successCount }),
            recorded_by: 'System'
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

        if (lastUpdatedFromScrape) {
          const latestDate = new Date(lastUpdatedFromScrape);
          if (!isNaN(latestDate.getTime())) {
            const timestamp = latestDate.toLocaleString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            setLastUpdated(timestamp);

            localStorage.setItem('salesReportState', JSON.stringify({
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
        setRefreshKey(prev => prev + 1);
      }
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const paginatedData = data || [];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      {/* Control Panel */}
      <div className="flex justify-center w-full shrink-0">
        <div className="card glass relative z-20 overflow-visible p-3 px-5 border border-blue-500/10 w-fit">
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
                  className="w-full sm:w-auto shrink-0 h-[38px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap lg:ml-2"
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
                  <div className="text-[10px] text-blue-600 font-medium animate-pulse text-center">
                    {batchStatus}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* Results View */}
      {data === null && !loading && (
        <div className="card text-center py-20 text-slate-500 flex flex-col items-center bg-slate-50/50 border-dashed justify-center flex-1">
          <Loader2 size={48} className="mb-4 opacity-20 text-blue-600 animate-spin" />
          <p className="font-medium text-slate-600">Sedang memuat data dari database...</p>
        </div>
      )}

      {data !== null && (
        <div className="flex flex-col flex-1 gap-4 overflow-hidden min-h-0 relative">
          {/* Global Loading Overlay (Subtle) */}
          {loading && data !== null && (
            <div className="absolute top-2 right-2 z-30 transition-all animate-in fade-in">
              <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm border border-blue-100">
                <Loader2 size={14} className="text-blue-500 animate-spin" />
              </div>
            </div>
          )}

          {loading && data === null && (
            <div className="absolute inset-0 z-30 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl transition-all">
              <div className="bg-white p-3 rounded-full shadow-lg border border-blue-100">
                <Loader2 size={24} className="text-blue-500 animate-spin" />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-4 w-full flex-wrap">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                  <TrendingUp size={16} className="text-blue-500" /> Hasil Scrapping
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded shadow-sm w-fit">
                  <History size={12} className="text-blue-500 opacity-80" />
                  Diperbarui: {lastUpdated}
                </div>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari faktur, pelanggan, produk..." 
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
              value={query}
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
              <div className="card p-0 overflow-hidden border border-slate-200 flex-1 flex flex-col min-h-0">

            <div className="overflow-auto bg-white flex-1 min-h-0">
              <table className="w-full text-left relative">
                <thead className="sticky top-0 z-10">
                  <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">Tanggal</th>
                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">Faktur</th>
                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">Nama Order</th>
                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">Pelanggan</th>
                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">Nama Barang</th>
                    <th className="px-5 py-2.5 font-semibold text-center whitespace-nowrap">Qty</th>
                    <th className="px-5 py-2.5 font-semibold text-right whitespace-nowrap">Harga</th>
                    <th className="px-5 py-2.5 font-semibold text-right whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 italic text-sm">
                        Pencarian "{query}" tidak ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row) => (
                      <tr key={row.id} className="text-xs hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-2 text-slate-500 text-[11px] whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar size={12} className="opacity-40" />
                            {formatIndoDateStr(row.tgl)}
                          </div>
                        </td>
                        <td className="px-5 py-2 text-blue-600 font-medium whitespace-nowrap text-[11px]">
                          {row.faktur}
                        </td>
                        <td className="px-5 py-2 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <Hash size={12} className="text-blue-500 opacity-40 shrink-0" />
                            <span className="max-w-xs truncate" title={row.nama_prd}>{row.nama_prd}</span>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-slate-500 text-[11px]">
                          <div className="flex items-center gap-2">
                             <User size={12} className="opacity-40" />
                             <span className="truncate max-w-[150px]" title={row.nama_pelanggan}>{row.nama_pelanggan}</span>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-slate-500 text-[11px]">
                          <div className="flex items-center gap-2">
                            <Tag size={12} className="opacity-40" />
                            <span className="truncate max-w-[120px]" title={row.kd_barang}>{row.kd_barang}</span>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-slate-600 font-medium text-center">
                          {row.qty?.toLocaleString('id-ID')}
                        </td>
                        <td className="px-5 py-2 text-blue-600 font-semibold text-right whitespace-nowrap">
                          Rp {row.harga?.toLocaleString('id-ID')}
                        </td>
                        <td className="px-5 py-2 text-slate-800 font-bold text-right whitespace-nowrap">
                          Rp {row.jumlah?.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 py-2">
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
                          ? 'bg-blue-500 text-white border border-blue-600'
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

