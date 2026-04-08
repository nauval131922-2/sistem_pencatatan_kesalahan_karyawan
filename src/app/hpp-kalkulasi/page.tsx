import HppKalkulasiClient from './HppKalkulasiClient';
import HppKalkulasiExcelUpload from './HppKalkulasiExcelUpload';
import type { Metadata } from 'next';
import { getLastHppImport } from '@/lib/actions';
import PageHeader from '@/components/PageHeader';
import { formatLastUpdate } from '@/lib/date-utils';

export const metadata: Metadata = {
  title: 'SINTAK | HPP Kalkulasi',
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
      
      importTime = formatLastUpdate(d);

    } catch(e) {
      console.warn('Failed to parse HPP import metadata');
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="HPP Kalkulasi"
        description="Upload data HPP Kalkulasi dari file Excel."
      />

      <div className="flex-1 min-h-0 flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 md:px-6">
        <HppKalkulasiExcelUpload />

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <HppKalkulasiClient 
            importInfo={importFileName ? { fileName: importFileName, time: importTime } : undefined} 
          />
        </div>
      </div>
    </div>
  );
}





