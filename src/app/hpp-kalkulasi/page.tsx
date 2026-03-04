import HppKalkulasiClient from './HppKalkulasiClient';
import type { Metadata } from 'next';
import { getLastHppImport } from '@/lib/actions';
import { FileSpreadsheet, Clock } from 'lucide-react';
import HelpButton from '@/components/HelpButton';

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
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <header className="flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">HPP Kalkulasi</h2>
            <HelpButton />
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Upload data HPP Kalkulasi dari file Excel.</p>
          
          {importFileName && (
            <div className="flex items-center gap-3 mt-2 text-[11px] font-medium">
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded shadow-sm">
                <FileSpreadsheet size={10} className="text-emerald-500" />
                <span className="max-w-[120px] truncate" title={importFileName}>{importFileName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock size={10} className="opacity-70" />
                Diperbarui: {importTime}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <HppKalkulasiClient />
      </div>
    </div>
  );
}
