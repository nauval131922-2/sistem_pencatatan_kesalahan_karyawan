import OrderProduksiClient from './OrderProduksiClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SIKKA | Order Produksi',
};

export default function OrdersPage() {
  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Order Produksi</h2>
          <p className="text-zinc-500 mt-1">Tarik data Order Produksi dari <span className="gradient-text font-semibold">Digit</span></p>
        </div>
      </header>

      <OrderProduksiClient />
    </div>
  );
}
