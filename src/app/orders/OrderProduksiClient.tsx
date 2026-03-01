'use client';

import { useState, useMemo, useEffect } from 'react';
import { Package, Hash, User, Calendar, Loader2, Download, Search, AlertCircle, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import DatePicker from '@/components/DatePicker';

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
  const [page, setPage] = useState(1);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('orderProduksiState');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) setData(parsed.data);
        if (parsed.startDate) setStartDate(new Date(parsed.startDate));
        if (parsed.endDate) setEndDate(new Date(parsed.endDate));
        if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
      }
    } catch (e) {
      console.error('Failed to restore state from sessionStorage', e);
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
      
      const fetchedData = json.data || [];
      const timestamp = new Date().toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });

      setData(fetchedData);
      setLastUpdated(timestamp);

      // Save to sessionStorage
      sessionStorage.setItem('orderProduksiState', JSON.stringify({
        data: fetchedData,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        lastUpdated: timestamp
      }));

    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data dari server.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and paginate data
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;

    const lowerQuery = searchQuery.toLowerCase();
    return data.filter((order) => {
      return (
        (order.faktur || '').toLowerCase().includes(lowerQuery) ||
        (order.nama_prd || '').toLowerCase().includes(lowerQuery) ||
        (order.nama_pelanggan || order.kd_pelanggan || '').toLowerCase().includes(lowerQuery)
      );
    });
  }, [data, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filteredData, currentPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset page on search
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="card glass relative z-20 overflow-visible p-6 border border-emerald-500/10">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/3">
            <DatePicker 
              name="startDate"
              label="Tanggal Mulai"
              value={startDate}
              onChange={setStartDate}
            />
          </div>
          <div className="w-full md:w-1/3">
            <DatePicker 
              name="endDate"
              label="Tanggal Akhir"
              value={endDate}
              onChange={setEndDate}
            />
          </div>
          <div className="w-full md:w-auto mt-4 md:mt-0">
            <button 
              onClick={handleFetch}
              disabled={loading}
              className="w-full md:w-auto h-10 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {loading ? 'Menarik...' : 'Tarik Data'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Results View */}
      {data === null && !loading && !error && (
        <div className="card text-center py-24 text-slate-500 flex flex-col items-center bg-slate-50/50 border-dashed">
          <Package size={48} className="mb-4 opacity-20 text-emerald-600" />
          <p className="font-medium text-slate-600">Pilih rentang tanggal dan klik "Tarik Data"</p>
          <p className="text-sm mt-1">Data order produksi akan ditampilkan di sini.</p>
        </div>
      )}

      {data !== null && data.length === 0 && (
        <div className="card text-center py-20 text-slate-500 flex flex-col items-center">
          <Search size={48} className="mb-4 opacity-20" />
          <p>Tidak ada data order ditemukan pada rentang tanggal tersebut.</p>
        </div>
      )}

      {data !== null && data.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-base">
                  <Package size={18} className="text-emerald-500" /> Hasil Pencarian
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-medium bg-slate-50 border border-slate-100 px-2 py-0.5 rounded shadow-sm w-fit">
                  <Clock size={10} className="text-emerald-500/70" />
                  Diperbarui: {lastUpdated}
                </div>
              )}
            </div>
          </div>

          {/* Global Style Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari faktur, produk, pelanggan..." 
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-auto" style={{ maxHeight: '350px' }}>
              <table className="w-full text-left relative">
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
            <span>
              {filteredData.length === 0
                ? 'Tidak ada data'
                : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredData.length)} dari ${filteredData.length} data`}
            </span>

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
        </div>
      )}
    </div>
  );
}
