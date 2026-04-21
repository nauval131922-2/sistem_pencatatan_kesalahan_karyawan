'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Calculator, Pencil, Check, X, Calendar } from 'lucide-react';
import ImportInfo from '@/components/ImportInfo';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/DataTable';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import SopdExcelUpload from './SopdExcelUpload';
import DatePicker from '@/components/DatePicker';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';

interface SopdRecord {
  id: number;
  no_sopd: string;
  tgl: string;
  nama_order: string;
  qty_sopd: number | string;
  unit: string;
  perkiraan_harga: number | null;
  keterangan: string | null;
  deadline_date: string | null;
  finished_date: string | null;
}

interface SopdClientProps {
  importInfo?: {
    fileName: string;
    time: string;
  };
}

const PAGE_SIZE = 50;

const formatIDR = (val: string): string => {
    if (!val) return '';
    
    let work = val;
    if (work.endsWith('.')) {
        work = work.slice(0, -1) + ',';
    }
    work = work.replace(/\./g, '').replace(/,/g, '.');
    const isNegative = work.startsWith('-');
    if (isNegative) work = work.slice(1);
    const parts = work.split('.');
    let intPartRaw = parts[0].replace(/\D/g, '');
    let decPartRaw = parts.length > 1 ? parts[parts.length - 1].replace(/\D/g, '') : null;
    if (intPartRaw === '' && decPartRaw === null) return isNegative ? '-' : '';
    const intFormatted = intPartRaw ? Number(intPartRaw).toLocaleString('id-ID') : '0';
    let result = intFormatted;
    if (decPartRaw !== null) {
        result += ',' + decPartRaw;
    }
    return isNegative ? '-' + result : result;
};

const EditableCell = ({ 
    row, 
    field, 
    onSave, 
    placeholder = 'klik 2x untuk isi',
    isNumericOnly = false 
}: { 
    row: SopdRecord, 
    field: keyof SopdRecord,
    onSave: (no_sopd: string, value: string, field: string) => Promise<boolean>,
    placeholder?: string,
    isNumericOnly?: boolean
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isSavingGuard = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const initialVal = row[field];
  const [localVal, setLocalVal] = useState<any>(initialVal);

  useEffect(() => {
    setLocalVal(row[field]);
  }, [row[field], field]);

  const handleSave = async () => {
    if (isSavingGuard.current) return;
    isSavingGuard.current = true;
    setIsSaving(true);
    setIsEditing(false);
    
    let displayVal: any = value;
    if (value !== '') {
        const parsed = Number(value.replace(/\./g, "").replace(',', '.'));
        if (!isNaN(parsed) && (isNumericOnly || !/[a-zA-Z]/.test(value))) {
            displayVal = parsed;
        }
    } else {
        displayVal = null;
    }
    setLocalVal(displayVal);

    const success = await onSave(row.no_sopd, value, field as string);
    if (!success) {
       setLocalVal(row[field]);
    }
    
    setIsSaving(false);
    setTimeout(() => { isSavingGuard.current = false; }, 300);
  };

  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        handleSave();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isEditing, value]);

  const smartFormatInput = (val: string) => {
    if (isNumericOnly) return formatIDR(val);
    if (/[a-zA-Z]/.test(val)) return val;
    return formatIDR(val);
  };

  if (isEditing) {
    return (
        <div ref={wrapperRef} className="relative w-full group/input z-[999]">
            <input
                type="text"
                autoFocus
                value={value}
                onChange={e => setValue(smartFormatInput(e.target.value))}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSave();
                    }
                    if (e.key === 'Escape') {
                        isSavingGuard.current = true;
                        setIsEditing(false);
                        setTimeout(() => { isSavingGuard.current = false; }, 300);
                    }
                }}
                className={`w-full text-right font-mono text-[13px] font-black text-black bg-[#fde047] z-50 relative border-[2px] border-black rounded-none py-0.5 focus:outline-none focus:shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px] transition-all ${(field === 'deadline_date' || field === 'finished_date') ? 'pr-8 pl-2' : 'px-2'}`}
            />
            {(field === 'deadline_date' || field === 'finished_date') && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 z-[60] flex items-center">
                    <DatePicker 
                        name="cellDatePicker"
                        value={
                            value && value.split('-').length === 3 
                              ? new Date(Number(value.split('-')[2]), Number(value.split('-')[1]) - 1, Number(value.split('-')[0])) 
                              : null
                        }
                        onChange={(d: Date) => {
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            setValue(`${day}-${m}-${y}`);
                        }}
                        popupAlign="right"
                        customTrigger={(toggle) => (
                            <button 
                                type="button"
                                tabIndex={-1}
                                onMouseDown={(e) => {
                                  e.preventDefault(); 
                                  toggle();
                                }}
                                className="p-1 px-1.5 hover:bg-green-100 rounded text-green-600 transition-colors"
                            >
                                <Calendar size={14} />
                            </button>
                        )}
                    />
                </div>
            )}
        </div>
    );
  }

  if (isSaving) {
      return (
          <div className="flex items-center justify-end gap-1.5 text-green-600 animate-pulse pr-2 h-10">
              <Loader2 size={12} className="animate-spin" />
              <span className="text-[11px] font-bold">Menyimpan...</span>
          </div>
      );
  }

  const val = localVal;
  const parseClean = (v: any) => {
      if (v === null || v === undefined || v === '') return NaN;
      if (typeof v === 'number') return v;
      let s = String(v);
      if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
      return Number(s);
  };

  const numericVal = parseClean(val);
  const isActuallyNumeric = !isNaN(numericVal) && (isNumericOnly || !/[a-zA-Z]/.test(String(val)));
  
  const formatted = isActuallyNumeric
      ? numericVal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : val;

  return (
      <div
          className="flex items-center justify-end w-[calc(100%+2rem)] h-10 pr-6 -mr-4 cursor-pointer group select-none overflow-hidden"
          onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              isSavingGuard.current = false;
              setIsEditing(true);
              let inputInit = '';
              if (val !== null && val !== undefined) {
                  if (isActuallyNumeric) {
                      inputInit = formatIDR(String(val).replace('.', ','));
                  } else {
                      inputInit = String(val);
                  }
              }
              setValue(inputInit);
          }}
          title="Klik 2x untuk mengisi"
      >
          {formatted ? (
              <span className={`font-mono font-black text-green-700 truncate ${!isActuallyNumeric ? 'text-[12px] font-bold' : ''}`}>
                  {formatted}
              </span>
          ) : (
              <span className="text-gray-300 italic text-[12px] group-hover:text-green-400 transition-colors">{placeholder}</span>
          )}
      </div>
  );
};


export default function SopdClient({ importInfo }: SopdClientProps) {
  const router = useRouter();
  const mountedRef = useRef(true);
  
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SopdRecord[] | null>(null);
  const [error, setError] = useState('');
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const { selectedIds, setSelectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sopd_columnWidths');
      if (saved) return JSON.parse(saved);
    }
    return {
      'id': 60, 'no_sopd': 180, 'nama_order': 400, 'qty_sopd': 150, 'unit': 120,
      'perkiraan_harga': 180, 'keterangan': 250, 'deadline_date': 180, 'finished_date': 180
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedQuery(searchQuery);
        setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setIsMounted(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const savedStart = localStorage.getItem('sopd_startDate');
    if (savedStart) {
      const d = new Date(savedStart);
      if (!isNaN(d.getTime())) setStartDate(d);
    }
    const savedEnd = localStorage.getItem('sopd_endDate');
    if (savedEnd) {
      const d = new Date(savedEnd);
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        if (d < today) {
          setEndDate(today);
          localStorage.setItem('sopd_endDate', today.toISOString());
        } else {
          setEndDate(d);
        }
      }
    } else {
      setEndDate(today);
      localStorage.setItem('sopd_endDate', today.toISOString());
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated' || e.key === 'sopd_data_updated') {
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

  useEffect(() => {
    if (!isMounted) return;
    if (startDate) localStorage.setItem('sopd_startDate', startDate.toISOString());
    else localStorage.removeItem('sopd_startDate');
  }, [startDate, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (endDate) localStorage.setItem('sopd_endDate', endDate.toISOString());
    else localStorage.removeItem('sopd_endDate');
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
           return `${day}-${m}-${y}`;
        };
        const startParam = fmtDate(startDate);
        const endParam = fmtDate(endDate);
        const res = await fetch(`/api/sopd?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&startDate=${startParam}&endDate=${endParam}&_t=${Date.now()}`);
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setLoadTime(Math.round(performance.now() - startTime));
            setData(json.data || []);
            setTotalCount(json.total || 0);
            setTotalPages(Math.ceil((json.total || 0) / PAGE_SIZE));
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

  const handleSaveRecord = useCallback(async (no_sopd: string, value: string, field: string): Promise<boolean> => {
    try {
      const payload: any = { no_sopd };
      payload[field] = value;
      const res = await fetch('/api/sopd', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setData(prev => prev ? prev.map(row => {
          if (row.no_sopd !== no_sopd) return row;
          let parsedVal: any = value;
          if (field === 'perkiraan_harga' && value !== '' && !/[a-zA-Z]/.test(value)) {
            const num = Number(value.replace(/\./g, "").replace(',', '.'));
            if (!isNaN(num)) parsedVal = num;
          }
          return { ...row, [field]: parsedVal };
        }) : prev);
        localStorage.setItem('sintak_data_updated', Date.now().toString());
        return true;
      }
      return false;
    } catch (e) { return false; }
  }, []);

  const columns = useMemo(() => [
    { 
        accessorKey: 'id', 
        header: 'No.', 
        size: 80,
        cell: ({ row }: any) => <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-400'}`}>{(page - 1) * PAGE_SIZE + (row.index + 1)}</span>
    },
    { 
        accessorKey: 'tgl', header: 'Tanggal', size: 130,
        cell: ({ getValue, row }: any) => {
            const val = getValue();
            if (!val) return <span className="text-gray-200">??-??-????</span>;
            const parts = String(val).split('-');
            if (parts.length === 3) {
                const day = parts[0];
                const monthIdx = parseInt(parts[1], 10) - 1;
                const year = parts[2];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                const monthName = months[monthIdx] || parts[1];
                return <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{day} {monthName} {year}</span>;
            }
            return <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{String(val)}</span>;
        }
    },
    { 
        accessorKey: 'no_sopd', 
        header: 'No. Order', 
        size: 180, 
        cell: ({ getValue, row }: any) => <span className={`font-black tracking-tight transition-colors ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`}>{String(getValue() || '—')}</span> 
    },
    { 
        accessorKey: 'nama_order', 
        header: 'Nama Order', 
        size: 400, 
        cell: ({ getValue, row }: any) => <span className={`font-black uppercase tracking-tight transition-colors ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'} truncate block`} title={String(getValue())}>{String(getValue() || '—')}</span> 
    },
    { 
        accessorKey: 'qty_sopd', header: 'Jumlah Order', size: 150, meta: { align: 'right' },
        cell: ({ getValue, row }: any) => {
            const val = getValue();
            if (!val && val !== 0) return <span className="text-gray-200 italic">—</span>;
            const num = Number(val);
            const formatted = isNaN(num) ? val : num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return (
              <div className={`flex items-center justify-between font-black tabular-nums w-full ${row.getIsSelected() ? 'text-green-700' : 'text-blue-600'}`}>
                <span>{String(formatted)}</span>
              </div>
            );
        }
    },
    { 
        accessorKey: 'unit', 
        header: 'Satuan', 
        size: 120, 
        cell: ({ getValue }: any) => <span className="text-[11px] font-bold text-gray-400">{String(getValue() || '—')}</span> 
    },
    { accessorKey: 'perkiraan_harga', header: 'Perkiraan Harga', size: 180, meta: { align: 'right' }, cell: (info: any) => <EditableCell row={info.row.original} field="perkiraan_harga" onSave={handleSaveRecord} placeholder="klik 2x untuk harga" /> },
    { accessorKey: 'keterangan', header: 'Keterangan', size: 250, meta: { align: 'right' }, cell: (info: any) => <EditableCell row={info.row.original} field="keterangan" onSave={handleSaveRecord} placeholder="klik 2x untuk ket." /> },
    { accessorKey: 'deadline_date', header: 'Tanggal Deadline', size: 180, meta: { align: 'right', overflowVisible: true }, cell: (info: any) => <EditableCell row={info.row.original} field="deadline_date" onSave={handleSaveRecord} placeholder="klik 2x untuk deadline" /> },
    { accessorKey: 'finished_date', header: 'Tanggal Selesai', size: 180, meta: { align: 'right', overflowVisible: true }, cell: (info: any) => <EditableCell row={info.row.original} field="finished_date" onSave={handleSaveRecord} placeholder="klik 2x untuk selesai" /> }
  ], [page, handleSaveRecord]);

  const handleResize = useCallback((widths: any) => {
    setColumnWidths(widths);
    localStorage.setItem('sopd_columnWidths', JSON.stringify(widths));
  }, []);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
         <SopdExcelUpload />
         <div className="bg-[var(--bg-surface)] rounded-none border-[3px] border-black p-5 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3.5px_3.5px_0_0_#000] shadow-[2.5px_2.5px_0_0_#000] transition-all duration-300 flex flex-col justify-center relative z-50 h-full">
            <div className="flex flex-wrap items-center gap-6">
               <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Rentang Tanggal</span>
                  <div className="flex items-center gap-2">
                     <div className="w-[140px] relative group"><DatePicker name="startDate" value={startDate} onChange={(d) => { setStartDate(d); setPage(1); }} /></div>
                     <div className="w-4 h-[1px] bg-gray-200 mx-1"></div>
                     <div className="w-[140px] relative group"><DatePicker name="endDate" value={endDate} onChange={(d) => { setEndDate(d); setPage(1); }} /></div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-4">
               <h3 className="text-[14px] font-extrabold text-gray-800 flex items-center gap-2.5 leading-none">
                  <Calculator size={18} className="text-green-600" />
                  <span>Data SOPd</span>
               </h3>
               <ImportInfo info={importInfo} />
            </div>
            {loading && (data?.length || 0) > 0 && (
                <div className="text-[11px] font-black text-black flex items-center gap-2 bg-[#fde047] px-2.5 py-1 rounded-none border-[2px] border-black shadow-[2px_2px_0_0_#000] animate-pulse uppercase tracking-tighter leading-none">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Memproses...</span>
                </div>
            )}
          </div>
          <SearchAndReload searchQuery={searchQuery} setSearchQuery={setSearchQuery} onReload={() => setRefreshKey(k => k + 1)} loading={loading} placeholder="Cari berdasarkan nama order..." />
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden relative">
          <DataTable data={data || []} columns={columns} columnWidths={columnWidths} onColumnWidthChange={handleResize} isLoading={loading || data === null} selectedIds={selectedIds} onRowClick={handleRowClick} rowHeight="h-10" />
          <TableFooter totalCount={totalCount} currentCount={data?.length || 0} label="SOPd" selectedCount={selectedIds.size} onClearSelection={clearSelection} loadTime={loadTime} page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
