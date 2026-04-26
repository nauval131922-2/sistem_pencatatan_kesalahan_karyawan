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

export default function BOMClient() {
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{start: string, end: string} | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const { selectedIds, setSelectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bom_columnWidths');
      return saved ? JSON.parse(saved) : {
        id: 80, faktur: 220, faktur_tplt: 160, kd_cabang: 120, kd_gudang: 200,
        tgl: 140, kd_mtd: 120, kd_pelanggan: 250, nama_prd: 350, status: 100,
        bbb: 160, pers_btkl: 100, btkl: 160, pers_bop: 100, bop: 160,
        hp: 160, spesifikasi: 400, qty_order: 100, faktur_prd: 250,
        faktur_sph: 250, username: 120, created_at: 180, username_edited: 120,
        edited_at: 180, cmd: 250, detil: 180, recid: 100
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('bom_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  const isLoadingMore = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const initialLoaded = useRef(false);

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial && initialLoaded.current) return;
    if (!mountedRef.current) return;

    setLoading(page === 1);
    const startTimer = performance.now();
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
        q: debouncedQuery,
        start: formatDateToYYYYMMDD(startDate),
        end: formatDateToYYYYMMDD(endDate)
      });

      const res = await fetch(`/api/bom?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat data');
      const json = await res.json();
      
      if (mountedRef.current) {
        if (json.scrapedPeriod) setScrapedPeriod(json.scrapedPeriod);

        setData(prev => {
          const items = json.data || [];
          const processed = items.map((item: any) => {
            let parsedRaw = {};
            if (item.raw_data) {
              try { parsedRaw = JSON.parse(item.raw_data); } catch(e){}
            }
            return { ...parsedRaw, ...item };
          });

          if (page === 1) return processed;
          const currentData = prev || [];
          const existingIds = new Set(currentData.map((d: any) => d.id));
          const filteredNew = processed.filter((d: any) => !existingIds.has(d.id));
          return [...currentData, ...filteredNew];
        });
        setTotalCount(json.total || 0);
        
        if (json.lastUpdated) {
          const latestDate = new Date(json.lastUpdated);
          if (!isNaN(latestDate.getTime())) {
            setLastUpdated(formatLastUpdate(latestDate));
          }
        }
        setLoadTime(Math.round(performance.now() - startTimer));
        if (isInitial) initialLoaded.current = true;
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || 'Gagal memuat data');
        setData([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        isLoadingMore.current = false;
      }
    }
  }, [page, debouncedQuery, startDate, endDate]);

  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [page, debouncedQuery, refreshKey, startDate, endDate, isMounted, loadData]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
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

  useEffect(() => {
    mountedRef.current = true;
    setIsMounted(true);

    const hydratedPeriod = hydrateScraperPeriod({ stateKey: 'bomReportState', periodKey: 'BOMClient_scrapedPeriod' });
    setScrapedPeriod(hydratedPeriod.scrapedPeriod);
    setStartDate(hydratedPeriod.startDate);
    setEndDate(hydratedPeriod.endDate);
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');

  const handleFetch = async () => {
    if (!startDate || !endDate) return;

    localStorage.setItem('bomReportState', JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sessionDate: new Date().toLocaleDateString('en-CA')
    }));

    setError('');
    setData([]);
    setSearchQuery('');

    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    setIsBatching(true);
    setLoading(true);
    setBatchProgress(0);

    let successCount = 0;
    let totalScraped = 0;
    let completedChunks = 0;
    let lastUpdatedFromScrape: string | null = null;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-bom?start=${chunk.start}&end=${chunk.end}&metaStart=${startStr}&metaEnd=${endStr}`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
          totalScraped += (json.total || 0);
          if (json.lastUpdated) {
            lastUpdatedFromScrape = json.lastUpdated;
          }
        }
      } catch (err) {
        console.error("Chunk error:", err);
      } finally {
        completedChunks++;
        setBatchProgress(Math.round((completedChunks / chunks.length) * 100));
        setBatchStatus(`Memproses ${completedChunks}/${chunks.length} bulan...`);
      }
    };

    try {
      const concurrency = 15;
      const queue = [...chunks];
      const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
        while (queue.length > 0) {
          const chunk = queue.shift();
          if (chunk) await processChunk(chunk);
        }
      });
      await Promise.all(workers);

      if (successCount > 0) {
        const periodStr = persistScraperPeriod({ stateKey: 'bomReportState', periodKey: 'BOMClient_scrapedPeriod' }, startDate, endDate);
        setScrapedPeriod(periodStr);
        if (lastUpdatedFromScrape) {
          setLastUpdated(formatLastUpdate(new Date(lastUpdatedFromScrape)));
        }

        setRefreshKey(prev => prev + 1);
        localStorage.setItem('sintak_data_updated', Date.now().toString());
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Berhasil menarik ${totalScraped} Bill of Material Produksi.`
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal sinkronasi');
    } finally {
      setIsBatching(false);
      setLoading(false);
    }
  };

  const [dialog, setDialog] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && !isLoadingMore.current && (data?.length || 0) < totalCount) {
      isLoadingMore.current = true;
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
      accessorKey: 'faktur',
      header: 'Faktur BOM',
      size: 220,
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'tgl',
      header: 'Tanggal',
      size: 140,
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{formatIndoDateStr(getValue() as string)}</span>
    },
    {
      accessorKey: 'faktur_tplt',
      header: 'Template',
      size: 160,
      cell: ({ getValue, row }: any) => <span className={`font-medium transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-400'}`}>{String(getValue() || '—')}</span>
    },
    {
      accessorKey: 'kd_mtd',
      header: 'Metode',
      size: 120,
      cell: ({ getValue, row }: any) => <span className={`${row.getIsSelected() ? 'text-green-800' : 'text-gray-600'} font-semibold text-[11px] uppercase`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'kd_pelanggan',
      header: 'Pelanggan',
      size: 250,
      cell: ({ getValue, row }: any) => <span className={`font-medium transition-colors ${row.getIsSelected() ? 'text-green-800' : 'text-gray-700'}`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'nama_prd',
      header: 'Nama Prd',
      size: 350,
      cell: ({ getValue, row }: any) => <span className={`font-bold text-[13px]  tracking-tighter ${row.getIsSelected() ? 'text-green-900' : 'text-slate-800'}`}>{String(getValue())}</span>
    },
    {
        accessorKey: 'qty_order',
        header: 'Qty',
        size: 100,
        meta: { align: 'right' },
        cell: ({ getValue }: any) => <span className="font-semibold tabular-nums text-slate-700">{Number(String(getValue() || '0').replace(/[^0-9.-]/g, '') || 0).toLocaleString('id-ID')}</span>
    },
    {
      accessorKey: 'bbb',
      header: 'BBB',
      size: 160,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => (
        <div className={`flex items-center justify-between font-semibold tabular-nums transition-colors w-full ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
          <span className={`text-[10px] opacity-40 ${row.getIsSelected() ? 'text-green-400' : 'text-gray-400'}`}>Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
        </div>
      )
    },
    {
      accessorKey: 'btkl',
      header: 'BTKL',
      size: 160,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => (
        <div className={`flex items-center justify-between font-semibold tabular-nums transition-colors w-full ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
          <span className={`text-[10px] opacity-40 ${row.getIsSelected() ? 'text-green-400' : 'text-gray-400'}`}>Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
        </div>
      )
    },
    {
      accessorKey: 'bop',
      header: 'BOP',
      size: 160,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => (
        <div className={`flex items-center justify-between font-semibold tabular-nums transition-colors w-full ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
          <span className={`text-[10px] opacity-40 ${row.getIsSelected() ? 'text-green-400' : 'text-gray-400'}`}>Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
        </div>
      )
    },
    {
      accessorKey: 'hp',
      header: 'HP',
      size: 160,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => (
        <div className={`flex items-center justify-between font-semibold tabular-nums transition-colors w-full ${row.getIsSelected() ? 'text-green-800' : 'text-black'}`}>
          <span className={`text-[10px] opacity-40 ${row.getIsSelected() ? 'text-green-400' : 'text-black'}`}>Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
        </div>
      )
    },
    {
      accessorKey: 'spesifikasi',
      header: 'Spesifikasi',
      size: 400,
      cell: ({ getValue, row }: any) => <span className={`font-medium transition-colors ${row.getIsSelected() ? 'text-green-800' : 'text-gray-700'} text-[11px]`}>{String(getValue() || '—')}</span>
    },
    {
      accessorKey: 'faktur_prd',
      header: 'Faktur Prd',
      size: 250,
      cell: ({ getValue, row }: any) => <div className={`font-bold tracking-tight transition-colors truncate ${row.getIsSelected() ? 'text-green-600' : 'text-gray-500'}`} dangerouslySetInnerHTML={{ __html: String(getValue() || '–') }} />
    },
    {
      accessorKey: 'faktur_sph',
      header: 'Faktur SPH',
      size: 250,
      cell: ({ getValue, row }: any) => <div className={`font-bold tracking-tight transition-colors truncate ${row.getIsSelected() ? 'text-green-600' : 'text-gray-500'}`} dangerouslySetInnerHTML={{ __html: String(getValue() || '–') }} />
    },
    {
      accessorKey: 'cmd',
      header: 'CMD',
      size: 250,
      cell: ({ getValue, row }: any) => <div className={`font-bold tracking-tight transition-colors truncate ${row.getIsSelected() ? 'text-green-600' : 'text-gray-500'}`} dangerouslySetInnerHTML={{ __html: String(getValue() || '–') }} />
    },
    {
      accessorKey: 'detil',
      header: 'Detil',
      size: 180,
      cell: ({ row }: any) => (
        <div className="flex items-center">
          {row.original.detil ? <div className="scale-75 origin-left" dangerouslySetInnerHTML={{ __html: row.original.detil }} /> : '–'}
        </div>
      )
    },
    {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        cell: ({ getValue }: any) => {
          const val = String(getValue());
          return (
            <span className={`font-bold text-[10px] px-2.5 py-1 rounded-lg border ${val === '1' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
              {val === '1' ? 'ACTIVE' : 'INACTIVE'}
            </span>
          );
        }
      },
    {
      accessorKey: 'recid',
      header: 'RecId',
      size: 100,
      cell: ({ getValue, row }: any) => <span className={`font-mono text-[11px] ${row.getIsSelected() ? 'text-green-600' : 'text-gray-400'}`}>{String(getValue())}</span>
    }
  ], []);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      <DateRangeCard
        title="Rentang Tanggal"
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
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm shadow-red-900/5 text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <ScrapingHeader title="Hasil Scrapping Bill of Material Produksi" lastUpdated={lastUpdated} scrapedPeriod={scrapedPeriod} />

            {loading && (data?.length || 0) > 0 && (
              <div className="text-[10px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm animate-pulse leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses Data...</span>
              </div>
            )}
          </div>
          <SearchAndReload searchQuery={searchQuery} setSearchQuery={setSearchQuery} onReload={() => setRefreshKey(prev => prev + 1)} loading={loading} placeholder="Cari nomor faktur, nama produk, atau pelanggan..." />
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden relative">
          <DataTable
            columns={columns}
            data={data || []}
            isLoading={loading || data === null}
            totalCount={totalCount}
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
            label="Bill of Material Produksi"
            selectedCount={selectedIds.size}
            onClearSelection={clearSelection}
            loadTime={loadTime}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type={dialog.type as any}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog({ ...dialog, isOpen: false })}
      />
    </div>
  );
}



