'use client';

import { useState, useMemo, useEffect, useCallback, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, Calendar, FileText, Printer, Download, RefreshCw } from 'lucide-react';
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
}: { 
  infractions: Infraction[];
  onEdit?: (inf: Infraction) => void;
  onPeriodChange?: (start: string, end: string) => void;
  onRefresh?: (period?: { start: string; end: string }) => Promise<void>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [infractions, setInfractions] = useState<Infraction[]>(initial);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
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
    doc.text('LAPORAN RINCIAN KESALAHAN KARYAWAN', 14, 42);
    
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
    doc.text('FORMULIR KESALAHAN KARYAWAN', 105, 45, { align: 'center' });
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
    doc.text('A. RINCIAN PRODUKSI & BARANG', 14, detailY);
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
    doc.text('B. DESKRIPSI KESALAHAN', 14, descY);
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
    doc.text('C. DAMPAK BIAYA (BEBAN)', 14, finY);
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
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      {/* Search */}
      {/* Date Filter & PDF Export Panel */}
      <div className="flex justify-center w-full shrink-0">
        <div className="card glass relative z-20 overflow-visible p-3 px-6 border border-emerald-500/10 w-fit flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Filter Periode</span>
            <div className="w-[160px] relative">
              <DatePicker 
                name="startDate"
                value={startDate}
                onChange={setStartDate}
              />
            </div>
            <span className="text-slate-400 font-medium">-</span>
            <div className="w-[160px] relative">
              <DatePicker 
                name="endDate"
                value={endDate}
                onChange={setEndDate}
              />
            </div>
            {isRefreshing && (
              <div className="p-2.5 text-emerald-600">
                <RefreshCw size={18} className="animate-spin" />
              </div>
            )}
          </div>

          <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>

          <button 
            onClick={generatePDF}
            className="w-full sm:w-auto h-[36px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-6 rounded-xl text-xs font-semibold shadow-md shadow-red-500/20 transition-all whitespace-nowrap"
          >
            <FileText size={14} />
            Cetak PDF (A4)
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full shrink-0">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Cari karyawan, deskripsi..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden flex-1 flex flex-col border border-slate-200 shadow-sm min-h-0">
        <div className="overflow-auto bg-white flex-1 min-h-0 custom-scrollbar" onScroll={handleScroll}>
          <table className="w-full text-left relative min-w-[1000px]">
                <thead className="sticky top-0 z-10">
                  <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 font-semibold w-24 whitespace-nowrap">Aksi</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">Faktur</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">Tanggal</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">Karyawan</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">Deskripsi</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">Barang</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap text-right">Qty</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap text-right">Harga</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap text-right">Total</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">Order</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">Admin</th>
                  </tr>
                </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500 italic text-sm">
                    {query ? 'Tidak ada hasil yang cocok.' : 'Belum ada riwayat kesalahan.'}
                  </td>
                </tr>
              ) : (
                paginated.map((inf) => (
                  <tr key={inf.id} className="text-xs hover:bg-slate-50 transition-colors group">
                    <td className="px-3 py-1.5 w-24 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => generateSinglePDF(inf)}
                          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-1.5 py-0.5 rounded transition-colors shadow-sm"
                          title="Cetak PDF Faktur"
                        >
                          <FileText size={11} />
                          <span className="text-[9px] font-bold">PDF</span>
                        </button>
                        <button
                          onClick={() => startEdit(inf)}
                          className="p-1 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => requestDelete(inf.id)}
                          disabled={deleting === inf.id}
                          className="p-1 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Hapus"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[9px] text-slate-500 whitespace-nowrap">
                      {inf.faktur || '-'}
                    </td>
                    <td className="px-3 py-1.5 text-slate-600 text-[10px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} className="opacity-40" />
                        {formatIndoDateStr(inf.date)}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-emerald-600 truncate max-w-[150px]">
                      {inf.employee_name || 'Karyawan Dihapus'}
                      {inf.employee_position && (
                        <div className="text-[9px] text-slate-400 font-normal mt-0.5 truncate max-w-[150px]" title={inf.employee_position}>
                          {inf.employee_position}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-slate-600 max-w-[300px]">
                      <div className="text-[10px] line-clamp-2 leading-relaxed" title={inf.description}>
                        {inf.description || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 truncate max-w-[200px]" title={inf.nama_barang_display || inf.nama_barang || ''}>
                      <div className="font-medium text-slate-700 text-[10px]">{inf.nama_barang_display || inf.nama_barang || '-'}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">
                          {inf.jenis_barang || '-'}
                        </span>
                        {inf.item_faktur && (
                          <>
                            <span className="text-slate-300 text-[9px]">•</span>
                            <span className="text-[9px] font-mono text-slate-400 border border-slate-200 bg-slate-50 px-1 rounded">
                              {inf.item_faktur}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[11px]">
                      {inf.jumlah || 0}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums" title={inf.jenis_harga || ''}>
                      <div className="text-slate-600 text-[11px]">
                        {inf.harga ? inf.harga.toLocaleString('id-ID') : '-'}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 truncate max-w-[80px] ml-auto">
                        {inf.jenis_harga || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-medium text-emerald-700">
                      {inf.total ? inf.total.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-[10px]">
                      {(inf.order_name_display || inf.order_name) ? (
                        <span className="inline-block bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20 max-w-[150px] truncate" title={inf.order_name_display || inf.order_name || ''}>
                          {inf.order_name_display || inf.order_name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-[10px] text-slate-400 whitespace-nowrap">
                      <div>{inf.recorded_by_name || inf.recorded_by}</div>
                      {inf.recorded_by_position && (
                        <div className="text-[10px] text-slate-300 font-normal mt-0.5" title={inf.recorded_by_position}>
                          {inf.recorded_by_position}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
        <span className="font-medium">
          {filtered.length === 0
            ? 'Tidak ada data'
            : `Menampilkan ${paginated.length} dari ${filtered.length} riwayat`}
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
