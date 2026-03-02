import type { Metadata } from 'next';
import BarangJadiClient from './BarangJadiClient';

export const metadata: Metadata = {
  title: 'SIKKA | Barang Jadi',
};

export default function BarangJadiPage() {
  return (
    <div className="space-y-4 pb-48">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Daftar Barang Hasil Produksi</h2>
          <p className="text-zinc-500 mt-1">Tarik data Barang Hasil Produksi dari <span className="gradient-text font-semibold">Digit</span></p>
        </div>
      </header>

      <BarangJadiClient />
    </div>
  );
}
