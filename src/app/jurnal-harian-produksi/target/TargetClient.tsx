'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Printer, Loader2, ArrowLeft, Image as ImageIcon, RefreshCw, AlertCircle, Copy, Check, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import DatePicker from '@/components/DatePicker';
import SearchableDropdown from '@/components/SearchableDropdown';
import { domToBlob, domToPng } from 'modern-screenshot';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatIndoDate(dateStr: string) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return `${HARI[dt.getDay()]}, ${d} ${BULAN[Number(m) - 1]} ${y}`;
}

function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getJam(shift: string) {
  const s = String(shift || '').trim();
  if (s === '1') return '07.00 – 15.00';
  if (s === '2') return '15.00 – 23.00';
  if (s === '3') return '23.00 – 07.00';
  return '–';
}

export default function TargetClient() {
  const [dateStr, setDateStr] = useState<string>(getTodayStr);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingImage, setSavingImage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ks1, setKs1] = useState('');
  const [ks2, setKs2] = useState('');
  const [ks3, setKs3] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setKs1(localStorage.getItem('jhp_target_ks1') || '');
      setKs2(localStorage.getItem('jhp_target_ks2') || '');
      setKs3(localStorage.getItem('jhp_target_ks3') || '');
    }
  }, []);

  // Save coordinators to localStorage when changed
  useEffect(() => {
    if (ks1 || ks2 || ks3) {
      localStorage.setItem('jhp_target_ks1', ks1);
      localStorage.setItem('jhp_target_ks2', ks2);
      localStorage.setItem('jhp_target_ks3', ks3);
    }
  }, [ks1, ks2, ks3]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async (selectedDate: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/jurnal-harian-produksi?startDate=${selectedDate}&endDate=${selectedDate}&limit=500`);
      const result = await res.json();
      if (result.success) {
        const sorted = [...result.data].sort((a, b) => {
          // 1. Group by Bagian (Section) using the official 'bagian' column
          const sections = ['SETTING', 'QUALITY CONTROL', 'CETAK', 'FINISHING', 'GUDANG', 'TEKNISI'];
          const getBagianInfo = (row: any) => {
            const b = String(row.bagian || '').toUpperCase();
            const jp = (row.jenis_pekerjaan || '').toLowerCase();
            const index = sections.indexOf(b);
            return {
              index: index === -1 ? 99 : index,
              isKoordinasi: jp.includes('koordinasi'),
              absensi: Number(row.absensi || 0),
              id: Number(row.id || 0)
            };
          };

          const infoA = getBagianInfo(a);
          const infoB = getBagianInfo(b);

          // 2. Sort by Section Priority
          if (infoA.index !== infoB.index) return infoA.index - infoB.index;

          // 3. Within same Section, Koordinasi goes first
          if (infoA.isKoordinasi && !infoB.isKoordinasi) return -1;
          if (!infoA.isKoordinasi && infoB.isKoordinasi) return 1;

          // 4. Then sort by Absensi
          if (infoA.absensi !== infoB.absensi) return infoA.absensi - infoB.absensi;

          // 5. Final tie-breaker: ID (Order of insertion/Excel)
          return infoA.id - infoB.id;
        });
        setData(sorted);
      } else {
        setError(result.error || 'Gagal memuat data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(dateStr); }, [dateStr, fetchData]);

  useEffect(() => {
    fetch('/api/employees?limit=500')
      .then(res => res.json())
      .then(json => {
        if (json.success) setEmployees(json.data || []);
      })
      .catch(err => console.error('Failed to fetch employees', err));
  }, []);

  const handlePrint = async () => {
    if (generatingPdf || !printRef.current) return;
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Set Metadata
      doc.setProperties({
        title: `Jadwal_Produksi_${dateStr}`
      });

      // Capture ONLY the header section (branding + coordinators) as a high-res image
      const headerArea = printRef.current.querySelector('#report-header');
      const coordArea = printRef.current.querySelector('#report-coordinators');
      
      if (!headerArea || !coordArea) {
        throw new Error('Header or Coordinator area not found');
      }
      
      // We'll capture everything above the table
      const headerContainer = document.createElement('div');
      headerContainer.style.width = `${printRef.current.offsetWidth}px`;
      headerContainer.style.background = 'white';
      headerContainer.style.padding = '0'; // Remove padding to align with table margins
      
      // Clone the header and coordinator elements
      const brandingClone = headerArea.cloneNode(true);
      const coordClone = coordArea.cloneNode(true);
      headerContainer.appendChild(brandingClone);
      headerContainer.appendChild(coordClone);
      
      document.body.appendChild(headerContainer);
      const headerDataUrl = await domToPng(headerContainer, { scale: 3, backgroundColor: '#ffffff' });
      const headerImg = new Image();
      headerImg.src = headerDataUrl;
      await new Promise(r => headerImg.onload = r);
      document.body.removeChild(headerContainer);

      const headerWidthMm = 200; // Fixed A4 width (210) minus 5mm margins on each side
      const headerHeightMm = (headerImg.height / headerImg.width) * headerWidthMm;

      // Add the pixel-perfect header image to PDF starting at the exact same margin (5mm)
      doc.addImage(headerDataUrl, 'PNG', 5, 5, headerWidthMm, headerHeightMm, undefined, 'FAST');

      // 4. Map Data for Table
      const tableRows = data.map((row, i) => [
        i + 1,
        row.shift || '–',
        getJam(row.shift),
        row.nama_karyawan || '–',
        row.no_order || '–',
        row.nama_order || '–',
        row.jenis_pekerjaan || '–',
        row.keterangan || '–',
        row.target !== null && row.target !== '' && row.target !== undefined
          ? !isNaN(Number(row.target)) && row.target !== '-'
            ? Number(row.target).toLocaleString('id-ID')
            : row.target
          : '–'
      ]);

      // 5. Generate Table with autoTable
      autoTable(doc, {
        startY: 5 + headerHeightMm + 2, // Start below the image header
        head: [['No.', 'Sft', 'Jam Kerja', 'Nama Karyawan', 'No. Order', 'Nama Order', 'Pekerjaan', 'Keterangan', 'Target']],
        body: tableRows,
        theme: 'grid',
        styles: {
          fontSize: 5,
          cellPadding: 0.8,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          font: 'helvetica',
          textColor: [40, 40, 40],
          minCellHeight: 0
        },
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: [40, 40, 40],
          fontSize: 5,
          fontStyle: 'bold',
          halign: 'center',
          lineWidth: 0.2
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 6 },
          1: { halign: 'center', cellWidth: 6 },
          2: { halign: 'center', cellWidth: 15 },
          3: { fontStyle: 'bold', cellWidth: 25 },
          4: { cellWidth: 22 },
          5: { cellWidth: 'auto' }, // Let Nama Order take remaining space
          8: { halign: 'right', fontStyle: 'bold', cellWidth: 10 }
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252]
        },
        margin: { top: 5, left: 5, right: 5, bottom: 5 }
      });

      // 6. Output to New Tab
      const pdfBlob = doc.output('blob');
      const filename = `Jadwal_Produksi_${dateStr}.pdf`;
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(file);
      window.open(blobUrl, '_blank');

    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Gagal membuat PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };
  const handleDownloadImage = async () => {
    if (!printRef.current || savingImage) return;
    setSavingImage(true);
    try {
      // Capture the full content as a single data URL
      const scale = 2;
      const dataUrl = await domToPng(printRef.current, {
        scale,
        backgroundColor: '#ffffff',
      });
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      // Get precise header position from DOM
      const headerEl = printRef.current.querySelector('thead');
      const containerRect = printRef.current.getBoundingClientRect();
      const headerRect = headerEl?.getBoundingClientRect();
      
      const headerTopPx = headerRect ? (headerRect.top - containerRect.top) * scale : 0;
      const headerHeightPx = headerRect ? headerRect.height * scale : 40;

      // Calculate A4 dimensions in pixels
      const a4PageHeightPx = (img.width / 210) * 297;
      let totalPages = Math.ceil(img.height / a4PageHeightPx);

      for (let i = 0; i < totalPages; i++) {
        let startY = i * a4PageHeightPx;
        let currentChunkHeight = a4PageHeightPx;
        let drawOffset = 0;

        // If not the first page, we repeat header and adjust start
        if (i > 0) {
          drawOffset = headerHeightPx;
          // Shift start slightly back to avoid gaps caused by repeating headers
          startY = (i * a4PageHeightPx) - (i * headerHeightPx);
        }
        
        // Merge tiny last pages
        if (i === totalPages - 2) {
          const lastPageHeight = img.height - (startY + currentChunkHeight);
          if (lastPageHeight < a4PageHeightPx * 0.2) {
            currentChunkHeight = img.height - startY;
            totalPages = i + 1; 
          }
        } else if (i === totalPages - 1) {
          currentChunkHeight = img.height - startY;
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = currentChunkHeight + (i > 0 ? headerHeightPx : 0);
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (i > 0 && headerRect) {
            ctx.drawImage(
              img, 
              0, headerTopPx, img.width, headerHeightPx, 
              0, 0, img.width, headerHeightPx
            );
          }

          ctx.drawImage(
            img, 
            0, startY, img.width, currentChunkHeight, 
            0, drawOffset, img.width, currentChunkHeight
          );
          
          const pageDataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pageDataUrl;
          link.download = `Jadwal_Produksi_${dateStr}_Hal_${i + 1}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        if (totalPages > 1) {
          await new Promise(r => setTimeout(r, 600));
        }
      }
    } catch (err) {
      console.error('Failed to download images', err);
      alert('Gagal mendownload gambar. Pastikan Anda mengizinkan download otomatis.');
    } finally {
      setSavingImage(false);
    }
  };

  const selectedDateObj = new Date(dateStr);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden print:overflow-visible print:block print:h-auto">

      {/* ── CONDENSED CONTROL PANEL ── */}
      <div className="print:hidden bg-white border border-gray-100 rounded-2xl p-3 shadow-sm shrink-0 mb-6 mx-1 flex flex-wrap items-center gap-3">
        {/* Date Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(dateStr)}
            disabled={loading}
            title="Muat Ulang"
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border-green-200 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="w-[180px]">
             <DatePicker 
               name="filter_date"
               value={selectedDateObj}
               onChange={(d) => {
                 const y = d.getFullYear();
                 const m = String(d.getMonth() + 1).padStart(2, '0');
                 const day = String(d.getDate()).padStart(2, '0');
                 setDateStr(`${y}-${m}-${day}`);
               }}
             />
          </div>
        </div>

        <div className="hidden lg:block w-px h-6 bg-gray-100" />

        {/* Coordinators Section */}
        <div className="flex-1 flex items-center gap-2 min-w-[400px]">
          <div className="flex-1 grid grid-cols-3 gap-2">
            <SearchableDropdown
              id="ks1"
              items={employees.map(e => e.name).filter(Boolean).map(String)}
              value={ks1}
              onChange={setKs1}
              placeholder="Koord. Shift 1"
              className="font-bold"
              triggerWidth="w-full"
            />
            <SearchableDropdown
              id="ks2"
              items={employees.map(e => e.name).filter(Boolean).map(String)}
              value={ks2}
              onChange={setKs2}
              placeholder="Koord. Shift 2"
              className="font-bold"
              triggerWidth="w-full"
            />
            <SearchableDropdown
              id="ks3"
              items={employees.map(e => e.name).filter(Boolean).map(String)}
              value={ks3}
              onChange={setKs3}
              placeholder="Koord. Shift 3"
              className="font-bold"
              triggerWidth="w-full"
            />
          </div>
          <button
            onClick={() => { setKs1(''); setKs2(''); setKs3(''); }}
            title="Reset Koordinator"
            className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition-all active:scale-90"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="hidden lg:block w-px h-6 bg-gray-100" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadImage}
            disabled={loading || savingImage || data.length === 0}
            className="flex items-center gap-2 px-4 h-10 bg-white border border-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 rounded-xl text-[12px] font-bold transition-all disabled:opacity-40 active:scale-95"
          >
            {savingImage ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ImageIcon size={14} className="text-blue-500" />
            )}
            <span>{savingImage ? 'Memproses...' : 'Download Gambar'}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={loading || generatingPdf || data.length === 0}
            className="flex items-center gap-2 px-4 h-10 bg-green-600 text-white hover:bg-green-700 rounded-xl text-[12px] font-bold shadow-md shadow-green-100 transition-all disabled:opacity-40 active:scale-95"
          >
            {generatingPdf ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Printer size={14} />
            )}
            <span>{generatingPdf ? 'Memproses...' : 'Cetak'}</span>
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="flex-1 overflow-auto p-1 print:p-0 print:overflow-visible flex justify-center items-start print:block">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[450px] w-full bg-white/60 backdrop-blur-sm animate-in fade-in duration-300 rounded-2xl">
            <div className="flex flex-col items-center gap-5 bg-white p-10 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-50">
              <div className="relative">
                <div className="w-14 h-14 border-4 border-slate-100 rounded-full border-t-green-600 animate-spin" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[13px] font-black text-slate-700 tracking-tight animate-pulse">Memproses Data...</span>
                <span className="text-[10px] font-bold text-slate-400">Harap tunggu sebentar</span>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 w-full">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center">
              <AlertCircle size={28} className="text-rose-500" />
            </div>
            <p className="font-bold text-rose-600">{error}</p>
            <button onClick={() => fetchData(dateStr)} className="text-sm font-bold text-green-600 underline underline-offset-2">Coba lagi</button>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 opacity-30 w-full">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                <ImageIcon size={40} className="text-gray-300" />
             </div>
            <p className="text-lg font-black text-gray-400 uppercase tracking-tighter">Tidak Ada Data</p>
            <p className="text-xs font-semibold text-gray-400">Tidak ada jadwal untuk tanggal yang dipilih</p>
          </div>
        ) : (
          /* ── PRINTABLE CARD ── */
          <div
            ref={printRef}
            className="bg-white w-full rounded-2xl shadow-sm border border-gray-100 print:rounded-none print:shadow-none print:border-none print:p-0 print:block"
            style={{ padding: '1.5rem 2rem' }}
          >
            {/* Header Branding & Title */}
            <div id="report-header" className="text-center mb-5 border-b-2 border-slate-800 pb-3">
              <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] mb-1">PT. BUYA BAROKAH DIV. PERCETAKAN</p>
              <h1 className="text-[22px] font-black text-slate-800 leading-none tracking-tight mb-2">JADWAL PRODUKSI HARIAN</h1>
              <p className="text-[11px] font-bold text-slate-500">{formatIndoDate(dateStr)}</p>
            </div>

            {/* Coordinator Info - Vertical */}
            <div id="report-coordinators" className="mb-4 space-y-0.5 text-[11px] font-black text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p>Koordinator Shift 1 : <span className="text-slate-900">{ks1 || '–'}</span></p>
              <p>Koordinator Shift 2 : <span className="text-slate-900">{ks2 || '–'}</span></p>
              <p>Koordinator Shift 3 : <span className="text-slate-900">{ks3 || '–'}</span></p>
            </div>

            {/* Table */}
            <table className="w-full border-collapse text-[11.5px]">
              <thead className="bg-gray-100 text-gray-800 border-y-2 border-gray-300">
                <tr>
                  {['No.', 'Shift', 'Jam Kerja', 'Nama Karyawan', 'No. Order', 'Nama Order', 'Jenis Pekerjaan', 'Keterangan', 'Target'].map((h, i) => (
                    <th
                      key={h}
                      className="border border-gray-300 py-1.5 px-2 font-black text-[10px] whitespace-nowrap"
                      style={{ textAlign: i === 0 || i === 1 || i === 2 ? 'center' : i === 8 ? 'right' : 'left' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const isEven = i % 2 === 0;
                  return (
                    <tr key={row.id ?? i} style={{ background: isEven ? '#ffffff' : '#fcfcfc' }}>
                      <td className="border border-gray-300 py-1 px-2 text-center font-bold text-gray-400">{i + 1}</td>
                      <td className="border border-gray-300 py-1 px-2 text-center font-black text-gray-800">{row.shift || '–'}</td>
                      <td className="border border-gray-300 py-1 px-2 text-center font-bold text-gray-600 whitespace-nowrap">{getJam(row.shift)}</td>
                      <td className="border border-gray-300 py-1 px-2 font-bold text-gray-900">{row.nama_karyawan || '–'}</td>
                      <td className="border border-gray-300 py-1 px-2 font-bold text-gray-500 whitespace-nowrap tabular-nums">{row.no_order || '–'}</td>
                      <td className="border border-gray-300 py-1 px-2 font-medium text-gray-700">{row.nama_order || '–'}</td>
                      <td className="border border-gray-300 py-1 px-2 font-bold text-gray-700">{row.jenis_pekerjaan || '–'}</td>
                      <td className="border border-gray-300 py-1 px-2 text-gray-500">{row.keterangan || '–'}</td>
                      <td className="border border-gray-300 py-1 px-2 text-right font-black tabular-nums text-gray-900 whitespace-nowrap">
                        {row.target !== null && row.target !== '' && row.target !== undefined
                          ? !isNaN(Number(row.target)) && row.target !== '-'
                            ? Number(row.target).toLocaleString('id-ID')
                            : row.target
                          : '–'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Print CSS ── */}
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 0.2cm; }
          body, html { background: white !important; width: 100% !important; height: auto !important; }
          nav, aside, header, .print\\:hidden { display: none !important; }
          * { overflow: visible !important; }
          .flex-1 { overflow: visible !important; padding: 0 !important; }
          table { width: 100% !important; table-layout: auto !important; border-collapse: collapse !important; }
          th, td { 
            white-space: nowrap !important; 
            padding: 2px !important; 
            line-height: 1.1 !important; 
            border: 1px solid #000 !important; 
            color: #000 !important;
            font-size: 5.5px !important;
          }
          th {
            background-color: #f3f4f6 !important;
            color: #1f2937 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Header and titles scaled down for extreme fit */
          h1 { font-size: 14px !important; margin-bottom: 2px !important; color: #000 !important; }
          p { font-size: 8px !important; margin-bottom: 1px !important; color: #000 !important; }
          .mb-4 { margin-bottom: 4px !important; padding-bottom: 2px !important; }
          .mb-6 { margin-bottom: 6px !important; }
        }
      `}</style>
    </div>
  );
}
