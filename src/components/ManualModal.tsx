'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { HelpCircle, X, Home, Users, Package, Box, Star, BarChart3, Calculator, AlertCircle, Info, Search, Filter, Database, FileText, CheckCircle2 } from 'lucide-react';

export default function ManualModal() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const allGuides = useMemo(() => ({
    '/': {
      title: 'Dashboard (Beranda)',
      icon: Home,
      description: 'Ringkasan aktivitas dan metrik sistem untuk audit cepat performa harian.',
      steps: [
        'Pantau angka **Total Karyawan** dan **Total Kesalahan** pada kartu statistik.',
        'Lihat tabel **Aktivitas Terkini** untuk memantau aktivitas sistem (Scroll ke bawah untuk melihat lebih lama).',
        'Klik menu di sidebar kiri untuk berpindah halaman.'
      ]
    },
    '/employees': {
      title: 'Data Karyawan',
      icon: Users,
      description: 'Manajemen database karyawan yang terintegrasi dengan sistem pencatatan.',
      steps: [
        'Klik tombol **Pilih & Upload File Excel** untuk memperbarui seluruh daftar karyawan.',
        'Sistem akan **menonaktifkan data lama** dan menggantinya dengan data baru, sehingga riwayat pencatatan kesalahan tetap aman.',
        'Pantau status **Diperbarui** di bagian atas untuk melihat nama file terakhir.',
        'Scroll tabel ke bawah untuk **melihat lebih banyak data** (Infinite Scroll).',
        'Gunakan **kotak pencarian** untuk memfilter tabel secara cepat.',
        'Data di menu **Data Karyawan** akan digunakan untuk menjadi **source di form record kesalahan karyawan** pada bagian **Nama Karyawan** dan **Nama Pencatat**.'
      ]
    },
    '/orders': {
      title: 'Order Produksi',
      icon: Package,
      description: 'Untuk menyinkronkan daftar Order Produksi secara langsung dari sistem Digit.',
      steps: [
        'Pilih **Tanggal Mulai** dan **Tanggal Akhir** pada kotak Periode.',
        'Klik tombol **Tarik Data** untuk mengambil data terbaru dari sistem Digit.',
        'Tunggu hingga proses selesai (**indikator persentase** akan berjalan).',
        '**Scraping tidak menghapus keseluruhan data**, data lama masih tersimpan di Database.',
        'Data di Order Produksi akan menjadi **source di form record kesalahan karyawan**, yang akan muncul di *field* **Nama Order Terkait** dalam bentuk Faktur dan Nama Order Produksi.',
        'Terus scroll tabel ke bawah jika ingin melihat data order yang lebih lama (Infinite Scroll).'
      ],
      tips: 'Jika data order terbaru belum muncul, pastikan Anda sudah mengeklik tombol "Tarik Data" untuk periode tanggal yang sesuai.'
    },
    '/bahan-baku': {
      title: 'Daftar Bahan Baku Keluar',
      icon: Box,
      description: 'Untuk menyinkronkan daftar pengeluaran Bahan Baku secara langsung dari sistem Digit.',
      steps: [
        'Pilih **Tanggal Mulai** dan **Tanggal Akhir** pada kotak Periode.',
        'Klik tombol **Tarik Data** untuk mengambil data terbaru dari sistem Digit.',
        'Tunggu hingga proses selesai (**indikator persentase** akan muncul berjalan).',
        '**Scraping tidak menghapus keseluruhan data**, data lama masih tersimpan di Database.',
        'Data di Daftar Bahan Baku Keluar akan menjadi **source di form record kesalahan karyawan**, yang akan muncul di *field* Nama Barang dalam bentuk **Faktur** dan **Nama Barang** saat memilih Jenis Barang **Bahan Baku (Digit)**, dan mengambil **Harga** dari kolom **HPP** saat memilih Jenis Harga **HPP Digit**.',
        'Scroll tabel ke bawah untuk melihat data sebelumnya (Infinite Scroll).'
      ],
      tips: 'Jika data bahan baku terbaru belum muncul, pastikan Anda sudah mengeklik tombol "Tarik Data" untuk periode tanggal yang memuat faktur tersebut.'
    },
    '/barang-jadi': {
      title: 'Barang Jadi',
      icon: Star,
      description: 'Untuk menyinkronkan Daftar Barang Hasil Produksi secara langsung dari sistem Digit.',
      steps: [
        'Pilih Tanggal Mulai dan Tanggal Akhir pada kotak "Periode".',
        'Klik tombol "Tarik Data" untuk mengambil data terbaru dari sistem Digit.',
        'Tunggu hingga proses selesai (**indikator persentase** akan muncul berjalan).',
        '**Scraping tidak menghapus keseluruhan data**, data lama masih tersimpan di Database.',
        'Data di Barang Jadi akan menjadi **source di form record kesalahan karyawan**, yang akan muncul di *field* Nama Barang dalam bentuk **Faktur** dan **Nama Barang** saat memilih Jenis Barang **Barang Jadi (Digit)**, dan mengambil **Harga** dari kolom **HPP** saat memilih Jenis Harga **Barang Jadi (Digit)**.',
        'Scroll tabel ke bawah untuk melihat lebih banyak data (Infinite Scroll).'
      ],
      tips: 'Jika data barang jadi terbaru belum muncul, pastikan Anda sudah mengeklik tombol "Tarik Data" untuk periode tanggal yang memuat faktur tersebut.'
    },
    '/sales': {
      title: 'Laporan Penjualan',
      icon: BarChart3,
      description: 'Untuk menyinkronkan data Laporan Penjualan secara langsung dari sistem Digit.',
      steps: [
        'Pilih **Tanggal Mulai** dan **Tanggal Akhir** pada kotak "Periode".',
        'Klik tombol **Tarik Data** untuk mengambil data terbaru dari sistem Digit.',
        'Tunggu hingga proses selesai (**indikator persentase** akan muncul berjalan).',
        '**Scraping tidak menghapus keseluruhan data**, data lama masih tersimpan di Database.',
        'Data di Laporan Penjualan akan menjadi **source di form record kesalahan karyawan**, yang akan muncul di *field* Nama Barang dalam bentuk **Faktur** dan **Nama Barang** saat memilih Jenis Barang **Penjualan Barang (Digit)**, dan mengambil **Harga** dari kolom **Harga** saat memilih Jenis Harga **Penjualan Barang (Digit)**.',
        'Scroll tabel ke bawah untuk memuat data lama (Infinite Scroll).'
      ],
      tips: 'Jika data penjualan terbaru belum muncul, pastikan Anda sudah mengeklik tombol "Tarik Data" untuk periode tanggal yang memuat faktur tersebut.'
    },
    '/hpp-kalkulasi': {
      title: 'HPP Kalkulasi',
      icon: Calculator,
      description: 'Menarik data HPP Kalkulasi dari file excel.',
      steps: [
        'Klik tombol **Pilih & Upload File Excel** untuk memperbarui database HPP.',
        'Sistem akan **menonaktifkan data lama** dan menggantinya dengan data baru.',
        'Gunakan kotak pencarian untuk menemukan nilai HPP berdasarkan **Nama Order**.',
        'Scroll tabel ke bawah untuk melihat lebih banyak data HPP (Infinite Scroll).',
        'Data di HPP Kalkulasi akan menjadi **source di form record kesalahan karyawan**, yang akan muncul di *field* Nama Barang dalam bentuk **Nama Order** saat memilih Jenis Barang **HPP Kalkulasi (Excel)**, dan mengambil **Harga** dari kolom **HPP Kalkulasi** saat memilih Jenis Harga **HPP Kalkulasi**.'
      ]
    },
    '/records': {
      title: 'Catat Kesalahan',
      icon: AlertCircle,
      description: 'Kelola data kesalahan karyawan.',
      steps: [
        'TAB DAFTAR KESALAHAN:',
        'Atur **Tgl Mulai & Akhir** untuk memfilter data riwayat kesalahan.',
        '**Data Otomatis Memuat**: Tabel akan terupdate otomatis setiap kali tanggal diubah.',
        'Scroll tabel ke bawah untuk memuat data sebelumnya (Infinite Scroll).',
        'Klik tombol **Cetak PDF** untuk membuat laporan rekap atau formulir detail per baris.',
        'TAB TAMBAH/EDIT DATA:',
        '**Faktur**: Otomatis di-generate dengan format **ERR-DDMMYY-XXX** (di mana XXX adalah nomor urut yang mereset setiap harinya).',
        '**Pilih Tanggal**: Pilih tanggal pencatatan kesalahan karyawan.',
        '**Nama Karyawan**: Pilih karyawan yang melakukan kesalahan (data ditarik dari menu **Data Karyawan**).',
        '**Nama Order**: Pilih order terkait (data ditarik dari menu **Order Produksi**).',
        '**Jenis Barang**: Pilih kategori barang sesuai sumber harganya:',
        '  • **Bahan Baku (Digit)**: Barang mentah, harga ditarik dari menu **Bahan Baku**.',
        '  • **Barang Jadi (Digit)**: Hasil produksi, harga ditarik dari menu **Barang Jadi**.',
        '  • **HPP Kalkulasi (Excel)**: Perhitungan HPP per-Order, harga ditarik dari database di menu **HPP Kalkulasi**.',
        '  • **Penjualan Barang (Digit)**: Barang keluar/jual, harga ditarik dari menu **Laporan Penjualan**.',
        '**Nama Barang**: Pilih barang spesifik. Anda bisa mengetik **Nomor Faktur** barang untuk pencarian cepat antar-Order.',
        '**Deskripsi**: Jelaskan detail kesalahan karyawan (opsional).',
        '**Jenis Harga**: Dipilihkan otomatis sesuai **Jenis Barang**. Nilai harga akan otomatis terisi.',
        '**Jumlah (Qty)**: Isi jumlah barang yang rusak/salah untuk menghitung **Total Beban** otomatis.',
        '**Dicatat Oleh**: Pilih petugas yang melakukan pencatatan data ini (data diambil dari menu **Data Karyawan**).'
      ]
    }
  }), []);

  // Listen for custom open-manual event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-manual', handleOpen);
    return () => window.removeEventListener('open-manual', handleOpen);
  }, []);

  const currentGuide = allGuides[pathname as keyof typeof allGuides] || allGuides['/'];

  return (
    <>
      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm">
                  <currentGuide.icon size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-0.5">Detail Menu {currentGuide.title}</span>
                  <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    Bantuan & Panduan
                  </h2>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {(() => {
                // Helper to parse **bold** text into strong tags
                const renderText = (text: string) => {
                  if (!text) return '';
                  const parts = text.split(/(\*\*.*?\*\*)/g);
                  return parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  });
                };

                return (
                  <>
                    {/* Description / Kegunaan */}
                    {currentGuide.description && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <Database size={12} />
                          <span>Kegunaan Menu:</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                          {renderText(currentGuide.description)}
                        </p>
                      </div>
                    )}

                    {/* Steps / Cara Penggunaan */}
                    <div className="space-y-3.5 pl-1">
                      {currentGuide.steps.map((step, index) => {
                        const isHeader = step.endsWith(':') && step === step.toUpperCase() && !step.includes('**');
                        const isSubStep = step.trimStart().startsWith('•') || step.startsWith('  ');
                        const cleanText = isSubStep ? step.trimStart().replace(/^[•\s]+/, '') : step;
                        
                        return (
                          <div key={index} className={`flex ${isHeader ? 'mt-3 first:mt-0' : 'gap-3'} ${isSubStep ? 'pl-8 py-0.5' : 'pl-2'} group items-start`}>
                            {isHeader ? null : isSubStep ? (
                              <div className="flex-shrink-0 w-1 h-1 mt-2 rounded-full border border-emerald-400 bg-white" />
                            ) : (
                              <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-all shadow-sm" />
                            )}
                            <p className={`text-sm leading-relaxed ${
                              isHeader ? 'font-bold text-slate-800 uppercase tracking-widest text-xs' : 
                              isSubStep ? 'text-slate-500 text-[13px]' : 'text-slate-600'
                            }`}>
                              {renderText(cleanText)}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {(currentGuide as any).tips && (
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                        <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Tips Berguna:</p>
                          <p className="text-xs text-amber-700 leading-relaxed italic">
                            "{renderText((currentGuide as any).tips)}"
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
              <p className="text-[10px] text-slate-400 font-medium italic">Panduan Penggunaan SIKKA</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
