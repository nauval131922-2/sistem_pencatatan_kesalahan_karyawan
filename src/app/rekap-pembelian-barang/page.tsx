import { Metadata } from 'next';
import PembelianBarangClient from './PembelianBarangClient';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'SINTAK | Pembelian Barang',
};

export const dynamic = 'force-dynamic';

export default function PembelianBarangPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Pembelian Barang"
        description={
          <>
            Sinkronisasi Daftar Pembelian Barang dari <a href="https://buyapercetakan.mdthoster.com/#cGIvcl9iZWxpX3JrcA==" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-bold">Digit</a>
          </>
        }
      />

      <PembelianBarangClient />
    </div>
  );
}





