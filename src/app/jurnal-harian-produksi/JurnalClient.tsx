'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertCircle, ClipboardList, RotateCcw, Filter, Plus, Trash2, Edit2, Save, X, CheckCircle2, ChevronDown, Search, PlusSquare, Copy, FileText } from 'lucide-react';
import SearchableDropdown from '@/components/SearchableDropdown';
import SearchAndReload from '@/components/SearchAndReload';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DataTable } from '@/components/ui/DataTable';
import TableFooter from '@/components/TableFooter';
import DatePicker from '@/components/DatePicker';

// Mapping Bagian -> Category master_pekerjaan
const BAGIAN_CATEGORY_MAP: Record<string, string> = {
  'SETTING':          'PRA CETAK',
  'QUALITY CONTROL':  'QUALITY CONTROL',
  'CETAK':            'CETAK',
  'FINISHING':        'PASCA CETAK',
  'GUDANG':           'GUDANG',
  'TEKNISI':          'TEHNISI',
};

const BAGIAN_LIST = ['SETTING', 'QUALITY CONTROL', 'CETAK', 'FINISHING', 'GUDANG', 'TEKNISI'];

const SHIFT_JAM: Record<string, string> = {
  '1': '07:00 - 15:00',
  '2': '15:00 - 23:00',
  '3': '23:00 - 07:00',
};

const PAGE_SIZE = 50;

function formatIndoDateStr(tglStr: string) {
  if (!tglStr) return '';
  const parts = tglStr.split('-');
  if (parts.length === 3) {
    const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T12:00:00Z`);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return tglStr;
}

export default function JurnalClient({
  canInputTarget = true,
  canInputRealisasi = true,
}: {
  canInputTarget?: boolean;
  canInputRealisasi?: boolean;
}) {
  const router = useRouter();
  
  // State
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dropdown filters
  const [bagianFilter, setBagianFilter] = useState('');
  const [namaKaryawanFilter, setNamaKaryawanFilter] = useState('');
  const [bagianOptions, setBagianOptions] = useState<string[]>([]);
  const [namaOptions, setNamaOptions] = useState<string[]>([]);
  const [allNamaOptions, setAllNamaOptions] = useState<{ nama: string; bagian: string }[]>([]);
  const [isBagianDropdownOpen, setIsBagianDropdownOpen] = useState(false);
  const [isNamaDropdownOpen, setIsNamaDropdownOpen] = useState(false);
  const [bagianSearchQuery, setBagianSearchQuery] = useState('');
  const [namaSearchQuery, setNamaSearchQuery] = useState('');

  // CRUD State
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
  const [formSubTab, setFormSubTab] = useState<'target' | 'realisasi'>('target');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Dropdown data for form
  const [employees, setEmployees] = useState<any[]>([]);
  const [sopdList, setSopdList] = useState<any[]>([]);
  const [jenisPekerjaanList, setJenisPekerjaanList] = useState<string[]>([]);
  const [jenisPekerjaan2List, setJenisPekerjaan2List] = useState<string[]>([]);
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  // Realisasi: pilih target row dulu
  const [selectedTargetRow, setSelectedTargetRow] = useState<any | null>(null);
  const [targetSearchQuery, setTargetSearchQuery] = useState('');
  const [targetRowOptions, setTargetRowOptions] = useState<any[]>([]);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
  const targetDropdownRef = useRef<HTMLDivElement>(null);

  // Table State
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | number | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jurnal_columnWidths_v2');
      if (saved) return JSON.parse(saved);
    }
    return {
      index: 60,
      posisi: 120,
      absensi: 80,
      tgl: 120,
      shift: 80,
      nama_karyawan: 200,
      no_order: 180,
      nama_order: 250,
      jenis_pekerjaan: 200,
      keterangan: 180,
      target: 100,
      realisasi: 100,
      no_order_2: 180,
      nama_order_2: 250,
      jenis_pekerjaan_2: 200,
      bahan_kertas: 150,
      jml_plate: 100,
      warna: 100,
      inscheet: 100,
      rijek: 100,
      jam: 100,
      kendala: 150,
      id: 60,
      bagian: 150
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Outside click handling is now managed within SearchableDropdown

  useEffect(() => {
    setIsMounted(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const savedStart = localStorage.getItem('jurnal_startDate');
    if (savedStart) {
      const d = new Date(savedStart);
      if (!isNaN(d.getTime())) setStartDate(d);
    }
    const savedEnd = localStorage.getItem('jurnal_endDate');
    const lastVisit = localStorage.getItem('jurnal_lastVisitDate');
    const todayStr = today.toDateString();

    // Update hari kunjungan terakhir
    localStorage.setItem('jurnal_lastVisitDate', todayStr);

    const isNewDay = lastVisit !== todayStr;

    if (savedEnd && !isNewDay) {
      // Hari yang sama Ã¢â‚¬â€ pakai nilai yang sudah disimpan user apa adanya
      const d = new Date(savedEnd);
      if (!isNaN(d.getTime())) setEndDate(d);
      else { setEndDate(today); localStorage.setItem('jurnal_endDate', today.toISOString()); }
    } else {
      // Hari baru atau belum ada data Ã¢â‚¬â€ reset ke hari ini
      setEndDate(today);
      localStorage.setItem('jurnal_endDate', today.toISOString());
    }

    const handleDataUpdated = () => {
      setRefreshKey(prev => prev + 1);
      router.refresh();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        handleDataUpdated();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sintak:data-updated', handleDataUpdated);
    return () => { 
      window.removeEventListener('storage', handleStorageChange); 
      window.removeEventListener('sintak:data-updated', handleDataUpdated);
    };
  }, [router]);

  useEffect(() => {
    if (!isMounted) return;
    if (startDate) localStorage.setItem('jurnal_startDate', startDate.toISOString());
    else localStorage.removeItem('jurnal_startDate');
  }, [startDate, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (endDate) localStorage.setItem('jurnal_endDate', endDate.toISOString());
    else localStorage.removeItem('jurnal_endDate');
  }, [endDate, isMounted]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      const startTime = performance.now();
      try {
        const fmtDate = (d: Date | null) => {
           if (!d) return '';
           const y = d.getFullYear();
           const m = String(d.getMonth() + 1).padStart(2, '0');
           const day = String(d.getDate()).padStart(2, '0');
           return `${y}-${m}-${day}`;
        };
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: PAGE_SIZE.toString(),
          search: debouncedQuery,
          startDate: fmtDate(startDate),
          endDate: fmtDate(endDate),
          ...(bagianFilter ? { bagian: bagianFilter } : {}),
          ...(namaKaryawanFilter ? { namaKaryawan: namaKaryawanFilter } : {}),
          _t: Date.now().toString()
        });
        const res = await fetch(`/api/jurnal-harian-produksi?${queryParams.toString()}`);
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setLoadTime(Math.round(performance.now() - startTime));
            setData(json.data || []);
            setTotalCount(json.total || 0);
            setError('');
          }
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Gagal memuat data');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate, bagianFilter, namaKaryawanFilter]);

  // Fetch distinct bagian & nama karyawan for dropdowns
  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch('/api/jurnal-harian-produksi/options');
        if (res.ok) {
          const json = await res.json();
          // Filter out options starting with '-'
          const filteredBagian = (json.bagian || []).filter((b: string) => b && !b.trim().startsWith('-'));
          const filteredKaryawan = (json.karyawan || []).filter((k: any) => k.nama && !k.nama.trim().startsWith('-') && k.bagian && !k.bagian.trim().startsWith('-'));

          setBagianOptions(filteredBagian);
          setAllNamaOptions(filteredKaryawan);
          setNamaOptions(Array.from(new Set(filteredKaryawan.map((k: any) => k.nama))));
        }
      } catch {}
    }
    fetchOptions();
  }, [refreshKey]);

  // Fetch employees & sopd for form dropdowns (only when form is open)
  useEffect(() => {
    if (activeTab !== 'form') return;
    let active = true;
    async function loadFormData() {
      setIsLoadingForm(true);
      try {
        const [empRes, sopdRes] = await Promise.all([
          fetch('/api/employees?limit=500'),
          fetch('/api/sopd?all=true&limit=30')
        ]);
        if (!active) return;
        if (empRes.ok) {
          const j = await empRes.json();
          setEmployees(j.data || []);
        }
        if (sopdRes.ok) {
          const j = await sopdRes.json();
          setSopdList(j.data || []);
        }
      } catch {} finally {
        if (active) setIsLoadingForm(false);
      }
    }
    loadFormData();
    return () => { active = false; };
  }, [activeTab, refreshKey]);

  // Fetch jenis pekerjaan ketika bagian form berubah (section Target)
  useEffect(() => {
    if (!formData.bagian) { setJenisPekerjaanList([]); return; }
    const category = BAGIAN_CATEGORY_MAP[formData.bagian] || '';
    if (!category) { setJenisPekerjaanList([]); return; }
    fetch(`/api/master-pekerjaan?category=${encodeURIComponent(category)}&limit=200`)
      .then(r => r.json())
      .then(j => setJenisPekerjaanList((j.data || []).map((x: any) => x.name)))
      .catch(() => setJenisPekerjaanList([]));
  }, [formData.bagian]);

  // Fetch jenis pekerjaan untuk section Realisasi (ikut bagian dari target)
  useEffect(() => {
    const bagian = selectedTargetRow?.bagian || formData.bagian;
    if (!bagian) { setJenisPekerjaan2List([]); return; }
    const category = BAGIAN_CATEGORY_MAP[bagian] || '';
    if (!category) { setJenisPekerjaan2List([]); return; }
    fetch(`/api/master-pekerjaan?category=${encodeURIComponent(category)}&limit=200`)
      .then(r => r.json())
      .then(j => setJenisPekerjaan2List((j.data || []).map((x: any) => x.name)))
      .catch(() => setJenisPekerjaan2List([]));
  }, [selectedTargetRow, formData.bagian]);

  // Filter target rows for Realisasi dropdown
  useEffect(() => {
    if (!data) return;
    const q = targetSearchQuery.toLowerCase();
    const filtered = data.filter(row =>
      (row.nama_karyawan || '').toLowerCase().includes(q) ||
      (row.no_order || '').toLowerCase().includes(q) ||
      (row.nama_order || '').toLowerCase().includes(q) ||
      (row.tgl || '').includes(q)
    ).slice(0, 30);
    setTargetRowOptions(filtered);
  }, [targetSearchQuery, data]);

  // Close target dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(e.target as Node)) {
        setIsTargetDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // When bagian changes, update nama options
  useEffect(() => {
    if (!bagianFilter) {
      setNamaOptions(Array.from(new Set(allNamaOptions.map(k => k.nama))));
    } else {
      const filtered = allNamaOptions.filter(k => k.bagian === bagianFilter).map(k => k.nama);
      setNamaOptions(Array.from(new Set(filtered)));
      setNamaKaryawanFilter(prev => {
        return filtered.includes(prev) ? prev : '';
      });
    }
  }, [bagianFilter, allNamaOptions]);

  const handleResetFilter = useCallback(() => {
    setBagianFilter('');
    setNamaKaryawanFilter('');
    setPage(1);
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 3000);
  };

  const startAdd = useCallback(() => {
    setActiveTab('form');
    // Jika tidak bisa input target tapi bisa realisasi, langsung ke tab realisasi
    setFormSubTab(!canInputTarget && canInputRealisasi ? 'realisasi' : 'target');
    setIsAdding(true);
    setEditingId(null);
    setSelectedTargetRow(null);
    setTargetSearchQuery('');
    setFormData({ tgl: new Date().toISOString().split('T')[0] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [canInputTarget, canInputRealisasi]);

  const startEdit = useCallback((row: any) => {
    setActiveTab('form');
    // Admin Realisasi: langsung ke tab Realisasi. Admin Penjadwalan: ke tab Target.
    setFormSubTab(canInputRealisasi ? 'realisasi' : 'target');
    setIsAdding(false);
    setEditingId(row.id);
    setSelectedTargetRow(null);
    const formattedData = { ...row };
    if (formattedData.tgl && formattedData.tgl.includes('T')) {
      formattedData.tgl = formattedData.tgl.split('T')[0];
    }
    setFormData(formattedData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [canInputRealisasi]);

  const cancelForm = useCallback(() => {
    setActiveTab('list');
    setIsAdding(false);
    setEditingId(null);
    setFormData({});
    setSelectedTargetRow(null);
    setTargetSearchQuery('');
  }, []);

  const startInputRealisasi = useCallback((row: any) => {
    setActiveTab('form');
    setFormSubTab('realisasi');
    setIsAdding(false);
    setEditingId(row.id);
    setSelectedTargetRow(row);
    setTargetSearchQuery('');
    
    const formattedData = { ...row };
    if (formattedData.tgl && formattedData.tgl.includes('T')) {
      formattedData.tgl = formattedData.tgl.split('T')[0];
    }

    setFormData({ 
      ...formattedData,
      no_order_2: row.no_order_2 || row.no_order || '',
      nama_order_2: row.nama_order_2 || row.nama_order || '',
      jenis_pekerjaan_2: row.jenis_pekerjaan_2 || row.jenis_pekerjaan || '',
      jam: row.jam || SHIFT_JAM[String(row.shift)] || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const startCopy = useCallback((row: any) => {
    setActiveTab('form');
    setFormSubTab('target');
    setIsAdding(true);
    setEditingId(null);
    setSelectedTargetRow(null);
    
    const formattedData = { ...row };
    delete formattedData.id;
    if (formattedData.tgl && formattedData.tgl.includes('T')) {
      formattedData.tgl = formattedData.tgl.split('T')[0];
    }
    
    // Clear realisasi fields
    formattedData.realisasi = '';
    formattedData.no_order_2 = '';
    formattedData.nama_order_2 = '';
    formattedData.jenis_pekerjaan_2 = '';
    formattedData.bahan_kertas = '';
    formattedData.jml_plate = '';
    formattedData.warna = '';
    formattedData.inscheet = '';
    formattedData.rijek = '';
    formattedData.jam = '';
    formattedData.kendala = '';

    setFormData(formattedData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const saveForm = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const isEdit = editingId !== null;
      const method = isEdit ? 'PUT' : 'POST';
      
      let payloadToSubmit: any = { ...formData };
      
      if (isEdit) {
        if (canInputTarget && !canInputRealisasi) {
          const TARGET_FIELDS = ['tgl', 'shift', 'bagian', 'nama_karyawan', 'posisi', 'absensi', 'no_order', 'nama_order', 'jenis_pekerjaan', 'keterangan', 'target'];
          payloadToSubmit = {};
          TARGET_FIELDS.forEach(f => { if (formData[f] !== undefined) payloadToSubmit[f] = formData[f] });
        } else if (canInputRealisasi && !canInputTarget) {
          const REALISASI_FIELDS = ['no_order_2', 'nama_order_2', 'jenis_pekerjaan_2', 'bahan_kertas', 'jml_plate', 'warna', 'inscheet', 'rijek', 'jam', 'kendala', 'realisasi'];
          payloadToSubmit = {};
          REALISASI_FIELDS.forEach(f => { if (formData[f] !== undefined) payloadToSubmit[f] = formData[f] });
        }
      }
      
      const payload = isEdit ? { id: editingId, ...payloadToSubmit } : { action: 'insert_single', data: payloadToSubmit };
      
      const res = await fetch('/api/jurnal-harian-produksi', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        showMessage('success', isEdit ? 'Data berhasil diupdate' : 'Data berhasil ditambahkan');
        cancelForm();
        setRefreshKey(k => k + 1);
        router.refresh();
      } else {
        showMessage('error', result.error || 'Gagal menyimpan data');
      }
    } catch (err: any) {
      showMessage('error', 'Terjadi kesalahan sistem');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;
    try {
      const res = await fetch('/api/jurnal-harian-produksi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });
      if (res.ok) {
        showMessage('success', 'Data berhasil dihapus');
        setRefreshKey(k => k + 1);
        router.refresh();
      }
    } catch (err) {}
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedIds.size} data terpilih?`)) return;
    try {
      const res = await fetch('/api/jurnal-harian-produksi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      if (res.ok) {
        showMessage('success', `${selectedIds.size} data berhasil dihapus`);
        setSelectedIds(new Set());
        setRefreshKey(k => k + 1);
        router.refresh();
      }
    } catch (err) {}
  };

  const columns = useMemo(() => [
    {
      id: 'actions',
      header: 'Aksi',
      size: 140,
      meta: { align: 'center', headerBg: '#f8fafc', sticky: true },
      cell: ({ row }: any) => (
        <div className="flex items-center justify-center gap-2">
           {canInputTarget && (
             <button type="button" title="Duplikat Jadwal" onClick={(e) => { e.stopPropagation(); startCopy(row.original); }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><Copy size={14} /></button>
           )}
           {canInputRealisasi && (!row.original.realisasi || row.original.realisasi == 0) && (
             <button type="button" title="Input Realisasi" onClick={(e) => { e.stopPropagation(); startInputRealisasi(row.original); }} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded transition-colors"><PlusSquare size={14} /></button>
           )}
           <button type="button" title="Edit Jurnal" onClick={(e) => { e.stopPropagation(); startEdit(row.original); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={14} /></button>
           <button type="button" title="Hapus Jurnal" onClick={(e) => { e.stopPropagation(); handleDelete(row.original.id); }} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash2 size={14} /></button>
        </div>
      )
    },
    {
      accessorKey: 'posisi',
      header: 'Posisi',
      size: columnWidths.posisi,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-medium tracking-tight ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'absensi',
      header: 'Abs.',
      size: columnWidths.absensi,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{Number(getValue() || 0)}</span>
    },
    { 
      accessorKey: 'tgl', 
      header: 'Tanggal',
      size: columnWidths.tgl,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{formatIndoDateStr(getValue() as string)}</span>
    },
    { 
      accessorKey: 'shift', 
      header: 'Sift',
      size: columnWidths.shift,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tracking-tight ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'nama_karyawan', 
      header: 'Nama Karyawan',
      size: columnWidths.nama_karyawan,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'no_order', 
      header: 'NO. Order (PPIC)',
      size: columnWidths.no_order,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => <span className={`font-bold transition-colors truncate ${row.getIsSelected() ? 'text-green-600' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'nama_order', 
      header: 'Nama Order',
      size: columnWidths.nama_order,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'jenis_pekerjaan', 
      header: 'Jenis Pekerjaan',
      size: columnWidths.jenis_pekerjaan,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue }: any) => (
        <span className="text-[12px] font-bold bg-green-50 text-green-700 px-3 py-1 border border-green-100 rounded-lg block w-fit truncate tracking-tight">
          {String(getValue() || '-')}
        </span>
      )
    },
    { 
      accessorKey: 'keterangan', 
      header: 'Keterangan',
      size: columnWidths.keterangan,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => <span className={`font-medium transition-colors truncate block ${row.getIsSelected() ? 'text-green-800' : 'text-gray-500'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'target', 
      header: 'Target',
      size: columnWidths.target,
      meta: { align: 'right', headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => {
        const val = getValue();
        let display = '0';
        if (val !== null && val !== undefined && val !== '') {
          display = !isNaN(Number(val)) ? Number(val).toLocaleString('id-ID') : String(val);
        }
        return <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{display}</span>;
      }
    },
    { 
      accessorKey: 'realisasi', 
      header: 'Realisasi',
      size: columnWidths.realisasi,
      meta: { align: 'right', headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => {
        const val = getValue();
        let display = '0';
        if (val !== null && val !== undefined && val !== '') {
          display = !isNaN(Number(val)) ? Number(val).toLocaleString('id-ID') : String(val);
        }
        return <span className={`font-semibold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-black'}`}>{display}</span>;
      }
    },
    {
      accessorKey: 'no_order_2',
      header: 'No. Order',
      size: columnWidths.no_order_2,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-bold transition-colors truncate ${row.getIsSelected() ? 'text-green-600' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'nama_order_2',
      header: 'Nama Order',
      size: columnWidths.nama_order_2,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'jenis_pekerjaan_2',
      header: 'Jenis Pekerjaan',
      size: columnWidths.jenis_pekerjaan_2,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue }: any) => (
        <span className="text-[12px] font-bold bg-sky-50 text-sky-700 px-3 py-1 border border-sky-100 rounded-lg block w-fit truncate tracking-tight">
          {String(getValue() || '-')}
        </span>
      )
    },
    {
      accessorKey: 'bahan_kertas',
      header: 'Bahan Kertas',
      size: columnWidths.bahan_kertas,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-medium tracking-tight ${row.getIsSelected() ? 'text-green-800' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'jml_plate',
      header: 'Jml. Plate',
      size: columnWidths.jml_plate,
      meta: { align: 'right', headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    {
      accessorKey: 'warna',
      header: 'Warna',
      size: columnWidths.warna,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-medium tracking-tight ${row.getIsSelected() ? 'text-green-800' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'inscheet',
      header: 'Inscheet',
      size: columnWidths.inscheet,
      meta: { align: 'right', headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    {
      accessorKey: 'rijek',
      header: 'Rijek',
      size: columnWidths.rijek,
      meta: { align: 'right', headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    {
      accessorKey: 'jam',
      header: 'Jam',
      size: columnWidths.jam,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'kendala',
      header: 'Kendala',
      size: columnWidths.kendala,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-medium truncate block ${row.getIsSelected() ? 'text-green-800' : 'text-gray-500'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'bagian',
      header: 'Bagian',
      size: columnWidths.bagian,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-medium truncate block tracking-tight ${row.getIsSelected() ? 'text-green-800' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    }
  ], [columnWidths, page]);

  const handleResize = useCallback((widths: any) => {
    setColumnWidths(widths);
    localStorage.setItem('jurnal_columnWidths_v2', JSON.stringify(widths));
  }, []);

  const handleSelection = useCallback((id: string | number, e?: React.MouseEvent) => {
    // Hanya proses seleksi baris jika ada modifier keys yang ditekan (Ctrl / Shift)
    const isCtrl = e?.ctrlKey || e?.metaKey;
    const isShift = e?.shiftKey;

    setSelectedIds(prev => {
        const next = new Set(prev);

        if (!isCtrl && !isShift) {
            // Klik biasa:
            // Jika baris tersebut sudah terpilih dan merupakan satu-satunya yang terpilih, maka batalkan pilihan.
            if (next.has(id) && next.size === 1) {
                next.clear();
            } else {
                // Jika tidak, bersihkan semua pilihan lalu pilih baris ini saja.
                next.clear();
                next.add(id);
            }
        } else if (isShift && lastSelectedId !== null && data) {
            const startIdx = data.findIndex(d => d.id === lastSelectedId);
            const endIdx = data.findIndex(d => d.id === id);
            
            if (startIdx !== -1 && endIdx !== -1) {
                const start = Math.min(startIdx, endIdx);
                const end = Math.max(startIdx, endIdx);
                
                if (!isCtrl) next.clear(); 
                
                for (let i = start; i <= end; i++) {
                    next.add(data[i].id);
                }
            }
        } else if (isCtrl) {
            if (next.has(id)) next.delete(id);
            else next.add(id);
        }
        
        setLastSelectedId(id);
        return next;
    });
  }, [data, lastSelectedId]);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
      {/* TABS Navigation */}
      <div className="flex gap-6 border-b border-gray-100 shrink-0 px-2 mt-1">
        <button 
          onClick={() => { setActiveTab('list'); cancelForm(); }} 
          className={`pb-3 px-2 text-[13px] font-bold border-b-2 transition-all ${activeTab === 'list' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Daftar Jurnal
        </button>
        <button 
          onClick={() => { if(activeTab !== 'form') startAdd(); }} 
          className={`pb-3 px-2 text-[13px] font-bold border-b-2 transition-all ${activeTab === 'form' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          {editingId ? 'Edit Jurnal' : 'Tambah Jurnal'}
        </button>
      </div>

      {/* TAB CONTENT: LIST */}
      <div className={`flex-1 flex flex-col gap-6 overflow-hidden ${activeTab === 'list' ? 'flex' : 'hidden'}`}>
        {/* Top Filter Bar */}
        <div className="flex gap-6 shrink-0 min-h-[105px]">
         <div className="flex-1 bg-white rounded-2xl border border-gray-100 px-6 py-4 shadow-sm shadow-green-900/5 flex flex-col justify-center relative z-50 overflow-visible h-full">
            <div className="flex items-center gap-6">
            {/* Rentang Tanggal */}
            <div className="flex flex-col">
               <span className="block text-[13px] font-semibold text-gray-500 mb-2 ml-1 tracking-tight select-none">Rentang Tanggal</span>
               <div className="flex items-center gap-3">
                  <div className="w-[150px] relative group"><DatePicker name="startDate" value={startDate} onChange={(d) => { setStartDate(d); setPage(1); }} /></div>
                  <div className="w-4 h-0.5 bg-gray-100 rounded-full"></div>
                  <div className="w-[150px] relative group"><DatePicker name="endDate" value={endDate} onChange={(d) => { setEndDate(d); setPage(1); }} popupAlign="right" /></div>
               </div>
            </div>

            {/* Bagian Filter */}
            <SearchableDropdown
              id="jurnal-bagian"
              label="Filter Bagian"
              value={bagianFilter}
              items={bagianOptions}
              allLabel="Semua Bagian"
              searchPlaceholder="Cari bagian..."
              panelWidth="w-[260px]"
              icon={<Filter size={16} className={bagianFilter ? 'text-green-600' : 'text-gray-400'} />}
              onChange={(val) => {
                setBagianFilter(val);
                setPage(1);
              }}
            />

            {/* Nama Karyawan Filter */}
            <SearchableDropdown
              id="jurnal-karyawan"
              label="Filter Karyawan"
              value={namaKaryawanFilter}
              items={namaOptions}
              allLabel="Semua Karyawan"
              searchPlaceholder="Cari karyawan..."
              panelWidth="w-[260px]"
              icon={<Filter size={16} className={namaKaryawanFilter ? 'text-green-600' : 'text-gray-400'} />}
              onChange={(val) => {
                setNamaKaryawanFilter(val);
                setPage(1);
              }}
            />

            {/* Reset Button */}
            <div className="flex flex-col">
              <span className="block text-[13px] font-semibold text-transparent mb-2 ml-1 tracking-tight select-none">Reset</span>
              <button
                onClick={() => {
                  handleResetFilter();
                  setSearchQuery('');
                }}
                className="h-11 px-6 bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-100 hover:border-rose-100 rounded-lg shadow-sm transition-all flex items-center gap-2.5 text-[12px] font-bold tracking-tight"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
            </div>
         </div>
        </div>
      <div className="flex-1 flex flex-col gap-3 overflow-hidden relative min-h-0">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-5">
               <div className="text-[14px] font-bold text-gray-800 flex items-center gap-3 leading-none tracking-tight">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
                    <ClipboardList size={16} />
                  </div>
                  <span>Jurnal Harian Produksi</span>
               </div>
               

               {/* Contextual Actions */}
               {selectedIds.size > 0 && (
                 <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[12px] font-bold rounded-lg border border-rose-200 transition-all ml-2 animate-in fade-in zoom-in duration-200">
                   <Trash2 size={14} /> Hapus {selectedIds.size} Terpilih
                 </button>
               )}
               {actionMessage && (
                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold animate-in fade-in slide-in-from-left-2 duration-300 ${actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                   {actionMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                   {actionMessage.text}
                 </div>
               )}
            </div>
            {loading && (data?.length || 0) > 0 && (
                <div className="text-[10px] font-bold text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm animate-pulse tracking-tight leading-none">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Memproses Data...</span>
                </div>
            )}
          </div>

          <SearchAndReload
            searchQuery={searchQuery}
            setSearchQuery={(v) => { setSearchQuery(v); setPage(1); }}
            onReload={() => setRefreshKey(k => k + 1)}
            loading={loading}
            placeholder="Cari karyawan, nomor order, atau nama pekerjaan..."
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-5 overflow-hidden relative">
           {error ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm shadow-green-900/5">
                <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm shadow-rose-900/5">
                    <AlertCircle className="text-rose-500" size={40} />
                </div>
                <p className="text-lg font-bold text-gray-800 uppercase tracking-tight mb-2">Gagal Memuat Data</p>
                <p className="text-sm text-gray-400 font-medium mb-8 max-w-md">{error}</p>
                <button
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="px-10 py-4 bg-green-600 text-white font-bold rounded-xl shadow-sm shadow-green-100 hover:bg-green-700 transition-all active:scale-95 uppercase tracking-widest text-[13px]"
                >
                  Coba Muat Ulang
                </button>
             </div>
           ) : (
             <>
               <DataTable
                 data={data || []}
                 columns={columns}
                 columnWidths={columnWidths}
                 onColumnWidthChange={handleResize}
                 isLoading={loading || data === null}
                 selectedIds={selectedIds}
                 onRowClick={handleSelection}
                 rowHeight="h-11"
               />
             </>
           )}
        </div>
        <TableFooter
          totalCount={totalCount}
          currentCount={data?.length || 0}
          label="baris data"
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          loadTime={loadTime}
          page={page}
          totalPages={Math.ceil(totalCount / PAGE_SIZE) || 1}
          onPageChange={setPage}
        />
      </div> {/* CLOSES Table Area */}
      </div> {/* CLOSES activeTab === 'list' */}

      {/* TAB CONTENT: FORM */}
      <div className={`flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-10 ${activeTab === 'form' ? 'flex' : 'hidden'}`}>
        {(isAdding || editingId !== null) && (
          <form onSubmit={(e) => { e.preventDefault(); saveForm(); }} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-in slide-in-from-top-4 fade-in duration-300">

            {/* Sub-tab: Target / Realisasi - hanya tampil jika punya akses keduanya */}
            {canInputTarget && canInputRealisasi && (
              <div className="flex gap-1 mb-6 bg-gray-50 p-1 rounded-xl w-fit border border-gray-100">
                <button
                  type="button"
                  onClick={() => setFormSubTab('target')}
                  className={`px-5 py-2 text-[12px] font-bold rounded-lg transition-all ${formSubTab === 'target' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🗓 Target / Penjadwalan
                </button>
                <button
                  type="button"
                  onClick={() => setFormSubTab('realisasi')}
                  className={`px-5 py-2 text-[12px] font-bold rounded-lg transition-all ${formSubTab === 'realisasi' ? 'bg-white text-sky-700 shadow-sm border border-sky-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  📋 Realisasi / Hasil Produksi
                </button>
              </div>
            )}

            {/* ---- SUB-TAB: TARGET ---- */}
            {formSubTab === 'target' && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="text-[13px] font-bold text-gray-700">Data Penjadwalan</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-[11px] font-semibold text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full">Jadwal Produksi</span>
                </div>
                {/* Grup 1: Tanggal */}
                <div className="mb-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Tanggal <span className="text-rose-400">*</span></label>
                      <DatePicker
                        name="tgl"
                        value={formData.tgl ? new Date(formData.tgl + 'T12:00:00') : null}
                        onChange={d => setFormData({...formData, tgl: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})}
                      />
                    </div>
                  </div>
                </div>

                {/* Grup 2: Shift, Bagian, Nama Karyawan, Posisi, Abs */}
                <div className="mb-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="text-[13px] font-bold text-gray-700">Karyawan</span>
                    <div className="flex-1 h-px bg-gray-100"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Shift <span className="text-rose-400">*</span></label>
                      <SearchableDropdown
                        id="form-shift"
                        value={formData.shift || ''}
                        items={['1 (07:00-15:00)', '2 (15:00-23:00)', '3 (23:00-07:00)']}
                        placeholder="-- Pilih Shift --"
                        allLabel="-- Pilih Shift --"
                        triggerWidth="w-full"
                        onChange={val => {
                          const shiftNum = val.split(' ')[0];
                          setFormData({...formData, shift: shiftNum});
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Bagian <span className="text-rose-400">*</span></label>
                      <SearchableDropdown
                        id="form-bagian"
                        value={formData.bagian || ''}
                        items={BAGIAN_LIST}
                        placeholder="-- Pilih Bagian --"
                        allLabel="-- Pilih Bagian --"
                        triggerWidth="w-full"
                        onChange={val => setFormData({...formData, bagian: val, jenis_pekerjaan: ''})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Nama Karyawan <span className="text-rose-400">*</span></label>
                      <SearchableDropdown
                        id="form-karyawan"
                        value={formData.nama_karyawan || ''}
                        items={employees.map(e => e.name)}
                        placeholder="-- Pilih Karyawan --"
                        allLabel="-- Pilih Karyawan --"
                        triggerWidth="w-full"
                        onChange={val => {
                          const emp = employees.find(x => x.name === val);
                          setFormData({...formData, nama_karyawan: val, posisi: emp?.position || '', absensi: emp?.employee_no || ''});
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Posisi <span className="text-[11px] font-normal text-gray-400">(otomatis)</span></label>
                      <input type="text" disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-500 outline-none cursor-not-allowed h-11" value={formData.posisi || ''} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Abs. <span className="text-[11px] font-normal text-gray-400">(otomatis)</span></label>
                      <input type="text" disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-500 outline-none cursor-not-allowed h-11" value={formData.absensi || ''} />
                    </div>
                  </div>
                </div>

                {/* Grup 3: No. Order, Nama Order, Jenis Pekerjaan */}
                <div className="mb-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="text-[13px] font-bold text-gray-700">Order &amp; Pekerjaan</span>
                    <div className="flex-1 h-px bg-gray-100"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">No. Order (PPIC)</label>
                      <SearchableDropdown
                        id="form-no-order"
                        value={formData.no_order ? `${formData.no_order}${sopdList.find(s => s.no_sopd === formData.no_order)?.nama_order ? ' — ' + sopdList.find(s => s.no_sopd === formData.no_order)?.nama_order : ''}` : ''}
                        items={sopdList.map(s => s.nama_order ? `${s.no_sopd} — ${s.nama_order}` : s.no_sopd)}
                        placeholder="-- Pilih No. Order --"
                        allLabel="-- Pilih No. Order --"
                        triggerWidth="w-full"
                        onChange={val => {
                          const noSopd = val.split(' — ')[0];
                          const sopd = sopdList.find(x => x.no_sopd === noSopd);
                          setFormData({...formData, no_order: noSopd, nama_order: sopd?.nama_order || ''});
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Jenis Pekerjaan</label>
                      <SearchableDropdown
                        id="form-jenis-pekerjaan"
                        value={formData.jenis_pekerjaan || ''}
                        items={jenisPekerjaanList}
                        placeholder={formData.bagian ? '-- Pilih Jenis Pekerjaan --' : '-- Pilih Bagian dulu --'}
                        allLabel={formData.bagian ? '-- Pilih Jenis Pekerjaan --' : '-- Pilih Bagian dulu --'}
                        triggerWidth="w-full"
                        onChange={val => setFormData({...formData, jenis_pekerjaan: val})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Target</label>
                      <input 
                        type="text" 
                        placeholder="0" 
                        className="w-full bg-yellow-50/50 border border-yellow-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 outline-none h-11" 
                        value={formData.target || ''} 
                        onChange={e => {
                          let val = e.target.value;
                          const clean = val.replace(/\./g, '');
                          if (/^\d+$/.test(clean)) {
                            const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                            setFormData({...formData, target: formatted});
                          } else {
                            setFormData({...formData, target: val});
                          }
                        }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Grup: Keterangan */}
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="text-[13px] font-bold text-gray-700">Lainnya</span>
                    <div className="flex-1 h-px bg-gray-100"></div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Keterangan</label>
                      <textarea 
                        placeholder="Keterangan tambahan..." 
                        rows={3}
                        className="w-full bg-yellow-50/50 border border-yellow-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 outline-none min-h-[80px] resize-none" 
                        value={formData.keterangan || ''} 
                        onChange={e => setFormData({...formData, keterangan: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---- SUB-TAB: REALISASI ---- */}
            {formSubTab === 'realisasi' && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="text-[13px] font-bold text-gray-700">Data Realisasi</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">Hasil Produksi</span>
                </div>

                {/* Data Target Terpilih */}
                {selectedTargetRow ? (
                  <div className="mb-6 p-4 bg-sky-50/50 border border-sky-200 rounded-xl">
                    <p className="text-[12px] font-bold text-sky-800 mb-3">Data Target yang sedang diisi Realisasinya:</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {[
                        { label: 'Tanggal', val: formatIndoDateStr(selectedTargetRow.tgl) },
                        { label: 'Shift', val: selectedTargetRow.shift },
                        { label: 'Karyawan', val: selectedTargetRow.nama_karyawan },
                        { label: 'Order', val: selectedTargetRow.no_order ? `${selectedTargetRow.no_order} — ${selectedTargetRow.nama_order || '-'}` : '' },
                        { label: 'Bagian', val: selectedTargetRow.bagian },
                      ].map(item => item.val ? (
                        <span key={item.label} className="text-[11px] font-bold bg-white text-sky-700 px-2.5 py-1 rounded-md border border-sky-100 shadow-sm">{item.label}: {item.val}</span>
                      ) : null)}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-sky-50 border border-sky-100 rounded-xl flex items-start gap-3">
                    <AlertCircle size={16} className="text-sky-600 shrink-0 mt-0.5" />
                    <p className="text-[12px] font-medium text-sky-800 leading-relaxed">
                      Anda sedang mengisi form Realisasi secara manual tanpa mengacu pada Data Target tertentu. Untuk mengisi Realisasi berdasarkan Target yang sudah ada, silakan kembali ke tab <b>Daftar Jurnal</b> dan klik tombol <b>Input Realisasi (+)</b> pada kolom Aksi di baris yang diinginkan.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

                  {/* No. Order 2 → SearchableDropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-600">No. Order</label>
                    <SearchableDropdown
                      id="form-no-order-2"
                      value={formData.no_order_2 ? `${formData.no_order_2}${sopdList.find(s => s.no_sopd === formData.no_order_2)?.nama_order ? ' — ' + sopdList.find(s => s.no_sopd === formData.no_order_2)?.nama_order : ''}` : ''}
                      items={sopdList.map(s => s.nama_order ? `${s.no_sopd} — ${s.nama_order}` : s.no_sopd)}
                      placeholder="-- Pilih No. Order --"
                      allLabel="-- Pilih No. Order --"
                      triggerWidth="w-full"
                      onChange={val => {
                        const noSopd = val.split(' — ')[0];
                        const sopd = sopdList.find(x => x.no_sopd === noSopd);
                        setFormData({...formData, no_order_2: noSopd, nama_order_2: sopd?.nama_order || ''});
                      }}
                    />
                  </div>


                  {/* Jenis Pekerjaan 2 → SearchableDropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-600">Jenis Pekerjaan</label>
                    <SearchableDropdown
                      id="form-jenis-pekerjaan-2"
                      value={formData.jenis_pekerjaan_2 || ''}
                      items={jenisPekerjaan2List}
                      placeholder="-- Pilih Jenis Pekerjaan --"
                      allLabel="-- Pilih Jenis Pekerjaan --"
                      triggerWidth="w-full"
                      onChange={val => setFormData({...formData, jenis_pekerjaan_2: val})}
                    />
                  </div>

                  {/* Bahan Kertas → kolom biru */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-600">Bahan Kertas</label>
                    <input type="text" placeholder="Jenis bahan kertas..." className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" value={formData.bahan_kertas || ''} onChange={e => setFormData({...formData, bahan_kertas: e.target.value})} />
                  </div>

                  {/* Jml. Plate */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-600">Jml. Plate</label>
                    <input type="number" min="0" placeholder="0" className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" value={formData.jml_plate || ''} onChange={e => setFormData({...formData, jml_plate: e.target.value})} />
                  </div>

                  {/* Warna */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-600">Warna</label>
                    <input type="text" placeholder="Warna cetak..." className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" value={formData.warna || ''} onChange={e => setFormData({...formData, warna: e.target.value})} />
                  </div>

                  {/* Inscheet */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-600">Inscheet</label>
                    <input type="number" min="0" placeholder="0" className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" value={formData.inscheet || ''} onChange={e => setFormData({...formData, inscheet: e.target.value})} />
                  </div>

                  {/* Rijek */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-600">Rijek</label>
                    <input type="number" min="0" placeholder="0" className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" value={formData.rijek || ''} onChange={e => setFormData({...formData, rijek: e.target.value})} />
                  </div>

                  {/* Jam → time picker, value awal dari shift */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-600">Jam Kerja</label>
                    <input type="text" placeholder="07:00 - 15:00" className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" value={formData.jam || ''} onChange={e => setFormData({...formData, jam: e.target.value})} />
                  </div>

                  {/* Kendala */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-bold text-gray-600">Kendala</label>
                    <textarea 
                      placeholder="Kendala yang ditemukan..." 
                      rows={3}
                      className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none min-h-[80px] resize-none" 
                      value={formData.kendala || ''} 
                      onChange={e => setFormData({...formData, kendala: e.target.value})} 
                    />
                  </div>

                  {/* Realisasi */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-600">Realisasi <span className="text-rose-400">*</span></label>
                    <input 
                      type="text" 
                      placeholder="0" 
                      className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" 
                      value={formData.realisasi || ''} 
                      onChange={e => {
                        let val = e.target.value;
                        const clean = val.replace(/\./g, '');
                        if (/^\d+$/.test(clean)) {
                          const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                          setFormData({...formData, realisasi: formatted});
                        } else {
                          setFormData({...formData, realisasi: val});
                        }
                      }} 
                    />
                  </div>

                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-between items-center gap-3 pt-5 mt-5 border-t border-gray-100">
              <div className="flex gap-2">
                {formSubTab === 'target' && canInputRealisasi && (
                  <button type="button" onClick={() => setFormSubTab('realisasi')} className="px-4 py-2 text-[12px] font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-all">
                    Lanjut ke Realisasi →
                  </button>
                )}
                {formSubTab === 'realisasi' && canInputTarget && (
                  <button type="button" onClick={() => setFormSubTab('target')} className="px-4 py-2 text-[12px] font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all">
                    ← Kembali ke Target
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={cancelForm} className="px-5 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">Batal</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2.5 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2">
                  {isSaving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan Data</>}
                </button>
              </div>
            </div>

          </form>
        )}
      </div> {/* CLOSES activeTab === 'form' */}

    </div>
  );
}

