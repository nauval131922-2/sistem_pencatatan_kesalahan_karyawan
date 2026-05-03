'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, ClipboardList, RotateCcw, Filter, Plus, Trash2, Edit2, Save, X, CheckCircle2 } from 'lucide-react';
import SearchableDropdown from '@/components/SearchableDropdown';
import SearchAndReload from '@/components/SearchAndReload';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/DataTable';
import TableFooter from '@/components/TableFooter';
import DatePicker from '@/components/DatePicker';

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

export default function JurnalClient() {
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
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

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
    setIsAdding(true);
    setEditingId(null);
    setFormData({ tgl: new Date().toISOString().split('T')[0] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const startEdit = useCallback((row: any) => {
    setActiveTab('form');
    setIsAdding(false);
    setEditingId(row.id);
    const formattedData = { ...row };
    if (formattedData.tgl && formattedData.tgl.includes('T')) {
      formattedData.tgl = formattedData.tgl.split('T')[0];
    }
    setFormData(formattedData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const cancelForm = useCallback(() => {
    setActiveTab('list');
    setIsAdding(false);
    setEditingId(null);
    setFormData({});
  }, []);

  const saveForm = async () => {
    setIsSaving(true);
    try {
      const isEdit = editingId !== null;
      const method = isEdit ? 'PUT' : 'POST';
      const payload = isEdit ? { id: editingId, ...formData } : { action: 'insert_single', data: formData };
      
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
      size: 80,
      meta: { align: 'center', headerBg: '#f8fafc' },
      cell: ({ row }: any) => (
        <div className="flex items-center justify-center gap-2">
           <button onClick={(e) => { e.stopPropagation(); startEdit(row.original); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={14} /></button>
           <button onClick={(e) => { e.stopPropagation(); handleDelete(row.original.id); }} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash2 size={14} /></button>
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
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    { 
      accessorKey: 'realisasi', 
      header: 'Realisasi',
      size: columnWidths.realisasi,
      meta: { align: 'right', headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-semibold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-black'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
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
                  <div className="w-[150px] relative group"><DatePicker name="endDate" value={endDate} onChange={(d) => { setEndDate(d); setPage(1); }} /></div>
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
      <div className={`flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-10 ${activeTab === 'form' ? 'flex' : 'hidden'}`}>
        {(isAdding || editingId !== null) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-in slide-in-from-top-4 fade-in duration-300">
            {/* Bagian Penjadwalan */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-emerald-100">
                <div className="w-2.5 h-5 rounded-sm bg-gradient-to-b from-emerald-400 to-yellow-300 shadow-sm"></div>
                <h4 className="text-[12px] font-bold text-gray-700 uppercase tracking-widest">Bagian Penjadwalan</h4>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md ml-2">Kolom Hijau & Kuning</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">Tanggal</label>
                  <input type="date" className="w-full bg-emerald-50/30 border border-emerald-100 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" value={formData.tgl || ''} onChange={e => setFormData({...formData, tgl: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">Shift</label>
                  <input type="text" placeholder="Shift 1/2" className="w-full bg-yellow-50/30 border border-yellow-100 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all" value={formData.shift || ''} onChange={e => setFormData({...formData, shift: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">Karyawan</label>
                  <select className="w-full bg-emerald-50/30 border border-emerald-100 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" value={formData.nama_karyawan || ''} onChange={e => setFormData({...formData, nama_karyawan: e.target.value})}>
                    <option value="">-- Pilih Karyawan --</option>
                    {Array.from(new Set(allNamaOptions.map(k => k.nama))).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">Bagian</label>
                  <select className="w-full bg-emerald-50/30 border border-emerald-100 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" value={formData.bagian || ''} onChange={e => setFormData({...formData, bagian: e.target.value})}>
                    <option value="">-- Pilih Bagian --</option>
                    {bagianOptions.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">Posisi</label>
                  <input type="text" placeholder="Operator / Helper" className="w-full bg-emerald-50/30 border border-emerald-100 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" value={formData.posisi || ''} onChange={e => setFormData({...formData, posisi: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">No Order 1</label>
                  <input type="text" placeholder="No Order" className="w-full bg-yellow-50/30 border border-yellow-100 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none" value={formData.no_order || ''} onChange={e => setFormData({...formData, no_order: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">Nama Order 1</label>
                  <input type="text" placeholder="Nama Order" className="w-full bg-yellow-50/30 border border-yellow-100 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none" value={formData.nama_order || ''} onChange={e => setFormData({...formData, nama_order: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">Jenis Pekerjaan 1</label>
                  <input type="text" placeholder="Jenis Pekerjaan" className="w-full bg-yellow-50/30 border border-yellow-100 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none" value={formData.jenis_pekerjaan || ''} onChange={e => setFormData({...formData, jenis_pekerjaan: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">Keterangan</label>
                  <input type="text" placeholder="Keterangan" className="w-full bg-yellow-50/30 border border-yellow-100 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none" value={formData.keterangan || ''} onChange={e => setFormData({...formData, keterangan: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">Target</label>
                  <input type="number" placeholder="0" className="w-full bg-yellow-50/30 border border-yellow-100 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none" value={formData.target || ''} onChange={e => setFormData({...formData, target: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Bagian Hasil Produksi */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-sky-100">
                <div className="w-2.5 h-5 rounded-sm bg-sky-400 shadow-sm"></div>
                <h4 className="text-[12px] font-bold text-gray-700 uppercase tracking-widest">Bagian Hasil Produksi</h4>
                <span className="text-[11px] font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md ml-2">Kolom Biru</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">Realisasi</label>
                  <input type="number" placeholder="0" className="w-full bg-sky-50/30 border border-sky-100 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" value={formData.realisasi || ''} onChange={e => setFormData({...formData, realisasi: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">Rijek</label>
                  <input type="number" placeholder="0" className="w-full bg-sky-50/30 border border-sky-100 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" value={formData.rijek || ''} onChange={e => setFormData({...formData, rijek: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={cancelForm} className="px-5 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">Batal</button>
              <button onClick={saveForm} disabled={isSaving} className="px-5 py-2.5 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2">
                {isSaving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan Data</>}
              </button>
            </div>
          </div>
        )}
      </div> {/* CLOSES activeTab === 'form' */}

    </div>
  );
}



