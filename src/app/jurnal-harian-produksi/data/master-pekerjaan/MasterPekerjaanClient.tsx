'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Calculator, ChevronDown, Filter, Database, RotateCcw } from 'lucide-react';
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
          <div className={`flex items-center justify-between font-black tabular-nums w-full ${row.getIsSelected() ? 'text-green-700' : 'text-green-700'}`}>
            <span>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
          </div>
        )
      },
      { 
        accessorKey: 'standart_target', header: 'Standart Target', size: 120, meta: { align: 'right' },
        cell: ({ getValue, row }: any) => (
          <div className={`flex items-center justify-between font-black tabular-nums w-full ${row.getIsSelected() ? 'text-amber-800' : 'text-amber-700'}`}>
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
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      {/* Top Header Row: Upload & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0 h-[97px]">
         {/* Upload Card */}
         <MasterPekerjaanUpload />

         {/* Filters Card */}
         <div className="bg-[var(--bg-surface)] rounded-none border-[3px] border-black p-5 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3.5px_3.5px_0_0_#000] shadow-[2.5px_2.5px_0_0_#000] transition-all duration-300 flex flex-col justify-center relative z-50 h-[97px]">
            <div className="flex items-end gap-3">
               {/* Category Filter */}
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Kategori</span>
                  <div className="flex items-center gap-2">
                    <div className="w-[180px] relative category-dropdown-container">
                      <button
                        onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                        className="w-full h-9 pl-8 pr-8 bg-white border-[2px] border-black rounded-none shadow-[2px_2px_0_0_#000] focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px] hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[2px_2px_0_0_#000] transition-all text-sm font-black text-black flex items-center justify-between"
                      >
                        <span className="truncate" title={categoryFilter === '' ? 'Semua Kategori' : categoryFilter}>
                          {categoryFilter === '' ? 'Semua Kategori' : categoryFilter}
                        </span>
                        <div className="absolute top-1/2 -translate-y-1/2 left-2.5 pointer-events-none text-gray-400">
                          <Filter size={14} className="text-black" strokeWidth={2.5} />
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-2.5 pointer-events-none text-gray-400">
                          <ChevronDown size={14} className={`text-black transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
                        </div>
                      </button>

                      {isCategoryDropdownOpen && (
                        <div className="absolute top-[calc(100%+6px)] left-0 w-[240px] bg-white border-[3px] border-black rounded-none shadow-[2.5px_2.5px_0_0_#000] py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[300px]">
                          <div className="px-2.5 pb-2 shrink-0 border-b-2 border-black mb-1">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
                                <Search size={12} className="text-black" strokeWidth={3} />
                              </div>
                              <input
                                type="text" autoFocus placeholder="Cari..."
                                value={categorySearchQuery} onChange={(e) => setCategorySearchQuery(e.target.value)}
                                className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white border-[2px] border-black focus:outline-none focus:shadow-[2px_2px_0_0_#000] rounded-none placeholder:text-gray-400 font-black"
                              />
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto px-1 scrollbar-thin">
                            {['', ...CATEGORIES]
                              .filter(c => c.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                              .map(cat => (
                                <button
                                  key={cat}
                                  onClick={() => { 
                                    setCategoryFilter(cat); 
                                    setSubCategoryFilter(''); // Reset sub-category
                                    setGroupFilter('');       // Reset group
                                    setPage(1); 
                                    setIsCategoryDropdownOpen(false); 
                                    setCategorySearchQuery(''); 
                                  }}
                                  className={`w-full text-left px-2.5 py-2 text-sm font-black rounded-none transition-colors truncate border-b-2 border-transparent hover:border-black ${categoryFilter === cat ? 'bg-[#fde047] text-black border-black' : 'text-black hover:bg-gray-100'}`}
                                >
                                  {cat === '' ? 'Semua Kategori' : cat}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
               </div>

               {/* Sub Category Filter */}
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Sub Kategori</span>
                  <div className="flex items-center gap-2">
                    <div className="w-[180px] relative subcategory-dropdown-container">
                      <button
                        onClick={() => setIsSubCategoryDropdownOpen(prev => !prev)}
                        className="w-full h-9 pl-8 pr-8 bg-white border-[2px] border-black rounded-none shadow-[2px_2px_0_0_#000] focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px] hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[2px_2px_0_0_#000] transition-all text-sm font-black text-black flex items-center justify-between"
                      >
                        <span className="truncate" title={subCategoryFilter === '' ? 'Semua Sub' : subCategoryFilter}>
                          {subCategoryFilter === '' ? 'Semua Sub' : subCategoryFilter}
                        </span>
                        <div className="absolute top-1/2 -translate-y-1/2 left-2.5 pointer-events-none text-gray-400">
                          <Filter size={14} className="text-black" strokeWidth={2.5} />
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-2.5 pointer-events-none text-gray-400">
                          <ChevronDown size={14} className={`text-black transition-transform duration-200 ${isSubCategoryDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
                        </div>
                      </button>

                      {isSubCategoryDropdownOpen && (
                        <div className="absolute top-[calc(100%+6px)] left-0 w-[240px] bg-white border-[3px] border-black rounded-none shadow-[2.5px_2.5px_0_0_#000] py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[300px]">
                          <div className="px-2.5 pb-2 shrink-0 border-b-2 border-black mb-1">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
                                <Search size={12} className="text-black" strokeWidth={3} />
                              </div>
                              <input
                                type="text" autoFocus placeholder="Cari..."
                                value={subCategorySearchQuery} onChange={(e) => setSubCategorySearchQuery(e.target.value)}
                                className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white border-[2px] border-black focus:outline-none focus:shadow-[2px_2px_0_0_#000] rounded-none placeholder:text-gray-400 font-black"
                              />
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto px-1 scrollbar-thin">
                            {['', ...availableSubs]
                              .filter(c => c.toLowerCase().includes(subCategorySearchQuery.toLowerCase()))
                              .map(sub => (
                                <button
                                  key={sub}
                                  onClick={() => { 
                                    setSubCategoryFilter(sub); 
                                    setGroupFilter(''); // Reset group
                                    setPage(1);
                                    setIsSubCategoryDropdownOpen(false); 
                                    setSubCategorySearchQuery(''); 
                                  }}
                                  className={`w-full text-left px-2.5 py-2 text-sm font-black rounded-none transition-colors truncate border-b-2 border-transparent hover:border-black ${subCategoryFilter === sub ? 'bg-[#fde047] text-black border-black' : 'text-black hover:bg-gray-100'}`}
                                  title={sub === '' ? 'Semua Sub Kategori' : sub}
                                >
                                  {sub === '' ? 'Semua Sub Kategori' : sub}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
               </div>

               {/* Group Filter */}
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Grup</span>
                  <div className="flex items-center gap-2">
                    <div className="w-[180px] relative group-dropdown-container">
                      <button
                        onClick={() => setIsGroupDropdownOpen(prev => !prev)}
                        className="w-full h-9 pl-8 pr-8 bg-white border-[2px] border-black rounded-none shadow-[2px_2px_0_0_#000] focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px] hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[2px_2px_0_0_#000] transition-all text-sm font-black text-black flex items-center justify-between"
                      >
                        <span className="truncate" title={groupFilter === '' ? 'Semua Grup' : groupFilter}>
                          {groupFilter === '' ? 'Semua Grup' : groupFilter}
                        </span>
                        <div className="absolute top-1/2 -translate-y-1/2 left-2.5 pointer-events-none text-gray-400">
                          <Filter size={14} className="text-black" strokeWidth={2.5} />
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-2.5 pointer-events-none text-gray-400">
                          <ChevronDown size={14} className={`text-black transition-transform duration-200 ${isGroupDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
                        </div>
                      </button>

                      {isGroupDropdownOpen && (
                        <div className="absolute top-[calc(100%+6px)] left-0 w-[240px] bg-white border-[3px] border-black rounded-none shadow-[2.5px_2.5px_0_0_#000] py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[300px]">
                          <div className="px-2.5 pb-2 shrink-0 border-b-2 border-black mb-1">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
                                <Search size={12} className="text-black" strokeWidth={3} />
                              </div>
                              <input
                                type="text" autoFocus placeholder="Cari..."
                                value={groupSearchQuery} onChange={(e) => setGroupSearchQuery(e.target.value)}
                                className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white border-[2px] border-black focus:outline-none focus:shadow-[2px_2px_0_0_#000] rounded-none placeholder:text-gray-400 font-black"
                              />
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto px-1 scrollbar-thin">
                            {['', ...availableGroups]
                              .filter(c => c.toLowerCase().includes(groupSearchQuery.toLowerCase()))
                              .map(grp => (
                                <button
                                  key={grp}
                                  onClick={() => { setGroupFilter(grp); setIsGroupDropdownOpen(false); setGroupSearchQuery(''); }}
                                  className={`w-full text-left px-2.5 py-2 text-sm font-black rounded-none transition-colors truncate border-b-2 border-transparent hover:border-black ${groupFilter === grp ? 'bg-[#fde047] text-black border-black' : 'text-black hover:bg-gray-100'}`}
                                  title={grp === '' ? 'Semua Grup' : grp}
                                >
                                  {grp === '' ? 'Semua Grup' : grp}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
               </div>

               {/* Reset Filter Button */}
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-transparent uppercase tracking-widest ml-1 select-none">Reset</span>
                  <button
                    onClick={() => {
                      setCategoryFilter('');
                      setSubCategoryFilter('');
                      setGroupFilter('');
                      setSearchQuery('');
                      setPage(1);
                    }}
                    className="h-9 px-4 bg-white hover:bg-[#ff5e5e] text-black hover:text-white border-[2px] border-black rounded-none shadow-[2px_2px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none text-[12px] font-black transition-all flex items-center gap-2 uppercase tracking-wide"
                  >
                    <RotateCcw size={14} strokeWidth={3} />
                    Reset Filter
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* Results View */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
        {/* Search Bar Section */}
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-4">
               <h3 className="text-[14px] font-extrabold text-gray-800 flex items-center gap-2.5 leading-none">
                  <Calculator size={18} className="text-green-600" />
                  <span>Data Master Pekerjaan</span>
               </h3>
               <ImportInfo info={importInfo} />

            </div>
            {loading && (data?.length || 0) > 0 && (
                <div className="text-[11px] font-black text-black flex items-center gap-2 bg-[#fde047] px-2.5 py-1 rounded-none border-[2px] border-black shadow-[2px_2px_0_0_#000] animate-pulse uppercase tracking-tighter leading-none">
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
            placeholder="Cari berdasarkan kode atau nama pekerjaan..."
          />
        </div>

        {/* Main Table Context */}
        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden relative">
         {error ? (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-rose-50/10">
              <div className="w-16 h-16 bg-[#fde047] rounded-none border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] flex items-center justify-center mb-4">
                  <AlertCircle className="text-black" size={32} />
              </div>
              <p className="text-sm font-black text-gray-800 uppercase tracking-wide">{error}</p>
              <button 
                onClick={() => setRefreshKey(k => k + 1)}
                className="mt-4 px-6 py-2 bg-black text-white border-[3px] border-black rounded-none text-xs font-black hover:bg-[var(--accent-primary)] hover:border-black transition-colors shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none uppercase tracking-wider"
              >
                Coba Lagi
              </button>
           </div>
         ) : data !== null && data.length === 0 ? (
           <div className="flex flex-col items-center justify-center flex-1 gap-3 rounded-none border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] bg-white">
              <Database className="text-black" size={50} strokeWidth={1.5} />
              <p className="text-[14px] text-gray-800 font-black">Data Tidak Ditemukan</p>
              <p className="text-[13px] text-gray-600 font-medium max-w-sm text-center">
                {debouncedQuery || categoryFilter
                  ? 'Coba ubah kata kunci pencarian atau filter kategori.'
                  : 'Belum ada data. Upload file Excel Master Pekerjaan untuk memulai.'}
              </p>
              {(debouncedQuery || categoryFilter || subCategoryFilter || groupFilter) && (
                <button
                  onClick={() => { 
                    setSearchQuery(''); 
                    setCategoryFilter(''); 
                    setSubCategoryFilter(''); 
                    setGroupFilter('');
                    setPage(1);
                  }}
                  className="mt-2 px-6 py-2 bg-black text-white hover:bg-[var(--accent-primary)] text-[12px] font-black rounded-none transition-all border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[2.5px_2.5px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none uppercase tracking-wider"
                >
                  Reset Filter
                </button>
              )}
           </div>
         ) : (
           <>
              <DataTable
                data={data || []}
                columns={columns}
                columnWidths={columnWidths}
                onColumnWidthChange={handleColumnWidthChange}
                isLoading={loading && data === null}
                rowHeight="h-10"
                selectedIds={selectedId ? new Set([selectedId]) : undefined}
                onRowClick={(id) => setSelectedId(id === selectedId ? null : id)}
              />

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
           </>
         )}
        </div>
      </div>
    </div>
  );
}
