import PageHeader from '@/components/PageHeader';
import { ShieldCheck, Lock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SINTAK | Hak Akses',
};

export default function RolesPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Kelola Hak Akses"
        description="Atur hak akses tiap role dalam sistem SINTAK."
      />
      
      <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
          <ShieldCheck size={32} className="text-red-500" />
        </div>
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-red-500" />
          <h3 className="text-lg font-bold text-gray-800">Manajemen Hak Akses</h3>
        </div>
        <p className="text-sm text-gray-400 mt-2 max-w-sm text-center font-medium leading-relaxed px-6">
          Fitur untuk membatasi akses antar divisi (Manufaktur vs Kinerja) sedang disesuaikan dengan struktur baru SINTAK.
        </p>
      </div>
    </div>
  );
}
