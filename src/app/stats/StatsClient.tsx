'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Line, ComposedChart, Legend
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



  const severityColors: any = {
    High: '#f43f5e',
    Medium: '#fbbf24',
    Low: '#10b981'
  };

  const pieData = useMemo(() => [
    { name: 'High', value: detailedData.severityData.High || 0 },
    { name: 'Medium', value: detailedData.severityData.Medium || 0 },
    { name: 'Low', value: detailedData.severityData.Low || 0 },
  ].filter(d => d.value > 0), [detailedData.severityData]);

  const availableYears = [2024, 2025, 2026];

  const chartData = useMemo(() => {
    return detailedData.monthlyData.map((d: any) => ({
      ...d,
      fullName: `${d.name} ${selectedYear}`
    }));
  }, [detailedData.monthlyData, selectedYear]);

  return (
    <div className="flex-1 flex flex-col gap-5 pb-10 overflow-y-auto custom-scrollbar sm:px-0">
      {/* Year Selector - Neo-brutalist */}
      <div className="shrink-0">
        <div className="bg-white border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] rounded-none px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={18} strokeWidth={3} className="text-black" />
            <span className="text-[11px] font-black text-black uppercase tracking-[0.2em]">Tahun Analisis Statistik</span>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button 
               onClick={() => setIsDropdownOpen(!isDropdownOpen)}
               className={`
                 flex items-center gap-4 px-5 py-2.5 rounded-none transition-all duration-200 border-[3px] border-black font-black uppercase tracking-widest text-xs
                 ${isDropdownOpen 
                   ? 'bg-[#fde047] text-black shadow-none translate-x-[2px] translate-y-[2px]' 
                   : 'bg-white text-black shadow-[2.5px_2.5px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2.5px_2.5px_0_0_#000]'
                 }
               `}
             >
               <span>Tahun {selectedYear}</span>
               <ChevronDown 
                 size={16} 
                 strokeWidth={3}
                 className={`text-black transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} 
               />
             </button>

            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-4 w-44 bg-white border-[3px] border-black rounded-none shadow-[3.5px_3.5px_0_0_#000] z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 pb-2 mb-2 border-b-[2px] border-black">
                  <span className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Pilih Tahun</span>
                </div>
                <div className="px-2 space-y-1">
                  {availableYears.map(y => (
                    <button
                      key={y}
                      onClick={() => handleYearSelect(y)}
                      className={`
                        w-full flex items-center justify-between px-4 py-2.5 rounded-none text-xs font-black uppercase tracking-widest transition-all
                        ${selectedYear === y 
                          ? 'bg-[#fde047] text-black border-[2px] border-black' 
                          : 'text-black/60 hover:bg-black hover:text-white'
                        }
                      `}
                    >
                      <span>{y}</span>
                      {selectedYear === y && <Check size={14} strokeWidth={3} className="text-black" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-3 bg-white border-[4px] border-black p-8 rounded-none flex flex-col min-h-[500px] shadow-[3.5px_3.5px_0_0_#000]">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#93c5fd] text-black border-[2px] border-black shadow-[2px_2px_0_0_#000]">
                <TrendingUp size={20} strokeWidth={3} />
              </div>
              <h3 className="text-lg font-black text-black uppercase tracking-tight">Tren Kasus & Beban Bulanan</h3>
            </div>
            <div className="text-[10px] font-black text-black bg-[#fde047] px-3 py-1.5 border-[2px] border-black uppercase tracking-widest shadow-[2px_2px_0_0_#000]">JAN - DES {selectedYear}</div>
          </div>

          <div className="flex-1 w-full min-h-[450px]">
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart 
                data={chartData} 
                margin={{ top: 20, right: 45, left: 10, bottom: 45 }}
                barGap={4}
              >
                <defs>
                  <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="100%" stopColor="#000" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#eee" />
                <XAxis 
                  xAxisId="background" 
                  dataKey="fullName" 
                  hide 
                />
                <XAxis 
                  xAxisId="foreground"
                  dataKey="fullName" 
                  axisLine={{ stroke: '#000', strokeWidth: 2 }} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }} 
                  dy={15}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={{ stroke: '#000', strokeWidth: 2 }} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 900, fill: '#000' }} 
                  label={{ value: 'KASUS', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#000', fontWeight: '900', offset: -5 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={{ stroke: '#000', strokeWidth: 2 }} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `Rp${(val/1000000).toFixed(1)}jt`;
                    if (val >= 1000) return `Rp${(val/1000).toFixed(0)}rb`;
                    return `Rp${val}`;
                  }}
                  label={{ 
                    value: 'BEBAN BIAYA', 
                    angle: 90, 
                    position: 'insideRight', 
                    fontSize: 10, 
                    fill: '#000', 
                    fontWeight: '900',
                    offset: -35 
                  }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ 
                    borderRadius: '0px', 
                    border: '3px solid #000', 
                    boxShadow: '4px 4px 0 0 #000', 
                    fontSize: '12px',
                    padding: '12px',
                    fontWeight: '900'
                  }}
                  labelStyle={{ 
                    fontWeight: '900', 
                    color: '#000', 
                    marginBottom: '8px', 
                    borderBottom: '2px solid #000',
                    paddingBottom: '4px',
                    fontSize: '13px',
                    textTransform: 'uppercase'
                  }}
                  labelFormatter={(value, payload) => {
                    if (payload && payload.length > 0) {
                      return payload[0].payload.fullName;
                    }
                    return value;
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === 'amount') return [`Rp ${value.toLocaleString('id-ID')}`, 'BEBAN'];
                    if (name === 'Total Kasus') return [value, 'TOTAL'];
                    return [value, `${name.toUpperCase()}`];
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Bar 
                  yAxisId="left"
                  xAxisId="background"
                  name="Total Kasus"
                  dataKey="total" 
                  fill="url(#totalGradient)" 
                  stroke="#000"
                  strokeWidth={2}
                  radius={[0, 0, 0, 0]} 
                  barSize={72}
                />
                <Bar 
                  yAxisId="left"
                  xAxisId="foreground"
                  name="Low"
                  dataKey="low" 
                  fill="#93c5fd" 
                  stroke="#000"
                  strokeWidth={2}
                  radius={[0, 0, 0, 0]} 
                  barSize={14}
                />
                <Bar 
                  yAxisId="left"
                  xAxisId="foreground"
                  name="Medium"
                  dataKey="medium" 
                  fill="#fde047" 
                  stroke="#000"
                  strokeWidth={2}
                  radius={[0, 0, 0, 0]} 
                  barSize={14}
                />
                <Bar 
                  yAxisId="left"
                  xAxisId="foreground"
                  name="High"
                  dataKey="high" 
                  fill="#ff5e5e" 
                  stroke="#000"
                  strokeWidth={2}
                  radius={[0, 0, 0, 0]} 
                  barSize={14}
                />
                <Line 
                  yAxisId="right"
                  xAxisId="foreground"
                  type="monotone" 
                  dataKey="amount" 
                  name="amount"
                  stroke="#000" 
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 3, stroke: '#000', fill: '#fff' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Pie Chart */}
        <div className="bg-white border-[4px] border-black p-8 rounded-none flex flex-col min-h-[400px] shadow-[3.5px_3.5px_0_0_#000]">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-[#ff5e5e] text-white border-[2px] border-black shadow-[2px_2px_0_0_#000]">
              < ShieldAlert size={20} strokeWidth={3} />
            </div>
            <h3 className="text-lg font-black text-black uppercase tracking-tight">Distribusi Severitas</h3>
          </div>

          <div className="flex-1 w-full flex flex-col items-center justify-center relative">
            <div className="relative w-full h-[220px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="#000"
                    strokeWidth={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={severityColors[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '0px', border: '3px solid #000', boxShadow: '4px 4px 0 0 #000', fontSize: '11px', fontWeight: '900' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center justify-center w-[100px] h-[100px] bg-white border-[3px] border-black rounded-full shadow-[2px_2px_0_0_#000]">
                  <span className="text-3xl font-black text-black tracking-tighter leading-none">{stats.totalInfractions}</span>
                  <span className="text-[8px] text-black font-black uppercase tracking-widest mt-1 opacity-80 text-center">TOTAL KASUS</span>
                </div>
              </div>
            </div>

            <div className="w-full space-y-2 mt-8 px-1">
              {pieData.map((item, idx) => (
                <div key={idx} className="group flex items-center justify-between p-3 rounded-none border-[2px] border-black bg-white hover:bg-black hover:text-white transition-all shadow-[2px_2px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2.5px_2.5px_0_0_#000]">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-[2px] border-black shadow-sm" style={{ backgroundColor: severityColors[item.name] }}></div>
                    <p className="text-[11px] font-black group-hover:text-white transition-colors uppercase tracking-widest">{item.name} Severity</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-black">{item.value}</span>
                    <span className="text-[10px] font-black bg-black text-white group-hover:bg-white group-hover:text-black px-2 py-1 border border-transparent group-hover:border-black min-w-[42px] text-center transition-colors">
                      {Math.round(item.value / (stats.totalInfractions || 1) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Repeaters List */}
        <div className="bg-white border-[4px] border-black rounded-none flex flex-col min-h-[350px] overflow-hidden shadow-[3.5px_3.5px_0_0_#000]">
          <div className="p-6 border-b-[3px] border-black flex items-center justify-between bg-[#fde047]">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-black text-white border-[2px] border-black shadow-[2px_2px_0_0_#fff]">
                <UserMinus size={20} strokeWidth={3} />
              </div>
              <h3 className="text-sm font-black text-black uppercase tracking-widest">Karyawan Repeaters (Top Kasus)</h3>
            </div>
            <div className="text-[10px] font-black text-black border-[2px] border-black bg-white px-3 py-1.5 uppercase tracking-widest">EVALUASI</div>
          </div>
          
          <div className="flex-1 overflow-auto bg-white p-2">
            {detailedData.topRepeaters.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center italic">
                <p className="text-sm font-black text-black/30 uppercase tracking-widest">Belum ada data rekaman</p>
              </div>
            ) : (
              <div className="space-y-2">
                {detailedData.topRepeaters.map((emp: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-center justify-between border-[2.5px] border-black bg-white hover:bg-[#fde047] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0_0_#000] group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-black text-white border-[2px] border-black flex items-center justify-center font-black text-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-black text-black uppercase tracking-tight leading-tight mb-1">{emp.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-black/50 font-black uppercase tracking-widest">{emp.position}</p>
                          <span className="w-1.5 h-1.5 bg-black/20 rounded-none"></span>
                          <p className="text-[11px] text-black font-black uppercase tracking-tight">
                            Rp {new Intl.NumberFormat('id-ID').format(emp.total_amount || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {emp.low_count > 0 && (
                        <div className="px-2 py-1 bg-[#93c5fd] text-black text-[10px] font-black border-[2px] border-black uppercase leading-none">
                          {emp.low_count} L
                        </div>
                      )}
                      {emp.med_count > 0 && (
                        <div className="px-2 py-1 bg-[#fde047] text-black text-[10px] font-black border-[2px] border-black uppercase leading-none">
                          {emp.med_count} M
                        </div>
                      )}
                      {emp.high_count > 0 && (
                        <div className="px-2 py-1 bg-[#ff5e5e] text-white text-[10px] font-black border-[2px] border-black uppercase leading-none shadow-[2px_2px_0_0_#000]">
                          {emp.high_count} H
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-5 bg-black text-center">
             <Link href="/records" className="text-[11px] font-black text-white hover:text-[#fde047] transition-all uppercase flex items-center gap-2 mx-auto w-fit tracking-[0.2em]">
               LIHAT SEMUA LAPORAN <ChevronRight size={16} strokeWidth={3} />
             </Link>
          </div>
        </div>

        {/* Dynamic Actionable Insights - Neo-brutalist */}
        <div className={`rounded-none border-[4px] border-black p-10 flex flex-col justify-center relative overflow-hidden shadow-[3.5px_3.5px_0_0_#000] transition-all duration-500 ${
          stats.totalInfractions === 0 
            ? 'bg-[#10b981]' 
            : stats.highSeverity > 0 
              ? 'bg-[#ff5e5e]' 
              : 'bg-[#93c5fd]'
        }`}>
           <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-black/10 blur-3xl rounded-full"></div>
           
           <div className="relative z-10 text-white">
              <div className="w-16 h-16 bg-white border-[3px] border-black text-black flex items-center justify-center mb-8 shadow-[2.5px_2.5px_0_0_#000]">
                 {stats.totalInfractions === 0 
                   ? <TrendingDown size={32} strokeWidth={3} /> 
                   : stats.highSeverity > 0 
                     ? <ShieldAlert size={32} strokeWidth={3} /> 
                     : <AlertCircle size={32} strokeWidth={3} />
                 }
              </div>
              <h4 className="text-3xl font-black mb-4 leading-none uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
                {stats.totalInfractions === 0 
                  ? 'Kinerja Sempurna!' 
                  : stats.highSeverity > 0 
                    ? 'Peringatan Kritikal!' 
                    : 'Wawasan Analitik'
                }
              </h4>
              <p className="text-white font-black text-sm leading-relaxed mb-10 max-w-[450px] uppercase tracking-wide opacity-90">
                {stats.totalInfractions === 0 
                  ? `Selamat! Tidak ada catatan kesalahan untuk tahun ${selectedYear}. Pertahankan standar operasional yang sudah berjalan sangat baik.`
                  : stats.highSeverity > 0 
                    ? `Berdasarkan data ${selectedYear}, tercatat ${stats.highSeverity} kasus tingkat tinggi. Segera lakukan evaluasi untuk mencegah kerugian.`
                    : `Tercatat ${stats.totalInfractions} kesalahan di tahun ${selectedYear}. Lakukan monitoring berkala untuk memastikan stabilitas operasional.`
                }
              </p>
              
              <div className="flex flex-wrap gap-3">
                 <div className="px-4 py-2 bg-white border-[2px] border-black text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-[2px_2px_0_0_#000]">
                   {stats.totalInfractions === 0 
                     ? '⭐ KUALITAS TERBAIK' 
                     : stats.highSeverity > 0 
                       ? '🔐 EMERGENCY ACTION' 
                       : '📚 EDUKASI SOP'
                   }
                 </div>
                 <div className="px-4 py-2 bg-white border-[2px] border-black text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-[2px_2px_0_0_#000]">
                   {stats.totalInfractions === 0 
                     ? '🏆 ZERO DEFECT' 
                     : stats.highSeverity > 0 
                       ? '👥 EVALUASI TIM' 
                       : '📊 AUDIT RUTIN'
                   }
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}















