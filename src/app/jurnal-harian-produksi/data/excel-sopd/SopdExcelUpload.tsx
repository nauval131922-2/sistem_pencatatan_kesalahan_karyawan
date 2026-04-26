'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import ExcelUploadCard from '@/components/ExcelUploadCard';

export default function SopdExcelUpload() {
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

      // Target Sheet "03 SOPd"
      let worksheet = workbook.Sheets['03 SOPd'];
      if (!worksheet) {
        // Fallback jika tidak ada persis, cari yang mengandung nama SOPd
        const fallbackName = workbook.SheetNames.find(s => s.toLowerCase().includes('sopd'));
        if (!fallbackName) throw new Error("Sheet '03 SOPd' tidak ditemukan di dalam file Excel.");
        worksheet = workbook.Sheets[fallbackName];
      }

      // Baris 5 adalah header, index = 4
      let rawData = XLSX.utils.sheet_to_json(worksheet, { range: 4, defval: "" });

      if (rawData.length === 0) {
        throw new Error("File Excel kosong atau format tidak sesuai.");
      }

      // Map dynamic header columns
      const mappedData = rawData.map((row: any) => {
        // Helper regex/includes to find exact long headers like 'No_SOPd ❶a'
        const findKey = (searchStr: string) => {
          const keys = Object.keys(row);
          return keys.find(k => k.toLowerCase().includes(searchStr.toLowerCase()));
        };

        const keyNoSopd = findKey('No_SOPd');
        const keyTgl = findKey('Tgl') || findKey('Tanggal');
        const keyNamaOrder = findKey('Nama_Order') || findKey('Nama Order');
        const keyQty = findKey('Qty SOPd') || findKey('Qty');
        const keyUnit = findKey('Unit PO') || findKey('Unit');

        // Format Date if exists
        let tglValue = "";
        if (keyTgl && row[keyTgl]) {
            let rawTgl = row[keyTgl];
            let dateObj: Date | null = null;
            
            if (rawTgl instanceof Date) {
              dateObj = rawTgl;
            } else if (typeof rawTgl === 'number') {
              // Handle Excel Serial Date
              dateObj = new Date(Math.round((rawTgl - 25569) * 86400 * 1000));
            } else if (typeof rawTgl === 'string' && /^\d+$/.test(rawTgl)) {
              // Handle stringified number
              dateObj = new Date(Math.round((parseInt(rawTgl) - 25569) * 86400 * 1000));
            }

            if (dateObj && !isNaN(dateObj.getTime())) {
                const d = dateObj.getDate().toString().padStart(2, '0');
                const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                const y = dateObj.getFullYear();
                tglValue = `${d}-${m}-${y}`;
            } else {
                tglValue = String(rawTgl);
            }
        }

        return {
          no_sopd: keyNoSopd ? row[keyNoSopd] : "",
          tgl: tglValue,
          nama_order: keyNamaOrder ? row[keyNamaOrder] : "",
          qty_sopd: keyQty ? row[keyQty] : 0,
          unit: keyUnit ? row[keyUnit] : ""
        };
      }).filter((item) => {
        // Buang jika baris kosong
        if (!item.no_sopd && !item.nama_order) return false;
        
        // Buang jika isinya adalah teks header (untuk membersihkan noise)
        const isHeaderText = 
          item.no_sopd?.toString().toLowerCase().includes('no') && 
          item.no_sopd?.toString().toLowerCase().includes('sopd');
          
        const isHeaderNama = 
          item.nama_order?.toString().toLowerCase().includes('nama') && 
          item.nama_order?.toString().toLowerCase().includes('order');

        return !isHeaderText && !isHeaderNama;
      }); 

      if (mappedData.length === 0) {
        throw new Error("Tidak dapat menemukan data pada baris yang dipindai.");
      }

      // 3. SEND TO API
      const res = await fetch('/api/sopd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          data: mappedData
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('idle');
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Berhasil mengimpor ${data.imported} data SOPd.`
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
  };

  return (
    <div className="h-full flex flex-col shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <ExcelUploadCard
        title="Upload Data SOPd"
        description="Unggah file Excel untuk sinkronisasi Data Order Produksi. Sistem akan memperbarui daftar order berdasarkan versi file terbaru."
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











