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
      const res = await fetch('/api/hpp-kalkulasi');
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
    <div className="h-full flex flex-col gap-4">
      {/* Upload Panel */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-xl px-5 py-4 relative overflow-hidden shrink-0">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 opacity-[0.03] pointer-events-none text-gray-400">
           <FileSpreadsheet size={160} />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-sm font-semibold text-gray-700">
                Upload Data HPP Kalkulasi
              </h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
              Unggah file Excel yang berisi Data HPP Kalkulasi. Data yang lama akan dihapus dan digantikan seluruhnya oleh data dari file baru.
            </p>
          </div>
          <div className="w-full md:w-auto shrink-0 flex flex-col gap-2">
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
              className="w-full relative px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden text-sm"
            >
              {uploading && <Loader2 size={16} className="animate-spin" />}
              {!uploading && <FileSpreadsheet size={16} className="group-hover:scale-110 transition-transform" />}
              <span>{uploading ? 'Mengunggah...' : 'Pilih & Upload File'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      <ConfirmDialog 
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Results View */}
      {data === null && loading && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl py-24 text-center flex flex-col items-center justify-center shrink-0">
          <Loader2 size={48} className="mb-4 opacity-20 text-green-600 animate-spin" />
          <p className="font-medium text-gray-600">Sedang memuat data...</p>
        </div>
      )}

      {data !== null && data.length === 0 && !loading && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl py-20 text-center flex flex-col items-center justify-center shrink-0">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Calculator className="text-gray-100" size={32} />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Belum ada data HPP yang diunggah</h3>
          <p className="text-xs text-gray-400 max-w-[240px] mx-auto leading-relaxed">
            Gunakan tombol upload di atas untuk memasukkan data dari Excel.
          </p>
        </div>
      )}

      {data !== null && data.length > 0 && (
        <div className="flex-1 min-h-0 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                Data HPP Kalkulasi
            </h3>
            
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari berdasarkan nama order..." 
                className="w-full pr-10 pl-4 h-9 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-sm"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
              />
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-0 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto custom-scrollbar relative" onScroll={handleScroll}>
              <table className="w-full text-left relative min-w-[500px]">
                <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm">
                  <tr className="text-[11px] uppercase tracking-wider text-gray-400 font-medium border-b border-gray-100">
                    <th className="px-5 py-3 w-16 text-center">No</th>
                    <th className="px-5 py-3">Nama Order</th>
                    <th className="px-5 py-3 text-right">HPP Kalkulasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-gray-400 italic text-sm">
                        Data "{searchQuery}" tidak ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-5 py-3 text-gray-400 text-center text-xs w-10">
                          {idx + 1}
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-700 text-sm">
                           <div className="truncate max-w-md" title={row.nama_order}>{row.nama_order}</div>
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-700 text-right whitespace-nowrap text-sm">
                          {row.hpp_kalkulasi.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer info Banner within Card Bottom */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-400 shrink-0">
             <span className="font-medium">
               {filteredData.length === 0
                 ? 'Tidak ada data'
                 : `Menampilkan ${paginatedData.length} dari ${filteredData.length} data kalkulasi`}
             </span>
           </div>
          </div>
        </div>
      )}
    </div>
  );
}
