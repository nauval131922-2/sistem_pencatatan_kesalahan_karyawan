import type { Metadata } from 'next';
import BarangJadiClient from './BarangJadiClient';

export const metadata: Metadata = {
  title: 'SIKKA | Barang Jadi',
};

export default function BarangJadiPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Daftar Barang Hasil Produksi</h2>
          <p className="text-slate-500 mt-1 text-sm">Tarik data Barang Hasil Produksi dari <span className="gradient-text font-semibold text-indigo-600">Digit</span></p>
        </div>
      </header>

      <BarangJadiClient />
    </div>
  );
}
