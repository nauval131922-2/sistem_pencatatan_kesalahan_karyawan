'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, AlertCircle, Clock, FileSpreadsheet, Users } from 'lucide-react';
import ImportInfo from '@/components/ImportInfo';
import SearchAndReload from '@/components/SearchAndReload';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/DataTable';

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  employee_no: string | null;
}

interface EmployeeTableProps {
  importInfo?: {
    fileName: string;
    time: string;
  };
}

const PAGE_SIZE = 50;

export default function EmployeeTable({ importInfo }: EmployeeTableProps) {
  const router = useRouter();
  const mountedRef = useRef(true);
  
  // State
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Employee[] | null>(null);
  const [error, setError] = useState('');
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Table State
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('employee_columnWidths');
      if (saved) return JSON.parse(saved);
    }
    return {
      'no': 60,
      'name': 350,
      'position': 250,
      'employee_no': 180
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
      if (e.key === 'sintak_data_updated' || e.key === 'employee_data_updated') {
        setRefreshKey(prev => prev + 1);
        router.refresh();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => { 
        mountedRef.current = false;
        window.removeEventListener('storage', handleStorageChange); 
    };
  }, [router]);

  // Fetch Data
  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      const startTime = performance.now();
      try {
        const res = await fetch(`/api/employees?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&_t=${Date.now()}`);
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setLoadTime(Math.round(performance.now() - startTime));
            if (page === 1) {
              setData(json.data || []);
            } else {
              setData(prev => [...(prev || []), ...(json.data || [])]);
            }
            setTotalCount(json.total || 0);
            setError('');
          }
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Gagal memuat data');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey]);

  // Columns definition (Removed Department as requested)
  const columns = useMemo(() => [
    { 
        accessorKey: 'id', 
        header: 'No.', 
        cell: (info: any) => info.row.index + 1,
        size: 60,
        meta: { align: 'center' }
    },
    { 
        accessorKey: 'name', 
        header: 'Nama Karyawan',
        size: 350,
    },
    { 
        accessorKey: 'position', 
        header: 'Jabatan',
        size: 250,
        cell: (info: any) => (
            <span className="text-[11px] font-black bg-white px-2.5 py-1 border-[2px] border-black shadow-[2px_2px_0_0_#000] block w-fit truncate uppercase tracking-tight">
              {info.getValue()}
            </span>
        )
    },
    { 
        accessorKey: 'employee_no', 
        header: 'ID Karyawan',
        size: 180,
        meta: { align: 'right' },
        cell: (info: any) => (
            <span className="font-mono font-black text-black">
                {info.getValue() || '---'}
            </span>
        )
    }
  ], []);

  // Handlers
  const handleResize = useCallback((widths: any) => {
    setColumnWidths(widths);
    localStorage.setItem('employee_columnWidths', JSON.stringify(widths));
  }, []);

  const handleSelection = useCallback((id: string | number) => {
    setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && (data?.length || 0) < totalCount) {
       setPage(prev => prev + 1);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Search Bar Section - Updated to match Laporan Penjualan */}
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between gap-4 min-h-[32px]">
          <div className="flex items-center gap-4">
             <h3 className="text-sm font-black text-black flex items-center gap-2.5 leading-none uppercase tracking-widest">
                <Users size={20} strokeWidth={3} className="text-black" />
                <span>Data Karyawan</span>
             </h3>
             <ImportInfo info={importInfo} />
          </div>
          {loading && (data?.length || 0) > 0 && (
              <div className="text-[10px] font-black text-black flex items-center gap-2 bg-[#fde047] px-3 py-1.5 border-[2px] border-black animate-pulse uppercase tracking-[0.2em] shadow-[2px_2px_0_0_#000]">
                <Loader2 size={12} strokeWidth={3} className="animate-spin" />
                <span>Memproses...</span>
              </div>
          )}
        </div>

        <SearchAndReload 
          searchQuery={searchQuery}
          setSearchQuery={(v) => { setSearchQuery(v); setPage(1); }}
          onReload={() => setRefreshKey(k => k + 1)}
          loading={loading}
          placeholder="Cari nama, jabatan, atau ID karyawan..."
        />
      </div>

      {/* Main Table - Let DataTable handle border and rounding */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
         {error ? (
           <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white border-[4px] border-black shadow-[8px_8px_0_0_#000]">
              <div className="w-20 h-20 bg-[#ff5e5e] border-[3px] border-black flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#000]">
                  <AlertCircle className="text-white" size={40} strokeWidth={3} />
              </div>
              <p className="text-lg font-black text-black uppercase tracking-tight mb-6">{error}</p>
              <button 
                onClick={() => setRefreshKey(k => k + 1)}
                className="px-8 py-3 bg-[#fde047] border-[3px] border-black text-black font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
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
             onRowClick={handleSelection} 
             onScroll={handleScroll}
           />
         )}
      </div>

      {/* Footer info Banner - Updated to match Laporan Penjualan styles */}
      <div className="flex items-center justify-between shrink-0 px-1 mt-1">
          <span className="text-[12px] leading-none font-black text-black/50 uppercase tracking-widest">
             {totalCount === 0 ? 'Data Kosong' : `Menampilkan ${data?.length || 0} dari ${totalCount} Karyawan`}
          </span>
          
          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                   <span className="text-[12px] leading-none font-black text-black/40 uppercase tracking-widest">{selectedIds.size} dipilih</span>
                   <button 
                    onClick={() => setSelectedIds(new Set())}
                    className="text-[12px] leading-none font-black text-black bg-[#fde047] border-[2px] border-black px-3 py-1 shadow-[2px_2px_0_0_#000] hover:bg-black hover:text-white transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase tracking-[0.2em]"
                   >
                     BATAL
                   </button>
                </div>
            )}
            {loadTime !== null && (
               <span className={`text-[10px] px-2 py-0.5 rounded-none font-black flex items-center gap-1.5 shadow-[2px_2px_0_0_#000] border-[2px] border-black uppercase tracking-tight ${
                loadTime < 300 ? 'bg-[#93c5fd] text-black' : 
                loadTime < 1000 ? 'bg-[#fde047] text-black' : 
                'bg-[#ff5e5e] text-white'
              }`}>
                  <span className="animate-pulse">⚡</span>
                  <span className="leading-none">{(loadTime / 1000).toFixed(2)}S</span>
               </span>
            )}
          </div>
      </div>
    </div>
  );
}






