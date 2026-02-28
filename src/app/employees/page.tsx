import { getEmployees } from '@/lib/actions';
import type { Metadata } from 'next';
import ExcelUpload from '@/components/ExcelUpload';
import EmployeeTable from '@/components/EmployeeTable';

export const metadata: Metadata = {
  title: 'RecLog | Daftar Karyawan',
};

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Daftar Karyawan</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ExcelUpload />
        </div>

        <div className="lg:col-span-2">
          <EmployeeTable employees={employees as any} />
        </div>
      </div>
    </div>
  );
}
