'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 50;

export default function ActivityTable({ initialLogs }: { initialLogs: any[] }) {
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sikka_data_updated') {
        startTransition(() => {
          router.refresh();
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  const fmtDateTime = (dt: string | null | undefined) => {
    if (!dt) return null;
    try {
      let validDt = dt;
      if (!dt.includes('Z') && !dt.includes('+')) {
        validDt = dt.replace(' ', 'T') + 'Z';
      }
      const d = new Date(validDt);
      
      const day = d.toLocaleString('id-ID', { day: '2-digit', timeZone: 'Asia/Jakarta' });
      const month = d.toLocaleString('id-ID', { month: 'short', timeZone: 'Asia/Jakarta' });
      const year = d.toLocaleString('id-ID', { year: 'numeric', timeZone: 'Asia/Jakarta' });
      const time = d.toLocaleString('id-ID', { 
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' 
      });
      
      return `${day} ${month} ${year}, ${time}`;
    } catch {
      return dt;
    }
  };

  const getChannelName = (tableName: string) => {
    switch (tableName) {
      case 'employees': return 'Data Karyawan';
      case 'orders': return 'Order Produksi';
      case 'bahan_baku': return 'Bahan Baku (BBB)';
      case 'barang_jadi': return 'Barang Hasil Produksi';
      case 'hpp_kalkulasi': return 'HPP Kalkulasi';
      case 'sales_reports': return 'Laporan Penjualan';
      case 'infractions': return 'Catat Kesalahan';
      default: return 'Catat Kesalahan';
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return initialLogs;
    const q = search.toLowerCase();
    
    return initialLogs.filter((log) => {
      const menu = getChannelName(log.table_name).toLowerCase();
      const user = (log.recorded_by || '').toLowerCase();
      const keterangan = (log.message || '').toLowerCase();
      const dbDate = (log.created_at || '').toLowerCase();
      const raw = (log.raw_data || '').toLowerCase();
      
      return (
        menu.includes(q) || 
        user.includes(q) || 
        keterangan.includes(q) || 
        dbDate.includes(q) || 
        raw.includes(q)
      );
    });
  }, [initialLogs, search]);

  const paginated = filtered.slice(0, visibleCount);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (visibleCount < filtered.length) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      {/* Search */}
      {/* Search */}
      <div className="flex items-center justify-between shrink-0 px-1 mt-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Aktivitas Terkini</h3>
        <div className="relative w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Cari menu, user, keterangan..."
            className="w-full pl-8 pr-3 h-8 text-sm bg-white border border-gray-100 rounded-lg focus:outline-none focus:border-green-500 transition-all shadow-sm shadow-black/5"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden flex flex-col border border-slate-200 shadow-sm min-h-0">
        <div className="overflow-auto bg-white flex-1 min-h-0 custom-scrollbar" onScroll={handleScroll}>
          <table className="w-full text-left relative min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-sm">
              <tr className="text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100">
                <th className="px-4 py-2 font-semibold w-40 whitespace-nowrap">Datetime</th>
                <th className="px-4 py-2 font-semibold w-36 whitespace-nowrap">Menu</th>
                <th className="px-4 py-2 font-semibold w-32 whitespace-nowrap">User</th>
                <th className="px-4 py-2 font-semibold w-64 whitespace-nowrap">Keterangan</th>
                <th className="px-4 py-2 font-semibold whitespace-nowrap">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 italic text-sm">
                    {search ? 'Tidak ada hasil yang cocok.' : 'Belum ada aktivitas yang dicatat.'}
                  </td>
                </tr>
              ) : (
                paginated.map((log) => {
                  let parsedData = {};
                  try { parsedData = JSON.parse(log.raw_data); } catch (e) {}
                  
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors align-top">
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono w-48 whitespace-nowrap">
                        {fmtDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-sm text-gray-700 w-44">
                        {getChannelName(log.table_name)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 w-32 whitespace-nowrap pt-3.5">
                        {log.recorded_by || 'System'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 w-[unset] leading-relaxed truncate max-w-[400px]">
                        {log.message}
                      </td>
                      <td className="px-4 py-3 w-32">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors outline-none"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          Lihat Data
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-2 mt-2 pt-3 border-t border-gray-100">
        <span>
          {filtered.length === 0
            ? 'Tidak ada data'
            : `Menampilkan ${paginated.length} dari ${filtered.length} entri`}
        </span>
      </div>
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Detail Data Aktivitas
              </h4>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Menu</span>
                  <p className="text-sm font-medium text-slate-700">{getChannelName(selectedLog.table_name)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">User</span>
                  <p className="text-sm font-medium text-slate-700">{selectedLog.recorded_by || 'System'}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Datetime</span>
                <p className="text-sm font-medium text-slate-700">{fmtDateTime(selectedLog.created_at)}</p>
              </div>
              
              <div className="mb-4">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Keterangan</span>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedLog.message}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 block">Raw Data JSON</span>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                  <pre className="text-[11px] font-mono text-slate-600 whitespace-pre-wrap break-all leading-tight">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.raw_data), null, 2);
                      } catch (e) {
                        return selectedLog.raw_data;
                      }
                    })()}
                  </pre>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
          {/* Backdrop closer */}
          <div className="absolute inset-0 -z-10" onClick={() => setSelectedLog(null)} />
        </div>
      )}
    </div>
  );
}
