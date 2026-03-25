import PageHeader from '@/components/PageHeader';
import { Search, Construction } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SINTAK | Tracking Manufaktur',
};

export default function TrackingManufakturPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Tracking Manufaktur"
        description="Lacak alur faktur dari SPH hingga Penjualan."
      />
      
      <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
          <Search size={32} className="text-amber-500" />
        </div>
        <div className="flex items-center gap-2">
          <Construction size={18} className="text-amber-500" />
          <h3 className="text-lg font-bold text-gray-800">Sistem Tracking SINTAK</h3>
        </div>
        <p className="text-sm text-gray-400 mt-2 max-w-sm text-center font-medium leading-relaxed px-6">
          Mesin pelacak alur faktur sedang dalam tahap integrasi database. Fitur ini akan memungkinkan pencarian histori faktur secara instan.
        </p>
      </div>
    </div>
  );
}
