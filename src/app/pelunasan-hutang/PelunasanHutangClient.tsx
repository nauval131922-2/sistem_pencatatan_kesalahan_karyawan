'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, RefreshCw, Loader2, AlertCircle, Clock, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';

import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatLastUpdate } from '@/lib/date-utils';
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

export default function PelunasanHutangClient() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(2025, 0, 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{start: string, end: string} | null>(null);


  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { selectedIds, setSelectedIds, handleRowClick, clearSelection } = useTableSelection(data);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ph_columnWidths');
      return saved ? JSON.parse(saved) : {
        id: 100,
        tgl: 120,
        faktur: 220,
        kd_supplier: 250,
        pembelian: 160,
        retur: 140,
        subtotal: 160,
        diskon: 140,
        total: 180,
        kas: 160,
        bank: 160,
        faktur_pb: 220,
        keterangan: 300,
        username: 120,
        recid: 100
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('ph_columnWidths', JSON.stringify(columnWidths));
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
    mountedRef.current = true;
    setIsMounted(true);
    
    const todayStr = new Date().toLocaleDateString('en-CA');
    const defaultStartDate = new Date(2025, 0, 1);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let initialStart = defaultStartDate;
    let initialEnd = today;

    const savedPeriod = localStorage.getItem('PelunasanHutangClient_scrapedPeriod');
    if (savedPeriod) {
      try {
        const parsed = JSON.parse(savedPeriod);
        setScrapedPeriod(parsed); if (parsed.startRaw) initialStart = new Date(parsed.startRaw);
        if (parsed.endRaw) initialEnd = new Date(parsed.endRaw);
      } catch(e) {}
    }

    const saved = localStorage.getItem('phState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedDate = parsed.sessionDate || '';
        if (savedDate === todayStr) {
          initialStart = new Date(parsed.startDate);
          initialEnd = new Date(parsed.endDate);
        }
      } catch(e) {}
    }
    setStartDate(initialStart);
    setEndDate(initialEnd);

    return () => {
      mountedRef.current = false;
    };
  }, []);

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

        const res = await fetch(`/api/pelunasan-hutang?${queryParams.toString()}`);
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

    localStorage.setItem('phState', JSON.stringify({
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
        const res = await fetch(`/api/scrape-pelunasan-hutang?start=${chunk.start}&end=${chunk.end}`);
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
        const periodStr = { 
          start: startDate?.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) || '', 
          end: endDate?.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) || '',
          startRaw: startDate?.toISOString() || '',
          endRaw: endDate?.toISOString() || ''
        };
        setScrapedPeriod(periodStr);
        localStorage.setItem('PelunasanHutangClient_scrapedPeriod', JSON.stringify(periodStr));
        setRefreshKey(prev => prev + 1);
        localStorage.setItem('sintak_data_updated', Date.now().toString());

        await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'SCRAPE',
            table_name: 'pelunasan_hutang',
            message: `Tarik Pelunasan Hutang (${formatDateToYYYYMMDD(startDate)} s/d ${formatDateToYYYYMMDD(endDate)})`,
            raw_data: JSON.stringify({ totalScraped })
          })
        });

        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Berhasil menarik ${totalScraped} data Pelunasan Hutang.`
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
    if (scrollHeight - scrollTop <= clientHeight + 150 && !loading && !isLoadingMore.current) {
      if (data && data.length < totalCount) {
        isLoadingMore.current = true;
        setPage(prev => prev + 1);
      }
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
      header: 'Faktur PH',
      size: columnWidths.faktur,
      cell: ({ getValue, row }) => (
        <div className="flex flex-col leading-tight">
          <div className={`font-bold transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`} dangerouslySetInnerHTML={{ __html: getValue() as string || '-' }} />
          {row.original.kd_cabang && (
             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Cabang: {row.original.kd_cabang}</span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'kd_supplier',
      header: 'Supplier',
      size: columnWidths.kd_supplier,
      cell: ({ getValue, row }) => (
        <span className={`font-black uppercase tracking-tight text-[12px] ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>
          {getValue() as string}
        </span>
      )
    },
    {
      accessorKey: 'pembelian',
      header: 'Beban Pembelian',
      size: columnWidths.pembelian,
      meta: { align: 'right' },
      cell: ({ getValue, row }) => (
        <div className={`flex flex-col items-end leading-tight font-medium tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
          <div className="flex items-center">
            <span className="text-[10px] text-gray-400 mr-1">Rp</span>
            <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
          </div>
          {Number(row.original.retur || 0) !== 0 && (
            <span className="text-[10px] text-rose-500 font-bold">Retur: {Number(row.original.retur).toLocaleString('id-ID')}</span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'total',
      header: 'Penyelesaian',
      size: columnWidths.total,
      meta: { align: 'right' },
      cell: ({ getValue, row }) => (
        <div className={`flex flex-col items-end leading-tight font-black tabular-nums ${row.getIsSelected() ? 'text-green-800' : 'text-gray-800'}`}>
          <div className="flex items-center">
            <span className="text-[10px] text-gray-400 mr-1">Rp</span>
            <span>{Number(getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
          </div>
          {(Number(row.original.diskon || 0) !== 0 || Number(row.original.pembulatan || 0) !== 0) && (
            <span className="text-[9px] text-amber-600">Disc/Bulat: {Number(Number(row.original.diskon || 0) + Number(row.original.pembulatan || 0)).toLocaleString('id-ID')}</span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'kas',
      header: 'Metode Bayar',
      size: 180,
      meta: { align: 'right' },
      cell: ({ row }) => {
        const kas = Number(row.original.kas || 0);
        const bank = Number(row.original.bank || 0);
        const bgcek = Number(row.original.bgcek || 0);
        const porsekot = Number(row.original.porsekot || 0);
        
        return (
          <div className="flex flex-col items-end leading-[1.1] gap-0.5">
            {kas !== 0 && <span className="text-[11px] font-bold text-emerald-600">Kas: {kas.toLocaleString('id-ID')}</span>}
            {bank !== 0 && <span className="text-[11px] font-bold text-blue-600">Bank: {bank.toLocaleString('id-ID')}</span>}
            {bgcek !== 0 && <span className="text-[11px] font-bold text-purple-600">BG: {bgcek.toLocaleString('id-ID')}</span>}
            {porsekot !== 0 && <span className="text-[11px] font-bold text-orange-600">Pst: {porsekot.toLocaleString('id-ID')}</span>}
          </div>
        );
      }
    },
    {
      accessorKey: 'faktur_pb',
      header: 'No. Tagihan (PB)',
      size: columnWidths.faktur_pb,
      cell: ({ getValue, row }) => (
        <div className="flex flex-col leading-tight">
          <div className={`transition-colors truncate font-black text-blue-600 ${row.getIsSelected() ? 'text-green-600' : ''}`} dangerouslySetInnerHTML={{ __html: getValue() as string || '-' }} />
          {row.original.detil && (
             <div className="mt-1 scale-75 origin-left" dangerouslySetInnerHTML={{ __html: row.original.detil }} />
          )}
        </div>
      )
    },
    {
      accessorKey: 'keterangan',
      header: 'Keterangan',
      size: columnWidths.keterangan,
      cell: ({ getValue }) => <span className="text-gray-500 italic text-[12px]">{getValue() as string || '-'}</span>
    },
    {
      accessorKey: 'username',
      header: 'User',
      size: columnWidths.username,
      cell: ({ getValue }) => <span className="text-[11px] font-bold text-gray-400">@{getValue() as string || '–'}</span>
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
                  <span>Diperbarui: {lastUpdated} {scrapedPeriod ? `(Periode: ${scrapedPeriod.start} - ${scrapedPeriod.end})` : ''}</span>
                </div>
              )}
            </div>

            {loading && data.length > 0 && (
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
              placeholder="Cari faktur, supplier, PB, keterangan..."
              className="w-full pl-12 pr-4 h-10 bg-white border border-gray-200 rounded-[14px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
          <DataTable
            columns={columns}
            data={data}
            isLoading={loading}
            totalCount={totalCount}
            onScroll={handleScroll}
            selectedIds={selectedIds}
            onRowClick={handleRowClick}
            columnWidths={columnWidths}
            onColumnWidthChange={setColumnWidths}
          />

          <div className="flex items-center justify-between shrink-0 px-1 mt-1">
            <span className="text-[12px] leading-none font-bold text-gray-400">
              {totalCount === 0 ? 'Tidak ada data Pelunasan Hutang' : `Menampilkan ${data.length} dari ${totalCount} data Pelunasan Hutang`}
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
