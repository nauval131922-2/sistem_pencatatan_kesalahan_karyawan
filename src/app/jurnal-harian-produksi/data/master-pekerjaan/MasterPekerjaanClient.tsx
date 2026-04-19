
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Calculator, ChevronDown, Filter, Database, RotateCcw } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import MasterPekerjaanUpload from './MasterPekerjaanUpload';
import ImportInfo from '@/components/ImportInfo';
import SearchAndReload from '@/components/SearchAndReload';

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

const CATEGORY_COLORS: Record<string, string> = {
  'A. PRA CETAK':       'bg-blue-50 text-blue-700 border-blue-200',
  'B. QUALITY CONTROL': 'bg-purple-50 text-purple-700 border-purple-200',
  'C. CETAK':           'bg-orange-50 text-orange-700 border-orange-200',
  'D. PASCA CETAK':     'bg-green-50 text-green-700 border-green-200',
  'E. GUDANG':          'bg-yellow-50 text-yellow-700 border-yellow-200',
  'F. TEHNISI':         'bg-red-50 text-red-700 border-red-200',
};

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
    setLoading(true);
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
      { accessorKey: 'no',      header: 'No.',           cell: (i: any) => (page-1)*PAGE_SIZE + i.row.index + 1, size: cw('no',50), meta:{align:'center'} },
      { accessorKey: 'code',    header: 'Kode',          cell: (i: any) => <span className="font-mono text-[12px] font-bold text-gray-700 tracking-tight">{i.getValue()}</span>, size: cw('code',180) },
      { accessorKey: 'name',    header: 'Nama Pekerjaan',cell: (i: any) => <span className="text-[12px] text-gray-800 font-medium">{i.getValue()}</span>, size: cw('name',320) },
      { accessorKey: 'target_value',         header: 'Target',                        cell: (i: any) => numCell(i.getValue(), 'text-green-700'),  size: cw('target_value',90),         meta:{align:'right'} },
      { accessorKey: 'standart_target',      header: 'Standart Target',               cell: (i: any) => numCell(i.getValue(), 'text-amber-700'),  size: cw('standart_target',120),     meta:{align:'right'} },
      { accessorKey: 'ket_1',                header: 'Ket-1',                         cell: (i: any) => textCell(i.getValue(), 'text-slate-600'),  size: cw('ket_1',80),                meta:{align:'left'} },
      { accessorKey: 'ket_2',                header: 'Ket-2',                         cell: (i: any) => textCell(i.getValue(), 'text-slate-600'),  size: cw('ket_2',80),                meta:{align:'left'} },
      { accessorKey: 'ket_3',                header: 'Ket-3',                         cell: (i: any) => textCell(i.getValue(), 'text-slate-600'),  size: cw('ket_3',80),                meta:{align:'left'} },
      { accessorKey: 'ket_4',                header: 'Ket-4',                         cell: (i: any) => textCell(i.getValue(), 'text-slate-600'),  size: cw('ket_4',80),                meta:{align:'left'} },
      { accessorKey: 'ket_5',                header: 'Ket-5',                         cell: (i: any) => textCell(i.getValue(), 'text-slate-600'),  size: cw('ket_5',80),                meta:{align:'left'} },
      { accessorKey: 'ket_6',                header: 'Ket-6',                         cell: (i: any) => textCell(i.getValue(), 'text-slate-600'),  size: cw('ket_6',80),                meta:{align:'left'} },
      { accessorKey: 'ket_7',                header: 'Ket-7',                         cell: (i: any) => textCell(i.getValue(), 'text-slate-600'),  size: cw('ket_7',80),                meta:{align:'left'} },
      { accessorKey: 'unit_mesin',           header: 'Unit Mesin',                    cell: (i: any) => <span className="text-[12px] text-gray-600">{i.getValue()||'—'}</span>,       size: cw('unit_mesin',110) },
      { accessorKey: 'jumlah_plate',         header: 'Jumlah Plate',                  cell: (i: any) => numCell(i.getValue(), 'text-gray-600'),   size: cw('jumlah_plate',100),        meta:{align:'right'} },
      { accessorKey: 'target_per_jam_plate', header: 'Target/Jam Per Plate',          cell: (i: any) => numCell(i.getValue(), 'text-indigo-700'), size: cw('target_per_jam_plate',150),meta:{align:'right'} },
      { accessorKey: 'persiapan_mesin',      header: 'Persiapan Mesin',               cell: (i: any) => numCell(i.getValue(), 'text-gray-600'),   size: cw('persiapan_mesin',120),     meta:{align:'right'} },
      { accessorKey: 'waktu_ganti_plate',    header: 'Waktu Ganti Plate',             cell: (i: any) => numCell(i.getValue(), 'text-gray-600'),   size: cw('waktu_ganti_plate',120),   meta:{align:'right'} },
      { accessorKey: 'jml_gosok_plate',      header: 'Jml. Gosok Plate',              cell: (i: any) => numCell(i.getValue(), 'text-gray-600'),   size: cw('jml_gosok_plate',120),     meta:{align:'right'} },
      { accessorKey: 'waktu_gosok_plate',    header: 'Waktu Gosok Plate',             cell: (i: any) => numCell(i.getValue(), 'text-gray-600'),   size: cw('waktu_gosok_plate',130),   meta:{align:'right'} },
      { accessorKey: 'asumsi_target_per_hari',header:'Asumsi Target/Hari',            cell: (i: any) => numCell(i.getValue(), 'text-blue-600'),   size: cw('asumsi_target_per_hari',150),meta:{align:'right'} },
      { accessorKey: 'target_per_hari',      header: 'Target Per Hari',               cell: (i: any) => numCell(i.getValue(), 'text-blue-700'),   size: cw('target_per_hari',110),     meta:{align:'right'} },
      { accessorKey: 'target_per_jam',       header: 'Target Per Jam',                cell: (i: any) => numCell(i.getValue(), 'text-indigo-700'), size: cw('target_per_jam',110),      meta:{align:'right'} },
      { accessorKey: 'efektif_jam_kerja',    header: 'Efektif Jam Kerja',             cell: (i: any) => numCell(i.getValue(), 'text-teal-700'),   size: cw('efektif_jam_kerja',130),   meta:{align:'right'} },
      { accessorKey: 'keterangan',           header: 'Keterangan',                    cell: (i: any) => <span className="text-[12px] text-gray-500 italic">{i.getValue()||'—'}</span>, size: cw('keterangan',200) },
    ];
  }, [page, columnWidths]);


  const canPrev = page > 1;
  const canNext = page < totalPages;
  const pageStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd   = Math.min(page * PAGE_SIZE, totalCount);

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
         <div className="bg-white rounded-[8px] border-[1.5px] border-gray-200 p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-300 flex flex-col justify-center relative z-50 h-[97px]">
            <div className="flex items-end gap-3">
               {/* Category Filter */}
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Kategori</span>
                  <div className="flex items-center gap-2">
                    <div className="w-[180px] relative category-dropdown-container">
                      <button
                        onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                        className="w-full h-9 pl-8 pr-8 bg-white border border-gray-200 rounded-[8px] focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-600 transition-all text-sm font-semibold text-gray-700 flex items-center justify-between"
                      >
                        <span className="truncate" title={categoryFilter === '' ? 'Semua Kategori' : categoryFilter}>
                          {categoryFilter === '' ? 'Semua Kategori' : categoryFilter}
                        </span>
                        <div className="absolute top-1/2 -translate-y-1/2 left-2.5 pointer-events-none text-gray-400">
                          <Filter size={14} />
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-2.5 pointer-events-none text-gray-400">
                          <ChevronDown size={14} className={`transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {isCategoryDropdownOpen && (
                        <div className="absolute top-[calc(100%+6px)] left-0 w-[240px] bg-white border border-gray-100 rounded-[8px] shadow-xl py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[300px]">
                          <div className="px-2.5 pb-2 shrink-0 border-b border-gray-50 mb-1">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
                                <Search size={12} />
                              </div>
                              <input
                                type="text" autoFocus placeholder="Cari..."
                                value={categorySearchQuery} onChange={(e) => setCategorySearchQuery(e.target.value)}
                                className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-green-500/20 rounded-[6px] placeholder:text-gray-400 font-medium"
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
                                  className={`w-full text-left px-2.5 py-2 text-sm font-medium rounded-md transition-colors truncate ${categoryFilter === cat ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
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
                  <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Sub Kategori</span>
                  <div className="flex items-center gap-2">
                    <div className="w-[180px] relative subcategory-dropdown-container">
                      <button
                        onClick={() => setIsSubCategoryDropdownOpen(prev => !prev)}
                        className="w-full h-9 pl-8 pr-8 bg-white border border-gray-200 rounded-[8px] focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-600 transition-all text-sm font-semibold text-gray-700 flex items-center justify-between"
                      >
                        <span className="truncate" title={subCategoryFilter === '' ? 'Semua Sub' : subCategoryFilter}>
                          {subCategoryFilter === '' ? 'Semua Sub' : subCategoryFilter}
                        </span>
                        <div className="absolute top-1/2 -translate-y-1/2 left-2.5 pointer-events-none text-gray-400">
                          <Filter size={14} />
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-2.5 pointer-events-none text-gray-400">
                          <ChevronDown size={14} className={`transition-transform duration-200 ${isSubCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {isSubCategoryDropdownOpen && (
                        <div className="absolute top-[calc(100%+6px)] left-0 w-[240px] bg-white border border-gray-100 rounded-[8px] shadow-xl py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[300px]">
                          <div className="px-2.5 pb-2 shrink-0 border-b border-gray-50 mb-1">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
                                <Search size={12} />
                              </div>
                              <input
                                type="text" autoFocus placeholder="Cari..."
                                value={subCategorySearchQuery} onChange={(e) => setSubCategorySearchQuery(e.target.value)}
                                className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-green-500/20 rounded-[6px] placeholder:text-gray-400 font-medium"
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
                                  className={`w-full text-left px-2.5 py-2 text-sm font-medium rounded-md transition-colors truncate ${subCategoryFilter === sub ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
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
                  <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Grup</span>
                  <div className="flex items-center gap-2">
                    <div className="w-[180px] relative group-dropdown-container">
                      <button
                        onClick={() => setIsGroupDropdownOpen(prev => !prev)}
                        className="w-full h-9 pl-8 pr-8 bg-white border border-gray-200 rounded-[8px] focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-600 transition-all text-sm font-semibold text-gray-700 flex items-center justify-between"
                      >
                        <span className="truncate" title={groupFilter === '' ? 'Semua Grup' : groupFilter}>
                          {groupFilter === '' ? 'Semua Grup' : groupFilter}
                        </span>
                        <div className="absolute top-1/2 -translate-y-1/2 left-2.5 pointer-events-none text-gray-400">
                          <Filter size={14} />
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-2.5 pointer-events-none text-gray-400">
                          <ChevronDown size={14} className={`transition-transform duration-200 ${isGroupDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {isGroupDropdownOpen && (
                        <div className="absolute top-[calc(100%+6px)] left-0 w-[240px] bg-white border border-gray-100 rounded-[8px] shadow-xl py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[300px]">
                          <div className="px-2.5 pb-2 shrink-0 border-b border-gray-50 mb-1">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
                                <Search size={12} />
                              </div>
                              <input
                                type="text" autoFocus placeholder="Cari..."
                                value={groupSearchQuery} onChange={(e) => setGroupSearchQuery(e.target.value)}
                                className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-green-500/20 rounded-[6px] placeholder:text-gray-400 font-medium"
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
                                  className={`w-full text-left px-2.5 py-2 text-sm font-medium rounded-md transition-colors truncate ${groupFilter === grp ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
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
                    className="h-9 px-4 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-[8px] text-[12px] font-bold transition-all flex items-center gap-2"
                  >
                    <RotateCcw size={14} />
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
            placeholder="Cari berdasarkan kode atau nama pekerjaan..."
          />
        </div>

        {/* Main Table Context */}
        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden relative">
         {error ? (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-rose-50/10 rounded-[8px] border border-rose-100">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="text-rose-500" size={32} />
              </div>
              <p className="text-sm font-black text-gray-800">{error}</p>
              <button 
                onClick={() => setRefreshKey(k => k + 1)}
                className="mt-4 px-6 py-2 bg-white border border-rose-200 text-rose-600 rounded-[8px] text-xs font-black hover:bg-rose-50 transition-colors"
              >
                Coba Lagi
              </button>
           </div>
         ) : data !== null && data.length === 0 ? (
           <div className="flex flex-col items-center justify-center flex-1 gap-3 rounded-[8px] border border-gray-100 bg-white">
              <Database className="text-gray-200" size={50} />
              <p className="text-[14px] text-gray-400 font-extrabold">Data Tidak Ditemukan</p>
              <p className="text-[13px] text-gray-300 font-medium max-w-sm text-center">
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
                  className="mt-2 px-6 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[12px] font-bold rounded-[6px] transition-colors border border-gray-200"
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

              {/* Pagination Controls */}
              <div className="flex items-center justify-between shrink-0 px-1 mt-1">
                <div className="flex items-center gap-4">
                  <span className="text-[12px] leading-none font-bold text-gray-400">
                    {totalCount === 0
                      ? 'Tidak ada data master pekerjaan'
                      : `${pageStart}–${pageEnd} dari ${totalCount.toLocaleString('id-ID')} Item`}
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
                
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={!canPrev || loading}
                    onClick={() => setPage(1)}
                    className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[11px] font-extrabold border border-gray-100 bg-white text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Halaman pertama"
                  >
                    «
                  </button>
                  <button
                    disabled={!canPrev || loading}
                    onClick={() => setPage(p => p - 1)}
                    className="w-8 h-8 rounded-[6px] flex items-center justify-center border border-gray-100 bg-white text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Halaman sebelumnya"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  <div className="flex items-center gap-1">
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
                  </div>

                  <button
                    disabled={!canNext || loading}
                    onClick={() => setPage(p => p + 1)}
                    className="w-8 h-8 rounded-[6px] flex items-center justify-center border border-gray-100 bg-white text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Halaman berikutnya"
                  >
                    <ChevronRight size={15} />
                  </button>
                  <button
                    disabled={!canNext || loading}
                    onClick={() => setPage(totalPages)}
                    className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[11px] font-extrabold border border-gray-100 bg-white text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Halaman terakhir"
                  >
                    »
                  </button>
                  <span className="ml-2 text-[11px] font-bold text-gray-400 leading-none">
                    Hal. {page} / {totalPages}
                  </span>
                </div>
              </div>
           </>
         )}
        </div>
      </div>
    </div>
  );
}
