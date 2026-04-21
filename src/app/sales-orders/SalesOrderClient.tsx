'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import { splitDateRangeIntoMonths } from '@/lib/date-utils';
import { DataTable } from '@/components/ui/DataTable';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import { formatLastUpdate } from '@/lib/date-utils';
import { formatScrapedPeriodDate, getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod } from '@/lib/scraper-period';

function formatDateToYYYYMMDD(date: Date) {
  if (!date) return '';
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

export default function SalesOrderClient() {
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
      const saved = localStorage.getItem('salesOrder_columnWidths');
      return saved ? JSON.parse(saved) : {
        id: 80, faktur: 180, tgl: 120, nama_pelanggan: 280, nama_prd: 350, qty: 110, jumlah: 180, recid: 80
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('salesOrder_columnWidths', JSON.stringify(columnWidths));
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
    const hydratedPeriod = hydrateScraperPeriod({ stateKey: 'salesOrderState', periodKey: 'SalesOrderClient_scrapedPeriod' });
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
          page: page.toString(), limit: PAGE_SIZE.toString(), search: debouncedQuery,
          from: formatDateToYYYYMMDD(startDate), to: formatDateToYYYYMMDD(endDate), _t: Date.now().toString()
        });
        const res = await fetch(`/api/sales-orders?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const json = await res.json();
        if (active) {
          setData(prev => {
            const processData = (items: any[]) => (items || []).map((d: any) => {
              let parsed = {};
              if (d.raw_data) { try { parsed = JSON.parse(d.raw_data); } catch(e){} }
              return { ...d, ...parsed };
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

  const handleFetchDigit = async () => {
    if (!startDate || !endDate) return;
    localStorage.setItem('salesOrderState', JSON.stringify({
      startDate: startDate.toISOString(), endDate: endDate.toISOString(), sessionDate: new Date().toLocaleDateString('en-CA')
    }));
    setError(''); setData([]); setPage(1); setIsBatching(true); setLoading(true); setSearchQuery(''); setBatchProgress(0);
    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    let successCount = 0; let totalScraped = 0; let completedChunks = 0;
    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-sales-orders?start=${chunk.start}&end=${chunk.end}&metaStart=${startStr}&metaEnd=${endStr}`);
        if (res.ok) {
          successCount++; const json = await res.json(); totalScraped += (json.total || 0);
        }
      } catch (e) {} finally {
        completedChunks++; setBatchProgress(Math.round((completedChunks / chunks.length) * 100));
        setBatchStatus(`Memproses ${completedChunks}/${chunks.length} bulan...`);
      }
    };
    try {
      const concurrency = 15; const queue = [...chunks];
      const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
        while (queue.length > 0) { const chunk = queue.shift(); if (chunk) await processChunk(chunk); }
      });
      await Promise.all(workers);
      if (successCount > 0) {
        persistScraperPeriod({ stateKey: 'salesOrderState', periodKey: 'SalesOrderClient_scrapedPeriod' }, startDate, endDate);
        setRefreshKey(prev => prev + 1);
        localStorage.setItem('sintak_data_updated', Date.now().toString());
        setDialog({ isOpen: true, type: 'success', title: 'Berhasil', message: `Berhasil menarik ${totalScraped} data Sales Order Barang.` });
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
      header: 'Faktur SO',
      size: 180,
      cell: ({ getValue, row }: any) => <span className={`font-black tracking-tight transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'nama_pelanggan',
      header: 'Pelanggan',
      size: 280,
      cell: ({ getValue, row }: any) => <span className={`font-black uppercase tracking-tight ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'nama_prd',
      header: 'Produk',
      size: 350,
      cell: ({ getValue, row }: any) => <span className={`font-bold uppercase ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'qty',
      header: 'Qty SO',
      size: 110,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-slate-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
    },
    {
      accessorKey: 'jumlah',
      header: 'Nilai SO',
      size: 180,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => (
        <div className={`flex items-center justify-between font-black tabular-nums w-full ${row.getIsSelected() ? 'text-green-700' : 'text-emerald-700'}`}>
          <span className="text-[10px] opacity-40 mr-1">Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
        </div>
      )
    },
    { 
        accessorKey: 'recid', 
        header: 'RecId', 
        size: 80, 
        cell: ({ getValue }: any) => <span className="text-[11px] font-black text-gray-700/60 tabular-nums">{String(getValue())}</span> 
    }
  ], []);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      <div className="bg-[var(--bg-surface)] rounded-none border-[3px] border-black p-5 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3.5px_3.5px_0_0_#000] shadow-[2.5px_2.5px_0_0_#000] transition-all duration-300 flex flex-col gap-5 shrink-0 relative z-50">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Rentang Tanggal</span>
              <div className="flex items-center gap-2">
                <div className="w-[140px] relative group"><DatePicker name="startDate" value={startDate} onChange={setStartDate} /></div>
                <div className="w-4 h-[1px] bg-gray-200 mx-1"></div>
                <div className="w-[140px] relative group"><DatePicker name="endDate" value={endDate} onChange={setEndDate} /></div>
              </div>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            {isBatching && (
              <div className="flex flex-col items-end">
                <div className="text-[10px] text-black font-black animate-pulse leading-none uppercase tracking-tighter bg-[#fde047] px-2 py-1 border-[2px] border-black shadow-[2px_2px_0_0_#000]">{batchStatus}</div>
                <div className="w-24 h-2 bg-white rounded-none mt-1.5 overflow-hidden border-[2px] border-black shadow-[2px_2px_0_0_#000]">
                  <div className="h-full bg-black transition-all duration-300" style={{ width: `${batchProgress}%` }} />
                </div>
              </div>
            )}
            <button onClick={handleFetchDigit} disabled={loading || isBatching} className="px-5 h-10 bg-[#fde047] text-black hover:bg-black hover:text-white hover:border-black text-[13px] font-black uppercase tracking-wider border-[3px] border-black rounded-none transition-all flex items-center gap-2 shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[2.5px_2.5px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-50">
              <RefreshCw size={16} className={isBatching ? "animate-spin" : ""} strokeWidth={3} />
              <span>{isBatching ? `${batchProgress}%` : 'Tarik Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#ff5e5e] text-white border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] rounded-none text-sm font-black flex items-start gap-2 animate-in fade-in shrink-0 uppercase tracking-wide">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={3} /><p>{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-4">
              <h3 className="text-[14px] font-extrabold text-gray-800 flex items-center gap-2.5 leading-none">
                <Clock size={18} className="text-green-600" />
                <span>Hasil Scrapping</span>
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/40 leading-none">
                  <span className="opacity-40">|</span><span>Diperbarui: {lastUpdated}{scrapedPeriod ? ` (Periode: ${formatScrapedPeriodDate(scrapedPeriod.start)} s.d. ${formatScrapedPeriodDate(scrapedPeriod.end)})` : ''}</span>
                </div>
              )}
            </div>
            {loading && data && data.length > 0 && (
              <div className="text-[11px] font-black text-black flex items-center gap-2 bg-[#fde047] px-2.5 py-1 rounded-none border-[2px] border-black shadow-[2px_2px_0_0_#000] animate-pulse uppercase tracking-tighter leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses...</span>
              </div>
            )}
          </div>
          <SearchAndReload searchQuery={searchQuery} setSearchQuery={setSearchQuery} onReload={() => setRefreshKey(prev => prev + 1)} loading={loading} placeholder="Cari faktur, pelanggan, atau produk..." />
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden relative">
          <DataTable columns={columns} data={data || []} isLoading={loading || data === null} totalCount={totalCount} onScroll={handleScroll} selectedIds={selectedIds} onRowClick={handleRowClick} columnWidths={columnWidths} onColumnWidthChange={setColumnWidths} rowHeight="h-10" />
          <TableFooter totalCount={totalCount} currentCount={data?.length || 0} label="Sales Order Barang" selectedCount={selectedIds.size} onClearSelection={clearSelection} loadTime={loadTime} />
        </div>
      </div>

      <ConfirmDialog isOpen={dialog.isOpen} type={dialog.type as any} title={dialog.title} message={dialog.message} onConfirm={() => setDialog({ ...dialog, isOpen: false })} />
    </div>
  );
}
