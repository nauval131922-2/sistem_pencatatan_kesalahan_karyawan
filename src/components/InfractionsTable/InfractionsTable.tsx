'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Pencil, Trash2, Calendar, FileText, Printer, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

import ConfirmDialog, { DialogType } from '@/components/ConfirmDialog';
import DatePicker from '@/components/DatePicker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

import { useInfractionsData, useInfractionsFilter, useInfractionsSelection } from './hooks';
import type { Infraction } from './types';
import { formatDateToYYYYMMDD, formatIndoDateStr } from '@/lib/utils/date-formatters';

const PAGE_SIZE = 50;

// --- SortIcon component (unchanged) ---
function SortIcon({ config, sortKey }: { config: any; sortKey: string }) {
  if (config.key !== sortKey || !config.direction) {
    return <ArrowUpDown size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
  }
  return config.direction === 'asc'
    ? <ArrowUp size={12} className="text-green-600" />
    : <ArrowDown size={12} className="text-green-600" />;
}

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
  } = useInfractionsData({
    initial: infractions,
    initialStartDate: initialStartDate ? new Date(initialStartDate) : undefined,
    initialEndDate: initialEndDate ? new Date(initialEndDate) : undefined,
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
    toggleSelect,
    clearSelection,
  } = useInfractionsSelection(filtered);

  // Column Resizing State (unchanged)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    action: 140,
    faktur: 110,
    date: 140,
    employee: 200,
    description: 250,
    item: 200,
    qty: 70,
    harga: 120,
    total: 130,
    reference: 180
  });

  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const isResizingDone = useRef(false);

  // Column resize handlers (unchanged)
  const startResizing = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { key, startX: e.clientX, startWidth: columnWidths[key] };

    const handleMouseMove = (mouseEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const { key, startX, startWidth } = resizingRef.current;
      const moveX = mouseEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + moveX);
      setColumnWidths(prev => ({ ...prev, [key]: newWidth }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      isResizingDone.current = true;
      setTimeout(() => { isResizingDone.current = false; }, 100);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  // Wrapper for toggleSort with resize guard
  const handleSort = useCallback((key: string) => {
    if (isResizingDone.current) return;
    toggleSortFromHook(key);
  }, [toggleSortFromHook]);

  // Row selection (unchanged logic, using toggleSelect from hook)
  const handleRowClick = (id: number, e: React.MouseEvent) => {
    toggleSelect(id, e);
  };

  // Pagination slice
  const paginated = filtered.slice(0, visibleCount);

  // Delete handlers (unchanged)
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
        localStorage.setItem('sikka_data_updated', Date.now().toString());
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

  // Infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (visibleCount < filtered.length) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
      }
    }
  };

  // Generate PDF (using filtered data)
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const startStr = formatIndoDateStr(formatDateToYYYYMMDD(startDate));
    const endStr = formatIndoDateStr(formatDateToYYYYMMDD(endDate));

    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('PT. Buya Barokah', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Div. Percetakan', 14, 26);
    
    doc.setFontSize(8);
    doc.text('SIKKA - Sistem Informasi Pencatatan Kesalahan Karyawan', 196, 20, { align: 'right' });
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Laporan Rincian Kesalahan Karyawan', 14, 42);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const printedOnStr = formatIndoDateStr(formatDateToYYYYMMDD(new Date()));
    doc.text(`Periode: ${startStr} s/d ${endStr}`, 14, 48);
    doc.text(`Total Data: ${filtered.length}`, 14, 56);

    const tableData = filtered.map((inf, idx) => [
      idx + 1,
      formatIndoDateStr(inf.date),
      inf.employee_name || '-',
      inf.faktur || '-',
      inf.order_name_display || '-',
      inf.nama_barang_display || '-',
      inf.description || '-',
      inf.total ? `Rp ${inf.total.toLocaleString('id-ID')}` : '-'
    ]);

    const grandTotal = filtered.reduce((sum, inf) => sum + (inf.total || 0), 0);
    const grandTotalStr = grandTotal > 0 ? `Rp ${grandTotal.toLocaleString('id-ID')}` : '-';

    autoTable(doc, {
      startY: 59,
      head: [['No', 'Tanggal', 'Karyawan', 'No. Faktur', 'Order Produksi', 'Nama Barang', 'Deskripsi', 'Total']],
      body: tableData,
      foot: [['', '', '', '', '', '', 'TOTAL KESELURUHAN', grandTotalStr]],
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [30, 41, 59],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'right',
        valign: 'middle'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 20 },
        2: { cellWidth: 26 },
        3: { halign: 'center', cellWidth: 20 },
        4: { cellWidth: 26 },
        5: { cellWidth: 26 },
        6: { fontSize: 6.5 },
        7: { halign: 'right', fontStyle: 'bold', cellWidth: 22 }
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        overflow: 'linebreak',
        valign: 'top'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { top: 20, right: 14, bottom: 20, left: 14 },
      didDrawPage: (data) => {
        const pageStr = `Halaman ${data.pageNumber}`;
        const printStr = `Dicetak: ${printedOnStr}`;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(pageStr, 14, doc.internal.pageSize.height - 10);
        doc.text(printStr, 196, doc.internal.pageSize.height - 10, { align: 'right' });
      }
    });

    const pdfOutput = doc.output('bloburl');
    window.open(pdfOutput, '_blank');
  };

  // Generate Excel (using filtered data)
  const generateExcel = () => {
    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    
    const excelData = filtered.map((inf, idx) => ({
      'No': idx + 1,
      'Tanggal': inf.date,
      'Karyawan': inf.employee_name || '-',
      'Posisi': inf.employee_position || '-',
      'No. Faktur': inf.faktur || '-',
      'Order Produksi': inf.order_name_display || inf.order_name || '-',
      'Nama Barang': inf.nama_barang_display || inf.nama_barang || '-',
      'Jenis Barang': inf.jenis_barang || '-',
      'Deskripsi Kesalahan': inf.description || '-',
      'Qty': inf.jumlah || 0,
      'Harga Satuan': inf.harga || 0,
      'Total Beban': inf.total || 0,
      'Pencatat': inf.recorded_by_name || inf.recorded_by || '-'
    }));

    const ws = utils.json_to_sheet(excelData);
    const wscols = [
      { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 20 },
      { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
      { wch: 40 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
    ];
    ws['!cols'] = wscols;

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Laporan Kesalahan');
    writeFile(wb, `Laporan_Kesalahan_${startStr}_sd_${endStr}.xlsx`);
  };

  // Generate single PDF (unchanged)
  const generateSinglePDF = (inf: Infraction) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const docDate = formatIndoDateStr(inf.date);
    const printedOnStr = formatIndoDateStr(formatDateToYYYYMMDD(new Date()));

    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('PT. Buya Barokah', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Div. Percetakan', 14, 26);
    
    doc.setFontSize(8);
    doc.text('SIKKA - Sistem Informasi Pencatatan Kesalahan Karyawan', 196, 20, { align: 'right' });
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Formulir Kesalahan Karyawan', 105, 45, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`No. Referensi: ${inf.faktur || '-'}`, 105, 52, { align: 'center' });

    const startY = 65;
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    doc.setFont('helvetica', 'bold');
    doc.text('Nama Karyawan', 14, startY);
    doc.text('Tanggal Kejadian', 14, startY + 8);
    doc.text('Posisi / Bagian', 14, startY + 16);

    doc.setFont('helvetica', 'normal');
    doc.text(`:  ${inf.employee_name || '-'}`, 50, startY);
    doc.text(`:  ${docDate}`, 50, startY + 8);
    doc.text(`:  ${inf.employee_position || '-'}`, 50, startY + 16);

    const detailY = startY + 30;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('a. Rincian Produksi & Barang', 14, detailY);
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.2);
    doc.line(14, detailY + 2, 196, detailY + 2);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('No. Order / SPK', 14, detailY + 10);
    doc.text('Nama Barang', 14, detailY + 18);
    doc.text('Kategori', 14, detailY + 26);

    doc.setFont('helvetica', 'normal');
    doc.text(`:  ${inf.order_name_display || inf.order_name || '-'}`, 50, detailY + 10);
    doc.text(`:  ${inf.nama_barang_display || inf.nama_barang || '-'}`, 50, detailY + 18);
    doc.text(`:  ${inf.jenis_barang || '-'}`, 50, detailY + 26);

    const descY = detailY + 40;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('b. Deskripsi Kesalahan', 14, descY);
    doc.line(14, descY + 2, 196, descY + 2);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    const splitDesc = doc.splitTextToSize(inf.description || 'Tidak ada deskripsi rinci.', 182);
    doc.text(splitDesc, 14, descY + 10);
    const descHeight = splitDesc.length * 5;

    const finY = descY + descHeight + 15;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('c. Dampak Biaya (Beban)', 14, finY);
    doc.line(14, finY + 2, 196, finY + 2);

    const totalStr = inf.total ? `Rp ${inf.total.toLocaleString('id-ID')}` : '-';
    const qtyStr = inf.jumlah ? `${inf.jumlah}` : '-';
    const hargaStr = inf.harga ? `Rp ${inf.harga.toLocaleString('id-ID')}` : '-';

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Kuantitas (Qty)', 14, finY + 10);
    doc.text('Harga Satuan', 14, finY + 18);
    doc.text('Total Beban', 14, finY + 26);

    doc.setFont('helvetica', 'normal');
    doc.text(`:  ${qtyStr}`, 50, finY + 10);
    doc.text(`:  ${hargaStr}`, 50, finY + 18);
    doc.setFont('helvetica', 'bold');
    doc.text(`:  ${totalStr}`, 50, finY + 26);

    const sigY = finY + 50;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    doc.text('Mengetahui / Pencatat,', 30, sigY, { align: 'center' });
    doc.text('( _________________________ )', 30, sigY + 20, { align: 'center' });
    doc.text(inf.recorded_by_name || inf.recorded_by || 'Admin', 30, sigY + 25, { align: 'center' });

    doc.text('Karyawan Ybs,', 166, sigY, { align: 'center' });
    doc.text('( _________________________ )', 166, sigY + 20, { align: 'center' });
    doc.text(inf.employee_name || '-', 166, sigY + 25, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Dicetak: ${printedOnStr}`, 14, doc.internal.pageSize.height - 10);
    doc.text(`ID Record: ${inf.id}`, 196, doc.internal.pageSize.height - 10, { align: 'right' });

    const pdfOutput = doc.output('bloburl');
    window.open(pdfOutput, '_blank');
  };

  // Render JSX (entirely unchanged from original)
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5">
      {/* Filter Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Rentang Tanggal</span>
            <div className="flex items-center gap-2">
              <div className="w-[170px]">
                <DatePicker name="startDate" value={startDate} onChange={setStartDate} />
              </div>
              <div className="w-4 h-[1px] bg-gray-200"></div>
              <div className="w-[170px]">
                <DatePicker name="endDate" value={endDate} onChange={setEndDate} />
              </div>
              {isRefreshing && (
                <div className="ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-green-50">
                  <RefreshCw size={14} className="animate-spin text-green-500" />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-end gap-2 h-full pb-0.5 mt-auto">
            <button 
              onClick={generateExcel}
              className="flex items-center gap-2 px-6 h-[42px] bg-green-50 text-green-600 border border-green-100 rounded-xl text-[13px] font-bold hover:bg-green-500 hover:text-white hover:border-green-500 transition-all shadow-sm active:scale-95 group"
            >
              <FileSpreadsheet size={16} className="group-hover:scale-110 transition-transform" />
              Ekspor Excel
            </button>
            <button 
              onClick={generatePDF}
              className="flex items-center gap-2 px-6 h-[42px] bg-red-50 text-red-600 border border-red-100 rounded-xl text-[13px] font-bold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm active:scale-95 group"
            >
              <Printer size={16} className="group-hover:scale-110 transition-transform" />
              Cetak Rekap PDF
            </button>
          </div>
        </div>
      </div>

      {/* Search & Info Group */}
      <div className="flex flex-col gap-3 shrink-0">
        {(query || isRefreshing || selectedIds.size > 0) && (
          <div className="flex items-center justify-between px-1 shrink-0 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-3">
              {query && filtered.length !== data.length && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider border border-amber-100/50">
                    {filtered.length} HASIL PENCARIAN
                  </span>
                </div>
              )}

              {isRefreshing && (
                <div className="flex items-center gap-2 text-green-600 font-bold text-[11px] animate-pulse ml-2">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Memperbarui...</span>
                </div>
              )}

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                  <span className="text-gray-200 text-xs mx-1">|</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-gray-400">{selectedIds.size} dipilih</span>
                    <button 
                      onClick={clearSelection}
                      className="text-[11px] font-black text-rose-500 hover:text-rose-600 underline underline-offset-4"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="relative w-full shrink-0 group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Cari nama karyawan, deskripsi kesalahan, nomor faktur, atau referensi order..."
            className="w-full pl-12 pr-4 h-12 bg-white border border-gray-200 rounded-[14px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-0">
        <div className="overflow-auto flex-1 min-h-0 custom-scrollbar" onScroll={handleScroll}>
          <table className="text-left relative border-collapse table-fixed" style={{ width: Object.values(columnWidths).reduce((a, b) => a + b, 0), minWidth: '100%' }}>
            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-md">
              <tr className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                <th className="px-6 py-3 border-b border-gray-100 relative group" style={{ width: columnWidths.action }}>
                  Action
                  <div 
                    className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                    onMouseDown={(e) => { e.stopPropagation(); startResizing('action', e); }}
                  >
                    <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-3 border-b border-gray-100 relative group cursor-pointer hover:bg-gray-100/50" style={{ width: columnWidths.faktur }} onClick={() => handleSort('faktur')}>
                  <div className="flex items-center gap-2">Faktur <SortIcon config={sortConfig} sortKey="faktur" /></div>
                  <div 
                    className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                    onMouseDown={(e) => { e.stopPropagation(); startResizing('faktur', e); }}
                  >
                    <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-3 border-b border-gray-100 relative group cursor-pointer hover:bg-gray-100/50" style={{ width: columnWidths.date }} onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-2">Tanggal Kesalahan <SortIcon config={sortConfig} sortKey="date" /></div>
                  <div 
                    className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                    onMouseDown={(e) => { e.stopPropagation(); startResizing('date', e); }}
                  >
                    <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-3 border-b border-gray-100 relative group cursor-pointer hover:bg-gray-100/50" style={{ width: columnWidths.employee }} onClick={() => handleSort('employee')}>
                  <div className="flex items-center gap-2">Karyawan <SortIcon config={sortConfig} sortKey="employee" /></div>
                  <div 
                    className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                    onMouseDown={(e) => { e.stopPropagation(); startResizing('employee', e); }}
                  >
                    <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-3 border-b border-gray-100 relative group cursor-pointer hover:bg-gray-100/50" style={{ width: columnWidths.description }} onClick={() => handleSort('description')}>
                  <div className="flex items-center gap-2">Deskripsi <SortIcon config={sortConfig} sortKey="description" /></div>
                  <div 
                    className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                    onMouseDown={(e) => { e.stopPropagation(); startResizing('description', e); }}
                  >
                    <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-3 border-b border-gray-100 relative group cursor-pointer hover:bg-gray-100/50" style={{ width: columnWidths.item }} onClick={() => handleSort('item')}>
                  <div className="flex items-center gap-2">Item Detail <SortIcon config={sortConfig} sortKey="item" /></div>
                  <div 
                    className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                    onMouseDown={(e) => { e.stopPropagation(); startResizing('item', e); }}
                  >
                    <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right border-b border-gray-100 relative group cursor-pointer hover:bg-gray-100/50" style={{ width: columnWidths.qty }} onClick={() => handleSort('qty')}>
                  <div className="flex items-center justify-end gap-2">Qty <SortIcon config={sortConfig} sortKey="qty" /></div>
                  <div 
                    className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                    onMouseDown={(e) => { e.stopPropagation(); startResizing('qty', e); }}
                  >
                    <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right border-b border-gray-100 relative group cursor-pointer hover:bg-gray-100/50" style={{ width: columnWidths.harga }} onClick={() => handleSort('harga')}>
                  <div className="flex items-center justify-end gap-2">Harga <SortIcon config={sortConfig} sortKey="harga" /></div>
                  <div 
                    className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                    onMouseDown={(e) => { e.stopPropagation(); startResizing('harga', e); }}
                  >
                    <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right border-b border-gray-100 relative group cursor-pointer hover:bg-gray-100/50 font-bold" style={{ width: columnWidths.total }} onClick={() => handleSort('total')}>
                  <div className="flex items-center justify-end gap-2 text-gray-800">Total Beban <SortIcon config={sortConfig} sortKey="total" /></div>
                  <div 
                    className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                    onMouseDown={(e) => { e.stopPropagation(); startResizing('total', e); }}
                  >
                    <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-3 border-b border-gray-100 relative group cursor-pointer hover:bg-gray-100/50" style={{ width: columnWidths.reference }} onClick={() => handleSort('reference')}>
                  <div className="flex items-center gap-2">Reference <SortIcon config={sortConfig} sortKey="reference" /></div>
                  <div 
                    className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                    onMouseDown={(e) => { e.stopPropagation(); startResizing('reference', e); }}
                  >
                    <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-gray-100">
                        <FileText className="text-gray-200" size={32} />
                      </div>
                      <h3 className="text-base font-bold text-gray-800 mb-2">
                        {query ? 'Pencarian Tidak Ditemukan' : 'Riwayat Masih Kosong'}
                      </h3>
                      <p className="text-sm text-gray-400 max-w-[280px] mx-auto leading-relaxed font-medium">
                        {query 
                          ? 'Coba gunakan kata kunci lain atau periksa kembali rentang tanggal filter Anda.'
                          : 'Mulai catat kesalahan karyawan melalui tab "Tambah Data".'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((inf, idx) => {
                  const isSelected = selectedIds.has(inf.id);
                  const isOdd = idx % 2 === 1;
                  return (
                    <tr 
                      key={inf.id} 
                      onClick={(e) => handleRowClick(inf.id, e)}
                      className={`transition-all group relative select-none cursor-pointer ${
                        isSelected 
                          ? 'bg-green-50 shadow-[inset_4px_0_0_0_#16a34a]' 
                          : `hover:bg-green-50/30 ${isOdd ? 'bg-gray-50/40' : 'bg-white'}`
                      }`}
                    >
                      <td className="px-6 py-2.5 whitespace-nowrap overflow-hidden">
                        <div className={`flex items-center gap-1.5 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                          <button
                            onClick={(e) => { e.stopPropagation(); generateSinglePDF(inf); }}
                            className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100 px-2 py-1 rounded-lg transition-all"
                            title="Cetak PDF Faktur"
                          >
                            <FileText size={12} />
                            PDF
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onEdit?.(inf); }}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit Data"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(inf.id); }}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Data"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                      <td className={`px-6 py-2.5 text-[11px] font-bold transition-colors whitespace-nowrap overflow-hidden ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>
                        {inf.faktur || '-'}
                      </td>
                      <td className={`px-6 py-2.5 text-[13px] font-bold transition-colors whitespace-nowrap overflow-hidden ${isSelected ? 'text-green-700' : 'text-gray-500'}`}>
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className={isSelected ? 'text-green-500' : 'text-gray-300'} />
                          {formatIndoDateStr(inf.date)}
                        </div>
                      </td>
                      <td className="px-6 py-2.5 overflow-hidden">
                        <p className={`font-bold text-[14px] leading-snug transition-colors ${isSelected ? 'text-green-900' : 'text-gray-800'}`}>
                          {inf.employee_name || 'Karyawan Dihapus'}
                        </p>
                        {inf.employee_position && (
                          <p className={`text-[11px] font-medium truncate mt-0.5 ${isSelected ? 'text-green-600/70' : 'text-gray-400'}`} title={inf.employee_position}>
                            {inf.employee_position}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-2.5 overflow-hidden">
                        <p className={`text-[13px] leading-relaxed line-clamp-2 transition-colors ${isSelected ? 'text-green-800/80' : 'text-gray-500'}`} title={inf.description}>
                          {inf.description || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-2.5 overflow-hidden">
                        <div className={`font-bold text-[13px] truncate transition-colors ${isSelected ? 'text-green-900' : 'text-gray-800'}`} title={inf.nama_barang_display || inf.nama_barang || ''}>
                          {inf.nama_barang_display || inf.nama_barang || '-'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded border ${isSelected ? 'bg-green-100 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                            {inf.jenis_barang || '-'}
                          </span>
                        </div>
                      </td>
                      <td className={`px-6 py-2.5 text-right tabular-nums text-[13px] font-bold transition-colors overflow-hidden ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
                        {inf.jumlah || 0}
                      </td>
                      <td className={`px-6 py-2.5 text-right tabular-nums text-[13px] font-medium transition-colors overflow-hidden ${isSelected ? 'text-green-600/60' : 'text-gray-400'}`}>
                        {inf.harga ? inf.harga.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className={`px-6 py-2.5 text-right tabular-nums text-[14px] font-black transition-colors overflow-hidden ${isSelected ? 'text-green-600' : 'text-emerald-600'}`}>
                        {inf.total ? inf.total.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-2.5 overflow-hidden">
                        {(inf.order_name_display || inf.order_name) ? (
                          <span className={`inline-block px-2 py-1 rounded-lg border font-bold truncate transition-colors ${isSelected ? 'bg-green-100 border-green-200 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`} title={inf.order_name_display || inf.order_name || ''}>
                            {inf.order_name_display || inf.order_name}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 mt-auto shrink-0">
        <span className="text-[12px] font-bold text-gray-400">
          {filtered.length === 0
            ? 'Tidak ada data tersedia'
            : `Menampilkan ${paginated.length} dari ${filtered.length} riwayat kesalahan terdata`}
        </span>
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
