'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, X, Check } from 'lucide-react';

const PAGE_SIZE = 5;

interface Infraction {
  id: number;
  employee_name: string;
  description: string;
  date: string;
  recorded_by: string;
  order_name: string | null;
  faktur: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export default function InfractionsTable({ infractions: initial }: { infractions: Infraction[] }) {
  const router = useRouter();
  const [infractions, setInfractions] = useState<Infraction[]>(initial);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Infraction>>({});
  const [deleting, setDeleting] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

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
        inf.order_name?.toLowerCase().includes(q)
    );
  }, [infractions, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const paginated = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const startEdit = (inf: Infraction) => {
    setEditId(inf.id);
    setEditData({
      description: inf.description,
      date: inf.date?.slice(0, 10),
      recorded_by: inf.recorded_by,
      order_name: inf.order_name ?? '',
    });
  };

  const cancelEdit = () => { setEditId(null); setEditData({}); };

  const saveEdit = async (id: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/infractions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editData.description || '',
          date: editData.date,
          recorded_by: editData.recorded_by,
          order_name: editData.order_name || null,
        }),
      });
      if (res.ok) {
        setInfractions(prev =>
          prev.map(inf =>
            inf.id === id
              ? { ...inf, ...editData, date: editData.date ?? inf.date, updated_at: new Date().toISOString() }
              : inf
          )
        );
        cancelEdit();
        router.refresh();
      } else {
        const err = await res.json();
        console.error('Save failed:', err);
      }
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (id: number) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/infractions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInfractions(prev => prev.filter(inf => inf.id !== id));
        router.refresh();
      }
    } finally {
      setDeleting(null);
    }
  };

  const inputCls = 'bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500 w-full';

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Cari karyawan, deskripsi, pencatat..."
          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {paginated.length === 0 ? (
          <div className="card text-center py-8 text-slate-400 italic text-sm">
            {query ? 'Tidak ada hasil yang cocok.' : 'Belum ada riwayat kesalahan.'}
          </div>
        ) : (
          paginated.map((inf) => (
            <div key={inf.id} className="card border-slate-200 transition-colors">
              {editId === inf.id ? (
                /* Edit mode */
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-600">{inf.employee_name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveEdit(inf.id)}
                        disabled={saving}
                        className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        title="Simpan"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                        title="Batal"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">Tanggal</label>
                      <input
                        type="date"
                        value={editData.date ?? ''}
                        onChange={e => setEditData(d => ({ ...d, date: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">Dicatat Oleh</label>
                      <input
                        type="text"
                        value={editData.recorded_by ?? ''}
                        onChange={e => setEditData(d => ({ ...d, recorded_by: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Deskripsi</label>
                    <textarea
                      value={editData.description ?? ''}
                      onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
                      rows={2}
                      className={inputCls + ' resize-none'}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Order (opsional)</label>
                    <input
                      type="text"
                      value={editData.order_name ?? ''}
                      onChange={e => setEditData(d => ({ ...d, order_name: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-emerald-600">{inf.employee_name}</span>
                      <span className="text-[10px] text-slate-400">{inf.date?.slice(0, 10)}</span>
                      {inf.faktur && (
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{inf.faktur}</span>
                      )}
                    </div>
                    {inf.order_name && (
                      <span className="inline-block bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                        {inf.order_name}
                      </span>
                    )}
                    {inf.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">{inf.description}</p>
                    )}
                    <p className="text-[10px] text-slate-400">Oleh: {inf.recorded_by}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(inf)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => doDelete(inf.id)}
                      disabled={deleting === inf.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                      title="Hapus"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {(curPage - 1) * PAGE_SIZE + 1}–{Math.min(curPage * PAGE_SIZE, filtered.length)} dari {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={curPage === 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - curPage) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === '...' ? (
                <span key={`d${i}`} className="px-1">…</span>
              ) : (
                <button key={p} onClick={() => setPage(p as number)}
                  className={`w-6 h-6 rounded text-[11px] font-medium transition-colors ${curPage === p ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' : 'hover:bg-slate-100'}`}>
                  {p}
                </button>
              ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={curPage === totalPages}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
