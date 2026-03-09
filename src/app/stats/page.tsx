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
  const severityCounts: any = { Low: 0, Medium: 0, High: 0 };
  infractions.forEach((inf: any) => {
    severityCounts[inf.severity] = (severityCounts[inf.severity] || 0) + 1;
  });

  const cards = [
    { label: 'Indeks Kepatuhan', value: '94.2%', icon: trendingup, color: 'emerald' },
    { label: 'Rata-rata Pelanggaran', value: (stats.totalInfractions / (stats.totalEmployees || 1)).toFixed(1), icon: BarChart3, color: 'indigo' },
    { label: 'Kasus Kritis', value: stats.highSeverity, icon: AlertCircle, color: 'rose' },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700 overflow-hidden">
      <header className="flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-green-500 rounded-full shrink-0"></div>
            <h1 className="text-xl font-semibold text-gray-800 leading-tight">Statistik Performa</h1>
          </div>
          <p className="text-sm text-gray-400 mt-0.5 pl-4">Ringkasan data dan metrik kepatuhan karyawan.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 flex items-center gap-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              card.color === 'emerald' ? 'bg-emerald-50 text-emerald-500' :
              card.color === 'indigo' ? 'bg-indigo-50 text-indigo-500' :
              'bg-rose-50 text-rose-500'
            }`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400 mb-0.5">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gray-50 text-gray-400 p-1.5 rounded-lg">
              <BarChart3 size={18} />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Distribusi Severitas</h3>
          </div>
          
          <div className="space-y-6">
            {Object.entries(severityCounts).map(([sev, count]: any) => (
              <div key={sev} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-600">{sev} Severity</span>
                  <span className="text-gray-400 font-medium">{count} Kasus</span>
                </div>
                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      sev === 'High' ? 'bg-rose-500' : sev === 'Medium' ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(count / (stats.totalInfractions || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-10 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-50/30 blur-3xl rounded-full"></div>
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative">
             <BarChart3 size={32} className="text-indigo-400 animate-pulse" />
          </div>
          <h4 className="text-base font-semibold text-gray-800 mb-2">AI Insights Coming Soon</h4>
          <p className="text-gray-400 text-sm max-w-[280px] leading-relaxed">
            Statistik mendalam dan prediksi perilaku karyawan berbasis AI sedang dalam pengembangan.
          </p>
        </div>
      </div>
    </div>
  );
}

// Fix missing icons in mapping
const trendingup = TrendingUp;
