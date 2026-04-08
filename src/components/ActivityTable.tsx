'use client';

import { useState, useMemo, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, History, Loader2 } from 'lucide-react';
import { getLiveRecord } from '@/lib/actions';
import { DataTable } from './ui/DataTable';
import { Database, Cpu, User as UserIcon, Calendar as CalendarIcon, Info } from 'lucide-react';

const PAGE_SIZE = 50;

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Jakarta'
});

export default function ActivityTable({ initialLogs }: { initialLogs: any[] }) {
  const [search, setSearch] = useState('');
  const [searchImmediate, setSearchImmediate] = useState('');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [liveData, setLiveData] = useState<any | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [loadTime, setLoadTime] = useState<number | null>(null);

  // Column Widths for persistence
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    created_at: 180,
    menu: 180,
    recorded_by: 140,
    message: 400,
    action: 100
  });

  useEffect(() => {
    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        startTransition(() => {
          router.refresh();
        });
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') handleRefresh();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchImmediate), 300);
    return () => clearTimeout(timer);
  }, [searchImmediate]);

  useEffect(() => {
    if (selectedLog && selectedLog.table_name && selectedLog.record_id) {
      setIsLoadingLive(true);
      setLiveData(null);
      getLiveRecord(selectedLog.table_name, selectedLog.record_id)
        .then(data => setLiveData(data))
        .finally(() => setIsLoadingLive(false));
    }
  }, [selectedLog]);

  useEffect(() => {
    const start = performance.now();
    setTimeout(() => setLoadTime(Math.round(performance.now() - start)), 50);
  }, []);

  const fmtDateTime = (dt: string | null | undefined) => {
    if (!dt) return null;
    try {
      let validDt = dt;
      if (!dt.includes('Z') && !dt.includes('+')) validDt = dt.replace(' ', 'T') + 'Z';
      const parts = dateFormatter.formatToParts(new Date(validDt));
      const p: Record<string, string> = {};
      parts.forEach(part => { p[part.type] = part.value; });
      return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute}:${p.second}`;
    } catch { return dt; }
  };

  const getChannelName = useCallback((log: any) => {
    if (!log) return 'Sistem';
    const tableName = log.table_name || '';
    const msg = log.message || '';
    if (tableName === 'users') {
      if (msg.includes('Profil diperbarui')) return 'Pengaturan Profil';
      return 'Kelola User';
    }
    switch (tableName) {
      case 'employees': return 'Data Karyawan';
      case 'orders': return 'Order Produksi';
      case 'bahan_baku': return 'Bahan Baku (BBB)';
      case 'barang_jadi': return 'Barang Hasil Produksi';
      case 'hpp_kalkulasi': return 'HPP Kalkulasi';
      case 'sales_reports': return 'Laporan Penjualan';
      case 'infractions': return 'Catat Kesalahan';
      default: return tableName.replace('_', ' ').toUpperCase() || 'Sistem';
    }
  }, []);

  const sortedAndFiltered = useMemo(() => {
    let result = [...initialLogs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((log) => {
        const menu = getChannelName(log).toLowerCase();
        const user = (log.recorded_by || '').toLowerCase();
        const keterangan = (log.message || '').toLowerCase();
        return menu.includes(q) || user.includes(q) || keterangan.includes(q);
      });
    }
    return result;
  }, [initialLogs, search, getChannelName]);

  const columns = useMemo(() => [
    {
      accessorKey: 'created_at',
      header: 'Waktu',
      size: 180,
      cell: (info: any) => (
        <span className="text-[12px] font-bold text-gray-400 font-mono tracking-tight leading-none">
          {fmtDateTime(info.getValue())}
        </span>
      )
    },
    {
      id: 'menu',
      header: 'Menu',
      size: 180,
      cell: (info: any) => (
        <span className="text-[12px] font-bold text-gray-800 leading-none">
          {getChannelName(info.row.original)}
        </span>
      )
    },
    {
      accessorKey: 'recorded_by',
      header: 'User',
      size: 140,
      cell: (info: any) => (
        <span className="font-bold px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-500 border border-gray-200/50 leading-none">
          {info.getValue() || 'System'}
        </span>
      )
    },
    {
      accessorKey: 'message',
      header: 'Keterangan',
      size: 400,
      cell: (info: any) => (
        <span className="text-[12px] text-gray-500 truncate block leading-none" title={info.getValue()}>
          {info.getValue()}
        </span>
      )
    },
    {
      id: 'action',
      header: 'Aksi',
      size: 100,
      meta: { align: 'right' },
      cell: (info: any) => (
        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 group-[.is-selected]:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedLog(info.row.original); }}
            className="px-3 py-1 text-[11px] font-extrabold text-[#16a34a] border border-[#16a34a]/30 hover:bg-[#16a34a] hover:text-white rounded-[8px] transition-all active:scale-[0.95] leading-none"
          >
            Detail
          </button>
        </div>
      )
    }
  ], [getChannelName]);

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex items-center px-1">
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-extrabold text-gray-800 flex items-center gap-2">
                <History size={18} className="text-green-600" /> 
                <span>Aktivitas Terkini</span>
            </h3>
            {sortedAndFiltered.length !== initialLogs.length && (
              <div className="flex items-center gap-3">
                <span className="text-gray-200 text-xs mx-1">|</span>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider border border-amber-100/50 animate-in fade-in zoom-in-95">
                  {sortedAndFiltered.length} HASIL
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="relative w-full shrink-0 group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-500 transition-colors" />
          <input
            type="text"
            value={searchImmediate}
            onChange={(e) => setSearchImmediate(e.target.value)}
            placeholder="Cari menu, user, atau keterangan..."
            className="w-full pl-12 pr-4 h-10 bg-white border border-gray-100 rounded-[8px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 gap-4 overflow-hidden">
        <DataTable
          columns={columns}
          data={sortedAndFiltered}
          isLoading={isPending}
          selectedIds={selectedIds}
          onRowClick={(id) => {
            const next = new Set(selectedIds);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setSelectedIds(next);
          }}
          onRowDoubleClick={(id) => {
            const log = sortedAndFiltered.find(l => l.id === id);
            if (log) setSelectedLog(log);
          }}
          columnWidths={columnWidths}
          onColumnWidthChange={setColumnWidths}
        />

        <div className="flex items-center justify-between shrink-0 px-1 mt-1">
          <span className="text-[12px] leading-none font-bold text-gray-400">
            {initialLogs.length === 0 ? 'Belum ada aktivitas' : `Menampilkan ${sortedAndFiltered.length} dari ${initialLogs.length} total aktivitas`}
          </span>
          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                <span className="text-[12px] font-bold text-gray-400 leading-none">{selectedIds.size} dipilih</span>
                <button onClick={() => setSelectedIds(new Set())} className="text-[12px] font-black text-rose-500 hover:text-rose-600 underline underline-offset-4 leading-none">Batal</button>
              </div>
            )}
            {loadTime !== null && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm border ${
                loadTime < 300 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
              }`}>
                <span className="animate-pulse">⚡</span>
                <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[8px] shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-green-500/10 flex items-center justify-center text-green-600">
                  <Cpu size={20} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">Detail Log Aktivitas</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Informasi audit sistem & sinkronisasi data real-time</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                aria-label="Tutup Detail"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar bg-white flex-1">
              {/* Top Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-[8px] p-3 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon size={14} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pelaku (recorded_by)</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{selectedLog.recorded_by || 'System'}</p>
                </div>
                <div className="bg-slate-50 rounded-[8px] p-3 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarIcon size={14} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Waktu Kejadian</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{fmtDateTime(selectedLog.created_at)}</p>
                </div>
                <div className="bg-indigo-50 rounded-[8px] p-3 border border-indigo-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Database size={14} className="text-indigo-400" />
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Target Tabel & ID</span>
                  </div>
                  <p className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                    <span className="bg-indigo-100 px-1.5 py-0.5 rounded text-[11px] uppercase">{selectedLog.table_name}</span>
                    <span>#{selectedLog.record_id}</span>
                  </p>
                </div>
              </div>

              <div className="mb-6">
                 <div className="flex items-center gap-2 mb-2">
                    <Info size={16} className="text-amber-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase">Keterangan Aktivitas</span>
                  </div>
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-[8px] text-sm text-slate-700 leading-relaxed font-medium">
                    {selectedLog.message}
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Snapshot Data */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-500 uppercase">Snapshot Log (Data Saat Kejadian)</span>
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded-[8px] overflow-hidden border border-slate-800 shadow-xl">
                    <div className="px-4 py-2 bg-slate-800 border-b border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">audit_snapshot.json</span>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-400/30" />
                        <div className="w-2 h-2 rounded-full bg-amber-400/30" />
                        <div className="w-2 h-2 rounded-full bg-green-400/30" />
                      </div>
                    </div>
                    <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar-dark">
                      <pre className="text-[11px] font-mono text-green-400 whitespace-pre-wrap break-all leading-tight">
                        {(() => {
                          try {
                            const raw = JSON.parse(selectedLog.raw_data);
                            // Combine with other interesting fields
                            const fullLog = {
                              action: selectedLog.action_type,
                              table: selectedLog.table_name,
                              record_id: selectedLog.record_id,
                              snapshot: raw
                            };
                            return JSON.stringify(fullLog, null, 2);
                          } catch (e) {
                            return selectedLog.raw_data;
                          }
                        })()}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Live Data */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-green-500" />
                      <span className="text-xs font-bold text-slate-500 uppercase">Live Record (Data Terkini di DB)</span>
                    </div>
                    {isLoadingLive && <span className="text-[10px] text-green-600 font-bold animate-pulse">MEMUAT...</span>}
                  </div>
                  <div className="bg-slate-900 rounded-[8px] overflow-hidden border border-slate-800 shadow-xl">
                    <div className="px-4 py-2 bg-slate-800 border-b border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">current_db_state.json</span>
                      {liveData ? (
                         <span className="text-[9px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">TERKONEKSI</span>
                      ) : !isLoadingLive && (
                         <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">DATA DIHAPUS / TIDAK ADA</span>
                      )}
                    </div>
                    <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar-dark">
                      {isLoadingLive ? (
                        <div className="py-20 flex flex-col items-center justify-center opacity-30">
                          <Loader2 size={32} className="animate-spin text-green-500 mb-4" />
                          <p className="text-[10px] font-mono text-green-400">Fetching live record...</p>
                        </div>
                      ) : liveData ? (
                        <pre className="text-[11px] font-mono text-blue-400 whitespace-pre-wrap break-all leading-tight">
                          {JSON.stringify(liveData, null, 2)}
                        </pre>
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                          <p className="text-[11px] font-mono text-slate-500 italic">
                            Record ini sudah dihapus dari database atau tidak dapat ditemukan.<br/>
                            Hanya data snapshot historis yang tersedia.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-white border border-slate-200 rounded-[8px] text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
              >
                Tutup Jendela
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






