'use client';

import { useState, useMemo, useEffect, useCallback, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, Calendar, FileText, Printer, Download, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

import ConfirmDialog, { DialogType } from '@/components/ConfirmDialog';
import DatePicker from '@/components/DatePicker';
import { getInfractions } from '@/lib/actions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PAGE_SIZE = 50;

// Helper to format Date to YYYY-MM-DD
function formatDateToYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper to format "DD-MM-YYYY" or "YYYY-MM-DD" string to "DD MMM YYYY"
function formatIndoDateStr(tglStr: string) {
  if (!tglStr) return '';
  const cleanStr = tglStr.slice(0, 10);
  const parts = cleanStr.includes('-') ? cleanStr.split('-') : [];
  if (parts.length === 3) {
    let d;
    if (parts[0].length === 4) {
      d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T12:00:00Z`);
    } else {
      d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
    }
    if (d && !isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return tglStr;
}

interface Infraction {
  id: number;
  employee_name: string;
  employee_no?: string | null;
  employee_position?: string | null;
  description: string;
  date: string;
  recorded_by: string;
  recorded_by_name?: string | null;
  recorded_by_position?: string | null;
  recorded_by_id?: number | null;
  order_name: string | null;
  order_name_display?: string | null;
  order_faktur?: string | null;
  faktur: string | null;
  jenis_barang?: string | null;
  nama_barang?: string | null;
  nama_barang_display?: string | null;
  item_faktur?: string | null;
  jenis_harga?: string | null;
  jumlah?: number | null;
  harga?: number | null;
  total?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export default function InfractionsTable({ 
  infractions: initial,
  onEdit,
  onPeriodChange,
  onRefresh,
  initialStartDate,
  initialEndDate,
}: { 
  infractions: Infraction[];
  onEdit?: (inf: Infraction) => void;
  onPeriodChange?: (start: string, end: string) => void;
  onRefresh?: (period?: { start: string; end: string }) => Promise<void>;
  initialStartDate?: string;
  initialEndDate?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [infractions, setInfractions] = useState<Infraction[]>(initial);
  
  // Initialize dates from props if available, otherwise fallback to today
  const [startDate, setStartDate] = useState<Date>(() => {
    if (initialStartDate) {
      const d = new Date(initialStartDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  
  const [endDate, setEndDate] = useState<Date>(() => {
    if (initialEndDate) {
      const d = new Date(initialEndDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [deleting, setDeleting] = useState<number | null>(null);
  
  // Sync state with props when server data changes
  useEffect(() => {
    setInfractions(initial);
  }, [initial]);

  // Auto-fetch data on date change
  const initialMount = useRef(true);
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    fetchFilteredData();
  }, [startDate, endDate]);

  const fetchFilteredData = async () => {
    setIsRefreshing(true);
    try {
      const start = formatDateToYYYYMMDD(startDate);
      const end = formatDateToYYYYMMDD(endDate);
      // Use client-side API for fast fetch (no server action overhead)
      const res = await fetch(`/api/infractions?start=${start}&end=${end}`);
      if (res.ok) {
        const json = await res.json();
        setInfractions(json.data || []);
        if (onPeriodChange) onPeriodChange(start, end);
      }
      setVisibleCount(PAGE_SIZE);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const startStr = formatIndoDateStr(formatDateToYYYYMMDD(startDate));
    const endStr = formatIndoDateStr(formatDateToYYYYMMDD(endDate));

    // Header Perusahaan
    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.setFont('helvetica', 'bold');
    doc.text('PT. Buya Barokah', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont('helvetica', 'normal');
    doc.text('Div. Percetakan', 14, 26);
    
    // Header Right Text
    doc.setFontSize(8);
    doc.text('SIKKA - Sistem Informasi Pencatatan Kesalahan Karyawan', 196, 20, { align: 'right' });
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    // Judul Laporan
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont('helvetica', 'bold');
    doc.text('Laporan Rincian Kesalahan Karyawan', 14, 42);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const printedOnStr = formatIndoDateStr(formatDateToYYYYMMDD(new Date()));
    doc.text(`Periode: ${startStr} s/d ${endStr}`, 14, 48);
    doc.text(`Total Data: ${infractions.length}`, 14, 56);

    const tableData = infractions.map((inf: Infraction, idx: number) => [
      idx + 1,
      formatIndoDateStr(inf.date),
      inf.employee_name || '-',
      inf.faktur || '-',
      inf.order_name_display || '-',
      inf.nama_barang_display || '-',
      inf.description || '-',
      inf.total ? `Rp ${inf.total.toLocaleString('id-ID')}` : '-'
    ]);

    const grandTotal = infractions.reduce((sum, inf) => sum + (inf.total || 0), 0);
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
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(pageStr, 14, doc.internal.pageSize.height - 10);
        doc.text(printStr, 196, doc.internal.pageSize.height - 10, { align: 'right' });
      }
    });

    const pdfOutput = doc.output('bloburl');
    window.open(pdfOutput, '_blank');
  };

  const generateExcel = () => {
    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr = formatDateToYYYYMMDD(endDate);
    
    // Prepare data for Excel
    const data = infractions.map((inf, idx) => ({
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

    // Create Worksheet
    const ws = utils.json_to_sheet(data);
    
    // Set column widths
    const wscols = [
      { wch: 5 },  // No
      { wch: 12 }, // Tanggal
      { wch: 25 }, // Karyawan
      { wch: 20 }, // Posisi
      { wch: 15 }, // No. Faktur
      { wch: 25 }, // Order Produksi
      { wch: 30 }, // Nama Barang
      { wch: 15 }, // Jenis Barang
      { wch: 40 }, // Deskripsi
      { wch: 8 },  // Qty
      { wch: 15 }, // Harga Satuan
      { wch: 15 }, // Total Beban
      { wch: 20 }, // Pencatat
    ];
    ws['!cols'] = wscols;

    // Create Workbook
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Laporan Kesalahan');

    // Save File
    writeFile(wb, `Laporan_Kesalahan_${startStr}_sd_${endStr}.xlsx`);
  };

  const generateSinglePDF = (inf: Infraction) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const docDate = formatIndoDateStr(inf.date);
    const printedOnStr = formatIndoDateStr(formatDateToYYYYMMDD(new Date()));

    // --- HEADER ---
    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.setFont('helvetica', 'bold');
    doc.text('PT. Buya Barokah', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont('helvetica', 'normal');
    doc.text('Div. Percetakan', 14, 26);
    
    // SIKKA branding top right
    doc.setFontSize(8);
    doc.text('SIKKA - Sistem Informasi Pencatatan Kesalahan Karyawan', 196, 20, { align: 'right' });
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    // --- TITLE ---
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont('helvetica', 'bold');
    doc.text('Formulir Kesalahan Karyawan', 105, 45, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`No. Referensi: ${inf.faktur || '-'}`, 105, 52, { align: 'center' });

    // --- DATA KARYAWAN & WAKTU ---
    const startY = 65;
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    // Left Column
    doc.setFont('helvetica', 'bold');
    doc.text('Nama Karyawan', 14, startY);
    doc.text('Tanggal Kejadian', 14, startY + 8);
    doc.text('Posisi / Bagian', 14, startY + 16);

    doc.setFont('helvetica', 'normal');
    doc.text(`:  ${inf.employee_name || '-'}`, 50, startY);
    doc.text(`:  ${docDate}`, 50, startY + 8);
    doc.text(`:  ${inf.employee_position || '-'}`, 50, startY + 16);

    // --- RINCIAN PRODUKSI ---
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

    // --- DESKRIPSI KEJADIAN ---
    const descY = detailY + 40;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('b. Deskripsi Kesalahan', 14, descY);
    doc.line(14, descY + 2, 196, descY + 2);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    const splitDesc = doc.splitTextToSize(inf.description || 'Tidak ada deskripsi rinci.', 182);
    doc.text(splitDesc, 14, descY + 10);

    // Calculaate next Y based on description length
    const descHeight = splitDesc.length * 5;

    // --- DAMPAK FINANCIAL ---
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

    // --- SIGNATURES ---
    const sigY = finY + 50;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    doc.text('Mengetahui / Pencatat,', 30, sigY, { align: 'center' });
    doc.text('( _________________________ )', 30, sigY + 20, { align: 'center' });
    doc.text(inf.recorded_by_name || inf.recorded_by || 'Admin', 30, sigY + 25, { align: 'center' });

    doc.text('Karyawan Ybs,', 166, sigY, { align: 'center' });
    doc.text('( _________________________ )', 166, sigY + 20, { align: 'center' });
    doc.text(inf.employee_name || '-', 166, sigY + 25, { align: 'center' });


    // --- FOOTER ---
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Dicetak: ${printedOnStr}`, 14, doc.internal.pageSize.height - 10);
    doc.text(`ID Record: ${inf.id}`, 196, doc.internal.pageSize.height - 10, { align: 'right' });


    const pdfOutput = doc.output('bloburl');
    window.open(pdfOutput, '_blank');
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeletingConfirm, setIsDeletingConfirm] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: DialogType;
    title: string;
    message: string;
  }>({ isOpen: false, type: 'alert', title: '', message: '' });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));
  const closeConfirm = () => {
    setConfirmDeleteId(null);
    setIsDeletingConfirm(false);
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return infractions;
    const q = query.toLowerCase();
    return infractions.filter(
      (inf) =>
        inf.employee_name?.toLowerCase().includes(q) ||
        inf.description?.toLowerCase().includes(q) ||
        inf.recorded_by?.toLowerCase().includes(q) ||
        inf.date?.includes(q) ||
        inf.faktur?.toLowerCase().includes(q) ||
        inf.order_name?.toLowerCase().includes(q) ||
        inf.nama_barang?.toLowerCase().includes(q)
    );
  }, [infractions, query]);

  const paginated = filtered.slice(0, visibleCount);

  const startEdit = (inf: Infraction) => {
    onEdit?.(inf);
  };

  const requestDelete = (id: number) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = async () => {
    if (confirmDeleteId === null) return;
    const id = confirmDeleteId;
    
    setIsDeletingConfirm(true);
    setDeleting(id);
    try {
      const res = await fetch(`/api/infractions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInfractions(prev => prev.filter(inf => inf.id !== id));
        router.refresh();
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
      setDeleting(null);
      setIsDeletingConfirm(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (visibleCount < filtered.length) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
      }
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sikka_data_updated') {
        fetchFilteredData();
        startTransition(() => {
          router.refresh();
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router, startDate, endDate]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4">
      {/* Filter & Search Panel - Polished Grouped Style */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-4">
        {/* Panel Atas: Filter & PDF */}
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Rentang Tanggal</span>
              <div className="flex items-center gap-2">
                <div className="w-[170px]">
                  <DatePicker 
                    name="startDate"
                    value={startDate}
                    onChange={setStartDate}
                  />
                </div>
                <div className="w-4 h-[1px] bg-gray-200"></div>
                <div className="w-[170px]">
                  <DatePicker 
                    name="endDate"
                    value={endDate}
                    onChange={setEndDate}
                  />
                </div>
                {isRefreshing && (
                  <div className="ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-green-50">
                    <RefreshCw size={14} className="animate-spin text-green-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={generateExcel}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-50 text-green-600 border border-green-100 rounded-xl text-[13px] font-bold hover:bg-green-500 hover:text-white hover:border-green-500 transition-all shadow-sm active:scale-95 group"
            >
              <FileSpreadsheet size={18} className="group-hover:scale-110 transition-transform" />
              Ekspor Excel
            </button>
            <button 
              onClick={generatePDF}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[13px] font-bold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm active:scale-95 group"
            >
              <Printer size={18} className="group-hover:scale-110 transition-transform" />
              Cetak Rekap PDF
            </button>
          </div>
        </div>

        {/* Panel Bawah: Search */}
        <div className="relative w-full group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors" />
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Cari nama karyawan, deskripsi kesalahan, nomor faktur, atau referensi order..."
            className="w-full pl-12 pr-4 h-11 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all text-sm font-medium"
          />
        </div>
      </div>

      {/* Table Container - Premium Elevated Content */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-0">
        <div className="overflow-auto flex-1 min-h-0 custom-scrollbar" onScroll={handleScroll}>
          <table className="w-full text-left relative min-w-[1300px] border-collapse">
             <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-md">
              <tr className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                <th className="px-6 py-3 w-36 border-b border-gray-100">Action</th>
                <th className="px-6 py-3 w-28 border-b border-gray-100">Faktur</th>
                <th className="px-6 py-3 w-36 border-b border-gray-100">Tanggal</th>
                <th className="px-6 py-3 min-w-[180px] border-b border-gray-100">Karyawan</th>
                <th className="px-6 py-3 min-w-[220px] border-b border-gray-100">Deskripsi</th>
                <th className="px-6 py-3 min-w-[200px] border-b border-gray-100">Item Detail</th>
                <th className="px-6 py-3 text-right w-16 border-b border-gray-100">Qty</th>
                <th className="px-6 py-3 text-right w-32 border-b border-gray-100">Harga</th>
                <th className="px-6 py-3 text-right w-32 border-b border-gray-100 font-bold text-gray-800">Total Beban</th>
                <th className="px-6 py-3 min-w-[160px] border-b border-gray-100">Reference</th>
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
                paginated.map((inf) => (
                  <tr key={inf.id} className="hover:bg-slate-50/50 transition-all group relative border-l-4 border-l-transparent hover:border-l-emerald-500">
                    <td className="px-6 py-3 w-36 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => generateSinglePDF(inf)}
                          className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100 px-2 py-1 rounded-lg transition-all"
                          title="Cetak PDF Faktur"
                        >
                          <FileText size={12} />
                          PDF
                        </button>
                        <button
                          onClick={() => startEdit(inf)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Data"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => requestDelete(inf.id)}
                          disabled={deleting === inf.id}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                          title="Hapus Data"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-3 w-28 font-mono text-[11px] text-gray-400 whitespace-nowrap group-hover:text-gray-600 transition-colors">
                      {inf.faktur || '-'}
                    </td>
                    <td className="px-6 py-3 w-36 text-gray-500 text-[13px] font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-gray-300" />
                        {formatIndoDateStr(inf.date)}
                      </div>
                    </td>
                    <td className="px-6 py-3 min-w-[180px]">
                      <p className="font-bold text-gray-800 text-[14px] leading-snug">{inf.employee_name || 'Karyawan Dihapus'}</p>
                      {inf.employee_position && (
                        <p className="text-[11px] text-gray-400 font-medium truncate max-w-[160px] mt-0.5" title={inf.employee_position}>
                          {inf.employee_position}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3 min-w-[220px]">
                      <p className="text-[13px] text-gray-500 leading-relaxed max-w-[220px] line-clamp-2" title={inf.description}>
                        {inf.description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-3 min-w-[200px]">
                      <div className="font-bold text-gray-800 text-[13px] truncate max-w-[190px]" title={inf.nama_barang_display || inf.nama_barang || ''}>{inf.nama_barang_display || inf.nama_barang || '-'}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                          {inf.jenis_barang || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums text-[13px] font-bold text-gray-600">
                      {inf.jumlah || 0}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums text-[13px] font-medium text-gray-400">
                      {inf.harga ? inf.harga.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums text-[14px] font-black text-emerald-600">
                      {inf.total ? inf.total.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-3 min-w-[160px] text-[11px]">
                      {(inf.order_name_display || inf.order_name) ? (
                        <span className="inline-block bg-slate-50 text-slate-400 px-2 py-1 rounded-lg border border-slate-100 font-bold max-w-[150px] truncate" title={inf.order_name_display || inf.order_name || ''}>
                          {inf.order_name_display || inf.order_name}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info - Polished */}
      <div className="flex items-center justify-between text-xs text-slate-400 shrink-0">
        <span className="font-medium">
          {filtered.length === 0
            ? 'Tidak ada data tersedia'
            : `Menampilkan ${paginated.length} dari ${filtered.length} riwayat kesalahan terdata`}
        </span>
      </div>

      {/* Dialogs */}
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
