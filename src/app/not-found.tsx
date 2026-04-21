'use client';

import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] bg-transparent p-6 text-center animate-in fade-in duration-500">
      <div className="relative mb-8">
        <div className="relative w-28 h-28 bg-[#fde047] border-[4px] border-black shadow-[3.5px_3.5px_0_0_#000] flex items-center justify-center mx-auto">
          <FileQuestion size={52} strokeWidth={2.5} className="text-black" />
        </div>
      </div>
      
      <h1 className="text-7xl font-black text-black tracking-tight leading-none">404</h1>
      <div className="mt-3 inline-block border-[3px] border-black bg-[var(--accent-primary)] px-4 py-1 shadow-[2.5px_2.5px_0_0_#000]">
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Halaman Tidak Ditemukan</h2>
      </div>
      <p className="text-black font-bold mt-6 max-w-sm leading-relaxed border-l-[4px] border-black pl-4 text-left text-sm">
        Maaf, halaman yang Anda cari tidak tersedia atau sedang dalam tahap pengembangan SINTAK.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-10">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-none border-[3px] border-black text-sm font-black text-black bg-white hover:bg-[#fde047] transition-all shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none uppercase"
        >
          <ArrowLeft size={16} strokeWidth={3} />
          <span>Kembali</span>
        </button>
        <Link 
          href="/dashboard"
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-none border-[3px] border-black text-sm font-black text-white bg-[var(--accent-primary)] hover:bg-[#ff4444] transition-all shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none uppercase"
        >
          <Home size={16} strokeWidth={3} />
          <span>Ke Dashboard</span>
        </Link>
      </div>

      <div className="mt-16 text-[11px] font-black text-black/40 uppercase tracking-widest">
        SINTAK &bull; Sistem Informasi Cetak
      </div>
    </div>
  );
}













