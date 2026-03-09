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


async function RecordsContent({ today }: { today: string }) {
  const [employees, infractions, orders] = await Promise.all([
    getEmployees(),
    getInfractions(today, today),
    fetchProductionOrders()
  ]);

  return (
    <RecordsTabs 
      employees={employees as any} 
      orders={orders as any} 
      infractions={infractions as any}
      initialPeriod={{ start: today, end: today }}
    />
  );
}

export default async function RecordsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Gunakan timezone WIB (UTC+7) agar tanggal konsisten dengan tampilan lokal
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <header className="flex flex-col shrink-0 mb-3">
        <div className="flex items-center gap-3 border-l-4 border-green-500 pl-4">
          <h1 className="text-[22px] font-extrabold text-gray-800 tracking-tight leading-none">Pencatatan Kesalahan</h1>
          <HelpButton />
        </div>
        <p className="text-[13px] text-gray-400 font-medium pl-5 mt-2">
          Kelola data kesalahan karyawan dan rincian bebannya.
        </p>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Suspense fallback={<RecordsSkeleton />}>
          <RecordsContent today={today} />
        </Suspense>
      </div>
    </div>
  );
}

function RecordsSkeleton() {
  return (
    <div className="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col p-6 animate-pulse">
      <div className="flex gap-4 mb-6">
        <div className="h-10 w-32 bg-gray-100 rounded-lg"></div>
        <div className="h-10 w-32 bg-gray-100 rounded-lg"></div>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 space-y-4">
          <div className="h-64 bg-gray-50 rounded-2xl border border-gray-100"></div>
          <div className="h-12 bg-gray-50 rounded-xl border border-gray-100"></div>
        </div>
        <div className="col-span-7">
          <div className="h-full bg-gray-50 rounded-2xl border border-gray-100 min-h-[400px]"></div>
        </div>
      </div>
    </div>
  );
}
