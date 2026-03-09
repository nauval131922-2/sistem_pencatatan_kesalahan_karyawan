import { getEmployees, getInfractions, fetchProductionOrders } from '@/lib/actions';
import { getSession } from '@/lib/session';
import type { Metadata } from 'next';
import RecordsTabs from '@/components/RecordsTabs';
import { Suspense } from 'react';
import HelpButton from '@/components/HelpButton';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'SIKKA | Pencatatan Kesalahan',
};

export const dynamic = 'force-dynamic';


export default async function RecordsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Gunakan timezone WIB (UTC+7) agar tanggal konsisten dengan tampilan lokal
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  const [employees, infractions, orders] = await Promise.all([
    getEmployees(),
    getInfractions(today, today),
    fetchProductionOrders()
  ]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <header className="flex justify-between items-center shrink-0 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-green-500 rounded-full shrink-0"></div>
            <h1 className="text-xl font-semibold text-gray-800 leading-tight">Pencatatan Kesalahan</h1>
            <HelpButton />
          </div>
          <p className="text-sm text-gray-400 mt-0.5 pl-4">Kelola data kesalahan karyawan.</p>
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
