'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from 'recharts';
import { 
  Users, AlertTriangle, TrendingUp, BarChart3, 
  Calendar, UserMinus, ShieldAlert, ChevronRight,
  TrendingDown, AlertCircle, ChevronDown, Check
} from 'lucide-react';
import Link from 'next/link';
export default function StatsClient({ stats, detailedData, year }: { stats: any, detailedData: any, year: number }) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(year);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleYearSelect = (newYear: number) => {
    setSelectedYear(newYear);
    setIsDropdownOpen(false);
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

  const availableYears = [2024, 2025, 2026];

  return (
    <div className="flex-1 flex flex-col gap-6 pb-10 overflow-y-auto custom-scrollbar">
      {/* Year Selector - Back at the top */}
      <div className="shrink-0">
        <div className="bg-white border border-gray-200 shadow-sm rounded-[10px] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-green-600" />
            <span className="text-[13px] font-extrabold text-gray-400 uppercase tracking-wider">Tahun Analisis</span>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 border
                ${isDropdownOpen 
                  ? 'bg-white border-green-500 shadow-md ring-4 ring-green-500/10' 
                  : 'bg-slate-50 border-gray-100 hover:bg-slate-100 hover:border-gray-200 shadow-inner'
                }
              `}
            >
              <span className="text-sm font-black text-gray-700">Tahun {selectedYear}</span>
              <ChevronDown 
                size={16} 
                className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-green-600' : ''}`} 
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 pb-2 mb-1 border-b border-gray-50">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Tahun</span>
                </div>
                <div className="px-1.5 space-y-1">
                  {availableYears.map(y => (
                    <button
                      key={y}
                      onClick={() => handleYearSelect(y)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all
                        ${selectedYear === y 
                          ? 'bg-green-50 text-green-700' 
                          : 'text-gray-600 hover:bg-slate-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <span>Tahun {y}</span>
                      {selectedYear === y && <Check size={14} className="text-green-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative border-b-2 border-b-transparent hover:border-b-green-500">
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
            <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded uppercase">Jan - Des {selectedYear}</div>
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
             <Link href="/records" className="text-[11px] font-bold text-gray-400 hover:text-green-600 transition-colors uppercase flex items-center gap-1 mx-auto w-fit">
               Lihat Semua Laporan <ChevronRight size={14} />
             </Link>
          </div>
        </div>

        {/* Dynamic Actionable Insights */}
        <div className={`rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden text-white shadow-lg transition-all duration-500 ${
          stats.totalInfractions === 0 
            ? 'bg-emerald-600 shadow-emerald-100' 
            : stats.highSeverity > 0 
              ? 'bg-rose-600 shadow-rose-100' 
              : 'bg-indigo-600 shadow-indigo-100'
        }`}>
           <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
           <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-48 h-48 bg-white/5 blur-3xl rounded-full"></div>
           
           <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                 {stats.totalInfractions === 0 
                   ? <TrendingDown size={28} /> 
                   : stats.highSeverity > 0 
                     ? <ShieldAlert size={28} /> 
                     : <AlertCircle size={28} />
                 }
              </div>
              <h4 className="text-2xl font-black mb-3 leading-tight tracking-tight">
                {stats.totalInfractions === 0 
                  ? 'Kinerja Sempurna!' 
                  : stats.highSeverity > 0 
                    ? 'Peringatan Kritikal!' 
                    : 'Rekomendasi Analitik'
                }
              </h4>
              <p className="text-white/80 text-sm leading-relaxed mb-8 max-w-[400px]">
                {stats.totalInfractions === 0 
                  ? `Selamat! Tidak ada catatan kesalahan untuk tahun ${selectedYear}. Pertahankan standar operasional dan kedisiplinan yang sudah berjalan sangat baik.`
                  : stats.highSeverity > 0 
                    ? `Berdasarkan data ${selectedYear}, tercatat ${stats.highSeverity} kasus tingkat tinggi. Ini memerlukan perhatian segera untuk mencegah kerugian yang lebih besar.`
                    : `Tercatat ${stats.totalInfractions} kesalahan di tahun ${selectedYear}. Lakukan monitoring berkala untuk memastikan tren kesalahan tidak meningkat.`
                }
              </p>
              
              <div className="flex flex-wrap gap-2">
                 <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm border border-white/20 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                   {stats.totalInfractions === 0 
                     ? '⭐ Sertifikasi Kualitas' 
                     : stats.highSeverity > 0 
                       ? '🔐 Tindakan Darurat' 
                       : '📚 Edukasi SOP'
                   }
                 </div>
                 <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm border border-white/20 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                   {stats.totalInfractions === 0 
                     ? '🏆 Pertahankan Standar' 
                     : stats.highSeverity > 0 
                       ? '👥 Evaluasi Personel' 
                       : '📊 Audit Bulanan'
                   }
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
