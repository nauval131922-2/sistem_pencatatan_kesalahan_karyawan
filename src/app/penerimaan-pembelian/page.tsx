import { Metadata } from 'next';
import PenerimaanPembelianClient from './PenerimaanPembelianClient';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'SINTAK | Penerimaan Pembelian',
};

export const dynamic = 'force-dynamic';

export default function PenerimaanPembelianPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Penerimaan Pembelian"
        description={
          <>
            Sinkronisasi daftar Penerimaan Pembelian secara langsung dari <a href="https://buyapercetakan.mdthoster.com/#cGIvdHJiZWxpX3A=" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-bold">Digit</a>
          </>
        }
      />

      <PenerimaanPembelianClient />
    </div>
  );
}





