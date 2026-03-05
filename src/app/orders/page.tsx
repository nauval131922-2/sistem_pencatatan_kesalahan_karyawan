import OrderProduksiClient from './OrderProduksiClient';
import type { Metadata } from 'next';
import HelpButton from '@/components/HelpButton';

export const metadata: Metadata = {
  title: 'SIKKA | Order Produksi',
};

export const dynamic = 'force-dynamic';


export default function OrdersPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Order Produksi</h2>
            <HelpButton />
          </div>
          <p className="text-slate-500 mt-1 text-sm">Tarik data Order Produksi dari <span className="gradient-text font-semibold text-emerald-600">Digit</span></p>
        </div>
      </header>

      <OrderProduksiClient />
    </div>
  );
}
