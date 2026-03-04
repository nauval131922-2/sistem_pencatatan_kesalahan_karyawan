'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, X, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/employees/import', {
        method: 'POST',
        body: formData,
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
        router.refresh();
      } else {
        setStatus('error');
        setMessage(data.error || 'Gagal mengimpor data.');
      }
    } catch {
      setStatus('error');
      setMessage('Terjadi kesalahan koneksi.');
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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 shrink-0">
      <div className="card glass p-3 border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 opacity-5 pointer-events-none">
          <FileSpreadsheet size={120} />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between relative z-10">
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-bold text-slate-800 text-sm flex items-center justify-center md:justify-start gap-2 mb-0.5">
              <Upload className="text-emerald-500" size={16}/>
              Upload Data Karyawan
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
              Unggah file Excel yang berisi Data Karyawan. Data yang lama akan dihapus dan digantikan seluruhnya oleh data dari file baru.
            </p>
          </div>
          <div className="w-full md:w-auto shrink-0">
            <input 
              type="file" 
              accept=".xls, .xlsx, .xlsm"
              className="hidden" 
              ref={fileRef}
              onChange={onFileChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={status === 'loading'}
              className="w-full md:w-[200px] relative px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
            >
              {status === 'loading' && <Loader2 size={15} className="animate-spin" />}
              {status !== 'loading' && <FileSpreadsheet size={15} className="group-hover:scale-110 transition-transform" />}
              <span className="text-xs">{status === 'loading' ? 'Mengunggah...' : 'Pilih & Upload Excel'}</span>
            </button>
          </div>
        </div>

        {status === 'error' && (
          <div className="mt-3 p-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[11px] flex items-start gap-2 animate-in fade-in">
            <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <p>{message}</p>
          </div>
        )}
        
        <ConfirmDialog 
          isOpen={dialog.isOpen}
          type={dialog.type}
          title={dialog.title}
          message={dialog.message}
          onConfirm={() => setDialog(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
}
