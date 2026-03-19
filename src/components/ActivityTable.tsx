'use client';

import { useState, useMemo, useEffect, useTransition, useCallback, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, X, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import { getLiveRecord } from '@/lib/actions';
import { Database, History, Cpu, User as UserIcon, Calendar as CalendarIcon, Info } from 'lucide-react';

const PAGE_SIZE = 50;

function SortIcon({ config, sortKey }: { config: any, sortKey: string }) {
  if (config.key !== sortKey || !config.direction) {
    return <ArrowUpDown size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
  }
  return config.direction === 'asc' 
    ? <ArrowUp size={12} className="text-green-600" /> 
    : <ArrowDown size={12} className="text-green-600" />;
}

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
  const parentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [liveData, setLiveData] = useState<any | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: 'created_at',
    direction: null
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);


  // Column Resizing State
  const [columnWidths, setColumnWidths] = useState({
    datetime: 200,
    menu: 170,
    user: 130,
    keterangan: 400, // starting width for flex column
  });

  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const isResizingDone = useRef(false);

  const startResizing = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      key,
      startX: e.clientX,
      startWidth: (columnWidths as any)[key]
    };

    const handleMouseMove = (mouseEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const { key, startX, startWidth } = resizingRef.current;
      const moveX = mouseEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + moveX);
      setColumnWidths(prev => ({ ...prev, [key]: newWidth }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      isResizingDone.current = true;
      setTimeout(() => { isResizingDone.current = false; }, 100);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchImmediate);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchImmediate]);
  useEffect(() => {
    if (selectedLog && selectedLog.table_name && selectedLog.record_id) {
      setIsLoadingLive(true);
      setLiveData(null);
      getLiveRecord(selectedLog.table_name, selectedLog.record_id)
        .then(data => {
          setLiveData(data);
        })
        .finally(() => {
          setIsLoadingLive(false);
        });
    }
  }, [selectedLog]);


  useEffect(() => {
    // Initial load time simulation / placeholder for consistency
    const start = performance.now();
    setTimeout(() => {
      setLoadTime(Math.round(performance.now() - start));
    }, 50);
  }, []);


  const fmtDateTime = (dt: string | null | undefined) => {
    if (!dt) return null;
    try {
      let validDt = dt;
      if (!dt.includes('Z') && !dt.includes('+')) {
        validDt = dt.replace(' ', 'T') + 'Z';
      }
      const parts = dateFormatter.formatToParts(new Date(validDt));
      const p: Record<string, string> = {};
      parts.forEach(part => { p[part.type] = part.value; });
      return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute}:${p.second}`;
    } catch {
      return dt;
    }
  };

  const getChannelName = useCallback((log: any) => {
    if (!log) return 'Sistem';
    const tableName = log.table_name || '';
    const msg = log.message || '';
    
    // Explicit mapping for users to differentiate between Admin menu and Self-Profile
    if (tableName === 'users') {
      if (msg.includes('Profil diperbarui')) return 'Pengaturan Profil';
      return 'Kelola User';
    }

    switch (tableName) {
      case 'employees': return 'Data Karyawan';
      case 'users': return 'Kelola User';
      case 'orders': return 'Order Produksi';
      case 'bahan_baku': return 'Bahan Baku (BBB)';
      case 'barang_jadi': return 'Barang Hasil Produksi';
      case 'hpp_kalkulasi': return 'HPP Kalkulasi';
      case 'sales_reports': return 'Laporan Penjualan';
      case 'infractions': return 'Catat Kesalahan';
      default: return tableName.replace('_', ' ').toUpperCase() || 'Sistem';
    }
  }, []);

  const handleSort = (key: string) => {
    if (isResizingDone.current) return;
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key, direction: null };
        return { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedAndFiltered = useMemo(() => {
    let result = [...initialLogs];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((log) => {
        const menu = getChannelName(log).toLowerCase();
        const user = (log.recorded_by || '').toLowerCase();
        const keterangan = (log.message || '').toLowerCase();
        const dbDate = (log.created_at || '').toLowerCase();
        const raw = (log.raw_data || '').toLowerCase();
        const tableName = (log.table_name || '').toLowerCase();
        const recordId = String(log.record_id || '').toLowerCase();
        const actionType = (log.action_type || '').toLowerCase();
        
        return (
          menu.includes(q) || 
          user.includes(q) || 
          keterangan.includes(q) || 
          dbDate.includes(q) || 
          raw.includes(q) ||
          tableName.includes(q) ||
          recordId.includes(q) ||
          actionType.includes(q)
        );
      });
    }

    // Sort
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'created_at':
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          case 'menu':
            aValue = getChannelName(a);
            bValue = getChannelName(b);
            break;
          case 'user':
            aValue = a.recorded_by || 'System';
            bValue = b.recorded_by || 'System';
            break;
          case 'message':
            aValue = a.message;
            bValue = b.message;
            break;
          default:
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [initialLogs, search, sortConfig, getChannelName]);

  const virtualizer = useVirtualizer({
    count: sortedAndFiltered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Scroll to top when search changes
  useEffect(() => {
    if (search) {
      virtualizer.scrollToIndex(0);
    }
  }, [search, virtualizer]);

  const toggleSelectRow = (id: number, e: React.MouseEvent) => {
    let next = new Set(selectedIds);

    if (e.shiftKey && lastSelectedId !== null) {
      const currentIndex = sortedAndFiltered.findIndex(item => item.id === id);
      const lastIndex = sortedAndFiltered.findIndex(item => item.id === lastSelectedId);
      
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        
        if (!e.ctrlKey && !e.metaKey) next = new Set();
        for (let i = start; i <= end; i++) {
          next.add(sortedAndFiltered[i].id);
        }
      }
    } else if (e.ctrlKey || e.metaKey) {
      if (next.has(id)) next.delete(id);
      else next.add(id);
    } else {
      // Single click (no modifier)
      if (next.has(id)) {
        // Only deselect if it's a single click (not part of a double click)
        if (e.detail === 1) {
          next.clear();
        }
      } else {
        next = new Set([id]);
      }
    }

    setSelectedIds(next);
    setLastSelectedId(id);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchImmediate(e.target.value);
  };

  return (
    <div className="flex flex-col gap-6 overflow-hidden">
      {/* Heading & Search Container */}
      <div className="flex flex-col gap-3 shrink-0">
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
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
          <input
            type="text"
            value={searchImmediate}
            onChange={handleSearch}
            placeholder="Cari menu, user, keterangan, snapshot log, atau ID..."
            className="w-full pl-12 pr-4 h-12 bg-white border border-gray-200 rounded-[14px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[10px] flex-1 flex flex-col min-h-0 overflow-hidden">
        <div 
          ref={parentRef}
          className="overflow-auto flex-1 min-h-0 custom-scrollbar" 
        >
          <div 
            className="w-full min-w-[800px]"
          >
            {/* Fake Table Header for alignment */}
            <div 
              className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)] w-full flex text-left"
              style={{ minWidth: `${columnWidths.datetime + columnWidths.menu + columnWidths.user + columnWidths.keterangan + 100}px` }}
            >
              <div 
                className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors group flex-shrink-0 relative border-r border-gray-100"
                style={{ width: columnWidths.datetime }}
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-2 text-[11px] text-[#6b7280] font-bold uppercase tracking-wider">
                  DATETIME <SortIcon config={sortConfig} sortKey="created_at" />
                </div>
                <div 
                  className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer"
                  onMouseDown={(e) => startResizing('datetime', e)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                </div>
              </div>

              <div 
                className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors group flex-shrink-0 relative border-r border-gray-100"
                style={{ width: columnWidths.menu }}
                onClick={() => handleSort('menu')}
              >
                <div className="flex items-center gap-2 text-[11px] text-[#6b7280] font-bold uppercase tracking-wider">
                  MENU <SortIcon config={sortConfig} sortKey="menu" />
                </div>
                <div 
                  className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer"
                  onMouseDown={(e) => startResizing('menu', e)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                </div>
              </div>

              <div 
                className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors group flex-shrink-0 relative border-r border-gray-100"
                style={{ width: columnWidths.user }}
                onClick={() => handleSort('user')}
              >
                <div className="flex items-center gap-2 text-[11px] text-[#6b7280] font-bold uppercase tracking-wider">
                  USER <SortIcon config={sortConfig} sortKey="user" />
                </div>
                <div 
                  className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer"
                  onMouseDown={(e) => startResizing('user', e)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                </div>
              </div>

              <div 
                className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors group relative flex-shrink-0 border-r border-gray-100"
                style={{ width: columnWidths.keterangan }}
                onClick={() => handleSort('message')}
              >
                <div className="flex items-center gap-2 text-[11px] text-[#6b7280] font-bold uppercase tracking-wider">
                  KETERANGAN <SortIcon config={sortConfig} sortKey="message" />
                </div>
                <div 
                  className="absolute -right-2 top-0 bottom-0 w-4 z-30 cursor-col-resize group/resizer"
                  onMouseDown={(e) => startResizing('keterangan', e)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                </div>
              </div>

              <div className="px-6 py-4 whitespace-nowrap w-[100px] text-right flex-shrink-0 text-[11px] text-[#6b7280] font-bold uppercase tracking-wider">
                AKSI
              </div>
            </div>

            {/* Virtual Container for Rows */}
            <div 
              style={{ 
                height: `${virtualizer.getTotalSize()}px`,
                position: 'relative',
                width: '100%'
              }}
            >
              {/* Virtual Rows */}
              {sortedAndFiltered.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-sm font-extrabold text-gray-800 mb-2">
                  {search ? 'Tidak ada hasil ditemukan' : 'Belum ada aktivitas'}
                </p>
                <p className="text-[12px] text-[#9ca3af] font-medium">
                  {search ? 'Coba kata kunci lain.' : 'Aktivitas sistem akan muncul di sini.'}
                </p>
              </div>
            ) : (
              virtualItems.map((virtualRow) => {
                const log = sortedAndFiltered[virtualRow.index];
                const isOdd = virtualRow.index % 2 === 1;
                const isSelected = selectedIds.has(log.id);
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    onClick={(e) => toggleSelectRow(log.id, e)}
                    onDoubleClick={() => setSelectedLog(log)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                      minWidth: `${columnWidths.datetime + columnWidths.menu + columnWidths.user + columnWidths.keterangan + 100}px`
                    }}
                    className={`
                      flex items-center border-b border-gray-100 transition-all duration-150 group h-10 cursor-pointer select-none
                      ${isSelected ? 'bg-green-50 shadow-[inset_4px_0_0_0_#16a34a]' : isOdd ? 'bg-slate-50/20' : 'bg-white'} 
                      hover:bg-green-50/40
                    `}
                  >
                    <div 
                      className={`px-6 py-1 text-xs whitespace-nowrap flex-shrink-0 overflow-hidden transition-colors border-r border-gray-100 ${isSelected ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'}`}
                      style={{ width: columnWidths.datetime }}
                    >
                      {fmtDateTime(log.created_at)}
                    </div>
                    <div 
                      className={`px-6 py-1 whitespace-nowrap flex-shrink-0 overflow-hidden transition-colors border-r border-gray-100 ${isSelected ? 'text-green-800' : 'text-gray-700 group-hover:text-gray-900'}`}
                      style={{ width: columnWidths.menu }}
                    >
                      <span className="text-[13px] font-bold block truncate">
                        {getChannelName(log)}
                      </span>
                    </div>
                    <div 
                      className="px-6 py-1 whitespace-nowrap flex-shrink-0 overflow-hidden text-[11px] border-r border-gray-100"
                      style={{ width: columnWidths.user }}
                    >
                      <span className={`font-bold px-2.5 py-1 rounded-md inline-block max-w-full truncate transition-colors ${isSelected ? 'bg-green-100 text-green-700' : 'bg-slate-100/60 text-gray-500 border border-gray-100/50 group-hover:bg-white'}`}>
                        {log.recorded_by || 'System'}
                      </span>
                    </div>
                    <div 
                      className={`px-6 py-1 text-[13px] flex-shrink-0 truncate overflow-hidden transition-colors border-r border-gray-100 ${isSelected ? 'text-green-700 font-medium' : 'text-gray-500'}`}
                      style={{ width: columnWidths.keterangan }}
                    >
                      {log.message}
                    </div>
                    <div className="px-6 py-1 text-right w-[100px] flex-shrink-0 overflow-hidden">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="px-3 py-1 text-[11px] font-extrabold text-[#16a34a] border border-[#16a34a]/30 hover:bg-[#16a34a] hover:text-white rounded-md transition-all active:scale-[0.95]"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      </div>
        
      {/* Footer info Banner outside the card for consistency */}
      <div className="flex items-center justify-between shrink-0 px-1 mt-3">
        <span className="text-[12px] font-bold text-gray-400">
          {initialLogs.length === 0
            ? 'Belum ada aktivitas'
            : `Menampilkan ${sortedAndFiltered.length} dari ${initialLogs.length} total aktivitas`}
        </span>
        <div className="flex items-center gap-4">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
              <span className="text-[12px] font-bold text-gray-400">{selectedIds.size} dipilih</span>
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="text-[12px] font-black text-rose-500 hover:text-rose-600 underline underline-offset-4"
              >
                Batal
              </button>
            </div>
          )}
          {loadTime !== null && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm border ${
              loadTime < 300 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
              loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
              'bg-red-50 text-red-600 border-red-100'
            }`}>
              <span className="animate-pulse">⚡</span>
              <span>{(loadTime / 1000).toFixed(2)}s</span>
            </span>
          )}
        </div>

      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
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
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon size={14} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pelaku (recorded_by)</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{selectedLog.recorded_by || 'System'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarIcon size={14} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Waktu Kejadian</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{fmtDateTime(selectedLog.created_at)}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100/50">
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
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-sm text-slate-700 leading-relaxed font-medium">
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
                  <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
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
                  <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
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

            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
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
