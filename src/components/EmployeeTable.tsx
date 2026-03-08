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
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* Heading & Search */}
      <div className="flex flex-col gap-2 mb-1 shrink-0">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users size={16} className="text-gray-400" /> Data Karyawan
        </h3>
        <div className="relative w-full shrink-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Cari karyawan..."
            className="w-full pl-10 pr-4 h-9 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-0 overflow-hidden flex flex-col flex-1 min-h-0 relative">
        <div className="flex-1 overflow-auto custom-scrollbar relative min-h-0 bg-white" onScroll={handleScroll}>
          <table className="w-full text-left relative min-w-[600px]">
            <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm">
              <tr className="text-[11px] uppercase tracking-wider text-gray-400 font-medium border-b border-gray-100">
                <th className="px-4 py-3 w-10 text-center">NO.</th>
                <th className="px-4 py-3">NAMA</th>
                <th className="px-4 py-3">JABATAN</th>
                <th className="px-4 py-3 text-right">ID KARYAWAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center h-full align-top">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Users className="text-slate-100 mb-2" size={40} />
                      <p className="text-sm font-semibold text-slate-700">{query ? 'Tidak ada hasil yang cocok.' : 'Belum ada data karyawan.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((emp, index) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3 text-xs text-gray-400 w-10 text-center">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-700 text-sm">{emp.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{emp.position}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs text-right">{emp.employee_no ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info Banner within Card Bottom */}
        <div className="p-3 border-t border-gray-100 bg-white flex items-center justify-between text-xs text-gray-400 shrink-0">
          <span className="">
            {filtered.length === 0
              ? 'Tidak ada data'
              : `Menampilkan ${paginated.length} dari ${filtered.length} karyawan`}
          </span>
        </div>
      </div>
    </div>
  );
}
