'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Download, Loader2, ChevronLeft, ChevronRight, AlertCircle, Clock, BarChart3, Hash, User, Calendar, Tag } from 'lucide-react';
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
  const mountedRef = useMemo(() => ({ current: true }), []);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);
  
  useEffect(() => {
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
        const res = await fetch(`/api/sales?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok && active) {
           const json = await res.json();
           const endTime = performance.now();
           setLoadTime(Math.round(endTime - startTime));
           setData(json.data || []);
           setTotalCount(json.total || 0);

           // Update last updated if we have data
           if (json.data && json.data.length > 0) {
             const latestDate = new Date(Math.max(...json.data.map((r: any) => new Date(r.created_at || new Date()).getTime())));
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
  }, [page, debouncedQuery]);

  // Restore dates from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('salesReportState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.startDate) setStartDate(new Date(parsed.startDate));
        if (parsed.endDate) setEndDate(new Date(parsed.endDate));
      } catch(e) {}
    }
  }, []);

  const handleScrape = async () => {
    setLoading(true);
    try {
      const startStr = formatDateToYYYYMMDD(startDate);
      const endStr = formatDateToYYYYMMDD(endDate);
      
      const res = await fetch(`/api/scrape-sales?start=${startStr}&end=${endStr}`);
      const result = await res.json();
      
      if (res.ok) {
        // Refresh data
        const dataRes = await fetch('/api/sales');
        const newData = await dataRes.json();
        setData(newData.data || []);
        
        const timestamp = new Date().toLocaleString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        setLastUpdated(timestamp);

        // Save state
        localStorage.setItem('salesReportState', JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          lastUpdated: timestamp
        }));

        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Berhasil menarik ${result.total} data laporan penjualan.`
        });
      } else {
        setDialog({
          isOpen: true,
          type: 'error',
          title: 'Gagal',
          message: result.error || 'Terjadi kesalahan saat menarik data.'
        });
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Gagal terhubung ke server.'
      });
    } finally {
      if (mountedRef.current) setLoading(false);
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
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="flex justify-center w-full">
        <div className="card glass relative z-20 overflow-visible p-5 px-8 border border-blue-500/10 w-fit">
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
              onClick={handleScrape}
              disabled={loading}
              className="w-full sm:w-auto shrink-0 h-[42px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap lg:ml-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {loading ? 'Menarik...' : 'Tarik Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {data === null && !loading && (
        <div className="card text-center py-24 text-slate-500 flex flex-col items-center bg-slate-50/50 border-dashed">
          <Loader2 size={48} className="mb-4 opacity-20 text-blue-600 animate-spin" />
          <p className="font-medium text-slate-600">Sedang memuat data dari database...</p>
        </div>
      )}

      {data !== null && data.length === 0 && !loading && (
        <div className="card text-center py-20 text-slate-500 flex flex-col items-center bg-white border-dashed">
          <Search size={48} className="mb-4 opacity-20" />
          <p>Belum ada data laporan penjualan. Silakan tarik data untuk memulai.</p>
        </div>
      )}

      {data !== null && data.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
            <div className="flex items-center gap-4 w-full flex-wrap">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-base">
                  <BarChart3 size={18} className="text-blue-500" /> Hasil Scrapping
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded shadow-sm w-fit">
                  <Clock size={12} className="text-blue-500 opacity-80" />
                  Diperbarui: {lastUpdated}
                </div>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari Order, Pelanggan, atau Kode..." 
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              value={query}
              onChange={handleSearch}
            />
          </div>

          <div className="card p-0 overflow-hidden border border-slate-200">
            <div className="overflow-auto" style={{ maxHeight: '450px' }}>
              <table className="w-full text-left relative">
                <thead className="sticky top-0 z-10">
                  <tr className="text-slate-500 text-sm border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Tanggal</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Faktur</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Nama Order</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Pelanggan</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Nama Barang</th>
                    <th className="px-5 py-3 font-medium text-center whitespace-nowrap">Qty</th>
                    <th className="px-5 py-3 font-medium text-right whitespace-nowrap">Harga Jual</th>
                    <th className="px-5 py-3 font-medium text-right whitespace-nowrap">Total</th>
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
                      <tr key={row.id} className="text-sm hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="opacity-40" />
                            {formatIndoDateStr(row.tgl)}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-blue-600 font-medium whitespace-nowrap">
                          {row.faktur}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <Hash size={14} className="text-blue-500 opacity-40 shrink-0" />
                            <span className="max-w-xs truncate" title={row.nama_prd}>{row.nama_prd}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs">
                          <div className="flex items-center gap-2">
                             <User size={14} className="opacity-40" />
                             <span className="truncate max-w-[150px]" title={row.nama_pelanggan}>{row.nama_pelanggan}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs">
                          <div className="flex items-center gap-2">
                            <Tag size={13} className="opacity-40" />
                            <span className="truncate max-w-[120px]" title={row.kd_barang}>{row.kd_barang}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600 font-medium text-center">
                          {row.qty?.toLocaleString('id-ID')}
                        </td>
                        <td className="px-5 py-3 text-blue-600 font-semibold text-right whitespace-nowrap">
                          Rp {row.harga?.toLocaleString('id-ID')}
                        </td>
                        <td className="px-5 py-3 text-slate-800 font-bold text-right whitespace-nowrap">
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
          <div className="flex items-center justify-between text-sm text-slate-500 px-2 py-2">
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

