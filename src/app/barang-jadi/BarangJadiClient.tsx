'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Loader2, Search, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import { splitDateRangeIntoMonths, formatLastUpdate } from '@/lib/date-utils';
import { formatScrapedPeriodDate, getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod } from '@/lib/scraper-period';
import { DataTable } from '@/components/ui/DataTable';

// Helper to format Date to YYYY-MM-DD
function formatDateToYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper to format "DD-MM-YYYY" string to "DD MMM YYYY"
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

export default function BarangJadiClient() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{start: string, end: string} | null>(null);


  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const mountedRef = useRef(true);

  // Batch states
  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');

  // Table state
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('barangJadi_columnWidths');
      return saved ? JSON.parse(saved) : {
        id: 80,
        faktur: 180,
        faktur_prd: 180,
        tgl: 120,
        kd_cabang: 100,
        kd_gudang: 120,
        kd_barang: 150,
        qty_wip_awal: 110,
        qty: 100,
        qty_wip_akhir: 110,
        total_berat_kg: 120,
        pers_alokasi_hp: 120,
        mtd_alokasi_hp: 120,
        tgl_expired: 120,
        status: 100,
        selesai: 100,
        hp: 130,
        hp_total: 130,
        bbb: 120,
        btkl: 120,
        bop: 120,
        keterangan: 350,
        created_at: 150,
        username: 130,
        kd_pelanggan: 250,
        nama_prd: 300,
        faktur_so: 180,
        qty_order: 120,
        qty_so: 120,
        nama_barang: 350,
        satuan: 100,
        recid: 100
      };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('barangJadi_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 100);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setIsMounted(true);

    const hydratedPeriod = hydrateScraperPeriod({ stateKey: 'barangJadiState', periodKey: 'BarangJadiClient_scrapedPeriod' });
    setScrapedPeriod(hydratedPeriod.scrapedPeriod);
    setStartDate(hydratedPeriod.startDate);
    setEndDate(hydratedPeriod.endDate);
    
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);


  // Columns Definition (ORDERED EXACTLY AS JSON)
  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'faktur', header: 'Faktur' },
    { accessorKey: 'faktur_prd', header: 'Faktur Prd' },
    { accessorKey: 'tgl', header: 'Tanggal', cell: (info: any) => formatIndoDateStr(info.getValue() as string) },
    { accessorKey: 'kd_cabang', header: 'Cabang' },
    { accessorKey: 'kd_gudang', header: 'Gudang' },
    { accessorKey: 'kd_barang', header: 'Kode Barang' },
    { 
        accessorKey: 'qty_wip_awal', 
        header: 'WIP Awal', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { 
        accessorKey: 'qty', 
        header: 'Qty', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { 
        accessorKey: 'qty_wip_akhir', 
        header: 'WIP Akhir', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { 
        accessorKey: 'total_berat_kg', 
        header: 'Berat (kg)', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { 
        accessorKey: 'pers_alokasi_hp', 
        header: '% Alokasi', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { accessorKey: 'mtd_alokasi_hp', header: 'Metode' },
    { accessorKey: 'tgl_expired', header: 'Expired' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'selesai', header: 'Selesai', cell: (info: any) => info.getValue() === 1 ? 'Ya' : 'Tdk' },
    { 
        accessorKey: 'hp', 
        header: 'HPP Satuan', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { 
        accessorKey: 'hp_total', 
        header: 'HPP Total', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { 
        accessorKey: 'bbb', 
        header: 'Bbb', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { 
        accessorKey: 'btkl', 
        header: 'Btkl', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { 
        accessorKey: 'bop', 
        header: 'Bop', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { accessorKey: 'keterangan', header: 'Keterangan', size: 350 },
    { accessorKey: 'created_at', header: 'Dibuat', size: 150 },
    { accessorKey: 'username', header: 'Admin' },
    { accessorKey: 'kd_pelanggan', header: 'Pelanggan', size: 250 },
    { accessorKey: 'nama_prd', header: 'Produk', size: 300 },
    { accessorKey: 'faktur_so', header: 'Faktur SO' },
    { 
        accessorKey: 'qty_order', 
        header: 'Order', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { 
        accessorKey: 'qty_so', 
        header: 'SO', 
        cell: (info: any) => Number(info.getValue() || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        meta: { align: 'right' }
    },
    { accessorKey: 'nama_barang', header: 'Nama Barang', size: 350 },
    { accessorKey: 'satuan', header: 'Satuan' },
    { accessorKey: 'recid', header: 'RecID' }
  ], []);

  useEffect(() => {
    setIsMounted(true);

    const hydratedPeriod = hydrateScraperPeriod({ stateKey: 'barangJadiState', periodKey: 'BarangJadiClient_scrapedPeriod' });
    setScrapedPeriod(hydratedPeriod.scrapedPeriod);
    setStartDate(hydratedPeriod.startDate);
    setEndDate(hydratedPeriod.endDate);
  }, []);

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

  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'alert' | 'error' | 'danger' | 'confirm', title: string, message: string}>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Fetch data
  useEffect(() => {
    let active = true;
    async function loadData() {
      if (page === 1) setLoading(true);
      const startTimer = performance.now();
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: PAGE_SIZE.toString(),
          search: debouncedQuery,
          from: formatDateToYYYYMMDD(startDate),
          to: formatDateToYYYYMMDD(endDate),
          _t: Date.now().toString()
        });
        const res = await fetch(`/api/barang-jadi?${queryParams.toString()}`);
        
        if (res.ok && active) {
          const json = await res.json();
          if (json.success) {
            setLoadTime(Math.round(performance.now() - startTimer));
            
            setData(prev => {
              if (page === 1) return json.data || [];
              const currentData = prev || [];
              const newData = json.data || [];
              const existingIds = new Set(currentData.map((d: any) => d.id));
              const filteredNew = newData.filter((d: any) => !existingIds.has(d.id));
              return [...currentData, ...filteredNew];
            });
            setTotalCount(json.total || 0);
            if (json.scrapedPeriod) setScrapedPeriod(json.scrapedPeriod);
            setLastUpdated(json.lastUpdated ? formatLastUpdate(new Date(json.lastUpdated)) : null);
            setError('');
          }
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Gagal memuat data');
      } finally {
        if (active) setLoading(false);
      }
    }
    
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate]);




  const handleFetch = async () => {
    if (!startDate || !endDate) {
      setError('Pilih tanggal mulai dan akhir terlebih dahulu.');
      return;
    }

    if (startDate > endDate) {
      setError('Tanggal mulai tidak boleh lebih dari tanggal akhir.');
      return;
    }

    // Save state to localStorage only when "Tarik Data" is clicked
    localStorage.setItem('barangJadiState', JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sessionDate: new Date().toLocaleDateString('en-CA')
    }));

    setIsBatching(true);
    setLoading(true);
    setError('');
    setPage(1);
    setSearchQuery('');

    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    setIsBatching(true);
    setBatchProgress(0);
    
    let successCount = 0;
    let totalScraped = 0;
    let totalNewInserted = 0;
    let lastUpdatedFromScrape: string | null = null;
    let completedChunks = 0;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-barang-jadi?start=${chunk.start}&end=${chunk.end}&silent=true`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
          totalScraped += (json.total || 0);
          totalNewInserted += (json.newly_inserted || 0);
          if (json.lastUpdated) {
            lastUpdatedFromScrape = json.lastUpdated;
          }
        }
      } catch (err) {
        console.error("Chunk error:", err);
      } finally {
        completedChunks++;
        const progress = Math.round((completedChunks / chunks.length) * 100);
        setBatchProgress(progress);
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
        const periodStr = persistScraperPeriod({ stateKey: 'barangJadiState', periodKey: 'BarangJadiClient_scrapedPeriod' }, startDate, endDate);
        setScrapedPeriod(periodStr);
        setIsBatching(false);
        setBatchStatus('');
        setBatchProgress(0);

        setRefreshKey(prev => prev + 1);
        
        const failCount = chunks.length - successCount;
        setDialog({
          isOpen: true,
          type: failCount > 0 ? 'alert' : 'success',
          title: failCount > 0 ? 'Selesai Sebagian' : 'Berhasil',
          message: failCount > 0 
            ? `Berhasil menarik ${totalScraped} data Penerimaan Barang Hasil Produksi dari Digit. (${failCount} bulan gagal)`
            : `Berhasil menarik ${totalScraped} data Penerimaan Barang Hasil Produksi dari Digit.`
        });

        localStorage.setItem('sintak_data_updated', Date.now().toString());

        if (lastUpdatedFromScrape) {
          const timestamp = formatLastUpdate(new Date(lastUpdatedFromScrape));
          setLastUpdated(timestamp);
          setRefreshKey(prev => prev + 1);
        }
      } else {
        setError("Gagal menarik data. Periksa koneksi atau log sistem.");
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err.message || 'Terjadi kesalahan saat menarik data');
    } finally {
      if (mountedRef.current) {
        setIsBatching(false);
        setLoading(false);
        setBatchStatus('');
        setBatchProgress(0);
        setRefreshKey(prev => prev + 1);
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && !isBatching && (data?.length || 0) < totalCount) {
      setPage(prev => prev + 1);
    }
  };
   

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      <div className="bg-white rounded-[8px] border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-300 flex flex-col gap-5 shrink-0 relative z-50">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Rentang Tanggal</span>
              <div className="flex items-center gap-2">
                {!isMounted ? (
                   <div className="w-[300px] h-10 bg-gray-50 animate-pulse rounded-[8px]" />
                ) : (
                  <>
                    <div className="w-[140px] relative group">
                      <DatePicker 
                        name="startDate"
                        value={startDate}
                        onChange={setStartDate}
                      />
                    </div>
                    <div className="w-4 h-[1px] bg-gray-200 mx-1"></div>
                    <div className="w-[140px] relative group">
                      <DatePicker 
                        name="endDate"
                        value={endDate}
                        onChange={setEndDate}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {isBatching && (
                <div className="flex flex-col items-end">
                    <div className="text-[10px] text-green-600 font-bold animate-pulse leading-none uppercase tracking-tighter">
                    {batchStatus}
                    </div>
                    <div className="w-24 h-1 bg-gray-50 rounded-full mt-1.5 overflow-hidden border border-gray-200">
                    <div 
                        className="h-full bg-green-500 transition-all duration-300" 
                        style={{ width: `${batchProgress}%` }}
                    />
                    </div>
                </div>
            )}
            
            <button 
              onClick={handleFetch}
              disabled={loading || isBatching || !startDate || !endDate}
              className="px-5 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-extrabold rounded-[8px] transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
            >
              {isBatching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} className={loading && data.length === 0 ? "animate-spin" : ""} />
              )}
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
            
            <div className="flex items-center gap-3">
                {loading && data.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] font-bold text-green-600 animate-pulse bg-green-50 px-2.5 py-1 rounded-full border border-green-100 uppercase tracking-tighter leading-none">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Memproses...</span>
                </div>
                )}
            </div>
          </div>

          <div className="relative w-full group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari ID, faktur, barang, atau produk..." 
              className="w-full pl-12 pr-4 h-10 bg-white border border-gray-100 rounded-[8px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
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
            onRowClick={(id: any) => {
              const next = new Set(selectedIds);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              setSelectedIds(next);
            }}
            columnWidths={columnWidths}
            onColumnWidthChange={setColumnWidths}
          />

          {/* Footer info Banner (Synced with Bahan Baku layout) */}
          <div className="flex items-center justify-between shrink-0 px-1 mt-1">
            <span className="text-[12px] leading-none font-bold text-gray-400">
              {totalCount === 0 ? 'Tidak ada data Penerimaan Barang Hasil Produksi' : `Menampilkan ${data?.length || 0} dari ${totalCount} Penerimaan Barang Hasil Produksi`}
            </span>
            <div className="flex items-center gap-4">
              {selectedIds.size > 0 && (
                  <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                    <span className="text-[12px] leading-none font-bold text-gray-400">{selectedIds.size} dipilih</span>
                    <button onClick={() => setSelectedIds(new Set())} className="text-[12px] leading-none font-black text-rose-500 hover:text-rose-600 underline underline-offset-4">Batal</button>
                  </div>
              )}
              {loadTime !== null && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm border ${
                  loadTime < 300 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                  'bg-red-50 text-red-600 border-red-100'
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
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}











