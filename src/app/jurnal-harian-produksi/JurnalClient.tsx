'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, ClipboardList, RotateCcw, Filter } from 'lucide-react';
import SearchableDropdown from '@/components/SearchableDropdown';
import ImportInfo from '@/components/ImportInfo';
import SearchAndReload from '@/components/SearchAndReload';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/DataTable';
import TableFooter from '@/components/TableFooter';
import DatePicker from '@/components/DatePicker';
import TableTitle from '@/components/TableTitle';
import JurnalUpload from './JurnalUpload';

interface JurnalClientProps {
  importInfo?: {
    fileName: string;
    time: string;
  };
}

const PAGE_SIZE = 50;

function formatIndoDateStr(tglStr: string) {
  if (!tglStr) return '';
  const parts = tglStr.split('-');
  if (parts.length === 3) {
    const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T12:00:00Z`);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return tglStr;
}

export default function JurnalClient({ importInfo }: JurnalClientProps) {
  const router = useRouter();
  
  // State
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dropdown filters
  const [bagianFilter, setBagianFilter] = useState('');
  const [namaKaryawanFilter, setNamaKaryawanFilter] = useState('');
  const [bagianOptions, setBagianOptions] = useState<string[]>([]);
  const [namaOptions, setNamaOptions] = useState<string[]>([]);
  const [allNamaOptions, setAllNamaOptions] = useState<{ nama: string; bagian: string }[]>([]);
  const [isBagianDropdownOpen, setIsBagianDropdownOpen] = useState(false);
  const [isNamaDropdownOpen, setIsNamaDropdownOpen] = useState(false);
  const [bagianSearchQuery, setBagianSearchQuery] = useState('');
  const [namaSearchQuery, setNamaSearchQuery] = useState('');

  // Table State
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jurnal_columnWidths_v2');
      if (saved) return JSON.parse(saved);
    }
    return {
      index: 60,
      posisi: 120,
      absensi: 80,
      tgl: 120,
      shift: 80,
      nama_karyawan: 200,
      no_order: 180,
      nama_order: 250,
      jenis_pekerjaan: 200,
      keterangan: 180,
      target: 100,
      realisasi: 100,
      no_order_2: 180,
      nama_order_2: 250,
      jenis_pekerjaan_2: 200,
      bahan_kertas: 150,
      jml_plate: 100,
      warna: 100,
      inscheet: 100,
      rijek: 100,
      jam: 100,
      kendala: 150,
      id: 60,
      bagian: 150
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Outside click handling is now managed within SearchableDropdown

  useEffect(() => {
    setIsMounted(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const savedStart = localStorage.getItem('jurnal_startDate');
    if (savedStart) {
      const d = new Date(savedStart);
      if (!isNaN(d.getTime())) setStartDate(d);
    }
    const savedEnd = localStorage.getItem('jurnal_endDate');
    const lastVisit = localStorage.getItem('jurnal_lastVisitDate');
    const todayStr = today.toDateString();

    // Update hari kunjungan terakhir
    localStorage.setItem('jurnal_lastVisitDate', todayStr);

    const isNewDay = lastVisit !== todayStr;

    if (savedEnd && !isNewDay) {
      // Hari yang sama Ã¢â‚¬â€ pakai nilai yang sudah disimpan user apa adanya
      const d = new Date(savedEnd);
      if (!isNaN(d.getTime())) setEndDate(d);
      else { setEndDate(today); localStorage.setItem('jurnal_endDate', today.toISOString()); }
    } else {
      // Hari baru atau belum ada data Ã¢â‚¬â€ reset ke hari ini
      setEndDate(today);
      localStorage.setItem('jurnal_endDate', today.toISOString());
    }

    const handleDataUpdated = () => {
      setRefreshKey(prev => prev + 1);
      router.refresh();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        handleDataUpdated();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sintak:data-updated', handleDataUpdated);
    return () => { 
      window.removeEventListener('storage', handleStorageChange); 
      window.removeEventListener('sintak:data-updated', handleDataUpdated);
    };
  }, [router]);

  useEffect(() => {
    if (!isMounted) return;
    if (startDate) localStorage.setItem('jurnal_startDate', startDate.toISOString());
    else localStorage.removeItem('jurnal_startDate');
  }, [startDate, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (endDate) localStorage.setItem('jurnal_endDate', endDate.toISOString());
    else localStorage.removeItem('jurnal_endDate');
  }, [endDate, isMounted]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      const startTime = performance.now();
      try {
        const fmtDate = (d: Date | null) => {
           if (!d) return '';
           const y = d.getFullYear();
           const m = String(d.getMonth() + 1).padStart(2, '0');
           const day = String(d.getDate()).padStart(2, '0');
           return `${y}-${m}-${day}`;
        };
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: PAGE_SIZE.toString(),
          search: debouncedQuery,
          startDate: fmtDate(startDate),
          endDate: fmtDate(endDate),
          ...(bagianFilter ? { bagian: bagianFilter } : {}),
          ...(namaKaryawanFilter ? { namaKaryawan: namaKaryawanFilter } : {}),
          _t: Date.now().toString()
        });
        const res = await fetch(`/api/jurnal-harian-produksi?${queryParams.toString()}`);
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setLoadTime(Math.round(performance.now() - startTime));
            setData(json.data || []);
            setTotalCount(json.total || 0);
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
  }, [page, debouncedQuery, refreshKey, startDate, endDate, bagianFilter, namaKaryawanFilter]);

  // Fetch distinct bagian & nama karyawan for dropdowns
  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch('/api/jurnal-harian-produksi/options');
        if (res.ok) {
          const json = await res.json();
          // Filter out options starting with '-'
          const filteredBagian = (json.bagian || []).filter((b: string) => b && !b.trim().startsWith('-'));
          const filteredKaryawan = (json.karyawan || []).filter((k: any) => k.nama && !k.nama.trim().startsWith('-') && k.bagian && !k.bagian.trim().startsWith('-'));

          setBagianOptions(filteredBagian);
          setAllNamaOptions(filteredKaryawan);
          setNamaOptions(Array.from(new Set(filteredKaryawan.map((k: any) => k.nama))));
        }
      } catch {}
    }
    fetchOptions();
  }, [refreshKey]);

  // When bagian changes, update nama options
  useEffect(() => {
    if (!bagianFilter) {
      setNamaOptions(Array.from(new Set(allNamaOptions.map(k => k.nama))));
    } else {
      const filtered = allNamaOptions.filter(k => k.bagian === bagianFilter).map(k => k.nama);
      setNamaOptions(Array.from(new Set(filtered)));
      setNamaKaryawanFilter(prev => {
        return filtered.includes(prev) ? prev : '';
      });
    }
  }, [bagianFilter, allNamaOptions]);

  const handleResetFilter = useCallback(() => {
    setBagianFilter('');
    setNamaKaryawanFilter('');
    setPage(1);
  }, []);

  const columns = useMemo(() => [
    {
      accessorKey: 'posisi',
      header: 'Posisi',
      size: columnWidths.posisi,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-medium tracking-tight ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'absensi',
      header: 'Abs.',
      size: columnWidths.absensi,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{Number(getValue() || 0)}</span>
    },
    { 
      accessorKey: 'tgl', 
      header: 'Tanggal',
      size: columnWidths.tgl,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{formatIndoDateStr(getValue() as string)}</span>
    },
    { 
      accessorKey: 'shift', 
      header: 'Sift',
      size: columnWidths.shift,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tracking-tight ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'nama_karyawan', 
      header: 'Nama Karyawan',
      size: columnWidths.nama_karyawan,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'no_order', 
      header: 'NO. Order (PPIC)',
      size: columnWidths.no_order,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => <span className={`font-bold transition-colors truncate ${row.getIsSelected() ? 'text-green-600' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'nama_order', 
      header: 'Nama Order',
      size: columnWidths.nama_order,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'jenis_pekerjaan', 
      header: 'Jenis Pekerjaan',
      size: columnWidths.jenis_pekerjaan,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue }: any) => (
        <span className="text-[12px] font-bold bg-green-50 text-green-700 px-3 py-1 border border-green-100 rounded-lg block w-fit truncate tracking-tight">
          {String(getValue() || '-')}
        </span>
      )
    },
    { 
      accessorKey: 'keterangan', 
      header: 'Keterangan',
      size: columnWidths.keterangan,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => <span className={`font-medium transition-colors truncate block ${row.getIsSelected() ? 'text-green-800' : 'text-gray-500'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'target', 
      header: 'Target',
      size: columnWidths.target,
      meta: { align: 'right', headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    { 
      accessorKey: 'realisasi', 
      header: 'Realisasi',
      size: columnWidths.realisasi,
      meta: { align: 'right', headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-semibold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-black'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    {
      accessorKey: 'no_order_2',
      header: 'No. Order',
      size: columnWidths.no_order_2,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-bold transition-colors truncate ${row.getIsSelected() ? 'text-green-600' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'nama_order_2',
      header: 'Nama Order',
      size: columnWidths.nama_order_2,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'jenis_pekerjaan_2',
      header: 'Jenis Pekerjaan',
      size: columnWidths.jenis_pekerjaan_2,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue }: any) => (
        <span className="text-[10px] font-bold bg-sky-50 text-sky-600 px-3 py-1.5 border border-sky-100 rounded-lg block w-fit truncate tracking-widest uppercase">
          {String(getValue() || '-')}
        </span>
      )
    },
    {
      accessorKey: 'bahan_kertas',
      header: 'Bahan Kertas',
      size: columnWidths.bahan_kertas,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-medium tracking-tight ${row.getIsSelected() ? 'text-green-800' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'jml_plate',
      header: 'Jml. Plate',
      size: columnWidths.jml_plate,
      meta: { align: 'right', headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    {
      accessorKey: 'warna',
      header: 'Warna',
      size: columnWidths.warna,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-medium tracking-tight ${row.getIsSelected() ? 'text-green-800' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'inscheet',
      header: 'Inscheet',
      size: columnWidths.inscheet,
      meta: { align: 'right', headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    {
      accessorKey: 'rijek',
      header: 'Rijek',
      size: columnWidths.rijek,
      meta: { align: 'right', headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    {
      accessorKey: 'jam',
      header: 'Jam',
      size: columnWidths.jam,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'kendala',
      header: 'Kendala',
      size: columnWidths.kendala,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-medium truncate block ${row.getIsSelected() ? 'text-green-800' : 'text-gray-500'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'bagian',
      header: 'Bagian',
      size: columnWidths.bagian,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-medium truncate block tracking-tight ${row.getIsSelected() ? 'text-green-800' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    }
  ], [columnWidths, page]);

  const handleResize = useCallback((widths: any) => {
    setColumnWidths(widths);
    localStorage.setItem('jurnal_columnWidths_v2', JSON.stringify(widths));
  }, []);

  const handleSelection = useCallback((id: string | number) => {
    setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  }, []);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
      <div className="flex gap-6 shrink-0 h-[105px]">
         <div className="shrink-0 h-full w-[38%] min-w-[350px]"><JurnalUpload /></div>
         <div className="flex-1 bg-white rounded-2xl border border-gray-100 px-6 py-4 shadow-sm shadow-green-900/5 flex flex-col justify-center relative z-50 overflow-visible h-full">
            <div className="flex items-center gap-6">
            {/* Rentang Tanggal */}
            <div className="flex flex-col">
               <span className="block text-[13px] font-semibold text-gray-500 mb-2 ml-1 tracking-tight select-none">Rentang Tanggal</span>
               <div className="flex items-center gap-3">
                  <div className="w-[150px] relative group"><DatePicker name="startDate" value={startDate} onChange={(d) => { setStartDate(d); setPage(1); }} /></div>
                  <div className="w-4 h-0.5 bg-gray-100 rounded-full"></div>
                  <div className="w-[150px] relative group"><DatePicker name="endDate" value={endDate} onChange={(d) => { setEndDate(d); setPage(1); }} /></div>
               </div>
            </div>

            {/* Bagian Filter */}
            <SearchableDropdown
              id="jurnal-bagian"
              label="Filter Bagian"
              value={bagianFilter}
              items={bagianOptions}
              allLabel="Semua Bagian"
              searchPlaceholder="Cari bagian..."
              panelWidth="w-[260px]"
              icon={<Filter size={16} className={bagianFilter ? 'text-green-600' : 'text-gray-400'} />}
              onChange={(val) => {
                setBagianFilter(val);
                setPage(1);
              }}
            />

            {/* Nama Karyawan Filter */}
            <SearchableDropdown
              id="jurnal-karyawan"
              label="Filter Karyawan"
              value={namaKaryawanFilter}
              items={namaOptions}
              allLabel="Semua Karyawan"
              searchPlaceholder="Cari karyawan..."
              panelWidth="w-[260px]"
              icon={<Filter size={16} className={namaKaryawanFilter ? 'text-green-600' : 'text-gray-400'} />}
              onChange={(val) => {
                setNamaKaryawanFilter(val);
                setPage(1);
              }}
            />

            {/* Reset Button */}
            <div className="flex flex-col">
              <span className="block text-[13px] font-semibold text-transparent mb-2 ml-1 tracking-tight select-none">Reset</span>
              <button
                onClick={() => {
                  handleResetFilter();
                  setSearchQuery('');
                }}
                className="h-11 px-6 bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-100 hover:border-rose-100 rounded-lg shadow-sm transition-all flex items-center gap-2.5 text-[12px] font-bold tracking-tight"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
            </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-hidden relative min-h-0">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-5">
               <h3 className="text-[14px] font-bold text-gray-800 flex items-center gap-3 leading-none tracking-tight">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
                    <ClipboardList size={16} />
                  </div>
                  <span>Jurnal Harian Produksi</span>
               </h3>
               <ImportInfo info={importInfo} />
            </div>
            {loading && (data?.length || 0) > 0 && (
                <div className="text-[10px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm animate-pulse uppercase tracking-widest leading-none">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Memproses Data...</span>
                </div>
            )}
          </div>

          <SearchAndReload
            searchQuery={searchQuery}
            setSearchQuery={(v) => { setSearchQuery(v); setPage(1); }}
            onReload={() => setRefreshKey(k => k + 1)}
            loading={loading}
            placeholder="Cari karyawan, nomor order, atau nama pekerjaan..."
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-5 overflow-hidden relative">
           {error ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm shadow-green-900/5">
                <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm shadow-rose-900/5">
                    <AlertCircle className="text-rose-500" size={40} />
                </div>
                <p className="text-lg font-bold text-gray-800 uppercase tracking-tight mb-2">Gagal Memuat Data</p>
                <p className="text-sm text-gray-400 font-medium mb-8 max-w-md">{error}</p>
                <button
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="px-10 py-4 bg-green-600 text-white font-bold rounded-xl shadow-sm shadow-green-100 hover:bg-green-700 transition-all active:scale-95 uppercase tracking-widest text-[13px]"
                >
                  Coba Muat Ulang
                </button>
             </div>
           ) : (
             <>
               <DataTable
                 data={data || []}
                 columns={columns}
                 columnWidths={columnWidths}
                 onColumnWidthChange={handleResize}
                 isLoading={loading || data === null}
                 selectedIds={selectedIds}
                 onRowClick={handleSelection}
                 rowHeight="h-11"
               />
             </>
           )}
        </div>
        <TableFooter
          totalCount={totalCount}
          currentCount={data?.length || 0}
          label="baris data"
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          loadTime={loadTime}
          page={page}
          totalPages={Math.ceil(totalCount / PAGE_SIZE) || 1}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}



