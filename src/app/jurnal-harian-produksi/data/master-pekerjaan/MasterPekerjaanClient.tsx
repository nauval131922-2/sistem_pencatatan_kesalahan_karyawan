'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, Calculator, Database, RotateCcw, Filter } from 'lucide-react';
import SearchableDropdown from '@/components/SearchableDropdown';
import { DataTable } from '@/components/ui/DataTable';
import MasterPekerjaanUpload from './MasterPekerjaanUpload';
import ImportInfo from '@/components/ImportInfo';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';

interface PekerjaanRecord {
  id: number;
  code: string;
  name: string;
  category: string;
  sub_category: string;
  group_pekerjaan: string;
  target_value: number | null;
  standart_target: number | null;
  ket_1: number | null; ket_2: number | null; ket_3: number | null;
  ket_4: number | null; ket_5: number | null; ket_6: number | null; ket_7: number | null;
  unit_mesin: string | null;
  jumlah_plate: number | null;
  target_per_jam_plate: number | null;
  persiapan_mesin: number | null;
  waktu_ganti_plate: number | null;
  jml_gosok_plate: number | null;
  waktu_gosok_plate: number | null;
  asumsi_target_per_hari: number | null;
  target_per_hari: number | null;
  target_per_jam: number | null;
  efektif_jam_kerja: number | null;
  keterangan: string | null;
}

const PAGE_SIZE = 100;

const CATEGORIES = [
  'A. PRA CETAK',
  'B. QUALITY CONTROL',
  'C. CETAK',
  'D. PASCA CETAK',
  'E. GUDANG',
  'F. TEHNISI',
];

interface MasterPekerjaanClientProps {
  importInfo?: {
    fileName: string;
    time: string;
  };
}

export default function MasterPekerjaanClient({ importInfo }: MasterPekerjaanClientProps) {
  const [data, setData] = useState<PekerjaanRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadTime, setLoadTime] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubCategoryDropdownOpen, setIsSubCategoryDropdownOpen] = useState(false);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [subCategorySearchQuery, setSubCategorySearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [availableSubs, setAvailableSubs] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('master_pekerjaan_columnWidths');
      if (saved) return JSON.parse(saved);
    }
    return {
      'code': 180, 'name': 320, 'category': 140,
      'target_value': 90, 'standart_target': 120,
      'ket_1': 80, 'ket_2': 80, 'ket_3': 80, 'ket_4': 80,
      'ket_5': 80, 'ket_6': 80, 'ket_7': 80,
      'unit_mesin': 110, 'jumlah_plate': 100, 'target_per_jam_plate': 150,
      'persiapan_mesin': 120, 'waktu_ganti_plate': 120,
      'jml_gosok_plate': 120, 'waktu_gosok_plate': 130,
      'asumsi_target_per_hari': 150, 'target_per_hari': 110,
      'target_per_jam': 110, 'efektif_jam_kerja': 130, 'keterangan': 200,
    };
  });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(searchQuery); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => { setPage(1); }, [categoryFilter, subCategoryFilter, groupFilter]);

  // Listen for cross-tab refresh
  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1);
    window.addEventListener('sintak:data-updated', handler);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') setRefreshKey(k => k + 1);
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('sintak:data-updated', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  // Handle outside click for custom dropdown
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.category-dropdown-container')) setIsCategoryDropdownOpen(false);
      if (!target.closest('.subcategory-dropdown-container')) setIsSubCategoryDropdownOpen(false);
      if (!target.closest('.group-dropdown-container')) setIsGroupDropdownOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Fetch filter values
  const loadFilters = useCallback(async () => {
    try {
      const params = new URLSearchParams({ category: categoryFilter });
      if (subCategoryFilter) params.append('sub_category', subCategoryFilter);
      
      const res = await fetch(`/api/master-pekerjaan/filters?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      setAvailableSubs(json.subCategories || []);
      setAvailableGroups(json.groups || []);
    } catch (e) {}
  }, [categoryFilter, subCategoryFilter, refreshKey]);

  useEffect(() => { loadFilters(); }, [loadFilters]);

  // Fetch data
  const loadData = useCallback(async () => {
    setLoading(page === 1);
    setError('');
    const start = performance.now();
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (debouncedQuery) params.set('search', debouncedQuery);
      if (categoryFilter) params.set('category', categoryFilter);
      if (subCategoryFilter) params.set('sub_category', subCategoryFilter);
      if (groupFilter) params.set('group', groupFilter);

      const res = await fetch(`/api/master-pekerjaan?${params}`);
      if (!res.ok) throw new Error('Gagal memuat data.');
      const json = await res.json();

      setData(json.data || []);
      setTotalCount(json.total || 0);
      setTotalPages(Math.max(1, Math.ceil((json.total || 0) / PAGE_SIZE)));
      setLoadTime(Math.round(performance.now() - start));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, categoryFilter, subCategoryFilter, groupFilter, refreshKey]);

  useEffect(() => { loadData(); }, [loadData]);

  const numCell = (val: any, cls = 'text-gray-700') =>
    val != null && val !== '' ? <span className={`font-mono text-[12px] font-semibold ${cls}`}>{Number(val).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</span>
                : <span className="text-gray-200 text-[11px]">—</span>;

  const textCell = (val: any, cls = 'text-slate-600') =>
    val != null && val !== '' ? <span className={`text-[12px] font-medium ${cls}`}>{val}</span>
                : <span className="text-gray-200 text-[11px]">—</span>;

  const columns = useMemo(() => {
    const cw = (k: string, def: number) => columnWidths[k] ?? def;
    return [
      { 
        accessorKey: 'no', 
        header: 'No.', 
        size: 80,
        cell: ({ row }: any) => <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-400'}`}>{(page - 1) * PAGE_SIZE + (row.index + 1)}</span>
      },
      { 
        accessorKey: 'code', 
        header: 'Kode', 
        size: 180,
        cell: ({ getValue, row }: any) => <span className={`font-mono text-[12px] font-bold tracking-tight transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`}>{String(getValue())}</span> 
      },
      { 
        accessorKey: 'name', 
        header: 'Nama Pekerjaan', 
        size: 320,
        cell: ({ getValue, row }: any) => <span className={`text-[12px] font-medium transition-colors ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue())}</span> 
      },
      { 
        accessorKey: 'target_value', header: 'Target', size: 90, meta: { align: 'right' },
        cell: ({ getValue, row }: any) => (
          <div className={`flex items-center justify-between font-semibold tabular-nums w-full ${row.getIsSelected() ? 'text-green-700' : 'text-green-700'}`}>
            <span>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
          </div>
        )
      },
      { 
        accessorKey: 'standart_target', header: 'Standart Target', size: 120, meta: { align: 'right' },
        cell: ({ getValue, row }: any) => (
          <div className={`flex items-center justify-between font-semibold tabular-nums w-full ${row.getIsSelected() ? 'text-amber-800' : 'text-amber-700'}`}>
            <span>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
          </div>
        )
      },
      { 
        accessorKey: 'ket_1', header: 'Ket-1', size: 80,
        cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400">{String(getValue() || '—')}</span>
      },
      { 
        accessorKey: 'ket_2', header: 'Ket-2', size: 80,
        cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400">{String(getValue() || '—')}</span>
      },
      { 
        accessorKey: 'ket_3', header: 'Ket-3', size: 80,
        cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400">{String(getValue() || '—')}</span>
      },
      { 
        accessorKey: 'ket_4', header: 'Ket-4', size: 80,
        cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400">{String(getValue() || '—')}</span>
      },
      { 
        accessorKey: 'ket_5', header: 'Ket-5', size: 80,
        cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400">{String(getValue() || '—')}</span>
      },
      { 
        accessorKey: 'ket_6', header: 'Ket-6', size: 80,
        cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400">{String(getValue() || '—')}</span>
      },
      { 
        accessorKey: 'ket_7', header: 'Ket-7', size: 80,
        cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400">{String(getValue() || '—')}</span>
      },
      { 
        accessorKey: 'unit_mesin', header: 'Unit Mesin', size: 110,
        cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400">{String(getValue() || '—')}</span>
      },
      { 
        accessorKey: 'jumlah_plate', header: 'Jumlah Plate', size: 100, meta: { align: 'right' },
        cell: ({ getValue }: any) => <span className="text-[12px] font-bold text-gray-700">{Number(getValue() || 0).toLocaleString('id-ID')}</span>
      },
      { 
        accessorKey: 'target_per_jam_plate', header: 'Target/Jam Per Plate', size: 150, meta: { align: 'right' },
        cell: ({ getValue }: any) => <span className="text-[12px] font-bold text-indigo-700">{Number(getValue() || 0).toLocaleString('id-ID')}</span>
      },
      { 
        accessorKey: 'persiapan_mesin', header: 'Persiapan Mesin', size: 120, meta: { align: 'right' },
        cell: ({ getValue }: any) => <span className="text-[12px] font-bold text-gray-700">{Number(getValue() || 0).toLocaleString('id-ID')}</span>
      },
      { 
        accessorKey: 'waktu_ganti_plate', header: 'Waktu Ganti Plate', size: 120, meta: { align: 'right' },
        cell: ({ getValue }: any) => <span className="text-[12px] font-bold text-gray-700">{Number(getValue() || 0).toLocaleString('id-ID')}</span>
      },
      { 
        accessorKey: 'jml_gosok_plate', header: 'Jml. Gosok Plate', size: 120, meta: { align: 'right' },
        cell: ({ getValue }: any) => <span className="text-[12px] font-bold text-gray-700">{Number(getValue() || 0).toLocaleString('id-ID')}</span>
      },
      { 
        accessorKey: 'waktu_gosok_plate', header: 'Waktu Gosok Plate', size: 130, meta: { align: 'right' },
        cell: ({ getValue }: any) => <span className="text-[12px] font-bold text-gray-700">{Number(getValue() || 0).toLocaleString('id-ID')}</span>
      },
      { 
        accessorKey: 'asumsi_target_per_hari', header: 'Asumsi Target/Hari', size: 150, meta: { align: 'right' },
        cell: ({ getValue }: any) => <span className="text-[12px] font-bold text-blue-600">{Number(getValue() || 0).toLocaleString('id-ID')}</span>
      },
      { 
        accessorKey: 'target_per_hari', header: 'Target Per Hari', size: 110, meta: { align: 'right' },
        cell: ({ getValue }: any) => <span className="text-[12px] font-bold text-blue-700">{Number(getValue() || 0).toLocaleString('id-ID')}</span>
      },
      { 
        accessorKey: 'target_per_jam', header: 'Target Per Jam', size: 110, meta: { align: 'right' },
        cell: ({ getValue }: any) => <span className="text-[12px] font-bold text-indigo-700">{Number(getValue() || 0).toLocaleString('id-ID')}</span>
      },
      { 
        accessorKey: 'efektif_jam_kerja', header: 'Efektif Jam Kerja', size: 130, meta: { align: 'right' },
        cell: ({ getValue }: any) => <span className="text-[12px] font-bold text-teal-700">{Number(getValue() || 0).toLocaleString('id-ID')}</span>
      },
      { 
        accessorKey: 'keterangan', header: 'Keterangan', size: 200,
        cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400 italic">{String(getValue() || '—')}</span>
      },
    ];
  }, [page, columnWidths]);


  const handleColumnWidthChange = useCallback((widths: Record<string, number>) => {
    setColumnWidths(widths);
    localStorage.setItem('master_pekerjaan_columnWidths', JSON.stringify(widths));
  }, []);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
      {/* Top Header Row: Upload & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0 h-[105px]">
         {/* Upload Card */}
         <MasterPekerjaanUpload />

         {/* Filters Card */}
         <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 shadow-sm shadow-green-900/5 flex flex-col justify-center relative z-50 h-full">
          <div className="flex items-center gap-4">
               <SearchableDropdown
                 id="mp-category"
                 label="Kategori"
                 value={categoryFilter}
                 items={CATEGORIES}
                 allLabel="Semua Kategori"
                 searchPlaceholder="Cari kategori..."
                 panelWidth="w-[260px]"
                 icon={<Filter size={16} className={categoryFilter ? 'text-green-600' : 'text-gray-400'} />}
                 onChange={(val) => {
                   setCategoryFilter(val);
                   setSubCategoryFilter('');
                   setGroupFilter('');
                   setPage(1);
                 }}
               />

               <SearchableDropdown
                 id="mp-subcategory"
                 label="Sub Kategori"
                 value={subCategoryFilter}
                 items={availableSubs}
                 allLabel="Semua Sub"
                 searchPlaceholder="Cari sub-kategori..."
                 panelWidth="w-[260px]"
                 icon={<Filter size={16} className={subCategoryFilter ? 'text-green-600' : 'text-gray-400'} />}
                 onChange={(val) => {
                   setSubCategoryFilter(val);
                   setGroupFilter('');
                   setPage(1);
                 }}
               />

               <SearchableDropdown
                 id="mp-group"
                 label="Grup"
                 value={groupFilter}
                 items={availableGroups}
                 allLabel="Semua Grup"
                 searchPlaceholder="Cari grup..."
                 panelWidth="w-[260px]"
                 icon={<Filter size={16} className={groupFilter ? 'text-green-600' : 'text-gray-400'} />}
                 onChange={(val) => {
                   setGroupFilter(val);
                   setPage(1);
                 }}
               />

               {/* Reset Filter Button */}
               <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-semibold text-transparent tracking-tight ml-1 select-none">Reset</span>
                  <button
                    onClick={() => {
                      setCategoryFilter('');
                      setSubCategoryFilter('');
                      setGroupFilter('');
                      setSearchQuery('');
                      setPage(1);
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

      {/* Results View */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        {/* Search Bar Section */}
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-5">
               <h3 className="text-[14px] font-bold text-gray-800 flex items-center gap-3 leading-none tracking-tight">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
                    <Calculator size={16} />
                  </div>
                  <span>Master Pekerjaan</span>
               </h3>
               <ImportInfo info={importInfo} />
            </div>
            {loading && (data?.length || 0) > 0 && (
                <div className="text-[10px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm animate-pulse uppercase tracking-widest leading-none">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Loading Data...</span>
                </div>
            )}
          </div>


          <SearchAndReload 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onReload={() => setRefreshKey(k => k + 1)}
            loading={loading}
            placeholder="Cari berdasarkan kode atau nama pekerjaan..."
          />
        </div>

        {/* Main Table Context */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
         {error ? (
           <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm shadow-green-900/5">
              <div className="w-20 h-20 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-center mb-6">
                  <AlertCircle className="text-rose-500" size={40} />
              </div>
              <p className="text-sm font-bold text-gray-800 uppercase tracking-[0.2em] mb-2">Terjadi Kesalahan</p>
              <p className="text-gray-500 text-sm mb-8 max-w-xs">{error}</p>
              <button 
                onClick={() => setRefreshKey(k => k + 1)}
                className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-sm shadow-green-900/10 hover:bg-emerald-700 hover:-translate-y-1 hover:shadow-sm hover:shadow-green-900/20 active:translate-y-0 uppercase tracking-widest text-[11px]"
              >
                Coba Lagi
              </button>
           </div>
         ) : data !== null && data.length === 0 ? (
           <div className="flex flex-col items-center justify-center flex-1 gap-5 rounded-2xl border border-gray-100 bg-white shadow-sm shadow-green-900/5">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center mb-2">
                <Database className="text-gray-400" size={40} strokeWidth={1.5} />
              </div>
              <div className="text-center max-w-sm">
                <p className="text-[14px] text-gray-800 font-bold uppercase tracking-widest mb-2">Data Tidak Ditemukan</p>
                <p className="text-[13px] text-gray-400 font-medium leading-relaxed px-6">
                  {debouncedQuery || categoryFilter
                    ? 'Coba ubah kata kunci pencarian atau bersihkan filter yang aktif.'
                    : 'Belum ada data. Upload file Excel Master Pekerjaan untuk memulai.'}
                </p>
              </div>
              {(debouncedQuery || categoryFilter || subCategoryFilter || groupFilter) && (
                <button
                  onClick={() => { 
                    setSearchQuery(''); 
                    setCategoryFilter(''); 
                    setSubCategoryFilter(''); 
                    setGroupFilter('');
                    setPage(1);
                  }}
                  className="mt-4 px-8 py-3 bg-gray-800 text-white hover:bg-gray-900 text-[11px] font-bold rounded-lg transition-all shadow-sm uppercase tracking-widest"
                >
                  Reset Filter
                </button>
              )}
           </div>
         ) : (
           <DataTable
             data={data || []}
             columns={columns}
             columnWidths={columnWidths}
             onColumnWidthChange={handleColumnWidthChange}
             isLoading={loading && data === null}
             rowHeight="h-11"
             selectedIds={selectedId ? new Set([selectedId]) : undefined}
             onRowClick={(id) => setSelectedId(id === selectedId ? null : id)}
           />
         )}
        </div>

        <TableFooter 
          totalCount={totalCount}
          currentCount={data?.length || 0}
          label="Item Master Pekerjaan"
          selectedCount={selectedId ? 1 : 0}
          onClearSelection={() => setSelectedId(null)}
          loadTime={loadTime}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}



