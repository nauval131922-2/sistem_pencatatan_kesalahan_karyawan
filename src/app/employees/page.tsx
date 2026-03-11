import { getEmployees, getLastEmployeeImport } from '@/lib/actions';
import type { Metadata } from 'next';
import ExcelUpload from '@/components/ExcelUpload';
import EmployeeTable from '@/components/EmployeeTable';
import { FileSpreadsheet, Clock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'SIKKA | Daftar Karyawan',
};

export const dynamic = 'force-dynamic';


export default async function EmployeesPage() {
  console.log("Rendering EmployeesPage...");
  const employees = await getEmployees();
  console.log("Fetched employees:", employees.length);
  const lastImport = await getLastEmployeeImport();

  let importFileName = '';
  let importTime = '';

  if (lastImport) {
    try {
      const raw = JSON.parse(lastImport.raw_data as string);
      importFileName = raw.filename || '';
      
      let dateString = lastImport.created_at as string;
      // Pastikan format ISO 8601 valid dengan indikator UTC (Z)
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
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
      <PageHeader
        title="Daftar Karyawan"
        description="Upload data Karyawan dari file Excel."
      >
        {importFileName && (
          <div className="flex items-center gap-2 text-[12px] animate-in fade-in duration-700">
            <div className="flex items-center gap-1.5 bg-white text-gray-500 border border-gray-100 px-2 py-1 rounded-md shadow-sm">
              <FileSpreadsheet size={14} className="text-green-500" />
              <span className="font-semibold" title={importFileName}>{importFileName}</span>
            </div>
            <span className="text-gray-200">|</span>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Clock size={13} className="text-gray-300" />
              <span className="font-medium">Diperbarui: {importTime}</span>
            </div>
          </div>
        )}
      </PageHeader>

      <ExcelUpload />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <EmployeeTable employees={employees as any} />
      </div>
    </div>
  );
}
