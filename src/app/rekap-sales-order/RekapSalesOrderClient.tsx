'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, Search, AlertCircle, Clock, RefreshCw,
  ChevronLeft, ChevronRight, SlidersHorizontal, X
} from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import DateRangeCard from '@/components/DateRangeCard';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import { formatLastUpdate, splitDateRangeIntoMonths } from '@/lib/date-utils';
import { formatScrapedPeriodDate, getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod } from '@/lib/scraper-period';
import ScrapingHeader from '@/components/ScrapingHeader';

const PAGE_SIZE = 50;

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

function formatDateToYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function RekapSalesOrderClient() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [minHarga, setMinHarga] = useState('');
  const [maxHarga, setMaxHarga] = useState('');
  const [appliedMin, setAppliedMin] = useState('');
  const [appliedMax, setAppliedMax] = useState('');
  const [showHargaFilter, setShowHargaFilter] = useState(false);
  const hargaFilterRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{start: string, end: string} | null>(null);

  const { selectedIds, setSelectedIds, handleRowClick, clearSelection } = useTableSelection(data);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rekapSalesOrder_columnWidths');
      return saved ? JSON.parse(saved) : {
        id: 80, tgl: 130, faktur: 180, nama_pelanggan: 250, total: 160, username: 120
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('rekapSalesOrder_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    setIsMounted(true);
    const hydrated = hydrateScraperPeriod({ stateKey: 'rekapSalesOrderState', periodKey: 'RekapSalesOrderClient_scrapedPeriod' });
    setStartDate(hydrated.startDate);
    setEndDate(hydrated.endDate);
    setScrapedPeriod(hydrated.scrapedPeriod);
  }, []);

  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(h);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (hargaFilterRef.current && !hargaFilterRef.current.contains(e.target as Node)) {
        setShowHargaFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    let active = true;
    async function load() {
      setLoading(page === 1);
      const startT = performance.now();
      try {
        const q = new URLSearchParams({
          page: page.toString(), limit: PAGE_SIZE.toString(), q: debouncedQuery,
          from: formatDateToYYYYMMDD(startDate), to: formatDateToYYYYMMDD(endDate),
          min: appliedMin, max: appliedMax, _t: Date.now().toString()
        });
        const res = await fetch(`/api/rekap-sales-order?${q}`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const json = await res.json();
        if (active) {
          setData(json.data || []);
          setTotalCount(json.total || 0);
          setLoadTime(Math.round(performance.now() - startT));
          if (json.lastUpdated) setLastUpdated(formatLastUpdate(new Date(json.lastUpdated)));
          if (json.scrapedPeriod) setScrapedPeriod(json.scrapedPeriod);
        }
      } catch (err: any) {
        if (active) { setError(err.message); setData([]); }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [isMounted, page, debouncedQuery, startDate, endDate, appliedMin, appliedMax, refreshKey]);

  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');
  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as any, title: '', message: '' });

  const handleFetch = async () => {
    if (!startDate || !endDate) return;
    localStorage.setItem('rekapSalesOrderState', JSON.stringify({
      startDate: startDate.toISOString(), endDate: endDate.toISOString(), sessionDate: new Date().toLocaleDateString('en-CA')
    }));
    setError(''); setData([]); setPage(1); setIsBatching(true); setBatchProgress(0);
    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    let successCount = 0; let totalScraped = 0; let completedChunks = 0;
    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-sales-orders?start=${chunk.start}&end=${chunk.end}&metaStart=${startStr}&metaEnd=${endStr}`);
        if (res.ok) {
          successCount++; const json = await res.json(); totalScraped += (json.total || 0);
        } else {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Error ${res.status}`);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
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
        persistScraperPeriod({ stateKey: 'rekapSalesOrderState', periodKey: 'RekapSalesOrderClient_scrapedPeriod' }, startDate, endDate);
        setRefreshKey(v => v + 1);
        setDialog({ isOpen: true, type: 'success', title: 'Selesai', message: `Berhasil menarik ${totalScraped} Rekap Sales Order.` });
      }
    } finally { setIsBatching(false); }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && !isBatching && (data?.length || 0) < totalCount) {
      setPage(prev => prev + 1);
    }
  }, [loading, isBatching, data, totalCount]);

  const columns = useMemo(() => [
    {
      accessorKey: 'tgl',
      header: 'Tanggal',
      size: 130,
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{formatIndoDateStr(getValue() as string)}</span>
    },
    {
      accessorKey: 'faktur',
      header: 'Faktur',
      size: 160,
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'faktur_sph',
      header: 'Faktur SPH',
      size: 160,
      cell: ({ getValue, row }: any) => <span className={`font-medium tracking-tight ${row.getIsSelected() ? 'text-green-600' : 'text-gray-500'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'nama_pelanggan',
      header: 'Pelanggan',
      size: 220,
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue())}</span>
    },
    {
      accessorKey: 'nama_prd',
      header: 'Produk',
      size: 250,
      cell: ({ getValue, row }: any) => <span className={`font-medium tracking-tight ${row.getIsSelected() ? 'text-green-900' : 'text-gray-700'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'qty',
      header: 'Qty',
      size: 80,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    {
      accessorKey: 'satuan',
      header: 'Satuan',
      size: 80,
      cell: ({ getValue, row }: any) => <span className={`font-medium text-gray-500 ${row.getIsSelected() ? 'text-green-700' : ''}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'harga',
      header: 'Harga',
      size: 140,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => (
        <div className={`flex items-center justify-between font-medium tabular-nums w-full ${row.getIsSelected() ? 'text-green-700' : 'text-gray-600'}`}>
          <span className="text-[10px] opacity-40 mr-1">Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
        </div>
      )
    },
    {
      accessorKey: 'jumlah',
      header: 'Jumlah',
      size: 160,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => (
        <div className={`flex items-center justify-between font-bold tabular-nums w-full ${row.getIsSelected() ? 'text-green-700' : 'text-emerald-700'}`}>
          <span className="text-[10px] opacity-40 mr-1">Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
        </div>
      )
    }
  ], []);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
      {/* Filter row: Rentang Tanggal + Filter Harga side by side */}
      <div className="grid grid-cols-[1fr_auto] gap-4 shrink-0">
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

        {/* Filter Harga - separate card, same row */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-6 flex flex-col justify-center gap-2 relative" ref={hargaFilterRef}>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-gray-500 mb-0.5 pl-1">Filter Harga</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowHargaFilter(v => !v)} 
                className={`
                  flex items-center gap-3 px-6 h-12 rounded-lg text-[13px] font-semibold border transition-all shadow-sm
                  ${appliedMin !== '' || appliedMax !== '' 
                    ? 'bg-green-600 border-green-500 text-white shadow-green-100' 
                    : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}
                `}
              >
                <SlidersHorizontal size={16} />
                <span>{appliedMin !== '' || appliedMax !== '' ? `Rp ${appliedMin || '0'} – ${appliedMax || '∞'}` : 'Atur Rentang'}</span>
              </button>
              {(appliedMin !== '' || appliedMax !== '') && (
                <button 
                  onClick={() => { setAppliedMin(''); setAppliedMax(''); setMinHarga(''); setMaxHarga(''); }} 
                  className="w-12 h-12 rounded-lg border border-rose-100 flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all shadow-sm shadow-rose-900/5"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            {showHargaFilter && (
              <div className="absolute top-full mt-3 right-0 w-72 bg-white rounded-xl border border-gray-100 shadow-md shadow-green-900/10 p-6 z-[100] animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-semibold text-gray-500 mb-0.5 pl-1">Min. Total (Rp)</label>
                    <input 
                      type="text" 
                      value={minHarga} 
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setMinHarga(val ? Number(val).toLocaleString('id-ID') : '');
                      }} 
                      className="w-full h-11 bg-gray-50 rounded-lg border border-gray-100 px-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white transition-all" 
                      placeholder="0" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-semibold text-gray-500 mb-0.5 pl-1">Max. Total (Rp)</label>
                    <input 
                      type="text" 
                      value={maxHarga} 
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setMaxHarga(val ? Number(val).toLocaleString('id-ID') : '');
                      }} 
                      className="w-full h-11 bg-gray-50 rounded-lg border border-gray-100 px-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white transition-all" 
                      placeholder="∞" 
                    />
                  </div>
                  <button 
                    onClick={() => { setAppliedMin(minHarga.replace(/\./g, '')); setAppliedMax(maxHarga.replace(/\./g, '')); setShowHargaFilter(false); setPage(1); }} 
                    className="w-full h-11 bg-green-600 text-white font-bold text-[13px] rounded-lg hover:bg-green-700 transition-colors shadow-sm shadow-green-100"
                  >
                    Terapkan Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[11px] font-bold flex items-start gap-3 animate-in slide-in-from-top-2 z-20 shadow-sm shadow-rose-900/5 uppercase tracking-widest">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden relative min-h-0">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <ScrapingHeader title="Hasil Scrapping Rekap Sales Order" lastUpdated={lastUpdated} scrapedPeriod={scrapedPeriod} />

            {loading && data && data.length > 0 && (
              <div className="text-[10px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm animate-pulse uppercase tracking-widest leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Syncing...</span>
              </div>
            )}
          </div>
          <SearchAndReload searchQuery={searchQuery} setSearchQuery={setSearchQuery} onReload={() => setRefreshKey(v => v + 1)} loading={loading} placeholder="Cari faktur atau pelanggan..." />
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-5 overflow-hidden relative">
          <DataTable columns={columns} data={data || []} isLoading={loading} totalCount={totalCount} selectedIds={selectedIds} onRowClick={handleRowClick} columnWidths={columnWidths} onColumnWidthChange={setColumnWidths} rowHeight="h-11" />
        </div>

        <TableFooter 
          totalCount={totalCount} 
          currentCount={data?.length || 0} 
          label="Rekap Sales Order" 
          selectedCount={selectedIds.size} 
          onClearSelection={clearSelection} 
          loadTime={loadTime}
          page={page}
          totalPages={Math.ceil(totalCount / PAGE_SIZE)}
          onPageChange={setPage}
        />
      </div>

      <ConfirmDialog isOpen={dialog.isOpen} type={dialog.type as any} title={dialog.title} message={dialog.message} onConfirm={() => setDialog(d => ({ ...d, isOpen: false }))} />
    </div>
  );
}



