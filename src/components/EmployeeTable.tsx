'use client';

import { useState, useMemo, useEffect, useTransition, useCallback, useRef } from 'react';
import { Search, Users, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Employee {
  id: number;
  name: string;
  position: string;
  employee_no: string | null;
}

interface EmployeeTableProps {
  employees: Employee[];
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

export default function EmployeeTable({ employees, importInfo }: EmployeeTableProps) {
  const [searchImmediate, setSearchImmediate] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [isPending, startTransition] = useTransition();
  const parentRef = useRef<HTMLDivElement>(null);
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
    name: 300,
    position: 250,
    employeeNo: 140,
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

  const sortedAndFiltered = useMemo(() => {
    let result = [...employees];
    
    // Search
    if (searchDebounced) {
      const q = searchDebounced.toLowerCase();
      result = result.filter(emp => 
        emp.name.toLowerCase().includes(q) || 
        emp.position.toLowerCase().includes(q) ||
        (emp.employee_no || '').toLowerCase().includes(q)
      );
    }

    // Sort
    const { key, direction } = sortConfig;
    if (key && direction) {
      result.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key!] || '';
        const bVal = b[sortConfig.key!] || '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [employees, searchDebounced, sortConfig]);

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
        const currentIndex = sortedAndFiltered.findIndex(emp => emp.id === id);
        const lastIndex = sortedAndFiltered.findIndex(emp => emp.id === lastSelectedId);
        
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
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Heading & Search Container */}
      <div className="flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-extrabold text-gray-800 flex items-center gap-2">
                <Users size={18} className="text-green-600" /> 
                <span>Data Karyawan</span>
            </h3>

            {searchDebounced && sortedAndFiltered.length !== employees.length && (
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
            placeholder="Cari nama, jabatan, atau ID karyawan..."
            className="w-full pl-12 pr-4 h-12 bg-white border border-gray-200 rounded-[14px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-[16px] overflow-hidden flex flex-col flex-1 min-h-0 relative">
        {/* Advanced Header Row */}
        <div className="flex items-center bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-20 shrink-0">
          <div className="px-6 py-4 flex-shrink-0 text-center text-[11px] text-gray-400 font-bold uppercase tracking-wider" style={{ width: columnWidths.no }}>
            NO.
          </div>
          
          <div 
            className="px-6 py-4 flex-shrink-0 cursor-pointer hover:bg-gray-100/50 transition-colors group relative border-l border-transparent hover:border-gray-200"
            style={{ width: columnWidths.name }}
            onClick={() => toggleSort('name')}
          >
            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
              NAMA KARYAWAN <SortIcon config={sortConfig} sortKey="name" />
            </div>
            <div 
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500/30 active:bg-green-500 z-30"
              onMouseDown={(e) => startResizing('name', e)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div 
            className="px-6 py-4 flex-shrink-0 cursor-pointer hover:bg-gray-100/50 transition-colors group relative border-l border-gray-100"
            style={{ width: columnWidths.position }}
            onClick={() => toggleSort('position')}
          >
            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
              JABATAN <SortIcon config={sortConfig} sortKey="position" />
            </div>
            <div 
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500/30 active:bg-green-500 z-30"
              onMouseDown={(e) => startResizing('position', e)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div 
            className="px-6 py-4 flex-shrink-0 cursor-pointer hover:bg-gray-100/50 transition-colors group relative border-l border-gray-100 flex-1 text-right"
            onClick={() => toggleSort('employee_no')}
          >
            <div className="flex items-center justify-end gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
               ID KARYAWAN <SortIcon config={sortConfig} sortKey="employee_no" />
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div ref={parentRef} className="flex-1 overflow-auto custom-scrollbar relative min-h-0 select-none">
          {sortedAndFiltered.length === 0 ? (
            <div className="py-24 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="p-5 bg-slate-50 rounded-3xl mb-4">
                  <Users className="text-slate-200" size={56} />
                </div>
                <p className="text-sm font-black text-gray-800">
                  {searchDebounced ? 'Data Tidak Ditemukan' : 'Belum Ada Data Karyawan'}
                </p>
                <p className="text-[12px] text-gray-400 mt-1 max-w-[250px] mx-auto leading-relaxed font-medium">
                  {searchDebounced ? `"${searchDebounced}" tidak cocok dengan data apapun.` : 'Gunakan Import Excel untuk memulai.'}
                </p>
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
                const emp = sortedAndFiltered[virtualRow.index];
                const isOdd = virtualRow.index % 2 === 1;
                const isSelected = selectedIds.has(emp.id);

                return (
                  <div 
                    key={virtualRow.key}
                    onClick={(e) => handleRowClick(emp.id, e)}
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
                      {virtualRow.index+1}
                    </div>
                    
                    <div 
                      className="px-6 py-1 whitespace-nowrap flex-shrink-0 overflow-hidden"
                      style={{ width: columnWidths.name }}
                    >
                      <span className={`text-[13px] font-extrabold truncate block ${isSelected ? 'text-green-900' : 'text-gray-800'}`}>
                        {emp.name}
                      </span>
                    </div>

                    <div 
                      className="px-6 py-1 flex-shrink-0"
                      style={{ width: columnWidths.position }}
                    >
                      <span className="text-gray-500 text-[11px] font-bold bg-slate-100/60 px-2.5 py-1 rounded-md inline-block max-w-full truncate border border-gray-100/50 group-hover:bg-white transition-colors uppercase tracking-tight">
                        {emp.position}
                      </span>
                    </div>

                    <div className="px-6 py-1 flex-1 text-right overflow-hidden">
                      <span className={`font-black text-[12px] tracking-tight font-mono transition-colors ${isSelected ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        {emp.employee_no || '---'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer info Banner outside the card for consistency */}
      <div className="flex items-center justify-start shrink-0 px-1 mt-3">
        <span className="text-[12px] font-bold text-gray-400">
           {employees.length === 0
             ? 'Belum ada data karyawan'
             : `Menampilkan ${sortedAndFiltered.length} dari ${employees.length} total karyawan`}
        </span>
      </div>
    </div>
  );
}
