'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, X, Clock } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import ExcelUploadCard from './ExcelUploadCard';

export default function ExcelUpload() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [currentRows, setCurrentRows] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });
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
    setMessage('Membaca data karyawan...');
    const startTimeInternal = Date.now();
    setStartTime(startTimeInternal);
    setProgress(0);
    setTotalRows(0);
    setCurrentRows(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Path worker relatif terhadap komponen (Next.js URL constructor)
      const worker = new Worker(new URL('../app/employees/employee-worker.ts', import.meta.url));
      
      worker.postMessage({ 
        arrayBuffer, 
        filename: file.name,
        origin: window.location.origin
      });

      worker.onmessage = (e) => {
        const { type, message: msg, error, totalImported, totalRows: rowsTotal, currentRows: rowsCurrent, progress: p } = e.data;

        if (type === 'status') {
          setMessage(msg);
          if (rowsTotal) setTotalRows(rowsTotal);
          if (rowsCurrent) setCurrentRows(rowsCurrent);
          if (p !== undefined) setProgress(p);
        } else if (type === 'done') {
          setStatus('idle');
          const finalDuration = formatTime(Math.floor((Date.now() - startTimeInternal) / 1000));
          setDialog({
            isOpen: true,
            type: 'success',
            title: 'Berhasil',
            message: `Berhasil mengimpor ${totalImported} data karyawan dalam waktu ${finalDuration}.`
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
        setMessage('Terjadi kesalahan fatal pada sistem background.');
        worker.terminate();
      };
    } catch (err: any) {
      console.error('Upload Error:', err);
      setStatus('error');
      setMessage('Terjadi kesalahan saat memproses file.');
    }
  };

  return (
    <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <ExcelUploadCard
        title="Upload Data Karyawan"
        description={status === 'loading' ? `Durasi: ${formatTime(elapsedTime)}` : "Unggah file Excel yang berisi Data Karyawan. Data yang lama akan dinonaktifkan secara otomatis."}
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
          localStorage.setItem('sintak_data_updated', Date.now().toString());
          router.refresh();
        }}
      />
    </div>
  );
}

















