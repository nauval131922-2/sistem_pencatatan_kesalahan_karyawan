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
import { splitDateRangeIntoMonths } from '@/lib/date-utils';
import { useTableSelection } from '@/lib/hooks/useTableSelection';

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
        id: 80,
        faktur: 220,
        faktur_tplt: 160,
        kd_cabang: 120,
        kd_gudang: 200,
        tgl: 140,
        kd_mtd: 120,
        kd_pelanggan: 250,
        nama_prd: 350,
        status: 100,
        bbb: 160,
        pers_btkl: 100,
        btkl: 160,
        pers_bop: 100,
        bop: 160,
        hp: 160,
        spesifikasi: 400,
        qty_order: 100,
        faktur_prd: 250,
        faktur_sph: 250,
        username: 120,
        created_at: 180,
        username_edited: 120,
        edited_at: 180,
        cmd: 250,
        detil: 180,
        recid: 100
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
    const startTimer = Date.now();
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
        if (json.scrapedPeriod?.start && json.scrapedPeriod?.end) {
          setScrapedPeriod(json.scrapedPeriod);
        }

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
        setLoadTime(Date.now() - startTimer);
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

    const chunks = splitDateRangeIntoMonths(formatDateToYYYYMMDD(startDate), formatDateToYYYYMMDD(endDate));
    setIsBatching(true);
    setLoading(true);
    setBatchProgress(0);

    let successCount = 0;
    let totalScraped = 0;
    let completedChunks = 0;
    let lastUpdatedFromScrape: string | null = null;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-bom?start=${chunk.start}&end=${chunk.end}`);
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
        await fetch('/api/bom/scrape-period', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start: formatDateToYYYYMMDD(startDate).split('-').reverse().join('-'),
            end: formatDateToYYYYMMDD(endDate).split('-').reverse().join('-'),
          })
        });
        if (lastUpdatedFromScrape) {
          setLastUpdated(formatLastUpdate(new Date(lastUpdatedFromScrape)));
        }
        setIsBatching(false);
        await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'SCRAPE',
            table_name: 'bom',
            message: `Tarik Bill of Material (${formatDateToYYYYMMDD(startDate)} s/d ${formatDateToYYYYMMDD(endDate)})`,
            raw_data: JSON.stringify({ totalScraped })
          })
        });

        setRefreshKey(prev => prev + 1);
        localStorage.setItem('sintak_data_updated', Date.now().toString());
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Berhasil menarik ${totalScraped} Bill of Material.`
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

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: columnWidths.id,
      cell: ({ getValue, row }) => (
        <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-400'}`}>
          {getValue() as string}
        </span>
      )
    },
    {
      accessorKey: 'faktur',
      header: 'Faktur BOM',
      size: columnWidths.faktur,
      cell: ({ getValue, row }) => (
        <span className={`font-medium transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`}>
          {getValue() as string}
        </span>
      )
    },
    {
      accessorKey: 'tgl',
      header: 'Tanggal',
      size: columnWidths.tgl,
      cell: ({ getValue, row }) => (
        <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
          {formatIndoDateStr(getValue() as string)}
        </span>
      )
    },
    {
      accessorKey: 'faktur_tplt',
      header: 'Template',
      size: columnWidths.faktur_tplt,
      cell: ({ getValue, row }) => (
        <span className={`font-medium transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-400'}`}>
          {getValue() as string || '-'}
        </span>
      )
    },
    {
      accessorKey: 'kd_mtd',
      header: 'Metode',
      size: columnWidths.kd_mtd,
      cell: ({ getValue, row }) => (
        <span className={`${row.getIsSelected() ? 'text-green-800' : 'text-gray-600'} font-bold text-[11px]`}>
          {getValue() as string}
        </span>
      )
    },
    {
        accessorKey: 'kd_cabang',
        header: 'Cabang',
        size: columnWidths.kd_cabang,
        cell: ({ getValue }) => <span className="text-gray-500">{getValue() as string || '-'}</span>
      },
      {
        accessorKey: 'kd_gudang',
        header: 'Gudang',
        size: columnWidths.kd_gudang,
        cell: ({ getValue }) => <span className="text-gray-500">{getValue() as string || '-'}</span>
      },
    {
        accessorKey: 'kd_pelanggan',
        header: 'Pelanggan',
        size: columnWidths.kd_pelanggan,
        cell: ({ getValue, row }) => (
          <span className={`font-medium transition-colors ${row.getIsSelected() ? 'text-green-800' : 'text-gray-700'}`}>
            {getValue() as string}
          </span>
        )
      },
    {
      accessorKey: 'nama_prd',
      header: 'Nama Prd',
      size: columnWidths.nama_prd,
      cell: ({ getValue, row }) => (
        <span className={`font-bold text-[13px] ${row.getIsSelected() ? 'text-green-900' : 'text-slate-800'}`}>
          {getValue() as string}
        </span>
      )
    },
    {
        accessorKey: 'qty_order',
        header: 'Qty',
        size: columnWidths.qty_order,
        meta: { align: 'right' },
        cell: ({ getValue }) => {
          const val = getValue();
          const cleanStr = String(val || '0').replace(/,/g, '').replace(/[^0-9.-]/g, '');
          const num = parseFloat(cleanStr);
          return <span className="font-bold tabular-nums text-slate-500">{(isNaN(num) ? 0 : num).toLocaleString('id-ID')}</span>
        }
    },
    {
      accessorKey: 'bbb',
      header: 'BBB',
      size: columnWidths.bbb,
      meta: { align: 'right' },
      cell: ({ getValue, row }) => (
        <div className={`flex items-center justify-end font-medium tabular-nums transition-colors ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
          <span className={`text-[10px] font-bold mr-1 ${row.getIsSelected() ? 'text-green-400' : 'text-gray-300'}`}>Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      )
    },
    {
        accessorKey: 'pers_btkl',
        header: '% BTKL',
        size: columnWidths.pers_btkl,
        meta: { align: 'right' },
        cell: ({ getValue }) => <span className="text-gray-400 tabular-nums text-[11px]">{Number(getValue() || 0).toFixed(2)}%</span>
    },
    {
      accessorKey: 'btkl',
      header: 'BTKL',
      size: columnWidths.btkl,
      meta: { align: 'right' },
      cell: ({ getValue, row }) => (
        <div className={`flex items-center justify-end font-medium tabular-nums transition-colors ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
          <span className={`text-[10px] font-bold mr-1 ${row.getIsSelected() ? 'text-green-400' : 'text-gray-300'}`}>Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      )
    },
    {
        accessorKey: 'pers_bop',
        header: '% BOP',
        size: columnWidths.pers_bop,
        meta: { align: 'right' },
        cell: ({ getValue }) => <span className="text-gray-400 tabular-nums text-[11px]">{Number(getValue() || 0).toFixed(2)}%</span>
    },
    {
      accessorKey: 'bop',
      header: 'BOP',
      size: columnWidths.bop,
      meta: { align: 'right' },
      cell: ({ getValue, row }) => (
        <div className={`flex items-center justify-end font-medium tabular-nums transition-colors ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
          <span className={`text-[10px] font-bold mr-1 ${row.getIsSelected() ? 'text-green-400' : 'text-gray-300'}`}>Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      )
    },
    {
      accessorKey: 'hp',
      header: 'HP',
      size: columnWidths.hp,
      meta: { align: 'right' },
      cell: ({ getValue, row }) => (
        <div className={`flex items-center justify-end font-extrabold tabular-nums transition-colors ${row.getIsSelected() ? 'text-green-800' : 'text-slate-900'}`}>
          <span className={`text-[10px] font-bold mr-1 ${row.getIsSelected() ? 'text-green-400' : 'text-gray-300'}`}>Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      )
    },
    {
        accessorKey: 'status',
        header: 'Status',
        size: columnWidths.status,
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return (
            <span className={`font-black text-[10px] px-2 py-0.5 rounded-full border ${val === '1' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
              {val === '1' ? 'ACTIVE' : 'INACTIVE'}
            </span>
          );
        }
      },
    {
        accessorKey: 'spesifikasi',
        header: 'Spesifikasi',
        size: columnWidths.spesifikasi,
        cell: ({ getValue }) => <span className="text-gray-500 text-[12px] italic whitespace-nowrap">{getValue() as string || '-'}</span>
    },
    {
        accessorKey: 'faktur_prd',
        header: 'Ref. Produksi',
        size: columnWidths.faktur_prd,
        cell: ({ getValue, row }) => (
          <div className={`transition-colors truncate font-medium ${row.getIsSelected() ? 'text-green-600' : 'text-gray-400'}`} dangerouslySetInnerHTML={{ __html: getValue() as string || '-' }} />
        )
      },
      {
        accessorKey: 'faktur_sph',
        header: 'Ref. SPH',
        size: columnWidths.faktur_sph,
        cell: ({ getValue, row }) => (
          <div className={`transition-colors truncate font-medium ${row.getIsSelected() ? 'text-green-600' : 'text-gray-400'}`} dangerouslySetInnerHTML={{ __html: getValue() as string || '-' }} />
        )
      },
      {
        accessorKey: 'username',
        header: 'User',
        size: columnWidths.username,
        cell: ({ getValue, row }) => (
          <span className={`text-[11px] font-bold transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-400'}`}>
            @{getValue() as string || '–'}
          </span>
        )
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        size: columnWidths.created_at,
        cell: ({ getValue }) => <span className="text-[11px] text-gray-400 font-mono">{getValue() as string || '-'}</span>
      },
      {
        accessorKey: 'username_edited',
        header: 'Edited By',
        size: columnWidths.username_edited,
        cell: ({ getValue }) => <span className="text-[11px] text-gray-400">@{getValue() as string || '-'}</span>
      },
      {
        accessorKey: 'edited_at',
        header: 'Edited At',
        size: columnWidths.edited_at,
        cell: ({ getValue }) => <span className="text-[11px] text-gray-400 font-mono">{getValue() as string || '-'}</span>
      },
      {
        accessorKey: 'cmd',
        header: 'Komando',
        size: columnWidths.cmd,
        cell: ({ getValue }) => <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: getValue() as string || '-' }} />
      },
      {
        accessorKey: 'detil',
        header: 'Detil',
        size: columnWidths.detil,
        cell: ({ getValue }) => <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: getValue() as string || '-' }} />
      },
    {
      accessorKey: 'recid',
      header: 'RecId',
      size: columnWidths.recid,
      cell: ({ getValue, row }) => (
        <span className={`font-mono text-[11px] ${row.getIsSelected() ? 'text-green-600' : 'text-gray-400'}`}>
          {getValue() as string}
        </span>
      )
    }
  ], [columnWidths]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      <div className="bg-white rounded-[8px] border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-300 flex flex-col gap-5 shrink-0 relative z-50">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Rentang Tanggal</span>
              <div className="flex items-center gap-2">
                <>
                  <div className="w-[140px]">
                    <DatePicker value={startDate} onChange={setStartDate} name="startDate" />
                  </div>
                  <div className="w-4 h-[1px] bg-gray-200 mx-1"></div>
                  <div className="w-[140px]">
                    <DatePicker value={endDate} onChange={setEndDate} name="endDate" />
                  </div>
                </>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {isBatching && (
              <div className="flex flex-col items-end">
                <div className="text-[10px] text-green-600 font-bold animate-pulse leading-none uppercase tracking-tighter">{batchStatus}</div>
                <div className="w-24 h-1 bg-gray-50 rounded-full mt-1.5 overflow-hidden border border-gray-200">
                  <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${batchProgress}%` }} />
                </div>
              </div>
            )}
            <button
              onClick={handleFetch}
              disabled={loading || isBatching}
              className="px-5 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-extrabold rounded-[8px] transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 shadow-sm active:scale-[0.98]"
            >
              <RefreshCw size={16} className={isBatching ? "animate-spin" : ""} />
              <span>{isBatching ? `${batchProgress}%` : 'Tarik Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-[8px] text-sm flex items-start gap-2 animate-in fade-in shrink-0">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Results View */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-4">
              <h3 className="text-[14px] font-extrabold text-gray-800 flex items-center gap-2.5 leading-none">
                <Clock size={18} className="text-green-600" />
                <span>Hasil Scrapping</span>
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-[12px] font-medium leading-none" style={{ color: '#99a1af' }}>
                  <span className="opacity-40">|</span>
                  <span>Diperbarui: {lastUpdated}{scrapedPeriod ? ` (Periode: ${formatScrapedPeriodDate(scrapedPeriod.start)} s.d. ${formatScrapedPeriodDate(scrapedPeriod.end)})` : ''}</span>
                </div>
              )}
            </div>

            {loading && (data?.length || 0) > 0 && (
              <div className="flex items-center gap-2 text-[11px] font-bold text-green-600 animate-pulse bg-green-50 px-2.5 py-1 rounded-full border border-green-100 uppercase tracking-tighter leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses...</span>
              </div>
            )}
          </div>
          <div className="relative w-full group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari faktur, produk, pelanggan..."
              className="w-full pl-12 pr-4 h-10 bg-white border border-gray-100 rounded-[8px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
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
          />

          <div className="flex items-center justify-between shrink-0 px-1 mt-1">
            <span className="text-[12px] leading-none font-bold text-gray-400">
              {totalCount === 0 ? 'Tidak ada Bill of Material' : `Menampilkan ${data?.length || 0} dari ${totalCount} Bill of Material`}
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
                  loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                  <span className="animate-pulse">⚡</span>
                  <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
                </span>
              )}
            </div>
          </div>
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











