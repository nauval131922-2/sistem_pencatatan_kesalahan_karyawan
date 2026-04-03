'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, RefreshCw, Loader2, AlertCircle, Clock, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';

import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { splitDateRangeIntoMonths, formatLastUpdate } from '@/lib/date-utils';
import { formatScrapedPeriodDate, getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod } from '@/lib/scraper-period';
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

export default function PembelianBarangClient() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
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
      const saved = localStorage.getItem('rbp_columnWidths');
      return saved ? JSON.parse(saved) : {
        id: 100,
        tgl: 120,
        faktur: 220,
        kd_supplier: 250,
        kd_barang: 300,
        faktur_po: 200,
        jthtmp: 120,
        harga: 140,
        qty: 120,
        kd_cabang: 100,
        pers_diskon1: 100,
        diskon_item: 140,
        jumlah: 160,
        ppn: 140,
        username: 120,
        total_item: 160,
        hj: 140,
        gol_barang: 120,
        diskon: 140,
        margin: 120,
        recid: 100
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('rbp_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  const isLoadingMore = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
      clearSelection();
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, clearSelection]);

  useEffect(() => {
    setIsMounted(true);

    const hydratedPeriod = hydrateScraperPeriod({ stateKey: 'rbpState', periodKey: 'PembelianBarangClient_scrapedPeriod' });
    setScrapedPeriod(hydratedPeriod.scrapedPeriod);
    setStartDate(hydratedPeriod.startDate);
    setEndDate(hydratedPeriod.endDate);
  }, [isMounted]);

  // Fetch Data
  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(page === 1);
      const startTimer = Date.now();
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: PAGE_SIZE.toString(),
          search: debouncedQuery,
          from: formatDateToYYYYMMDD(startDate),
          to: formatDateToYYYYMMDD(endDate),
          _t: Date.now().toString()
        });

        const res = await fetch(`/api/rekap-pembelian-barang?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const json = await res.json();
        
        if (active) {
          setData(prev => {
            const processData = (items: any[]) => (items || []).map((item: any) => {
              let parsedRaw = {};
              if (item.raw_data) {
                try { parsedRaw = JSON.parse(item.raw_data); } catch(e){}
              }
              return { ...item, ...parsedRaw };
            });

            if (page === 1) return processData(json.data);
            const currentData = prev || [];
            const newData = processData(json.data);
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
        if (active) {
          setError(err.message || 'Gagal memuat data');
        }
      } finally {
        if (active) {
          setLoading(false);
          isLoadingMore.current = false;
        }
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate]);

  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');

  const handleFetch = async () => {
    if (!startDate || !endDate) return;

    localStorage.setItem('rbpState', JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sessionDate: new Date().toLocaleDateString('en-CA')
    }));

    setError('');
    setData([]);
    setPage(1);
    clearSelection();
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
        const res = await fetch(`/api/scrape-rekap-pembelian-barang?start=${chunk.start}&end=${chunk.end}`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
          totalScraped += (json.total || 0);
        }
      } catch (err) {
        console.error("Scrape error:", err);
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
        while (queue.length > 0) {
          const chunk = queue.shift();
          if (chunk) await processChunk(chunk);
        }
      });
      await Promise.all(workers);

      if (successCount > 0) {
        const periodStr = persistScraperPeriod({ stateKey: 'rbpState', periodKey: 'PembelianBarangClient_scrapedPeriod' }, startDate, endDate);
        setScrapedPeriod(periodStr);
        setRefreshKey(prev => prev + 1);
        localStorage.setItem('sintak_data_updated', Date.now().toString());

        await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'SCRAPE',
            table_name: 'rekap_pembelian_barang',
            message: `Tarik Rekap Pembelian Barang (${formatDateToYYYYMMDD(startDate)} s/d ${formatDateToYYYYMMDD(endDate)})`,
            raw_data: JSON.stringify({ totalScraped })
          })
        });

        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Berhasil menarik ${totalScraped} data Pembelian Barang.`
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && (data?.length || 0) < totalCount) {
      setPage(prev => prev + 1);
    }
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: columnWidths.id,
      cell: ({ getValue, row }) => (
        <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-400'}`}>
          {String(getValue() || '')}
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
      accessorKey: 'faktur',
      header: 'Faktur',
      size: columnWidths.faktur,
      cell: ({ getValue, row }) => (
        <span className={`font-medium transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`} dangerouslySetInnerHTML={{ __html: getValue() as string || '-' }} />
      )
    },
    {
      accessorKey: 'kd_supplier',
      header: 'Supplier',
      size: columnWidths.kd_supplier,
      cell: ({ getValue, row }) => (
        <span className={`font-medium ${row.getIsSelected() ? 'text-green-800' : 'text-gray-700'}`}>
          {getValue() as string}
        </span>
      )
    },
    {
      accessorKey: 'kd_barang',
      header: 'Barang',
      size: columnWidths.kd_barang,
      cell: ({ getValue, row }) => (
        <span className={`font-medium ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>
          {getValue() as string}
        </span>
      )
    },
    {
      accessorKey: 'faktur_po',
      header: 'Ref. PO',
      size: columnWidths.faktur_po,
      cell: ({ getValue, row }) => (
        <div className={`transition-colors truncate font-medium ${row.getIsSelected() ? 'text-green-600' : 'text-gray-500'}`} dangerouslySetInnerHTML={{ __html: getValue() as string || '-' }} />
      )
    },
    {
        accessorKey: 'jthtmp',
        header: 'Jth. Tempo',
        size: columnWidths.jthtmp,
        cell: ({ getValue, row }) => <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-rose-600' : 'text-gray-500'}`}>{String(getValue() || '')}</span>
    },
    {
      accessorKey: 'harga',
      header: 'Harga',
      size: columnWidths.harga,
      meta: { align: 'right' },
      cell: ({ getValue, row }) => (
        <div className={`flex items-center justify-end font-medium tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
          <span className="text-[10px] text-gray-400 mr-1">Rp</span>
          <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
        </div>
      )
    },
    {
      accessorKey: 'qty',
      header: 'Qty',
      size: columnWidths.qty,
      meta: { align: 'right' },
      cell: ({ getValue, row }) => (
        <div className="flex flex-col items-end leading-tight">
          <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-600'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
          <span className="text-[9px] text-gray-400 font-medium">@{Number(row.original.harga || 0).toLocaleString('id-ID')}</span>
        </div>
      )
    },
    {
      accessorKey: 'jumlah',
      header: 'Subtotal (Net)',
      size: columnWidths.jumlah,
      meta: { align: 'right' },
      cell: ({ getValue, row }) => (
        <div className={`flex flex-col items-end leading-tight tabular-nums ${row.getIsSelected() ? 'text-green-800' : 'text-gray-800'}`}>
          <div className="font-extrabold">
            <span className="text-[10px] text-gray-400 mr-1">Rp</span>
            <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
          </div>
          {Number(row.original.ppn || 0) !== 0 && (
            <span className="text-[9px] text-blue-500 font-bold">PPN: {Number(row.original.ppn).toLocaleString('id-ID')}</span>
          )}
        </div>
      )
    },
    {
        accessorKey: 'hj',
        header: 'Harga Jual',
        size: columnWidths.hj,
        meta: { align: 'right' },
        cell: ({ row }) => {
          const hj = Number(row.original.hj || 0);
          const margin = Number(row.original.margin || 0);
          return (
            <div className="flex flex-col items-end leading-tight tabular-nums">
               <span className="font-bold text-emerald-600">{hj.toLocaleString('id-ID')}</span>
               <span className={`text-[10px] font-black ${margin > 0 ? 'text-green-500' : 'text-rose-500'}`}>
                 {margin > 0 ? '+' : ''}{margin.toLocaleString('id-ID')}%
               </span>
            </div>
          );
        }
    },
    {
        accessorKey: 'total_item',
        header: 'Total HPP',
        size: columnWidths.total_item,
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <div className="flex items-center justify-end font-black text-gray-700 tabular-nums">
             <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
          </div>
        )
    },
    {
      accessorKey: 'username',
      header: 'Admin',
      size: columnWidths.username,
      cell: ({ getValue }) => <span className="text-[11px] font-bold text-gray-400">@{getValue() as string || '–'}</span>
    },
    {
      accessorKey: 'kd_cabang',
      header: 'Cab',
      size: 80,
      cell: ({ getValue }) => <span className="text-gray-400 text-center font-bold">{getValue() as string || '-'}</span>
    },
    {
        accessorKey: 'recid',
        header: 'RecId',
        size: columnWidths.recid,
        cell: ({ getValue }) => <span className="text-[11px] font-black text-gray-700/60 tabular-nums">{String(getValue() || '')}</span>
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
                {!isMounted ? (
                   <div className="w-[300px] h-10 bg-gray-50 animate-pulse rounded-lg" />
                ) : (
                  <>
                    <div className="w-[140px]">
                      <DatePicker value={startDate} onChange={setStartDate} name="startDate" />
                    </div>
                    <div className="w-4 h-[1px] bg-gray-200 mx-1"></div>
                    <div className="w-[140px]">
                      <DatePicker value={endDate} onChange={setEndDate} name="endDate" />
                    </div>
                  </>
                )}
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
              placeholder="Cari faktur, supplier, barang, user..."
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
            columnWidths={columnWidths}
            onColumnWidthChange={setColumnWidths}
            isLoading={loading || data === null}
            totalCount={totalCount}
            onScroll={handleScroll}
            selectedIds={selectedIds}
            onRowClick={handleRowClick}
          />

          <div className="flex items-center justify-between shrink-0 px-1 mt-1">
            <span className="text-[12px] leading-none font-bold text-gray-400">
              {totalCount === 0 ? 'Tidak ada data pembelian' : `Menampilkan ${data?.length || 0} dari ${totalCount} Pembelian`}
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
