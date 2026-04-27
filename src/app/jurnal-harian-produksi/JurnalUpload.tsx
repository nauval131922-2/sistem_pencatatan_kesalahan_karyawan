'use client';

import { useState, useRef } from 'react';
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
    setMessage('Membaca file Excel (proses ini mungkin memakan waktu)...');

    try {
      // Memberi jeda agar UI sempat me-render status 'Membaca file Excel...' sebelum main thread diblokir oleh XLSX
      await new Promise(resolve => setTimeout(resolve, 50));

      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        cellFormula: false,
        cellHTML: false,
        cellStyles: false,
        cellText: false,
        cellDates: false
      });

      const sheetName = 'JURNAL';
      let worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        throw new Error(`Sheet '${sheetName}' tidak ditemukan di dalam file Excel.`);
      }

      // Ambil data sebagai array of arrays
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];

      if (rawData.length === 0) {
        throw new Error("File Excel kosong atau format tidak sesuai.");
      }

      // Kirim seluruh data mentah (termasuk header) ke server agar bisa dideteksi secara dinamis
      const mappedData = rawData.filter((row: any) => row && Array.isArray(row) && row.length > 0);

      if (mappedData.length === 0) {
        throw new Error("Tidak dapat menemukan data transaksi pada baris yang dipindai.");
      }

      // Temukan baris header agar bisa disertakan di setiap chunk (jika format dinamis)
      let headerRow = mappedData[0];
      for (let i = 0; i < Math.min(mappedData.length, 20); i++) {
        if (mappedData[i] && mappedData[i].includes('Tanggal') && mappedData[i].includes('Nama Karyawan')) {
          headerRow = mappedData[i];
          break;
        }
      }

      const CHUNK_SIZE = 2500;
      const totalChunks = Math.ceil(mappedData.length / CHUNK_SIZE);
      let totalImported = 0;

      for (let i = 0; i < totalChunks; i++) {
        let chunkData = mappedData.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        
        // Sisipkan header ke chunk ke-2 dan seterusnya agar API bisa mendeteksi kolom
        if (i > 0) {
          chunkData = [headerRow, ...chunkData];
        }

        setMessage(`Mengunggah bagian ${i + 1} dari ${totalChunks}...`);
        
        // Jeda sangat singkat (10ms) untuk melepaskan thread utama agar React bisa me-render pesan "Mengunggah..." ke layar
        await new Promise(resolve => setTimeout(resolve, 10));

        const res = await fetch('/api/jurnal-harian-produksi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name,
            data: chunkData,
            chunkIndex: i,
            totalChunks
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || data.details || `Gagal mengimpor data pada bagian ${i + 1}.`);
        }

        totalImported += (data.importedCount || 0);
      }

      setStatus('idle');
      setDialog({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: `Berhasil mengimpor ${totalImported} data Jurnal Harian Produksi.`
      });

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
        description="Unggah file Excel (Sheet JURNAL) untuk sinkronisasi Data Jurnal Harian Produksi."
        status={status}
        errorMessage={message}
        onFileSelect={handleFile}
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



