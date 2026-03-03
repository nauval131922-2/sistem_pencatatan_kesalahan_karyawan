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
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <header className="flex justify-between items-center shrink-0 mb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Pencatatan Kesalahan</h2>
          <p className="text-slate-500 text-sm mt-0.5">Kelola dan lihat riwayat kesalahan karyawan.</p>
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
