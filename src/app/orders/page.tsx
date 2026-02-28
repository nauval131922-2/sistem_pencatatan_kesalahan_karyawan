import { fetchProductionOrders } from '@/lib/actions';
import { Package, Hash, User, Calendar } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RecLog | Order Produksi',
};

export default async function OrdersPage() {
  const orders = await fetchProductionOrders();

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Order Produksi</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {orders.length === 0 ? (
          <div className="card text-center py-20 text-slate-500 flex flex-col items-center">
             <Package size={48} className="mb-4 opacity-20" />
             <p>Tidak ada data order ditemukan atau terjadi kesalahan koneksi.</p>
          </div>
        ) : (
          <div className="card overflow-x-auto p-0 border-none bg-transparent">
            <table className="w-full text-left glass rounded-2xl overflow-hidden border-separate border-spacing-0">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 border-b border-white/5 font-semibold">No. Faktur</th>
                  <th className="px-6 py-4 border-b border-white/5 font-semibold">Nama Produk</th>
                  <th className="px-6 py-4 border-b border-white/5 font-semibold">Pelanggan</th>
                  <th className="px-6 py-4 border-b border-white/5 font-semibold">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order: any) => (
                  <tr key={order.id} className="text-sm hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-indigo-400 font-medium">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="opacity-40" />
                        {order.faktur}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <div className="max-w-md truncate" title={order.nama_prd}>
                        {order.nama_prd}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      <div className="flex items-center gap-2">
                        <User size={14} className="opacity-40" />
                        {order.kd_pelanggan}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="opacity-40" />
                        {order.tgl}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
