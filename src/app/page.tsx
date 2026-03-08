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
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <header className="flex justify-between items-start shrink-0 mb-4">
        <div>
          <div className="border-l-4 border-green-500 pl-4 flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-800 leading-tight">Dashboard</h1>
            <HelpButton />
          </div>
          <p className="text-sm text-gray-400 mt-0.5 pl-4">Ringkasan aktivitas dan metrik sistem.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 px-1">
        {statCards.map((card) => (
          <Link 
            key={card.title} 
            href={card.href} 
            className="group bg-white border border-gray-100 shadow-sm rounded-xl py-4 px-5 cursor-pointer hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${card.classes}`}>
                  <card.icon size={16} />
                </div>
                <span className="text-xs text-gray-400 font-medium">{card.title}</span>
              </div>
            </div>
            <p className="text-2xl font-semibold text-gray-800">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ActivityTable initialLogs={logs} />
      </div>
    </div>
  );
}
