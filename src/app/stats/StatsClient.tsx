'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell, PieChart, Pie
} from 'recharts';
import { 
  Users, AlertTriangle, TrendingUp, BarChart3, 
  Calendar, UserMinus, ShieldAlert, ChevronRight,
  ChevronRight,
  TrendingDown, AlertCircle
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function StatsClient({ stats, detailedData, year }: { stats: any, detailedData: any, year: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedYear, setSelectedYear] = useState(year);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
    router.push(`/stats?year=${newYear}`);
  };

  const statCards = [
    { label: 'Total Karyawan', value: stats.totalEmployees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Kesalahan', value: stats.totalInfractions, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Kasus Kritis (High)', value: stats.highSeverity, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Total Order', value: stats.totalOrders, icon: BarChart3, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const severityColors: any = {
    High: '#f43f5e',
    Medium: '#fbbf24',
    Low: '#10b981'
  };

  const pieData = [
    { name: 'High', value: detailedData.severityData.High || 0 },
    { name: 'Medium', value: detailedData.severityData.Medium || 0 },
    { name: 'Low', value: detailedData.severityData.Low || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        title={`Analitik Performa ${year}`}
        description="Wawasan mendalam mengenai kedisiplinan dan operasional."
        rightElement={
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm">
            <Calendar size={16} className="text-gray-400 ml-2" />
            <select 
              value={selectedYear}
              onChange={handleYearChange}
              className="bg-transparent text-sm font-bold text-gray-700 outline-none pr-4 cursor-pointer"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-xl flex items-center justify-center shrink-0`}>
                <card.icon size={24} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{card.label}</p>
                <p className="text-2xl font-black text-gray-800 tracking-tighter">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <TrendingUp size={18} />
              </div>
              <h3 className="text-sm font-bold text-gray-700">Tren Kesalahan Bulanan</h3>
            </div>
            <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded uppercase">Jan - Des {year}</div>
          </div>

          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detailedData.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#16a34a" 
                  radius={[6, 6, 0, 0]} 
                  barSize={30}
                >
                  {detailedData.monthlyData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.total > 5 ? '#ef4444' : entry.total > 2 ? '#f59e0b' : '#16a34a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Pie Chart */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col min-h-[400px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              < ShieldAlert size={18} />
            </div>
            <h3 className="text-sm font-bold text-gray-700">Distribusi Severitas</h3>
          </div>

          <div className="flex-1 w-full flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={severityColors[entry.name]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
              <span className="text-2xl font-black text-gray-800">{stats.totalInfractions}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase">Total</span>
            </div>

            <div className="w-full space-y-3 mt-6">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: severityColors[item.name] }}></div>
                    <span className="text-xs font-bold text-gray-600">{item.name} Severity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-800">{item.value}</span>
                    <span className="text-[10px] text-gray-400 font-bold">({Math.round(item.value / (stats.totalInfractions || 1) * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Repeaters List */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden min-h-[350px] flex flex-col">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <UserMinus size={18} />
              </div>
              <h3 className="text-sm font-bold text-gray-700">Top Employee Infractions (Repeaters)</h3>
            </div>
            <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Mengevaluasi Perilaku</div>
          </div>
          
          <div className="flex-1 overflow-auto">
            {detailedData.topRepeaters.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                <p className="text-sm font-bold text-gray-300">Belum ada data kesalahan tahun ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {detailedData.topRepeaters.map((emp: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold text-xs ring-4 ring-white">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-gray-700">{emp.name}</p>
                        <p className="text-[11px] text-gray-400 font-semibold">{emp.position}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-black rounded-lg border border-rose-100">
                        {emp.total} Kasus
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 bg-gray-50 text-center">
             <button className="text-[11px] font-bold text-gray-400 hover:text-green-600 transition-colors uppercase flex items-center gap-1 mx-auto">
               Lihat Semua Laporan <ChevronRight size={14} />
             </button>
          </div>
        </div>

        {/* Actionable Insights placeholder */}
        <div className="bg-indigo-600 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden text-white shadow-lg shadow-indigo-200">
           <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
           <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-48 h-48 bg-white/5 blur-3xl rounded-full"></div>
           
           <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                 <AlertCircle size={28} />
              </div>
              <h4 className="text-2xl font-black mb-3 leading-tight tracking-tight">Rekomendasi Perbaikan</h4>
              <p className="text-indigo-100/80 text-sm leading-relaxed mb-8 max-w-[400px]">
                Berdasarkan data {year}, tercatat {stats.highSeverity} kasus tingkat tinggi. Kami merekomendasikan peninjauan ulang SOP pada departemen dengan tingkat kesalahan tertinggi untuk menekan angka kecelakaan kerja atau kerugian material.
              </p>
              
              <div className="flex flex-wrap gap-3">
                 <div className="px-4 py-2 bg-white text-indigo-600 text-xs font-black rounded-xl cursor-default shadow-sm active:scale-95 transition-transform">
                   Edukasi SOP Baru
                 </div>
                 <div className="px-4 py-2 bg-indigo-500/50 backdrop-blur-sm border border-white/20 text-white text-xs font-black rounded-xl cursor-default">
                   Audit Bulanan
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
