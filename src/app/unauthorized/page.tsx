import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: '403 Akses Ditolak | SINTAK',
  description: 'Anda tidak memiliki hak akses',
};

export default function UnauthorizedPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
      <div className="w-24 h-24 bg-[var(--accent-primary)] border-[4px] border-black shadow-[8px_8px_0_0_#000] flex items-center justify-center mb-8">
        <ShieldAlert size={44} strokeWidth={2.5} className="text-white" />
      </div>
      
      <h1 className="text-6xl font-black text-black tracking-tight leading-none mb-4">403</h1>
      <div className="inline-block border-[3px] border-black bg-[#fde047] px-4 py-1 shadow-[4px_4px_0_0_#000] mb-6">
        <p className="text-sm font-black text-black uppercase tracking-widest">Akses Ditolak</p>
      </div>
      
      <p className="text-black font-bold mb-8 max-w-md text-center leading-relaxed border-l-[4px] border-black pl-4 text-left text-sm">
        Maaf, peran Anda saat ini tidak memiliki izin untuk melihat modul ini. Hubungi <strong className="font-black underline decoration-[3px]">Super Admin</strong> jika Anda memerlukan akses.
      </p>

      <Link 
        href="/dashboard"
        className="px-6 py-3 bg-black text-white font-black rounded-none border-[3px] border-black transition-all shadow-[5px_5px_0_0_#555] hover:shadow-[7px_7px_0_0_#555] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none uppercase tracking-wide"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
