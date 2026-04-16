
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, XCircle, Loader2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function MasterPekerjaanUpload() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
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
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { cellFormula: false, cellHTML: false });

      // Target sheet "Pekerjaan-Kode"
      let worksheet = workbook.Sheets['Pekerjaan-Kode'];
      if (!worksheet) {
        const fallback = workbook.SheetNames.find(s => s.toLowerCase().includes('pekerjaan'));
        if (!fallback) throw new Error("Sheet 'Pekerjaan-Kode' tidak ditemukan di dalam file Excel.");
        worksheet = workbook.Sheets[fallback];
      }

      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Determine category per column group based on row index 3
      // Structure: every 4 cols: [null_separator, code, name, target]
      // Headers at row 3 (index 3): [null, "PRA CETAK", "TARGET", null, "PRA CETAK", ...]
      const categoryRow = rawData[3] || [];
      const subCategoryRow = rawData[5] || [];

      // Map column group index to category
      const colGroupCategories: Record<number, string> = {};
      const colGroupSubCategories: Record<number, string> = {};

      for (let col = 0; col < categoryRow.length; col += 4) {
        const catVal = categoryRow[col + 2]; // category header is at offset 2 within the 4-col block
        if (catVal && typeof catVal === 'string' && catVal.trim()) {
          colGroupCategories[col] = catVal.trim();
        }
        const subCatVal = subCategoryRow[col + 2];
        if (subCatVal && typeof subCatVal === 'string' && subCatVal.trim()) {
          colGroupSubCategories[col] = subCatVal.trim();
        }
      }

      // Fill forward categories
      const catKeys = Object.keys(colGroupCategories).map(Number).sort((a,b)=>a-b);
      const subCatKeys = Object.keys(colGroupSubCategories).map(Number).sort((a,b)=>a-b);

      const getCategoryForCol = (col: number) => {
        let cat = '';
        for (const k of catKeys) {
          if (col >= k) cat = colGroupCategories[k];
          else break;
        }
        return cat;
      };
      const getSubCategoryForCol = (col: number) => {
        let sub = '';
        for (const k of subCatKeys) {
          if (col >= k) sub = colGroupSubCategories[k];
          else break;
        }
        return sub;
      };

      // Extract all items
      const items: any[] = [];
      const seenCodes = new Set<string>();

      for (let rowIdx = 0; rowIdx < rawData.length; rowIdx++) {
        const row = rawData[rowIdx];
        if (!row) continue;

        for (let col = 0; col < row.length; col += 4) {
          const code = row[col + 1];
          const name = row[col + 2];
          const target = row[col + 3];

          if (
            code && name &&
            typeof code === 'string' &&
            /\w+\.\w+/.test(code) &&
            typeof name === 'string' &&
            name.trim() &&
            !seenCodes.has(code.trim())
          ) {
            seenCodes.add(code.trim());
            items.push({
              code: code.trim(),
              name: name.trim(),
              category: getCategoryForCol(col),
              subCategory: getSubCategoryForCol(col),
              target: typeof target === 'number' ? target : null,
            });
          }
        }
      }

      if (items.length === 0) {
        throw new Error('Tidak ditemukan data pekerjaan di dalam file. Pastikan menggunakan file yang benar (sheet Pekerjaan-Kode).');
      }

      // Send to API
      const res = await fetch('/api/master-pekerjaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: items }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatus('idle');
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Berhasil mengimpor ${result.imported} data Master Pekerjaan.`,
        });
      } else {
        setStatus('error');
        setMessage(result.error || 'Gagal mengimpor data.');
      }
    } catch (err: any) {
      console.error('Upload Error:', err);
      setStatus('error');
      setMessage(err.message || 'Terjadi kesalahan saat memproses file.');
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white rounded-[8px] border-[1.5px] border-gray-200 p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-300 flex items-center justify-between gap-4 relative z-50 h-full">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-[8px] bg-green-50 flex items-center justify-center shrink-0">
            <Upload className="text-green-600" size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-800 leading-none mb-1">Upload Master Pekerjaan</h3>
            <p className="text-[11px] text-gray-400 font-medium leading-tight">
              Unggah file Excel <strong>060105 MASTER PEKERJAAN.xlsm</strong> — sheet <strong>Pekerjaan-Kode</strong>. Data lama akan digantikan.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <input
            type="file"
            accept=".xls, .xlsx, .xlsm"
            className="hidden"
            ref={fileRef}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={status === 'loading'}
            className="px-4 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-bold rounded-[8px] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
          >
            {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            <span>{status === 'loading' ? 'Mengunggah...' : 'Pilih & Upload Excel'}</span>
          </button>
        </div>

        {status === 'error' && (
          <div className="absolute top-full left-0 right-0 mt-2 p-2.5 bg-red-50 text-red-600 border border-red-100 rounded-[8px] text-[11px] flex items-start gap-2 animate-in slide-in-from-top-1 z-20">
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
          window.dispatchEvent(new Event('sintak:data-updated'));
          localStorage.setItem('sintak_data_updated', Date.now().toString());
          router.refresh();
        }}
      />
    </div>
  );
}
