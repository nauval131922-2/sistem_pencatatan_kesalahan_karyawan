'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, AlertCircle, Clock, FileSpreadsheet, Users } from 'lucide-react';
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
            <span className="text-[11px] font-bold bg-slate-100/60 px-2.5 py-1 rounded-md border border-gray-100/50 block w-fit truncate">
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
            <span className="font-mono font-black text-emerald-600">
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
             <h3 className="text-[15px] font-extrabold text-gray-800 flex items-center gap-2 leading-none">
                <Users size={18} className="text-emerald-500" />
                <span>Data Karyawan</span>
             </h3>
             {importInfo && (
                <div className="flex items-center gap-1.5 text-[12px] font-medium leading-none" style={{ color: '#99a1af' }}>
                    <span className="opacity-40">|</span>
                    <div className="flex items-center gap-1.5 transition-colors">
                        <span className="cursor-help hover:text-emerald-500" title={importInfo.fileName}>
                            {importInfo.fileName}
                        </span>
                        <span className="opacity-30">|</span>
                        <span>Diperbarui: {importInfo.time}</span>
                    </div>
                </div>
             )}
          </div>
          {loading && (data?.length || 0) > 0 && (
              <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 animate-pulse uppercase tracking-tighter leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses...</span>
              </div>
          )}
        </div>

        <div className="relative w-full group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari nama, jabatan, atau ID karyawan..." 
            className="w-full pl-12 pr-4 h-10 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm" 
            value={searchQuery} 
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} 
          />
        </div>
      </div>

      {/* Main Table - Let DataTable handle border and rounding */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
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
          <span className="text-[12px] leading-none font-bold text-gray-400">
             {totalCount === 0 ? 'Tidak ada data karyawan' : `Menampilkan ${data?.length || 0} dari ${totalCount} Karyawan`}
          </span>
          
          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                   <span className="text-[12px] leading-none font-bold text-gray-400">{selectedIds.size} dipilih</span>
                   <button 
                    onClick={() => setSelectedIds(new Set())}
                    className="text-[12px] leading-none font-black text-rose-500 hover:text-rose-600 underline underline-offset-4"
                   >
                     BATAL
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
                  <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
               </span>
            )}
          </div>
      </div>
    </div>
  );
}

