import { getStats, getInfractions } from '@/lib/actions';
import { BarChart3, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SIKKA | Statistik Performa',
};

export default async function StatsPage() {
  const [stats, infractions] = await Promise.all([
    getStats(),
    getInfractions()
  ]);

  // Simple severity distribution
  const severitycounts: any = { Low: 0, Medium: 0, High: 0 };
  infractions.forEach((inf: any) => {
    severitycounts[inf.severity] = (severitycounts[inf.severity] || 0) + 1;
  });

  const cards = [
    { label: 'Indeks Kepatuhan', value: '94.2%', icon: trendingup, color: 'emerald' },
    { label: 'Rata-rata Pelanggaran', value: (stats.totalInfractions / (stats.totalEmployees || 1)).toFixed(1), icon: BarChart3, color: 'indigo' },
    { label: 'Kasus Kritis', value: stats.highSeverity, icon: AlertCircle, color: 'rose' },
  ];

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Statistik Performa</h2>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="card flex items-center gap-6">
            <div className={`p-4 rounded-2xl bg-${card.color}-500/10 text-${card.color}-400`}>
              <card.icon size={28} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{card.label}</p>
              <p className="text-3xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="text-base font-semibold mb-6">Distribusi Severitas</h3>
          <div className="space-y-6">
            {Object.entries(severitycounts).map(([sev, count]: any) => (
              <div key={sev} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{sev}</span>
                  <span className="text-slate-400">{count} Kasus</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      sev === 'High' ? 'bg-rose-500' : sev === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(count / (stats.totalInfractions || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card glass relative overflow-hidden flex flex-col justify-center items-center text-center p-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[80px] rounded-full"></div>
          <BarChart3 size={60} className="text-indigo-400 mb-6 opacity-40" />
          <h4 className="text-lg font-semibold mb-2">AI Insights Coming Soon</h4>
          <p className="text-slate-400 text-sm max-w-[280px]">
            Statistik mendalam dan prediksi perilaku karyawan berbasis AI sedang dalam pengembangan.
          </p>
        </div>
      </div>
    </div>
  );
}

// Fix missing icons in mapping
const trendingup = TrendingUp;
