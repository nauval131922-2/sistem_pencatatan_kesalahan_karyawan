'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, Search, AlertCircle, Clock, RefreshCw,
  ChevronLeft, ChevronRight, SlidersHorizontal, X
} from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import SearchAndReload from '@/components/SearchAndReload';
import ConfirmDialog from '@/components/ConfirmDialog';
import { splitDateRangeIntoMonths } from '@/lib/date-utils';
import { DataTable } from '@/components/ui/DataTable';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import { formatLastUpdate } from '@/lib/date-utils';
import {
  formatScrapedPeriodDate,
  getDefaultScraperDateRange,
  hydrateScraperPeriod,
  persistScraperPeriod,
} from '@/lib/scraper-period';

function formatDateToYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatRupiah(value: any) {
  const num = Number(value || 0);
  return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PAGE_SIZE = 50;
const STATE_KEY = 'rekapSalesOrderState';
const PERIOD_KEY = 'RekapSalesOrderClient_scrapedPeriod';
const COL_WIDTHS_KEY = 'rekapSalesOrder_columnWidths';

const DEFAULT_COL_WIDTHS = {
  id:         80,
  faktur_sph: 200,
  faktur:     200,
  kd_barang:  340,
  faktur_prd: 200,
  nama_prd:   340,
  harga:      150,
};

export default function RekapSalesOrderClient() {
  const router        = useRouter();
  const mountedRef    = useRef(true);
  const [isMounted, setIsMounted] = useState(false);

  // ─── Date state ──────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate,   setEndDate]   = useState<Date>(() => getDefaultScraperDateRange().endDate);

  // ─── Data state ───────────────────────────────────────────────────────────
  const [loading,       setLoading]       = useState(false);
  const [data,          setData]          = useState<any[] | null>(null);
  const [error,         setError]         = useState('');
  const [lastUpdated,   setLastUpdated]   = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{ start: string; end: string } | null>(null);
  const [loadTime,      setLoadTime]      = useState<number | null>(null);
  const [refreshKey,    setRefreshKey]    = useState(0);

  // ─── Pagination ───────────────────────────────────────────────────────────
  const [page,       setPage]       = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ─── Search ───────────────────────────────────────────────────────────────
  const [searchQuery,    setSearchQuery]    = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // ─── Harga Filter ─────────────────────────────────────────────────────────
  const [showHargaFilter, setShowHargaFilter] = useState(false);
  const [minHarga, setMinHarga] = useState('');
  const [maxHarga, setMaxHarga] = useState('');
  const [appliedMin, setAppliedMin] = useState('');
  const [appliedMax, setAppliedMax] = useState('');
  const hargaFilterActive = appliedMin !== '' || appliedMax !== '';
  const hargaFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hargaFilterRef.current && !hargaFilterRef.current.contains(event.target as Node)) {
        setShowHargaFilter(false);
      }
    };
    if (showHargaFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHargaFilter]);

  // ─── Table state ──────────────────────────────────────────────────────────
  const { selectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(COL_WIDTHS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_COL_WIDTHS;
    }
    return DEFAULT_COL_WIDTHS;
  });

  // ─── Scrape batch ─────────────────────────────────────────────────────────
  const [isBatching,     setIsBatching]     = useState(false);
  const [batchProgress,  setBatchProgress]  = useState(0);
  const [batchStatus,    setBatchStatus]    = useState('');
  const [dialog, setDialog] = useState<{
    isOpen: boolean; type: 'success' | 'alert'; title: string; message: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  // ─── Persist column widths ────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(COL_WIDTHS_KEY, JSON.stringify(columnWidths));
  }, [columnWidths]);

  // ─── Debounce search → reset page ─────────────────────────────────────────
  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
      clearSelection();
    }, 400);
    return () => clearTimeout(h);
  }, [searchQuery, clearSelection]);

  // ─── Cross-tab sync ───────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        setRefreshKey(prev => prev + 1);
        router.refresh();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      mountedRef.current = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, [router]);

  // ─── Hydrate scraped period from localStorage ─────────────────────────────
  useEffect(() => {
    setIsMounted(true);
    const hydrated = hydrateScraperPeriod({ stateKey: STATE_KEY, periodKey: PERIOD_KEY });
    setScrapedPeriod(hydrated.scrapedPeriod);
    setStartDate(hydrated.startDate);
    setEndDate(hydrated.endDate);
  }, []);

  // ─── Fetch data ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMounted) return;
    let active = true;
    async function load() {
      if (mountedRef.current) setLoading(true);
      const t0 = performance.now();
      try {
        const qs = new URLSearchParams({
          page:    String(page),
          limit:   String(PAGE_SIZE),
          search:  debouncedQuery,
          from:    formatDateToYYYYMMDD(startDate),
          to:      formatDateToYYYYMMDD(endDate),
          _t:      String(Date.now()),
        });
        if (appliedMin !== '') qs.set('minHarga', appliedMin);
        if (appliedMax !== '') qs.set('maxHarga', appliedMax);

        const res  = await fetch(`/api/rekap-sales-order?${qs}`);
        if (!active) return;
        if (!res.ok) throw new Error('Gagal memuat data');

        const json = await res.json();
        if (json.success && mountedRef.current) {
          setData(json.data || []);
          setTotalCount(json.total  || 0);
          setTotalPages(json.totalPages || 1);
          setLoadTime(Math.round(performance.now() - t0));
          if (json.scrapedPeriod) setScrapedPeriod(json.scrapedPeriod);
          if (json.lastUpdated) {
            const d = new Date(json.lastUpdated);
            if (!isNaN(d.getTime())) setLastUpdated(formatLastUpdate(d));
          }
          setError('');
        }
      } catch (err: any) {
        if (mountedRef.current) setError(err.message || 'Gagal memuat data');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate, isMounted, appliedMin, appliedMax]);

  // ─── Apply harga filter ───────────────────────────────────────────────────
  const applyHargaFilter = useCallback(() => {
    setAppliedMin(minHarga);
    setAppliedMax(maxHarga);
    setPage(1);
    setShowHargaFilter(false);
  }, [minHarga, maxHarga]);

  const clearHargaFilter = useCallback(() => {
    setMinHarga('');
    setMaxHarga('');
    setAppliedMin('');
    setAppliedMax('');
    setPage(1);
  }, []);

  // ─── Scrape from Digit ────────────────────────────────────────────────────
  const handleFetchDigit = useCallback(async () => {
    if (!startDate || !endDate) return;
    localStorage.setItem(STATE_KEY, JSON.stringify({
      startDate:   startDate.toISOString(),
      endDate:     endDate.toISOString(),
      sessionDate: new Date().toLocaleDateString('en-CA'),
    }));

    setError(''); setData([]); setPage(1); setSearchQuery('');
    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    setIsBatching(true); setBatchProgress(0);

    let successCount = 0;
    let totalScraped = 0;
    let completed    = 0;

    const concurrency = 15;
    const queue = [...chunks];
    const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
      while (queue.length > 0) {
        const chunk = queue.shift();
        if (!chunk) break;
        try {
          const res = await fetch(`/api/scrape-sales-orders?start=${chunk.start}&end=${chunk.end}&metaStart=${startStr}&metaEnd=${endStr}`);
          if (res.ok) {
            successCount++;
            const j = await res.json();
            totalScraped += (j.total || 0);
          }
        } catch (err) {
          console.error('Chunk Error:', err);
        } finally {
          completed++;
          setBatchProgress(Math.round((completed / chunks.length) * 100));
          setBatchStatus(`Memproses ${completed}/${chunks.length} bulan...`);
        }
      }
    });

    try {
      await Promise.all(workers);
      if (successCount > 0) {
        const periodStr = persistScraperPeriod(
          { stateKey: STATE_KEY, periodKey: PERIOD_KEY }, startDate, endDate
        );
        setScrapedPeriod(periodStr);
        setDialog({
          isOpen: true,
          type:   (chunks.length - successCount) > 0 ? 'alert' : 'success',
          title:  (chunks.length - successCount) > 0 ? 'Selesai Sebagian' : 'Berhasil',
          message: `Berhasil menarik ${totalScraped} baris Rekap Sales Order dari Digit.`,
        });
        localStorage.setItem('sintak_data_updated', Date.now().toString());
        setRefreshKey(prev => prev + 1);
        setLastUpdated(formatLastUpdate(new Date()));
      } else {
        setError('Gagal menarik data. Cek koneksi.');
      }
    } finally {
      if (mountedRef.current) {
        setIsBatching(false); setBatchStatus(''); setBatchProgress(0);
      }
    }
  }, [startDate, endDate]);

  // ─── Columns ──────────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      accessorKey: 'faktur_sph',
      header: 'Faktur SPH',
      size: columnWidths.faktur_sph,
      cell: ({ getValue, row }: any) => (
        <span className={`font-mono text-[12px] font-bold ${row.getIsSelected() ? 'text-green-700' : 'text-indigo-600'}`}>
          {getValue() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'faktur',
      header: 'Faktur SO',
      size: columnWidths.faktur,
      cell: ({ getValue, row }: any) => (
        <span className={`font-mono text-[12px] font-bold ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
          {getValue() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'kd_barang',
      header: 'Kode Barang',
      size: columnWidths.kd_barang,
      cell: ({ getValue, row }: any) => (
        <span
          className={`text-[12px] font-semibold truncate block ${row.getIsSelected() ? 'text-green-800' : 'text-gray-700'}`}
          title={getValue() as string}
        >
          {getValue() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'faktur_prd',
      header: 'Faktur PRD',
      size: columnWidths.faktur_prd,
      cell: ({ getValue, row }: any) => (
        <span className={`font-mono text-[12px] font-medium ${row.getIsSelected() ? 'text-green-600' : 'text-gray-500'}`}>
          {getValue() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'nama_prd',
      header: 'Nama Produk',
      size: columnWidths.nama_prd,
      cell: ({ getValue, row }: any) => (
        <span
          className={`text-[12px] font-semibold truncate block ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}
          title={getValue() as string}
        >
          {getValue() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'harga',
      header: 'Harga',
      size: columnWidths.harga,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => (
        <div className={`flex items-center justify-end gap-1 tabular-nums font-bold ${row.getIsSelected() ? 'text-green-700' : 'text-gray-800'}`}>
          <span className="text-[10px] text-gray-400 font-medium">Rp</span>
          <span>{formatRupiah(getValue())}</span>
        </div>
      ),
    },
  ], [columnWidths]);

  if (!isMounted) return null;

  // ─── Pagination helpers ───────────────────────────────────────────────────
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const pageStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd   = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-[8px] border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-300 flex flex-col gap-5 shrink-0 relative z-50">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">

          {/* Date Picker */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Rentang Tanggal</span>
              <div className="flex items-center gap-2">
                <div className="w-[140px] relative group"><DatePicker name="startDate" value={startDate} onChange={setStartDate} /></div>
                <div className="w-4 h-[1px] bg-gray-200 mx-1" />
                <div className="w-[140px] relative group"><DatePicker name="endDate"   value={endDate}   onChange={setEndDate} /></div>
              </div>
            </div>

            {/* Harga Filter Toggle */}
            <div className="flex flex-col gap-1.5 relative" ref={hargaFilterRef}>
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Filter Harga</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHargaFilter(v => !v)}
                  className={`flex items-center gap-2 px-4 h-[34px] rounded-[8px] text-[12px] font-bold border transition-all ${
                    hargaFilterActive
                      ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600'
                  }`}
                >
                  <SlidersHorizontal size={15} />
                  <span>{hargaFilterActive ? `Rp ${appliedMin || '0'} – ${appliedMax || '∞'}` : 'Atur Rentang'}</span>
                </button>
                {hargaFilterActive && (
                  <button
                    onClick={clearHargaFilter}
                    className="flex items-center gap-1 px-3 h-[34px] rounded-[8px] text-[11px] font-bold bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-100 transition-all"
                    title="Hapus filter harga"
                  >
                    <X size={13} />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              {/* Harga Filter Dropdown */}
              {showHargaFilter && (
                <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-gray-200 rounded-[10px] shadow-xl p-4 w-[300px] animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">Rentang Harga (Rp)</p>
                  <div className="flex flex-col gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Minimal</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={minHarga}
                        onChange={e => setMinHarga(e.target.value)}
                        className="w-full h-9 px-3 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Maksimal</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Tidak terbatas"
                        value={maxHarga}
                        onChange={e => setMaxHarga(e.target.value)}
                        className="w-full h-9 px-3 border border-gray-200 rounded-[8px] text-[13px] font-semibold focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                      />
                    </div>
                    <button
                      onClick={applyHargaFilter}
                      className="w-full h-9 mt-1 bg-green-600 hover:bg-green-700 text-white text-[12px] font-extrabold rounded-[8px] transition-all active:scale-[0.98]"
                    >
                      Terapkan Filter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tarik Data Button */}
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
              onClick={handleFetchDigit}
              disabled={loading || isBatching || !startDate || !endDate}
              className="px-5 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-extrabold rounded-[8px] transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isBatching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} className={loading && (data?.length || 0) === 0 ? "animate-spin" : ""} />}
              <span>{isBatching ? `${batchProgress}%` : 'Tarik Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-[8px] text-sm flex items-start gap-2 animate-in fade-in shrink-0">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* ── Results View ── */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0">

          {/* Header row */}
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-4">
              <h3 className="text-[14px] font-extrabold text-gray-800 flex items-center gap-2.5 leading-none">
                <Clock size={18} className="text-green-600" />
                <span>Hasil Rekap Sales Order</span>
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-[12px] font-medium leading-none" style={{ color: '#99a1af' }}>
                  <span className="opacity-40">|</span>
                  <span>
                    Diperbarui: {lastUpdated}
                    {scrapedPeriod
                      ? ` (Periode: ${formatScrapedPeriodDate(scrapedPeriod.start)} s.d. ${formatScrapedPeriodDate(scrapedPeriod.end)})`
                      : ''}
                  </span>
                </div>
              )}
            </div>
            {loading && (data?.length || 0) > 0 && (
              <div className="text-[11px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 animate-pulse uppercase tracking-tighter leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memuat...</span>
              </div>
            )}
          </div>

          <SearchAndReload 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onReload={() => setRefreshKey(k => k + 1)}
            loading={loading}
            placeholder="Cari faktur SPH, faktur SO, kode barang, faktur PRD, nama produk..."
          />
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
          <DataTable
            columns={columns}
            data={data || []}
            isLoading={loading || data === null}
            totalCount={totalCount}
            selectedIds={selectedIds}
            onRowClick={handleRowClick}
            columnWidths={columnWidths}
            onColumnWidthChange={setColumnWidths}
          />

          {/* ── Footer: count + pagination ── */}
          <div className="flex items-center justify-between shrink-0 px-1 mt-1">

            {/* Left: count info */}
            <div className="flex items-center gap-4">
              <span className="text-[12px] leading-none font-bold text-gray-400">
                {totalCount === 0
                  ? 'Tidak ada data'
                  : `${pageStart}–${pageEnd} dari ${totalCount.toLocaleString('id-ID')} Rekap Sales Order`}
              </span>
              {loadTime !== null && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm border ${
                  loadTime < 300  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-red-50 text-red-600 border-red-100'
                }`}>
                  <span className="animate-pulse">⚡</span>
                  <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
                </span>
              )}
            </div>

            {/* Right: pagination controls */}
            <div className="flex items-center gap-1.5">
              {/* First page */}
              <button
                disabled={!canPrev || loading}
                onClick={() => setPage(1)}
                className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[11px] font-extrabold border border-gray-100 bg-white text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman pertama"
              >
                «
              </button>
              {/* Prev */}
              <button
                disabled={!canPrev || loading}
                onClick={() => setPage(p => p - 1)}
                className="w-8 h-8 rounded-[6px] flex items-center justify-center border border-gray-100 bg-white text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman sebelumnya"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Page pills */}
              {(() => {
                const pills: number[] = [];
                const delta = 2;
                for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
                  pills.push(i);
                }
                return pills.map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-[6px] flex items-center justify-center text-[12px] font-extrabold border transition-all ${
                      p === page
                        ? 'bg-green-600 text-white border-green-600 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-100 hover:bg-green-50 hover:text-green-600 hover:border-green-300'
                    } disabled:cursor-not-allowed`}
                  >
                    {p}
                  </button>
                ));
              })()}

              {/* Next */}
              <button
                disabled={!canNext || loading}
                onClick={() => setPage(p => p + 1)}
                className="w-8 h-8 rounded-[6px] flex items-center justify-center border border-gray-100 bg-white text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman berikutnya"
              >
                <ChevronRight size={15} />
              </button>
              {/* Last page */}
              <button
                disabled={!canNext || loading}
                onClick={() => setPage(totalPages)}
                className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[11px] font-extrabold border border-gray-100 bg-white text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman terakhir"
              >
                »
              </button>

              {/* Page indicator */}
              <span className="ml-2 text-[11px] font-bold text-gray-400 leading-none">
                Hal. {page} / {totalPages}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog(d => ({ ...d, isOpen: false }))}
      />
    </div>
  );
}
