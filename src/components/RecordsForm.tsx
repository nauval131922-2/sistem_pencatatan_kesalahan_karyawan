'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, AlertTriangle } from 'lucide-react';
import DatePicker from '@/components/DatePicker';

interface Employee {
  id: number;
  name: string;
  position: string;
}

interface Order {
  id: string;
  faktur: string;
  nama_prd: string;
}

function SearchableSelect({
  label,
  name,
  options,
  placeholder,
  required,
  displayFn,
  valueFn,
}: {
  label: string;
  name: string;
  options: any[];
  placeholder: string;
  required?: boolean;
  displayFn: (o: any) => string;
  valueFn: (o: any) => string | number;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter((o) =>
    displayFn(o).toLowerCase().includes(query.toLowerCase())
  );

  const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-slate-800';

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{label}</label>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selected ? String(valueFn(selected)) : ''} />
      <div
        className={`${inputCls} flex items-center justify-between cursor-pointer`}
        onClick={() => { setOpen((o) => !o); setQuery(''); }}
      >
        <span className={selected ? 'text-slate-800' : 'text-slate-400'}>
          {selected ? displayFn(selected) : placeholder}
        </span>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari..."
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {!required && (
              <li
                className="px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 cursor-pointer italic"
                onClick={() => { setSelected(null); setOpen(false); }}
              >
                — Tidak dipilih
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400 italic">Tidak ada hasil</li>
            ) : (
              filtered.map((o, i) => (
                <li
                  key={i}
                  className={`px-3 py-2 text-xs cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 ${
                    selected && valueFn(selected) === valueFn(o) ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-700'
                  }`}
                  onClick={() => { setSelected(o); setOpen(false); setQuery(''); }}
                >
                  {displayFn(o)}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function RecordsForm({
  employees,
  orders,
}: {
  employees: Employee[];
  orders: Order[];
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastFaktur, setLastFaktur] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Preview faktur: REK/YYYY/MM/AUTO
  const now = new Date();
  const fakturPreview = `REK/${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/AUTO`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const employeeId = formData.get('employee_id');
    if (!employeeId) { alert('Pilih karyawan terlebih dahulu'); return; }

    const recordedBy = formData.get('recorded_by');
    if (!recordedBy) { alert('Pilih "Dicatat Oleh" terlebih dahulu'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/infractions', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setLastFaktur(data.faktur ?? null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
        formRef.current?.reset();
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-slate-800';

  return (
    <div className="card glass">
      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
        <AlertTriangle className="text-amber-500" size={18} />
        Catat Kesalahan
      </h3>

      {/* Faktur preview */}
      <div className="mb-4 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">No. Faktur</span>
        <span className="ml-auto font-mono text-xs text-emerald-600 font-semibold tracking-wide">{fakturPreview}</span>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <SearchableSelect
          label="Pilih Karyawan"
          name="employee_id"
          options={employees}
          placeholder="Cari karyawan..."
          required
          displayFn={(e) => `${e.name}${e.position ? ` — ${e.position}` : ''}`}
          valueFn={(e) => e.id}
        />

        <SearchableSelect
          label="Order Produksi (Opsional)"
          name="order_name"
          options={orders}
          placeholder="Pilih order..."
          displayFn={(o) => `${o.faktur} — ${o.nama_prd}`}
          valueFn={(o) => o.nama_prd}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
            Deskripsi Kesalahan <span className="text-slate-400 font-normal normal-case">(opsional)</span>
          </label>
          <textarea
            name="description"
            rows={3}
            className={inputCls}
            placeholder="Jelaskan detail kesalahan..."
          />
        </div>

        <DatePicker name="date" required label="Tanggal" />

        <SearchableSelect
          label="Dicatat Oleh"
          name="recorded_by"
          options={employees}
          placeholder="Pilih pencatat..."
          required
          displayFn={(e) => e.name}
          valueFn={(e) => e.name}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 disabled:opacity-60"
        >
          {loading ? 'Menyimpan...' : 'Submit Laporan'}
        </button>

        {success && (
          <div className="text-xs text-center space-y-0.5">
            <p className="text-emerald-600 font-medium">✓ Kesalahan berhasil dicatat!</p>
            {lastFaktur && <p className="text-slate-500">No. Faktur: <span className="font-mono font-semibold text-emerald-600">{lastFaktur}</span></p>}
          </div>
        )}
      </form>
    </div>
  );
}
