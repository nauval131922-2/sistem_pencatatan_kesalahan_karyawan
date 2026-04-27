'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import ExcelUploadCard from '@/components/ExcelUploadCard';

export default function JurnalUpload() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [currentRows, setCurrentRows] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const router = useRouter();

  // Timer effect
  useEffect(() => {
    let interval: any;
    if (status === 'loading' && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (status !== 'loading') {
      setElapsedTime(0);
      setStartTime(null);
    }
    return () => clearInterval(interval);
  }, [status, startTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xls', 'xlsx', 'xlsm'].includes(ext || '')) {
      setStatus('error');
      setMessage('Format file tidak didukung. Gunakan .xls, .xlsx, atau .xlsm');
      return;
    }

    setStatus('loading');
    setMessage('Membaca file Excel (proses ini mungkin memakan waktu)...');
    setStartTime(Date.now());
    setProgress(0);
    setTotalRows(0);
    setCurrentRows(0);

    try {
      // Memberi jeda agar UI sempat me-render status 'Membaca file Excel...' sebelum main thread diblokir oleh XLSX
      await new Promise(resolve => setTimeout(resolve, 50));

      // Menggunakan Web Worker agar seluruh proses berat berjalan di background
      const arrayBuffer = await file.arrayBuffer();
      const worker = new Worker(new URL('./excel-worker.ts', import.meta.url));
      
      worker.postMessage({ 
        arrayBuffer, 
        filename: file.name,
        origin: window.location.origin
      });

      worker.onmessage = (e) => {
        const { type, message, error, totalImported, totalRows: rowsTotal, currentRows: rowsCurrent, progress: p } = e.data;

        if (type === 'status') {
          setMessage(message);
          if (rowsTotal) setTotalRows(rowsTotal);
          if (rowsCurrent) setCurrentRows(rowsCurrent);
          if (p !== undefined) setProgress(p);
        } else if (type === 'done') {
          setStatus('idle');
          setDialog({
            isOpen: true,
            type: 'success',
            title: 'Berhasil',
            message: `Berhasil mengimpor ${totalImported} data Jurnal Harian Produksi.`
          });
          worker.terminate();
        } else if (type === 'error') {
          setStatus('error');
          setMessage(error || 'Gagal memproses file Excel');
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        console.error('Worker Error:', err);
        setStatus('error');
        setMessage('Terjadi kesalahan fatal pada sistem upload background.');
        worker.terminate();
      };

    } catch (err: any) {
      console.error('Upload Error:', err);
      setStatus('error');
      setMessage(err.message || 'Terjadi kesalahan saat memproses file.');
    }
  };

  return (
    <div className="h-full flex flex-col shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <ExcelUploadCard
        title="Upload Jurnal Harian"
        description={status === 'loading' ? `Durasi: ${formatTime(elapsedTime)}` : "Unggah file Excel (Sheet JURNAL) untuk sinkronisasi Data Jurnal Harian Produksi."}
        status={status}
        errorMessage={message}
        onFileSelect={handleFile}
        progress={progress}
        currentRows={currentRows}
        totalRows={totalRows}
      />

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



