'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Printer, Loader2, ArrowLeft, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import DatePicker from '@/components/DatePicker';

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
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async (selectedDate: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/jurnal-harian-produksi?startDate=${selectedDate}&endDate=${selectedDate}&limit=500`);
      const result = await res.json();
      if (result.success) setData(result.data);
      else setError(result.error || 'Gagal memuat data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(dateStr); }, [dateStr, fetchData]);

  const handlePrint = () => window.print();

  const handleDownloadImage = async () => {
    if (!printRef.current || savingImage) return;
    setSavingImage(true);
    try {
      const { domToPng } = await import('modern-screenshot');
      const dataUrl = await domToPng(printRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `Jadwal_Produksi_${dateStr}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setSavingImage(false);
    }
  };

  const selectedDateObj = new Date(dateStr);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* ── TOOLBAR ── */}
      <div className="print:hidden bg-white border border-gray-100 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm shrink-0 mb-6 mx-1">
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchData(dateStr)}
            disabled={loading}
            title="Muat Ulang"
            className="w-11 h-11 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border-green-200 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="w-[200px]">
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

        <div className="flex items-center gap-3">

          <div className="w-px h-8 bg-gray-100 mx-1" />

          <button
            onClick={handleDownloadImage}
            disabled={loading || savingImage || data.length === 0}
            className="flex items-center gap-2.5 px-5 h-11 bg-white border border-gray-100 text-gray-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 rounded-xl text-[13px] font-bold transition-all disabled:opacity-40 shadow-sm active:scale-[0.97]"
          >
            {savingImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} className="text-sky-500" />}
            <span className="hidden sm:inline">Simpan Gambar</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2.5 px-6 h-11 bg-green-600 text-white hover:bg-green-700 rounded-xl text-[13px] font-bold shadow-md shadow-green-100 transition-all disabled:opacity-40 active:scale-[0.97]"
          >
            <Printer size={16} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="flex-1 overflow-auto p-1 print:p-0 print:overflow-visible flex justify-center items-start">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 opacity-40 w-full">
            <Loader2 size={44} className="animate-spin text-green-600" strokeWidth={2.5} />
            <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Memuat Data...</p>
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
            className="bg-white w-full max-w-[1100px] rounded-2xl shadow-sm border border-gray-100 print:rounded-none print:shadow-none print:border-none print:max-w-none"
            style={{ padding: '2.5rem 3rem' }}
          >
            {/* Header Laporan */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-900">
              <div>
                <h1 className="text-[24px] font-black text-gray-900 leading-tight">Jadwal Produksi Harian</h1>
                <p className="text-[14px] font-bold text-gray-800 mt-1">{formatIndoDate(dateStr)}</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-black text-gray-500 tracking-wider">PT. Buya Barokah Div. Percetakan</p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse text-[11.5px]">
              <thead>
                <tr>
                  {['No.', 'Shift', 'Jam Kerja', 'Nama Karyawan', 'No. Order', 'Nama Order', 'Jenis Pekerjaan', 'Keterangan', 'Target'].map((h, i) => (
                    <th
                      key={h}
                      className="border border-gray-900 bg-gray-900 text-white p-3 font-black text-[10px]"
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
                      <td className="border border-gray-300 p-2.5 text-center font-bold text-gray-400">{i + 1}</td>
                      <td className="border border-gray-300 p-2.5 text-center font-black text-gray-800">{row.shift || '–'}</td>
                      <td className="border border-gray-300 p-2.5 text-center font-bold text-gray-600 whitespace-nowrap">{getJam(row.shift)}</td>
                      <td className="border border-gray-300 p-2.5 font-bold text-gray-900">{row.nama_karyawan || '–'}</td>
                      <td className="border border-gray-300 p-2.5 font-bold text-gray-500 whitespace-nowrap tabular-nums">{row.no_order || '–'}</td>
                      <td className="border border-gray-300 p-2.5 font-medium text-gray-700">{row.nama_order || '–'}</td>
                      <td className="border border-gray-300 p-2.5 font-bold text-gray-700">{row.jenis_pekerjaan || '–'}</td>
                      <td className="border border-gray-300 p-2.5 text-gray-500">{row.keterangan || '–'}</td>
                      <td className="border border-gray-300 p-2.5 text-right font-black tabular-nums text-gray-900">
                        {row.target !== null && row.target !== '' && row.target !== undefined
                          ? Number(row.target).toLocaleString('id-ID')
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
          @page { size: landscape; margin: 0.7cm; }
          body, html { background: white !important; }
          nav, aside, header, .print\\:hidden { display: none !important; }
          .flex-1 { overflow: visible !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
