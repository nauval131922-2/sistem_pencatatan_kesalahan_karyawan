import { getStats, getActivityLogs } from '@/lib/actions';
import { Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import ActivityTable from '@/components/ActivityTable';
import PageHeader from '@/components/PageHeader';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'SIKKA | Dashboard',
};

export const dynamic = 'force-dynamic';

async function DashboardStats() {
  const stats = await getStats();
  const statCards = [
    { 
      title: 'Total Karyawan', 
      value: stats.totalEmployees, 
      icon: Users, 
      classes: 'bg-blue-50 text-blue-500', 
      href: '/employees' 
    },
    { 
      title: 'Total Kesalahan', 
      value: stats.totalInfractions, 
      icon: AlertTriangle, 
      classes: 'bg-red-50 text-red-400', 
      href: '/records' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
      {statCards.map((card) => (
        <Link 
          key={card.title} 
          href={card.href} 
          className="group bg-white border border-[#e5e7eb] rounded-[10px] p-5 h-[100px] flex items-center gap-4 shadow-sm hover:border-[#16a34a]/30 transition-all active:scale-[0.98]"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${card.classes}`}>
            <card.icon size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-800 tracking-tight leading-none mb-1.5">{card.value}</span>
            <span className="text-[12px] text-[#9ca3af] font-bold tracking-tight">{card.title}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

async function DashboardLogs() {
  const logs = await getActivityLogs(500);
  return <ActivityTable initialLogs={logs} />;
}

function StatSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
       {[1, 2].map(i => (
         <div key={i} className="bg-gray-50 border border-gray-100 rounded-[10px] p-5 h-[100px] animate-pulse"></div>
       ))}
    </div>
  );
}

export default async function Home() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Dashboard"
        description="Ringkasan aktivitas dan metrik sistem."
      />

      <Suspense fallback={<StatSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Suspense fallback={<div className="h-full bg-gray-50 rounded-xl animate-pulse border border-gray-100"></div>}>
          <DashboardLogs />
        </Suspense>
      </div>
    </div>
  );
}
