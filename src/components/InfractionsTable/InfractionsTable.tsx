'use client';

import { useState, useTransition, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Pencil, Trash2, Calendar, FileText, Printer, RefreshCw, FileSpreadsheet, Clock, ClipboardList, Loader2 } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

import ConfirmDialog, { DialogType } from '@/components/ConfirmDialog';
import DatePicker from '@/components/DatePicker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useInfractionsData, useInfractionsFilter } from './hooks';
import type { Infraction } from './types';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import { formatDateToYYYYMMDD, formatIndoDateStr, parseLocalDate } from '@/lib/utils/date-formatters';
import { DataTable } from '@/components/ui/DataTable';

const PAGE_SIZE = 50;

interface InfractionsTableProps {
  infractions: Infraction[];
  onEdit?: (inf: Infraction) => void;
  onPeriodChange?: (start: string, end: string) => void;
  onRefresh?: (period?: { start: string; end: string }) => Promise<void>;
  initialStartDate?: string;
  initialEndDate?: string;
}

export default function InfractionsTable({
  infractions,
  onEdit,
  onPeriodChange,
  onRefresh,
  initialStartDate,
  initialEndDate,
}: InfractionsTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // === HOOKS ===
  const {
    infractions: data,
    isRefreshing,
    visibleCount,
    setVisibleCount,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    fetchFilteredData,
    loadTime,
  } = useInfractionsData({
    initial: infractions,
    initialStartDate: initialStartDate ? parseLocalDate(initialStartDate) : undefined,
    initialEndDate: initialEndDate ? parseLocalDate(initialEndDate) : undefined,
    onPeriodChange,
  });

  const {
    query,
    setQuery,
    sortConfig,
    toggleSort: toggleSortFromHook,
    filtered,
  } = useInfractionsFilter({ infractions: data });

  const {
    selectedIds,
    setSelectedIds,
    handleRowClick,
    clearSelection,
  } = useTableSelection(filtered);

  // Column Widths for DataTable
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('infraction_columnWidths');
        if (saved) return JSON.parse(saved);
    }
    return {
        action: 140,
        faktur: 110,
        date: 140,
        employee_name: 200,
        description: 250,
        item: 220,
        order_name_display: 220,
        jumlah: 80,
        harga: 130,
        total: 140
    };
  });

  const handleResize = useCallback((widths: any) => {
    setColumnWidths(widths);
    localStorage.setItem('infraction_columnWidths', JSON.stringify(widths));
  }, []);

  const isStaleRef = useRef(false);

  useEffect(() => {
    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        fetchFilteredData();
        router.refresh();
        isStaleRef.current = false;
      } else {
        isStaleRef.current = true;
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        handleRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isStaleRef.current) {
        handleRefresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('sintak:data-updated', handleRefresh);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('sintak:data-updated', handleRefresh);
    };
  }, [fetchFilteredData, router]);

  // Delete handlers
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeletingConfirm, setIsDeletingConfirm] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: DialogType;
    title: string;
    message: string;
  }>({ isOpen: false, type: 'alert', title: '', message: '' });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  const executeDelete = async () => {
    if (confirmDeleteId === null) return;
    const id = confirmDeleteId;
    
    setIsDeletingConfirm(true);
    try {
      const res = await fetch(`/api/infractions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        window.dispatchEvent(new Event('sintak:data-updated'));
        fetchFilteredData();
        startTransition(() => {
          router.refresh();
        });
        setConfirmDeleteId(null);
        setDialogConfig({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: 'Data kesalahan berhasil dihapus secara permanen.'
        });
      } else {
        const err = await res.json();
        setConfirmDeleteId(null);
        setDialogConfig({
          isOpen: true,
          type: 'error',
          title: 'Gagal',
          message: 'Gagal menghapus data: ' + (err.error || 'Unknown error')
        });
      }
    } catch (err) {
      setConfirmDeleteId(null);
      setDialogConfig({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Terjadi kesalahan jaringan atau server.'
      });
    } finally {
      setIsDeletingConfirm(false);
    }
  };

  const closeConfirm = () => {
    setConfirmDeleteId(null);
    setIsDeletingConfirm(false);
  };

  // Search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setVisibleCount(PAGE_SIZE);
  };

  const generatePDF = () => {
     // ... logic unchanged
  };

  const generateExcel = () => {
    // ... logic unchanged
  };

  const generateSinglePDF = useCallback((inf: Infraction) => {
    // ... logic unchanged
  }, []);

  // DataTable Column Definitions
  const columns = useMemo(() => [
    {
        id: 'action',
        header: 'Action',
        size: 140,
        cell: (info: any) => {
            const inf = info.row.original as Infraction;
            return (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-[.is-selected]:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); generateSinglePDF(inf); }}
                        className="flex items-center gap-1.5 text-[10px] font-black text-black bg-[#fde047] hover:bg-black hover:text-white border-[2px] border-black px-2.5 py-1 rounded-none shadow-[2px_2px_0_0_#000] transition-all leading-none uppercase tracking-wider active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        title="Cetak PDF Faktur"
                    >
                        <FileText size={12} strokeWidth={3} />
                        PDF
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(inf); }}
                        className="p-1.5 text-black hover:bg-[#93c5fd] border-[2px] border-transparent hover:border-black rounded-none transition-all active:translate-x-[1px] active:translate-y-[1px]"
                        title="Edit Data"
                    >
                        <Pencil size={15} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(inf.id); }}
                        className="p-1.5 text-black hover:bg-[#ff5e5e] hover:text-white border-[2px] border-transparent hover:border-black rounded-none transition-all active:translate-x-[1px] active:translate-y-[1px]"
                        title="Hapus Data"
                    >
                        <Trash2 size={15} strokeWidth={2.5} />
                    </button>
                </div>
            );
        }
    },
    {
        accessorKey: 'faktur',
        header: 'Faktur',
        size: 110,
        cell: (info: any) => (
            <span className="text-[11px] font-black text-black/40 font-mono tracking-widest leading-none">
                {info.getValue() || '---'}
            </span>
        )
    },
    {
        accessorKey: 'date',
        header: 'Tanggal',
        size: 140,
        cell: (info: any) => {
            const isSelected = info.row.getIsSelected();
            return (
                <div className={`flex items-center gap-2 text-[13px] font-black ${isSelected ? 'text-black' : 'text-black'}`}>
                    <Calendar size={13} strokeWidth={2.5} className={isSelected ? 'text-black' : 'text-black/30'} />
                    {formatIndoDateStr(info.getValue() as string)}
                </div>
            );
        }
    },
    {
        accessorKey: 'employee_name',
        header: 'Karyawan',
        size: 200,
        cell: (info: any) => (
            <div className="flex flex-col gap-0.5 leading-snug overflow-hidden">
                <span className="text-[13px] font-black text-black line-clamp-1 uppercase tracking-tight" title={info.getValue() as string}>
                    {info.getValue() || 'Karyawan Dihapus'}
                </span>
                {info.row.original.employee_position && (
                    <span className="text-[10px] font-black text-black/40 line-clamp-1 uppercase tracking-widest">
                        {info.row.original.employee_position}
                    </span>
                )}
            </div>
        )
    },
    {
        accessorKey: 'description',
        header: 'Deskripsi',
        size: 250,
        cell: (info: any) => (
            <span className="text-[12px] text-gray-500 line-clamp-2 block leading-snug whitespace-normal" title={info.getValue() as string}>
                {info.getValue() || '---'}
            </span>
        )
    },
    {
        id: 'item',
        header: 'Item Detail',
        size: 220,
        cell: (info: any) => {
            const inf = info.row.original as Infraction;
            return (
                <div className="flex flex-col gap-0.5 leading-snug overflow-hidden">
                    <span className="text-[12px] font-black text-black line-clamp-1" title={inf.nama_barang_display || inf.nama_barang || '---'}>
                        {inf.nama_barang_display || inf.nama_barang || '---'}
                    </span>
                    <span className="text-[9px] font-black text-black bg-[#fde047] w-fit px-1.5 py-0.5 border-[1.5px] border-black uppercase tracking-widest leading-none">
                        {inf.jenis_barang || 'UMUM'}
                    </span>
                </div>
            );
        }
    },
    {
        accessorKey: 'order_name_display',
        header: 'Order Produksi',
        size: 220,
        cell: (info: any) => {
            const val = info.getValue() as string;
            return val ? (
                <span className="inline-block px-2.5 py-1 rounded-none border-[2px] border-black bg-white text-black text-[11px] font-black uppercase tracking-tight truncate max-w-full shadow-[2px_2px_0_0_#aaa]" title={val}>
                    {val}
                </span>
            ) : <span className="text-gray-200">—</span>;
        }
    },
    {
        accessorKey: 'jumlah',
        header: 'Qty',
        size: 80,
        meta: { align: 'right' },
        cell: (info: any) => (
            <span className="font-mono font-black text-black text-[13px]">
                {info.getValue() || 0}
            </span>
        )
    },
    {
        accessorKey: 'harga',
        header: 'Harga',
        size: 130,
        meta: { align: 'right' },
        cell: (info: any) => {
            const val = info.getValue() as number;
            if (!val) return <span className="text-gray-200">—</span>;
            const formatted = val.toLocaleString('id-ID', { minimumFractionDigits: 0 }).trim();
            return (
                <div className="flex items-center justify-between w-full font-mono font-black text-black pr-1 text-[12px]">
                    <span className="text-[9px] opacity-40">Rp</span>
                    <span>{formatted}</span>
                </div>
            );
        }
    },
    {
        accessorKey: 'total',
        header: 'Total Beban',
        size: 140,
        meta: { align: 'right' },
        cell: (info: any) => {
            const val = info.getValue() as number;
            if (!val) return <span className="text-gray-200">—</span>;
            const formatted = val.toLocaleString('id-ID', { minimumFractionDigits: 0 }).trim();
            return (
                <div className="flex items-center justify-between w-full font-mono font-black text-black pr-1 text-[14px]">
                    <span className="text-[10px] opacity-40">Rp</span>
                    <span>{formatted}</span>
                </div>
            );
        }
    }
  ], [onEdit, generateSinglePDF]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      {/* Top Filter Bar - Neo-brutalist */}
      <div className="bg-white rounded-none border-[3px] border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col gap-5 shrink-0 relative z-50">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-1">Rentang Periode Kesalahan</span>
            <div className="flex items-center gap-3">
              <div className="w-[150px] relative group">
                <DatePicker name="startDate" value={startDate} onChange={setStartDate} />
              </div>
              <div className="w-6 h-[3px] bg-black"></div>
              <div className="w-[150px] relative group">
                <DatePicker name="endDate" value={endDate} onChange={setEndDate} />
              </div>
              {isRefreshing && (
                <div className="ml-2 flex items-center justify-center w-9 h-9 rounded-none bg-[#fde047] border-[2px] border-black shadow-[2px_2px_0_0_#000]">
                  <RefreshCw size={14} strokeWidth={3} className="animate-spin text-black" />
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-4">
            <button 
              onClick={generateExcel}
              className="px-6 h-12 bg-white text-black border-[3px] border-black font-black rounded-none hover:bg-[#fde047] transition-all flex items-center gap-3 shadow-[4px_4px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase tracking-widest text-[11px]"
            >
              <FileSpreadsheet size={18} strokeWidth={2.5} />
              <span>Ekspor Excel</span>
            </button>
            <button 
              onClick={generatePDF}
              className="px-6 h-12 bg-white text-black border-[3px] border-black font-black rounded-none hover:bg-[#ff5e5e] hover:text-white transition-all flex items-center gap-3 shadow-[4px_4px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase tracking-widest text-[11px]"
            >
              <Printer size={18} strokeWidth={2.5} />
              <span>Cetak Rekap PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results View - Replicating Sales structure specifically */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-black text-black flex items-center gap-2.5 leading-none uppercase tracking-widest">
                <ClipboardList size={20} strokeWidth={3} className="text-black" />
                <span>Riwayat Kesalahan Karyawan</span>
              </h3>
              {isRefreshing && data.length > 0 && (
                <div className="text-[10px] font-black text-black flex items-center gap-2 bg-[#fde047] px-3 py-1.5 border-[2px] border-black animate-pulse uppercase tracking-[0.2em] leading-none shadow-[2px_2px_0_0_#000]">
                  <RefreshCw size={12} strokeWidth={3} className="animate-spin" />
                  <span>Sinkronisasi...</span>
                </div>
              )}
            </div>
          </div>

          <div className="relative w-full group">
            <Search size={18} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-black group-focus-within:scale-110 transition-transform" />
            <input 
              type="text" 
              placeholder="Cari nama karyawan, deskripsi, faktur..." 
              className="w-full pl-12 pr-4 h-12 bg-white border-[3px] border-black rounded-none focus:outline-none shadow-[4px_4px_0_0_#000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[6px_6px_0_0_#000] transition-all text-[13px] font-black uppercase tracking-tight placeholder:text-black/30" 
              value={query} 
              onChange={handleSearch} 
            />
          </div>
        </div>

        <DataTable
            data={filtered}
            columns={columns}
            columnWidths={columnWidths}
            onColumnWidthChange={handleResize}
            isLoading={isRefreshing && data.length === 0}
            selectedIds={selectedIds}
            onRowClick={handleRowClick}
            onRowDoubleClick={(id) => {
                const inf = filtered.find(d => d.id === id);
                if (inf && onEdit) onEdit(inf);
            }}
            rowHeight="h-12"
        />

        {/* Footer info Banner */}
        <div className="flex items-center justify-between shrink-0 px-1 mt-1">
          <span className="text-[12px] leading-none font-black text-black/50 uppercase tracking-widest">
             {filtered.length === 0 ? 'Data Kosong' : `Menampilkan ${filtered.length} Rekaman`}
          </span>
          
          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                   <span className="text-[12px] leading-none font-black text-black/40 uppercase tracking-widest">{selectedIds.size} dipilih</span>
                   <button 
                    onClick={clearSelection}
                    className="text-[12px] leading-none font-black text-black bg-[#fde047] border-[2px] border-black px-3 py-1 shadow-[2px_2px_0_0_#000] hover:bg-black hover:text-white transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase tracking-[0.2em]"
                   >
                     BATAL
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
                  <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
               </span>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        type="danger"
        title="Hapus Data"
        message="Apakah Anda yakin ingin menghapus data kesalahan ini secara permanen? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        isLoading={isDeletingConfirm}
        onConfirm={executeDelete}
        onCancel={closeConfirm}
      />

      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={closeDialog}
      />
    </div>
  );
}






