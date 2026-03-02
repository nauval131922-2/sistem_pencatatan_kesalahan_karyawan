'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import ConfirmDialog, { DialogType } from '@/components/ConfirmDialog';

const PAGE_SIZE = 10;

interface Infraction {
  id: number;
  employee_name: string;
  employee_no?: string | null;
  employee_position?: string | null;
  description: string;
  date: string;
  recorded_by: string;
  recorded_by_name?: string | null;
  recorded_by_position?: string | null;
  recorded_by_id?: number | null;
  order_name: string | null;
  order_name_display?: string | null;
  order_faktur?: string | null;
  faktur: string | null;
  jenis_barang?: string | null;
  nama_barang?: string | null;
  nama_barang_display?: string | null;
  item_faktur?: string | null;
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
  
  // Sync state with props when server data changes
  useEffect(() => {
    setInfractions(initial);
  }, [initial]);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeletingConfirm, setIsDeletingConfirm] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: DialogType;
    title: string;
    message: string;
  }>({ isOpen: false, type: 'alert', title: '', message: '' });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));
  const closeConfirm = () => {
    setConfirmDeleteId(null);
    setIsDeletingConfirm(false);
  };

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

  const requestDelete = (id: number) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = async () => {
    if (confirmDeleteId === null) return;
    const id = confirmDeleteId;
    
    setIsDeletingConfirm(true);
    setDeleting(id);
    try {
      const res = await fetch(`/api/infractions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInfractions(prev => prev.filter(inf => inf.id !== id));
        router.refresh();
        setConfirmDeleteId(null);
        setDialogConfig({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: 'Data kesalahan berhasil dihapus secara permanen.'
        });
      } else {
        const err = await res.json();
        setConfirmDeleteId(null);
        setDialogConfig({
          isOpen: true,
          type: 'error',
          title: 'Gagal',
          message: 'Gagal menghapus data: ' + (err.error || 'Unknown error')
        });
      }
    } catch (err) {
      setConfirmDeleteId(null);
      setDialogConfig({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Terjadi kesalahan jaringan atau server.'
      });
    } finally {
      setDeleting(null);
      setIsDeletingConfirm(false);
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
                <th className="px-5 py-3 font-medium whitespace-nowrap">Deskripsi</th>
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
                  <td colSpan={11} className="py-8 text-center text-slate-500 italic text-sm">
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
                          onClick={() => requestDelete(inf.id)}
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
                      {inf.employee_name || 'Karyawan Dihapus'}
                      {inf.employee_position && (
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 truncate max-w-[150px]" title={inf.employee_position}>
                          {inf.employee_position}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 max-w-[200px]">
                      <div className="text-xs line-clamp-2" title={inf.description}>
                        {inf.description || '-'}
                      </div>
                    </td>
                    <td className="px-5 py-3 truncate max-w-[200px]" title={inf.nama_barang_display || inf.nama_barang || ''}>
                      <div className="font-medium text-slate-700">{inf.nama_barang_display || inf.nama_barang || '-'}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                          {inf.jenis_barang || '-'}
                        </span>
                        {inf.item_faktur && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] font-mono text-slate-400 border border-slate-200 bg-slate-50 px-1 rounded">
                              {inf.item_faktur}
                            </span>
                          </>
                        )}
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
                      {(inf.order_name_display || inf.order_name) ? (
                        <span className="inline-block bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded border border-emerald-500/20 max-w-[150px] truncate" title={inf.order_name_display || inf.order_name || ''}>
                          {inf.order_name_display || inf.order_name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                      <div>{inf.recorded_by_name || inf.recorded_by}</div>
                      {inf.recorded_by_position && (
                        <div className="text-[10px] text-slate-300 font-normal mt-0.5" title={inf.recorded_by_position}>
                          {inf.recorded_by_position}
                        </div>
                      )}
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

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        type="danger"
        title="Hapus Data"
        message="Apakah Anda yakin ingin menghapus data kesalahan ini secara permanen? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        isLoading={isDeletingConfirm}
        onConfirm={executeDelete}
        onCancel={closeConfirm}
      />

      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={closeDialog}
      />
    </div>
  );
}
