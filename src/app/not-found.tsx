'use client';

import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] bg-transparent p-6 text-center animate-in fade-in duration-500">
      <div className="relative mb-10">
        <div className="relative w-32 h-32 bg-emerald-600 rounded-lg shadow-sm shadow-emerald-900/20 flex items-center justify-center mx-auto transform -rotate-6 border-4 border-white">
          <FileQuestion size={64} strokeWidth={2} className="text-white" />
        </div>
      </div>
      
      <h1 className="text-8xl font-black text-slate-800 tracking-tighter leading-none mb-4">404</h1>
      
      <div className="bg-emerald-50 text-emerald-700 px-6 py-2 rounded-full border border-emerald-100 shadow-sm inline-flex items-center gap-2 mb-8">
        <span className="text-[12px] font-bold uppercase tracking-widest">Halaman Tidak Ditemukan</span>
      </div>

      <p className="text-slate-500 font-medium max-w-sm leading-relaxed text-sm mb-12">
        Maaf, halaman yang Anda cari tidak tersedia atau sedang dalam tahap pengembangan SINTAK.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 transition-all uppercase tracking-widest"
        >
          <ArrowLeft size={18} />
          <span>Kembali</span>
        </button>
        <Link 
          href="/dashboard"
          className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-900/10 uppercase tracking-widest ring-4 ring-emerald-500/0 hover:ring-emerald-500/5"
        >
          <Home size={18} />
          <span>Ke Dashboard</span>
        </Link>
      </div>

      <div className="mt-20 text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">
        SINTAK • Sistem Informasi Cetak
      </div>
    </div>
  );
}



