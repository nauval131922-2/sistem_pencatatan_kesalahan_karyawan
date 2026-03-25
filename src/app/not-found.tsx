'use client';

import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] bg-transparent p-6 text-center animate-in fade-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-green-100 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="relative w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-gray-100 mx-auto">
          <FileQuestion size={48} className="text-green-600" />
        </div>
      </div>
      
      <h1 className="text-4xl font-black text-gray-800 tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-gray-700 mt-2">Halaman Tidak Ditemukan</h2>
      <p className="text-gray-400 mt-4 max-w-sm font-medium leading-relaxed">
        Maaf, halaman yang Anda cari tidak tersedia atau sedang dalam tahap pengembangan sistem SINTAK.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-10">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>
        <Link 
          href="/dashboard-kesalahan-karyawan"
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-sm font-bold text-white hover:bg-green-700 transition-all shadow-md active:scale-95"
        >
          <Home size={16} />
          <span>Ke Dashboard</span>
        </Link>
      </div>

      <div className="mt-16 text-[11px] font-bold text-gray-300 uppercase tracking-widest">
        SINTAK &bull; Sistem Informasi Cetak
      </div>
    </div>
  );
}
