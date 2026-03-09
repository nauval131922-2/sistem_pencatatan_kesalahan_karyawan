import type { Metadata } from 'next';
import BahanBakuClient from './BahanBakuClient';
import HelpButton from '@/components/HelpButton';

export const metadata: Metadata = {
  title: 'SIKKA | Bahan Baku',
};

export const dynamic = 'force-dynamic';


export default function BahanBakuPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
      <header className="flex flex-col shrink-0">
        <div className="flex items-center gap-3 border-l-4 border-green-500 pl-4">
          <h1 className="text-[22px] font-extrabold text-gray-800 tracking-tight leading-none">Bahan Baku</h1>
          <HelpButton />
        </div>
        <p className="text-[13px] text-gray-400 font-medium pl-5 mt-2">
          Tarik data Pengeluaran Bahan Baku dari <a href="https://digit.ptbuya.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-bold">Digit</a>
        </p>
      </header>

      <BahanBakuClient />
    </div>
  );
}
