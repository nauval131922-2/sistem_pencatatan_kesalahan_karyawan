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
      // 1. IMPORT XLSX (Dynamic import to keep bundle small)
      const XLSX = await import('xlsx');
      
      // 2. READ FILE LOCALLY
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        cellFormula: false,
        cellHTML: false,
        cellStyles: false,
        cellText: false,
        cellDates: false
      });

      const SHEET_NAME = 'A.DATA KARYAWAN';
      if (!workbook.SheetNames.includes(SHEET_NAME)) {
        setStatus('error');
        setMessage(`Sheet "${SHEET_NAME}" tidak ditemukan.`);
        return;
      }

      const sheet = workbook.Sheets[SHEET_NAME];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      // 3. SEND PARSED DATA (JSON) TO API
      // We only send the rows, which is MUCH smaller than the original file
      const res = await fetch('/api/employees/import-raw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          rows: rows
        }),
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
      console.error('Upload Error:', err);
      setStatus('error');
      setMessage('Terjadi kesalahan saat membaca file atau koneksi.');
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
    <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative bg-white border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] rounded-none px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-none bg-[#fde047] border-[2px] border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center shrink-0">
            <Upload className="text-black" size={20} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-black leading-none mb-1 uppercase tracking-tight">Upload Data Karyawan</h3>
            <p className="text-[11px] text-gray-600 font-bold leading-tight">
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
            className="px-4 h-10 bg-[var(--accent-primary)] hover:bg-[#ff4444] text-white text-[13px] font-black rounded-none border-[3px] border-black transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none uppercase tracking-wide"
          >
            {status === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={16} strokeWidth={2.5} />
            )}
            <span>{status === 'loading' ? 'Mengunggah...' : 'Pilih & Upload Excel'}</span>
          </button>
        </div>

        {status === 'error' && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-[#ff5e5e] text-white border-[3px] border-black rounded-none text-[11px] flex items-start gap-2 animate-in slide-in-from-top-1 z-20 shadow-[2.5px_2.5px_0_0_#000]">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.5} />
            <p className="font-black">{message}</p>
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
          localStorage.setItem('sintak_data_updated', Date.now().toString());
          router.refresh();
        }}
      />
    </div>
  );
}














