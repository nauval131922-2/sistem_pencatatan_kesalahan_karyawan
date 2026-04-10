'use client';

import { useState, useMemo, useEffect, useTransition, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, History, Clock, X, Cpu, User as UserIcon, Calendar as CalendarIcon, Database, Info, Loader2 } from 'lucide-react';
import { formatLastUpdate } from '@/lib/date-utils';
import { getLiveRecord } from '@/lib/actions';

export default function ActivityTable({ initialLogs }: { initialLogs: any[] }) {
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  
  // Modal states
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [liveData, setLiveData] = useState<any | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
    if (selectedLog && selectedLog.table_name && selectedLog.record_id) {
      setIsLoadingLive(true);
      setLiveData(null);
      getLiveRecord(selectedLog.table_name, selectedLog.record_id)
        .then(data => setLiveData(data))
        .finally(() => setIsLoadingLive(false));
    }
  }, [selectedLog]);

  // filteredLogs must be declared BEFORE useEffect that depends on it
  const filteredLogs = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return initialLogs;
    return initialLogs.filter(log => (
      (log.action_type || '').toLowerCase().includes(term) ||
      (log.table_name || '').toLowerCase().includes(term) ||
      (log.message || '').toLowerCase().includes(term) ||
      (log.recorded_by || '').toLowerCase().includes(term) ||
      (log.raw_data || '').toLowerCase().includes(term)
    ));
  }, [initialLogs, search]);

  const displayedLogs = filteredLogs.slice(0, visibleCount);

  // Load time measurement
  useEffect(() => {
    const start = performance.now();
    setTimeout(() => setLoadTime(Math.round(performance.now() - start)), 50);
  }, []);

  // Infinite scroll: observe sentinel at bottom of list
  const loadMore = useCallback(() => {
    setVisibleCount(v => v + 50);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, filteredLogs]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'LOGIN': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'MAINTENANCE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CRON_SYNC': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'UPLOAD':
      case 'IMPORT': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Find which fields in raw_data contain the search term
  const getSnapshotMatches = (log: any): { key: string; value: string }[] => {
    if (!search.trim() || !log.raw_data) return [];
    // If other fields already matched, don't show snapshot hints
    const term = search.toLowerCase();
    const directMatch =
      (log.action_type || '').toLowerCase().includes(term) ||
      (log.table_name || '').toLowerCase().includes(term) ||
      (log.message || '').toLowerCase().includes(term) ||
      (log.recorded_by || '').toLowerCase().includes(term);
    if (directMatch) return [];
    try {
      const parsed = JSON.parse(log.raw_data);
      const matches: { key: string; value: string }[] = [];
      const scan = (obj: any, prefix = '') => {
        for (const [k, v] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${k}` : k;
          if (typeof v === 'object' && v !== null) {
            scan(v, fullKey);
          } else {
            const strVal = String(v ?? '');
            if (strVal.toLowerCase().includes(term)) {
              matches.push({ key: fullKey, value: strVal });
            }
          }
        }
      };
      scan(parsed);
      return matches.slice(0, 3); // max 3 hints per card
    } catch {
      return [];
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 w-full animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex items-center px-1">
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-extrabold text-gray-800 flex items-center gap-2">
              <History size={18} className="text-green-600" />
              <span>Aktivitas Terkini</span>
            </h3>
            {filteredLogs.length !== initialLogs.length && (
              <div className="flex items-center gap-3">
                <span className="text-gray-200 text-xs mx-1">|</span>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider border border-amber-100/50 animate-in fade-in zoom-in-95">
                  {filteredLogs.length} HASIL
                </span>
              </div>
            )}
            {isPending && <Loader2 size={14} className="animate-spin text-gray-400" />}
          </div>
        </div>
        <div className="relative w-full shrink-0 group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-500 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari menu, user, atau keterangan..."
            className="w-full pl-12 pr-4 h-10 bg-white border border-gray-100 rounded-[8px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col relative">
        <div className="overflow-auto flex-1 p-2">
          {filteredLogs.length === 0 ? (
            <div className="p-8 flex items-center justify-center text-gray-400 text-[13px] font-bold">
               Tidak ada histori log yang sesuai pencarian.
            </div>
          ) : (
            <div className="w-full space-y-2">
              {displayedLogs.map((log) => (
                <div 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-[8px] border border-gray-100 hover:border-green-200 bg-white hover:bg-green-50/30 transition-all cursor-pointer"
                >
                  
                  <div className="flex gap-4 items-start min-w-0">
                    <div className="shrink-0 mt-1">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md border ${getActionColor(log.action_type)}`}>
                        {log.action_type}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="font-bold text-[13px] text-gray-800 break-words leading-tight group-hover:text-green-700 transition-colors">
                        {log.message}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="text-gray-300">Tabel:</span> 
                          <span className="text-gray-600 uppercase tracking-tighter">{log.table_name}</span>
                        </span>
                        {log.record_id > 0 && (
                           <>
                             <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                             <span className="text-gray-500">ID: {log.record_id}</span>
                           </>
                        )}
                        <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                        <span className="flex items-center gap-1.5 text-gray-500">
                           Oleh: <span className="font-bold text-gray-700">@{log.recorded_by || 'system'}</span>
                        </span>
                      </div>
                      {/* Snapshot match hints */}
                      {(() => {
                        const matches = getSnapshotMatches(log);
                        if (matches.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider self-center">Snapshot:</span>
                            {matches.map(({ key, value }) => (
                              <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 border border-violet-200 text-[10px] font-semibold text-violet-700 max-w-[280px]">
                                <span className="font-extrabold shrink-0">{key}</span>
                                <span className="text-violet-400 shrink-0">:</span>
                                <span className="truncate">{value.length > 45 ? value.slice(0, 45) + '…' : value}</span>
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <button className="opacity-0 group-hover:opacity-100 px-3 py-1 text-[11px] font-extrabold text-[#16a34a] border border-[#16a34a]/30 bg-white hover:bg-[#16a34a] hover:text-white rounded-[8px] transition-all leading-none">
                      Detail
                    </button>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                       <Clock size={12} className="text-gray-400" />
                       {formatLastUpdate(log.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Infinite scroll sentinel */}
              {visibleCount < filteredLogs.length && (
                <div ref={sentinelRef} className="flex items-center justify-center py-4">
                  <Loader2 size={18} className="animate-spin text-gray-300" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between shrink-0 px-1">
        <span className="text-[12px] leading-none font-bold text-gray-400">
          {initialLogs.length === 0
            ? 'Belum ada aktivitas'
            : `Menampilkan ${Math.min(visibleCount, filteredLogs.length)} dari ${filteredLogs.length} total aktivitas`}
        </span>
        {loadTime !== null && (
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm border ${
            loadTime < 300 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
          }`}>
            <span className="animate-pulse">⚡</span>
            <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
          </span>
        )}
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
                  <p className="text-sm font-bold text-slate-700">{formatLastUpdate(selectedLog.created_at)}</p>
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

              {selectedLog.raw_data && (
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
                              return JSON.stringify({ action: selectedLog.action_type, table: selectedLog.table_name, record_id: selectedLog.record_id, snapshot: raw }, null, 2);
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
                          <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">DATA DIHAPUS</span>
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
              )}
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






