import type { Metadata } from 'next';
import BahanBakuClient from './BahanBakuClient';
import HelpButton from '@/components/HelpButton';

export const metadata: Metadata = {
  title: 'SIKKA | Bahan Baku',
};

export const dynamic = 'force-dynamic';


export default function BahanBakuPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <header className="flex justify-between items-start shrink-0">
        <div>
          <div className="border-l-4 border-green-500 pl-4 flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-800 leading-tight">Bahan Baku</h1>
            <HelpButton />
          </div>
          <p className="text-sm text-gray-400 mt-0.5 pl-4 flex items-center gap-1">Tarik data Pengeluaran Bahan Baku dari <span className="gradient-text font-semibold text-emerald-600">Digit</span></p>
        </div>
      </header>

      <BahanBakuClient />
    </div>
  );
}
