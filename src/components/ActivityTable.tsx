'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 50;

export default function ActivityTable({ initialLogs }: { initialLogs: any[] }) {
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
      
      return `${day} ${month} ${year} ${time}`;
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
      const channel = getChannelName(log.table_name).toLowerCase();
      const pesan = (log.message || '').toLowerCase();
      const dbDate = (log.created_at || '').toLowerCase();
      const raw = (log.raw_data || '').toLowerCase();
      
      return channel.includes(q) || pesan.includes(q) || dbDate.includes(q) || raw.includes(q);
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
      <div className="flex flex-col gap-2 shrink-0 px-1 mt-1">
        <h3 className="text-sm font-semibold text-slate-800">Aktivitas Terkini</h3>
        <div className="relative w-full">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Cari channel, pesan..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden flex flex-col border border-slate-200 shadow-sm min-h-0">
        <div className="overflow-auto bg-white flex-1 min-h-0 custom-scrollbar" onScroll={handleScroll}>
          <table className="w-full text-left relative min-w-[800px]">
            <thead className="sticky top-0 z-10">
              <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2 font-semibold w-40 whitespace-nowrap">Datetime</th>
                <th className="px-4 py-2 font-semibold w-36 whitespace-nowrap">Channel</th>
                <th className="px-4 py-2 font-semibold w-64 whitespace-nowrap">Pesan</th>
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
                    <tr key={log.id} className="text-[11px] hover:bg-slate-50 transition-colors align-top">
                      <td className="px-4 py-2 text-emerald-600 font-mono w-40 whitespace-nowrap">
                        {fmtDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-700 w-36">
                        {getChannelName(log.table_name)}
                      </td>
                      <td className="px-4 py-2 text-slate-500 w-64 leading-relaxed">
                        {log.message}
                      </td>
                      <td className="px-4 py-2">
                        <details className="group">
                          <summary className="cursor-pointer text-emerald-600 hover:text-emerald-700 font-medium select-none text-[10px] list-none flex items-center gap-1">
                            <svg className="w-2.5 h-2.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            Lihat Data
                          </summary>
                          <div className="mt-1 bg-slate-100 p-1.5 rounded whitespace-pre-wrap font-mono text-[9px] text-slate-600 break-all w-full leading-tight">
                            {JSON.stringify(parsedData, null, 2)}
                          </div>
                        </details>
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
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 mt-2">
        <span className="font-medium">
          {filtered.length === 0
            ? 'Tidak ada data'
            : `Menampilkan ${paginated.length} dari ${filtered.length} entri`}
        </span>
      </div>
    </div>
  );
}
