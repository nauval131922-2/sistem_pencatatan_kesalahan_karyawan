'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, RefreshCw, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';

import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatLastUpdate } from '@/lib/date-utils';
import { getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod } from '@/lib/scraper-period';
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

export default function SpphOutClient() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);

  useEffect(() => {
    setIsMounted(true);

    const hydratedPeriod = hydrateScraperPeriod({ stateKey: 'spphOutState', periodKey: 'SpphOutClient_scrapedPeriod' });
    setScrapedPeriod(hydratedPeriod.scrapedPeriod);
    setStartDate(hydratedPeriod.startDate);
    setEndDate(hydratedPeriod.endDate);
  }, []);

  const [loading, setLoading] = useState(false);
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
  const { selectedIds, setSelectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spphOut_columnWidths');
      if (saved) return JSON.parse(saved);
    }
    return {
      id: 80,
      faktur: 220,
      tgl: 120,
      faktur_pr: 220,
      faktur_prd: 180,
      kd_gudang: 200,
      kd_cabang: 100,
      kd_supplier: 250,
      status: 100,
      create_at: 180,
      updated_at: 180,
      username: 120,
      edited_at: 180,
      username_edited: 120,
      deleted_at: 180,
      username_deleted: 120,
      pr_edited_at: 180,
      faktur_sph: 220,
      cmd: 200,
      detil: 120,
      recid: 80,
      keterangan: 300
    };
  });

  useEffect(() => {
    localStorage.setItem('spphOut_columnWidths', JSON.stringify(columnWidths));
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

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (mountedRef.current) setLoading(page === 1);
      const startTimer = Date.now();
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: PAGE_SIZE.toString(),
          q: debouncedQuery,
          start: formatDateToYYYYMMDD(startDate),
          end: formatDateToYYYYMMDD(endDate)
        });

        const res = await fetch(`/api/spph-out?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const json = await res.json();
        
        if (active && mountedRef.current) {
          setData(prev => {
            const processData = (items: any[]) => items.map(item => {
              let parsed = {};
              if (item.raw_data) {
                try { parsed = JSON.parse(item.raw_data); } catch(e){}
              }
              return { ...item, ...parsed };
            });

            if (page === 1) return processData(json.data || []);
            const currentData = prev || [];
            const newData = processData(json.data || []);
            const existingIds = new Set(currentData.map((d: any) => d.id));
            const filteredNew = newData.filter((d: any) => !existingIds.has(d.id));
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
        }
      } catch (err: any) {
        if (active && mountedRef.current) {
          setError(err.message || 'Gagal memuat data');
          setData([]);
        }
      } finally {
        if (active && mountedRef.current) {
          setLoading(false);
          isLoadingMore.current = false;
        }
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate, isMounted]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        setRefreshKey(prev => prev + 1);
        router.refresh();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');

  const handleFetch = async () => {
    if (!startDate || !endDate) return;

    localStorage.setItem('spphOutState', JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sessionDate: new Date().toLocaleDateString('en-CA')
    }));

    setError('');
    setData([]);
    setPage(1);
    setIsBatching(true);
    setLoading(true);
    setSearchQuery('');
    setBatchProgress(0);

    const chunks = splitDateRangeIntoMonths(formatDateToYYYYMMDD(startDate), formatDateToYYYYMMDD(endDate));
    let successCount = 0;
    let totalScraped = 0;
    let completedChunks = 0;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-spph-out?start=${chunk.start}&end=${chunk.end}`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
          totalScraped += (json.total || 0);
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
        const periodStr = persistScraperPeriod({ stateKey: 'spphOutState', periodKey: 'SpphOutClient_scrapedPeriod' }, startDate, endDate);
        setScrapedPeriod(periodStr);
        setIsBatching(false);
        setRefreshKey(prev => prev + 1);
        localStorage.setItem('sintak_data_updated', Date.now().toString());

        await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'SCRAPE',
            table_name: 'spph_out',
            message: `Tarik SPPH Out Out (${formatDateToYYYYMMDD(startDate)} s/d ${formatDateToYYYYMMDD(endDate)})`,
            raw_data: JSON.stringify({ totalScraped })
          })
        });

        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Berhasil menarik ${totalScraped} SPPH Out Out.`
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
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && (data?.length || 0) < totalCount) {
      setPage(prev => prev + 1);
    }
  }, [loading, data, totalCount, setPage]);

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
      header: 'Faktur',
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
      accessorKey: 'faktur_pr',
      header: 'Faktur PR',
      size: columnWidths.faktur_pr,
      cell: ({ getValue, row }) => (
        <span className={`font-medium transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-500'}`}>
          {getValue() as string || '-'}
        </span>
      )
    },
    {
      accessorKey: 'faktur_prd',
      header: 'Faktur PRD',
      size: columnWidths.faktur_prd,
      cell: ({ getValue, row }) => (
        <span className={`font-medium transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-400'}`}>
          {getValue() as string || '-'}
        </span>
      )
    },
    {
      accessorKey: 'kd_gudang',
      header: 'Gudang',
      size: columnWidths.kd_gudang,
      cell: ({ getValue }) => <span className="text-gray-500">{getValue() as string || '-'}</span>
    },
    {
      accessorKey: 'kd_cabang',
      header: 'Cabang',
      size: columnWidths.kd_cabang,
      cell: ({ getValue }) => <span className="text-gray-500">{getValue() as string || '-'}</span>
    },
    {
      accessorKey: 'kd_supplier',
      header: 'Supplier',
      size: columnWidths.kd_supplier,
      cell: ({ getValue, row }) => (
        <span className={`font-medium transition-colors ${row.getIsSelected() ? 'text-green-800' : 'text-gray-700'}`}>
          {getValue() as string}
        </span>
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
      accessorKey: 'create_at',
      header: 'Create At',
      size: columnWidths.create_at,
      cell: ({ getValue }) => <span className="text-[11px] text-gray-400 font-mono">{getValue() as string || '-'}</span>
    },
    {
      accessorKey: 'updated_at',
      header: 'Updated At',
      size: columnWidths.updated_at,
      cell: ({ getValue }) => <span className="text-[11px] text-gray-400 font-mono">{getValue() as string || '-'}</span>
    },
    {
      accessorKey: 'username',
      header: 'Username',
      size: columnWidths.username,
      cell: ({ getValue, row }) => (
        <span className={`text-[11px] font-bold transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-400'}`}>
          @{getValue() as string || '–'}
        </span>
      )
    },
    {
      accessorKey: 'edited_at',
      header: 'Edited At',
      size: columnWidths.edited_at,
      cell: ({ getValue }) => <span className="text-[11px] text-gray-400 font-mono">{getValue() as string || '-'}</span>
    },
    {
      accessorKey: 'username_edited',
      header: 'User Edited',
      size: columnWidths.username_edited,
      cell: ({ getValue }) => <span className="text-[11px] text-gray-400">@{getValue() as string || '-'}</span>
    },
    {
      accessorKey: 'deleted_at',
      header: 'Deleted At',
      size: columnWidths.deleted_at,
      cell: ({ getValue }) => <span className="text-[11px] text-rose-300 font-mono">{getValue() as string || '-'}</span>
    },
    {
      accessorKey: 'username_deleted',
      header: 'User Deleted',
      size: columnWidths.username_deleted,
      cell: ({ getValue }) => <span className="text-[11px] text-rose-300">@{getValue() as string || '-'}</span>
    },
    {
      accessorKey: 'pr_edited_at',
      header: 'PR Edited At',
      size: columnWidths.pr_edited_at,
      cell: ({ getValue }) => <span className="text-[11px] text-gray-400 font-mono">{getValue() as string || '-'}</span>
    },
    {
      accessorKey: 'faktur_sph',
      header: 'Faktur SPH',
      size: columnWidths.faktur_sph,
      cell: ({ getValue, row }) => (
        <div className={`transition-colors truncate font-medium ${row.getIsSelected() ? 'text-green-600' : 'text-gray-400'}`} dangerouslySetInnerHTML={{ __html: getValue() as string || '-' }} />
      )
    },
    {
      accessorKey: 'cmd',
      header: 'Aksi',
      size: columnWidths.cmd,
      cell: ({ getValue, row }) => (
        <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: getValue() as string || '-' }} />
      )
    },
    {
      accessorKey: 'detil',
      header: 'Cetak',
      size: columnWidths.detil,
      cell: ({ getValue, row }) => (
        <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: getValue() as string || '-' }} />
      )
    },
    {
      accessorKey: 'recid',
      header: 'RecId',
      size: columnWidths.recid,
      cell: ({ getValue }) => <span className="text-[11px] text-gray-300 font-mono">{getValue() as string}</span>
    },
    {
      accessorKey: 'keterangan',
      header: 'Keterangan',
      size: columnWidths.keterangan,
      cell: ({ getValue, row }) => (
        <span className={`font-medium truncate transition-colors ${row.getIsSelected() ? 'text-green-800' : 'text-gray-700'}`} title={getValue() as string || ''}>
          {getValue() as string || '–'}
        </span>
      )
    }
  ], [columnWidths]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-sm flex flex-col gap-5 shrink-0 relative z-50">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Rentang Tanggal</span>
              <div className="flex items-center gap-2">
                <div className="w-[140px]">
                  <DatePicker value={startDate} onChange={setStartDate} name="startDate" />
                </div>
                <div className="w-4 h-[1px] bg-gray-200 mx-1"></div>
                <div className="w-[140px]">
                  <DatePicker value={endDate} onChange={setEndDate} name="endDate" />
                </div>
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
              className="px-5 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
            >
              <RefreshCw size={16} className={isBatching ? "animate-spin" : ""} />
              <span>{isBatching ? `${batchProgress}%` : 'Tarik Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm flex items-start gap-2 animate-in fade-in shrink-0">
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
                  <span>Diperbarui: {lastUpdated} {scrapedPeriod ? `(Periode: ${scrapedPeriod.start} - ${scrapedPeriod.end})` : ''}</span>
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
              placeholder="Cari faktur, supplier, keterangan..."
              className="w-full pl-12 pr-4 h-10 bg-white border border-gray-200 rounded-[14px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
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
              {totalCount === 0 ? 'Tidak ada SPPH Out' : `Menampilkan ${data?.length || 0} dari ${totalCount} SPPH Out`}
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






