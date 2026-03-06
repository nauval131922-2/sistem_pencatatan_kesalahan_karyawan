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
      {/* Heading & Search */}
      <div className="flex flex-col gap-2 mb-1 shrink-0">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
            <Users size={16} className="text-emerald-500" /> Data Karyawan
        </h3>
        <div className="relative w-full shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Cari karyawan..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden flex flex-col border border-slate-200/60 shadow-sm flex-1 min-h-0 relative">
        <div className="flex-1 overflow-auto custom-scrollbar relative min-h-0 bg-white" onScroll={handleScroll}>
          <table className="w-full text-left relative min-w-[600px]">
            <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm">
              <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200">
                <th className="px-3 py-2 font-semibold w-10 text-center">No.</th>
                <th className="px-3 py-2 font-semibold">Nama</th>
                <th className="px-3 py-2 font-semibold">Jabatan</th>
                <th className="px-3 py-2 font-semibold w-32">ID Karyawan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500 italic text-xs h-full align-top">
                    {query ? 'Tidak ada hasil yang cocok.' : 'Belum ada data karyawan.'}
                  </td>
                </tr>
              ) : (
                paginated.map((emp, index) => (
                  <tr key={emp.id} className="text-[11px] hover:bg-slate-50/80 transition-colors group">
                    <td className="px-3 py-1.5 text-slate-400 w-10 text-center">{index + 1}</td>
                    <td className="px-3 py-1.5 font-medium text-slate-700">{emp.name}</td>
                    <td className="px-3 py-1.5 text-slate-500">{emp.position}</td>
                    <td className="px-3 py-1.5 text-slate-400 font-mono text-[9px] w-32">{emp.employee_no ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info Banner within Card Bottom */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span className="font-medium">
            {filtered.length === 0
              ? 'Tidak ada data'
              : `Menampilkan ${paginated.length} dari ${filtered.length} karyawan`}
          </span>
        </div>
      </div>
    </div>
  );
}
