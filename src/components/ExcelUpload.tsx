'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExcelUpload() {
  const [isOpen, setIsOpen] = useState(false);
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
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <FileSpreadsheet size={16} />
        Import Data
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
            
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-800">Import Karyawan</h4>
                  <p className="text-sm text-slate-500">Format: .xls, .xlsx, .xlsm</p>
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
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
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
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                    <p className="text-sm font-medium">Memproses file...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Upload size={28} className={dragging ? 'text-emerald-500' : 'text-slate-400'} />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Klik atau seret & lepas file ke sini</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Result message */}
              {status === 'success' && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  <CheckCircle size={18} className="shrink-0" />
                  <span className="font-medium">{message}</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  <XCircle size={18} className="shrink-0" />
                  <span className="font-medium">{message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
