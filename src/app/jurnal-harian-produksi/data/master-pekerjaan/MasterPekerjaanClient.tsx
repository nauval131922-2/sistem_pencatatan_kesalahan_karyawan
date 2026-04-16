
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Calculator, ChevronDown, Filter } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import MasterPekerjaanUpload from './MasterPekerjaanUpload';

interface PekerjaanRecord {
  id: number;
  code: string;
  name: string;
  category: string;
  sub_category: string;
  target_value: number | null;
}

const PAGE_SIZE = 100;

const CATEGORIES = [
  'PRA CETAK',
  'QUALITY CONTROL',
  'CETAK',
  'PASCA CETAK',
  'GUDANG',
  'TEHNISI',
];

const CATEGORY_COLORS: Record<string, string> = {
  'PRA CETAK':       'bg-blue-50 text-blue-700 border-blue-200',
  'QUALITY CONTROL': 'bg-purple-50 text-purple-700 border-purple-200',
  'CETAK':           'bg-orange-50 text-orange-700 border-orange-200',
  'PASCA CETAK':     'bg-green-50 text-green-700 border-green-200',
  'GUDANG':          'bg-yellow-50 text-yellow-700 border-yellow-200',
  'TEHNISI':         'bg-red-50 text-red-700 border-red-200',
};

export default function MasterPekerjaanClient() {
  const [data, setData] = useState<PekerjaanRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadTime, setLoadTime] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('master_pekerjaan_columnWidths');
      if (saved) return JSON.parse(saved);
    }
    return {
      'code': 200,
      'name': 420,
      'category': 160,
      'sub_category': 200,
      'target_value': 110,
    };
  });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(searchQuery); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => { setPage(1); }, [categoryFilter]);

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
      if (!target.closest('.category-dropdown-container')) {
        setIsCategoryDropdownOpen(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

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
  }, [page, debouncedQuery, categoryFilter, refreshKey]);

  useEffect(() => { loadData(); }, [loadData]);

  const columns = useMemo(() => [
    {
      accessorKey: 'no',
      header: 'No.',
      cell: (info: any) => (page - 1) * PAGE_SIZE + info.row.index + 1,
      size: columnWidths['no'] ?? 60,
      meta: { align: 'center' },
    },
    {
      accessorKey: 'code',
      header: 'Kode',
      cell: (info: any) => (
        <span className="font-mono text-[12px] font-bold text-gray-700 tracking-tight">
          {info.getValue()}
        </span>
      ),
      size: columnWidths['code'] ?? 200,
    },
    {
      accessorKey: 'name',
      header: 'Nama Pekerjaan',
      cell: (info: any) => (
        <span className="text-[13px] text-gray-800 font-medium">{info.getValue()}</span>
      ),
      size: columnWidths['name'] ?? 420,
    },
    {
      accessorKey: 'category',
      header: 'Kategori',
      cell: (info: any) => {
        const cat = info.getValue() as string;
        const cls = CATEGORY_COLORS[cat] || 'bg-gray-50 text-gray-600 border-gray-200';
        return cat ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider border ${cls}`}>
            {cat}
          </span>
        ) : <span className="text-gray-300 text-[12px]">—</span>;
      },
      size: columnWidths['category'] ?? 160,
    },
    {
      accessorKey: 'sub_category',
      header: 'Sub Kategori',
      cell: (info: any) => (
        <span className="text-[12px] text-gray-500 font-medium">{info.getValue() || '—'}</span>
      ),
      size: columnWidths['sub_category'] ?? 200,
    },
    {
      accessorKey: 'target_value',
      header: 'Target',
      cell: (info: any) => {
        const val = info.getValue();
        return val != null ? (
          <span className="font-mono text-[13px] font-bold text-green-700">
            {Number(val).toLocaleString('id-ID')}
          </span>
        ) : <span className="text-gray-300 text-[12px]">—</span>;
      },
      size: columnWidths['target_value'] ?? 110,
      meta: { align: 'right' },
    },
  ], [page, columnWidths]);

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

         {/* Category Filter Card */}
         <div className="bg-white rounded-[8px] border-[1.5px] border-gray-200 p-4 lg:p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-300 flex flex-col justify-center relative z-50 h-full overflow-hidden">
            <div className="flex flex-wrap items-center gap-6">
               <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Filter Kategori</span>
                  <div className="flex items-center gap-2">
                    <div className="w-[200px] relative category-dropdown-container">
                      <button
                        onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                        className="w-full h-9 pl-8 pr-8 bg-white border border-gray-200 rounded-[8px] focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-600 transition-all text-[13px] font-bold text-gray-700 flex items-center justify-between"
                      >
                        <span className="truncate">{categoryFilter === '' ? 'SEMUA KATEGORI' : categoryFilter}</span>
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
                                type="text"
                                autoFocus
                                placeholder="Cari kategori..."
                                value={categorySearchQuery}
                                onChange={(e) => setCategorySearchQuery(e.target.value)}
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
                                    setIsCategoryDropdownOpen(false);
                                    setCategorySearchQuery('');
                                  }}
                                  className={`w-full text-left px-2.5 py-2 text-[12px] font-bold rounded-md transition-colors truncate ${
                                    categoryFilter === cat 
                                      ? 'bg-green-50 text-green-700' 
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }`}
                                >
                                  {cat === '' ? 'SEMUA KATEGORI' : cat}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-4 h-[1px] bg-gray-200 mx-1"></div>

                    <button
                      onClick={() => setRefreshKey(k => k + 1)}
                      disabled={loading}
                      className="h-9 px-4 bg-white border border-gray-200 rounded-[8px] text-gray-500 hover:text-green-600 hover:border-green-300 hover:bg-green-50 flex items-center justify-center transition-all disabled:opacity-50 shrink-0"
                      title="Refresh Data"
                    >
                      <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                  </div>
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
               {!loading && data !== null && (
                  <div className="flex items-center gap-1.5 text-[12px] font-medium leading-none text-gray-400">
                      <span className="opacity-40">|</span>
                      <div className="flex items-center gap-1.5 transition-colors">
                          <span>{totalCount.toLocaleString('id-ID')} items</span>
                          <span className="opacity-30">|</span>
                          <span>{loadTime !== null ? `${loadTime}ms` : ''}</span>
                      </div>
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

          <div className="relative w-full group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan kode atau nama pekerjaan..." 
              className="w-full pl-12 pr-4 h-10 bg-white border border-gray-100 rounded-[8px] focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
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
              {(debouncedQuery || categoryFilter) && (
                <button
                  onClick={() => { setSearchQuery(''); setCategoryFilter(''); }}
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
