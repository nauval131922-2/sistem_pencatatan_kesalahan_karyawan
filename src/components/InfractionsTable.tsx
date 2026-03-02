'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';

const PAGE_SIZE = 10;

interface Infraction {
  id: number;
  employee_name: string;
  description: string;
  date: string;
  recorded_by: string;
  order_name: string | null;
  faktur: string | null;
  jenis_barang?: string | null;
  nama_barang?: string | null;
  jenis_harga?: string | null;
  jumlah?: number | null;
  harga?: number | null;
  total?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export default function InfractionsTable({ 
  infractions: initial,
  onEdit 
}: { 
  infractions: Infraction[];
  onEdit?: (inf: Infraction) => void;
}) {
  const router = useRouter();
  const [infractions, setInfractions] = useState<Infraction[]>(initial);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return infractions;
    const q = query.toLowerCase();
    return infractions.filter(
      (inf) =>
        inf.employee_name?.toLowerCase().includes(q) ||
        inf.description?.toLowerCase().includes(q) ||
        inf.recorded_by?.toLowerCase().includes(q) ||
        inf.date?.includes(q) ||
        inf.faktur?.toLowerCase().includes(q) ||
        inf.order_name?.toLowerCase().includes(q) ||
        inf.nama_barang?.toLowerCase().includes(q)
    );
  }, [infractions, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const paginated = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const startEdit = (inf: Infraction) => {
    onEdit?.(inf);
  };

  const doDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data kesalahan ini secara permanen?')) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch(`/api/infractions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInfractions(prev => prev.filter(inf => inf.id !== id));
        router.refresh();
        alert('Data berhasil dihapus.');
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <h3 className="text-base font-semibold mb-2">Riwayat Kesalahan</h3>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Cari karyawan, deskripsi, riwayat faktor..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: '280px' }}>
          <table className="w-full text-left relative">
            <thead className="sticky top-0 z-10">
              <tr className="text-slate-500 text-sm border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 font-medium w-24 whitespace-nowrap">Aksi</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Faktur</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Tanggal</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Karyawan</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Info Barang</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap text-right">Qty</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap text-right">Harga</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap text-right">Total</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Order</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Dicatat Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic text-sm">
                    {query ? 'Tidak ada hasil yang cocok.' : 'Belum ada riwayat kesalahan.'}
                  </td>
                </tr>
              ) : (
                paginated.map((inf) => (
                  <tr key={inf.id} className="text-sm hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3 w-24 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(inf)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => doDelete(inf.id)}
                          disabled={deleting === inf.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {inf.faktur || '-'}
                    </td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                      {inf.date ? inf.date.slice(0, 10).split('-').reverse().join('-') : '-'}
                    </td>
                    <td className="px-5 py-3 font-semibold text-emerald-600 truncate max-w-[150px]">
                      {inf.employee_name}
                      {inf.description && (
                        <div className="text-xs text-slate-400 font-normal mt-0.5 truncate max-w-[150px]" title={inf.description}>
                          {inf.description}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 truncate max-w-[200px]" title={inf.nama_barang || ''}>
                      <div className="font-medium text-slate-700">{inf.nama_barang || '-'}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                        {inf.jenis_barang || '-'}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {inf.jumlah || 0}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums" title={inf.jenis_harga || ''}>
                      <div className="text-slate-600">
                        {inf.harga ? inf.harga.toLocaleString('id-ID') : '-'}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 truncate max-w-[80px] ml-auto">
                        {inf.jenis_harga || '-'}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-emerald-700">
                      {inf.total ? inf.total.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {inf.order_name ? (
                        <span className="inline-block bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded border border-emerald-500/20 max-w-[150px] truncate" title={inf.order_name}>
                          {inf.order_name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {inf.recorded_by}
                    </td>
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
            : `${(curPage - 1) * PAGE_SIZE + 1}–${Math.min(curPage * PAGE_SIZE, filtered.length)} dari ${filtered.length} riwayat`}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={curPage === 1}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - curPage) <= 1)
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
                    curPage === p
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
            disabled={curPage === totalPages}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
