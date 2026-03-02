import type { Metadata } from 'next';
import BahanBakuClient from './BahanBakuClient';

export const metadata: Metadata = {
  title: 'SIKKA | Bahan Baku',
};

export default function BahanBakuPage() {
  return (
    <div className="space-y-4 pb-48">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Daftar Bahan Baku Keluar</h2>
          <p className="text-zinc-500 mt-1">Tarik data Pengeluaran Bahan Baku dari <span className="gradient-text font-semibold">Digit</span></p>
        </div>
      </header>

      <BahanBakuClient />
    </div>
  );
}
