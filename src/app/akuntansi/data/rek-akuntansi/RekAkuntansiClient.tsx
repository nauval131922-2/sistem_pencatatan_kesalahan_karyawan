'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, DownloadCloud } from 'lucide-react';

import ConfirmDialog from '@/components/ConfirmDialog';
import { formatLastUpdate } from '@/lib/date-utils';
import { DataTable } from '@/components/ui/DataTable';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import ScrapingHeader from '@/components/ScrapingHeader';

const PAGE_SIZE = 50;

export default function RekAkuntansiClient() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const isLoadingMore = useRef(false);
  const mountedRef = useRef(true);

  const { selectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rekAkuntansi_columnWidths');
      return saved ? JSON.parse(saved) : {
        kode: 120, keterangan: 300, jenis: 150, arus_kas: 150,
        analisa_rasio: 150, harga_pokok: 150, username: 120, created_at: 160
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('rekAkuntansi_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setIsMounted(true);
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!active || !mountedRef.current || !isMounted) return;
      setLoading(page === 1);
      const startTimer = performance.now();
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(), limit: PAGE_SIZE.toString(), q: debouncedQuery,
          _t: Date.now().toString()
        });
        const res = await fetch(`/api/rek-akuntansi?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const json = await res.json();
        if (active) {
          setData(prev => {
            if (page === 1) return json.data || [];
            const existingIds = new Set((prev || []).map((d: any) => String(d.id)));
            return [...(prev || []), ...(json.data || []).filter((d: any) => !existingIds.has(String(d.id)))];
          });
          setTotalCount(json.total || 0);
          if (json.lastUpdated) setLastUpdated(formatLastUpdate(new Date(json.lastUpdated)));
          setLoadTime(Math.round(performance.now() - startTimer));
        }
      } catch (err: any) {
        if (active) { setError(err.message || 'Gagal memuat data'); setData([]); }
      } finally {
        if (active) { setLoading(false); isLoadingMore.current = false; }
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, isMounted]);

  const [isScraping, setIsScraping] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as any, title: '', message: '' });

  const handleFetch = async () => {
    setError(''); setData([]); setPage(1); setIsScraping(true); setLoading(true); setSearchQuery('');
    
    try {
      const res = await fetch(`/api/scrape-rek-akuntansi`);
      if (res.ok) {
        const json = await res.json();
        setRefreshKey(prev => prev + 1);
        setDialog({ isOpen: true, type: 'success', title: 'Berhasil', message: `Berhasil menarik ${json.total || 0} data Rek Akuntansi.` });
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Error ${res.status}`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsScraping(false); setLoading(false);
    }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && !isLoadingMore.current && (data?.length || 0) < totalCount) {
      isLoadingMore.current = true;
      setPage(prev => prev + 1);
    }
  }, [loading, data, totalCount]);

  const columns = useMemo(() => [
    {
      accessorKey: 'kode',
      header: 'Kode Rekening',
      size: 120,
      meta: { sticky: true },
      cell: ({ getValue, row }: any) => {
        return (
          <span className={`font-bold tabular-nums tracking-tight ${row.getIsSelected() ? 'text-blue-700' : 'text-gray-700'}`}>
            {String(getValue())}
          </span>
        );
      }
    },
    {
      accessorKey: 'keterangan',
      header: 'Keterangan',
      size: 300,
      meta: { sticky: true },
      cell: ({ getValue, row }: any) => {
        return (
          <span className={`font-semibold ${row.getIsSelected() ? 'text-blue-600' : 'text-gray-800'}`}>
            {String(getValue() || '–')}
          </span>
        );
      }
    },
    {
      accessorKey: 'jenis',
      header: 'Jenis',
      size: 150,
      cell: ({ getValue }: any) => {
        const val = String(getValue() || '–');
        return <span className="text-gray-600">{val}</span>;
      }
    },
    {
      accessorKey: 'arus_kas',
      header: 'Arus Kas',
      size: 150,
      cell: ({ getValue }: any) => {
        const val = String(getValue() || '–');
        return <span className="text-gray-600">{val}</span>;
      }
    },
    {
      accessorKey: 'analisa_rasio',
      header: 'Analisa Rasio',
      size: 150,
      cell: ({ getValue }: any) => {
        const val = String(getValue() || '');
        if (!val || val === 'null' || val === 'undefined') return <span className="text-gray-300">—</span>;
        return <span className="text-gray-600">{val}</span>;
      }
    },
    {
      accessorKey: 'harga_pokok',
      header: 'Harga Pokok',
      size: 150,
      cell: ({ getValue }: any) => {
        const val = String(getValue() || '');
        if (!val || val === 'null' || val === 'undefined') return <span className="text-gray-300">—</span>;
        return <span className="text-gray-600">{val}</span>;
      }
    },
    {
      accessorKey: 'username',
      header: 'User',
      size: 120,
      cell: ({ getValue }: any) => {
        const val = String(getValue() || '');
        if (!val || val === 'undefined') return <span className="text-gray-200">—</span>;
        return <span className="font-bold text-gray-400">{val}</span>;
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Dibuat',
      size: 160,
      cell: ({ getValue }: any) => {
        const val = String(getValue() || '');
        if (!val || val === 'null') return <span className="text-gray-200">—</span>;
        return <span className="text-gray-500 tabular-nums">{val}</span>;
      }
    }
  ], []);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm shadow-red-900/5 text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0 uppercase tracking-widest">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-4">
              <ScrapingHeader title="Rekening Akuntansi" lastUpdated={lastUpdated} />
              {loading && data && data.length > 0 && (
                <div className="text-[10px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm animate-pulse uppercase tracking-widest leading-none">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Memproses Data...</span>
                </div>
              )}
            </div>
            
            <button
               onClick={handleFetch}
               disabled={isScraping || loading}
               className="shrink-0 w-full sm:w-auto min-w-[140px] px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white rounded-xl text-[12px] font-bold shadow-sm shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn relative overflow-hidden"
             >
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
               <span className="relative z-10 flex items-center gap-2">
                 {isScraping ? (
                   <><Loader2 size={16} className="animate-spin" /> Sedang Menarik...</>
                 ) : (
                   <><DownloadCloud size={16} className="group-hover/btn:-translate-y-0.5 transition-transform duration-300" /> Tarik Data</>
                 )}
               </span>
            </button>
          </div>
          <SearchAndReload
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onReload={() => setRefreshKey(prev => prev + 1)}
            loading={loading}
            placeholder="Cari kode, keterangan, jenis..."
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden relative">
          <DataTable
            columns={columns}
            data={data || []}
            isLoading={loading}
            onScroll={handleScroll}
            selectedIds={selectedIds}
            onRowClick={handleRowClick}
            columnWidths={columnWidths}
            onColumnWidthChange={setColumnWidths}
            rowHeight="h-11"
          />
          <TableFooter
            totalCount={totalCount}
            currentCount={data?.length || 0}
            label="Rekening"
            selectedCount={selectedIds.size}
            onClearSelection={clearSelection}
            loadTime={loadTime}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog({ ...dialog, isOpen: false })}
      />
    </div>
  );
}
