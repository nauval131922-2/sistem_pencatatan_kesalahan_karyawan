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
      steps: [
        'Pantau angka "Total Karyawan" dan "Total Kesalahan" pada kartu statistik di bagian atas.',
        'Klik pada kartu statistik untuk langsung berpindah ke menu yang relevan (Daftar Karyawan atau Daftar Kesalahan).',
        'Lihat tabel "Aktivitas Terkini" untuk memantau log perubahan data terbaru yang dilakukan oleh admin.'
      ],
      tips: 'Gunakan Dashboard untuk audit cepat performa harian tanpa harus membuka menu detail.'
    },
    '/employees': {
      title: 'Data Karyawan',
      icon: Users,
      steps: [
        'Klik tombol "Pilih & Upload File Excel" untuk memperbarui seluruh daftar karyawan.',
        'Sistem akan menghapus data lama dan menggantinya dengan data baru dari file Excel tersebut.',
        'Pantau status "Diperbarui" di bagian atas untuk melihat nama file terakhir yang berhasil diimpor.',
        'Gunakan kotak "Cari nama, jabatan, atau ID" untuk memfilter tabel di bagian bawah secara cepat.'
      ],
      tips: 'Gunakan tombol nomor halaman (1, 2, 3...) di bawah tabel untuk melihat seluruh daftar karyawan.'
    },
    '/orders': {
      title: 'Order Produksi',
      icon: Package,
      steps: [
        'Menu ini menampilkan daftar Order Produksi dari sistem Digit.',
        'Nomor Faktur di sini akan terhubung otomatis saat Anda melakukan "Catat Kesalahan".',
        'Data diupdate secara otomatis melalui sistem sinkronisasi (scraper).'
      ],
      tips: 'Jika data order terbaru belum muncul, tunggu proses sinkronisasi otomatis selesai.'
    },
    '/bahan-baku': {
      title: 'Manajemen Bahan Baku',
      icon: Box,
      steps: [
        'Pantau stok dan penggunaan material produksi di sini.',
        'Setiap bahan baku memiliki nomor faktur referensi untuk pelacakan.',
        'Gunakan fitur pencarian untuk melihat spesifikasi bahan tertentu.'
      ],
      tips: 'Gunakan fitur pencarian jika daftar bahan baku terlalu panjang.'
    },
    '/barang-jadi': {
      title: 'Stok Barang Jadi',
      icon: Star,
      steps: [
        'Daftar produk yang telah selesai diproduksi dan siap dikirim.',
        'Mencakup informasi nomor faktur, nama proyek, dan total qty hasil produksi.',
        'Link otomatis dengan data penjualan untuk memudahkan audit.'
      ],
      tips: 'Gunakan filter pencarian untuk menemukan produk berdasarkan nomor faktur.'
    },
    '/sales': {
      title: 'Laporan Penjualan',
      icon: BarChart3,
      steps: [
        'Rekapitulasi seluruh transaksi penjualan yang telah divalidasi.',
        'Gunakan filter tanggal untuk melihat laporan performa penjualan periode tertentu.',
        'Analisa barang yang paling laku atau yang paling sering mengalami retur/kesalahan.'
      ],
      tips: 'Data penjualan disinkronkan secara berkala dari sistem utama.'
    },
    '/hpp-kalkulasi': {
      title: 'Kalkulasi HPP',
      icon: Calculator,
      steps: [
        'Fitur otomatis untuk menghitung Harga Pokok Penjualan (HPP).',
        'Sistem mengambil data dari bahan baku dan biaya produksi yang relevan.',
        'Membantu Anda menentukan margin keuntungan secara lebih akurat.'
      ],
      tips: 'Pastikan data bahan baku dan biaya produksi sudah terisi lengkap.'
    },
    '/records': {
      title: 'Catat & Daftar Kesalahan',
      icon: AlertCircle,
      steps: [
        'Tab **Daftar Kesalahan**: Gunakan filter tanggal (Tgl Mulai/Akhir) lalu klik Refresh untuk mencari data.',
        'Tombol **Cetak PDF (A4)**: Membuat laporan rekapitulasi sesuai filter tanggal yang Anda pilih.',
        'Tombol **PDF (Merah)** di baris tabel: Mencetak formulir detail untuk satu record/faktur saja.',
        'Tab **Catat Kesalahan**: Form untuk input data baru. Pilih Karyawan, Order, dan Barang, lalu isi deskripsi.'
      ],
      tips: 'Draft input Anda akan tersimpan otomatis. Jangan takut kehilangan data jika tidak sengaja berpindah menu.'
    }
  }), []);

  const currentGuide = allGuides[pathname as keyof typeof allGuides] || allGuides['/'];

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-5 right-8 z-[60] p-2.5 bg-white/80 backdrop-blur-md hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/20 rounded-full shadow-sm transition-all hover:scale-110 active:scale-95 group"
        title="Buka Panduan Menu Ini"
      >
        <HelpCircle size={18} className="transition-transform group-hover:rotate-12" />
      </button>

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
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-0.5">Panduan Penggunaan</span>
                  <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    Menu <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-lg text-sm border border-emerald-200">{currentGuide.title}</span>
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  Cara Penggunaan:
                </p>
                <div className="space-y-3">
                  {currentGuide.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3 text-sm text-slate-600 leading-relaxed border-l-2 border-emerald-100 pl-4 py-1">
                      <span className="text-emerald-500 font-bold shrink-0">{idx + 1}.</span>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {currentGuide.tips && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                  <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Tips Berguna:</p>
                    <p className="text-xs text-amber-700 leading-relaxed italic">"{currentGuide.tips}"</p>
                  </div>
                </div>
              )}
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
