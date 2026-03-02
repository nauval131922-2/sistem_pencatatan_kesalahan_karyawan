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
    <div className="space-y-4">
      {/* Heading & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-base">
            <Users size={18} className="text-emerald-500" /> Data Karyawan
        </h3>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Cari nama, jabatan, atau ID karyawan..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: '280px' }}>
          <table className="w-full text-left relative">
            <thead className="sticky top-0 z-10">
              <tr className="text-slate-500 text-sm border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 font-medium w-12 whitespace-nowrap">No.</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Nama</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Jabatan</th>
                <th className="px-5 py-3 font-medium w-28 whitespace-nowrap">ID Karyawan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                    {query ? 'Tidak ada hasil yang cocok.' : 'Belum ada data karyawan.'}
                  </td>
                </tr>
              ) : (
                paginated.map((emp, index) => (
                  <tr key={emp.id} className="text-sm hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-500 w-12">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-5 py-3 font-medium text-slate-700">{emp.name}</td>
                    <td className="px-5 py-3 text-slate-500">{emp.position}</td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs w-28">{emp.employee_no ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {filtered.length === 0
            ? 'Tidak ada data'
            : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} dari ${filtered.length} karyawan`}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce<(number | '...')[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-2">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    currentPage === p
                      ? 'bg-emerald-500 text-white border border-emerald-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              )
            )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
