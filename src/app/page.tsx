import { getStats, getActivityLogs } from '@/lib/actions';
import { Users, AlertTriangle, Package } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import ActivityTable from '@/components/ActivityTable';

export const metadata: Metadata = {
  title: 'SIKKA | Dashboard',
};

export default async function Home() {
  const [stats, logs] = await Promise.all([
    getStats(),
    getActivityLogs(500)
  ]);

  const statCards = [
    { title: 'Total Karyawan', value: stats.totalEmployees, icon: Users, classes: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', href: '/employees' },
    { title: 'Total Kesalahan', value: stats.totalInfractions, icon: AlertTriangle, classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20', href: '/records' },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
      <header className="flex justify-between items-start shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Dashboard</h2>
          <p className="text-slate-500 mt-1 text-sm">Ringkasan aktivitas dan metrik sistem.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href} className="card relative overflow-hidden cursor-pointer hover:border-emerald-300 transition-colors block p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl border ${card.classes}`}>
                <card.icon size={24} />
              </div>
              <h3 className="text-slate-400 font-medium text-sm">{card.title}</h3>
            </div>
            <p className="text-4xl font-bold text-slate-800">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ActivityTable initialLogs={logs} />
      </div>
    </div>
  );
}
