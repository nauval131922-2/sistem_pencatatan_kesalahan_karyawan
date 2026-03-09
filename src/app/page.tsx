import { getStats, getActivityLogs } from '@/lib/actions';
import { Users, AlertTriangle, Package } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import ActivityTable from '@/components/ActivityTable';
import HelpButton from '@/components/HelpButton';

export const metadata: Metadata = {
  title: 'SIKKA | Dashboard',
};

export const dynamic = 'force-dynamic';


export default async function Home() {
  const [stats, logs] = await Promise.all([
    getStats(),
    getActivityLogs(500)
  ]);

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
    <div className="flex-1 min-h-0 flex flex-col gap-6 -m-8 p-8 bg-white animate-in fade-in duration-500 overflow-hidden">
      <header className="flex flex-col shrink-0">
        <div className="flex items-center gap-3 border-l-4 border-green-500 pl-4">
          <h1 className="text-[22px] font-extrabold text-gray-800 tracking-tight leading-none">Dashboard</h1>
          <HelpButton />
        </div>
        <p className="text-[13px] text-gray-400 font-medium pl-5 mt-2">
          Ringkasan aktivitas dan metrik sistem.
        </p>
      </header>

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

      <div className="flex-1 flex flex-col overflow-hidden">
        <ActivityTable initialLogs={logs} />
      </div>
    </div>
  );
}
