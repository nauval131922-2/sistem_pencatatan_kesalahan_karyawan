'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, RefreshCw, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';

import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatLastUpdate } from '@/lib/date-utils';
import { formatScrapedPeriodDate, getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod } from '@/lib/scraper-period';
import { DataTable } from '@/components/ui/DataTable';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';
import DateRangeCard from '@/components/DateRangeCard';
import { splitDateRangeIntoMonths } from '@/lib/date-utils';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import ScrapingHeader from '@/components/ScrapingHeader';

function formatDateToYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatIndoDateStr(tglStr: string) {
  if (!tglStr) return '';
  const parts = tglStr.split('-');
  if (parts.length === 3) {
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return tglStr;
}

const PAGE_SIZE = 50;

export default function PenerimaanPembelianClient() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{start: string, end: string} | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const isLoadingMore = useRef(false);
  const mountedRef = useRef(true);

  const { selectedIds, setSelectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pb_columnWidths');
      return saved ? JSON.parse(saved) : {
        id: 80, faktur: 220, tgl: 120, kd_supplier: 300, total: 180, username: 120, recid: 80
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('pb_columnWidths', JSON.stringify(columnWidths));
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
    const hydratedPeriod = hydrateScraperPeriod({ stateKey: 'pbState', periodKey: 'PenerimaanPembelianClient_scrapedPeriod' });
    setScrapedPeriod(hydratedPeriod.scrapedPeriod);
    setStartDate(hydratedPeriod.startDate);
    setEndDate(hydratedPeriod.endDate);
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        setRefreshKey(prev => prev + 1);
        router.refresh();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => { window.removeEventListener('storage', handleStorageChange); };
  }, [router]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!active || !mountedRef.current || !isMounted) return;
      setLoading(page === 1);
      const startTimer = performance.now();
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(), pageSize: PAGE_SIZE.toString(), q: debouncedQuery,
          start: formatDateToYYYYMMDD(startDate), end: formatDateToYYYYMMDD(endDate)
        });
        const res = await fetch(`/api/penerimaan-pembelian?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const json = await res.json();
        if (active) {
          setData(prev => {
            const processData = (items: any[]) => (items || []).map((item: any) => {
              let parsedRaw = {};
              if (item.raw_data) { try { parsedRaw = JSON.parse(item.raw_data); } catch(e){} }
              return { ...item, ...parsedRaw };
            });
            if (page === 1) return processData(json.data);
            const currentData = prev || [];
            const newData = processData(json.data);
            const existingIds = new Set(currentData.map((d: any) => d.id));
            return [...currentData, ...newData.filter((d: any) => !existingIds.has(d.id))];
          });
          setTotalCount(json.total || 0);
          if (json.scrapedPeriod) setScrapedPeriod(json.scrapedPeriod);
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
  }, [page, debouncedQuery, refreshKey, startDate, endDate, isMounted]);

  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');
  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as any, title: '', message: '' });

  const handleFetch = async () => {
    if (!startDate || !endDate) return;
    localStorage.setItem('pbState', JSON.stringify({
      startDate: startDate.toISOString(), endDate: endDate.toISOString(), sessionDate: new Date().toLocaleDateString('en-CA')
    }));
    setError(''); setData([]); setPage(1); setIsBatching(true); setLoading(true); setSearchQuery(''); setBatchProgress(0);
    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    let successCount = 0; let totalScraped = 0; let completedChunks = 0;
    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-penerimaan-pembelian?start=${chunk.start}&end=${chunk.end}&metaStart=${startStr}&metaEnd=${endStr}`);
        if (res.ok) {
          successCount++; const json = await res.json(); totalScraped += (json.total || 0);
        }
      } catch (e) {} finally {
        completedChunks++; setBatchProgress(Math.round((completedChunks / chunks.length) * 100));
        setBatchStatus(`Memproses ${completedChunks}/${chunks.length} bulan...`);
      }
    };
    try {
      const concurrency = 2; const queue = [...chunks];
      const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
        while (queue.length > 0) { const chunk = queue.shift(); if (chunk) await processChunk(chunk); }
      });
      await Promise.all(workers);
      if (successCount > 0) {
        persistScraperPeriod({ stateKey: 'pbState', periodKey: 'PenerimaanPembelianClient_scrapedPeriod' }, startDate, endDate);
        setRefreshKey(prev => prev + 1);
        localStorage.setItem('sintak_data_updated', Date.now().toString());
        setDialog({ isOpen: true, type: 'success', title: 'Berhasil', message: `Berhasil menarik ${totalScraped} Penerimaan Barang.` });
      }
    } finally { setIsBatching(false); setLoading(false); }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && (data?.length || 0) < totalCount) {
      setPage(prev => prev + 1);
    }
  }, [loading, data, totalCount]);

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 80,
      cell: ({ getValue, row }: any) => <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-400'}`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'tgl',
      header: 'Tanggal',
      size: 120,
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{formatIndoDateStr(getValue() as string)}</span>
    },
    {
      accessorKey: 'faktur',
      header: 'Faktur PB',
      size: 220,
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'kd_supplier',
      header: 'Supplier',
      size: 300,
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'keterangan',
      header: 'Keterangan',
      size: 300,
      cell: ({ getValue, row }: any) => <span className={`font-medium transition-colors truncate block ${row.getIsSelected() ? 'text-green-800' : 'text-gray-700'}`}>{String(getValue() || '–')}</span>
    },
    {
      accessorKey: 'faktur_po',
      header: 'Faktur PO',
      size: 220,
      cell: ({ getValue, row }: any) => <div className={`font-bold tracking-tight transition-colors truncate ${row.getIsSelected() ? 'text-green-600' : 'text-gray-500'}`} dangerouslySetInnerHTML={{ __html: String(getValue() || '–') }} />
    },
    {
      accessorKey: 'faktur_pr',
      header: 'Faktur PR',
      size: 220,
      cell: ({ getValue, row }: any) => <div className={`font-bold tracking-tight transition-colors truncate ${row.getIsSelected() ? 'text-green-600' : 'text-gray-500'}`} dangerouslySetInnerHTML={{ __html: String(getValue() || '–') }} />
    },
    {
      accessorKey: 'faktur_spph',
      header: 'Faktur SPPH',
      size: 220,
      cell: ({ getValue, row }: any) => <div className={`font-bold tracking-tight transition-colors truncate ${row.getIsSelected() ? 'text-green-600' : 'text-gray-500'}`} dangerouslySetInnerHTML={{ __html: String(getValue() || '–') }} />
    },
    {
      accessorKey: 'total',
      header: 'Nilai PB',
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
        accessorKey: 'username', 
        header: 'User', 
        size: 120, 
        cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400">@{String(getValue() || '–')}</span> 
    },
    { 
        accessorKey: 'recid', 
        header: 'RecId', 
        size: 80, 
        cell: ({ getValue }: any) => <span className="text-[11px] font-semibold text-gray-700/60 tabular-nums">{String(getValue())}</span> 
    }
  ], []);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
      <DateRangeCard
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onFetch={handleFetch}
        isFetching={loading || isBatching}
        progress={isBatching ? batchProgress : undefined}
        statusText={isBatching ? batchStatus : undefined}
        fetchText="Tarik Data"
      />

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[11px] font-bold flex items-start gap-3 animate-in slide-in-from-top-2 z-20 shadow-sm shadow-rose-900/5 uppercase tracking-widest">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <ScrapingHeader title="Hasil Scrapping Penerimaan Barang" lastUpdated={lastUpdated} scrapedPeriod={scrapedPeriod} />

            {loading && (data?.length || 0) > 0 && (
              <div className="text-[10px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm animate-pulse uppercase tracking-widest leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Syncing...</span>
              </div>
            )}
          </div>
          <SearchAndReload searchQuery={searchQuery} setSearchQuery={setSearchQuery} onReload={() => setRefreshKey(prev => prev + 1)} loading={loading} placeholder="Cari ID, faktur, supplier, user..." />
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden relative">
          <DataTable columns={columns} data={data || []} isLoading={loading || data === null} totalCount={totalCount} onScroll={handleScroll} selectedIds={selectedIds} onRowClick={handleRowClick} columnWidths={columnWidths} onColumnWidthChange={setColumnWidths} rowHeight="h-11" />
          <TableFooter totalCount={totalCount} currentCount={data?.length || 0} label="Penerimaan Barang" selectedCount={selectedIds.size} onClearSelection={clearSelection} loadTime={loadTime} />
        </div>
      </div>

      <ConfirmDialog isOpen={dialog.isOpen} type={dialog.type as any} title={dialog.title} message={dialog.message} onConfirm={() => setDialog({ ...dialog, isOpen: false })} />
    </div>
  );
}



