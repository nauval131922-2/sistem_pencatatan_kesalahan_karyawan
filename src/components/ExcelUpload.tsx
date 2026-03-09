'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, X, Clock } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

export default function ExcelUpload() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
   const [dragging, setDragging] = useState(false);
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
      const res = await fetch('/api/employees/import-raw', {
        method: 'POST',
        headers: {
          'x-filename': file.name,
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file, // Send file directly as raw binary
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('idle');
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Berhasil mengimpor ${data.imported} karyawan.`
        });
      } else {
        setStatus('error');
        setMessage(data.error || data.message || 'Gagal mengimpor data.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage('Terjadi kesalahan koneksi atau sistem.');
    }
    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500 mb-2">
      <div className="bg-white border border-gray-200 shadow-sm rounded-[10px] px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Upload className="text-green-600" size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-800 leading-none mb-1">Upload Data Karyawan</h3>
            <p className="text-[11px] text-gray-400 font-medium leading-tight">
              Unggah file Excel yang berisi Data Karyawan. Data yang lama akan dihapus dan digantikan seluruhnya.
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
            className="px-4 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
          >
            {status === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={16} />
            )}
            <span>{status === 'loading' ? 'Mengunggah...' : 'Pilih & Upload Excel'}</span>
          </button>
        </div>

        {status === 'error' && (
          <div className="absolute top-full left-0 right-0 mt-2 p-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[11px] flex items-start gap-2 animate-in slide-in-from-top-1 z-20">
            <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <p className="font-medium">{message}</p>
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
          localStorage.setItem('sikka_data_updated', Date.now().toString());
          router.refresh();
        }}
      />
    </div>
  );
}
