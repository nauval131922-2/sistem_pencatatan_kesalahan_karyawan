'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Package, Hash, Calendar, Loader2, Download, Search, AlertCircle, ChevronLeft, ChevronRight, Clock, Box, RefreshCw, BarChart3, Printer, User, Tag, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';

import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import { splitDateRangeIntoMonths } from '@/lib/date-utils';
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

export default function BahanBakuClient() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(2025, 0, 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const mountedRef = useRef(true);

  // Table state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    id: 100,
    faktur: 220,
    faktur_prd: 200,
    faktur_aktifitas: 240,
    tgl: 140,
    kd_cabang: 140,
    kd_gudang: 140,
    kd_barang: 180,
    qty: 120,
    status: 120,
    hp: 180,
    hp_total: 180,
    keterangan: 250,
    fkt_hasil: 220,
    create_at: 200,
    username: 140,
    kd_pelanggan: 300,
    nama_prd: 450,
    aktifitas: 240,
    nama_barang: 350,
    satuan: 110,
    recid: 110
  });

  const isLoadingMore = useRef(false);

  // Batch states
  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 100); // 100ms debounce for near-instant responsiveness
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('bahanBaku_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const defaultStartDate = new Date(2026, 0, 1);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let initialStart = defaultStartDate;
    let initialEnd = today;

    const saved = localStorage.getItem('bahanBakuState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedDate = parsed.sessionDate || '';
        if (savedDate === todayStr) {
          initialStart = new Date(parsed.startDate);
          initialEnd = new Date(parsed.endDate);
        }
      } catch (e) {}
    }
    setStartDate(initialStart);
    setEndDate(initialEnd);
    setIsMounted(true);

    mountedRef.current = true;
    
    // Sync with other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sikka_data_updated') {
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
      if (mountedRef.current) setLoading(true);
      isLoadingMore.current = true;
      const startTime = performance.now();

      try {
        const res = await fetch(`/api/bahan-baku?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&from=${formatDateToYYYYMMDD(startDate)}&to=${formatDateToYYYYMMDD(endDate)}&_t=${Date.now()}`);
        if (!active) return;

        if (res.ok) {
          const json = await res.json();
          if (mountedRef.current && json.success) {
            const endTime = performance.now();
            setLoadTime(Math.round(endTime - startTime));
            setData(prev => {
              if (page === 1) return json.data || [];
              const currentData = prev || [];
              const newData = json.data || [];
              const existingIds = new Set(currentData.map((d: any) => d.id));
              const filteredNew = newData.filter((d: any) => !existingIds.has(d.id));
              return [...currentData, ...filteredNew];
            });
            setTotalCount(json.total || 0);

            if (json.lastUpdated) {
              const latestDate = new Date(json.lastUpdated);
              if (!isNaN(latestDate.getTime())) {
                const timestamp = latestDate.toLocaleString('id-ID', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                  timeZone: 'Asia/Jakarta'
                });
                setLastUpdated(timestamp);
              }
            } else {
              setLastUpdated(null);
            }
            setError('');
          }
        }
      } catch (err: any) {
        if (mountedRef.current) {
          console.error('Failed to fetch:', err);
          setError(err.message || 'Gagal memuat data');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          isLoadingMore.current = false;
        }
      }
    }
    if (!isMounted) return;
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate, isMounted]);

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
    localStorage.setItem('bahanBakuState', JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sessionDate: new Date().toLocaleDateString('en-CA')
    }));

    setLoading(true);
    setError('');
    setData(null);
    setPage(1);
    setSearchQuery('');

    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    const chunks = splitDateRangeIntoMonths(startStr, endStr);
    setIsBatching(true);
    setLoading(true);
    setBatchProgress(0);
    
    let successCount = 0;
    let totalScraped = 0;
    let totalNewInserted = 0;
    let lastUpdatedFromScrape: string | null = null;
    let completedChunks = 0;

    const processChunk = async (chunk: any) => {
      try {
        const res = await fetch(`/api/scrape-bahan-baku?start=${chunk.start}&end=${chunk.end}&silent=true`);
        if (res.ok) {
          successCount++;
          const json = await res.json();
          totalScraped += (json.total || 0);
          totalNewInserted += (json.newly_inserted || 0);
          if (json.lastUpdated) {
            lastUpdatedFromScrape = json.lastUpdated;
          }
        } else {
          console.error(`Failed to scrape chunk: ${chunk.start} - ${chunk.end}`);
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
        setIsBatching(false);
        setBatchStatus('');
        setBatchProgress(0);

        await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'SCRAPE',
            table_name: 'bahan_baku',
            message: `Tarik Data Bahan Baku Produksi (${startStr} s/d ${endStr})`,
            raw_data: JSON.stringify({ "Total Data Ditarik dari Digit": totalScraped, "Data Baru Ditambahkan": totalNewInserted })
          })
        });

        setRefreshKey(prev => prev + 1);
        
        const failCount = chunks.length - successCount;
        setDialog({
          isOpen: true,
          type: failCount > 0 ? 'alert' : 'success',
          title: failCount > 0 ? 'Selesai Sebagian' : 'Berhasil',
          message: failCount > 0 
            ? `Berhasil menarik ${totalScraped} data Bahan Baku dari Digit. (${failCount} bulan gagal)`
            : `Berhasil menarik ${totalScraped} data Bahan Baku dari Digit.`
        });

        localStorage.setItem('sikka_data_updated', Date.now().toString());

        if (lastUpdatedFromScrape) {
          const latestDate = new Date(lastUpdatedFromScrape);
          if (!isNaN(latestDate.getTime())) {
            const timestamp = latestDate.toLocaleString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
              timeZone: 'Asia/Jakarta'
            });
            setLastUpdated(timestamp);

            localStorage.setItem('bahanBakuState', JSON.stringify({
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              lastUpdated: timestamp,
              sessionDate: new Date().toLocaleDateString('en-CA')
            }));
          }
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 150 && !loading && !isLoadingMore.current) {
      if (data && data.length < totalCount) {
        isLoadingMore.current = true;
        setPage(prev => prev + 1);
      }
    }
  };

  const toggleSelectRow = (id: number | string, e: React.MouseEvent) => {
    const rowId = typeof id === 'string' ? parseInt(id) : id;
    let next = new Set(selectedIds);
    if (e.shiftKey && lastSelectedId !== null && data) {
      const currentIndex = data.findIndex((o: any) => o.id === rowId);
      const lastIndex = data.findIndex((o: any) => o.id === lastSelectedId);
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        for (let i = start; i <= end; i++) {
          next.add(data[i].id);
        }
      }
    } else if (e.ctrlKey || e.metaKey) {
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
    } else {
      if (next.has(rowId) && next.size === 1) {
        next.clear();
      } else {
        next.clear();
        next.add(rowId);
      }
    }
    setLastSelectedId(rowId);
    setSelectedIds(next);
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'id', header: 'ID', size: columnWidths.id },
    { accessorKey: 'faktur', header: 'Faktur', size: columnWidths.faktur },
    { accessorKey: 'faktur_prd', header: 'Faktur PRD', size: columnWidths.faktur_prd },
    { accessorKey: 'faktur_aktifitas', header: 'Faktur Aktifitas', size: columnWidths.faktur_aktifitas },
    { 
      accessorKey: 'tgl', 
      header: 'Tanggal', 
      size: columnWidths.tgl,
      cell: ({ getValue }) => formatIndoDateStr(getValue() as string)
    },
    { accessorKey: 'kd_cabang', header: 'Cabang', size: columnWidths.kd_cabang },
    { accessorKey: 'kd_gudang', header: 'Gudang', size: columnWidths.kd_gudang },
    { accessorKey: 'kd_barang', header: 'Kode Barang', size: columnWidths.kd_barang },
    { 
      accessorKey: 'qty', 
      header: 'QTY', 
      size: columnWidths.qty,
      cell: ({ getValue }) => (getValue() as number || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
      meta: { align: 'right' }
    },
    { accessorKey: 'status', header: 'Status', size: columnWidths.status },
    { 
      accessorKey: 'hp', 
      header: 'HPP Satuan', 
      size: columnWidths.hp,
      cell: ({ getValue }) => (getValue() as number || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
      meta: { align: 'right' }
    },
    { 
      accessorKey: 'hp_total', 
      header: 'HPP Total', 
      size: columnWidths.hp_total,
      cell: ({ getValue }) => (getValue() as number || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
      meta: { align: 'right' }
    },
    { accessorKey: 'keterangan', header: 'Keterangan', size: columnWidths.keterangan },
    { accessorKey: 'fkt_hasil', header: 'Faktur Hasil', size: columnWidths.fkt_hasil },
    { accessorKey: 'create_at', header: 'Dibuat', size: columnWidths.create_at },
    { accessorKey: 'username', header: 'Petugas', size: columnWidths.username },
    { accessorKey: 'kd_pelanggan', header: 'Pelanggan', size: columnWidths.kd_pelanggan },
    { accessorKey: 'nama_prd', header: 'PRD', size: columnWidths.nama_prd },
    { accessorKey: 'aktifitas', header: 'Aktifitas', size: columnWidths.aktifitas },
    { accessorKey: 'nama_barang', header: 'Nama Barang', size: columnWidths.nama_barang },
    { accessorKey: 'satuan', header: 'Satuan', size: columnWidths.satuan },
    { accessorKey: 'recid', header: 'RECID', size: columnWidths.recid },
  ], [columnWidths]);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-sm flex flex-col gap-5 shrink-0 relative z-50">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Rentang Tanggal</span>
              <div className="flex items-center gap-2">
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
              key={isBatching ? "btn-syncing" : "btn-idle"}
              onClick={handleFetch}
              disabled={loading || isBatching || !startDate || !endDate}
              className="px-5 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
            >
              {isBatching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} className={loading && data === null ? "animate-spin" : ""} />
              )}
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
              <h3 className="text-[15px] font-extrabold text-gray-800 flex items-center gap-2 leading-none">
                <Clock size={18} className="text-green-600" />
                <span>Hasil Scrapping</span>
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-[12px] font-medium leading-none" style={{ color: '#99a1af' }}>
                  <span className="opacity-40">|</span>
                  <span>Diperbarui: {lastUpdated}</span>
                </div>
              )}
            </div>
            
            {loading && data !== null && (
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
              placeholder="Cari faktur, barang, supplier..." 
              className="w-full pl-12 pr-4 h-10 bg-white border border-gray-200 rounded-[14px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        <DataTable 
          columns={columns}
          data={data || []}
          isLoading={loading}
          onScroll={handleScroll}
          selectedIds={selectedIds}
          onRowClick={toggleSelectRow}
          columnWidths={columnWidths}
          onColumnWidthChange={setColumnWidths}
        />

        {/* Footer Info Banner */}
        <div className="flex items-center justify-between shrink-0 px-1 mt-1">
          <span className="text-[12px] leading-none font-bold text-gray-400">
            {data === null ? 'Memuat...' : totalCount === 0 ? 'Tidak ada data' : `Menampilkan ${data.length} dari ${totalCount} total data Bahan Baku`}
          </span>
          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                <span className="text-[12px] leading-none font-bold text-gray-400">{selectedIds.size} dipilih</span>
                <button 
                  onClick={() => setSelectedIds(new Set())}
                  className="text-[12px] leading-none font-black text-rose-500 hover:text-rose-600 underline underline-offset-4"
                >
                  Batal
                </button>
              </div>
            )}
            {loadTime !== null && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm border ${
                loadTime < 300 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                'bg-red-50 text-red-600 border-red-100'
              }`}>
                <span className="animate-pulse">⚡</span>
                <span>{(loadTime / 1000).toFixed(2)}s</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog(prev => ({...prev, isOpen: false}))}
        onCancel={() => setDialog(prev => ({...prev, isOpen: false}))}
      />
    </div>
  );
}
