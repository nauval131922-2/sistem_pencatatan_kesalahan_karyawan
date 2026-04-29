'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Portal from '@/components/Portal';
import { BarChart3, Construction, Search, ChevronDown, Filter, RotateCcw, ClipboardList, TrendingUp, CheckCircle, X, Target, Box, AlertCircle, Package, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'barang_jadi' | 'jurnal'>('jurnal');
  const [selectedBagian, setSelectedBagian] = useState('');
  const [selectedPekerjaan, setSelectedPekerjaan] = useState('');
  const [availableBagian, setAvailableBagian] = useState<string[]>([]);
  const [availablePekerjaan, setAvailablePekerjaan] = useState<string[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [hideGudang, setHideGudang] = useState(false);
  const [hideJurnal, setHideJurnal] = useState(false);
  const [jurnalDisplayLimit, setJurnalDisplayLimit] = useState(20);
  const PAGE_SIZE = 20;
  const [jurnalPage, setJurnalPage] = useState(1);
  const [barangJadiPage, setBarangJadiPage] = useState(1);
  
  // Custom dropdown states
  const [isBagianDropdownOpen, setIsBagianDropdownOpen] = useState(false);
  const [bagianSearchQuery, setBagianSearchQuery] = useState('');
  const [focusedBagianIndex, setFocusedBagianIndex] = useState(-1);
  const [bagianCoords, setBagianCoords] = useState({ top: 0, left: 0, width: 0 });
  const bagianTriggerRef = useRef<HTMLButtonElement>(null);

  const [isPekerjaanDropdownOpen, setIsPekerjaanDropdownOpen] = useState(false);
  const [pekerjaanSearchQuery, setPekerjaanSearchQuery] = useState('');
  const [focusedPekerjaanIndex, setFocusedPekerjaanIndex] = useState(-1);
  const [pekerjaanCoords, setPekerjaanCoords] = useState({ top: 0, left: 0, width: 0 });
  const pekerjaanTriggerRef = useRef<HTMLButtonElement>(null);
  
  // Keyboard navigation states
  const [focusedSopdIndex, setFocusedSopdIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Table scroll sync refs
  const jurnalHeaderRef = useRef<HTMLDivElement>(null);
  const jurnalBodyRef = useRef<HTMLDivElement>(null);
  const barangJadiHeaderRef = useRef<HTMLDivElement>(null);
  const barangJadiBodyRef = useRef<HTMLDivElement>(null);

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

  const filteredPekerjaan = useMemo(() => {
    const all = ['', ...availablePekerjaan].filter(c => (c?.toLowerCase() || '').includes(pekerjaanSearchQuery.toLowerCase()));
    return { items: all.slice(0, 30), total: all.length };
  }, [availablePekerjaan, pekerjaanSearchQuery]);

  const filteredBagian = useMemo(() => {
    const all = ['', ...availableBagian].filter(c => (c?.toLowerCase() || '').includes(bagianSearchQuery.toLowerCase()));
    return { items: all.slice(0, 30), total: all.length };
  }, [availableBagian, bagianSearchQuery]);

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
    setLoadTime(null);
    const startTime = performance.now();
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
        setJurnalPage(1);
        setBarangJadiPage(1);
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
      setLoadTime(performance.now() - startTime);
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

    // Flatten all items with group info, then paginate
    const allItems: Array<{ item: any; group: any; iIdx: number; gIdx: number; isFirstInGroup: boolean; isLastInGroup: boolean }> = [];
    jurnalResults.forEach((group: any, gIdx: number) => {
      group.items.forEach((item: any, iIdx: number) => {
        allItems.push({ item, group, iIdx, gIdx, isFirstInGroup: iIdx === 0, isLastInGroup: iIdx === group.items.length - 1 });
      });
    });

    const totalItems = allItems.length;
    const startIdx = (jurnalPage - 1) * PAGE_SIZE;
    const pageItems = allItems.slice(startIdx, startIdx + PAGE_SIZE);
      

    const allJobsSame = (group: any) => group.items.length > 0 && group.items.every((it: any) => it.jenis_pekerjaan_2 === group.items[0].jenis_pekerjaan_2);

    // ---- Rebuild rendered rows from paged items ----
    const renderedGroups: React.ReactNode[] = [];
    
    // Grouping by Job streak within the paged items
    let currentJobStreak: any[] = [];
    let currentJobName = '';
    let lastDate = '';

    const pushSubtotalRow = (streak: any[], jobDisplayName: string, date: string, gIdx: number) => {
      if (streak.length > 1) {
        const totalR = streak.reduce((sum, s) => sum + Number(s.realisai || s.realisasi || 0), 0);
        const totalRijek = streak.reduce((sum, s) => sum + Number(s.rijek || 0), 0);
        
        // Calculate date range within this streak
        const dates = streak.map(s => s.tgl).filter(Boolean).sort();
        const minDate = dates[0];
        const maxDate = dates[dates.length - 1];
        
        let dateLabel = formatToDayMonthYear(minDate);
        if (minDate && maxDate && minDate !== maxDate) {
          dateLabel = `${formatToDayMonthYear(minDate)} s.d. ${formatToDayMonthYear(maxDate)}`;
        }

        renderedGroups.push(
          <tr key={`subtotal-${gIdx}-${jobDisplayName}-${minDate}-${maxDate}`} className="bg-emerald-50/50 border-t border-emerald-100">
            <td colSpan={8} className="px-4 py-3 text-right text-[11px] font-bold tracking-tight text-emerald-800 border-r border-emerald-100">
              Total {jobDisplayName || 'Pekerjaan'} — {dateLabel}
            </td>
            <td className="px-4 py-3 text-right text-[12px] font-bold tabular-nums text-rose-600 bg-rose-50/30 border-r border-emerald-100">{totalRijek.toLocaleString('id-ID')}</td>
            <td colSpan={3} className="px-4 py-3 border-r border-emerald-100"></td>
            <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums text-emerald-900 bg-emerald-100/50">{totalR.toLocaleString('id-ID')}</td>
          </tr>
        );
      }
    };

    pageItems.forEach(({ item, group, iIdx, gIdx, isLastInGroup }, pIdx) => {
      const jobKey = (item.jenis_pekerjaan_2 || '').toLowerCase();
      const jobDisplayName = item.jenis_pekerjaan_2 || 'Pekerjaan';
      
      // If job changes or day changes, finish previous streak
      if (pIdx > 0 && (jobKey !== currentJobName || group.date !== lastDate)) {
        pushSubtotalRow(currentJobStreak, currentJobStreak[0]?.jenis_pekerjaan_2 || 'Pekerjaan', lastDate, gIdx - 1);
        currentJobStreak = [];
      }

      currentJobName = jobKey;
      lastDate = group.date;
      currentJobStreak.push(item);

      renderedGroups.push(
        <tr key={`${gIdx}-${iIdx}`} className="bg-white hover:bg-emerald-50/30 even:bg-gray-50/50 transition-colors group cursor-default">
          <td className="sticky left-0 z-10 px-4 py-3 xl:py-4 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 tabular-nums text-gray-800 bg-white group-even:bg-[#f9fafb] group-hover:bg-[#f0fdf4] min-w-[100px] max-w-[100px] md:shadow-none shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
            {pIdx === 0 || item.tgl !== pageItems[pIdx-1].item.tgl ? formatToDayMonthYear(item.tgl) : ''}
          </td>
          <td className="md:sticky md:left-[100px] md:z-10 px-4 py-3 xl:py-4 border-r border-gray-100 bg-white group-even:bg-[#f9fafb] group-hover:bg-[#f0fdf4] min-w-[160px] max-w-[160px] md:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] lg:shadow-none">
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] xl:text-[10px] font-bold text-gray-400 uppercase leading-none mb-1 truncate" title={item.bagian}>{item.bagian}</span>
              <span className="text-[11px] xl:text-[12px] font-bold text-gray-800 leading-tight whitespace-nowrap truncate" title={item.nama_karyawan}>{item.nama_karyawan}</span>
            </div>
          </td>
          <td className="lg:sticky lg:left-[260px] z-10 px-4 py-3 xl:py-4 border-r border-gray-100 bg-white group-even:bg-[#f9fafb] group-hover:bg-[#f0fdf4] min-w-[240px] max-w-[240px] lg:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] xl:text-[10px] font-bold text-gray-400 leading-none mb-1 truncate" title={item.no_order_2 || ''}>{item.no_order_2 || '-'}</span>
              <span className="text-[11px] xl:text-[12px] font-bold text-gray-700 leading-tight truncate" title={item.nama_order_2 || ''}>{item.nama_order_2 || '-'}</span>
            </div>
          </td>
          <td className="px-4 py-3 xl:py-4 text-[11px] xl:text-[12px] border-r border-gray-100">
            <div className="font-bold bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm text-gray-700 capitalize inline-block whitespace-nowrap align-middle" title={item.jenis_pekerjaan_2 || ''}>
              {(item.jenis_pekerjaan_2 || '-').toLowerCase()}
            </div>
          </td>
          <td className="px-4 py-3 xl:py-4 text-[10px] xl:text-[11px] font-bold border-r border-gray-100 truncate max-w-[120px] text-gray-600" title={item.bahan_kertas || ''}>{item.bahan_kertas || '-'}</td>
          <td className="px-4 py-3 xl:py-4 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 text-right tabular-nums text-gray-700">{Number(item.jml_plate || 0).toLocaleString('id-ID')}</td>
          <td className="px-4 py-3 xl:py-4 text-[10px] xl:text-[11px] font-bold border-r border-gray-100 truncate max-w-[100px] text-gray-600" title={item.warna || ''}>{item.warna || '-'}</td>
          <td className="px-4 py-3 xl:py-4 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 text-right tabular-nums text-gray-700">{Number(item.inscheet || 0).toLocaleString('id-ID')}</td>
          <td className="px-4 py-3 xl:py-4 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 text-right tabular-nums text-rose-600">{Number(item.rijek || 0).toLocaleString('id-ID')}</td>
          <td className="px-4 py-3 xl:py-4 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 text-gray-700 truncate max-w-[80px]" title={item.jam || ''}>{item.jam || '-'}</td>
          <td className="px-4 py-3 xl:py-4 text-[10px] xl:text-[11px] font-bold border-r border-gray-100 truncate max-w-[120px] text-rose-600" title={item.kendala || ''}>{item.kendala || '-'}</td>
          <td className="px-4 py-3 xl:py-4 text-[10px] xl:text-[11px] font-bold border-r border-gray-100 text-gray-500 max-w-[120px] truncate" title={item.keterangan || ''}>{item.keterangan || '-'}</td>
          <td className="px-4 py-3 xl:py-4 text-[13px] xl:text-[15px] font-semibold text-right tabular-nums bg-emerald-50 text-emerald-900">{Number(item.realisasi).toLocaleString('id-ID')}</td>
        </tr>
      );

      // Final streak push for the very last item in paged results
      if (pIdx === pageItems.length - 1) {
        pushSubtotalRow(currentJobStreak, currentJobStreak[0]?.jenis_pekerjaan_2 || 'Pekerjaan', lastDate, gIdx);
      }
    });

    if (pageItems.length === 0 && !loadingDetails) {
      renderedGroups.push(
        <tr key="empty"><td colSpan={14} className="px-6 py-24 text-center">
          <div className="flex flex-col items-center gap-4 opacity-30">
            <AlertCircle size={28} />
            <span className="text-[11px] font-bold tracking-wide">Tidak ada data</span>
          </div>
        </td></tr>
      );
    }

    return renderedGroups;
  }, [jurnalResults, loadingDetails, jurnalPage]);

  const memoizedBarangJadiRows = useMemo(() => {
    if (loadingDetails) {
      return [...Array(6)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 rounded-full"></div></td>
          <td className="px-4 py-3"><div className="h-4 w-full bg-gray-50 rounded-full"></div></td>
          <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-100 rounded-full"></div></td>
          <td className="px-4 py-3 text-right"><div className="h-4 w-10 bg-gray-50 rounded-full ml-auto"></div></td>
        </tr>
      ));
    }

    const allItems: Array<{ item: any; group: any; iIdx: number; gIdx: number; isLastInGroup: boolean }> = [];
    results.forEach((group: any, gIdx: number) => {
      group.items.forEach((item: any, iIdx: number) => {
        allItems.push({ item, group, iIdx, gIdx, isLastInGroup: iIdx === group.items.length - 1 });
      });
    });

    const startIdx = (barangJadiPage - 1) * PAGE_SIZE;
    const pageItems = allItems.slice(startIdx, startIdx + PAGE_SIZE);

    const renderedGroups: React.ReactNode[] = [];
    pageItems.forEach(({ item, group, iIdx, gIdx, isLastInGroup }) => {
      renderedGroups.push(
        <tr key={`${gIdx}-${iIdx}`} className="bg-white hover:bg-emerald-50/30 even:bg-gray-50/50 transition-colors group cursor-default">
          <td className="sticky left-0 z-10 px-4 py-3 xl:py-4 text-[11px] xl:text-[12px] font-bold text-gray-800 border-r border-gray-50 tabular-nums bg-white group-even:bg-[#f9fafb] group-hover:bg-[#f8faf9] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
            {iIdx === 0 ? formatToDayMonthYear(group.date) : ''}
          </td>
          <td className="px-4 py-3 xl:py-4 text-[11px] xl:text-[12px] font-bold text-gray-600 border-r border-gray-50 tracking-tight">
            <div className="truncate max-w-[400px]" title={item.nama_prd}>{item.nama_prd}</div>
          </td>
          <td className="px-4 py-3 xl:py-4 text-[10px] xl:text-[11px] font-bold text-gray-400 border-r border-gray-50 tabular-nums uppercase tracking-wide">
            {item.faktur}
          </td>
          <td className="px-4 py-3 xl:py-4 text-[13px] xl:text-[15px] font-bold text-emerald-900 bg-emerald-50 text-right tabular-nums">
            {Number(item.qty).toLocaleString('id-ID')} <span className="text-[9px] xl:text-[10px] font-bold text-emerald-600/50 ml-1 uppercase">{item.satuan || unit}</span>
          </td>
        </tr>
      );

      if (isLastInGroup && group.items.length > 1) {
        renderedGroups.push(
          <tr key={`${gIdx}-subtotal`} className="bg-emerald-50/50 border-t border-emerald-100">
            <td colSpan={3} className="px-5 py-3 text-right text-[12px] font-bold tracking-wide text-emerald-800 border-r border-emerald-100">Total Harian {formatToDayMonthYear(group.date)}</td>
            <td className="px-5 py-3 text-right text-[14px] font-bold tabular-nums text-emerald-900 bg-emerald-100/50">
               {group.total.toLocaleString('id-ID')} <span className="text-[10px] opacity-40 ml-1 uppercase">{group.items[0].satuan || unit}</span>
            </td>
          </tr>
        );
      }
    });

    if (pageItems.length === 0 && !loadingDetails) {
      renderedGroups.push(
        <tr key="empty">
          <td colSpan={4} className="px-6 py-24 text-center">
            <div className="flex flex-col items-center gap-4 opacity-30">
              <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300">
                <BarChart3 size={32} />
              </div>
              <span className="text-[11px] font-bold text-gray-400 tracking-wide">Belum ada data barang jadi</span>
            </div>
          </td>
        </tr>
      );
    }

    return renderedGroups;
  }, [results, loadingDetails, barangJadiPage, unit]);

  // Close dropdown on outside click & Dynamic Sticky Calculation
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (!target.closest('.bagian-dropdown-container') && !target.closest('.bagian-portal-content')) setIsBagianDropdownOpen(false);
      if (!target.closest('.pekerjaan-dropdown-container') && !target.closest('.pekerjaan-portal-content')) setIsPekerjaanDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);

    // Dynamic Sticky Calculation
    const header = document.getElementById('sticky-page-header');
    const tabs = document.getElementById('sticky-tabs-container');
    
    const updateOffsets = () => {
      if (header) {
        const headerHeight = header.offsetHeight - 24; // subtract the -mt-6 (24px) pull-up offset
        document.documentElement.style.setProperty('--sticky-header-h', `${headerHeight}px`);
      }
      
      const isDesktop = window.innerWidth >= 1024;
      const desktopControlBar = document.getElementById('desktop-sticky-control-bar');
      const mobileTabs = document.getElementById('sticky-tabs-container');
      
      let stickyHeight = 0;
      if (isDesktop && desktopControlBar) {
        stickyHeight = desktopControlBar.offsetHeight;
      } else if (!isDesktop && mobileTabs) {
        stickyHeight = mobileTabs.offsetHeight;
      }
      
      document.documentElement.style.setProperty('--sticky-tabs-h', `${stickyHeight}px`);
    };

    const observer = new ResizeObserver(updateOffsets);
    if (header) observer.observe(header);
    const tabsContainer = document.getElementById('sticky-tabs-container');
    const desktopContainer = document.getElementById('desktop-sticky-control-bar');
    if (tabsContainer) observer.observe(tabsContainer);
    if (desktopContainer) observer.observe(desktopContainer);
    
    updateOffsets();
    window.addEventListener('scroll', updateOffsets);
    window.addEventListener('resize', updateOffsets);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      observer.disconnect();
      window.removeEventListener('scroll', updateOffsets);
      window.removeEventListener('resize', updateOffsets);
    };
  }, []);


  if (!isMounted) return null;

  const totalJurnalItems = jurnalResults.reduce((acc, group) => acc + group.items.length, 0);
  const totalJurnalPages = Math.max(1, Math.ceil(totalJurnalItems / PAGE_SIZE));
  
  const totalBarangJadiItems = results.reduce((acc, group) => acc + group.items.length, 0);
  const totalBarangJadiPages = Math.max(1, Math.ceil(totalBarangJadiItems / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* 1. Header Section - Fixed */}
      <div id="filter-control-container" className="flex flex-col gap-4 shrink-0 relative">
        {/* 1. Filter Control Center */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col 2xl:flex-row items-stretch 2xl:items-end gap-6 lg:gap-8 relative">
          {/* SOPd Selection Group */}
          <div className="flex-1 min-w-[300px]">
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
                  <div className="flex flex-1 items-center gap-3 sm:gap-4 min-w-0 mr-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <ClipboardList size={16} />
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-0 overflow-hidden">
                      <span className="text-[11px] font-semibold text-emerald-700 leading-none mb-1">{selectedSopd.no_sopd}</span>
                      <span className="text-[13px] font-semibold text-gray-800 truncate tracking-tight w-full text-left" title={`${selectedSopd.pelanggan} — ${selectedSopd.nama_order}`}>
                        {selectedSopd.pelanggan} — {selectedSopd.nama_order}
                      </span>
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
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-[90] animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[450px]">
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
                        <span className="text-[10px] font-semibold tracking-wide">Mencari data...</span>
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
                        <div className="flex flex-col items-start min-w-0 flex-1 mr-3 text-left">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${selectedSopd?.no_sopd === opt.no_sopd ? 'text-emerald-100' : 'text-emerald-600'}`}>
                            {opt.no_sopd}
                          </span>
                          <span className={`text-[13px] font-semibold truncate w-full ${selectedSopd?.no_sopd === opt.no_sopd ? 'text-white' : 'text-gray-800'}`} title={`${opt.pelanggan} — ${opt.nama_order}`}>
                            {opt.pelanggan} — {opt.nama_order}
                          </span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-tighter shrink-0 whitespace-nowrap ${selectedSopd?.no_sopd === opt.no_sopd ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {opt.qty?.toLocaleString('id-ID')} {opt.unit}
                        </div>
                      </button>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-30 text-center px-6">
                            <AlertCircle size={24} />
                            <span className="text-[11px] font-semibold tracking-wide leading-relaxed">Data tidak ditemukan untuk kata kunci ini</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Combined Row for Date, Bagian, Pekerjaan & Refresh on LG */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-8 flex-[2]">
            {/* Rentang Tanggal */}
            <div className="flex flex-col lg:w-[320px] shrink-0">
              <label className="block text-[13px] font-semibold text-gray-500 mb-2 ml-1 tracking-tight select-none">Rentang Tanggal</label>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex-1"><DatePicker name="startDate" value={startDate} onChange={(d) => setStartDate(d)} /></div>
                <div className="w-3 sm:w-6 h-px bg-gray-200 shrink-0"></div>
                <div className="flex-1"><DatePicker name="endDate" value={endDate} onChange={(d) => setEndDate(d)} popupAlign="right" /></div>
              </div>
            </div>

            {/* Bagian, Pekerjaan & Refresh */}
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
              {activeTab === 'jurnal' && (
                <div className="flex flex-1 items-center gap-4">
                  <div className="flex flex-col flex-1 min-w-0">
                    <label className="block text-[13px] font-semibold text-gray-500 mb-2 ml-1 tracking-tight select-none">Bagian</label>
                    <div className="relative bagian-dropdown-container">
                        <button 
                          ref={bagianTriggerRef}
                          onClick={() => {
                            if (!isBagianDropdownOpen && bagianTriggerRef.current) {
                              const rect = bagianTriggerRef.current.getBoundingClientRect();
                              setBagianCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
                            }
                            setIsBagianDropdownOpen(!isBagianDropdownOpen);
                          }}
                          className="w-full h-11 px-4 bg-gray-50/50 border border-gray-100 rounded-xl text-[12px] font-semibold text-gray-700 flex items-center justify-between hover:border-emerald-500 transition-all">
                          <span className="truncate" title={selectedBagian || 'Semua Bagian'}>{selectedBagian || 'Semua Bagian'}</span>
                          <ChevronDown size={14} className={`text-gray-300 transition-transform ${isBagianDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isBagianDropdownOpen && (
                          <Portal>
                            <div 
                              style={{ 
                                position: 'absolute', 
                                top: `${bagianCoords.top + 8}px`, 
                                left: `${Math.max(8, Math.min(window.innerWidth - 258, bagianCoords.left))}px`, 
                                width: '250px', 
                                zIndex: 9999 
                              }}
                              className="bg-white border border-gray-100 rounded-2xl shadow-2xl py-3 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[350px] bagian-portal-content">
                              <div className="px-3 pb-2 my-2 border-b border-gray-50">
                                <input type="text" autoFocus placeholder="Cari bagian..." className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-emerald-200 transition-all" 
                                  value={bagianSearchQuery} 
                                  onChange={(e) => setBagianSearchQuery(e.target.value)} 
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      setFocusedBagianIndex(prev => (prev < filteredBagian.items.length - 1 ? prev + 1 : prev));
                                    } else if (e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      setFocusedBagianIndex(prev => (prev > 0 ? prev - 1 : prev));
                                    } else if (e.key === 'Enter' && focusedBagianIndex >= 0) {
                                      e.preventDefault();
                                      setSelectedBagian(filteredBagian.items[focusedBagianIndex]);
                                      setIsBagianDropdownOpen(false);
                                    } else if (e.key === 'Escape') {
                                      setIsBagianDropdownOpen(false);
                                    }
                                  }}
                                />
                              </div>
                              <div className="overflow-y-auto px-2 custom-scrollbar">
                                {filteredBagian.items.length > 0 ? (
                                  <>
                                    {filteredBagian.items.map((cat, idx) => (
                                      <button key={cat} 
                                        ref={focusedBagianIndex === idx ? (el) => { if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } : null}
                                        onClick={() => { setSelectedBagian(cat); setIsBagianDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-xs font-bold rounded-lg mb-1 tracking-tight ${selectedBagian === cat ? 'bg-emerald-600 text-white shadow-md' : focusedBagianIndex === idx ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'text-gray-600 hover:bg-emerald-50'}`}>
                                        {cat || 'Semua Bagian'}
                                      </button>
                                    ))}
                                    {filteredBagian.total > 30 && (
                                      <div className="px-4 py-2 text-[10px] text-gray-400 font-semibold text-center border-t border-gray-50 mt-1">
                                        +{filteredBagian.total - 30} lainnya — ketik untuk mempersempit
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="py-8 text-center opacity-30">
                                    <AlertCircle size={24} className="mx-auto mb-2" />
                                    <span className="text-[10px] font-semibold tracking-wide">Tidak ada hasil</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Portal>
                        )}
                      </div>
                    </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <label className="block text-[13px] font-semibold text-gray-500 mb-2 ml-1 tracking-tight select-none">Pekerjaan</label>
                    <div className="relative pekerjaan-dropdown-container">
                        <button 
                          ref={pekerjaanTriggerRef}
                          onClick={() => {
                            if (!isPekerjaanDropdownOpen && pekerjaanTriggerRef.current) {
                              const rect = pekerjaanTriggerRef.current.getBoundingClientRect();
                              setPekerjaanCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
                            }
                            setIsPekerjaanDropdownOpen(!isPekerjaanDropdownOpen);
                          }}
                          className="w-full h-11 px-4 bg-gray-50/50 border border-gray-100 rounded-xl text-[12px] font-semibold text-gray-700 flex items-center justify-between hover:border-emerald-500 transition-all">
                          <span className="truncate" title={selectedPekerjaan || 'Semua Pekerjaan'}>{selectedPekerjaan || 'Semua Pekerjaan'}</span>
                          <ChevronDown size={14} className={`text-gray-300 transition-transform ${isPekerjaanDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isPekerjaanDropdownOpen && (
                          <Portal>
                            <div 
                              style={{ 
                                position: 'absolute', 
                                top: `${pekerjaanCoords.top + 8}px`, 
                                left: `${Math.max(8, Math.min(window.innerWidth - 288, pekerjaanCoords.left + pekerjaanCoords.width - 280))}px`, 
                                width: '280px', 
                                zIndex: 9999 
                              }}
                              className="bg-white border border-gray-100 rounded-2xl shadow-2xl py-3 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[350px] pekerjaan-portal-content">
                              <div className="px-3 pb-2 my-2 border-b border-gray-50">
                                <input type="text" autoFocus placeholder="Cari pekerjaan..." className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-emerald-200 transition-all" 
                                  value={pekerjaanSearchQuery} 
                                  onChange={(e) => setPekerjaanSearchQuery(e.target.value)} 
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      setFocusedPekerjaanIndex(prev => (prev < filteredPekerjaan.items.length - 1 ? prev + 1 : prev));
                                    } else if (e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      setFocusedPekerjaanIndex(prev => (prev > 0 ? prev - 1 : prev));
                                    } else if (e.key === 'Enter' && focusedPekerjaanIndex >= 0) {
                                      e.preventDefault();
                                      setSelectedPekerjaan(filteredPekerjaan.items[focusedPekerjaanIndex]);
                                      setIsPekerjaanDropdownOpen(false);
                                    } else if (e.key === 'Escape') {
                                      setIsPekerjaanDropdownOpen(false);
                                    }
                                  }}
                                />
                              </div>
                              <div className="overflow-y-auto px-2 custom-scrollbar">
                                {filteredPekerjaan.items.length > 0 ? (
                                  <>
                                    {filteredPekerjaan.items.map((cat, idx) => (
                                      <button key={cat} 
                                        ref={focusedPekerjaanIndex === idx ? (el) => { if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } : null}
                                        onClick={() => { setSelectedPekerjaan(cat); setIsPekerjaanDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-xs font-bold rounded-lg mb-1 tracking-tight ${selectedPekerjaan === cat ? 'bg-emerald-600 text-white shadow-md' : focusedPekerjaanIndex === idx ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'text-gray-600 hover:bg-emerald-50'}`}>
                                        {cat || 'Semua Pekerjaan'}
                                      </button>
                                    ))}
                                    {filteredPekerjaan.total > 30 && (
                                      <div className="px-4 py-2 text-[10px] text-gray-400 font-semibold text-center border-t border-gray-50 mt-1">
                                        +{filteredPekerjaan.total - 30} lainnya — ketik untuk mempersempit
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="py-8 text-center opacity-30">
                                    <AlertCircle size={24} className="mx-auto mb-2" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wide">Tidak ada hasil</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Portal>
                        )}
                      </div>
                    </div>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={() => fetchDetails()}
                className="h-11 px-5 sm:w-auto flex items-center justify-center gap-2 shrink-0 bg-gray-50 text-gray-600 font-bold text-[12px] border border-gray-200 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all group shadow-sm"
                title="Refresh Data"
              >
                <RotateCcw size={16} className={`group-hover:rotate-[-180deg] transition-transform duration-500 ${loadingDetails ? 'animate-spin' : ''}`} />
                <span className="sm:hidden md:inline">Refresh Data</span>
              </button>
            </div>
          </div>
        </div>
        </div>


        {/* Unified Dashboard Control Bar - Split into 3 Cards, Combined on LG */}
        {selectedSopd && (
          <div id="desktop-sticky-control-bar" className="lg:sticky lg:top-[calc(var(--sticky-header-h,72px)-1px)] lg:z-[70] lg:bg-[var(--bg-deep)] lg:pb-1.5 lg:-mx-4 lg:px-4 xl:lg:-mx-8 xl:lg:px-8">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 sm:gap-4">
              {/* Card 1 & 2 Container */}
              <div className="flex flex-col md:flex-row flex-wrap lg:flex-nowrap items-stretch lg:items-center gap-3 sm:gap-4 flex-1">
                {/* Card 1: Target & Sisa */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center justify-between shrink-0 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-400 capitalize tracking-tight shrink-0">Target</span>
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="text-lg sm:text-xl font-semibold text-gray-800 tabular-nums truncate" title={selectedSopd.qty.toLocaleString('id-ID')}>{selectedSopd.qty.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tighter shrink-0">{selectedSopd.unit}</span>
                    </div>
                  </div>

                  <div className="w-px h-6 bg-gray-100 shrink-0 mx-2"></div>

                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-400 capitalize tracking-tight shrink-0">Sisa</span>
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="text-lg sm:text-xl font-semibold text-rose-600 tabular-nums truncate" title={(selectedSopd.qty - grandTotal).toLocaleString('id-ID')}>{(selectedSopd.qty - grandTotal).toLocaleString('id-ID')}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tighter shrink-0">{selectedSopd.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Tren & Progress Bar */}
                <div className="flex-1 min-w-0 bg-white border border-gray-100 rounded-xl shadow-sm px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center gap-2 sm:gap-6">
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
              </div>

              {/* Tab Navigation (Card 3) — only visible at LG+, mobile tabs rendered separately below */}
              <div className="hidden lg:flex lg:items-stretch shrink-0">
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-1.5 flex items-center gap-1 w-fit shrink-0">
                  <button 
                    onClick={() => setActiveTab('jurnal')}
                    className={`lg:px-10 py-2.5 rounded-lg text-[12px] font-bold capitalize tracking-tight whitespace-nowrap transition-all duration-300 ${
                      activeTab === 'jurnal' 
                      ? 'bg-gray-100 text-emerald-600 border border-gray-200/50 shadow-inner' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Jurnal Produksi
                  </button>
                  <button 
                    onClick={() => setActiveTab('barang_jadi')}
                    className={`lg:px-10 py-2.5 rounded-lg text-[12px] font-bold capitalize tracking-tight whitespace-nowrap transition-all duration-300 ${
                      activeTab === 'barang_jadi' 
                      ? 'bg-gray-100 text-emerald-600 border border-gray-200/50 shadow-inner' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Barang Jadi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation — Mobile/MD sticky (shown below cards, separate sticky layer) */}
        {selectedSopd && (
          <div id="sticky-tabs-container" className="sticky top-[calc(var(--sticky-header-h,72px)-1px)] z-[70] bg-[var(--bg-deep)] pb-1.5 -mx-4 px-4 lg:hidden">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-1.5 flex items-center gap-1 w-full">
              <button 
                onClick={() => setActiveTab('jurnal')}
                className={`flex-1 py-2.5 rounded-lg text-[12px] font-bold capitalize tracking-tight whitespace-nowrap transition-all duration-300 ${
                  activeTab === 'jurnal' 
                  ? 'bg-gray-100 text-emerald-600 border border-gray-200/50 shadow-inner' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                Jurnal Produksi
              </button>
              <button 
                onClick={() => setActiveTab('barang_jadi')}
                className={`flex-1 py-2.5 rounded-lg text-[12px] font-bold capitalize tracking-tight whitespace-nowrap transition-all duration-300 ${
                  activeTab === 'barang_jadi' 
                  ? 'bg-gray-100 text-emerald-600 border border-gray-200/50 shadow-inner' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                Barang Jadi
              </button>
            </div>
          </div>
        )}

            {/* Daily Trend Chart - MODAL VERSION */}
            {showChart && chartData.length > 0 && (
              <div 
                className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-10 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
                onClick={() => setShowChart(false)}
              >
                <div 
                  className="w-full max-w-5xl bg-white border border-gray-100 rounded-xl shadow-md flex flex-col animate-in zoom-in-95 duration-300 cursor-default overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={16} />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-gray-800 leading-tight">Tren Produksi Harian</h3>
                        <span className="text-[10px] sm:text-[12px] font-medium text-gray-500 mt-1">
                          Grafik perbandingan Barang Jadi dan Realisasi Pekerjaan
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
                  <div className="p-4 sm:p-10 min-h-[300px] sm:min-h-[450px] flex flex-col">
                    <div className="mb-6 sm:mb-10 flex flex-wrap gap-4 sm:gap-8 text-[11px] font-bold uppercase tracking-wide">
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
        
        {selectedSopd ? (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-green-900/5 flex flex-col -mt-2">
            {activeTab === 'barang_jadi' ? (
            <div className="flex flex-col">
              {/* Gap Filler to prevent scrolling text from showing between tabs and table header */}
              <div className="sticky z-20 bg-white" style={{ height: '40px', top: 'calc(var(--sticky-header-h, 72px) + var(--sticky-tabs-h, 60px) - 41px)', marginBottom: '-40px' }} />
              {/* Sticky Header - outside overflow-x-auto */}
              <div
                ref={barangJadiHeaderRef}
                className="overflow-x-hidden sticky z-20 bg-white"
                style={{ top: 'calc(var(--sticky-header-h, 72px) + var(--sticky-tabs-h, 60px) - 1px)' }}
              >
                <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', minWidth: '700px' }}>
                  <colgroup>
                    <col style={{ width: '130px' }} />
                    <col />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '120px' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-white">
                      <th className="sticky left-0 z-30 px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">Tanggal</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">Nama Produksi</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">No. Faktur</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-emerald-50 text-right whitespace-nowrap">Quantity</th>
                    </tr>
                  </thead>
                </table>
              </div>
              {/* Scrollable Body */}
              <div
                ref={barangJadiBodyRef}
                className="overflow-x-auto custom-scrollbar bg-gray-50/20"
                onScroll={(e) => {
                  if (barangJadiHeaderRef.current) barangJadiHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }}
              >
                <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', minWidth: '700px' }}>
                  <colgroup>
                    <col style={{ width: '130px' }} />
                    <col />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '120px' }} />
                  </colgroup>
                <tbody className="divide-y divide-gray-50">
                  {memoizedBarangJadiRows}
                 </tbody>
               </table>
              </div>
            </div>
           ) : (
            <div className="flex flex-col">
              {/* Operator Efficiency Summary - Horizontal scrollable row */}
              {jurnalResults.length > 0 && !loadingDetails && selectedPekerjaan && (
                <div className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center gap-4 shrink-0 overflow-hidden">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-600 tracking-wide shrink-0">
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

              {/* Gap Filler to prevent scrolling text from showing between tabs and table header */}
              <div className="sticky z-20 bg-white" style={{ height: '40px', top: 'calc(var(--sticky-header-h, 72px) + var(--sticky-tabs-h, 60px) - 41px)', marginBottom: '-40px' }} />
              {/* Sticky Table Header - sticky to viewport, scroll synced with body */}
              <div
                ref={jurnalHeaderRef}
                className="sticky z-20 bg-white"
                style={{
                  top: 'calc(var(--sticky-header-h, 72px) + var(--sticky-tabs-h, 60px) - 1px)',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', minWidth: '1850px' }}>
                  <colgroup>
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '160px' }} />
                    <col style={{ width: '240px' }} />
                    <col style={{ width: '280px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '120px' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-white">
                      <th className="sticky left-0 z-30 px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap md:shadow-none shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">Tanggal</th>
                      <th className="md:sticky md:left-[100px] md:z-30 px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap md:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] lg:shadow-none">Bagian / Karyawan</th>
                      <th className="lg:sticky lg:left-[260px] lg:z-30 px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap lg:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">No. & Nama Order</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap">Jenis Pekerjaan</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap">Bahan Kertas</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap text-right">Jml. Plate</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap">Warna</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap text-right">Inscheet</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap text-right">Rijek</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap">Jam</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap">Kendala</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap">Keterangan</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-emerald-50 whitespace-nowrap text-right">Realisasi</th>
                    </tr>
                  </thead>
                </table>
              </div>
              {/* Scrollable Body */}
              <div
                ref={jurnalBodyRef}
                className="overflow-x-auto custom-scrollbar"
                onScroll={(e) => {
                  if (jurnalHeaderRef.current) jurnalHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }}
              >
                <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', minWidth: '1850px' }}>
                  <colgroup>
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '160px' }} />
                    <col style={{ width: '240px' }} />
                    <col style={{ width: '280px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '120px' }} />
                  </colgroup>
                  <tbody className="divide-y divide-gray-50">
                    {memoizedJurnalRows}
                  </tbody>
                </table>
              </div>
            </div>
          )}




          {/* Fixed Footer for Totals & Pagination */}
          {((activeTab === 'barang_jadi' && results.length > 0) || (activeTab === 'jurnal' && jurnalResults.length > 0)) && !loadingDetails && (
            <div className="bg-white text-gray-800 border-t border-gray-100 px-6 xl:px-8 py-3 sm:py-2.5 flex flex-col sm:flex-row justify-between items-center sm:items-center shrink-0 relative z-20 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] gap-3 sm:gap-4">
              {/* Left Side: Text Info & Load Speed */}
              <div className="flex items-center gap-3">
                <span className="hidden md:block text-[11px] font-bold text-gray-400 tracking-wide">
                  {activeTab === 'jurnal' 
                    ? (totalJurnalItems === 0 ? 'Tidak ada data' : `Menampilkan ${Math.min(jurnalPage * PAGE_SIZE, totalJurnalItems)} dari ${totalJurnalItems} baris`)
                    : (totalBarangJadiItems === 0 ? 'Tidak ada data' : `Menampilkan ${Math.min(barangJadiPage * PAGE_SIZE, totalBarangJadiItems)} dari ${totalBarangJadiItems} baris`)
                  }
                </span>

                {/* Load Speed Badge - moved next to Text Info */}
                {loadTime !== null && loadTime !== undefined && (
                  <div className={`hidden md:flex text-[9px] px-2 py-1 rounded-full font-bold items-center gap-1.5 border tracking-wide shadow-sm ${
                    loadTime < 300  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                      'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    <span className="animate-pulse">⚡</span>
                    <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
                  </div>
                )}
              </div>

              {/* Center: Pagination Controls */}
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      disabled={activeTab === 'jurnal' ? jurnalPage <= 1 : barangJadiPage <= 1}
                      onClick={() => activeTab === 'jurnal' ? setJurnalPage(1) : setBarangJadiPage(1)}
                      className="w-8 h-8 flex items-center justify-center text-[12px] font-bold border border-gray-100 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 rounded-lg disabled:opacity-30 transition-all shadow-sm"
                      title="Halaman Pertama"
                    >«</button>
                    <button
                      disabled={activeTab === 'jurnal' ? jurnalPage <= 1 : barangJadiPage <= 1}
                      onClick={() => activeTab === 'jurnal' ? setJurnalPage(p => Math.max(1, p - 1)) : setBarangJadiPage(p => Math.max(1, p - 1))}
                      className="w-8 h-8 flex items-center justify-center border border-gray-100 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 rounded-lg disabled:opacity-30 transition-all shadow-sm"
                      title="Halaman Sebelumnya"
                    ><ChevronLeft size={14} /></button>
                  </div>
                  <div className="flex items-center px-4 py-1.5 bg-gray-50/50 border border-gray-100 rounded-full shadow-inner">
                    <span className="text-[11px] font-bold tracking-wide text-gray-400">
                      Hal. <span className="text-gray-800">{activeTab === 'jurnal' ? jurnalPage : barangJadiPage}</span> <span className="mx-1.5 opacity-30">/</span> {activeTab === 'jurnal' ? totalJurnalPages : totalBarangJadiPages}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={activeTab === 'jurnal' ? jurnalPage >= totalJurnalPages : barangJadiPage >= totalBarangJadiPages}
                      onClick={() => activeTab === 'jurnal' ? setJurnalPage(p => Math.min(totalJurnalPages, p + 1)) : setBarangJadiPage(p => Math.min(totalBarangJadiPages, p + 1))}
                      className="w-8 h-8 flex items-center justify-center border border-gray-100 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 rounded-lg disabled:opacity-30 transition-all shadow-sm"
                      title="Halaman Berikutnya"
                    ><ChevronRight size={14} /></button>
                    <button
                      disabled={activeTab === 'jurnal' ? jurnalPage >= totalJurnalPages : barangJadiPage >= totalBarangJadiPages}
                      onClick={() => activeTab === 'jurnal' ? setJurnalPage(totalJurnalPages) : setBarangJadiPage(totalBarangJadiPages)}
                      className="w-8 h-8 flex items-center justify-center text-[12px] font-bold border border-gray-100 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 rounded-lg disabled:opacity-30 transition-all shadow-sm"
                      title="Halaman Terakhir"
                    >»</button>
                  </div>
                </div>
              </div>

              {/* Right Side: Load Speed & Totals */}
              <div className="flex items-center gap-6">
                {/* Totals Section */}
                {(activeTab === 'barang_jadi' || (activeTab === 'jurnal' && selectedPekerjaan)) && (
                  <div className="flex flex-wrap items-center gap-4 border-l border-gray-100 pl-4">
                    {activeTab === 'jurnal' && grandTotalRijek > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold tracking-wide text-rose-400">Total rijek</span>
                        <div className="text-[14px] font-bold tabular-nums tracking-tight text-rose-600">
                          {grandTotalRijek.toLocaleString('id-ID')}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-wide text-gray-500">
                        {activeTab === 'barang_jadi' ? 'Total Masuk' : `Realisasi`}
                      </span>
                      <div className="text-[14px] font-bold tabular-nums tracking-tight text-emerald-600">
                        {activeTab === 'barang_jadi' 
                          ? `${grandTotal.toLocaleString('id-ID')} ${results[0]?.items[0]?.satuan || results[0]?.items[0]?.unit || unit}`
                          : `${grandTotalJurnal.toLocaleString('id-ID')}`
                        }
                      </div>
                    </div>
                  </div>
                )}
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

