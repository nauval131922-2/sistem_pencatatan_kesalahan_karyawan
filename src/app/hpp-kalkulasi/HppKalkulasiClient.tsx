'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, Search, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Hash, Calculator, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';

const PAGE_SIZE = 20;

export default function HppKalkulasiClient() {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const fetchHppData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hpp-kalkulasi?_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        const fetchedData = json.data || [];
        setData(fetchedData);
        
        if (fetchedData.length > 0) {
          const latestDate = new Date(Math.max(...fetchedData.map((r: any) => new Date(r.created_at || new Date()).getTime())));
          if (!isNaN(latestDate.getTime())) {
            const timestamp = latestDate.toLocaleString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            setLastUpdated(timestamp);
          }
        }
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch HPP', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHppData();
    
    // Sync with other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sikka_data_updated') {
        fetchHppData();
        router.refresh();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.xlsm')) {
      setError('Harap masukkan file Excel yang valid (.xlsx, .xls, atau .xlsm)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/hpp-kalkulasi', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || 'Terjadi kesalahan saat mengunggah file.');
      }

      setDialog({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: json.message || 'Data HPP Kalkulasi berhasil diperbarui.'
      });
      localStorage.setItem('sikka_data_updated', Date.now().toString());
      await fetchHppData(); // Refresh table
      router.refresh(); // Refresh page data (like the header timestamps)
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // trigger reset
    }
  };

  // Filter and paginate
  const filteredData = data ? data.filter(d => 
    d.nama_order.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const paginatedData = filteredData.slice(0, visibleCount);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (visibleCount < filteredData.length) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredData.length));
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 overflow-hidden">
      {/* Upload Panel - Compact 1 Row */}
      <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="bg-white border border-gray-200 shadow-sm rounded-[10px] px-4 py-3 flex items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-12 opacity-[0.02] pointer-events-none text-gray-900 group-hover:opacity-[0.04] transition-opacity">
             <FileSpreadsheet size={140} />
          </div>
          
          <div className="flex items-center gap-5 flex-1 relative z-10">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
              <Upload className="text-green-600" size={20} />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-bold text-gray-800 leading-none mb-1">Upload Data HPP Kalkulasi</h3>
              <p className="text-[11px] text-gray-400 font-medium leading-tight">
                Unggah file Excel yang berisi Data HPP Kalkulasi. Data yang lama akan dihapus dan digantikan seluruhnya.
              </p>
            </div>
          </div>

          <div className="shrink-0 relative z-10">
            <input 
              type="file" 
              accept=".xlsx, .xls, .xlsm"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
            >
              {uploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={16} />
              )}
              <span>{uploading ? 'Mengunggah...' : 'Pilih & Upload Excel'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm flex items-start gap-2 animate-in fade-in shrink-0 font-semibold">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      <ConfirmDialog 
        isOpen={dialog.isOpen}
        type={dialog.type as any}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Results View */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
        {data === null && loading ? (
          <div className="flex-1 bg-white border border-gray-100 rounded-[10px] flex flex-col items-center justify-center text-center p-10">
            <Loader2 size={40} className="text-green-500 animate-spin mb-4" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-800">Menghubungkan ke Server...</p>
              <p className="text-xs text-gray-400">Mohon tunggu sebentar, kami sedang menyiapkan data.</p>
            </div>
          </div>
        ) : data !== null && data.length === 0 && !loading ? (
          <div className="flex-1 bg-white border border-gray-200 rounded-[10px] flex flex-col items-center justify-center text-center p-20 shadow-sm border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-5">
              <Calculator className="text-gray-200" size={32} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">Belum ada data HPP yang diunggah</h3>
            <p className="text-[12px] text-gray-400 max-w-[260px] mx-auto leading-relaxed font-medium">
              Gunakan tombol upload di atas untuk memasukkan data dari Excel.
            </p>
          </div>
        ) : data !== null && data.length > 0 && (
          <>
            {/* Section Title & Search */}
            <div className="flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-extrabold text-gray-800 flex items-center gap-2">
                    <Calculator size={18} className="text-green-600" />
                    <span>Data HPP Kalkulasi</span>
                </h3>
              </div>
              
              <div className="relative w-full group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Cari berdasarkan nama order..." 
                  className="w-full pl-12 pr-4 h-12 bg-white border border-gray-200 rounded-[14px] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-[10px] overflow-hidden flex-1 flex flex-col min-h-0 relative">
              <div className="overflow-auto custom-scrollbar flex-1 min-h-0" onScroll={handleScroll}>
                <table className="w-full text-left relative border-collapse">
                  <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                    <tr className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                      <th className="px-5 py-3.5 w-16 text-center">No.</th>
                      <th className="px-5 py-3.5">Nama Order</th>
                      <th className="px-5 py-3.5 text-right w-[180px]">HPP Kalkulasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-20 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                             <Search className="text-gray-100 mb-2" size={40} />
                             <p className="text-[13px] font-bold text-gray-400 italic">Data "{searchQuery}" tidak ditemukan.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-green-50/30 transition-colors even:bg-[#f9fafb] group h-10">
                          <td className="px-5 py-1 text-gray-400 text-center font-bold text-[11px] tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="px-5 py-1 font-bold text-gray-700 text-[13px]">
                             <div className="truncate max-w-2xl xl:max-w-4xl" title={row.nama_order}>{row.nama_order}</div>
                          </td>
                          <td className="px-5 py-1 font-extrabold text-gray-800 text-right whitespace-nowrap text-[13px] tabular-nums">
                            {row.hpp_kalkulasi.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Footer info Banner outside the card for consistency */}
            <div className="flex items-center justify-start shrink-0">
              <span className="text-[12px] font-bold text-gray-400">
                 {filteredData.length === 0
                   ? 'Tidak ada data'
                   : `Menampilkan ${paginatedData.length} dari ${filteredData.length} data kalkulasi`}
              </span>
              {loading && visibleCount < filteredData.length && (
                <div className="flex items-center gap-2 text-green-600 font-bold text-[11px] animate-pulse ml-4">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Memuat hal. berikutnya...</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
