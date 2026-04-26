'use client';

import { useState, useRef, useEffect, useMemo, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, AlertTriangle, Loader2, Users, Box, Star, CheckCircle2, ClipboardList, Pencil, PlusCircle, ShieldAlert } from 'lucide-react';
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
  harga: number; // For Bahan Baku -> HPP Digit, For Penerimaan Barang Hasil Produksi -> hp
  harga_jual?: number; // Only For Penerimaan Barang Hasil Produksi -> Harga yg dr orders
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

function formatLocalYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
    if (isLoading) return;
    if (defaultValue !== undefined && defaultValue !== null) {
      const currentId = selected ? String(valueFn(selected)) : '';
      if (String(defaultValue) !== currentId) {
        const found = options.find((o) => String(valueFn(o)) === String(defaultValue));
        if (found) setSelected(found);
        else if (defaultValue === '' || defaultValue === null) setSelected(null);
      }
    } else if (defaultValue === null) {
      setSelected(null);
    }
  }, [defaultValue, options, isLoading, selected, valueFn]);

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
  
  const handleSelect = (o: any) => {
    setSelected(o);
    setOpen(false);
    setQuery('');
    if (onChange) onChange(o);
  };

  return (
    <div ref={ref} className="relative">
      {label && <label className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 mb-1.5 ml-1">{label}{required && <span className="text-red-500 font-bold">*</span>}</label>}
      <input type="hidden" name={name} value={selected ? String(valueFn(selected)) : ''} />
      <div
        className={`w-full bg-white border border-gray-100 rounded-lg px-4 h-11 text-sm flex items-center justify-between transition-all shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-green-500 focus-within:ring-4 focus-within:ring-green-500/5 focus-within:border-green-500'}`}
        onClick={() => { if (!disabled) { setOpen((o) => !o); setQuery(''); } }}
      >
        <span className={selected ? 'text-gray-800 truncate font-semibold' : 'text-gray-300 font-medium truncate'}>
          {selected ? displayFn(selected) : placeholder}
        </span>
        <ChevronDown size={18} className={`text-gray-300 transition-transform duration-300 ${open ? 'rotate-180 text-green-500' : ''}`} />
      </div>

      {open && !disabled && (
        <div className={`absolute z-[200] w-full bg-white border border-gray-100 rounded-xl shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          dropdownPos === 'up' ? 'bottom-full mb-3' : 'top-full mt-3'
        }`}>
          <div className="p-3 border-b border-gray-50 bg-gray-50/50">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari..."
                className="w-full pl-10 pr-3 h-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 bg-white font-medium"
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto custom-scrollbar p-2">
            {!required && (
              <li
                className="px-3 py-2 text-[11px] text-gray-400 hover:bg-gray-50 rounded-lg cursor-pointer italic font-medium mb-1"
                onClick={() => handleSelect(null)}
              >
                — Kosongkan pilihan
              </li>
            )}
            {isLoading ? (
              <li className="px-3 py-10 text-xs text-gray-400 flex flex-col items-center justify-center gap-3">
                <Loader2 size={24} className="animate-spin text-green-500" />
                <span className="font-medium">Memuat data...</span>
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-8 text-xs text-gray-400 italic text-center font-medium">
                {noOptionsMessage || 'Tidak ada hasil'}
              </li>
            ) : (
              filtered.map((o, i) => (
                <li
                  key={i}
                  className={`px-4 py-3 text-sm cursor-pointer rounded-lg transition-all mb-1 last:mb-0 border border-transparent ${
                    selected && valueFn(selected) === valueFn(o) 
                      ? 'bg-green-50 text-green-600 border-green-100 font-bold' 
                      : 'text-gray-600 font-medium hover:bg-gray-50'
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
  const [refreshSyncCount, setRefreshSyncCount] = useState(0);
  const [, startTransition] = useTransition();
  
  const formatNumberIndo = (val: string | number) => {
    if (val === undefined || val === null || val === '') return '';
    
    // If it's a number (from API), don't strip the decimal dot
    const isNumType = typeof val === 'number';
    let s = String(val);
    if (!isNumType) {
      s = s.replace(/\./g, '').replace(/,/g, '.');
    }
    
    const num = parseFloat(s);
    if (isNaN(num)) return String(val);

    const parts = s.split('.');
    let res = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (parts.length > 1) {
      // Limit to 2 decimal places to keep it clean
      const decimalPart = parts[1].substring(0, 2);
      res += ',' + decimalPart;
    }
    return res;
  };

  const parseNumberIndo = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/\./g, '').replace(/,/g, '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        setRefreshSyncCount(prev => prev + 1);
        startTransition(() => {
          router.refresh();
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [fakturPreview, setFakturPreview] = useState<string>('Memuat...');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<string>('Low');
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

  const [selectedOrderFaktur, setSelectedOrderFaktur] = useState<string>('');
  const [selectedOrderName, setSelectedOrderName] = useState<string>('');
  const [jenisBarang, setJenisBarang] = useState<string>('BBB Produksi');
  
  const [items, setItems] = useState<ItemData[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [hppKalkulasiValue, setHppKalkulasiValue] = useState<number | null>(null);
  const [hppKeterangan, setHppKeterangan] = useState<string>('');
  const [hppLoading, setHppLoading] = useState(false);

  const [selectedNamaBarang, setSelectedNamaBarang] = useState<string>('');
  const [selectedItemFaktur, setSelectedItemFaktur] = useState<string>('');
  const [manualNamaBarang, setManualNamaBarang] = useState<string>('');
  
  const [jenisHarga, setJenisHarga] = useState<string>('HPP Digit');
  const [jumlah, setJumlah] = useState<string>('');
  const [harga, setHarga] = useState<string>('');
  const prevJenisHargaRef = useRef<string>('');
  const [draftEmployeeId, setDraftEmployeeId] = useState<number | null>(null);
  const [draftOrderFaktur, setDraftOrderFaktur] = useState<string>('');
  const [draftItemFaktur, setDraftItemFaktur] = useState<string | null>('');
  const [isDraftRestored, setIsDraftRestored] = useState(false);


  const jenisBarangOptions = [
    { label: 'BBB Produksi', value: 'BBB Produksi' },
    { label: 'Penerimaan Barang Hasil Produksi', value: 'Penerimaan Barang Hasil Produksi' },
    { label: 'HPP Kalkulasi', value: 'HPP Kalkulasi' },
    { label: 'Penjualan', value: 'Penjualan Barang' },
    { label: 'Manual', value: 'Input Manual' },
  ];

  const allJenisHargaOptions = [
    { label: 'HPP Digit', value: 'HPP Digit' },
    { label: 'Harga Jual Digit', value: 'Harga Jual Digit' },
    { label: 'HPP Kalkulasi', value: 'HPP Kalkulasi' },
    { label: 'Input Manual', value: 'Input Manual' },
  ];

  const jenisHargaOptions = useMemo(() => {
    if (jenisBarang === 'BBB Produksi') return allJenisHargaOptions.filter(o => o.value === 'HPP Digit' || o.value === 'Input Manual');
    if (jenisBarang === 'Penerimaan Barang Hasil Produksi') return allJenisHargaOptions.filter(o => o.value === 'HPP Digit' || o.value === 'Input Manual');
    if (jenisBarang === 'Penjualan Barang') return allJenisHargaOptions.filter(o => o.value === 'Harga Jual Digit' || o.value === 'Input Manual');
    if (jenisBarang === 'Input Manual') return allJenisHargaOptions.filter(o => o.value === 'Input Manual');
    if (jenisBarang === 'HPP Kalkulasi') return allJenisHargaOptions.filter(o => o.value === 'HPP Kalkulasi' || o.value === 'Input Manual');
    return [{ label: 'Pilih Kategori', value: '' }];
  }, [jenisBarang]);

  useEffect(() => {
    if (editingInfraction) {
      setDescription(editingInfraction.description || '');
      
      let parsedDate = new Date();
      if (editingInfraction.date) {
        const d = new Date(editingInfraction.date);
        if (!isNaN(d.getTime())) parsedDate = d;
      }
      setSelectedDate(parsedDate);
      setFakturPreview(editingInfraction.faktur || 'Tanpa Faktur');
      setSelectedOrderFaktur(editingInfraction.order_faktur || '');
      setSelectedOrderName(editingInfraction.order_name || '');
      setJenisBarang(editingInfraction.jenis_barang || 'BBB Produksi');
      setJenisHarga(editingInfraction.jenis_harga || 'HPP Digit');
      setSeverity(editingInfraction.severity || 'Low');
      
      if (editingInfraction.jenis_barang === 'Input Manual') {
        setManualNamaBarang(editingInfraction.nama_barang || '');
        setDraftItemFaktur('');
      } else {
        setSelectedNamaBarang(editingInfraction.nama_barang || '');
        setSelectedItemFaktur(editingInfraction.item_faktur || '');
        setDraftItemFaktur('__pending__');
      }

      setJumlah(editingInfraction.jumlah ? String(editingInfraction.jumlah) : '');
      setHarga(editingInfraction.harga ? String(editingInfraction.harga) : '');
      const empMatch = employees.find(e => e.id === editingInfraction.employee_id);
      setDraftEmployeeId(empMatch ? editingInfraction.employee_id : null);
      setDraftOrderFaktur(editingInfraction.order_faktur || '');
      
    } else {
      const savedDraft = localStorage.getItem('infraction_form_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setDescription(draft.description || '');
          if (draft.selectedDate) {
            const d = new Date(draft.selectedDate);
            const todayStr = formatLocalYYYYMMDD(new Date());
            const draftStr = formatLocalYYYYMMDD(d);
            
            if (todayStr === draftStr) {
              setSelectedDate(d);
            }
          }
          setSelectedOrderFaktur(draft.selectedOrderFaktur || '');
          setSelectedOrderName(draft.selectedOrderName || '');
          setJenisBarang(draft.jenisBarang || 'BBB Produksi');
          setJenisHarga(draft.jenisHarga || 'HPP Digit');
          setSelectedNamaBarang(draft.selectedNamaBarang || '');
          setSelectedItemFaktur(draft.selectedItemFaktur || '');
          setManualNamaBarang(draft.manualNamaBarang || '');
          setJumlah(draft.jumlah || '');
          setHarga(draft.harga || '');
          setSeverity(draft.severity || 'Low');
          setDraftEmployeeId(draft.employeeId || null);
          setDraftOrderFaktur(draft.selectedOrderFaktur || '');
          setDraftItemFaktur(draft.selectedItemFaktur || '');
        } catch (e) {
          console.error('Failed to load draft', e);
        }
      }
    }
    setIsDraftRestored(true);
  }, [editingInfraction, employees]);

  useEffect(() => {
    if (editingInfraction || !isDraftRestored) return;
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
      severity,
      employeeId: draftEmployeeId,
    };
    localStorage.setItem('infraction_form_draft', JSON.stringify(draft));
  }, [description, selectedDate, selectedOrderFaktur, selectedOrderName, jenisBarang, jenisHarga, selectedNamaBarang, selectedItemFaktur, manualNamaBarang, jumlah, harga, severity, draftEmployeeId, editingInfraction, isDraftRestored]);
 
  // Handle price type transitions (Manual Mode Activation)
  useEffect(() => {
    if (editingInfraction || !isDraftRestored) return;
    
    const isNowManual = (jenisHarga === 'Input Manual');
    const wasManual = (prevJenisHargaRef.current === 'Input Manual');

    // If we just enabled manual mode (and it's not the initial mount/refresh), clear the price
    if (isNowManual && !wasManual && prevJenisHargaRef.current !== '') {
      setHarga('');
    }
    
    prevJenisHargaRef.current = jenisHarga;
  }, [jenisHarga, editingInfraction]);

  const resetFormStates = () => {
    setDescription('');
    setSelectedDate(new Date());
    setSelectedOrderFaktur('');
    setSelectedOrderName('');
    setJenisBarang('BBB Produksi');
    setJenisHarga('HPP Digit');
    setSelectedNamaBarang('');
    setSelectedItemFaktur('');
    setManualNamaBarang('');
    setJumlah('');
    setHarga('');
    setSeverity('Low');
    setDraftEmployeeId(null);
    setDraftOrderFaktur('');
    setDraftItemFaktur('');
    localStorage.removeItem('infraction_form_draft');
  };

  const allEmployees = useMemo(() => {
    let list = [...employees];
    if (editingInfraction) {
      if (editingInfraction.employee_id && !list.find(e => e.id === editingInfraction.employee_id)) {
        list.push({ 
          id: editingInfraction.employee_id, 
          name: editingInfraction.employee_name || 'Archived', 
          position: editingInfraction.employee_position || '-',
          employee_no: editingInfraction.employee_no || '-' 
        } as any);
      }
    }
    return list;
  }, [employees, editingInfraction]);

  const allOrders = useMemo(() => {
    let list = [...orders];
    if (editingInfraction && editingInfraction.order_faktur && !list.find(o => o.faktur === editingInfraction.order_faktur)) {
      list.push({ faktur: editingInfraction.order_faktur, nama_prd: editingInfraction.order_name || 'Archived' } as any);
    }
    return list;
  }, [orders, editingInfraction]);

  useEffect(() => {
    let active = true;
    async function fetchItems() {
      if (!selectedOrderName || jenisBarang === 'Input Manual') { setItems([]); return; }
      setItemsLoading(true);
      try {
        const res = await fetch(`/api/items?order_name=${encodeURIComponent(selectedOrderName)}&order_faktur=${encodeURIComponent(selectedOrderFaktur)}&jenis_barang=${encodeURIComponent(jenisBarang)}&_t=${Date.now()}`);
        if (res.ok && active) {
          const json = await res.json();
          setItems(json.data || []);
          if (draftItemFaktur === '__pending__') setDraftItemFaktur(selectedItemFaktur);
        }
      } catch (err) { console.error(err); } finally { if (active) setItemsLoading(false); }
    }
    fetchItems();
    return () => { active = false; };
  }, [selectedOrderName, selectedOrderFaktur, jenisBarang, refreshSyncCount, draftItemFaktur, selectedItemFaktur]);

  useEffect(() => {
    let active = true;
    async function fetchHpp() {
      if (!selectedOrderName) { setHppKalkulasiValue(null); return; }
      setHppLoading(true);
      try {
        const res = await fetch(`/api/hpp-kalkulasi?order_name=${encodeURIComponent(selectedOrderName)}&_t=${Date.now()}`);
        if (res.ok && active) {
          const json = await res.json();
          const val = json.data?.[0]?.hpp_kalkulasi ?? 0;
          const ket = json.data?.[0]?.keterangan ?? '';
          setHppKalkulasiValue(val);
          setHppKeterangan(ket);

          if (jenisBarang === 'HPP Kalkulasi' && jenisHarga !== 'Input Manual') {
            setSelectedNamaBarang(selectedOrderName);
            setHarga(formatNumberIndo(val));
          }
        }
      } catch { } finally { if (active) setHppLoading(false); }
    }
    fetchHpp();
    return () => { active = false; };
  }, [selectedOrderName, jenisBarang, jenisHarga, refreshSyncCount]);

  useEffect(() => {
    if (!isDraftRestored) return;
    const isManualBasis = (jenisHarga === 'Input Manual' || jenisBarang === 'Input Manual');
    if (isManualBasis) return;

    if (jenisBarang === 'HPP Kalkulasi') {
       setHarga(formatNumberIndo(hppKalkulasiValue || 0));
    } else if (selectedNamaBarang && items.length > 0) {
      const match = items.find(i => selectedItemFaktur ? i.faktur === selectedItemFaktur : i.nama_barang === selectedNamaBarang);
      if (match) {
        let hValue = match.harga;
        if (jenisBarang === 'Penjualan Barang' && jenisHarga === 'Harga Jual Digit') hValue = match.harga_jual || match.harga;
        setHarga(formatNumberIndo(hValue));
      }
    } else if (!selectedNamaBarang && jenisBarang !== 'HPP Kalkulasi') {
      setHarga('');
    }
  }, [isDraftRestored, jenisBarang, jenisHarga, selectedNamaBarang, selectedItemFaktur, items, hppKalkulasiValue]);

  const totalValue = useMemo(() => {
    const j = parseNumberIndo(jumlah);
    const h = parseNumberIndo(harga);
    return j * h;
  }, [jumlah, harga]);

  useEffect(() => {
    let active = true;
    async function fetchNextFaktur() {
      if (editingInfraction) return;
      setFakturPreview('Memuat...');
      try {
        const dateStr = formatLocalYYYYMMDD(selectedDate);
        const res = await fetch(`/api/infractions/next-faktur?date=${dateStr}&_t=${Date.now()}`);
        if (res.ok && active) {
          const data = await res.json();
          setFakturPreview(data.nextFaktur);
        }
      } catch { if (active) setFakturPreview('ERR-AUTO'); }
    }
    fetchNextFaktur();
    return () => { active = false; };
  }, [selectedDate, editingInfraction]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!formData.get('employee_id')) { showDialog('alert', 'Peringatan', 'Pilih karyawan!'); return; }
    if (!selectedOrderFaktur) { showDialog('alert', 'Peringatan', 'Pilih Order!'); return; }
    
    const actualNamaBarang = jenisBarang === 'Input Manual' ? manualNamaBarang : selectedNamaBarang;
    if (!actualNamaBarang) { showDialog('alert', 'Peringatan', 'Isi Nama Barang!'); return; }
    if (!jumlah || parseFloat(jumlah) <= 0) { showDialog('alert', 'Peringatan', 'Jumlah tidak valid!'); return; }
    if (!harga || parseFloat(harga) <= 0) { showDialog('alert', 'Peringatan', 'Harga tidak valid!'); return; }

    const isEdit = !!editingInfraction;
    const body: any = {
      employee_id: formData.get('employee_id'),
      date: formatLocalYYYYMMDD(selectedDate),
      order_faktur: selectedOrderFaktur,
      order_name: selectedOrderName,
      jenis_barang: jenisBarang,
      nama_barang: actualNamaBarang,
      item_faktur: selectedItemFaktur,
      jenis_harga: jenisHarga,
      jumlah,
      harga,
      total: String(totalValue),
      description,
      severity,
      faktur: editingInfraction?.faktur || null
    };

    pendingSubmitDataRef.current = {
      endpoint: isEdit ? `/api/infractions/${editingInfraction.id}` : '/api/infractions',
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      isEdit
    };
    showDialog('confirm', 'Konfirmasi', isEdit ? 'Simpan perubahan?' : 'Catat data baru?', executeSubmit, 'Simpan');
  };

  const executeSubmit = async () => {
    if (!pendingSubmitDataRef.current) return;
    setDialogConfig(prev => ({ ...prev, isLoading: true }));
    const { endpoint, method, headers, body, isEdit } = pendingSubmitDataRef.current;
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method, headers, body });
      if (res.ok) {
        localStorage.setItem('sintak_data_updated', Date.now().toString());
        closeDialog();
        showDialog('success', 'Berhasil', isEdit ? 'Data diperbarui.' : 'Data dicatat.', () => {
          if (onSuccessEdit) onSuccessEdit();
          if (!isEdit) { resetFormStates(); setResetKey(k => k + 1); }
          if (onRefreshInfractions) onRefreshInfractions(); else router.refresh();
        });
      } else {
        closeDialog();
        showDialog('error', 'Gagal', 'Terjadi kesalahan saat menyimpan.');
      }
    } catch { closeDialog(); showDialog('error', 'Gagal', 'Kesalahan koneksi.'); }
    finally { setLoading(false); pendingSubmitDataRef.current = null; }
  };

  const inputCls = 'w-full bg-white border border-gray-100 rounded-lg px-4 h-11 text-sm focus:outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500 transition-all text-gray-800 font-semibold placeholder:text-gray-300 shadow-sm';
  const labelCls = 'flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 mb-1.5 ml-1';
  const sectionHeaderCls = 'flex items-center gap-3 pb-3 border-b border-gray-50 mb-5 mt-1';

  return (
    <div className="w-full pb-10">
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm shadow-green-900/5">
              <div className={sectionHeaderCls}>
                <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <ClipboardList size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-gray-400">Identitas Data</span>
                  <h3 className="text-[14px] font-bold text-gray-800 leading-tight">Data Utama</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Nomor Faktur</label>
                  <div className="h-11 px-4 bg-gray-50/50 border border-gray-100 rounded-lg flex items-center text-sm font-bold text-gray-400">
                    {fakturPreview}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelCls}>Tanggal</label>
                  <DatePicker 
                    name="date"
                    value={selectedDate}
                    onChange={setSelectedDate}
                  />
                </div>

                <div className="md:col-span-2">
                  <SearchableSelect
                    key={`emp-${resetKey}`}
                    label="Nama Karyawan"
                    name="employee_id"
                    options={allEmployees as any}
                    placeholder="Cari karyawan..."
                    required
                    displayFn={(e) => `${e.name} (${e.position})`}
                    valueFn={(e) => e.id}
                    defaultValue={draftEmployeeId}
                    onChange={(emp) => setDraftEmployeeId(emp ? emp.id : null)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm shadow-green-900/5">
              <div className={sectionHeaderCls}>
                <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-gray-400">Tingkat Bahaya</span>
                  <h3 className="text-[14px] font-bold text-gray-800 leading-tight">Severitas & Detail</h3>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5 focus-within:z-10">
                  <label className={labelCls}>Severitas (Tingkat Dampak)</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'Low', value: 'Low', activeCls: 'bg-blue-600 text-white shadow-sm shadow-blue-200' },
                      { label: 'Medium', value: 'Medium', activeCls: 'bg-amber-500 text-white shadow-sm shadow-amber-200' },
                      { label: 'High', value: 'High', activeCls: 'bg-red-600 text-white shadow-sm shadow-red-200' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSeverity(opt.value)}
                        className={`flex-1 min-w-[80px] px-4 h-9 text-[12px] font-semibold rounded-lg transition-all duration-300 border ${
                          severity === opt.value 
                            ? `${opt.activeCls} border-transparent` 
                            : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className={labelCls}>Deskripsi Detail (Optional)</label>
                  <textarea
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`${inputCls} min-h-[140px] py-4 leading-relaxed`}
                    placeholder="Jelaskan secara rinci kesalahan yang terjadi..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm shadow-green-900/5 overflow-visible text-black">
              <div className={sectionHeaderCls}>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Box size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-gray-400">Kalkulasi Beban</span>
                  <h3 className="text-[13px] font-bold text-gray-800 leading-tight">Rincian Beban Biaya</h3>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <SearchableSelect
                  key={`order-${resetKey}`}
                  label="Referensi Order"
                  name="order_ref"
                  options={allOrders}
                  placeholder="Pilih Nomor Order..."
                  required
                  displayFn={(o) => o.faktur ? `[${o.faktur}] ${o.nama_prd}` : o.nama_prd}
                  valueFn={(o) => o.faktur}
                  defaultValue={draftOrderFaktur}
                  onChange={(o) => {
                    if (o) {
                      setSelectedOrderFaktur(o.faktur);
                      setSelectedOrderName(o.nama_prd);
                      setDraftOrderFaktur(o.faktur);
                      setSelectedNamaBarang('');
                      setSelectedItemFaktur('');
                      setDraftItemFaktur('');
                      if (jenisHarga !== 'Input Manual' && jenisBarang !== 'Input Manual') {
                        setHarga('');
                      }
                    } else {
                      setSelectedOrderFaktur('');
                      setSelectedOrderName('');
                      setDraftOrderFaktur('');
                      setSelectedNamaBarang('');
                      setSelectedItemFaktur('');
                      setDraftItemFaktur('');
                      if (jenisHarga !== 'Input Manual' && jenisBarang !== 'Input Manual') {
                        setHarga('');
                      }
                    }
                  }}
                />

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Kategori Barang</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {jenisBarangOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setJenisBarang(opt.value);
                            setSelectedNamaBarang('');
                            setSelectedItemFaktur('');
                            setDraftItemFaktur('');
                            setManualNamaBarang('');
                            
                            if (opt.value !== 'Input Manual') {
                              if (opt.value === 'BBB Produksi') setJenisHarga('HPP Digit');
                              else if (opt.value === 'Penerimaan Barang Hasil Produksi') setJenisHarga('HPP Digit');
                              else if (opt.value === 'Penjualan Barang') setJenisHarga('Harga Jual Digit');
                              else if (opt.value === 'HPP Kalkulasi') setJenisHarga('HPP Kalkulasi');
                              setHarga('');
                            } else {
                              setJenisHarga('Input Manual');
                              setHarga('');
                            }
                          }}
                          className={`px-2 py-2 text-[12px] font-semibold rounded-lg transition-all duration-300 h-9 leading-tight border ${
                            jenisBarang === opt.value
                              ? 'bg-green-600 text-white border-transparent shadow-sm shadow-green-100'
                              : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {jenisBarang !== 'Input Manual' && jenisBarang !== 'HPP Kalkulasi' ? (
                    <SearchableSelect
                      key={`item-${resetKey}-${jenisBarang}-${selectedOrderFaktur}`}
                      label="Nama Barang"
                      name="item_id"
                      options={items}
                      placeholder={itemsLoading ? "Memuat..." : "Pilih Barang..."}
                      isLoading={itemsLoading}
                      required
                      displayFn={(i) => `[${i.faktur}] ${i.nama_barang}`}
                      valueFn={(i) => i.faktur}
                      defaultValue={draftItemFaktur === '__pending__' ? '' : draftItemFaktur}
                      onChange={(i) => {
                        if (i) {
                          setSelectedNamaBarang(i.nama_barang);
                          setSelectedItemFaktur(i.faktur);
                          setDraftItemFaktur(i.faktur);
                        } else {
                          setSelectedNamaBarang('');
                          setSelectedItemFaktur('');
                          setDraftItemFaktur('');
                        }
                      }}
                      noOptionsMessage="Order ini tidak memiliki data barang"
                    />
                  ) : jenisBarang === 'Input Manual' ? (
                    <div className="space-y-1.5">
                      <label className={labelCls}>Nama Barang Manual</label>
                      <input
                        type="text"
                        value={manualNamaBarang}
                        onChange={(e) => setManualNamaBarang(e.target.value)}
                        className={inputCls}
                        placeholder="Contoh: Kertas Macet, Tinta Tumpah..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className={labelCls}>Nama Barang (Order)</label>
                      <div className="h-11 px-4 bg-gray-50/50 border border-gray-100 rounded-lg flex items-center text-sm font-bold text-gray-400">
                        {hppLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Star size={16} className="mr-2" />}
                        {selectedOrderName || 'Pilih Order Dulu'}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className={labelCls}>Jenis Dasar Harga</label>
                    <div className="flex flex-wrap gap-2.5">
                      {jenisHargaOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const wasManual = (jenisHarga === 'Input Manual');
                            setJenisHarga(opt.value);
                            if (opt.value === 'Input Manual' && !wasManual) {
                              setHarga('');
                            }
                          }}
                          className={`px-4 py-2 text-[12px] font-semibold rounded-lg transition-all duration-300 h-10 flex-1 min-w-[120px] border ${
                            jenisHarga === opt.value
                              ? 'bg-blue-600 text-white border-transparent shadow-sm shadow-blue-100'
                              : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div className="space-y-1.5">
                      <label className={labelCls}>Kuantitas (Qty)</label>
                      <input
                        type="text"
                        value={jumlah}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9,]/g, '');
                          setJumlah(formatNumberIndo(val));
                        }}
                        className={inputCls}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Harga Satuan</label>
                      <input
                        type="text"
                        value={harga}
                        readOnly={jenisHarga !== 'Input Manual'}
                        onChange={(e) => {
                          if (jenisHarga !== 'Input Manual') return;
                          const val = e.target.value.replace(/[^0-9,]/g, '');
                          setHarga(formatNumberIndo(val));
                        }}
                        className={`${inputCls} ${jenisHarga !== 'Input Manual' ? 'bg-gray-50 cursor-not-allowed text-gray-400' : ''}`}
                        placeholder="0"
                      />
                      {jenisBarang === 'HPP Kalkulasi' && jenisHarga === 'HPP Kalkulasi' && hppKeterangan && (
                        <div className="mt-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-medium">
                            <span>📌</span>
                            {hppKeterangan}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 p-4 bg-slate-600 text-white rounded-xl shadow-sm flex justify-between items-center overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Box size={120} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col relative z-10">
                      <span className="text-[10px] font-semibold text-slate-400 mb-1">Total Estimasi Beban</span>
                      <span className="text-3xl font-extrabold tracking-tight">
                        Rp {totalValue.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="relative z-10 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <CheckCircle2 size={24} className="text-green-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] h-12 rounded-xl bg-green-600 text-white font-bold text-[13px] shadow-sm shadow-green-100 transition-all flex items-center justify-center gap-2.5 hover:bg-green-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                    <span>{editingInfraction ? 'Simpan Perubahan' : 'Catat Kesalahan'}</span>
                  </>
                )}
              </button>
              
              {editingInfraction && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="flex-1 h-12 rounded-xl bg-white border border-gray-200 text-gray-400 font-semibold text-[13px] hover:bg-gray-50 transition-all active:translate-y-0 shadow-sm"
                >
                  Batal
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmLabel={dialogConfig.confirmLabel}
        isLoading={dialogConfig.isLoading}
        onConfirm={dialogConfig.onConfirm || (() => {})}
        onCancel={closeDialog}
      />
    </div>
  );
}

















