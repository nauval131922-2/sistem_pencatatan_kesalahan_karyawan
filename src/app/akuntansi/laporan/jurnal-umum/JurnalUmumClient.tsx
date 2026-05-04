'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

import ConfirmDialog from '@/components/ConfirmDialog';
import { formatLastUpdate, splitDateRangeIntoMonths } from '@/lib/date-utils';
import { getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod } from '@/lib/scraper-period';
import { DataTable } from '@/components/ui/DataTable';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';
import DateRangeCard from '@/components/DateRangeCard';
import DatePicker from '@/components/DatePicker';
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

function formatRupiah(val: string | number) {
  const n = parseFloat(String(val || '0').replace(/,/g, ''));
  if (isNaN(n)) return '–';
  return n.toLocaleString('id-ID', { minimumFractionDigits: 2 });
}
// Kepala rekening laba rugi: 4, 5, 6, 7, 8, 9
function isLabaRugiRekening(rekening: string): boolean {
  const kode = rekening?.trim();
  if (!kode) return false;
  // First char of the account code
  return /^[456789]/.test(kode);
}

// Flatten parent rows + children into flat list for DataTable.
// Excel formula: laba_rugi[n] = IF(ISNUMBER(laba_rugi[n-1]), laba_rugi[n-1], 0) + debitLR[n] - kreditLR[n]
// Parent rows: debitLR=0, kreditLR=0  → laba_rugi stays the same as previous row.
// Child rows rekening 4-9: debitLR = child.kredit, kreditLR = child.debit → updates running total.
// Child rows lainnya: debitLR=0, kreditLR=0 → laba_rugi stays the same.
function flattenJurnal(rows: any[], prevLabaRugi = 0): { flat: any[]; lastLabaRugi: number } {
  const flat: any[] = [];
  let runningLR = prevLabaRugi;

  for (const row of rows) {
    const children: any[] = row.children || [];

    // Parent row: debitLR & kreditLR = 0, so laba_rugi = prev (no change)
    flat.push({
      ...row,
      children:  undefined,
      _isChild:  false,
      _debitLR:  null,   // shown as — in column
      _kreditLR: null,   // shown as — in column
      _labaRugi: runningLR,  // prev + 0 - 0
    });

    // Child rows
    children.forEach((child, ci) => {
      const isLR = isLabaRugiRekening(child.rekening);
      let rowDebitLR  = 0;
      let rowKreditLR = 0;
      if (isLR) {
        // Debit LR = kredit of this child; Kredit LR = debit of this child
        rowDebitLR  = parseFloat(String(child.kredit || '0').replace(/,/g, '')) || 0;
        rowKreditLR = parseFloat(String(child.debit  || '0').replace(/,/g, '')) || 0;
      }
      // Apply formula: prev + debitLR - kreditLR
      runningLR = runningLR + rowDebitLR - rowKreditLR;

      // _rowBg: green if this row contributes to Debit LR (kredit > 0), red if Kredit LR (debit > 0)
      let rowBg = '';
      if (isLR) {
        if (rowDebitLR > 0 && rowKreditLR === 0) rowBg = 'bg-emerald-50/60';   // pure debit LR → green
        else if (rowKreditLR > 0 && rowDebitLR === 0) rowBg = 'bg-rose-50/60'; // pure kredit LR → red
        else rowBg = 'bg-amber-50/40'; // both (rare, mixed)
      }

      flat.push({
        ...child,
        id:            `c_${row.id}_${ci}_${child.rekening}`, // more unique ID
        _isChild:      true,
        _parentFaktur: row.faktur,
        tgl:           row.tgl,          // inherit from parent
        faktur:        '',
        username:      row.username,     // inherit from parent
        create_at:     row.create_at,   // inherit from parent
        _debitLR:      isLR ? rowDebitLR  : null,
        _kreditLR:     isLR ? rowKreditLR : null,
        _labaRugi:     runningLR,
        _rowBg:        rowBg,
      });
    });
  }

  return { flat, lastLabaRugi: runningLR };
}

const PAGE_SIZE = 50;

export default function JurnalUmumClient() {
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{ start: string; end: string } | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  // Filter create_at (server-side)
  const [createAtFrom, setCreateAtFrom] = useState<Date | null>(null);
  const [createAtTo, setCreateAtTo]     = useState<Date | null>(null);

  const isLoadingMore = useRef(false);
  const mountedRef = useRef(true);

  const { selectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jurnalUmum_columnWidths');
      return saved ? JSON.parse(saved) : {
        tgl: 130, faktur: 200, rekening: 220, keterangan: 300,
        debit: 155, kredit: 155, username: 110,
        create_at: 150, _debitLR: 155, _kreditLR: 155, _labaRugi: 160
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('jurnalUmum_columnWidths', JSON.stringify(columnWidths));
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
    const hydrated = hydrateScraperPeriod({ stateKey: 'jurnalUmumState', periodKey: 'JurnalUmumClient_scrapedPeriod' });
    setScrapedPeriod(hydrated.scrapedPeriod);
    setStartDate(hydrated.startDate);
    setEndDate(hydrated.endDate);
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
          from: formatDateToYYYYMMDD(startDate), to: formatDateToYYYYMMDD(endDate),
          ...(createAtFrom && createAtTo ? {
            cat_from: formatDateToYYYYMMDD(createAtFrom),
            cat_to:   formatDateToYYYYMMDD(createAtTo),
          } : {}),
          _t: Date.now().toString()
        });
        const res = await fetch(`/api/jurnal-umum?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const json = await res.json();
        if (active) {
          const saldoAwal: number = json.saldoAwal ?? 0;
          const hasCatFilter = !!(createAtFrom && createAtTo);

          setData(prev => {
            const currentData = prev || [];
            // Use the very last row's _labaRugi (child or parent) — NOT last parent.
            // Parent rows store LR *before* their children update it, so using last parent
            // would lose the children's contributions at page boundaries.
            const lastRow = currentData.length > 0 ? currentData[currentData.length - 1] : null;
            const prevLR = lastRow?._labaRugi ?? saldoAwal;

            const { flat: incoming } = page === 1
              ? flattenJurnal(json.data || [], hasCatFilter ? saldoAwal : 0)
              : flattenJurnal(json.data || [], prevLR);

            if (page === 1) {
              // Prepend Saldo Awal row when create_at filter is active
              if (hasCatFilter) {
                const saldoRow = {
                  id: '__saldo_awal__',
                  _isSaldoAwal: true,
                  _isChild: false,
                  faktur: '',
                  tgl: '',
                  rekening: '',
                  keterangan: 'Saldo Awal',
                  debit: 0, kredit: 0,
                  username: '', create_at: '',
                  _debitLR: null, _kreditLR: null,
                  _labaRugi: saldoAwal,
                  _rowBg: '',
                };
                return [saldoRow, ...incoming];
              }
              return incoming;
            }
            // dedup by synthetic id
            const existingIds = new Set(currentData.map((d: any) => String(d.id)));
            return [...currentData, ...incoming.filter((d: any) => !existingIds.has(String(d.id)))];
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
  }, [page, debouncedQuery, refreshKey, startDate, endDate, createAtFrom, createAtTo, isMounted]);

  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');
  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as any, title: '', message: '' });

  const handleFetch = async () => {
    if (!startDate || !endDate) return;
    localStorage.setItem('jurnalUmumState', JSON.stringify({
      startDate: startDate.toISOString(), endDate: endDate.toISOString(), sessionDate: new Date().toLocaleDateString('en-CA')
    }));
    setError(''); setData([]); setPage(1); setIsBatching(true); setLoading(true); setSearchQuery(''); setBatchProgress(0);
    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    let successCount = 0; let totalScraped = 0; let completedChunks = 0;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-jurnal-umum?start=${chunk.start}&end=${chunk.end}&metaStart=${startStr}&metaEnd=${endStr}`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
          totalScraped += (json.total || 0);
        } else {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Error ${res.status}`);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        completedChunks++;
        setBatchProgress(Math.round((completedChunks / chunks.length) * 100));
        setBatchStatus(`Memproses ${completedChunks}/${chunks.length} bulan...`);
      }
    };

    try {
      const concurrency = 2;
      const queue = [...chunks];
      const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
        while (queue.length > 0) { const chunk = queue.shift(); if (chunk) await processChunk(chunk); }
      });
      await Promise.all(workers);
      if (successCount > 0) {
        persistScraperPeriod({ stateKey: 'jurnalUmumState', periodKey: 'JurnalUmumClient_scrapedPeriod' }, startDate, endDate);
        setRefreshKey(prev => prev + 1);
        setDialog({ isOpen: true, type: 'success', title: 'Berhasil', message: `Berhasil menarik ${totalScraped} transaksi Jurnal Umum.` });
      }
    } finally { setIsBatching(false); setLoading(false); }
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
      accessorKey: 'tgl',
      header: 'Tanggal',
      size: 130,
      meta: { sticky: true },
      cell: ({ getValue, row }: any) => {
        const isChild = row.original._isChild;
        const val = formatIndoDateStr(getValue() as string);
        if (isChild) return <span className="text-gray-400 tabular-nums">{val}</span>;
        return (
          <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-blue-700' : 'text-gray-700'}`}>
            {val}
          </span>
        );
      }
    },
    {
      accessorKey: 'faktur',
      header: 'No. Faktur',
      size: 200,
      meta: { sticky: true },
      cell: ({ getValue, row }: any) => {
        const isChild = row.original._isChild;
        if (isChild) return <span className="text-gray-400">{row.original._parentFaktur}</span>;
        return (
          <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-blue-600' : 'text-gray-700'}`}>
            {String(getValue())}
          </span>
        );
      }
    },
    {
      accessorKey: 'rekening',
      header: 'Rekening',
      size: 220,
      meta: { sticky: true },
      cell: ({ getValue, row }: any) => {
        const isChild = row.original._isChild;
        const raw = String(getValue() || '');
        let display = raw || '–';
        
        // Format YYYY-MM-DD to DD MMM YYYY
        if (raw.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [y, m, d] = raw.split('-');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          display = `${d} ${months[parseInt(m)-1]} ${y}`;
        }

        return (
          <span className={`font-medium ${
            isChild
              ? (row.getIsSelected() ? 'text-indigo-500' : 'text-indigo-600 font-semibold')
              : (row.getIsSelected() ? 'text-blue-700' : 'text-gray-700')
          }`}>
            {isChild && <span className="mr-1.5 text-indigo-300">↳</span>}
            {display}
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
        const isChild = row.original._isChild;
        const isSaldoAwal = row.original._isSaldoAwal;
        if (isSaldoAwal) return (
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[11px] font-bold tracking-wide border border-amber-200">
              Saldo Awal
            </span>
          </span>
        );
        return (
          <span className={`truncate block ${
            isChild
              ? (row.getIsSelected() ? 'text-gray-500' : 'text-gray-400')
              : (row.getIsSelected() ? 'text-blue-800 font-medium' : 'text-gray-700 font-medium')
          }`}>
            {String(getValue() || '–')}
          </span>
        );
      }
    },
    {
      accessorKey: 'debit',
      header: 'Debit (Rp)',
      size: 160,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => {
        const isChild = row.original._isChild;
        const val = Number(getValue() || 0);
        if (isChild && val === 0) return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        return (
          <div className={`flex items-center justify-between tabular-nums w-full ${
            isChild
              ? (row.getIsSelected() ? 'text-green-600 font-semibold' : 'text-emerald-600 font-semibold')
              : (row.getIsSelected() ? 'text-green-700 font-bold' : 'text-emerald-700 font-bold')
          }`}>
            <span className="opacity-40 mr-1">Rp</span>
            <span>{formatRupiah(val)}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'kredit',
      header: 'Kredit (Rp)',
      size: 160,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => {
        const isChild = row.original._isChild;
        const val = Number(getValue() || 0);
        if (isChild && val === 0) return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        return (
          <div className={`flex items-center justify-between tabular-nums w-full ${
            isChild
              ? (row.getIsSelected() ? 'text-rose-500 font-semibold' : 'text-rose-500 font-semibold')
              : (row.getIsSelected() ? 'text-green-700 font-bold' : 'text-rose-600 font-bold')
          }`}>
            <span className="opacity-40 mr-1">Rp</span>
            <span>{formatRupiah(val)}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'username',
      header: 'User',
      size: 120,
      cell: ({ getValue, row }: any) => {
        const isChild = row.original._isChild;
        const val = String(getValue() || '');
        if (!val || val === 'undefined') return <span className="text-gray-200">—</span>;
        if (isChild) return <span className="text-gray-400 font-medium">@{val}</span>;
        return <span className="font-bold text-gray-400">@{val}</span>;
      }
    },
    {
      accessorKey: 'create_at',
      header: 'Dibuat',
      size: 150,
      cell: ({ getValue, row }: any) => {
        const isChild = row.original._isChild;
        const val = String(getValue() || '');
        if (!val) return <span className="text-gray-200">—</span>;
        if (isChild) return <span className="text-gray-400 tabular-nums">{val}</span>;
        return <span className="text-gray-500 tabular-nums">{val}</span>;
      }
    },
    {
      accessorKey: '_debitLR',
      header: 'Debit (Laba Rugi)',
      size: 155,
      meta: { align: 'right', headerBg: '#f0fdf4' },
      cell: ({ getValue, row }: any) => {
        const isChild = row.original._isChild;
        // Parent rows: no value here, only child rekening 4-9 rows show this
        if (!isChild) return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        const val = getValue();
        if (val === null || val === undefined) {
          // Non-LR child
          return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        }
        const n = Number(val);
        if (n === 0) return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        return (
          <div className={`flex items-center justify-between tabular-nums w-full font-semibold ${
            row.getIsSelected() ? 'text-green-600' : 'text-emerald-600'
          }`}>
            <span className="opacity-40 mr-1">Rp</span>
            <span>{formatRupiah(n)}</span>
          </div>
        );
      }
    },
    {
      accessorKey: '_kreditLR',
      header: 'Kredit (Laba Rugi)',
      size: 155,
      meta: { align: 'right', headerBg: '#fff1f2' },
      cell: ({ getValue, row }: any) => {
        const isChild = row.original._isChild;
        // Parent rows: no value here
        if (!isChild) return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        const val = getValue();
        if (val === null || val === undefined) {
          return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        }
        const n = Number(val);
        if (n === 0) return <span className="text-gray-200 tabular-nums text-right w-full block">—</span>;
        return (
          <div className={`flex items-center justify-between tabular-nums w-full font-semibold ${
            row.getIsSelected() ? 'text-rose-500' : 'text-rose-500'
          }`}>
            <span className="opacity-40 mr-1">Rp</span>
            <span>{formatRupiah(n)}</span>
          </div>
        );
      }
    },
    {
      accessorKey: '_labaRugi',
      header: 'Laba / Rugi',
      size: 160,
      meta: { align: 'right', headerBg: '#fffbeb' },
      cell: ({ getValue, row }: any) => {
        const val = Number(getValue() ?? 0);
        const isChild = row.original._isChild;
        const isPositive = val >= 0;
        return (
          <div className={`flex items-center justify-between tabular-nums w-full ${
            row.getIsSelected()
              ? 'text-green-700 font-bold'
              : isChild
                ? (isPositive ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold')
                : (isPositive ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold')
          }`}>
            <span className="opacity-40 mr-1">Rp</span>
            <span>{formatRupiah(Math.abs(val))}<span className="ml-0.5 opacity-60">{isPositive ? '(L)' : '(R)'}</span></span>
          </div>
        );
      }
    },
  ], []);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      {/* Top row: scrape date range + create_at filter side by side */}
      <div className="flex gap-4 items-stretch shrink-0">
        <div className="flex-1 min-w-0">
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
        </div>
        {/* Filter Tanggal Dibuat — same style as DateRangeCard */}
        <div className="bg-white rounded-2xl border border-gray-100 py-3.5 px-6 shadow-sm shadow-green-900/5 flex flex-col gap-4 shrink-0 relative z-50 flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2 pl-1">
                <span className="text-[13px] font-semibold text-gray-500">Filter Tanggal Dibuat</span>
                {(createAtFrom || createAtTo) && (
                  <button
                    onClick={() => { setCreateAtFrom(null); setCreateAtTo(null); setPage(1); }}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-500 transition-colors ml-1"
                  >
                    &times; Reset
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-[150px] relative group">
                  <DatePicker
                    name="createAtFrom"
                    value={createAtFrom}
                    onChange={(d) => { setCreateAtFrom(d); setPage(1); }}
                  />
                </div>
                <div className="w-4 h-0.5 bg-gray-100 rounded-full" />
                <div className="w-[150px] relative group">
                  <DatePicker
                    name="createAtTo"
                    value={createAtTo}
                    onChange={(d) => { setCreateAtTo(d); setPage(1); }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm shadow-red-900/5 text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0 uppercase tracking-widest">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <ScrapingHeader title="Hasil Scrapping Jurnal Umum" lastUpdated={lastUpdated} scrapedPeriod={scrapedPeriod} />
            {loading && data && data.length > 0 && (
              <div className="text-[10px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm animate-pulse uppercase tracking-widest leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses Data...</span>
              </div>
            )}
          </div>
          <SearchAndReload
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onReload={() => setRefreshKey(prev => prev + 1)}
            loading={loading}
            placeholder="Cari faktur, rekening, atau keterangan..."
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
            getRowClassName={(row: any) => row._isSaldoAwal ? 'bg-amber-50 border-b-2 border-amber-200' : (row._rowBg || '')}
          />
          <TableFooter
            totalCount={totalCount}
            currentCount={data?.length || 0}
            label="Jurnal Umum"
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
