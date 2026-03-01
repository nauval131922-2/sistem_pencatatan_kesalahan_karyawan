'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

export default function ActivityTable({ initialLogs }: { initialLogs: any[] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fmtDateTime = (dt: string | null | undefined) => {
    if (!dt) return null;
    try {
      let validDt = dt;
      if (!dt.includes('Z') && !dt.includes('+')) {
        validDt = dt.replace(' ', 'T') + 'Z';
      }
      const d = new Date(validDt);
      
      const day = d.toLocaleString('en-GB', { day: '2-digit', timeZone: 'Asia/Jakarta' });
      const month = d.toLocaleString('id-ID', { month: 'short', timeZone: 'Asia/Jakarta' });
      const year = d.toLocaleString('en-GB', { year: 'numeric', timeZone: 'Asia/Jakarta' });
      const time = d.toLocaleString('en-GB', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' 
      });
      
      return `${day} ${month} ${year} ${time}`;
    } catch {
      return dt;
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return initialLogs;
    const q = search.toLowerCase();
    
    return initialLogs.filter((log) => {
      let channel = 'catat kesalahan';
      if (log.table_name === 'employees') channel = 'data karyawan';
      if (log.table_name === 'orders') channel = 'order produksi';
      
      const pesan = (log.message || '').toLowerCase();
      const dbDate = (log.created_at || '').toLowerCase();
      const raw = (log.raw_data || '').toLowerCase();
      
      return channel.includes(q) || pesan.includes(q) || dbDate.includes(q) || raw.includes(q);
    });
  }, [initialLogs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <h3 className="text-base font-semibold mb-2">Aktivitas Terkini</h3>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Cari channel, pesan, atau data..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: '280px' }}>
          <table className="w-full text-left relative">
            <thead className="sticky top-0 z-10">
              <tr className="text-slate-500 text-sm border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 font-medium w-40 whitespace-nowrap">Datetime</th>
                <th className="px-5 py-3 font-medium w-36 whitespace-nowrap">Channel</th>
                <th className="px-5 py-3 font-medium w-64 whitespace-nowrap">Pesan</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Data</th>
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
                    <tr key={log.id} className="text-sm hover:bg-slate-50 transition-colors align-top">
                      <td className="px-5 py-3 text-emerald-600 font-mono text-xs w-40 whitespace-nowrap">
                        {fmtDateTime(log.created_at)}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-700 w-36">
                        {log.table_name === 'employees' ? 'Data Karyawan' : log.table_name === 'orders' ? 'Order Produksi' : 'Catat Kesalahan'}
                      </td>
                      <td className="px-5 py-3 text-slate-500 w-64">
                        {log.message}
                      </td>
                      <td className="px-5 py-3">
                        <details className="group">
                          <summary className="cursor-pointer text-emerald-600 hover:text-emerald-700 font-medium select-none text-xs list-none flex items-center gap-1">
                            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            Lihat Data
                          </summary>
                          <div className="mt-2 bg-slate-100 p-2 rounded whitespace-pre-wrap font-mono text-[10px] text-slate-600 break-all w-full">
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

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {filtered.length === 0
            ? 'Tidak ada data'
            : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} dari ${filtered.length} entri`}
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
  );
}
