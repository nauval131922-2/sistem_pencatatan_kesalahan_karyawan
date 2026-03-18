import HppKalkulasiClient from './HppKalkulasiClient';
import type { Metadata } from 'next';
import { getLastHppImport } from '@/lib/actions';
import { FileSpreadsheet, Clock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

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
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'Asia/Jakarta'
      });

    } catch(e) {}
  }
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700 overflow-hidden">
      <PageHeader
        title="HPP Kalkulasi"
        description="Upload data HPP Kalkulasi dari file Excel."
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <HppKalkulasiClient 
          importInfo={importFileName ? { fileName: importFileName, time: importTime } : undefined} 
        />
      </div>
    </div>
  );
}
