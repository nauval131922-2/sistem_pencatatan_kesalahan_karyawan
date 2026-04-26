'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, XCircle, Loader2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function HppKalkulasiExcelUpload() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = async (file: File) => {
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xls', 'xlsx', 'xlsm'].includes(ext || '')) {
      setStatus('error');
      setMessage('Format file tidak didukung. Gunakan .xls, .xlsx, atau .xlsm');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      // 1. IMPORT XLSX (Dynamic import)
      const XLSX = await import('xlsx');
      
      // 2. READ FILE
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        cellFormula: false,
        cellHTML: false,
        cellStyles: false,
        cellText: false,
        cellDates: false
      });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (rawData.length === 0) {
        throw new Error("File Excel kosong atau format tidak sesuai.");
      }

      // 3. SEND TO API
      const res = await fetch('/api/hpp-kalkulasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          data: rawData
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('idle');
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Berhasil mengimpor ${data.imported} data HPP Kalkulasi.`
        });
      } else {
        setStatus('error');
        setMessage(data.error || data.details || 'Gagal mengimpor data.');
      }
    } catch (err: any) {
      console.error('Upload Error:', err);
      setStatus('error');
      setMessage(err.message || 'Terjadi kesalahan saat memproses file.');
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative bg-white border border-gray-100 shadow-sm shadow-green-900/5 rounded-xl px-6 py-4 flex items-center justify-between gap-6 z-50">
        <div className="flex items-center gap-5 flex-1">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Upload size={24} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-800 leading-none mb-1.5 tracking-tight">Upload HPP Kalkulasi</h3>
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
              Unggah file Excel yang berisi HPP Kalkulasi. Data yang lama akan digantikan seluruhnya secara otomatis.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <input 
            type="file" 
            accept=".xls, .xlsx, .xlsm"
            className="hidden" 
            ref={fileRef}
            onChange={onFileChange}
          />
          <button
            onClick={() => {
              if (fileRef.current) fileRef.current.value = '';
              fileRef.current?.click();
            }}
            disabled={status === 'loading'}
            className="px-6 h-11 bg-green-600 hover:bg-green-700 text-white text-[13px] font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-green-100 tracking-wide"
          >
            {status === 'loading' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={18} />
            )}
            <span>{status === 'loading' ? 'Mengunggah...' : 'Pilih & Upload Excel'}</span>
          </button>
        </div>

        {status === 'error' && (
          <div className="absolute top-full left-0 right-0 mt-3 p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg shadow-sm shadow-rose-900/5 text-[11px] font-bold flex items-start gap-3 animate-in slide-in-from-top-2 z-20 uppercase tracking-widest">
            <XCircle className="w-4 h-4 shrink-0" />
            <p>{message}</p>
          </div>
        )}
      </div>

      <ConfirmDialog 
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => {
          setDialog(prev => ({ ...prev, isOpen: false }));
          window.dispatchEvent(new Event('sintak:data-updated'));
          localStorage.setItem('sintak_data_updated', Date.now().toString());
          router.refresh();
        }}
      />
    </div>
  );
}

















