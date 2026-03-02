'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, Search, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Hash, Calculator, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';

const PAGE_SIZE = 5;

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
  const [page, setPage] = useState(1);
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
  }, []);

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

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Upload Panel */}
      <div className="card glass p-6 border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 opacity-5 pointer-events-none">
           <FileSpreadsheet size={200} />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-2">
              <Upload className="text-emerald-500" size={20}/>
              Upload Data HPP Kalkulasi
            </h3>
            <p className="text-sm text-slate-500">
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
              className="w-full relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
            >
              {uploading && <Loader2 size={18} className="animate-spin" />}
              {!uploading && <FileSpreadsheet size={18} className="group-hover:scale-110 transition-transform" />}
              <span>{uploading ? 'Mengunggah File...' : 'Pilih & Upload File Excel'}</span>
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
        <div className="card text-center py-24 text-slate-500 flex flex-col items-center bg-slate-50/50 border-dashed">
          <Loader2 size={48} className="mb-4 opacity-20 text-emerald-600 animate-spin" />
          <p className="font-medium text-slate-600">Sedang memuat data...</p>
        </div>
      )}

      {data !== null && data.length === 0 && !loading && (
        <div className="card text-center py-20 text-slate-500 flex flex-col items-center border-dashed">
          <Calculator size={48} className="mb-4 opacity-20 text-slate-400" />
          <p className="font-medium text-slate-600">Belum ada data HPP yang diunggah.</p>
          <p className="text-sm mt-1">Gunakan tombol upload di atas untuk memasukkan data dari Excel.</p>
        </div>
      )}

      {data !== null && data.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-base">
              <Calculator size={18} className="text-emerald-500" /> Data HPP Kalkulasi
            </h3>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama order..." 
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-auto" style={{ maxHeight: '450px' }}>
              <table className="w-full text-left relative">
                <thead className="sticky top-0 z-10">
                  <tr className="text-slate-500 text-sm border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-3 font-medium whitespace-nowrap w-20 text-center">No</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Nama Order</th>
                    <th className="px-5 py-3 font-medium text-right whitespace-nowrap w-48">HPP Kalkulasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-500 italic text-sm">
                        Data "{searchQuery}" tidak ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row, idx) => (
                      <tr key={row.id} className="text-sm hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-slate-400 font-medium text-center">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-700">
                           {row.nama_order}
                        </td>
                        <td className="px-5 py-3 font-mono font-medium text-emerald-600 text-right whitespace-nowrap">
                          {row.hpp_kalkulasi.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              {filteredData.length === 0
                ? 'Tidak ada data'
                : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredData.length)} dari ${filteredData.length} data`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number|string)[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="px-2">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        currentPage === p
                          ? 'bg-emerald-500 text-white border border-emerald-600'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
