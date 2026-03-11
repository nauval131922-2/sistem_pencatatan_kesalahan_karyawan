'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import { Search, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 20;

interface Employee {
  id: number;
  name: string;
  position: string;
  employee_no: string | null;
}

export default function EmployeeTable({ employees }: { employees: Employee[] }) {
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sikka_data_updated') {
        startTransition(() => {
          router.refresh();
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  const filtered = useMemo(() => {
    if (!query.trim()) return employees;
    const q = query.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        (emp.position || '').toLowerCase().includes(q) ||
        (emp.employee_no || '').toLowerCase().includes(q)
    );
  }, [employees, query]);

  const paginated = filtered.slice(0, visibleCount);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setVisibleCount(PAGE_SIZE); // reset ke kumpulan awal saat search berubah
  };
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (visibleCount < filtered.length) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
      }
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Heading & Search Container */}
      <div className="flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-extrabold text-gray-800 flex items-center gap-2">
              <Users size={18} className="text-green-600" /> 
              <span>Data Karyawan</span>
          </h3>
        </div>
        <div className="relative w-full shrink-0 group">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Cari karyawan..."
            className="w-full pl-11 pr-4 h-10 bg-white border border-gray-200 rounded-[10px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-medium placeholder:text-gray-300 shadow-sm"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-[10px] overflow-hidden flex flex-col flex-1 min-h-0 relative">
        <div className="flex-1 overflow-auto custom-scrollbar relative min-h-0" onScroll={handleScroll}>
          <table className="w-full text-left relative min-w-[600px] border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
              <tr className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                <th className="px-5 py-3 w-14 text-center">No.</th>
                <th className="px-5 py-3">Nama Karyawan</th>
                <th className="px-5 py-3">Jabatan / Posisi</th>
                <th className="px-5 py-3 text-right">ID Karyawan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="text-gray-100 mb-3" size={48} />
                      <p className="text-sm font-bold text-gray-700">
                        {query ? 'Tidak ada hasil yang cocok.' : 'Belum ada data karyawan.'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Silakan hapus kata kunci atau upload file baru.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((emp, index) => (
                  <tr key={emp.id} className="hover:bg-green-50/30 transition-colors even:bg-[#f9fafb] group h-10">
                    <td className="px-5 py-1 text-[11px] font-bold text-gray-300 w-14 text-center">{index + 1}</td>
                    <td className="px-5 py-1 font-bold text-gray-700 text-[13px]">{emp.name}</td>
                    <td className="px-5 py-1 text-gray-500 text-[13px] font-medium">{emp.position}</td>
                    <td className="px-5 py-1 text-gray-400 font-bold text-[12px] text-right tracking-tight">{emp.employee_no ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info Banner */}
        <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center justify-between text-[12px] font-medium text-gray-400 shrink-0">
          <span>
            {filtered.length === 0
              ? 'Tidak ada data ditemukan'
              : `Menampilkan ${paginated.length} dari ${filtered.length} karyawan`}
          </span>
        </div>
      </div>
    </div>
  );
}
