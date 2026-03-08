import HppKalkulasiClient from './HppKalkulasiClient';
import type { Metadata } from 'next';
import { getLastHppImport } from '@/lib/actions';
import { FileSpreadsheet, Clock } from 'lucide-react';
import HelpButton from '@/components/HelpButton';

export const metadata: Metadata = {
  title: 'SIKKA | HPP Kalkulasi',
};

export const dynamic = 'force-dynamic';


export default async function HppKalkulasiPage() {
  const lastImport = await getLastHppImport();

  let importFileName = '';
  let importTime = '';

  if (lastImport) {
    try {
      const raw = JSON.parse(lastImport.raw_data as string);
      importFileName = raw.fileName || '';
      
      let dateString = lastImport.created_at as string;
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
          <div className="border-l-4 border-green-500 pl-4 flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-800 leading-tight">HPP Kalkulasi</h1>
            <HelpButton />
          </div>
          <p className="text-sm text-gray-400 mt-0.5 pl-4">Upload data HPP Kalkulasi dari file Excel.</p>
          
          {importFileName && (
            <div className="flex items-center gap-3 mt-2 pl-4">
              <div className="flex items-center gap-1.5 bg-gray-50 text-gray-600 border border-gray-200 text-xs px-2 py-1 rounded-md shadow-sm">
                <FileSpreadsheet size={10} className="text-gray-400" />
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

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <HppKalkulasiClient />
      </div>
    </div>
  );
}
