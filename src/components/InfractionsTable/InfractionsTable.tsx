'use client';

import { useState, useTransition, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Pencil, Trash2, Calendar, FileText, Printer, RefreshCw, FileSpreadsheet, Clock, ClipboardList, Loader2 } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';

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
                        className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 hover:bg-green-600 hover:text-white border border-green-100 px-3 py-1.5 rounded-lg transition-all leading-none uppercase tracking-wider"
                        title="Cetak PDF Faktur"
                    >
                        <FileText size={12} />
                        PDF
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(inf); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Data"
                    >
                        <Pencil size={15} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(inf.id); }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
            <span className="text-[11px] font-bold text-gray-300 font-mono tracking-widest leading-none">
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
                <div className={`flex items-center gap-2 text-[13px] font-bold ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                    <Calendar size={14} className={isSelected ? 'text-green-500' : 'text-gray-300'} />
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
                <span className="text-[13px] font-bold text-gray-800 line-clamp-1 tracking-tight" title={info.getValue() as string}>
                    {info.getValue() || 'Karyawan Dihapus'}
                </span>
                {info.row.original.employee_position && (
                    <span className="text-[10px] font-bold text-gray-400 line-clamp-1">
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
            <span className="text-[12px] text-gray-400 line-clamp-2 block leading-snug whitespace-normal" title={info.getValue() as string}>
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
                <div className="flex flex-col gap-1 leading-snug overflow-hidden">
                    <span className="text-[12px] font-bold text-gray-700 line-clamp-1" title={inf.nama_barang_display || inf.nama_barang || '---'}>
                        {inf.nama_barang_display || inf.nama_barang || '---'}
                    </span>
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 w-fit px-2 py-0.5 rounded-md border border-green-100 uppercase tracking-widest leading-none">
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
                <span className="inline-block px-3 py-1 rounded-lg bg-gray-50 text-gray-600 text-[11px] font-bold tracking-tight truncate max-w-full border border-gray-100" title={val}>
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
            <span className="font-mono font-bold text-gray-700 text-[13px]">
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
                <div className="flex items-center justify-between w-full font-mono font-bold text-gray-700 pr-1 text-[12px]">
                    <span className="text-[9px] text-gray-300">Rp</span>
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
                <div className="flex items-center justify-between w-full font-mono font-bold text-gray-900 pr-1 text-[14px]">
                    <span className="text-[10px] text-gray-300">Rp</span>
                    <span className="font-extrabold">{formatted}</span>
                </div>
            );
        }
    }
  ], [onEdit, generateSinglePDF]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      {/* Top Filter Bar - Premium Light */}
      <div className="bg-white rounded-2xl border border-gray-100 py-3.5 px-6 shadow-sm shadow-green-900/5 flex flex-col gap-4 shrink-0 relative z-50">
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-gray-500 pl-1">Rentang Periode Kesalahan</span>
            <div className="flex items-center gap-3">
              <div className="w-[180px] relative group">
                <DatePicker name="startDate" value={startDate} onChange={setStartDate} />
              </div>
              <div className="w-4 h-0.5 bg-gray-200 rounded-full"></div>
              <div className="w-[180px] relative group">
                <DatePicker name="endDate" value={endDate} onChange={setEndDate} />
              </div>
              {isRefreshing && (
                <div className="ml-2 flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-600">
                  <RefreshCw size={18} className="animate-spin" />
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-4">
            <button 
              onClick={generateExcel}
              className="px-5 h-10 bg-white text-gray-600 border border-gray-100 font-semibold rounded-lg hover:bg-green-50 hover:text-green-600 hover:border-green-100 transition-all flex items-center gap-2 shadow-sm text-[12px]"
            >
              <FileSpreadsheet size={18} />
              <span>Ekspor Excel</span>
            </button>
            <button 
              onClick={generatePDF}
              className="px-5 h-10 bg-white text-gray-600 border border-gray-100 font-semibold rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center gap-2 shadow-sm text-[12px]"
            >
              <Printer size={18} />
              <span>Cetak Rekap PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-4">
              <h3 className="text-[14px] font-bold text-gray-800 flex items-center gap-3 leading-none">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shadow-sm shrink-0">
                  <ClipboardList size={16} />
                </div>
                <span>Riwayat Kesalahan Karyawan</span>
              </h3>
              {isRefreshing && data.length > 0 && (
                <div className="text-[10px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 animate-pulse leading-none shadow-sm">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Sinkronisasi Data...</span>
                </div>
              )}
            </div>
          </div>

          <SearchAndReload
            searchQuery={query}
            setSearchQuery={(v) => { setQuery(v); setVisibleCount(PAGE_SIZE); }}
            onReload={fetchFilteredData}
            loading={isRefreshing}
            placeholder="Cari nama karyawan, deskripsi, faktur..."
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
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
              rowHeight="h-14"
          />
          <TableFooter
            totalCount={filtered.length}
            currentCount={filtered.length}
            label="Rekaman Kesalahan"
            selectedCount={selectedIds.size}
            onClearSelection={clearSelection}
            loadTime={loadTime}
          />
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

















