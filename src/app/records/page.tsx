import { getEmployees, getInfractions, fetchProductionOrders } from '@/lib/actions';
import type { Metadata } from 'next';
import RecordsTabs from '@/components/RecordsTabs';
import { Suspense } from 'react';
import HelpButton from '@/components/HelpButton';

export const metadata: Metadata = {
  title: 'SIKKA | Pencatatan Kesalahan',
};

export default async function RecordsPage() {
  // Gunakan timezone WIB (UTC+7) agar tanggal konsisten dengan tampilan lokal
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  const [employees, infractions, orders] = await Promise.all([
    getEmployees(),
    getInfractions(today, today),
    fetchProductionOrders()
  ]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <header className="flex justify-between items-center shrink-0 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Pencatatan Kesalahan</h2>
            <HelpButton />
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Kelola data kesalahan karyawan.</p>
        </div>
      </header>

      <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
        <RecordsTabs 
          employees={employees as any} 
          orders={orders as any} 
          infractions={infractions as any}
          initialPeriod={{ start: today, end: today }}
        />
      </Suspense>
    </div>
  );
}
