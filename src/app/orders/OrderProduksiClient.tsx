'use client';

import { useState, useMemo, useEffect } from 'react';
import { Package, Hash, User, Calendar, Loader2, Download, Search, AlertCircle, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';

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

export default function OrderProduksiClient() {
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
  const mountedRef = useMemo(() => ({ current: true }), []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

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
        const res = await fetch(`/api/orders?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&_t=${Date.now()}`);
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
  }, [page, debouncedQuery]);

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

    try {
      const res = await fetch(`/api/scrape-orders?start=${startStr}&end=${endStr}`);
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || 'Terjadi kesalahan saat mengambil data.');
      }
      
      // We no longer set large data directly here to avoid UI freezing.
      // Instead, we just refresh the current view by resetting search/page
      // which will trigger the loadData useEffect to fetch ONLY the first PAGE.
      setPage(1);
      setSearchQuery('');
      
      if (json.lastUpdated) {
        const latestDate = new Date(json.lastUpdated);
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

      setDialog({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: `Berhasil menarik ${json.total} data order produksi.`
      });

    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err.message || 'Gagal mengambil data dari server.');
    } finally {
      if (mountedRef.current) setLoading(false);
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
        <div className="card glass relative z-20 overflow-visible p-5 px-8 border border-emerald-500/10 w-fit">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Periode</span>
            <div className="w-[160px] relative">
              <DatePicker 
                name="startDate"
                value={startDate}
                onChange={setStartDate}
              />
            </div>
            <span className="text-slate-400 font-medium whitespace-nowrap">-</span>
            <div className="w-[160px] relative">
              <DatePicker 
                name="endDate"
                value={endDate}
                onChange={setEndDate}
              />
            </div>

            <button 
              onClick={handleFetch}
              disabled={loading}
              className="w-full sm:w-auto shrink-0 h-[42px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-8 rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap lg:ml-2"
            >
              {loading ? (
                <Loader2 key="loading" size={16} className="animate-spin" />
              ) : (
                <Download key="download" size={16} />
              )}
              {loading ? 'Menarik...' : 'Tarik Data'}
            </button>
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
          <Loader2 size={48} className="mb-4 opacity-20 text-emerald-600 animate-spin" />
          <p className="font-medium text-slate-600">Sedang memuat data dari database...</p>
        </div>
      )}

      {data !== null && (
        <div className="flex flex-col flex-1 gap-4 overflow-hidden min-h-0 relative">
          {/* Global Loading Overlay (Subtle) */}
          {loading && (
            <div className="absolute inset-0 z-30 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl transition-all">
              <div className="bg-white p-3 rounded-full shadow-lg border border-emerald-100">
                <Loader2 size={24} className="text-emerald-500 animate-spin" />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-4 w-full flex-wrap">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-base">
                  <Package size={18} className="text-emerald-500" /> Hasil Scrapping
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded shadow-sm w-fit">
                  <Clock size={12} className="text-emerald-500 opacity-80" />
                  Diperbarui: {lastUpdated}
                </div>
              )}
            </div>
          </div>

          <div className="relative shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari faktur, produk, pelanggan..." 
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
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
                  <tr className="text-slate-500 text-sm border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-3 font-medium whitespace-nowrap">No. Faktur</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Nama Produk</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Pelanggan</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Tanggal</th>
                    <th className="px-5 py-3 font-medium text-center whitespace-nowrap">Qty Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 italic text-sm">
                        Pencarian "{searchQuery}" tidak ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((order: any, idx) => (
                      <tr key={order.id || idx} className="text-sm hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-3 font-mono text-emerald-600 font-medium whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Hash size={14} className="opacity-40" />
                            {order.faktur}
                          </div>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-700">
                          <div className="max-w-xs md:max-w-xs xl:max-w-md truncate" title={order.nama_prd}>
                            {order.nama_prd}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <User size={14} className="opacity-40" />
                            <span className="truncate max-w-[150px]" title={order.nama_pelanggan || order.kd_pelanggan}>
                              {order.nama_pelanggan || order.kd_pelanggan}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="opacity-40" />
                            {formatIndoDateStr(order.tgl)}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600 font-medium text-center">
                          {order.qty}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Global Style Pagination */}
          <div className="flex items-center justify-between text-sm text-slate-500">
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

              {/* Page numbers */}
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
                          ? 'bg-emerald-500 text-white border border-emerald-600'
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
