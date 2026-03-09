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
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' 
      });
      
      return `${day} ${month} ${year}, ${time}`;
    } catch {
      return dt;
    }
  };

  const getChannelName = (tableName: string) => {
    switch (tableName) {
      case 'employees': return 'Data Karyawan';
      case 'users': return 'Kelola User';
      case 'orders': return 'Order Produksi';
      case 'bahan_baku': return 'Bahan Baku (BBB)';
      case 'barang_jadi': return 'Barang Hasil Produksi';
      case 'hpp_kalkulasi': return 'HPP Kalkulasi';
      case 'sales_reports': return 'Laporan Penjualan';
      case 'infractions': return 'Catat Kesalahan';
      default: return tableName || 'Sistem';
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
      <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[10px] flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="overflow-auto flex-1 min-h-0 custom-scrollbar" onScroll={handleScroll}>
          <table className="w-full text-left relative min-w-[800px] border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
              <tr className="text-[11px] text-[#6b7280] font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5 w-48">DATETIME</th>
                <th className="px-6 py-3.5 w-44">MENU</th>
                <th className="px-6 py-3.5 w-32">USER</th>
                <th className="px-6 py-3.5">KETERANGAN</th>
                <th className="px-6 py-3.5 w-32 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <p className="text-sm font-extrabold text-gray-800 mb-2">
                      {search ? 'Tidak ada hasil ditemukan' : 'Belum ada aktivitas'}
                    </p>
                    <p className="text-[12px] text-[#9ca3af] font-medium">
                      {search ? 'Coba kata kunci lain.' : 'Aktivitas sistem akan muncul di sini.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((log, idx) => (
                  <tr 
                    key={log.id} 
                    className={`hover:bg-green-50/30 transition-colors group h-10 ${idx % 2 === 1 ? 'bg-[#f9fafb]' : 'bg-white'}`}
                  >
                    <td className="px-6 py-1 text-xs text-gray-400 font-mono whitespace-nowrap">
                      {fmtDateTime(log.created_at)}
                    </td>
                    <td className="px-6 py-1">
                      <span className="text-[13px] font-bold text-gray-700">
                        {getChannelName(log.table_name)}
                      </span>
                    </td>
                    <td className="px-6 py-1 text-xs text-gray-400 font-medium whitespace-nowrap">
                      {log.recorded_by || 'System'}
                    </td>
                    <td className="px-6 py-1 text-[13px] text-gray-500 truncate max-w-[400px]">
                      {log.message}
                    </td>
                    <td className="px-6 py-1 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1 text-[11px] font-extrabold text-[#16a34a] border border-[#16a34a]/30 hover:bg-[#16a34a] hover:text-white rounded-md transition-all active:scale-[0.95]"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
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
                  <span className="text-[10px] text-slate-400 font-bold">Menu</span>
                  <p className="text-sm font-medium text-slate-700">{getChannelName(selectedLog.table_name)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold">User</span>
                  <p className="text-sm font-medium text-slate-700">{selectedLog.recorded_by || 'System'}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-[10px] text-slate-400 font-bold">Datetime</span>
                <p className="text-sm font-medium text-slate-700">{fmtDateTime(selectedLog.created_at)}</p>
              </div>
              
              <div className="mb-4">
                <span className="text-[10px] text-slate-400 font-bold">Keterangan</span>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedLog.message}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold mb-1 block">Raw Data JSON</span>
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
