'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Users } from 'lucide-react';

const PAGE_SIZE = 10;

interface Employee {
  id: number;
  name: string;
  position: string;
  employee_no: string | null;
}

export default function EmployeeTable({ employees }: { employees: Employee[] }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(1); // reset ke halaman 1 saat search berubah
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* Heading & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm shrink-0">
            <Users size={16} className="text-emerald-500" /> Data Karyawan
        </h3>
        <div className="relative w-full sm:max-w-xs">
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
      <div className="card p-0 overflow-hidden flex-1 flex flex-col border border-slate-200/60 shadow-sm min-h-0">
        <div className="overflow-auto flex-1 min-h-0">
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
                  <td colSpan={4} className="py-10 text-center text-slate-500 italic text-xs">
                    {query ? 'Tidak ada hasil yang cocok.' : 'Belum ada data karyawan.'}
                  </td>
                </tr>
              ) : (
                paginated.map((emp, index) => (
                  <tr key={emp.id} className="text-[11px] hover:bg-slate-50/80 transition-colors group">
                    <td className="px-3 py-1.5 text-slate-400 w-10 text-center">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-3 py-1.5 font-medium text-slate-700">{emp.name}</td>
                    <td className="px-3 py-1.5 text-slate-500">{emp.position}</td>
                    <td className="px-3 py-1.5 text-slate-400 font-mono text-[9px] w-32">{emp.employee_no ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 shrink-0 pt-1">
        <span className="font-medium">
          {filtered.length === 0
            ? 'Tidak ada data'
            : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} dari ${filtered.length} karyawan`}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={14} />
          </button>

          <div className="flex gap-0.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-slate-300">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`min-w-[24px] h-6 rounded px-1.5 font-semibold transition-all ${
                      currentPage === p
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
