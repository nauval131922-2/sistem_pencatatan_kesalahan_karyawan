'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, AlertCircle, Clock, FileSpreadsheet, Calculator } from 'lucide-react';
import ImportInfo from '@/components/ImportInfo';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';
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
      setLoading(page === 1);
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
        size: 80,
        cell: ({ row }: any) => <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-400'}`}>{row.index + 1}</span>
    },
    { 
        accessorKey: 'nama_order', 
        header: 'Nama Order',
        size: 450,
        cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`}>{String(getValue())}</span>
    },
    { 
        accessorKey: 'hpp_kalkulasi', 
        header: 'HPP Kalkulasi',
        size: 180,
        meta: { align: 'right' },
        cell: ({ getValue, row }: any) => (
          <div className={`flex items-center justify-between font-semibold tabular-nums w-full ${row.getIsSelected() ? 'text-green-700' : 'text-emerald-700'}`}>
            <span className="text-[10px] opacity-40 mr-1">Rp</span>
            <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
          </div>
        )
    },
    { 
        accessorKey: 'keterangan', 
        header: 'Keterangan',
        size: 250,
        cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400">{String(getValue() || '—')}</span>
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
      setPage(prev => prev + 1);
    }
  }, [loading, data, totalCount]);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 animate-in fade-in duration-700 overflow-hidden">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-5">
               <h3 className="text-[14px] font-bold text-gray-800 flex items-center gap-3 leading-none">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shadow-sm shrink-0">
                    <Calculator size={16} />
                  </div>
                  <span>Data HPP Kalkulasi</span>
               </h3>
               <ImportInfo info={importInfo} />
            </div>
            {loading && (data?.length || 0) > 0 && (
                <div className="text-[10px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm animate-pulse uppercase tracking-widest leading-none">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Memproses Data...</span>
                </div>
            )}
          </div>

          <SearchAndReload 
            searchQuery={searchQuery}
            setSearchQuery={(v) => { setSearchQuery(v); setPage(1); }}
            onReload={() => setRefreshKey(k => k + 1)}
            loading={loading}
            placeholder="Cari berdasarkan nama order..."
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
         {error ? (
           <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm shadow-green-900/5">
              <div className="w-20 h-20 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-center mb-6">
                  <AlertCircle className="text-rose-500" size={40} />
              </div>
              <p className="text-sm font-bold text-gray-800 uppercase tracking-[0.2em] mb-2">Terjadi Kesalahan</p>
              <p className="text-gray-500 text-sm mb-8 max-w-xs">{error}</p>
              <button 
                onClick={() => setRefreshKey(k => k + 1)}
                className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-sm shadow-green-900/10 hover:bg-emerald-700 hover:-translate-y-1 hover:shadow-sm hover:shadow-green-900/20 active:translate-y-0 uppercase tracking-widest text-[11px]"
              >
                Coba Lagi
              </button>
           </div>
         ) : (
           <DataTable
             data={data || []}
             columns={columns}
             columnWidths={columnWidths}
             onColumnWidthChange={handleResize}
             isLoading={loading || data === null}
             selectedIds={selectedIds}
             onRowClick={handleRowClick} 
             onScroll={handleScroll}
             rowHeight="h-11"
           />
         )}
        </div>

        <TableFooter 
          totalCount={totalCount}
          currentCount={data?.length || 0}
          label="data HPP"
          selectedCount={selectedIds.size}
          onClearSelection={clearSelection}
          loadTime={loadTime}
        />
    </div>
  );
}



