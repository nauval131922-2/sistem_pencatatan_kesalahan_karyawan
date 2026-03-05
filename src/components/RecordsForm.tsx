'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, AlertTriangle, Loader2, Users, Box, Star, CheckCircle2 } from 'lucide-react';
import ConfirmDialog, { DialogType } from '@/components/ConfirmDialog';
import DatePicker from '@/components/DatePicker';

interface Employee {
  id: number;
  employee_no: string | null;
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
  kd_barang: string;
  faktur: string;
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
    // If loading, don't try to sync/clear selection to prevent flickering/loss
    if (isLoading) return;

    if (defaultValue !== undefined && defaultValue !== null) {
      const found = options.find((o) => String(valueFn(o)) === String(defaultValue));
      if (found) setSelected(found);
    } else if (defaultValue === null) {
      // Explicitly requested to clear
      setSelected(null);
    } else if (selected && options.length > 0) {
      // If we already have a selection and options are present,
      // check if our selection is still valid in the new options.
      // If options are empty but we have a selection, KEEP it (resilience).
      const stillExists = options.find((o) => String(valueFn(o)) === String(valueFn(selected)));
      if (!stillExists) {
        // Selection is truly no longer in the provided options
        setSelected(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue, options, isLoading]);

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
  const inputCls = `w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 transition-colors text-slate-800 ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`;
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
  onRefreshInfractions,
}: {
  employees: Employee[];
  orders: Order[];
  editingInfraction?: any;
  onCancelEdit?: () => void;
  onSuccessEdit?: () => void;
  onRefreshInfractions?: () => Promise<void>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastFaktur, setLastFaktur] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [fakturPreview, setFakturPreview] = useState<string>('Memuat...');
  const [description, setDescription] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: DialogType;
    title: string;
    message: string;
    confirmLabel?: string;
    isLoading?: boolean;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'alert', title: '', message: '' });
  
  const pendingSubmitDataRef = useRef<{
    endpoint: string;
    method: string;
    headers: HeadersInit;
    body: any;
    isEdit: boolean;
  } | null>(null);

  const showDialog = (type: DialogType, title: string, message: string, onConfirm?: () => void, confirmLabel?: string) => {
    setDialogConfig({ isOpen: true, type, title, message, onConfirm, confirmLabel });
  };

  const closeDialog = () => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  };

  // New states mimicking Excel Logic
  const [selectedOrderFaktur, setSelectedOrderFaktur] = useState<string>('');
  const [selectedOrderName, setSelectedOrderName] = useState<string>('');
  const [jenisBarang, setJenisBarang] = useState<string>('Bahan Baku');
  
  const [items, setItems] = useState<ItemData[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [hppKalkulasiValue, setHppKalkulasiValue] = useState<number | null>(null);
  const [hppLoading, setHppLoading] = useState(false);
  const [selectedNamaBarang, setSelectedNamaBarang] = useState<string>('');
  const [selectedItemFaktur, setSelectedItemFaktur] = useState<string>('');
  const [manualNamaBarang, setManualNamaBarang] = useState<string>('');
  
  const [jenisHarga, setJenisHarga] = useState<string>('HPP Digit');
  const [jumlah, setJumlah] = useState<string>('');
  const [harga, setHarga] = useState<string>('');
  const [draftEmployeeId, setDraftEmployeeId] = useState<number | null>(null);
  const [draftRecordedById, setDraftRecordedById] = useState<number | null>(null);
  // Separate display-only states for order and item (decoupled from items-loading state)
  const [draftOrderFaktur, setDraftOrderFaktur] = useState<string>('');
  const [draftItemFaktur, setDraftItemFaktur] = useState<string | null>('');


  // Fixed options arrays
  const jenisBarangOptions = [
  { label: 'Bahan Baku (Digit)', value: 'Bahan Baku' },
  { label: 'Barang Jadi (Digit)', value: 'Barang Jadi' },
  { label: 'HPP Kalkulasi (Excel)', value: 'HPP Kalkulasi' },
  { label: 'Penjualan Barang (Digit)', value: 'Penjualan Barang' },
  { label: 'Input Manual', value: 'Input Manual' },
];

const allJenisHargaOptions = [
  { label: 'HPP Digit', value: 'HPP Digit' },
  { label: 'Harga Jual Digit', value: 'Harga Jual Digit' },
  { label: 'HPP Kalkulasi', value: 'HPP Kalkulasi' },
  { label: 'Input Manual', value: 'Input Manual' },
];

  const jenisHargaOptions = useMemo(() => {
    if (jenisBarang === 'Bahan Baku') {
      return allJenisHargaOptions.filter(o => o.value === 'HPP Digit' || o.value === 'Input Manual');
    }
    if (jenisBarang === 'Barang Jadi') {
      return allJenisHargaOptions.filter(o => o.value === 'HPP Digit' || o.value === 'Input Manual');
    }
    if (jenisBarang === 'Penjualan Barang') {
      return allJenisHargaOptions.filter(o => o.value === 'Harga Jual Digit' || o.value === 'Input Manual');
    }
    if (jenisBarang === 'Input Manual') {
      return allJenisHargaOptions.filter(o => o.value === 'Input Manual');
    }
    if (jenisBarang === 'HPP Kalkulasi') {
      return allJenisHargaOptions.filter(o => o.value === 'HPP Kalkulasi' || o.value === 'Input Manual');
    }
    return [{ label: 'Pilih Jenis Barang Dulu', value: '' }];
  }, [jenisBarang]);

  // Sync jenisHarga when jenisBarang changes and has only 1 option
  useEffect(() => {
    if (jenisHargaOptions.length === 1 && jenisHarga !== jenisHargaOptions[0].value) {
      setJenisHarga(jenisHargaOptions[0].value);
    }
  }, [jenisHargaOptions, jenisHarga]);

  // Reset Jenis Harga if current selection is invalid for the new Jenis Barang
  useEffect(() => {
    if (jenisBarang === 'Input Manual') {
      setJenisHarga('Input Manual');
    } else if (jenisBarang === 'Bahan Baku' && (jenisHarga !== 'HPP Digit' && jenisHarga !== 'Input Manual')) {
      setJenisHarga('HPP Digit');
    } else if (jenisBarang === 'Penjualan Barang' && (jenisHarga !== 'Harga Jual Digit' && jenisHarga !== 'Input Manual')) {
      setJenisHarga('Harga Jual Digit');
    } else if (jenisBarang === 'Barang Jadi' && (jenisHarga !== 'HPP Digit' && jenisHarga !== 'Input Manual')) {
      setJenisHarga('HPP Digit');
    } else if (jenisBarang === 'HPP Kalkulasi' && (jenisHarga !== 'HPP Kalkulasi' && jenisHarga !== 'Input Manual')) {
      setJenisHarga('HPP Kalkulasi');
    }
  }, [jenisBarang]);

  // Initialize data when editing or from draft
  useEffect(() => {
    if (editingInfraction) {
      // ... (edit mode logic)
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

      // Always load from snapshot so items still fetch correctly
      setSelectedOrderFaktur(editingInfraction.order_faktur || '');
      setSelectedOrderName(editingInfraction.order_name || '');

      // Check if order still exists in source with same nama_prd
      const orderMatch = orders.find(o => o.faktur === editingInfraction.order_faktur);
      const orderUnchanged = orderMatch && (orderMatch as any).nama_prd === editingInfraction.order_name;
      setDraftOrderFaktur(orderUnchanged ? (editingInfraction.order_faktur || '') : '');

      setJenisBarang(editingInfraction.jenis_barang || 'Bahan Baku');
      setJenisHarga(editingInfraction.jenis_harga || 'HPP Digit');
      
      if (editingInfraction.jenis_barang === 'Input Manual') {
        setManualNamaBarang(editingInfraction.nama_barang || '');
        setDraftItemFaktur('');
      } else {
        setSelectedNamaBarang(editingInfraction.nama_barang || '');
        setSelectedItemFaktur(editingInfraction.item_faktur || '');
        // draftItemFaktur will be set after items load (in fetchItems useEffect)
        setDraftItemFaktur('__pending__');
      }

      setJumlah(editingInfraction.jumlah ? String(editingInfraction.jumlah) : '');
      setHarga(editingInfraction.harga ? String(editingInfraction.harga) : '');
      // Pre-select only if still exists AND name/data unchanged
      const empMatch = employees.find(e => e.id === editingInfraction.employee_id);
      const empUnchanged = empMatch && empMatch.name === editingInfraction.employee_name;
      setDraftEmployeeId(empUnchanged ? editingInfraction.employee_id : null);

      const recMatch = employees.find(e => e.id === editingInfraction.recorded_by_id);
      const recUnchanged = recMatch && recMatch.name === editingInfraction.recorded_by_name;
      setDraftRecordedById(recUnchanged ? editingInfraction.recorded_by_id : null);
      
    } else {
      // Check for draft
      const savedDraft = localStorage.getItem('infraction_form_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setDescription(draft.description || '');
          if (draft.selectedDate) setSelectedDate(new Date(draft.selectedDate));
          setSelectedOrderFaktur(draft.selectedOrderFaktur || '');
          setSelectedOrderName(draft.selectedOrderName || '');
          setJenisBarang(draft.jenisBarang || 'Bahan Baku');
          setJenisHarga(draft.jenisHarga || 'HPP Digit');
          setSelectedNamaBarang(draft.selectedNamaBarang || '');
          setSelectedItemFaktur(draft.selectedItemFaktur || '');
          setManualNamaBarang(draft.manualNamaBarang || '');
          setJumlah(draft.jumlah || '');
          setHarga(draft.harga || '');
          setDraftEmployeeId(draft.employeeId || null);
          setDraftRecordedById(draft.recordedById || null);
        } catch (e) {
          console.error('Failed to load draft', e);
        }
      } else {
        resetFormStates();
      }
    }
  }, [editingInfraction]);

  // Save draft on changes (Debounced ideally, but simple useEffect for now)
  useEffect(() => {
    if (editingInfraction) return; // Don't save draft in edit mode

    const draft = {
      description,
      selectedDate: selectedDate.toISOString(),
      selectedOrderFaktur,
      selectedOrderName,
      jenisBarang,
      jenisHarga,
      selectedNamaBarang,
      selectedItemFaktur,
      manualNamaBarang,
      jumlah,
      harga,
      employeeId: draftEmployeeId,
      recordedById: draftRecordedById
    };
    localStorage.setItem('infraction_form_draft', JSON.stringify(draft));
  }, [
    description, selectedDate, selectedOrderFaktur, selectedOrderName, 
    jenisBarang, jenisHarga, selectedNamaBarang, selectedItemFaktur, 
    manualNamaBarang, jumlah, harga, draftEmployeeId, draftRecordedById, editingInfraction
  ]);

  const resetFormStates = () => {
    setDescription('');
    setSelectedDate(new Date());
    setSelectedOrderFaktur('');
    setSelectedOrderName('');
    setJenisBarang('Bahan Baku');
    setJenisHarga('HPP Digit');
    setSelectedNamaBarang('');
    setSelectedItemFaktur('');
    setManualNamaBarang('');
    setJumlah('');
    setHarga('');
    setDraftEmployeeId(null);
    setDraftRecordedById(null);
    setDraftOrderFaktur('');
    setDraftItemFaktur('');
    localStorage.removeItem('infraction_form_draft');
  };

  // Augmented employee list to include historical value if missing
  const allEmployees = useMemo(() => {
    let list = [...employees];
    if (editingInfraction) {
      // Check for employee_id
      const empId = editingInfraction.employee_id;
      if (empId && !list.find(e => e.id === empId)) {
        list.push({
          id: empId,
          name: editingInfraction.employee_name || 'Unknown',
          position: editingInfraction.employee_position || '-',
          employee_no: editingInfraction.employee_no || '',
          is_active: 0
        } as any);
      }
      
      // Check for recorded_by_id
      const recId = editingInfraction.recorded_by_id;
      if (recId && !list.find(e => e.id === recId)) {
        list.push({
          id: recId,
          name: editingInfraction.recorded_by_name || 'Unknown',
          position: editingInfraction.recorded_by_position || '-',
          employee_no: editingInfraction.recorded_by_no || '',
          is_active: 0
        } as any);
      }
    }
    return list;
  }, [employees, editingInfraction]);

  // Augmented orders list: only add ghost if order is NOT found at all
  const allOrders = useMemo(() => {
    let list = [...orders];
    if (editingInfraction && editingInfraction.order_faktur) {
      const found = list.find(o => o.faktur === editingInfraction.order_faktur);
      if (!found) {
        // Deleted: inject ghost so it can be pre-selected
        list.push({
          faktur: editingInfraction.order_faktur,
          nama_prd: editingInfraction.order_name || 'Data Terhapus',
          is_ghost: true
        } as any);
        setDraftOrderFaktur(editingInfraction.order_faktur);
      }
      // If found but renamed → draftOrderFaktur stays '' (set in useEffect), no ghost needed
    }
    return list;
  }, [orders, editingInfraction]);

  // Fetch Items when Order or Jenis Barang changes
  useEffect(() => {
    let active = true;
    async function fetchItems() {
      if (!selectedOrderName || jenisBarang === 'Input Manual') {
        setItems([]);
        return;
      }
      setItemsLoading(true);
      try {
        const res = await fetch(`/api/items?order_name=${encodeURIComponent(selectedOrderName)}&order_faktur=${encodeURIComponent(selectedOrderFaktur)}&jenis_barang=${encodeURIComponent(jenisBarang)}`);
        if (res.ok && active) {
          const json = await res.json();
          let fetchedItems = json.data || [];
          
          // Check if editing item exists in fetched results
          if (editingInfraction && 
              editingInfraction.item_faktur && 
              editingInfraction.jenis_barang === jenisBarang && 
              (editingInfraction.order_faktur === selectedOrderFaktur || !selectedOrderFaktur)) {
            const itemInSource = fetchedItems.find((i: any) => i.faktur === editingInfraction.item_faktur);
            if (!itemInSource) {
              // Deleted: inject ghost and auto-select
              fetchedItems.push({
                faktur: editingInfraction.item_faktur,
                nama_barang: editingInfraction.nama_barang,
                harga: editingInfraction.harga,
                is_ghost: true
              });
              if (active) setDraftItemFaktur(editingInfraction.item_faktur);
            } else if (itemInSource.nama_barang !== editingInfraction.nama_barang) {
              // Exists but nama_barang renamed: inject ghost for placeholder, but don't auto-select
              fetchedItems.push({
                faktur: editingInfraction.item_faktur + '__hist',
                nama_barang: editingInfraction.nama_barang,
                harga: editingInfraction.harga,
                is_ghost: true
              });
              if (active) setDraftItemFaktur('');
            } else {
              // Unchanged: auto-select
              if (active) setDraftItemFaktur(editingInfraction.item_faktur);
            }
          } else if (draftItemFaktur === '__pending__') {
            if (active) setDraftItemFaktur(selectedItemFaktur);
          }
          if (active) setItems(fetchedItems);
        } else if (active) {
          setItems([]);
        }
      } catch (err) {
        console.error(err);
        if (active) setItems([]);
      } finally {
        if (active) setItemsLoading(false);
      }
    }
    fetchItems();
    return () => { active = false; };
  }, [selectedOrderName, selectedOrderFaktur, jenisBarang]);

  // Fetch HPP Kalkulasi for selectedOrder
  useEffect(() => {
    let active = true;
    async function fetchHpp() {
      // Use selectedOrderName as requested (Exact Match)
      if (!selectedOrderName) {
        if (active) { setHppKalkulasiValue(null); setHppLoading(false); }
        return;
      }
      if (active) setHppLoading(true);
      try {
        const res = await fetch(`/api/hpp-kalkulasi?order_name=${encodeURIComponent(selectedOrderName)}`);
        if (res.ok && active) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setHppKalkulasiValue(json.data[0].hpp_kalkulasi);
            setHppLoading(false);
            if (jenisBarang === 'HPP Kalkulasi') {
              setSelectedNamaBarang(selectedOrderName);
              setHarga(String(json.data[0].hpp_kalkulasi || ''));
            }
          } else {
            setHppKalkulasiValue(0);
            setHppLoading(false);
            if (jenisBarang === 'HPP Kalkulasi') {
              setSelectedNamaBarang(''); // Not found → clear nama barang
              setHarga('');
            }
          }
        } else if (active) {
          setHppKalkulasiValue(null);
          setHppLoading(false);
        }
      } catch {
        if (active) { setHppKalkulasiValue(null); setHppLoading(false); }
      }
    }
    fetchHpp();
    return () => { active = false; };
  }, [selectedOrderName, selectedOrderFaktur, jenisBarang]);

  // Handle Logic Harga recalculation (Based heavily on the VBA Logic)
  const calculateAutoHarga = useCallback(() => {
    if (jenisBarang === 'Input Manual' || !selectedOrderName) {
      return; 
    }

    // HPP Kalkulasi doesn't need an item match — price comes directly from order
    if (jenisBarang === 'HPP Kalkulasi') {
      setHarga(hppKalkulasiValue != null && hppKalkulasiValue > 0 ? String(hppKalkulasiValue) : '');
      return;
    }

    const actualItemName = selectedNamaBarang;
    if (!actualItemName) {
      setHarga('');
      return;
    }

    const matchedItem = items.find(i => {
      // Prioritaskan ID unik (faktur item itu sendiri) jika ada
      if (selectedItemFaktur && i.faktur === selectedItemFaktur) return true;
      // Fallback ke nama jika tidak ada faktur terpilih
      if (!selectedItemFaktur && i.nama_barang === actualItemName) return true;
      return false;
    });
    if (!matchedItem) {
      setHarga('');
      return;
    }

    let calculatedHarga = 0;

    if (jenisBarang === 'Bahan Baku') {
      if (jenisHarga === 'HPP Digit') {
        calculatedHarga = matchedItem.harga;
      }
    } else if (jenisBarang === 'Barang Jadi') {
      if (jenisHarga === 'HPP Digit') {
        calculatedHarga = matchedItem.harga;
      }
    } else if (jenisBarang === 'Penjualan Barang') {
      if (jenisHarga === 'Harga Jual Digit') {
        calculatedHarga = matchedItem.harga_jual || matchedItem.harga;
      }
    }

    setHarga(calculatedHarga > 0 ? String(calculatedHarga) : '');

  }, [jenisBarang, jenisHarga, selectedNamaBarang, selectedItemFaktur, selectedOrderName, items, hppKalkulasiValue]);

  // Run calculation when dependencies change
  useEffect(() => {
    // Only auto-calc if not in editing mode initially or if user interacts
    if (!editingInfraction || (editingInfraction && items.length > 0)) {
       // We only want to auto-calculate if taking from DB. If user explicitly types manual harga, don't overwrite indiscriminately.
       // However, to deeply mimic excel, we overwrite it when these parameters change.
       calculateAutoHarga();
    }
  }, [jenisBarang, jenisHarga, selectedNamaBarang, selectedItemFaktur, selectedOrderName, items, calculateAutoHarga, editingInfraction]);

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
    if (!employeeId) { showDialog('alert', 'Peringatan', 'Pilih karyawan terlebih dahulu'); return; }

    const recordedById = formData.get('recorded_by_id');
    if (!recordedById) { showDialog('alert', 'Peringatan', 'Pilih "Dicatat Oleh" terlebih dahulu'); return; }

    const isEdit = !!editingInfraction;

    // Validation
    if (!selectedOrderFaktur) { showDialog('alert', 'Peringatan', 'Pilih Nama Order terlebih dahulu!'); return; }
    if (!jenisBarang) { showDialog('alert', 'Peringatan', 'Pilih Jenis Barang terlebih dahulu!'); return; }
    
    // Add dynamically calculated values to Form Data
    const actualNamaBarang = jenisBarang === 'Input Manual' ? manualNamaBarang : selectedNamaBarang;
    if (!actualNamaBarang) { showDialog('alert', 'Peringatan', 'Isi Nama Barang terlebih dahulu!'); return; }
    
    if (!jenisHarga) { showDialog('alert', 'Peringatan', 'Pilih Jenis Harga terlebih dahulu!'); return; }
    if (!jumlah || parseFloat(jumlah) <= 0) { showDialog('alert', 'Peringatan', 'Jumlah harus diisi dan lebih dari 0!'); return; }
    if (!harga || parseFloat(harga) <= 0) { showDialog('alert', 'Peringatan', 'Harga harus diisi dan lebih dari 0!'); return; }

    formData.set('order_faktur', selectedOrderFaktur);
    formData.set('order_name', selectedOrderName);
    formData.set('jenis_barang', jenisBarang);
    formData.set('nama_barang', actualNamaBarang);
    formData.set('item_faktur', selectedItemFaktur);
    formData.set('jenis_harga', jenisHarga);
    formData.set('jumlah', jumlah);
    formData.set('harga', harga);
    formData.set('total', String(totalValue));

    const confirmMessage = isEdit 
      ? 'Apakah Anda yakin ingin menyimpan perubahan pada data kesalahan ini?'
      : 'Apakah Anda yakin ingin mencatat data kesalahan baru ini?';
      
    const endpoint = isEdit ? `/api/infractions/${editingInfraction.id}` : '/api/infractions';
    const method = isEdit ? 'PUT' : 'POST';

    let body: any = formData;
    let headers: HeadersInit = {};
    
    if (isEdit) {
      headers = { 'Content-Type': 'application/json' };
      const updateData: Record<string, any> = {};
      formData.forEach((value, key) => { updateData[key] = value });
      // Pass faktur so PUT handler doesn't need an extra SELECT
      updateData.faktur = editingInfraction?.faktur || null;
      body = JSON.stringify(updateData);
    }

    pendingSubmitDataRef.current = { endpoint, method, headers, body, isEdit };
    showDialog('confirm', 'Konfirmasi Simpan', confirmMessage, executeSubmit, 'Ya, Simpan');
  };

  const executeSubmit = async () => {
    if (!pendingSubmitDataRef.current) return;
    
    // Set loading in dialog
    setDialogConfig(prev => ({ ...prev, isLoading: true }));
    
    const { endpoint, method, headers, body, isEdit } = pendingSubmitDataRef.current;
    
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method, headers, body });

      if (res.ok) {
        closeDialog(); // Clear confirm dialog
        const data = await res.json();
        const msg = isEdit 
          ? 'Perubahan data kesalahan berhasil disimpan.' 
          : `Data kesalahan berhasil dicatat dengan nomor faktur: ${data.faktur || fakturPreview}`;

        showDialog('success', 'Berhasil', msg, () => {
          if (onSuccessEdit) {
            onSuccessEdit(); // Switch tab
          }
          if (!isEdit) {
            formRef.current?.reset();
            resetFormStates();
            setResetKey(k => k + 1);
          }
          // Refresh data client-side (fast) instead of full router.refresh()
          if (onRefreshInfractions) {
            onRefreshInfractions();
          } else {
            router.refresh();
          }
        });
      } else {
        closeDialog(); // Clear confirm dialog
        const err = await res.json();
        showDialog('error', 'Gagal', 'Gagal menyimpan: ' + (err.error || 'Unknown error'));
      }
    } catch (err) {
      closeDialog();
      showDialog('error', 'Gagal', 'Terjadi kesalahan koneksi atau sistem.');
    } finally {
      setLoading(false);
      pendingSubmitDataRef.current = null;
    }
  };

  const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 placeholder:text-slate-300';
  const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2';
  const sectionHeaderCls = 'flex items-center gap-2 pb-2 border-b border-slate-100 mb-4';
  const sectionTitleCls = 'text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.2em]';

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
    <div className="card glass overflow-visible p-0 border-none shadow-none bg-transparent">
      {/* Dynamic Header Banner */}
      <div className={`p-5 rounded-t-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-b ${
        editingInfraction ? 'bg-amber-50/50 border-amber-100' : 'bg-emerald-50/50 border-emerald-100'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl shadow-sm ${
            editingInfraction ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
          }`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight leading-none mb-1">
              {editingInfraction ? 'Edit Kesalahan' : 'Catat Kesalahan'}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
              {editingInfraction ? 'Perbarui data yang sudah ada' : 'Input data pelanggaran baru'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest bg-white shadow-sm ${
            editingInfraction ? 'text-amber-600 border-amber-200' : 'text-emerald-700 border-emerald-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              editingInfraction ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            NO. FAKTUR: {fakturPreview}
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-8 bg-white rounded-b-2xl border border-slate-100 shadow-sm">
        {/* SECTION 1: INFORMASI DASAR */}
        <section>
          <div className={sectionHeaderCls}>
            <Users size={14} className="text-slate-400" />
            <h4 className={sectionTitleCls}>Informasi Dasar</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <DatePicker 
                name="date" 
                required 
                label="Tanggal" 
                onChange={setSelectedDate} 
                value={selectedDate} 
              />
            </div>
            <div className="sm:col-span-2">
              <SearchableSelect
                key={`emp-${resetKey}`}
                label="Nama Karyawan Pelaku"
                name="employee_id"
                options={employees}
                placeholder={
                  !draftEmployeeId && editingInfraction?.employee_name
                    ? `${editingInfraction.employee_no ? `${editingInfraction.employee_no} — ` : ''}${editingInfraction.employee_name}${editingInfraction.employee_position ? ` — ${editingInfraction.employee_position}` : ''}`
                    : 'Pilih karyawan...'
                }
                required
                displayFn={(e) => `${e.employee_no ? `${e.employee_no} — ` : ''}${e.name}${e.position ? ` — ${e.position}` : ''}`}
                valueFn={(e) => e.id}
                defaultValue={draftEmployeeId}
                onChange={(e) => setDraftEmployeeId(e ? e.id : null)}
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: DETAIL ORDER & ITEM */}
        <section>
          <div className={sectionHeaderCls}>
            <Box size={14} className="text-slate-400" />
            <h4 className={sectionTitleCls}>Detail Order & Barang</h4>
          </div>
          <div className="space-y-4">
            <SearchableSelect
              key={`ord-${resetKey}`}
              label={<>Nama Order Terkait <span className="text-red-500 ml-1">*</span></>}
              name="order_faktur"
              options={allOrders}
              placeholder={
                !draftOrderFaktur && editingInfraction?.order_faktur
                  ? `${editingInfraction.order_faktur} — ${editingInfraction.order_name || 'Data Terhapus/Berubah'}`
                  : 'Pilih order...'
              }
              required
              displayFn={(o) => `${o.faktur} — ${o.nama_prd}${(o as any).is_ghost ? ' (Arsip)' : ''}`}
              valueFn={(o) => o.faktur}
              defaultValue={draftOrderFaktur}
              onChange={(o) => {
                setSelectedOrderFaktur(o ? o.faktur : '');
                setSelectedOrderName(o ? o.nama_prd : '');
                setDraftOrderFaktur(o ? o.faktur : '');
                // Reset items when order changes
                setSelectedNamaBarang('');
                setSelectedItemFaktur('');
                setDraftItemFaktur(null);
                setManualNamaBarang('');
                setHppKalkulasiValue(null);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  setSelectedItemFaktur('');
                  setManualNamaBarang('');
                  setDraftItemFaktur(null);
                  setHppKalkulasiValue(null);
                }}
              />
              <div>
                <label className={labelCls}>
                  Nama Barang <span className="text-red-500 ml-1">*</span>
                  {itemsLoading && <Loader2 size={12} className="inline ml-2 animate-spin text-emerald-500" />}
                </label>
                {jenisBarang === 'Input Manual' || jenisBarang === 'HPP Kalkulasi' ? (
                  <input 
                    type="text"
                    className={inputCls}
                    placeholder={
                      jenisBarang === 'HPP Kalkulasi'
                        ? (hppLoading ? 'Memuat HPP...' : hppKalkulasiValue != null && hppKalkulasiValue > 0 ? 'Otomatis Nama Order...' : 'Data HPP Kalkulasi tidak ditemukan')
                        : 'Ketik nama barang manual...'
                    }
                    value={jenisBarang === 'HPP Kalkulasi' ? (hppKalkulasiValue != null && hppKalkulasiValue > 0 ? selectedOrderName : '') : manualNamaBarang}
                    onChange={(e) => setManualNamaBarang(e.target.value)}
                    readOnly={jenisBarang === 'HPP Kalkulasi'}
                    required
                  />
                ) : (
                <SearchableSelect
                    key={`nb-${selectedOrderName}-${jenisBarang}-${resetKey}`}
                    label=""
                    name="nama_barang"
                    options={items}
                    placeholder={
                      itemsLoading 
                        ? "Memuat barang..."
                        : draftItemFaktur === ''
                          ? `${editingInfraction?.item_faktur} — ${editingInfraction?.nama_barang}`
                          : items.length === 0 
                            ? `Data ${jenisBarang} tidak ditemukan`
                            : "Pilih Barang (Bisa ketik Nomor Faktur)..."
                    }
                    displayFn={(o) => `${o.faktur && !o.faktur.endsWith('__hist') ? `${o.faktur} — ` : ''}${o.nama_barang}${o.is_ghost ? ' (Arsip)' : ''}`}
                    valueFn={(o) => o.faktur}
                    defaultValue={draftItemFaktur && draftItemFaktur !== '__pending__' ? draftItemFaktur : undefined}
                    isLoading={itemsLoading}
                    noOptionsMessage={items.length === 0 ? `Data ${jenisBarang} kosong` : 'Tidak ada hasil'}
                    onChange={(o) => {
                      setSelectedNamaBarang(o ? o.nama_barang : '');
                      setSelectedItemFaktur(o ? o.faktur : '');
                      setDraftItemFaktur(o ? o.faktur : '');
                    }}
                  />
                )}
              </div>
            </div>

            <div>
              <label className={labelCls}>
                Deskripsi Kesalahan <span className="text-slate-400 font-normal normal-case ml-1">(Boleh Dikosongkan)</span>
              </label>
              <textarea
                name="description"
                rows={2}
                className={`${inputCls} resize-none py-3`}
                placeholder="Jelaskan detail kesalahan secara lengkap..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: PENILAIAN HARGA */}
        <section>
          <div className={sectionHeaderCls}>
            <Star size={14} className="text-slate-400" />
            <h4 className={sectionTitleCls}>Kalkulasi Beban & Biaya</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
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
              <label className={labelCls}>Harga Satuan <span className="text-red-500 ml-1">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">RP</span>
                <input 
                  type="text" 
                  className={`${inputCls} pl-9 ${jenisHarga !== 'Input Manual' ? 'bg-slate-100/50 text-slate-500 cursor-not-allowed font-medium border-slate-200' : ''}`}
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
              <label className={labelCls}>Total Beban</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-[10px]">RP</span>
                <input 
                  type="text" 
                  className={`${inputCls} pl-9 bg-emerald-50 font-extrabold text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-500/5`}
                  value={totalValue > 0 ? totalValue.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                  readOnly
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: OTORITAS */}
        <section>
          <div className={sectionHeaderCls}>
            <CheckCircle2 size={14} className="text-slate-400" />
            <h4 className={sectionTitleCls}>Otoritas & Validasi</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <SearchableSelect
                key={`rec-${resetKey}`}
                label="Data Dicatat Oleh"
                name="recorded_by_id"
                options={employees}
                placeholder={
                  !draftRecordedById && editingInfraction?.recorded_by_name
                    ? `${editingInfraction.recorded_by_no ? `${editingInfraction.recorded_by_no} — ` : ''}${editingInfraction.recorded_by_name}${editingInfraction.recorded_by_position ? ` — ${editingInfraction.recorded_by_position}` : ''}`
                    : 'Pilih nama pencatat...'
                }
                required
                displayFn={(e) => `${e.employee_no ? `${e.employee_no} — ` : ''}${e.name}${e.position ? ` — ${e.position}` : ''}`}
                valueFn={(e) => e.id}
                defaultValue={draftRecordedById}
                onChange={(e) => setDraftRecordedById(e ? e.id : null)}
                dropdownPos={'up'}
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
          {editingInfraction && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 py-4 bg-white rounded-xl font-extrabold border-2 border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
            >
              Batalkan Edit
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`flex-[2] py-4 rounded-xl font-extrabold text-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none uppercase tracking-widest text-xs ${
              editingInfraction 
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-amber-500/25' 
                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-500/25'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : (editingInfraction ? 'Simpan Perubahan Data' : 'Simpan & Catat Kesalahan')}
          </button>
        </div>

        {success && (
          <div className="text-xs text-center space-y-0.5 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
            <p className="text-emerald-700 font-semibold">✓ {editingInfraction ? 'Perubahan pada data rincian berhasil disimpan!' : 'Kesalahan berhasil dicatat ke database!'}</p>
            {lastFaktur && <p className="text-slate-500">Nomor Registrasi: <span className="font-mono font-bold text-emerald-600">{lastFaktur}</span></p>}
          </div>
        )}
      </form>

      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmLabel={dialogConfig.confirmLabel}
        isLoading={dialogConfig.isLoading}
        onConfirm={dialogConfig.onConfirm || closeDialog}
        onCancel={closeDialog}
      />
    </div>
  );
}

