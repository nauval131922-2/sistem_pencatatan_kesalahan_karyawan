import { getEmployees, getInfractions, fetchProductionOrders } from '@/lib/actions';
import type { Metadata } from 'next';
import RecordsTabs from '@/components/RecordsTabs';

export const metadata: Metadata = {
  title: 'SIKKA | Pencatatan Kesalahan',
};

export default async function RecordsPage() {
  const [employees, infractions, orders] = await Promise.all([
    getEmployees(),
    getInfractions(),
    fetchProductionOrders()
  ]);

  return (
    <div className="space-y-4 pb-48">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pencatatan Kesalahan</h2>
          <p className="text-zinc-500 mt-1">Kelola dan lihat riwayat kesalahan karyawan.</p>
        </div>
      </header>

      <RecordsTabs 
        employees={employees as any} 
        orders={orders as any} 
        infractions={infractions as any} 
      />
    </div>
  );
}
