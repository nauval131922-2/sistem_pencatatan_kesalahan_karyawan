import type { Metadata } from 'next';
import BahanBakuClient from './BahanBakuClient';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'SIKKA | Bahan Baku',
};

export const dynamic = 'force-dynamic';


export default function BahanBakuPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
      <PageHeader
        title="Bahan Baku"
        description={
          <>
            Tarik data Pengeluaran Bahan Baku dari <a href="https://digit.ptbuya.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-bold">Digit</a>
          </>
        }
      />

      <BahanBakuClient />
    </div>
  );
}
