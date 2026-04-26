import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: '403 Akses Ditolak | SINTAK',
  description: 'Anda tidak memiliki hak akses',
};

export default function UnauthorizedPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] text-center p-8 animate-in fade-in duration-700">
      <div className="w-28 h-28 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm shadow-green-900/5 flex items-center justify-center mb-10 group hover:scale-105 transition-transform duration-500">
        <ShieldAlert size={52} strokeWidth={2} className="text-emerald-600 group-hover:animate-pulse" />
      </div>
      
      <h1 className="text-7xl font-bold text-gray-900 tracking-tight leading-none mb-4">403</h1>
      <div className="inline-block border border-emerald-100 bg-emerald-50 px-6 py-2 rounded-full shadow-sm mb-8">
        <p className="text-[12px] font-bold text-emerald-700 uppercase tracking-[0.2em]">Akses Ditolak</p>
      </div>
      
      <p className="text-gray-500 font-medium mb-10 max-w-md text-center leading-relaxed text-sm">
        Maaf, akun Anda saat ini tidak memiliki izin yang cukup untuk mengakses modul ini. Silakan hubungi <strong className="font-bold text-gray-800 underline decoration-2 decoration-emerald-200 underline-offset-4">Super Admin</strong> jika Anda memerlukan bantuan akses.
      </p>

      <Link 
        href="/dashboard"
        className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-sm shadow-green-900/10 hover:bg-emerald-700 hover:-translate-y-1 hover:shadow-sm hover:shadow-green-900/20 active:translate-y-0 uppercase tracking-widest text-[13px]"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}











