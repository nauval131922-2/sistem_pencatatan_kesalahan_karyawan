'use client';

import { useState, useEffect, useRef, useMemo, useTransition, useCallback } from 'react';
import { Upload, FileSpreadsheet, Loader2, Search, AlertCircle, Calculator, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import ConfirmDialog from '@/components/ConfirmDialog';

interface HppKalkulasiClientProps {
  importInfo?: {
    fileName: string;
    time: string;
  };
}

function SortIcon({ config, sortKey }: { config: any, sortKey: string }) {
  if (config.key !== sortKey || !config.direction) {
    return <ArrowUpDown size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
  }
  return config.direction === 'asc' 
    ? <ArrowUp size={12} className="text-green-600" /> 
    : <ArrowDown size={12} className="text-green-600" />;
}

export default function HppKalkulasiClient({ importInfo }: HppKalkulasiClientProps) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const [searchImmediate, setSearchImmediate] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [isPending, startTransition] = useTransition();

  const parentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);

  // Column Resizing State
  const [columnWidths, setColumnWidths] = useState({
    no: 64,
    nama_order: 700,
    hpp_kalkulasi: 200,
  });

  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const startResizing = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      key,
      startX: e.clientX,
      startWidth: (columnWidths as any)[key]
    };

    const handleMouseMove = (mouseEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const { key, startX, startWidth } = resizingRef.current;
      const moveX = mouseEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + moveX);
      setColumnWidths(prev => ({ ...prev, [key]: newWidth }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const fetchHppData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hpp-kalkulasi?_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch HPP', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHppData();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sikka_data_updated') {
        fetchHppData();
        router.refresh();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setSearchDebounced(searchImmediate);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchImmediate]);

  const toggleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key, direction: null };
        return { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.xlsm')) {
      setError('Harap masukkan file Excel yang valid (.xlsx, .xls, atau .xlsm)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/hpp-kalkulasi', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || 'Terjadi kesalahan saat mengunggah file.');
      }

      setDialog({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: json.message || 'Data HPP Kalkulasi berhasil diperbarui.'
      });
      localStorage.setItem('sikka_data_updated', Date.now().toString());
      await fetchHppData();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sortedAndFiltered = useMemo(() => {
    if (!data) return [];
    let result = [...data];
    
    // Search
    if (searchDebounced) {
      const q = searchDebounced.toLowerCase();
      result = result.filter(d => d.nama_order.toLowerCase().includes(q));
    }

    // Sort
    const { key, direction } = sortConfig;
    if (key && direction) {
      result.sort((a: any, b: any) => {
        const aVal = a[key] || '';
        const bVal = b[key] || '';
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchDebounced, sortConfig]);

  const virtualizer = useVirtualizer({
    count: sortedAndFiltered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const handleRowClick = useCallback((id: number, e: React.MouseEvent) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      
      if (e.shiftKey && lastSelectedId !== null) {
        const currentIndex = sortedAndFiltered.findIndex(d => d.id === id);
        const lastIndex = sortedAndFiltered.findIndex(d => d.id === lastSelectedId);
        
        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);
          for (let i = start; i <= end; i++) {
            next.add(sortedAndFiltered[i].id);
          }
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      } else {
        next.clear();
        next.add(id);
      }
      
      setLastSelectedId(id);
      return next;
    });
  }, [sortedAndFiltered, lastSelectedId]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
      {/* Upload Panel - MATCHING ExcelUpload.tsx */}
      <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="bg-white border border-gray-200 shadow-sm rounded-[10px] px-4 py-3 flex items-center justify-between gap-4 relative overflow-hidden">
          <div className="flex items-center gap-4 flex-1 relative z-10">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
              <Upload className="text-green-600" size={20} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-gray-800 leading-none mb-1">Upload Data HPP Kalkulasi</h3>
              <p className="text-[11px] text-gray-400 font-medium leading-tight max-w-xl">
                Unggah file Excel yang berisi Data HPP Kalkulasi. Data yang lama akan dihapus dan digantikan seluruhnya.
              </p>
            </div>
          </div>

          <div className="shrink-0 relative z-10">
            <input 
              type="file" 
              accept=".xlsx, .xls, .xlsm"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              <span>{uploading ? 'Mengunggah...' : 'Pilih & Upload Excel'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[13px] flex items-start gap-2 animate-in fade-in shrink-0 font-semibold shadow-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Results View */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
        {data === null && loading ? (
          <div className="flex-1 bg-white border border-gray-100 rounded-[16px] flex flex-col items-center justify-center text-center p-10">
            <Loader2 size={48} className="text-green-500 animate-spin mb-4" />
            <h3 className="text-sm font-extrabold text-gray-800">Menyiapkan Data...</h3>
          </div>
        ) : (data === null || data.length === 0) && !loading ? (
          <div className="flex-1 bg-white border border-gray-200 rounded-[16px] flex flex-col items-center justify-center text-center p-20 shadow-sm border-dashed">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
              <Calculator className="text-gray-200" size={40} />
            </div>
            <h3 className="text-sm font-black text-gray-800 mb-2">Belum Ada Data HPP</h3>
            <p className="text-[12px] text-gray-400 max-w-[280px] mx-auto leading-relaxed font-medium">
              Gunakan panel upload di atas untuk memasukkan data kalkulasi HPP dari file Excel.
            </p>
          </div>
        ) : data !== null && (
          <>
            <div className="flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-[15px] font-extrabold text-gray-800 flex items-center gap-2">
                      <Calculator size={18} className="text-green-600" />
                      <span>Data HPP Kalkulasi</span>
                  </h3>

                  {searchDebounced && sortedAndFiltered.length !== data.length && (
                    <div className="flex items-center gap-3">
                      <span className="text-gray-200 text-xs mx-1">|</span>
                      <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider border border-amber-100/50 animate-in fade-in zoom-in-95">
                        {sortedAndFiltered.length} HASIL
                      </span>
                    </div>
                  )}

                  {importInfo && (
                    <div className="flex items-center gap-3">
                      <span className="text-gray-200 text-xs mx-1">|</span>
                      <div className="flex items-center gap-3 animate-in fade-in duration-700">
                        <div className="flex items-center gap-1.5 bg-gray-50/50 text-gray-400 border border-gray-100 px-2 py-1 rounded-md">
                          <FileSpreadsheet size={13} className="text-green-500/70" />
                          <span className="text-[11px] font-bold truncate max-w-[150px]" title={importInfo.fileName}>{importInfo.fileName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Clock size={12} className="text-gray-300" />
                          <span className="text-[11px] font-bold">Diperbarui: {importInfo.time}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                      <span className="text-gray-200 text-xs mx-1">|</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-gray-400">{selectedIds.size} dipilih</span>
                        <button 
                          onClick={() => setSelectedIds(new Set())}
                          className="text-[11px] font-black text-rose-500 hover:text-rose-600 underline underline-offset-4"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="relative w-full shrink-0 group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                <input 
                  type="text" 
                  value={searchImmediate}
                  onChange={(e) => setSearchImmediate(e.target.value)}
                  placeholder="Cari berdasarkan nama order..." 
                  className="w-full pl-12 pr-4 h-12 bg-white border border-gray-200 rounded-[14px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
                />
                {isPending && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="text-green-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-[16px] overflow-hidden flex flex-col flex-1 min-h-0 relative">
              {/* Header Row */}
              <div className="flex items-center bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-20 shrink-0">
                <div className="px-6 py-4 flex-shrink-0 text-center text-[11px] text-gray-400 font-bold uppercase tracking-wider" style={{ width: columnWidths.no }}>
                  NO.
                </div>
                
                <div 
                  className="px-6 py-4 flex-shrink-0 cursor-pointer hover:bg-gray-100/50 transition-colors group relative border-l border-transparent hover:border-gray-200"
                  style={{ width: columnWidths.nama_order }}
                  onClick={() => toggleSort('nama_order')}
                >
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                    NAMA ORDER <SortIcon config={sortConfig} sortKey="nama_order" />
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500/30 active:bg-green-500 z-30"
                    onMouseDown={(e) => startResizing('nama_order', e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div 
                  className="px-6 py-4 flex-shrink-0 cursor-pointer hover:bg-gray-100/50 transition-colors group relative border-l border-gray-100 flex-1 text-right"
                  onClick={() => toggleSort('hpp_kalkulasi')}
                >
                  <div className="flex items-center justify-end gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                    HPP KALKULASI <SortIcon config={sortConfig} sortKey="hpp_kalkulasi" />
                  </div>
                </div>
              </div>

              {/* Scrollable Virtual Area */}
              <div ref={parentRef} className="flex-1 overflow-auto custom-scrollbar relative min-h-0 select-none">
                {sortedAndFiltered.length === 0 ? (
                  <div className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-5 bg-slate-50 rounded-3xl mb-4">
                        <Search className="text-slate-200" size={56} />
                      </div>
                      <p className="text-sm font-black text-gray-800">Data Tidak Ditemukan</p>
                      <p className="text-[12px] text-gray-400 mt-1 font-medium">"{searchDebounced}" tidak cocok dengan data apapun.</p>
                    </div>
                  </div>
                ) : (
                  <div 
                    style={{ 
                      height: `${virtualizer.getTotalSize()}px`,
                      position: 'relative',
                      width: '100%'
                    }}
                  >
                    {virtualItems.map((virtualRow) => {
                      const row = sortedAndFiltered[virtualRow.index];
                      const isOdd = virtualRow.index % 2 === 1;
                      const isSelected = selectedIds.has(row.id);

                      return (
                        <div 
                          key={virtualRow.key}
                          onClick={(e) => handleRowClick(row.id, e)}
                          className={`flex items-center absolute top-0 left-0 w-full group select-none transition-colors border-l-4 ${isSelected ? 'bg-green-50 border-green-500' : `border-transparent hover:bg-green-50/30 ${isOdd ? 'bg-gray-50/40' : 'bg-white'}`}`}
                          style={{ 
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`
                          }}
                        >
                          <div 
                            className="px-6 py-1 whitespace-nowrap text-center text-[12px] font-bold text-gray-300 group-hover:text-green-500 tabular-nums flex-shrink-0"
                            style={{ width: columnWidths.no }}
                          >
                            {virtualRow.index + 1}
                          </div>
                          
                          <div 
                            className="px-6 py-1 whitespace-nowrap flex-shrink-0 overflow-hidden"
                            style={{ width: columnWidths.nama_order }}
                          >
                            <span className={`text-[13px] font-extrabold truncate block ${isSelected ? 'text-green-900' : 'text-gray-800'}`}>
                              {row.nama_order}
                            </span>
                          </div>

                          <div className="px-6 py-1 flex-1 text-right overflow-hidden">
                            <span className={`font-black text-[12px] tracking-tight tabular-nums transition-colors ${isSelected ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                              {row.hpp_kalkulasi.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-start shrink-0 px-1 mt-3">
              <span className="text-[12px] font-bold text-gray-400">
                 {data.length === 0
                   ? 'Tidak ada data'
                   : `Menampilkan ${sortedAndFiltered.length} dari ${data.length} total data kalkulasi`}
              </span>
              {isPending && (
                <div className="flex items-center gap-2 text-green-600 font-bold text-[11px] animate-pulse ml-4">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Memperbarui hasil...</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog 
        isOpen={dialog.isOpen}
        type={dialog.type as any}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
