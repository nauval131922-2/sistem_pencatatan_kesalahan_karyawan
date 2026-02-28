import { getEmployees, getInfractions, fetchProductionOrders } from '@/lib/actions';
import type { Metadata } from 'next';
import RecordsForm from '@/components/RecordsForm';
import InfractionsTable from '@/components/InfractionsTable';

export const metadata: Metadata = {
  title: 'RecLog | Pencatatan Kesalahan',
};

export default async function RecordsPage() {
  const [employees, infractions, orders] = await Promise.all([
    getEmployees(),
    getInfractions(),
    fetchProductionOrders()
  ]);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Pencatatan Kesalahan</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <RecordsForm employees={employees as any} orders={orders as any} />
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold">Riwayat Kesalahan</h3>
          <InfractionsTable infractions={infractions as any} />
        </div>
      </div>
    </div>
  );
}
