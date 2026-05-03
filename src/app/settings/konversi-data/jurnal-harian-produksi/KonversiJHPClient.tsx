'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import ExcelUploadCard from '@/components/ExcelUploadCard';
import { AlertTriangle, FileSpreadsheet, Info } from 'lucide-react';

export default function KonversiJHPClient() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false, type: 'success', title: '', message: ''
  });
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [currentRows, setCurrentRows] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const router = useRouter();

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
    const startTimeInternal = Date.now();
    setStartTime(startTimeInternal);
    setProgress(0);
    setTotalRows(0);
    setCurrentRows(0);

    try {
      await new Promise(resolve => setTimeout(resolve, 50));

      const arrayBuffer = await file.arrayBuffer();
      const worker = new Worker(
        new URL('../../../jurnal-harian-produksi/excel-worker.ts', import.meta.url)
      );

      worker.postMessage({ arrayBuffer, filename: file.name, origin: window.location.origin }, [arrayBuffer]);

      worker.onmessage = (e) => {
        const { type, message, error, totalImported, totalRows: rowsTotal, currentRows: rowsCurrent, progress: p } = e.data;

        if (type === 'status') {
          setMessage(message);
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
            message: `Berhasil mengimpor ${totalImported} data Jurnal Harian Produksi dalam waktu ${finalDuration}.`
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
    <div className="flex flex-col gap-6">
      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle size={20} className="text-amber-600" />
        </div>
        <div>
          <h4 className="text-[13px] font-bold text-amber-800 mb-1">Perhatian — Fitur Cut-off Data</h4>
          <p className="text-[12px] text-amber-700 leading-relaxed">
            Upload file Excel di sini akan <strong>menghapus seluruh data Jurnal Harian Produksi</strong> yang ada di sistem dan menggantinya dengan isi file yang diupload.
            Gunakan fitur ini hanya saat proses cut-off data (misal: migrasi data historis sebelum Juni 2026).
            Setelah cut-off selesai, input data jurnal harian dilakukan langsung di halaman Jurnal Harian Produksi.
          </p>
        </div>
      </div>

      {/* Info cara penggunaan */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <Info size={20} className="text-blue-600" />
        </div>
        <div>
          <h4 className="text-[13px] font-bold text-blue-800 mb-2">Cara Penggunaan</h4>
          <ol className="text-[12px] text-blue-700 leading-relaxed list-decimal list-inside space-y-1">
            <li>Pastikan file Excel memiliki sheet bernama <strong>JURNAL</strong></li>
            <li>Sheet harus memiliki baris header yang mengandung kolom <strong>Tanggal</strong> dan <strong>Nama Karyawan</strong></li>
            <li>Upload file Excel (.xls, .xlsx, atau .xlsm)</li>
            <li>Tunggu proses selesai — data lama akan diganti otomatis</li>
          </ol>
        </div>
      </div>

      {/* Upload Card */}
      <div className="h-[120px] shrink-0">
        <ExcelUploadCard
          title="Upload Jurnal Harian Produksi"
          description={status === 'loading' ? `Durasi: ${formatTime(elapsedTime)}` : "Unggah file Excel (Sheet JURNAL) untuk mengganti seluruh data Jurnal Harian Produksi."}
          status={status}
          errorMessage={message}
          onFileSelect={handleFile}
          progress={progress}
          currentRows={currentRows}
          totalRows={totalRows}
        />
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => {
          setDialog(prev => ({ ...prev, isOpen: false }));
          router.refresh();
        }}
      />
    </div>
  );
}
