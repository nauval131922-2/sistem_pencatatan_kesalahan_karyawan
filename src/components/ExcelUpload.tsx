'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExcelUpload() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dragging, setDragging] = useState(false);
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
        setStatus('success');
        setMessage(`Berhasil mengimpor ${data.imported} karyawan.`);
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
    <div className="card space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <FileSpreadsheet size={18} />
        </div>
        <div>
          <h4 className="font-semibold text-sm">Import dari Excel</h4>
          <p className="text-xs text-slate-500">Nama Karyawan &amp; Jabatan</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragging
            ? 'border-emerald-400 bg-emerald-500/10'
            : 'border-white/10 hover:border-emerald-500/40 hover:bg-white/5'
          }
        `}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xls,.xlsx,.xlsm"
          className="hidden"
          onChange={onFileChange}
        />

        {status === 'loading' ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin text-emerald-400" />
            <p className="text-sm">Memproses file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Upload size={28} className={dragging ? 'text-emerald-400' : 'opacity-40'} />
            <div>
              <p className="text-sm font-medium">Klik atau drag & drop file Excel</p>
              <p className="text-xs text-slate-500 mt-1">.xls / .xlsx / .xlsm</p>
            </div>
          </div>
        )}
      </div>

      {/* Result message */}
      {status === 'success' && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle size={16} className="shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <XCircle size={16} className="shrink-0" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
