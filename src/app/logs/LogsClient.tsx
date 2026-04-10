'use client';

import { useState, useEffect } from 'react';
import { Search, History, Clock } from 'lucide-react';
import { getActivityLogs } from '@/lib/actions';
import { formatLastUpdate } from '@/lib/date-utils';

export default function LogsClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchLogs() {
      try {
        const data = await getActivityLogs(500); // Batasi 500 log terakhir di frontend untuk performa
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase();
    return (
      (log.action_type || '').toLowerCase().includes(term) ||
      (log.table_name || '').toLowerCase().includes(term) ||
      (log.message || '').toLowerCase().includes(term) ||
      (log.recorded_by || '').toLowerCase().includes(term)
    );
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'LOGIN': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'MAINTENANCE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CRON_SYNC': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'UPLOAD':
      case 'IMPORT': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <div className="flex items-center gap-4 bg-white p-4 rounded-[8px] border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="w-full h-10 pl-10 pr-4 text-[13px] bg-gray-50 border border-gray-200 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-medium transition-all"
            placeholder="Cari berdasarkan aksi, tabel, pesan, atau user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="shrink-0 flex items-center gap-2 text-[12px] font-bold text-gray-500 px-3 py-2 bg-gray-50 rounded-[6px] border border-gray-100">
          <History size={16} />
          <span>{filteredLogs.length} Entri</span>
        </div>
      </div>

      <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col relative">
        <div className="overflow-auto flex-1 p-2">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center gap-3 text-gray-400 animate-pulse">
               <History className="w-8 h-8 animate-spin" />
               <p className="text-[13px] font-bold">Memuat histori log aktivitas...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 flex items-center justify-center text-gray-400 text-[13px] font-bold">
               Tidak ada histori log yang sesuai pencarian.
            </div>
          ) : (
            <div className="w-full space-y-2">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-[8px] border border-gray-100 hover:border-green-200 bg-white hover:bg-green-50/30 transition-all">
                  
                  <div className="flex gap-4 items-start min-w-0">
                    <div className="shrink-0 mt-1">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md border ${getActionColor(log.action_type)}`}>
                        {log.action_type}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="font-bold text-[13px] text-gray-800 break-words leading-tight">
                        {log.message}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="text-gray-300">Tabel:</span> 
                          <span className="text-gray-600 uppercase tracking-tighter">{log.table_name}</span>
                        </span>
                        {log.record_id > 0 && (
                           <>
                             <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                             <span className="text-gray-500">ID: {log.record_id}</span>
                           </>
                        )}
                        <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                        <span className="flex items-center gap-1.5 text-gray-500">
                           Oleh: <span className="font-bold text-gray-700">@{log.recorded_by || 'system'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                     <Clock size={12} className="text-gray-400" />
                     {formatLastUpdate(log.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
