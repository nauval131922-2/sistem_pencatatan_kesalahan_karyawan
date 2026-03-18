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
      description: 'Ringkasan aktivitas dan metrik sistem secara real-time untuk audit cepat performa harian.',
      steps: [
        'Pantau 3 metrik utama pada kartu statistik:',
        '  • **Karyawan Aktif**: Jumlah orang yang terdaftar di file Excel terakhir (**Snapshot Sistem**).',
        '  • **Kesalahan Bulan Ini**: Akumulasi kasus pada bulan berjalan.',
        '  • **Kesalahan Hari Ini**: Jumlah kasus yang baru saja diinput (**Real-time**).',
        'Lihat tabel **Aktivitas Terkini** untuk memantau log aktivitas sistem secara real-time.',
        'Gunakan **Kotak Pencarian** di atas tabel untuk memfilter aktivitas berdasarkan menu, user, atau keterangan.',
        'Klik tombol **Detail** pada baris tabel untuk melihat rincian data aktivitas (termasuk data mentah JSON).',
        'Klik pada **Kartu Statistik** sebagai jalan pintas (**shortcut**) cepat menuju ke halamannya.'
      ]
    },
    '/employees': {
      title: 'Data Karyawan',
      icon: Users,
      description: 'Manajemen database karyawan yang terintegrasi dengan sistem pencatatan.',
      steps: [
        'Klik tombol **Pilih & Upload File Excel** untuk memperbarui seluruh daftar karyawan sistem.',
        '**Keamanan Data**: Sistem akan menonaktifkan data lama secara otomatis tanpa menghapus riwayat kesalahan yang sudah tercatat sebelumnya.',
        'Lihat **Nama File** dan **Waktu Diperbarui** di bawah judul halaman untuk mengetahui kapan data terakhir kali diimport.',
        'Gunakan **Kotak Pencarian** untuk memfilter karyawan berdasarkan Nama, Jabatan, atau ID Karyawan.',
        'Scroll tabel ke bawah untuk melihat lebih banyak data (Infinite Scroll).',
        'Data di sini akan tampil otomatis pada dropdown **Nama Karyawan** saat mengisi form **Pencatatan Kesalahan**.'
      ]
    },
    '/orders': {
      title: 'Order Produksi',
      icon: Package,
      description: 'Sinkronisasi daftar Order Produksi secara langsung dari sistem Digit.',
      steps: [
        'Atur **Rentang Tanggal** (Mulai & Akhir) pada panel Periode di bagian atas.',
        'Klik tombol **Tarik Data** untuk memulai proses sinkronisasi otomatis (Parallel Sync).',
        'Tunggu hingga indikator **Persentase (%)** selesai memproses data bulan demi bulan.',
        'Gunakan **Kotak Pencarian** untuk memfilter hasil berdasarkan **Nomor Faktur**, **Nama Produk**, atau **Pelanggan**.',
        'Pantau status **Diperbarui** dan indikator **Kecepatan Load (ms)** untuk memastikan data terbaru sudah tampil.',
        '**Keamanan Data**: Proses tarik data tidak menghapus data lama, melainkan melengkapi database dengan data yang baru atau diperbarui.',
        'Data dari sini akan tampil sebagai pilihan di field **Referensi Order** pada form **Pencatatan Kesalahan**.'
      ],
      tips: 'Lakukan penarikan data secara berkala untuk memastikan nomor faktur terbaru dari Digit tersedia di sistem.'
    },
    '/bahan-baku': {
      title: 'Daftar Bahan Baku Keluar',
      icon: Box,
      description: 'Sinkronisasi daftar pengeluaran Bahan Baku secara langsung dari sistem Digit.',
      steps: [
        'Atur **Rentang Tanggal** pada panel Periode dan klik **Tarik Data** untuk sinkronisasi (Parallel Sync).',
        'Tabel menampilkan kolom **Faktur**, **Faktur PRD**, **Nama Barang**, **Qty**, dan **HPP Digit**.',
        'Gunakan **Kotak Pencarian** untuk memfilter berdasarkan **Nomor Faktur**, **Nama Barang**, atau **Supplier**.',
        'Pantau indikator **Load Time (ms)** untuk melihat kecepatan akses data.',
        'Data di sini menjadi **source** pada form **Pencatatan Kesalahan** saat memilih kategori **Bahan Baku** (mengambil harga dari kolom **HPP Digit**).',
        'Geser tabel atau scroll ke bawah untuk memuat data lama (Infinite Scroll).'
      ]
    },
    '/barang-jadi': {
      title: 'Barang Jadi',
      icon: Star,
      description: 'Sinkronisasi Daftar Barang Hasil Produksi secara langsung dari sistem Digit.',
      steps: [
        'Atur **Rentang Tanggal** dan klik **Tarik Data** untuk menarik data produksi terbaru.',
        'Pantau **Indikator Persentase (%)** untuk melihat kemajuan sinkronisasi data.',
        'Gunakan **Kotak Pencarian** untuk memfilter berdasarkan **Nama Barang**, **Tanggal**, atau **Order Produksi**.',
        'Data di sini menjadi **source** pada form **Pencatatan Kesalahan** saat memilih kategori **Barang Jadi** (mengambil harga dari kolom **HPP Digit**).',
        'Scroll tabel ke bawah untuk melihat lebih banyak data tanpa perlu berpindah halaman (Infinite Scroll).'
      ]
    },
    '/sales': {
      title: 'Laporan Penjualan',
      icon: BarChart3,
      description: 'Sinkronisasi data Laporan Penjualan secara langsung dari sistem Digit.',
      steps: [
        'Klik **Tarik Data** setelah mengatur periode untuk mengambil data transaksi penjualan terbaru.',
        'Gunakan **Kotak Pencarian** untuk memfilter berdasarkan **Nomor Faktur**, **Pelanggan**, atau **Nama Produk**.',
        'Data di sini menjadi **source** pada form **Pencatatan Kesalahan** dengan format khusus **[Faktur] Nama Order**.',
        'Harga akan ditarik dari kolom **Harga** saat memilih Jenis Dasar Harga **Harga Jual Digit** di form pencatatan.',
        'Lihat status **Diperbarui** di bagian atas untuk mengetahui waktu sinkronisasi terakhir.'
      ]
    },
    '/hpp-kalkulasi': {
      title: 'HPP Kalkulasi',
      icon: Calculator,
      description: 'Manajemen database Harga Pokok Penjualan (HPP) hasil kalkulasi tim terkait dari file Excel.',
      steps: [
        'Klik tombol **Pilih & Upload File Excel** untuk memperbarui seluruh database HPP Kalkulasi.',
        '**Data Terhapus**: Sistem akan menghapus seluruh data lama dan menggantikannya dengan data terbaru dari file yang diupload.',
        'Lihat **Nama File** dan **Waktu Diperbarui** pada header halaman untuk memantau status import terakhir.',
        'Gunakan **Kotak Pencarian** untuk memfilter tabel berdasarkan **Nama Order**.',
        'Data di sini akan menjadi **source** otomatis pada form **Pencatatan Kesalahan** saat memilih kategori **HPP Kalkulasi**.',
        'Harga Satuan pada form pencatatan akan otomatis terisi berdasarkan nilai **HPP Kalkulasi** di menu ini.'
      ]
    },
    '/records': {
      title: 'Pencatatan Kesalahan',
      icon: AlertCircle,
      description: 'Kelola data kesalahan karyawan dan rincian bebannya.',
      steps: [
        'Tab **Daftar Kesalahan**:',
        'Atur **Rentang Tanggal** (Mulai & Akhir) untuk memfilter data riwayat kesalahan.',
        '**Data Otomatis Memuat**: Tabel akan terupdate otomatis setiap kali tanggal diubah.',
        'Scroll tabel ke bawah untuk memuat data sebelumnya (Infinite Scroll).',
        'Klik tombol **Cetak Rekap PDF** untuk membuat laporan rekap dalam bentuk PDF.',
        'Klik tombol **PDF (di kolom Action)** untuk mencetak **Formulir Detail** per baris.',
        'Klik tombol **Ekspor Excel** untuk membuat laporan rekap dalam bentuk file **Excel**.',
        'Tab **Tambah Data** / **Edit Data**:',
        '**Nomor Faktur**: Otomatis di-generate dengan format **ERR-DDMMYY-XXX** (reset setiap hari).',
        '**Tanggal**: Pilih tanggal kejadian kesalahan.',
        '**Nama Karyawan**: Pilih karyawan yang melakukan kesalahan.',
        '**Severitas (Tingkat Dampak)**: Pilih tingkat keparahan kesalahan:',
        '  • **Low**: Kesalahan minor, dampak kecil terhadap operasional.',
        '  • **Medium**: Kesalahan sedang, memerlukan perhatian khusus.',
        '  • **High**: Kesalahan fatal/kritis yang berdampak besar atau kerugian tinggi.',
        '**Deskripsi Detail**: Jelaskan secara rinci kesalahan yang terjadi (opsional).',
        '**Referensi Order**: Pilih nomor order/faktur produksi terkait.',
        '**Kategori Barang**: Pilih kategori sesuai sumber datanya:',
        '  • **Bahan Baku**: Harga ditarik dari menu **Bahan Baku**.',
        '  • **Barang Jadi**: Harga ditarik dari menu **Barang Jadi**.',
        '  • **HPP Kalkulasi**: Harga ditarik dari menu **HPP Kalkulasi**.',
        '  • **Penjualan**: Harga ditarik dari menu **Laporan Penjualan**.',
        '  • **Manual**: Masukkan nama barang dan harga secara mandiri.',
        '**Nama Barang**: Pilih item spesifik. Anda bisa mengetik **Nomor Faktur** untuk pencarian cepat.',
        '**Jenis Dasar Harga**: Pilihan jenis harga (misal: HPP Digit atau Harga Jual) yang akan ditarik harganya.',
        '**Kuantitas (Qty)**: Isi jumlah barang yang mengalami kesalahan.',
        '**Harga Satuan**: Terisi otomatis dari database. Hanya bisa diisi manual jika memilih kategori/jenis harga **Manual**.',
        '**Total Estimasi Beban**: Hasil perhitungan otomatis (**Qty** x **Harga Satuan**).'
      ]
    }
  }), [pathname]);

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
                  <span className="text-[10px] font-bold text-emerald-600 mb-0.5">Detail Menu {currentGuide.title}</span>
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
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
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
                        const isHeader = step.endsWith(':') && (step.startsWith('Tab ') || step.startsWith('A. ') || step.startsWith('B. ') || step.startsWith('C. '));
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
                              isHeader ? 'font-bold text-slate-800 text-xs' : 
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
                          <p className="text-[10px] font-bold text-amber-600 mb-1">Tips Berguna:</p>
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
