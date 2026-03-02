import HppKalkulasiClient from './HppKalkulasiClient';
import type { Metadata } from 'next';
import { getLastHppImport } from '@/lib/actions';
import { FileSpreadsheet, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SIKKA | HPP Kalkulasi',
};

export default async function HppKalkulasiPage() {
  const lastImport = await getLastHppImport();

  let importFileName = '';
  let importTime = '';

  if (lastImport) {
    try {
      const raw = JSON.parse(lastImport.raw_data);
      importFileName = raw.fileName || '';
      
      let dateString = lastImport.created_at;
      if (!dateString.includes('T')) dateString = dateString.replace(' ', 'T');
      if (!dateString.endsWith('Z')) dateString += 'Z';
      
      const d = new Date(dateString); 
      
      importTime = d.toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch(e) {}
  }

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">HPP Kalkulasi</h2>
          <p className="text-zinc-500 mt-1">Upload data HPP Kalkulasi dari file Excel.</p>
          
          {importFileName && (
            <div className="flex items-center gap-3 mt-3 text-xs font-medium">
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded shadow-sm">
                <FileSpreadsheet size={12} className="text-emerald-500" />
                <span className="max-w-[150px] truncate" title={importFileName}>{importFileName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock size={12} className="opacity-70" />
                Diperbarui: {importTime}
              </div>
            </div>
          )}
        </div>
      </header>

      <HppKalkulasiClient />
    </div>
  );
}
