import OrderProduksiClient from './OrderProduksiClient';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'SIKKA | Order Produksi',
};

export const dynamic = 'force-dynamic';


export default function OrdersPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Order Produksi"
        description={
          <>
            Tarik data Order Produksi dari <a href="https://digit.ptbuya.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-bold">Digit</a>
          </>
        }
      />

      <OrderProduksiClient />
    </div>
  );
}
