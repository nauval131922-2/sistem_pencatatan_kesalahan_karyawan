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
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 group-[.is-selected]:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); generateSinglePDF(inf); }}
                        className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100 px-2 py-1 rounded-[8px] transition-all leading-none"
                        title="Cetak PDF Faktur"
                    >
                        <FileText size={12} />
                        PDF
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(inf); }}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-[8px] transition-all"
                        title="Edit Data"
                    >
                        <Pencil size={15} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(inf.id); }}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-[8px] transition-all"
                        title="Hapus Data"
                    >
                        <Trash2 size={15} />
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
            <span className="text-[11px] font-bold text-gray-400 font-mono tracking-tight leading-none">
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
                <div className={`flex items-center gap-2 text-[13px] font-bold ${isSelected ? 'text-green-700' : 'text-gray-500'}`}>
                    <Calendar size={13} className={isSelected ? 'text-green-500' : 'text-gray-300'} />
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
                <span className="text-[13px] font-bold text-gray-800 line-clamp-1" title={info.getValue() as string}>
                    {info.getValue() || 'Karyawan Dihapus'}
                </span>
                {info.row.original.employee_position && (
                    <span className="text-[10px] font-bold text-gray-400 line-clamp-1 uppercase tracking-tighter">
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
                    <span className="text-[12px] font-bold text-gray-800 line-clamp-1" title={inf.nama_barang_display || inf.nama_barang || '---'}>
                        {inf.nama_barang_display || inf.nama_barang || '---'}
                    </span>
                    <span className="text-[9px] font-extrabold text-green-600 bg-green-50 w-fit px-1.5 py-0.5 rounded border border-green-100 uppercase tracking-tighter">
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
                <span className="inline-block px-2.5 py-1 rounded-[8px] border border-slate-100 bg-slate-50 text-slate-400 text-[11px] font-bold truncate max-w-full" title={val}>
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
            <span className="font-mono font-black text-gray-600 text-[13px]">
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
                <div className="flex items-center justify-between w-full font-mono font-bold text-gray-400 pr-1 text-[12px]">
                    <span className="text-[9px] opacity-70">Rp</span>
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
                <div className="flex items-center justify-between w-full font-mono font-black text-emerald-600 pr-1 text-[14px]">
                    <span className="text-[10px] opacity-70">Rp</span>
                    <span>{formatted}</span>
                </div>
            );
        }
    }
  ], [onEdit, generateSinglePDF]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      {/* Top Filter Bar - Same style as Sales */}
      <div className="bg-white rounded-[8px] border-[1.5px] border-gray-200 p-5 shadow-sm flex flex-col gap-5 shrink-0 relative z-50">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Rentang Periode Kesalahan</span>
            <div className="flex items-center gap-2">
              <div className="w-[140px] relative group">
                <DatePicker name="startDate" value={startDate} onChange={setStartDate} />
              </div>
              <div className="w-4 h-[1px] bg-gray-200 mx-1"></div>
              <div className="w-[140px] relative group">
                <DatePicker name="endDate" value={endDate} onChange={setEndDate} />
              </div>
              {isRefreshing && (
                <div className="ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-green-50 animate-pulse">
                  <RefreshCw size={14} className="animate-spin text-green-500" />
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <button 
              onClick={generateExcel}
              className="px-5 h-10 bg-green-50 text-green-600 border border-green-100 font-extrabold rounded-[8px] hover:bg-green-600 hover:text-white transition-all flex items-center gap-2.5 shadow-sm active:scale-[0.98]"
            >
              <FileSpreadsheet size={16} />
              <span>Ekspor Excel</span>
            </button>
            <button 
              onClick={generatePDF}
              className="px-5 h-10 bg-red-50 text-red-600 border border-red-100 font-extrabold rounded-[8px] hover:bg-red-600 hover:text-white transition-all flex items-center gap-2.5 shadow-sm active:scale-[0.98]"
            >
              <Printer size={16} />
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
              <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-2 leading-none">
                <ClipboardList size={18} className="text-green-600" />
                <span>Riwayat Kesalahan Karyawan</span>
              </h3>
              {isRefreshing && data.length > 0 && (
                <div className="text-[11px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 animate-pulse uppercase tracking-tighter leading-none">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Sinkronisasi...</span>
                </div>
              )}
            </div>
          </div>

          <div className="relative w-full group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari nama karyawan, deskripsi, nomor faktur, atau referensi order..." 
              className="w-full pl-12 pr-4 h-10 bg-white border-[1.5px] border-gray-200 rounded-[8px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm" 
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
          <span className="text-[12px] leading-none font-bold text-gray-400">
             {filtered.length === 0 ? 'Tidak ada data rekaman kesalahan' : `Menampilkan ${filtered.length} dari total rekaman`}
          </span>
          
          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                   <span className="text-[12px] leading-none font-bold text-gray-400">{selectedIds.size} dipilih</span>
                   <button 
                    onClick={clearSelection}
                    className="text-[12px] leading-none font-black text-rose-500 hover:text-rose-600 underline underline-offset-4 uppercase"
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






