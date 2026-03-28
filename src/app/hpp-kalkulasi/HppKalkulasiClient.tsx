'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, AlertCircle, Clock, FileSpreadsheet, Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/DataTable';
import { useTableSelection } from '@/lib/hooks/useTableSelection';

interface HppRecord {
  id: number;
  nama_order: string;
  hpp_kalkulasi: number;
  keterangan: string | null;
}

interface HppKalkulasiClientProps {
  importInfo?: {
    fileName: string;
    time: string;
  };
}

const PAGE_SIZE = 50;

export default function HppKalkulasiClient({ importInfo }: HppKalkulasiClientProps) {
  const router = useRouter();
  const mountedRef = useRef(true);
  const isLoadingMore = useRef(false);
  
  // State
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HppRecord[] | null>(null);
  const [error, setError] = useState('');
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Table State
  const { selectedIds, setSelectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hpp_columnWidths');
      if (saved) return JSON.parse(saved);
    }
    return {
      'no': 60,
      'nama_order': 450,
      'hpp_kalkulasi': 180,
      'keterangan': 250
    };
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle cross-tab refresh
  useEffect(() => {
    setIsMounted(true);
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated' || e.key === 'hpp_data_updated') {
        setRefreshKey(prev => prev + 1);
        router.refresh();
      }
    };
    const handleNotify = () => {
      setRefreshKey(prev => prev + 1);
      router.refresh();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sintak:data-updated', handleNotify);
    return () => { 
        mountedRef.current = false;
        window.removeEventListener('storage', handleStorageChange); 
        window.removeEventListener('sintak:data-updated', handleNotify);
    };
  }, [router]);

  // Fetch Data
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      const startTime = performance.now();
      try {
        const res = await fetch(`/api/hpp-kalkulasi?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&_t=${Date.now()}`);
        if (!active) return;

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setLoadTime(Math.round(performance.now() - startTime));
            setData(prev => {
              if (page === 1) return json.data || [];
              const currentData = prev || [];
              const newData = json.data || [];
              const existingIds = new Set(currentData.map(d => d.id));
              const filteredNew = newData.filter((d: any) => !existingIds.has(d.id));
              return [...currentData, ...filteredNew];
            });
            setTotalCount(json.total || 0);
            setError('');
          }
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Gagal memuat data');
      } finally {
        if (active) {
          setLoading(false);
          isLoadingMore.current = false;
        }
      }
    }
    
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey]);

  // Columns definition
  const columns = useMemo(() => [
    { 
        accessorKey: 'id', 
        header: 'No.', 
        cell: (info: any) => info.row.index + 1,
        size: 60,
        meta: { align: 'center' }
    },
    { 
        accessorKey: 'nama_order', 
        header: 'Nama Order',
        size: 450,
        cell: (info: any) => (
            <span className="truncate block" title={info.getValue() as string}>
                {info.getValue()}
            </span>
        )
    },
    { 
        accessorKey: 'hpp_kalkulasi', 
        header: 'HPP Kalkulasi',
        size: 180,
        meta: { align: 'right' },
        cell: (info: any) => {
            const val = info.getValue() as number;
            if (val <= 0) return <span className="text-gray-200 italic">—</span>;
            
            // Format accounting with 2 decimals
            const formatted = val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).trim();
            
            return (
                <div className="flex items-center justify-between w-full font-mono font-black text-green-600 pr-2">
                    <span className="text-[10px] opacity-70">Rp</span>
                    <span>{formatted}</span>
                </div>
            );
        }
    },
    { 
        accessorKey: 'keterangan', 
        header: 'Keterangan',
        size: 250,
        cell: (info: any) => info.getValue() || <span className="text-gray-200 italic">—</span>
    }
  ], []);

  // Handlers
  const handleResize = useCallback((widths: any) => {
    setColumnWidths(widths);
    localStorage.setItem('hpp_columnWidths', JSON.stringify(widths));
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && !isLoadingMore.current && (data?.length || 0) < totalCount) {
      isLoadingMore.current = true;
      setPage(prev => prev + 1);
    }
  }, [loading, data, totalCount]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      {/* Search Bar Section */}
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between gap-4 min-h-[32px]">
          <div className="flex items-center gap-4">
             <h3 className="text-[14px] font-extrabold text-gray-800 flex items-center gap-2.5 leading-none">
                <Calculator size={18} className="text-green-600" />
                <span>Data HPP Kalkulasi</span>
             </h3>
             {importInfo && (
                <div className="flex items-center gap-1.5 text-[12px] font-medium leading-none" style={{ color: '#99a1af' }}>
                    <span className="opacity-40">|</span>
                    <div className="flex items-center gap-1.5 transition-colors">
                        <span className="cursor-help hover:text-green-600" title={importInfo.fileName}>
                            {importInfo.fileName}
                        </span>
                        <span className="opacity-30">|</span>
                        <span>Diperbarui: {importInfo.time}</span>
                    </div>
                </div>
             )}
          </div>
          {loading && (data?.length || 0) > 0 && (
              <div className="text-[11px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 animate-pulse uppercase tracking-tighter leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses...</span>
              </div>
          )}
        </div>

        <div className="relative w-full group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama order..." 
            className="w-full pl-12 pr-4 h-10 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm" 
            value={searchQuery} 
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} 
          />
        </div>
      </div>

      {/* Main Table Context */}
      <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden relative">
         {error ? (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-rose-50/10">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="text-rose-500" size={32} />
              </div>
              <p className="text-sm font-black text-gray-800">{error}</p>
              <button 
                onClick={() => setRefreshKey(k => k + 1)}
                className="mt-4 px-6 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-black hover:bg-rose-50 transition-colors"
              >
                Coba Lagi
              </button>
           </div>
         ) : (
           <>
              <DataTable
                data={data || []}
                columns={columns}
                columnWidths={columnWidths}
                onColumnWidthChange={handleResize}
                isLoading={loading || data === null}
                selectedIds={selectedIds}
                onRowClick={handleRowClick} 
                onScroll={handleScroll}
                rowHeight="h-10"
              />

              {/* Footer Info Banner */}
              <div className="flex items-center justify-between shrink-0 px-1 mt-1">
                  <span className="text-[12px] leading-none font-bold text-gray-400">
                    {totalCount === 0 ? 'Tidak ada data HPP' : `Menampilkan ${data?.length || 0} dari ${totalCount} Kalkulasi`}
                  </span>
                  
                  <div className="flex items-center gap-4">
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                          <span className="text-[12px] leading-none font-bold text-gray-400">{selectedIds.size} dipilih</span>
                          <button onClick={clearSelection} className="text-[12px] leading-none font-black text-rose-500 hover:text-rose-600 underline underline-offset-4">Batal</button>
                        </div>
                    )}
                    {loadTime !== null && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm border ${
                        loadTime < 300 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                          <span className="animate-pulse">⚡</span>
                          <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
                      </span>
                    )}
                  </div>
              </div>
           </>
         )}
      </div>
    </div>
  );
}
