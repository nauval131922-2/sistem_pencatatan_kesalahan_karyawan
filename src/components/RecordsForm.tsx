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

interface SearchableSelectProps {
  label: React.ReactNode;
  name: string;
  options: any[];
  placeholder: string;
  required?: boolean;
  displayFn: (o: any) => string;
  valueFn: (o: any) => string | number;
  defaultValue?: string | number | null;
  dropdownPos?: 'up' | 'down';
}

function SearchableSelect({
  label,
  name,
  options,
  placeholder,
  required,
  displayFn,
  valueFn,
  defaultValue,
  dropdownPos = 'down',
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultValue !== undefined && defaultValue !== null) {
      const found = options.find((o) => String(valueFn(o)) === String(defaultValue));
      if (found) setSelected(found);
    } else {
      setSelected(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

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
      <label className="flex items-baseline text-xs font-semibold text-slate-500 uppercase mb-2">{label}</label>
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
        <div className={`absolute z-[100] w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden ${
          dropdownPos === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
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
  editingInfraction,
  onCancelEdit,
  onSuccessEdit,
}: {
  employees: Employee[];
  orders: Order[];
  editingInfraction?: any;
  onCancelEdit?: () => void;
  onSuccessEdit?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastFaktur, setLastFaktur] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [fakturPreview, setFakturPreview] = useState<string>('Memuat...');
  const [description, setDescription] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (editingInfraction) {
      setDescription(editingInfraction.description || '');
      
      let parsedDate = new Date();
      if (editingInfraction.date) {
        const dateStr = editingInfraction.date;
        const parts = dateStr.slice(0, 10).split('-');
        let d = new Date(dateStr);
        if (parts.length === 3) {
          if (parts[2].length === 4) {
             // DD-MM-YYYY
             d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else if (parts[0].length === 4) {
             // YYYY-MM-DD
             d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
          }
        }
        
        if (!isNaN(d.getTime())) {
          parsedDate = d;
        }
      }
      setSelectedDate(parsedDate);
      setFakturPreview(editingInfraction.faktur || 'Tanpa Faktur');
    } else {
      setDescription('');
      setSelectedDate(new Date());
    }
  }, [editingInfraction]);

  useEffect(() => {
    async function fetchNextFaktur() {
      if (editingInfraction) return; // Freeze faktur if editing
      
      try {
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        const res = await fetch(`/api/infractions/next-faktur?date=${dateStr}`);
        if (res.ok) {
          const data = await res.json();
          setFakturPreview(data.nextFaktur);
        } else {
          setFakturPreview('ERR-DDMMYY-AUTO');
        }
      } catch (err) {
        setFakturPreview('ERR-DDMMYY-AUTO');
      }
    }
    fetchNextFaktur();
  }, [selectedDate, editingInfraction]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const employeeId = formData.get('employee_id');
    if (!employeeId) { alert('Pilih karyawan terlebih dahulu'); return; }

    const recordedBy = formData.get('recorded_by');
    if (!recordedBy) { alert('Pilih "Dicatat Oleh" terlebih dahulu'); return; }

    const orderName = formData.get('order_name');
    if (!orderName) { alert('Pilih "Order Produksi" terlebih dahulu'); return; }

    const isEdit = !!editingInfraction;

    // Tambahkan konfirmasi dialog sebelum melakukan penyimpanan
    const confirmMessage = isEdit 
      ? 'Apakah Anda yakin ingin menyimpan perubahan pada data kesalahan ini?'
      : 'Apakah Anda yakin ingin mencatat data kesalahan baru ini?';
      
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const endpoint = isEdit ? `/api/infractions/${editingInfraction.id}` : '/api/infractions';
      const method = isEdit ? 'PUT' : 'POST';

      // if editing, we need to pass data as JSON because the previous edit method was JSON based
      let body: any = formData;
      let headers: HeadersInit = {};
      
      if (isEdit) {
        headers = { 'Content-Type': 'application/json' };
        // Build JSON from FormData
        const updateData: Record<string, any> = {};
        formData.forEach((value, key) => { updateData[key] = value });
        // The API route for PUT expects description, date, recorded_by, order_name.
        // And employee_id if we want to change it (though usually not on the backend, let's pass it anyway)
        body = JSON.stringify(updateData);
      }

      const res = await fetch(endpoint, { method, headers, body });

      if (res.ok) {
        if (!isEdit) {
          const data = await res.json();
          setLastFaktur(data.faktur ?? null);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 5000);
          formRef.current?.reset();
          setDescription('');
          setSelectedDate(new Date());
          setResetKey(k => k + 1);
        }
        
        if (onSuccessEdit) onSuccessEdit();
        window.location.reload();
      } else {
        const err = await res.json();
        alert('Gagal menyimpan: ' + (err.error || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-slate-800';

  return (
    <div className="card glass overflow-visible">
      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
        <AlertTriangle className="text-amber-500" size={18} />
        {editingInfraction ? 'Edit Kesalahan' : 'Catat Kesalahan'}
      </h3>

      {/* Faktur preview */}
      <div className="mb-4 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">No. Faktur</span>
        <span className="ml-auto font-mono text-xs text-emerald-600 font-semibold tracking-wide">
          {fakturPreview}
        </span>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <DatePicker 
              name="date" 
              required 
              label="Tanggal" 
              onChange={setSelectedDate} 
              value={selectedDate} 
            />
          </div>
          <div className="flex-[2]">
            <SearchableSelect
              key={`emp-${resetKey}`}
              label="Pilih Karyawan"
              name="employee_id"
              options={employees}
              placeholder="Cari karyawan..."
              required
              displayFn={(e) => `${e.name}${e.position ? ` — ${e.position}` : ''}`}
              valueFn={(e) => e.id}
              defaultValue={editingInfraction?.employee_name ? employees.find(e => e.name === editingInfraction.employee_name)?.id : undefined}
            />
          </div>
        </div>

        <SearchableSelect
          key={`ord-${resetKey}`}
          label="Order Produksi"
          name="order_name"
          options={orders}
          placeholder="Pilih order..."
          required
          displayFn={(o) => `${o.faktur} — ${o.nama_prd}`}
          valueFn={(o) => o.nama_prd}
          defaultValue={editingInfraction?.order_name}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <SearchableSelect
          key={`rec-${resetKey}`}
          label="Dicatat Oleh"
          name="recorded_by"
          options={employees}
          placeholder="Pilih pencatat..."
          required
          displayFn={(e) => e.name}
          valueFn={(e) => e.name}
          defaultValue={editingInfraction?.recorded_by}
        />

        <div className="flex gap-2">
          {editingInfraction && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 py-2.5 rounded-lg font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-white transition-colors disabled:opacity-60 ${
              editingInfraction ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading ? 'Menyimpan...' : editingInfraction ? 'Simpan' : 'Simpan'}
          </button>
        </div>

        {success && (
          <div className="text-xs text-center space-y-0.5">
            <p className="text-emerald-600 font-medium">✓ {editingInfraction ? 'Perubahan pada data rincian berhasil disimpan!' : 'Kesalahan berhasil dicatat!'}</p>
            {lastFaktur && <p className="text-slate-500">No. Faktur: <span className="font-mono font-semibold text-emerald-600">{lastFaktur}</span></p>}
          </div>
        )}
      </form>
    </div>
  );
}
