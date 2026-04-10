import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: '403 Akses Ditolak | SINTAK',
  description: 'Anda tidak memiliki hak akses',
};

export default function UnauthorizedPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
      <ShieldAlert size={72} className="text-gray-300 mb-6" />
      <h1 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">
        403 — Akses Ditolak
      </h1>
      <p className="text-gray-500 font-medium mb-8 max-w-md text-center leading-relaxed">
        Maaf, peran Anda saat ini tidak memiliki izin untuk melihat modul ini. Hubungi <strong>Super Admin</strong> jika Anda memerlukan akses.
      </p>
      <Link 
        href="/dashboard"
        className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-[8px] transition-all shadow-sm active:scale-95"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
