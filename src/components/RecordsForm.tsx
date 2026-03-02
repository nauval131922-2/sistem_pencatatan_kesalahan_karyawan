'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, ChevronDown, AlertTriangle, Loader2 } from 'lucide-react';
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

interface ItemData {
  nama_barang: string;
  harga: number; // For Bahan Baku -> HPP Digit, For Barang Jadi -> hp
  harga_jual?: number; // Only For Barang Jadi -> Harga yg dr orders
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
  disabled?: boolean;
  onChange?: (val: any) => void;
  noOptionsMessage?: string;
  isLoading?: boolean;
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
  disabled = false,
  onChange,
  noOptionsMessage,
  isLoading = false,
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultValue !== undefined && defaultValue !== null) {
      const found = options.find((o) => String(valueFn(o)) === String(defaultValue));
      if (found) setSelected(found);
    } else if (defaultValue === null) {
      // Explicitly requested to clear
      setSelected(null);
    } else if (selected) {
      // If we already have a selection but options refreshed, 
      // check if our selection is still valid in the new options
      const stillExists = options.find((o) => String(valueFn(o)) === String(valueFn(selected)));
      if (stillExists) {
        setSelected(stillExists);
      } else {
        // Selection is no longer in options
        setSelected(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue, options]);

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
  const inputCls = `w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-slate-800 ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`;
  const handleSelect = (o: any) => {
    setSelected(o);
    setOpen(false);
    setQuery('');
    if (onChange) onChange(o);
  };

  return (
    <div ref={ref} className="relative">
      {label && <label className="flex items-baseline text-xs font-semibold text-slate-500 uppercase mb-2">{label}</label>}
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selected ? String(valueFn(selected)) : ''} />
      <div
        className={`${inputCls} flex items-center justify-between`}
        onClick={() => { if (!disabled) { setOpen((o) => !o); setQuery(''); } }}
      >
        <span className={selected ? 'text-slate-800 truncate block' : 'text-slate-400 block truncate'}>
          {selected ? displayFn(selected) : placeholder}
        </span>
        <ChevronDown size={14} className="text-slate-400 shrink-0 ml-2" />
      </div>

      {open && !disabled && (
        <div className={`absolute z-[200] w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden ${
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
                onClick={() => handleSelect(null)}
              >
                — Tidak dipilih
              </li>
            )}
            {isLoading ? (
              <li className="px-3 py-4 text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 size={12} className="animate-spin text-emerald-500" />
                <span>Memuat data...</span>
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400 italic">
                {noOptionsMessage || 'Tidak ada hasil'}
              </li>
            ) : (
              filtered.map((o, i) => (
                <li
                  key={i}
                  className={`px-3 py-2 text-xs cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 ${
                    selected && valueFn(selected) === valueFn(o) ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-700'
                  }`}
                  onClick={() => handleSelect(o)}
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

  // New states mimicking Excel Logic
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [jenisBarang, setJenisBarang] = useState<string>('Bahan Baku');
  
  const [items, setItems] = useState<ItemData[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [hppKalkulasiValue, setHppKalkulasiValue] = useState<number | null>(null);
  const [selectedNamaBarang, setSelectedNamaBarang] = useState<string>('');
  const [manualNamaBarang, setManualNamaBarang] = useState<string>('');
  
  const [jenisHarga, setJenisHarga] = useState<string>('HPP Digit');
  const [jumlah, setJumlah] = useState<string>('');
  const [harga, setHarga] = useState<string>('');

  // Fixed options arrays
  const jenisBarangOptions = useMemo(() => [
    { label: 'Bahan Baku', value: 'Bahan Baku' },
    { label: 'Barang Jadi', value: 'Barang Jadi' },
    { label: 'Input Manual', value: 'Input Manual' }
  ], []);

  const jenisHargaOptions = useMemo(() => [
    { label: 'HPP Digit', value: 'HPP Digit' },
    { label: 'Harga Jual Digit', value: 'Harga Jual Digit' },
    { label: 'HPP Kalkulasi', value: 'HPP Kalkulasi' }, // We don't have this DB table yet, but we will leave it as an option
    { label: 'Input Manual', value: 'Input Manual' }
  ], []);

  // Initialize data when editing
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
             d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else if (parts[0].length === 4) {
             d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
          }
        }
        if (!isNaN(d.getTime())) {
          parsedDate = d;
        }
      }
      setSelectedDate(parsedDate);
      setFakturPreview(editingInfraction.faktur || 'Tanpa Faktur');

      setSelectedOrder(editingInfraction.order_name || '');
      setJenisBarang(editingInfraction.jenis_barang || 'Bahan Baku');
      setJenisHarga(editingInfraction.jenis_harga || 'HPP Digit');
      
      if (editingInfraction.jenis_barang === 'Input Manual') {
        setManualNamaBarang(editingInfraction.nama_barang || '');
      } else {
        setSelectedNamaBarang(editingInfraction.nama_barang || '');
      }

      setJumlah(editingInfraction.jumlah ? String(editingInfraction.jumlah) : '');
      setHarga(editingInfraction.harga ? String(editingInfraction.harga) : '');
      
    } else {
      resetFormStates();
    }
  }, [editingInfraction]);

  const resetFormStates = () => {
    setDescription('');
    setSelectedDate(new Date());
    setSelectedOrder('');
    setJenisBarang('Bahan Baku');
    setJenisHarga('HPP Digit');
    setSelectedNamaBarang('');
    setManualNamaBarang('');
    setJumlah('');
    setHarga('');
  };

  // Fetch Items when Order or Jenis Barang changes
  useEffect(() => {
    async function fetchItems() {
      if (!selectedOrder || jenisBarang === 'Input Manual') {
        setItems([]);
        return;
      }
      setItemsLoading(true);
      try {
        const res = await fetch(`/api/items?order_name=${encodeURIComponent(selectedOrder)}&jenis_barang=${encodeURIComponent(jenisBarang)}`);
        if (res.ok) {
          const json = await res.json();
          setItems(json.data || []);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error(err);
        setItems([]);
      } finally {
        setItemsLoading(false);
      }
    }
    fetchItems();
  }, [selectedOrder, jenisBarang]);

  // Fetch HPP Kalkulasi for selectedOrder
  useEffect(() => {
    async function fetchHpp() {
      if (!selectedOrder) {
        setHppKalkulasiValue(null);
        return;
      }
      try {
        const res = await fetch(`/api/hpp-kalkulasi?order_name=${encodeURIComponent(selectedOrder)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setHppKalkulasiValue(json.data[0].hpp_kalkulasi);
          } else {
            setHppKalkulasiValue(0);
          }
        } else {
           setHppKalkulasiValue(null);
        }
      } catch {
        setHppKalkulasiValue(null);
      }
    }
    fetchHpp();
  }, [selectedOrder]);

  // Handle Logic Harga recalculation (Based heavily on the VBA Logic)
  const calculateAutoHarga = useCallback(() => {
    if (jenisHarga === 'Input Manual' || jenisBarang === 'Input Manual' || !selectedOrder) {
      // Leave harga as is or empty if manual. If it was already manually set, don't overwrite blindly on type change
      return; 
    }

    const actualItemName = selectedNamaBarang;
    if (!actualItemName) {
      setHarga('');
      return;
    }

    const matchedItem = items.find(i => i.nama_barang === actualItemName);
    if (!matchedItem) {
      setHarga('');
      return;
    }

    let calculatedHarga = 0;

    if (jenisBarang === 'Bahan Baku') {
      if (jenisHarga === 'HPP Digit') {
        calculatedHarga = matchedItem.harga;
      } else {
        calculatedHarga = 0; // HPP Kalkulasi & Harga Jual Digit tak ada nilainya untuk BB
      }
    } else if (jenisBarang === 'Barang Jadi') {
      if (jenisHarga === 'HPP Digit') {
        calculatedHarga = matchedItem.harga;
      } else if (jenisHarga === 'Harga Jual Digit') {
        calculatedHarga = matchedItem.harga_jual || 0;
      } else if (jenisHarga === 'HPP Kalkulasi') {
        // Apply the fetched HPP Kalkulasi for the current selected order
        calculatedHarga = hppKalkulasiValue || 0;
      }
    }

    setHarga(calculatedHarga > 0 ? String(calculatedHarga) : '');

  }, [jenisBarang, jenisHarga, selectedNamaBarang, selectedOrder, items, hppKalkulasiValue]);

  // Run calculation when dependencies change
  useEffect(() => {
    // Only auto-calc if not in editing mode initially or if user interacts
    if (!editingInfraction || (editingInfraction && items.length > 0)) {
       // We only want to auto-calculate if taking from DB. If user explicitly types manual harga, don't overwrite indiscriminately.
       // However, to deeply mimic excel, we overwrite it when these parameters change.
       calculateAutoHarga();
    }
  }, [jenisBarang, jenisHarga, selectedNamaBarang, selectedOrder, items, calculateAutoHarga, editingInfraction]);

  // Derived Total
  const totalValue = useMemo(() => {
    const j = parseFloat(jumlah);
    const h = parseFloat(harga);
    if (!isNaN(j) && !isNaN(h)) return j * h;
    return 0;
  }, [jumlah, harga]);


  useEffect(() => {
    let active = true;
    async function fetchNextFaktur() {
      if (editingInfraction) return;
      setFakturPreview('Memuat...');
      try {
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        const res = await fetch(`/api/infractions/next-faktur?date=${dateStr}`);
        if (res.ok && active) {
          const data = await res.json();
          setFakturPreview(data.nextFaktur);
        } else if (active) {
          setFakturPreview('ERR-DDMMYY-AUTO');
        }
      } catch (err) {
        if (active) setFakturPreview('ERR-DDMMYY-AUTO');
      }
    }
    fetchNextFaktur();
    return () => { active = false; };
  }, [selectedDate, editingInfraction]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const employeeId = formData.get('employee_id');
    if (!employeeId) { alert('Pilih karyawan terlebih dahulu'); return; }

    const recordedBy = formData.get('recorded_by');
    if (!recordedBy) { alert('Pilih "Dicatat Oleh" terlebih dahulu'); return; }

    const isEdit = !!editingInfraction;

    // Validation
    if (!selectedOrder) { alert('Pilih Nama Order terlebih dahulu!'); return; }
    if (!jenisBarang) { alert('Pilih Jenis Barang terlebih dahulu!'); return; }
    
    // Add dynamically calculated values to Form Data
    const actualNamaBarang = jenisBarang === 'Input Manual' ? manualNamaBarang : selectedNamaBarang;
    if (!actualNamaBarang) { alert('Isi Nama Barang terlebih dahulu!'); return; }
    
    if (!jenisHarga) { alert('Pilih Jenis Harga terlebih dahulu!'); return; }
    if (!jumlah || parseFloat(jumlah) <= 0) { alert('Jumlah harus diisi dan lebih dari 0!'); return; }
    if (!harga || parseFloat(harga) <= 0) { alert('Harga harus diisi dan lebih dari 0!'); return; }

    formData.set('order_name', selectedOrder);
    formData.set('jenis_barang', jenisBarang);
    formData.set('nama_barang', actualNamaBarang);
    formData.set('jenis_harga', jenisHarga);
    formData.set('jumlah', jumlah);
    formData.set('harga', harga);
    formData.set('total', String(totalValue));

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

      let body: any = formData;
      let headers: HeadersInit = {};
      
      if (isEdit) {
        headers = { 'Content-Type': 'application/json' };
        const updateData: Record<string, any> = {};
        formData.forEach((value, key) => { updateData[key] = value });
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
          resetFormStates();
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
  const labelCls = 'block text-xs font-semibold text-slate-500 uppercase mb-2';

  // Helper to format string with dots for thousands and keep comma for decimal
  const formatDisplay = (val: string) => {
    if (!val) return '';
    const [intPart, decPart] = val.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return decPart !== undefined ? `${formattedInt},${decPart}` : formattedInt;
  };

  // Helper to parse displayed string back to numeric dot-decimal string
  const parseInput = (val: string) => {
    // Remove all dots (thousands), change comma to dot
    let clean = val.replace(/\./g, '').replace(',', '.');
    // Allow only digits and one dot
    if (clean === '' || /^-?\d*\.?\d*$/.test(clean)) {
      return clean;
    }
    return null;
  };

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
        {/* ROW 1 */}
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
              label="Nama Karyawan"
              name="employee_id"
              options={employees}
              placeholder="Pilih karyawan..."
              required
              displayFn={(e) => `${e.name}${e.position ? ` — ${e.position}` : ''}`}
              valueFn={(e) => e.id}
              defaultValue={editingInfraction?.employee_name ? employees.find(e => e.name === editingInfraction.employee_name)?.id : undefined}
            />
          </div>
        </div>

        {/* NAMA ORDER */}
        <SearchableSelect
          key={`ord-${resetKey}`}
          label={<>Nama Order <span className="text-red-500 ml-1">*</span></>}
          name="order_name"
          options={orders}
          placeholder="Pilih order..."
          required
          displayFn={(o) => `${o.faktur} — ${o.nama_prd}`}
          valueFn={(o) => o.nama_prd}
          defaultValue={selectedOrder}
          onChange={(o) => setSelectedOrder(o ? o.nama_prd : '')}
        />

        {/* JENIS BARANG & NAMA BARANG */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchableSelect
              key={`jb-${resetKey}`}
              label={<>Jenis Barang <span className="text-red-500 ml-1">*</span></>}
              name="jenis_barang"
              options={jenisBarangOptions}
              placeholder="Pilih jenis barang..."
              required
              displayFn={(o) => o.label}
              valueFn={(o) => o.value}
              defaultValue={jenisBarang}
              onChange={(o) => {
                setJenisBarang(o.value);
                setSelectedNamaBarang('');
                setManualNamaBarang('');
              }}
            />
          </div>
          <div className="flex-[1.5]">
            <label className={labelCls}>
              Nama Barang <span className="text-red-500 ml-1">*</span>
              {itemsLoading && <Loader2 size={12} className="inline ml-2 animate-spin text-emerald-500" />}
            </label>
            {jenisBarang === 'Input Manual' ? (
              <input 
                type="text"
                className={inputCls}
                placeholder="Ketik nama barang manual..."
                value={manualNamaBarang}
                onChange={(e) => setManualNamaBarang(e.target.value)}
                required
              />
            ) : (
            <SearchableSelect
                key={`nb-${selectedOrder}-${jenisBarang}-${resetKey}`}
                label=""
                name="nama_barang"
                options={items}
                placeholder={
                  !selectedOrder 
                    ? "Pilih Order Dulu" 
                    : itemsLoading 
                      ? "Memuat barang..." 
                      : items.length === 0 
                        ? `Data ${jenisBarang} tidak ditemukan`
                        : "Pilih Barang..."
                }
                displayFn={(o) => o.nama_barang}
                valueFn={(o) => o.nama_barang}
                defaultValue={selectedNamaBarang}
                disabled={!selectedOrder}
                isLoading={itemsLoading}
                noOptionsMessage={items.length === 0 ? `Data ${jenisBarang} untuk order ini kosong (Cek Jenis Barang)` : 'Tidak ada hasil'}
                onChange={(o) => setSelectedNamaBarang(o ? o.nama_barang : '')}
              />
            )}
          </div>
        </div>

        {/* KETERANGAN */}
        <div>
          <label className={labelCls}>
            Deskripsi Kesalahan <span className="text-slate-400 font-normal normal-case">(opsional)</span>
          </label>
          <input
            type="text"
            name="description"
            className={inputCls}
            placeholder="Jelaskan detail kesalahan..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* QUANTITY, HARGA, TOTAL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-xl relative">
          <div className="absolute top-0 right-0 p-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest pointer-events-none">
            Penilaian Harga
          </div>
          
          <div>
            <SearchableSelect
                key={`jh-${resetKey}`}
                label={<>Jenis Harga <span className="text-red-500 ml-1">*</span></>}
                name="jenis_harga"
                options={jenisHargaOptions}
                placeholder="Pilih jenis harga..."
                required
                displayFn={(o) => o.label}
                valueFn={(o) => o.value}
                defaultValue={jenisHarga}
                dropdownPos="down"
                onChange={(o) => setJenisHarga(o.value)}
              />
          </div>
          <div>
            <label className={labelCls}>Jumlah (Qty) <span className="text-red-500 ml-1">*</span></label>
            <input 
              type="text" 
              className={inputCls}
              placeholder="0"
              value={formatDisplay(jumlah)}
              onChange={(e) => {
                const parsed = parseInput(e.target.value);
                if (parsed !== null) setJumlah(parsed);
              }}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Harga <span className="text-red-500 ml-1">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">Rp</span>
              <input 
                type="text" 
                className={`${inputCls} pl-8 ${jenisHarga !== 'Input Manual' ? 'bg-slate-50 text-slate-500 cursor-not-allowed font-medium' : ''}`}
                placeholder="0"
                value={
                  jenisHarga === 'Input Manual' 
                    ? formatDisplay(harga)
                    : harga 
                      ? parseFloat(harga).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                      : '0,00'
                }
                onChange={(e) => {
                  if (jenisHarga === 'Input Manual') {
                    const parsed = parseInput(e.target.value);
                    if (parsed !== null) setHarga(parsed);
                  }
                }}
                readOnly={jenisHarga !== 'Input Manual'}
                required
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Total</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">Rp</span>
              <input 
                type="text" 
                className={`${inputCls} pl-8 bg-emerald-50/30 font-bold text-emerald-700 pointer-events-none outline-none border-emerald-100`}
                value={totalValue > 0 ? totalValue.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* DICATAT OLEH */}
        <SearchableSelect
          key={`rec-${resetKey}`}
          label="Dicatat Oleh"
          name="recorded_by"
          options={employees}
          placeholder="Pilih pencatat..."
          required
          displayFn={(e) => `${e.name}${e.position ? ` — ${e.position}` : ''}`}
          valueFn={(e) => e.name}
          defaultValue={editingInfraction?.recorded_by}
          dropdownPos={'up'}
        />

        <div className="flex gap-3 pt-2">
          {editingInfraction && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 py-3 bg-white rounded-lg font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-3 rounded-lg font-bold text-white transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-60 ${
              editingInfraction ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingInfraction ? 'Simpan Perubahan' : 'Simpan Pencatatan')}
          </button>
        </div>

        {success && (
          <div className="text-xs text-center space-y-0.5 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
            <p className="text-emerald-700 font-semibold">✓ {editingInfraction ? 'Perubahan pada data rincian berhasil disimpan!' : 'Kesalahan berhasil dicatat ke database!'}</p>
            {lastFaktur && <p className="text-slate-500">Nomor Registrasi: <span className="font-mono font-bold text-emerald-600">{lastFaktur}</span></p>}
          </div>
        )}
      </form>
    </div>
  );
}

