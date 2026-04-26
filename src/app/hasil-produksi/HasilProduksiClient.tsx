'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BarChart3, Construction, Search, ChevronDown, Filter, RotateCcw, ClipboardList, TrendingUp, CheckCircle, X, Target, Box, AlertCircle, Package } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import DatePicker from '@/components/DatePicker';

interface SopdOption {
  no_sopd: string;
  nama_order: string;
  qty: number;
  unit: string;
  pelanggan: string;
}

// Helper to format date strings to DD MMM YYYY (Indonesian)
const formatToDayMonthYear = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    let date: Date;
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
      // YYYY-MM-DD (ISO style from Jurnal)
      date = new Date(dateStr);
    } else if (dateStr.includes('-')) {
      // DD-MM-YYYY (from Gudang)
      const [d, m, y] = dateStr.split('-');
      date = new Date(`${y}-${m}-${d}`);
    } else {
      return dateStr;
    }
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

export default function HasilProduksiClient() {
  const [sopdOptions, setSopdOptions] = useState<SopdOption[]>([]);
  const [selectedSopd, setSelectedSopd] = useState<SopdOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSopd, setLoadingSopd] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Load persisted dates
    const savedStart = localStorage.getItem('hasil_startDate');
    if (savedStart) {
      const d = new Date(savedStart);
      if (!isNaN(d.getTime())) setStartDate(d);
    }
    
    const savedEnd = localStorage.getItem('hasil_endDate');
    const lastVisit = localStorage.getItem('hasil_lastVisitDate');
    const todayStr = today.toDateString();

    localStorage.setItem('hasil_lastVisitDate', todayStr);
    const isNewDay = lastVisit !== todayStr;

    if (savedEnd && !isNewDay) {
      const d = new Date(savedEnd);
      if (!isNaN(d.getTime())) setEndDate(d);
      else { setEndDate(today); localStorage.setItem('hasil_endDate', today.toISOString()); }
    } else {
      setEndDate(today);
      localStorage.setItem('hasil_endDate', today.toISOString());
    }

    // Load persisted SOPd
    const savedSopd = localStorage.getItem('hasil_selectedSopd');
    if (savedSopd) {
      try {
        const parsed = JSON.parse(savedSopd);
        if (parsed && parsed.no_sopd) {
          setSelectedSopd(parsed);
        }
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (startDate) localStorage.setItem('hasil_startDate', startDate.toISOString());
    else localStorage.removeItem('hasil_startDate');
  }, [startDate, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (endDate) localStorage.setItem('hasil_endDate', endDate.toISOString());
    else localStorage.removeItem('hasil_endDate');
  }, [endDate, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (selectedSopd) localStorage.setItem('hasil_selectedSopd', JSON.stringify(selectedSopd));
    else localStorage.removeItem('hasil_selectedSopd');
  }, [selectedSopd, isMounted]);
  
  const [results, setResults] = useState<any[]>([]);
  const [jurnalResults, setJurnalResults] = useState<any[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [grandTotalJurnal, setGrandTotalJurnal] = useState(0);
  const [grandTotalRijek, setGrandTotalRijek] = useState(0);
  const [unit, setUnit] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'barang_jadi' | 'jurnal'>('jurnal');
  const [selectedBagian, setSelectedBagian] = useState('');
  const [selectedPekerjaan, setSelectedPekerjaan] = useState('');
  const [availableBagian, setAvailableBagian] = useState<string[]>([]);
  const [availablePekerjaan, setAvailablePekerjaan] = useState<string[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [hideGudang, setHideGudang] = useState(false);
  const [hideJurnal, setHideJurnal] = useState(false);
  const [jurnalDisplayLimit, setJurnalDisplayLimit] = useState(50);
  
  // Custom dropdown states
  const [isBagianDropdownOpen, setIsBagianDropdownOpen] = useState(false);
  const [isPekerjaanDropdownOpen, setIsPekerjaanDropdownOpen] = useState(false);
  const [bagianSearchQuery, setBagianSearchQuery] = useState('');
  const [pekerjaanSearchQuery, setPekerjaanSearchQuery] = useState('');
  
  // Keyboard navigation states
  const [focusedSopdIndex, setFocusedSopdIndex] = useState(-1);
  const [focusedBagianIndex, setFocusedBagianIndex] = useState(-1);
  const [focusedPekerjaanIndex, setFocusedPekerjaanIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchSopd() {
      setLoadingSopd(true);
      try {
        const url = new URL('/api/sopd/options', window.location.origin);
        if (debouncedSearchQuery) url.searchParams.set('search', debouncedSearchQuery);
        url.searchParams.set('limit', '50');
        
        const res = await fetch(url.toString());
        if (res.ok) {
          const json = await res.json();
          setSopdOptions(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch SOPd options", err);
      } finally {
        setLoadingSopd(false);
      }
    }
    fetchSopd();
  }, [debouncedSearchQuery]);

  // Memoized filtered lists for consistent indexing
  const filteredSopd = useMemo(() => {
    return sopdOptions.filter(opt => 
      (opt.no_sopd?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (opt.pelanggan?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (opt.nama_order?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ).slice(0, 50);
  }, [sopdOptions, searchQuery]);

  const filteredBagian = useMemo(() => {
    return ['', ...availableBagian].filter(c => (c?.toLowerCase() || '').includes(bagianSearchQuery.toLowerCase()));
  }, [availableBagian, bagianSearchQuery]);

  const filteredPekerjaan = useMemo(() => {
    return ['', ...availablePekerjaan].filter(c => (c?.toLowerCase() || '').includes(pekerjaanSearchQuery.toLowerCase()));
  }, [availablePekerjaan, pekerjaanSearchQuery]);

  // Reset indices when search or open state changes
  useEffect(() => { setFocusedSopdIndex(-1); }, [searchQuery, isDropdownOpen]);
  useEffect(() => { setFocusedBagianIndex(-1); }, [bagianSearchQuery, isBagianDropdownOpen]);
  useEffect(() => { setFocusedPekerjaanIndex(-1); }, [pekerjaanSearchQuery, isPekerjaanDropdownOpen]);

  const fetchDetails = async () => {
    if (!selectedSopd) {
      setResults([]);
      setJurnalResults([]);
      setGrandTotal(0);
      setGrandTotalJurnal(0);
      return;
    }

    setLoadingDetails(true);
    try {
      const fmtDate = (d: Date | null) => {
         if (!d) return '';
         const y = d.getFullYear();
         const m = String(d.getMonth() + 1).padStart(2, '0');
         const day = String(d.getDate()).padStart(2, '0');
         return `${y}-${m}-${day}`;
      };

      const url = `/api/hasil-produksi/details?no_sopd=${encodeURIComponent(selectedSopd.no_sopd)}&startDate=${fmtDate(startDate)}&endDate=${fmtDate(endDate)}&bagian=${encodeURIComponent(selectedBagian)}&pekerjaan=${encodeURIComponent(selectedPekerjaan)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setResults(json.barang_jadi || []);
        setJurnalResults(json.jurnal || []);
        setJurnalDisplayLimit(50); // Reset limit on fetch
        setGrandTotal(json.grandTotal || 0);
        setGrandTotalJurnal(json.grandTotalRealisasi || 0);
        setGrandTotalRijek(json.grandTotalRijek || 0);
        setUnit(json.unit || selectedSopd.unit || '');
        setAvailableBagian(json.availableBagian || []);
        setAvailablePekerjaan(json.availablePekerjaan || []);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Reset pekerjaan when bagian or SOPd changes
  useEffect(() => {
    setSelectedPekerjaan('');
  }, [selectedBagian, selectedSopd]);

  useEffect(() => {
    fetchDetails();
  }, [selectedSopd, startDate, endDate, selectedBagian, selectedPekerjaan]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const dataMap: Record<string, { date: string, displayDate: string, gudang: number, jurnal: number }> = {};
    
    // Process Gudang (DD-MM-YYYY)
    results.forEach(group => {
      const parts = group.date.split('-');
      const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      if (!dataMap[isoDate]) {
        dataMap[isoDate] = { 
          date: isoDate, 
          displayDate: formatToDayMonthYear(group.date), 
          gudang: 0, 
          jurnal: 0 
        };
      }
      dataMap[isoDate].gudang += group.total;
    });

    // Process Jurnal (YYYY-MM-DD)
    jurnalResults.forEach(group => {
      const isoDate = group.date;
      if (!dataMap[isoDate]) {
        dataMap[isoDate] = { 
          date: isoDate, 
          displayDate: formatToDayMonthYear(isoDate), 
          gudang: 0, 
          jurnal: 0 
        };
      }
      
      // Only total up if Pekerjaan is selected for accuracy (to avoid mixing different units/metrics)
      if (selectedPekerjaan) {
        dataMap[isoDate].jurnal += group.totalRealisasi;
      }
    });

    return Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [results, jurnalResults, selectedBagian, selectedPekerjaan]);

  // Memoize operator stats
  const operatorStats = React.useMemo(() => {
    if (!jurnalResults || jurnalResults.length === 0) return [];
    const stats: Record<string, number> = {};
    jurnalResults.forEach(group => {
      group.items.forEach((item: any) => {
        const name = item.nama_karyawan || '';
        stats[name] = (stats[name] || 0) + Number(item.realisasi || 0);
      });
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [jurnalResults]);

  // Memoize the Jurnal Table Rows to prevent heavy re-renders
  const memoizedJurnalRows = React.useMemo(() => {
    if (loadingDetails) {
      return (
        [...Array(8)].map((_, i) => (
          <tr key={i} className="animate-pulse">
            <td className="px-4 py-5"><div className="h-3 w-20 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-4 w-32 bg-gray-50 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-24 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-4 w-16 bg-gray-50 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-20 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-12 bg-gray-50 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-12 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-12 bg-gray-50 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-12 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-12 bg-gray-50 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-20 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-20 bg-gray-50 rounded-full"></div></td>
            <td className="px-4 py-5 text-right"><div className="h-5 w-16 bg-emerald-100/50 rounded-lg ml-auto"></div></td>
          </tr>
        ))
      );
    }

    if (!jurnalResults || jurnalResults.length === 0) {
      return (
        <tr>
          <td colSpan={14} className="px-6 py-20 text-center">
            <div className="flex flex-col items-center gap-3 opacity-30">
              <ClipboardList size={40} />
              <span className="text-sm font-semibold tracking-wide">Belum ada laporan operator</span>
            </div>
          </td>
        </tr>
      );
    }

    let currentItemCount = 0;
    const renderedGroups = [];

    for (let gIdx = 0; gIdx < jurnalResults.length; gIdx++) {
      const group = jurnalResults[gIdx];
      if (currentItemCount >= jurnalDisplayLimit) break;

      const itemsToRender = group.items.slice(0, jurnalDisplayLimit - currentItemCount);
      currentItemCount += itemsToRender.length;
      
      const isGroupComplete = itemsToRender.length === group.items.length;
      const allJobsSame = group.items.length > 0 && group.items.every((it: any) => it.jenis_pekerjaan_2 === group.items[0].jenis_pekerjaan_2);

      renderedGroups.push(
        <React.Fragment key={group.date}>
          {itemsToRender.map((item: any, iIdx: number) => (
            <tr key={`${gIdx}-${iIdx}`} className="bg-white hover:bg-emerald-50/30 even:bg-gray-50/50 transition-colors group cursor-default">
              <td className="px-4 py-4 text-[13px] font-bold border-r border-gray-100 tabular-nums text-gray-800">
                {iIdx === 0 ? formatToDayMonthYear(group.date) : ''}
              </td>
              <td className="px-4 py-4 border-r border-gray-100">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">{item.bagian}</span>
                  <span className="text-[12px] font-bold text-gray-800 leading-tight whitespace-nowrap">{item.nama_karyawan}</span>
                </div>
              </td>
              <td className="px-4 py-4 border-r border-gray-100 bg-blue-50/20 max-w-[200px]">
                <div className="flex flex-col truncate">
                  <span className="text-[10px] font-bold text-gray-400 leading-none mb-1 truncate" title={item.no_order_2 || '-'}>{item.no_order_2 || '-'}</span>
                  <span className="text-[12px] font-bold text-gray-700 leading-tight truncate" title={item.nama_order_2 || '-'}>{item.nama_order_2 || '-'}</span>
                </div>
              </td>
              <td className="px-4 py-4 text-[12px] border-r border-gray-100 bg-blue-50/20 whitespace-nowrap">
                <span className="font-bold bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm text-gray-700 capitalize">
                  {(item.jenis_pekerjaan_2 || '-').toLowerCase()}
                </span>
              </td>
              <td className="px-4 py-4 text-[11px] font-bold border-r border-gray-100 bg-blue-50/20 truncate max-w-[120px] text-gray-600">
                {item.bahan_kertas || '-'}
              </td>
              <td className="px-4 py-4 text-[12px] font-bold border-r border-gray-100 bg-blue-50/20 text-right tabular-nums text-gray-700">
                {Number(item.jml_plate || 0).toLocaleString('id-ID')}
              </td>
              <td className="px-4 py-4 text-[11px] font-bold border-r border-gray-100 bg-blue-50/20 truncate max-w-[100px] text-gray-600">
                {item.warna || '-'}
              </td>
              <td className="px-4 py-4 text-[12px] font-bold border-r border-gray-100 bg-blue-50/20 text-right tabular-nums text-gray-700">
                {Number(item.inscheet || 0).toLocaleString('id-ID')}
              </td>
              <td className="px-4 py-4 text-[12px] font-bold border-r border-gray-100 bg-blue-50/20 text-right tabular-nums text-rose-600">
                {Number(item.rijek || 0).toLocaleString('id-ID')}
              </td>
              <td className="px-4 py-4 text-[12px] font-bold border-r border-gray-100 bg-blue-50/20 whitespace-nowrap text-gray-700">
                {item.jam || '-'}
              </td>
              <td className="px-4 py-4 text-[11px] font-bold border-r border-gray-100 bg-blue-50/20 truncate max-w-[120px] text-rose-600 italic">
                {item.kendala || '-'}
              </td>
              <td className="px-4 py-4 text-[11px] font-bold border-r border-gray-100 text-gray-500 italic max-w-[120px] truncate">
                {item.keterangan || '-'}
              </td>
              <td className="px-4 py-4 text-[15px] font-semibold text-right tabular-nums bg-emerald-50 text-emerald-900 border-b border-white">
                {Number(item.realisasi).toLocaleString('id-ID')}
              </td>
            </tr>
          ))}
          {isGroupComplete && group.items.length > 1 && allJobsSame && (
            <tr className="bg-emerald-50/50 border-t border-emerald-100">
              <td colSpan={8} className="px-4 py-3 text-right text-[12px] font-bold tracking-wide text-emerald-800 border-r border-emerald-100">
                Total Harian {formatToDayMonthYear(group.date)}
              </td>
              <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums text-rose-600 bg-rose-50/30 border-r border-emerald-100">
                {group.totalRijek.toLocaleString('id-ID')}
              </td>
              <td colSpan={3} className="px-4 py-3 border-r border-emerald-100"></td>
              <td className="px-4 py-3 text-right text-[14px] font-bold tabular-nums text-emerald-900 bg-emerald-100/50">
                 {group.totalRealisasi.toLocaleString('id-ID')}
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    }

    const totalItems = jurnalResults.reduce((acc, g) => acc + g.items.length, 0);
    if (currentItemCount < totalItems) {
      renderedGroups.push(
        <tr key="load-more">
          <td colSpan={14} className="p-10 bg-gray-50/30 text-center">
            <button
              onClick={() => setJurnalDisplayLimit(prev => prev + 50)}
              className="px-10 h-12 bg-white border border-gray-200 text-[12px] font-bold text-gray-600 rounded-lg hover:bg-gray-50 transition-all shadow-sm shadow-green-900/5 inline-flex items-center gap-3"
            >
              <span>Muat Lebih Banyak Data</span>
              <span className="text-gray-400 font-medium">({totalItems - currentItemCount} baris lagi)</span>
            </button>
          </td>
        </tr>
      );
    }

    return renderedGroups;
  }, [jurnalResults, loadingDetails, jurnalDisplayLimit]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (!target.closest('.bagian-dropdown-container')) setIsBagianDropdownOpen(false);
      if (!target.closest('.pekerjaan-dropdown-container')) setIsPekerjaanDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 animate-in fade-in duration-500 overflow-hidden">
      {/* 1. Header Section - Fixed */}
      <div className="flex flex-col gap-8 shrink-0">
        {/* 1. Filter Control Center */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col lg:flex-row items-stretch lg:items-center gap-8 relative z-[60]">
          {/* Left side: SOPd Selection Group */}
          <div className="flex-1 min-w-0">
            <label className="block text-[13px] font-semibold text-gray-500 mb-2 ml-1 tracking-tight select-none">
              Pilih Order Produksi (SOPd)
            </label>
            <div className="relative sopd-dropdown-container" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className={`w-full h-12 px-5 bg-gray-50/50 border rounded-xl transition-all flex items-center justify-between group ${
                  selectedSopd 
                  ? 'border-emerald-100 bg-emerald-50/20' 
                  : 'border-gray-100 hover:border-emerald-500'
                }`}
              >
                {selectedSopd ? (
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <ClipboardList size={16} />
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-[11px] font-semibold text-emerald-700 leading-none mb-1">{selectedSopd.no_sopd}</span>
                      <span className="text-[13px] font-semibold text-gray-800 truncate tracking-tight">{selectedSopd.pelanggan} — {selectedSopd.nama_order}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-400">
                    <Search size={18} className="group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[13px] font-bold">Cari nomor SOPd atau pelanggan...</span>
                  </div>
                )}
                <ChevronDown size={18} className={`text-gray-300 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-[70] animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[450px]">
                  <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                    <div className="relative">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Ketik nomor SOPd, pelanggan, atau nama order..."
                        className="w-full h-11 pl-12 pr-4 bg-white border border-gray-100 rounded-xl text-[13px] font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-gray-300"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setFocusedSopdIndex(prev => (prev < filteredSopd.length - 1 ? prev + 1 : prev));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setFocusedSopdIndex(prev => (prev > 0 ? prev - 1 : prev));
                          } else if (e.key === 'Enter' && focusedSopdIndex >= 0) {
                            e.preventDefault();
                            const opt = filteredSopd[focusedSopdIndex];
                            setSelectedSopd(opt);
                            setIsDropdownOpen(false);
                            setSearchQuery('');
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-[100px]">
                    {loadingSopd ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-40">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-semibold uppercase tracking-wide">Mencari Data...</span>
                      </div>
                    ) : (
                      <>
                        {filteredSopd.length > 0 ? filteredSopd.map((opt, idx) => (
                      <button
                        key={opt.no_sopd}
                        ref={focusedSopdIndex === idx ? (el) => { if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } : null}
                        onClick={() => {
                          setSelectedSopd(opt);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl transition-all mb-1 group ${
                          selectedSopd?.no_sopd === opt.no_sopd 
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' 
                          : focusedSopdIndex === idx ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200' : 'hover:bg-emerald-50'
                        }`}
                      >
                        <div className="flex flex-col items-start min-w-0">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${selectedSopd?.no_sopd === opt.no_sopd ? 'text-emerald-100' : 'text-emerald-600'}`}>
                            {opt.no_sopd}
                          </span>
                          <span className={`text-[13px] font-semibold truncate max-w-full ${selectedSopd?.no_sopd === opt.no_sopd ? 'text-white' : 'text-gray-800'}`}>
                            {opt.pelanggan} — {opt.nama_order}
                          </span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-tighter ${selectedSopd?.no_sopd === opt.no_sopd ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {opt.qty?.toLocaleString('id-ID')} {opt.unit}
                        </div>
                      </button>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-30 text-center px-6">
                            <AlertCircle size={24} />
                            <span className="text-[11px] font-semibold uppercase tracking-wide leading-relaxed">Data tidak ditemukan untuk kata kunci ini</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block w-px h-12 bg-gray-100"></div>

          {/* Right side: Secondary Filters */}
          <div className="flex flex-wrap lg:flex-nowrap items-end gap-5">
            {/* Date Group - always visible */}
            <div className="flex flex-col">
              <label className="block text-[13px] font-semibold text-gray-500 mb-2 ml-1 tracking-tight select-none">Rentang Tanggal</label>
              <div className="flex items-center gap-2">
                <div className="w-[170px]"><DatePicker name="startDate" value={startDate} onChange={(d) => setStartDate(d)} /></div>
                <div className="w-4 h-px bg-gray-200"></div>
                <div className="w-[170px]"><DatePicker name="endDate" value={endDate} onChange={(d) => setEndDate(d)} popupAlign="right" /></div>
              </div>
            </div>

            {/* Bagian & Pekerjaan - only on Jurnal tab */}
            {activeTab === 'jurnal' && (
              <>
                <div className="w-px h-8 bg-gray-100 hidden xl:block"></div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col min-w-[160px]">
                    <label className="block text-[13px] font-semibold text-gray-500 mb-2 ml-1 tracking-tight select-none">Bagian</label>
                    <div className="relative bagian-dropdown-container">
                      <button onClick={() => setIsBagianDropdownOpen(!isBagianDropdownOpen)}
                        className="w-full h-11 px-4 bg-gray-50/50 border border-gray-100 rounded-xl text-[12px] font-semibold text-gray-700 flex items-center justify-between hover:border-emerald-500 transition-all">
                        <span className="truncate">{selectedBagian || 'Semua Bagian'}</span>
                        <ChevronDown size={14} className={`text-gray-300 transition-transform ${isBagianDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isBagianDropdownOpen && (
                        <div className="absolute top-[calc(100%+8px)] left-0 w-[250px] bg-white border border-gray-100 rounded-2xl shadow-xl py-3 z-[100] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[350px]">
                          <div className="px-3 pb-2 mb-2 border-b border-gray-50">
                            <input type="text" autoFocus placeholder="Cari..." className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs font-bold outline-none" 
                              value={bagianSearchQuery} 
                              onChange={(e) => setBagianSearchQuery(e.target.value)} 
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setFocusedBagianIndex(prev => (prev < filteredBagian.length - 1 ? prev + 1 : prev));
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setFocusedBagianIndex(prev => (prev > 0 ? prev - 1 : prev));
                                } else if (e.key === 'Enter' && focusedBagianIndex >= 0) {
                                  e.preventDefault();
                                  setSelectedBagian(filteredBagian[focusedBagianIndex]);
                                  setIsBagianDropdownOpen(false);
                                }
                              }}
                            />
                          </div>
                          <div className="overflow-y-auto px-2 custom-scrollbar">
                            {filteredBagian.length > 0 ? filteredBagian.map((cat, idx) => (
                              <button key={cat} 
                                ref={focusedBagianIndex === idx ? (el) => { if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } : null}
                                onClick={() => { setSelectedBagian(cat); setIsBagianDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-xs font-bold rounded-lg mb-1 tracking-tight ${selectedBagian === cat ? 'bg-emerald-600 text-white' : focusedBagianIndex === idx ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'text-gray-600 hover:bg-emerald-50'}`}>
                                {cat || 'Semua Bagian'}
                              </button>
                            )) : (
                              <div className="py-8 text-center opacity-30">
                                <span className="text-[10px] font-semibold uppercase tracking-wide">Tidak ada hasil</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col min-w-[160px]">
                    <label className="block text-[13px] font-semibold text-gray-500 mb-2 ml-1 tracking-tight select-none">Pekerjaan</label>
                    <div className="relative pekerjaan-dropdown-container">
                      <button onClick={() => setIsPekerjaanDropdownOpen(!isPekerjaanDropdownOpen)}
                        className="w-full h-11 px-4 bg-gray-50/50 border border-gray-100 rounded-xl text-[12px] font-semibold text-gray-700 flex items-center justify-between hover:border-emerald-500 transition-all">
                        <span className="truncate">{selectedPekerjaan || 'Semua Pekerjaan'}</span>
                        <ChevronDown size={14} className={`text-gray-300 transition-transform ${isPekerjaanDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isPekerjaanDropdownOpen && (
                        <div className="absolute top-[calc(100%+8px)] right-0 w-[280px] bg-white border border-gray-100 rounded-2xl shadow-xl py-3 z-[100] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[350px]">
                          <div className="px-3 pb-2 mb-2 border-b border-gray-50">
                            <input type="text" autoFocus placeholder="Cari..." className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs font-bold outline-none" 
                              value={pekerjaanSearchQuery} 
                              onChange={(e) => setPekerjaanSearchQuery(e.target.value)} 
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setFocusedPekerjaanIndex(prev => (prev < filteredPekerjaan.length - 1 ? prev + 1 : prev));
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setFocusedPekerjaanIndex(prev => (prev > 0 ? prev - 1 : prev));
                                } else if (e.key === 'Enter' && focusedPekerjaanIndex >= 0) {
                                  e.preventDefault();
                                  setSelectedPekerjaan(filteredPekerjaan[focusedPekerjaanIndex]);
                                  setIsPekerjaanDropdownOpen(false);
                                }
                              }}
                            />
                          </div>
                          <div className="overflow-y-auto px-2 custom-scrollbar">
                            {filteredPekerjaan.length > 0 ? filteredPekerjaan.map((cat, idx) => (
                              <button key={cat} 
                                ref={focusedPekerjaanIndex === idx ? (el) => { if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } : null}
                                onClick={() => { setSelectedPekerjaan(cat); setIsPekerjaanDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-xs font-bold rounded-lg mb-1 tracking-tight ${selectedPekerjaan === cat ? 'bg-emerald-600 text-white' : focusedPekerjaanIndex === idx ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'text-gray-600 hover:bg-emerald-50'}`}>
                                {cat || 'Semua Pekerjaan'}
                              </button>
                            )) : (
                              <div className="py-8 text-center opacity-30">
                                <span className="text-[10px] font-semibold uppercase tracking-wide">Tidak ada hasil</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Refresh Button */}
            <button
              onClick={() => fetchDetails()}
              className="h-11 w-11 flex items-center justify-center shrink-0 bg-white text-gray-500 border border-gray-200 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all group shadow-sm"
              title="Refresh Data"
            >
              <RotateCcw size={18} className={`group-hover:rotate-[-180deg] transition-transform duration-500 ${loadingDetails ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        </div>


        {/* Unified Dashboard Control Bar - Split into 3 Cards */}
        {selectedSopd && (
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4 animate-in fade-in duration-300 mt-6">
            {/* Card 1: Target & Sisa */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-6 py-3.5 flex items-center gap-10 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold text-gray-400 capitalize tracking-tight">Target</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-semibold text-gray-800 tabular-nums">{selectedSopd.qty.toLocaleString('id-ID')}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{selectedSopd.unit}</span>
                </div>
              </div>

              <div className="w-px h-6 bg-gray-100"></div>

              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold text-gray-400 capitalize tracking-tight">Sisa</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-semibold text-rose-600 tabular-nums">{(selectedSopd.qty - grandTotal).toLocaleString('id-ID')}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{selectedSopd.unit}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Tren & Progress Bar */}
            <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm px-6 py-3.5 flex items-center gap-6 min-w-0">
              <button 
                onClick={() => setShowChart(!showChart)} 
                className={`px-4 py-1.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wide transition-all shadow-sm shrink-0 ${
                  showChart 
                  ? 'bg-emerald-600 text-white border-emerald-600' 
                  : 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                Tren
              </button>
              <div className="flex-1 flex items-center gap-4 min-w-0">
                <div className="flex-1 h-2.5 bg-gray-200/50 rounded-full relative overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${grandTotal >= selectedSopd.qty ? 'bg-emerald-500 shadow-sm' : 'bg-emerald-400'}`} 
                    style={{ width: `${Math.min(100, (grandTotal / selectedSopd.qty) * 100)}%` }} 
                  />
                </div>
                <span className="text-[14px] font-semibold tabular-nums text-gray-800 w-14 text-right shrink-0">
                  {((grandTotal / selectedSopd.qty) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Card 3: Tab Navigation */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-1.5 flex items-center gap-1 shrink-0">
              <button 
                onClick={() => setActiveTab('jurnal')}
                className={`px-8 py-2.5 rounded-lg text-[12px] font-bold capitalize tracking-tight transition-all duration-300 ${
                  activeTab === 'jurnal' 
                  ? 'bg-gray-100 text-emerald-600 border border-gray-200/50' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                Jurnal Produksi
              </button>
              <button 
                onClick={() => setActiveTab('barang_jadi')}
                className={`px-8 py-2.5 rounded-lg text-[12px] font-bold capitalize tracking-tight transition-all duration-300 ${
                  activeTab === 'barang_jadi' 
                  ? 'bg-gray-100 text-emerald-600 border border-gray-200/50' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                Barang Jadi
              </button>
            </div>

            {/* Daily Trend Chart - MODAL VERSION */}
            {showChart && chartData.length > 0 && (
              <div 
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
                onClick={() => setShowChart(false)}
              >
                <div 
                  className="w-full max-w-5xl bg-white border border-gray-100 rounded-xl shadow-md flex flex-col animate-in zoom-in-95 duration-300 cursor-default overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={16} />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-xl font-bold tracking-tight text-gray-800 leading-tight">Tren Produksi Harian</h3>
                        <span className="text-[12px] font-medium text-gray-500 mt-1">
                          Grafik perbandingan Barang Jadi dan Realisasi Pekerjaan Produksi
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowChart(false)}
                      className="p-2.5 rounded-lg bg-white border border-gray-100 shadow-sm hover:bg-red-50 hover:text-red-600 transition-all text-gray-400"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-10 min-h-[450px] flex flex-col">
                    <div className="mb-10 flex gap-8 text-[11px] font-bold uppercase tracking-wide">
                      <button 
                        onClick={() => setHideGudang(!hideGudang)}
                        className={`flex items-center gap-3 cursor-pointer transition-all hover:opacity-80 ${hideGudang ? 'opacity-40' : 'opacity-100'}`}
                      >
                        <div className="w-5 h-5 rounded-lg border border-blue-100 shadow-sm" style={{ backgroundColor: '#2563eb' }}></div>
                        <span className={hideGudang ? 'line-through text-gray-300' : 'text-gray-800'}>Barang Jadi</span>
                      </button>
                      {selectedPekerjaan && (
                        <button 
                          onClick={() => setHideJurnal(!hideJurnal)}
                          className={`flex items-center gap-3 cursor-pointer transition-all hover:opacity-80 ${hideJurnal ? 'opacity-40' : 'opacity-100'}`}
                        >
                          <div className="w-5 h-5 rounded-lg border border-orange-100 shadow-sm" style={{ backgroundColor: '#f97316' }}></div>
                          <span className={hideJurnal ? 'line-through text-gray-300' : 'text-gray-800'}>{selectedPekerjaan}</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                          <defs>
                            <linearGradient id="colorGudang" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorJurnal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis 
                            dataKey="displayDate" 
                            fontSize={10} 
                            fontWeight={700} 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', textAnchor: 'end' }}
                            angle={-30}
                            height={80}
                            dy={4}
                            label={{ value: 'Tanggal', position: 'insideBottom', offset: -10, fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                          />
                          <YAxis 
                            width={80}
                            fontSize={10} 
                            fontWeight={700}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => val.toLocaleString('id-ID')}
                            tick={{ fill: '#9ca3af' }}
                            dx={-10}
                            label={{ value: 'Qty / Realisasi', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 10, fontWeight: 700, offset: 0 }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #f3f4f6', 
                              borderRadius: '16px',
                              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                              fontSize: '12px',
                              fontWeight: '700',
                              padding: '12px'
                            }}
                          />
                          {!hideGudang && (
                            <Area 
                              type="monotone" 
                              dataKey="gudang" 
                              name="Barang Jadi" 
                              stroke="#2563eb" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorGudang)" 
                              animationDuration={1000}
                            />
                          )}
                          {!hideJurnal && selectedPekerjaan && (
                            <Area 
                              type="monotone" 
                              dataKey="jurnal" 
                              name={selectedPekerjaan} 
                              stroke="#f97316" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorJurnal)" 
                              animationDuration={1000}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {selectedSopd ? (
          <div className="flex-1 min-h-0 bg-white border border-gray-100 rounded-xl shadow-sm shadow-green-900/5 overflow-hidden flex flex-col">
            {activeTab === 'barang_jadi' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/20">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-white">
                    <th className="sticky top-0 z-20 px-5 py-4 w-[200px] text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white">Tanggal</th>
                    <th className="sticky top-0 z-20 px-5 py-4 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white">Nama Barang</th>
                    <th className="sticky top-0 z-20 px-5 py-4 w-[180px] text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white">No. Faktur</th>
                    <th className="sticky top-0 z-20 px-5 py-4 w-[150px] text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-emerald-50 text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingDetails ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-5 py-4"><div className="h-4 w-24 bg-gray-100 rounded-full"></div></td>
                        <td className="px-5 py-4"><div className="h-4 w-full bg-gray-50 rounded-full"></div></td>
                        <td className="px-5 py-4"><div className="h-4 w-20 bg-gray-100 rounded-full"></div></td>
                        <td className="px-5 py-4 text-right"><div className="h-4 w-12 bg-gray-50 rounded-full ml-auto"></div></td>
                      </tr>
                    ))
                  ) : results.length > 0 ? (
                    results.map((group, gIdx) => (
                      <React.Fragment key={group.date}>
                        {group.items.map((item: any, iIdx: number) => (
                          <tr key={`${gIdx}-${iIdx}`} className="bg-white hover:bg-green-50/20 transition-colors group cursor-default">
                            <td className="px-5 py-3.5 text-[12px] font-bold text-gray-800 border-r border-gray-50 tabular-nums">
                              {iIdx === 0 ? formatToDayMonthYear(group.date) : ''}
                            </td>
                            <td className="px-5 py-3.5 text-[12px] font-bold text-gray-600 border-r border-gray-50 tracking-tight">
                              <div className="truncate max-w-[400px]" title={item.nama_barang}>{item.nama_barang}</div>
                            </td>
                            <td className="px-5 py-3.5 text-[11px] font-bold text-gray-400 border-r border-gray-50 tabular-nums uppercase tracking-wide">
                              {item.faktur}
                            </td>
                            <td className="px-5 py-3.5 text-[14px] font-bold text-emerald-900 bg-emerald-50 text-right tabular-nums">
                              {Number(item.qty).toLocaleString('id-ID')} <span className="text-[10px] font-bold text-emerald-600/50 ml-1 uppercase">{item.satuan || unit}</span>
                            </td>
                          </tr>
                        ))}
                        {group.items.length > 1 && (
                          <tr className="bg-emerald-50/50 border-t border-emerald-100">
                            <td colSpan={3} className="px-5 py-3 text-right text-[12px] font-bold tracking-wide text-emerald-800 border-r border-emerald-100">Total Harian {formatToDayMonthYear(group.date)}</td>
                            <td className="px-5 py-3 text-right text-[14px] font-bold tabular-nums text-emerald-900 bg-emerald-100/50">
                               {group.total.toLocaleString('id-ID')} <span className="text-[10px] opacity-40 ml-1 uppercase">{group.items[0].satuan || unit}</span>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300">
                            <BarChart3 size={32} />
                          </div>
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Belum ada data barang jadi</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Operator Efficiency Summary - Horizontal scrollable row */}
              {jurnalResults.length > 0 && !loadingDetails && selectedPekerjaan && (
                <div className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center gap-4 shrink-0 overflow-hidden">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-600 uppercase tracking-wide shrink-0">
                    <TrendingUp size={14} />
                    <span>Realisasi:</span>
                  </div>
                  <div className="flex-1 flex flex-nowrap gap-6 overflow-x-auto custom-scrollbar scrollbar-hide py-1">
                    {operatorStats.map(([name, total], idx) => (
                      <div key={name} className="flex items-center gap-3 shrink-0 group">
                        {idx > 0 && <div className="w-px h-3 bg-gray-200"></div>}
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-gray-500 capitalize tracking-tight leading-none mb-1 group-hover:text-gray-700 transition-colors">
                            {(name || '').toLowerCase()}
                          </span>
                          <span className="text-[13px] font-semibold text-gray-800 tabular-nums leading-none">
                            {total.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0 min-w-[1500px]">
                  <thead>
                    <tr className="bg-white">
                      <th className="sticky top-0 z-20 px-5 py-5 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">Tanggal</th>
                      <th className="sticky top-0 z-20 px-5 py-5 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">Bagian / Karyawan</th>
                      <th className="sticky top-0 z-20 px-5 py-5 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">No. & Nama Order</th>
                      <th className="sticky top-0 z-20 px-5 py-5 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">Jenis Pekerjaan</th>
                      <th className="sticky top-0 z-20 px-5 py-5 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">Bahan Kertas</th>
                      <th className="sticky top-0 z-20 px-5 py-5 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap text-right">Jml. Plate</th>
                      <th className="sticky top-0 z-20 px-5 py-5 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">Warna</th>
                      <th className="sticky top-0 z-20 px-5 py-5 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap text-right">Inscheet</th>
                      <th className="sticky top-0 z-20 px-5 py-5 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap text-right">Rijek</th>
                      <th className="sticky top-0 z-20 px-5 py-5 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">Jam</th>
                      <th className="sticky top-0 z-20 px-5 py-5 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">Kendala</th>
                      <th className="sticky top-0 z-20 px-5 py-5 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">Keterangan</th>
                      <th className="sticky top-0 z-20 px-5 py-5 text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-emerald-50 whitespace-nowrap text-right">Realisasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {memoizedJurnalRows}
                  </tbody>
                </table>
              </div>
            </div>
          )}




          {/* Fixed Footer for Totals */}
          {((activeTab === 'barang_jadi' && results.length > 0) || (activeTab === 'jurnal' && jurnalResults.length > 0 && selectedPekerjaan)) && !loadingDetails && (
            <div className="bg-white text-gray-800 border-t border-gray-100 px-8 py-2.5 flex flex-wrap justify-end items-center shrink-0 relative z-20 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] gap-8">
              {activeTab === 'jurnal' && grandTotalRijek > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold tracking-wide text-rose-400">Total Rijek</span>
                  <div className="text-lg font-semibold tabular-nums tracking-tight text-rose-600">
                    {grandTotalRijek.toLocaleString('id-ID')}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold tracking-wide text-gray-500">
                  {activeTab === 'barang_jadi' ? 'Total Barang Masuk (Gudang)' : selectedPekerjaan ? `Total Realisasi — ${selectedPekerjaan}` : 'Total Realisasi Semua Pekerjaan'}
                </span>
                <div className="text-lg font-bold tabular-nums tracking-tight text-emerald-600">
                  {activeTab === 'barang_jadi' 
                    ? `${grandTotal.toLocaleString('id-ID')} ${results[0]?.items[0]?.satuan || results[0]?.items[0]?.unit || unit}`
                    : `${grandTotalJurnal.toLocaleString('id-ID')}`
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center border-2 border-dashed border-emerald-100 bg-emerald-50/10 rounded-2xl animate-in fade-in duration-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-100/20 blur-[100px] -ml-32 -mb-32 rounded-full"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-white border border-emerald-100 shadow-xl shadow-emerald-900/5 rounded-3xl flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <BarChart3 size={40} strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-3 text-center">Analisa Hasil Produksi</h2>
            <p className="text-gray-500 font-medium max-w-md text-center text-[13px] leading-relaxed px-6">
              Silakan pilih <span className="text-emerald-600 font-bold">Order Produksi (SOPd)</span> melalui panel di atas untuk mulai membandingkan laporan operasional.
            </p>
            
            <div className="mt-12 flex items-center gap-4 text-[10px] font-semibold text-gray-300 uppercase tracking-[0.4em]">
              <div className="w-12 h-px bg-gray-100"></div>
              SINTAK ERP SYSTEM
              <div className="w-12 h-px bg-gray-100"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



