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
import DatePicker from '@/components/DatePicker';

export default function StatsClient({ stats, detailedData, startDate, endDate }: { stats: any, detailedData: any, startDate?: string, endDate?: string }) {
  const router = useRouter();
  // Helper to get Date object from string YYYY-MM-DD
  const parseDate = (dateStr?: string) => dateStr ? new Date(dateStr) : null;

  const [dateStart, setDateStart] = useState<Date | null>(parseDate(startDate));
  const [dateEnd, setDateEnd] = useState<Date | null>(parseDate(endDate));
  const [isMounted, setIsMounted] = useState(false);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleApplyFilter = (newStart: Date | null, newEnd: Date | null) => {
    const params = new URLSearchParams();
    if (newStart) params.set('startDate', formatDate(newStart));
    if (newEnd) {
      // Set end date to the last day of the selected month
      const lastDay = new Date(newEnd.getFullYear(), newEnd.getMonth() + 1, 0);
      params.set('endDate', formatDate(lastDay));
    }
    
    const query = params.toString();
    router.push(`/stats${query ? `?${query}` : ''}`);
  };

  useEffect(() => {
    setIsMounted(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toDateString();
    
    const lastVisit = localStorage.getItem('stats_lastVisitDate');
    localStorage.setItem('stats_lastVisitDate', todayStr);
    const isNewDay = lastVisit !== todayStr;

    let currentStart = parseDate(startDate);
    let currentEnd = parseDate(endDate);
    let needsUpdate = false;

    // Logic: If params missing, load from localStorage
    if (!startDate) {
      const savedStart = localStorage.getItem('stats_startDate');
      if (savedStart) {
        const d = new Date(savedStart);
        if (!isNaN(d.getTime())) {
          currentStart = d;
          needsUpdate = true;
        }
      }
    }

    if (!endDate) {
      const savedEnd = localStorage.getItem('stats_endDate');
      if (savedEnd && !isNewDay) {
        const d = new Date(savedEnd);
        if (!isNaN(d.getTime())) {
          currentEnd = d;
          needsUpdate = true;
        }
      } else {
        // Reset to today on new day or if missing
        currentEnd = today;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      handleApplyFilter(currentStart, currentEnd);
    }
  }, [startDate, endDate, router]);

  // Sync state to localStorage
  useEffect(() => {
    if (!isMounted) return;
    if (dateStart) localStorage.setItem('stats_startDate', dateStart.toISOString());
    else localStorage.removeItem('stats_startDate');
  }, [dateStart, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (dateEnd) localStorage.setItem('stats_endDate', dateEnd.toISOString());
    else localStorage.removeItem('stats_endDate');
  }, [dateEnd, isMounted]);



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

  const chartData = useMemo(() => {
    return detailedData.monthlyData.map((d: any) => ({
      ...d,
      fullName: d.name
    }));
  }, [detailedData.monthlyData]);

  const displayRange = useMemo(() => {
    if (startDate && endDate) {
      const formatMonthYear = (ds: string) => {
        const d = new Date(ds);
        if (isNaN(d.getTime())) return ds;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${months[d.getMonth()]} ${d.getFullYear()}`;
      };
      return `${formatMonthYear(startDate)} - ${formatMonthYear(endDate)}`;
    }
    const currentYear = new Date().getFullYear();
    return `Tahun ${currentYear}`;
  }, [startDate, endDate]);

  return (
    <div className="flex-1 flex flex-col gap-6 pb-10 overflow-y-auto custom-scrollbar sm:px-0 animate-in fade-in duration-500">
      {/* Rentang Tanggal Selector */}
      <div className="shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 py-3.5 px-6 shadow-sm shadow-green-900/5 flex flex-col gap-4 relative z-50">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2 pl-1">
              <span className="text-[13px] font-semibold text-gray-500">Rentang Bulan</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-[150px] relative group">
                <DatePicker 
                  name="startDate"
                  value={dateStart}
                  selectionMode="month"
                  onChange={(d) => {
                    setDateStart(d);
                    handleApplyFilter(d, dateEnd);
                  }}
                />
              </div>
              <div className="w-4 h-0.5 bg-gray-100 rounded-full"></div>
              <div className="w-[150px] relative group">
                <DatePicker 
                  name="endDate"
                  value={dateEnd}
                  selectionMode="month"
                  onChange={(d) => {
                    setDateEnd(d);
                    handleApplyFilter(dateStart, d);
                  }}
                  popupAlign="left"
                />
              </div>
            </div>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl flex flex-col min-h-[500px] overflow-hidden shadow-sm shadow-green-900/5">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-blue-50/30">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-200">
                <TrendingUp size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-blue-600/60">Visualisasi Data</span>
                <h3 className="text-sm font-bold text-gray-800">Tren Kasus & Beban Bulanan</h3>
              </div>
            </div>
            <div className="text-[11px] font-bold text-blue-600 bg-white px-4 py-2 rounded-full border border-blue-100 shadow-sm">{displayRange}</div>
          </div>

          <div className="flex-1 w-full min-h-[450px] p-6">
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart 
                data={chartData} 
                margin={{ top: 20, right: 45, left: 10, bottom: 45 }}
                barGap={8}
              >
                <defs>
                  <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9ca3af" stopOpacity={0.1}/>
                    <stop offset="100%" stopColor="#9ca3af" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  xAxisId="background" 
                  dataKey="fullName" 
                  hide 
                />
                <XAxis 
                  xAxisId="foreground"
                  dataKey="fullName" 
                  axisLine={false}
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} 
                  dy={15}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }} 
                  label={{ value: 'Total Kasus', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#9ca3af', fontWeight: 'bold', offset: -5 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `Rp${(val/1000000).toFixed(1)}jt`;
                    if (val >= 1000) return `Rp${(val/1000).toFixed(0)}rb`;
                    return `Rp${val}`;
                  }}
                  label={{ 
                    value: 'Estimasi Beban', 
                    angle: 90, 
                    position: 'insideRight', 
                    fontSize: 9, 
                    fill: '#9ca3af', 
                    fontWeight: 'bold',
                    offset: -35 
                  }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 12 }}
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: '1px solid #f3f4f6', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', 
                    fontSize: '12px',
                    padding: '16px',
                    fontWeight: '700'
                  }}
                  labelStyle={{ 
                    fontWeight: '900', 
                    color: '#1f2937', 
                    marginBottom: '12px', 
                    borderBottom: '1px solid #f3f4f6',
                    paddingBottom: '8px',
                    fontSize: '13px'
                  }}
                  labelFormatter={(value, payload) => {
                    if (payload && payload.length > 0) {
                      return payload[0].payload.fullName;
                    }
                    return value;
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === 'amount') return [`Rp ${value.toLocaleString('id-ID')}`, 'Beban'];
                    if (name === 'Total Kasus') return [value, 'Total'];
                    return [value, `${name}`];
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: '700', color: '#9ca3af' }}
                />
                <Bar 
                  yAxisId="left"
                  xAxisId="background"
                  name="Total Kasus"
                  dataKey="total" 
                  fill="url(#totalGradient)" 
                  radius={[12, 12, 0, 0]} 
                  barSize={80}
                />
                <Bar 
                  yAxisId="left"
                  xAxisId="foreground"
                  name="Low"
                  dataKey="low" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  barSize={12}
                />
                <Bar 
                  yAxisId="left"
                  xAxisId="foreground"
                  name="Medium"
                  dataKey="medium" 
                  fill="#fbbf24" 
                  radius={[4, 4, 0, 0]} 
                  barSize={12}
                />
                <Bar 
                  yAxisId="left"
                  xAxisId="foreground"
                  name="High"
                  dataKey="high" 
                  fill="#f43f5e" 
                  radius={[4, 4, 0, 0]} 
                  barSize={12}
                />
                <Line 
                  yAxisId="right"
                  xAxisId="foreground"
                  type="monotone" 
                  dataKey="amount" 
                  name="amount"
                  stroke="#1f2937" 
                  strokeWidth={4}
                  dot={{ r: 5, fill: '#1f2937', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 4, stroke: '#1f2937', fill: '#fff' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Pie Chart */}
        <div className="bg-white border border-gray-100 rounded-2xl flex flex-col min-h-[400px] overflow-hidden shadow-sm shadow-green-900/5">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-red-50/30">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-sm shadow-red-200">
                <ShieldAlert size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-red-600/60">Komposisi Kasus</span>
                <h3 className="text-sm font-bold text-gray-800">Distribusi Severitas</h3>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full flex flex-col items-center justify-center relative p-6">
            <div className="relative w-full h-[220px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={severityColors[entry.name]} className="outline-none hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: '700' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center justify-center w-[110px] h-[110px] bg-white rounded-full shadow-inner border border-gray-50">
                  <span className="text-3xl font-semibold text-gray-800 tracking-tighter leading-none">{stats.totalInfractions}</span>
                  <span className="text-[8px] text-gray-400 font-bold mt-1 text-center">Total Kasus</span>
                </div>
              </div>
            </div>

            <div className="w-full space-y-2 mt-8 px-1">
              {pieData.map((item, idx) => (
                <div key={idx} className="group flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-white hover:bg-gray-50/50 transition-all shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: severityColors[item.name] }}></div>
                    <p className="text-[11px] font-bold text-gray-500">{item.name} Severity</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-800">{item.value}</span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2.5 py-1.5 rounded-lg min-w-[45px] text-center">
                      {Math.round(item.value / (stats.totalInfractions || 1) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Top Repeaters List */}
        <div className="bg-white border border-gray-100 rounded-2xl flex flex-col min-h-[350px] overflow-hidden shadow-sm shadow-green-900/5">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-green-50/30">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-green-600 text-white flex items-center justify-center shadow-sm shadow-green-200">
                <UserMinus size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-green-600/60">Identifikasi Resiko</span>
                <h3 className="text-sm font-bold text-gray-800">Karyawan Repeaters (Top Kasus)</h3>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-white p-4 custom-scrollbar">
            {detailedData.topRepeaters.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-gray-200 mb-4">
                   <Users size={32} />
                </div>
                <p className="text-[11px] font-bold text-gray-300">Belum ada rekaman kasus</p>
              </div>
            ) : (
              <div className="space-y-3">
                {detailedData.topRepeaters.map((emp: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-center justify-between border border-gray-50 bg-white rounded-xl hover:bg-green-50/30 transition-all hover:shadow-sm hover:shadow-green-900/5 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center font-bold text-xs border border-gray-100 group-hover:bg-green-600 group-hover:text-white group-hover:border-green-500 transition-all">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 tracking-tight leading-tight mb-1">{emp.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-gray-400 font-bold tracking-tight">{emp.position}</p>
                          <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                          <p className="text-[11px] text-green-600 font-bold tracking-tight">
                            Rp {new Intl.NumberFormat('id-ID').format(emp.total_amount || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {emp.low_count > 0 && (
                        <div className="px-2.5 py-1.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-lg border border-green-100 uppercase leading-none">
                          {emp.low_count} L
                        </div>
                      )}
                      {emp.med_count > 0 && (
                        <div className="px-2.5 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100 uppercase leading-none">
                          {emp.med_count} M
                        </div>
                      )}
                      {emp.high_count > 0 && (
                        <div className="px-2.5 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 uppercase leading-none shadow-sm">
                          {emp.high_count} H
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 bg-slate-600 flex justify-center">
             <Link href="/records" className="text-[11px] font-bold text-white hover:text-green-400 transition-all flex items-center gap-2">
               Lihat Semua Laporan <ChevronRight size={16} />
             </Link>
          </div>
        </div>


      </div>
    </div>
  );
}


















