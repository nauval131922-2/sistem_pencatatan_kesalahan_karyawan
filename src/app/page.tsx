import { getStats, getInfractions } from '@/lib/actions';
import { Users, AlertTriangle, ShieldCheck, Activity, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RecLog | Dashboard',
};

export default async function Home() {
  const [stats, infractions] = await Promise.all([
    getStats(),
    getInfractions()
  ]);

  const recentInfractions = infractions.slice(0, 5);

  const severityColors: any = {
    Low: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20',
    Medium: 'text-amber-400 bg-amber-400/10 border-amber-500/20',
    High: 'text-rose-400 bg-rose-400/10 border-rose-500/20'
  };

  const statCards = [
    { title: 'Total Karyawan', value: stats.totalEmployees, icon: Users, color: 'emerald', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { title: 'Total Kesalahan', value: stats.totalInfractions, icon: AlertTriangle, color: 'amber', classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  ];

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className="card group relative overflow-hidden">
            <div className={`absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
               <card.icon size={120} />
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl border ${card.classes}`}>
                <card.icon size={24} />
              </div>
              <h3 className="text-slate-400 font-medium text-sm">{card.title}</h3>
            </div>
            
            <p className="text-4xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card">
          <h3 className="text-base font-semibold mb-4">Aktivitas Terkini</h3>
          <div className="space-y-4">
            {recentInfractions.length === 0 ? (
              <p className="text-slate-500 italic text-sm">Belum ada aktivitas yang dicatat.</p>
            ) : (
              recentInfractions.map((inf: any) => (
                <div key={inf.id} className="card hover:border-emerald-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 p-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Clock size={11} />
                        <span>{inf.created_at ? new Date(inf.created_at).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : inf.date}
                        </span>
                      </span>
                      {inf.recorded_by && (
                        <span className="text-xs text-slate-400">• dicatat oleh <span className="text-slate-600 font-medium">{inf.recorded_by}</span></span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-emerald-600 text-sm">{inf.employee_name}</h4>
                      {inf.order_name && (
                        <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20 truncate max-w-[200px] text-[10px]">
                          {inf.order_name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-1">{inf.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
