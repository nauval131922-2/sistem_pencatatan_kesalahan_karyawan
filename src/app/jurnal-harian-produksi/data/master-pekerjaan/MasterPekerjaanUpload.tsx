
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
      const workbook = XLSX.read(arrayBuffer, { 
        cellFormula: false, 
        cellHTML: false,
        cellNF: true,
        cellText: true
      });

      // Target sheet "Pekerjaan-Kode"
      let worksheet = workbook.Sheets['Pekerjaan-Kode'];
      if (!worksheet) {
        const fallback = workbook.SheetNames.find(s => s.toLowerCase().includes('pekerjaan'));
        if (!fallback) throw new Error("Sheet 'Pekerjaan-Kode' tidak ditemukan di dalam file Excel.");
        worksheet = workbook.Sheets[fallback];
      }

      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: true });
      const formattedData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });

      // --- Strategy: scan every cell in every row looking for cells matching
      // the pekerjaan code pattern (e.g. D.a.a.01, B.a.01, etc.)
      // When found, read the surrounding cells to extract all relevant fields.
      //
      // Excel column structure per group (approx, varies by category):
      //   col+0 : separator / null
      //   col+1 : CODE  (e.g. D.a.a.01)
      //   col+2 : NAME  (nama pekerjaan)
      //   col+3..+9 : KTT-1..7 (individual targets — skip)
      //   col+10 : JUMLAH TARGET PER HARI  (or: TARGET PER HARI)
      //   col+11 : TARGET Per JAM
      // Build header label map from row index 5 (sub-header row, 0-based)
      const headerRow: any[] = rawData[5] || [];
      const colLabel: Record<number, string> = {};
      for (let c = 0; c < headerRow.length; c++) {
        const v = headerRow[c];
        if (v && typeof v === 'string' && v.trim()) {
          colLabel[c] = v.trim().toUpperCase().replace(/\s+/g, ' ');
        }
      }

      // === Auto-detect category rows ===
      // Scan early rows to find which rows contain the known category names.
      // This is robust and does NOT rely on hardcoded row indices.
      const KNOWN_CATEGORIES = ['PRA CETAK', 'QUALITY CONTROL', 'CETAK', 'PASCA CETAK', 'GUDANG', 'TEHNISI'];

       let categoryRowData: any[]     = [];
       let subCategoryRowData: any[]  = [];
       let groupRowData: any[]        = [];

       // 1. Extreme flexible row detection
       for (let r = 0; r < Math.min(20, rawData.length); r++) {
         const row = rawData[r] || [];
         const rowStrings = row.map(v => v ? String(v).trim() : '');
         const upperVals = rowStrings.map(v => v.toUpperCase());
         
         // Cari baris Kategori (Level 1)
         const catMatch = KNOWN_CATEGORIES.find(cat => 
           upperVals.some(v => v === cat || v.startsWith(cat + " ") || v.includes(" " + cat))
         );
         if (catMatch && categoryRowData.length === 0) {
           categoryRowData = row;
           continue;
         }

         // Cari baris Sub-Kategori (Level 2)
         // Biasanya baris yang punya pola prefix 2 tingkat (misal A.a atau 1.1)
         const hasSubPattern = rowStrings.some(v => /^[A-Z0-9]\.[a-z0-9]\.?$/i.test(v));
         if (hasSubPattern && subCategoryRowData.length === 0 && row !== categoryRowData) {
           subCategoryRowData = row;
           continue;
         }

         // Cari baris Grup (Level 3)
         // Biasanya baris yang punya pola prefix 3 tingkat (misal A.a.a atau 1.1.1)
         const hasGroupPattern = rowStrings.some(v => /^[A-Z0-9]\.[a-z0-9]\.[a-z0-9]\.?$/i.test(v));
         if (hasGroupPattern && groupRowData.length === 0 && row !== categoryRowData && row !== subCategoryRowData) {
           groupRowData = row;
           continue;
         }
       }

       // Fallback: Jika Sub atau Grup belum ketemu, gunakan baris tepat di bawah kategori
       if (categoryRowData.length > 0) {
         const catIdx = rawData.indexOf(categoryRowData);
         if (subCategoryRowData.length === 0) subCategoryRowData = rawData[catIdx + 1] || [];
         if (groupRowData.length === 0)    groupRowData    = rawData[catIdx + 4] || [];
       }

      // Build fill-forward maps from detected rows
      const COL_HEADER_KEYWORDS = ['TARGET', 'KTT', 'EFEKTIF', 'KETERANGAN', 'STANDART', 'PERSIAPAN',
        'WAKTU', 'UNIT', 'JUMLAH', 'GOSOK', 'SPEED', 'NO.', 'NAMA', 'KODE', 'ASUMSI'];

      const isColHeader = (v: string) => {
        const u = v.toUpperCase();
        return COL_HEADER_KEYWORDS.some(kw => u.includes(kw));
      };

      // Helper to detect prefixes
      const isPrefix = (v: string) => {
        if (!v) return false;
        if (v.includes(' ')) return false;
        // A prefix must be very short (A, B) or contain a dot (A.a, A.a.a)
        return (v.length <= 2 || v.includes('.')) && v.length <= 10;
      };

      const catAtCol: Record<number, string>    = {};
      const subCatAtCol: Record<number, string> = {};
      const groupAtCol: Record<number, string>  = {};
      let lastCat = '', lastSubCat = '', lastGroup = '';
      let skipNextSub = false;
      let skipNextGroup = false;
      
      const maxCols = Math.max(...rawData.map(r => r.length), 0);

      // 2. Build Hierarchy Maps (Scan first 8 rows to build fill-forward maps for each column)
      for (let c = 0; c < maxCols; c++) {
        // Category
        const row4 = categoryRowData;
        if (row4[c]) {
          const cv = String(row4[c] || '').trim();
          if (cv && !isColHeader(cv)) {
            let finalCat = cv;
            if (isPrefix(cv)) {
              const nextCv = String(row4[c+1] || '').trim();
              if (nextCv && !isPrefix(nextCv) && !isColHeader(nextCv)) {
                finalCat = cv + ". " + nextCv;
              }
            }
            const match = KNOWN_CATEGORIES.find(k => finalCat.toUpperCase().includes(k));
            if (match) lastCat = match;
            else if (finalCat.length > 1) lastCat = finalCat.replace(/\.+$/, '');
          }
        }

        // Sub-Category
        const sv = (subCategoryRowData[c] || '').toString().trim();
        if (skipNextSub) {
          skipNextSub = false;
        } else if (sv && !isColHeader(sv)) {
          let finalSub = sv;
          if (isPrefix(sv)) {
            const nextSv = (subCategoryRowData[c+1] || '').toString().trim();
            if (nextSv && !isPrefix(nextSv) && !isColHeader(nextSv)) {
              finalSub = sv + " " + nextSv;
              skipNextSub = true;
            }
          }
          lastSubCat = finalSub;
        }

        // Group
        const gv = (groupRowData[c] || '').toString().trim();
        if (skipNextGroup) {
          skipNextGroup = false;
        } else if (gv && !isColHeader(gv)) {
          let finalGroup = gv;
          if (isPrefix(gv)) {
            const nextGv = (groupRowData[c+1] || '').toString().trim();
            if (nextGv && !isPrefix(nextGv) && !isColHeader(nextGv)) {
              finalGroup = gv + " " + nextGv;
              skipNextGroup = true;
            }
          }
          lastGroup = finalGroup;
        }

        catAtCol[c]    = lastCat;
        subCatAtCol[c] = lastSubCat;
        groupAtCol[c]  = lastGroup;
      }

      // 3. Scan Data Rows (Row 9 onwards)
      const items: any[] = [];
      // Pattern matches any depth like A.a.a.01 or A.a.c.11.01.a
      const codeRegex = /^[A-Z](?:\.[a-z0-9]+)+$/i;
      // Track dynamic offsets for all specialized columns per column block
      const columnOffsetsAtCol: Record<number, Record<string, number | null>> = {};
      
      // Pre-scan all header rows to find column offsets robustly
      for (let c = 0; c < maxCols; c++) {
        const val = (groupRowData[c] || '').toString().trim();
        if (val && /^[A-Z]\.[a-z0-9]\.[a-z0-9]\.?$/i.test(val)) {
           const offsets: Record<string, number | null> = {};
           for (let i = 1; i <= 50; i++) {
             // Stop scanning if we hit the territory of the next group column
             const nextGroupVal = String(groupRowData[c + i] || '').trim();
             if (/^[A-Z]\.[a-z0-9]\.[a-z0-9]\.?$/i.test(nextGroupVal)) break;

             // Scan ALL header rows (0–7) for this column offset
             const headerVals: string[] = [];
             for (let hr = 0; hr <= 7; hr++) {
               const hv = String(((rawData[hr] || [])[c + i]) || '').toUpperCase().replace(/\s+/g, ' ').trim();
               if (hv) headerVals.push(hv);
             }

             const hasExact = (kw: string) => headerVals.some(h => h === kw);
             const hasMatch = (kw: string) => headerVals.some(h => h.includes(kw));

             if (hasExact('TARGET') && offsets['TARGET'] === undefined) offsets['TARGET'] = i;
             if (hasExact('STANDART TARGET') && offsets['STANDART TARGET'] === undefined) offsets['STANDART TARGET'] = i;
             
             if (hasMatch('UNIT MESIN') && offsets['UNIT_MESIN'] === undefined) offsets['UNIT_MESIN'] = i;
             if (hasMatch('JUMLAH PLATE') && offsets['JUMLAH_PLATE'] === undefined) offsets['JUMLAH_PLATE'] = i;
             if (hasMatch('TARGET PER JAM/PER PLATE') && offsets['TARGET_PER_JAM_PLATE'] === undefined) offsets['TARGET_PER_JAM_PLATE'] = i;
             if (hasMatch('PERSIAPAN MESIN') && offsets['PERSIAPAN_MESIN'] === undefined) offsets['PERSIAPAN_MESIN'] = i;
             if (hasMatch('WAKTU GANTI PLATE') && offsets['WAKTU_GANTI_PLATE'] === undefined) offsets['WAKTU_GANTI_PLATE'] = i;
             if ((hasMatch('JML. GOSOK PLATE') || hasMatch('JML GOSOK PLATE')) && offsets['JML_GOSOK_PLATE'] === undefined) offsets['JML_GOSOK_PLATE'] = i;
             if (hasMatch('WAKTU GOSOK PLATE') && offsets['WAKTU_GOSOK_PLATE'] === undefined) offsets['WAKTU_GOSOK_PLATE'] = i;
             if (hasMatch('ASUMSI TARGET PER HARI') && offsets['ASUMSI_TARGET_PER_HARI'] === undefined) offsets['ASUMSI_TARGET_PER_HARI'] = i;
             if (hasExact('TARGET PER HARI') && offsets['TARGET_PER_HARI'] === undefined) offsets['TARGET_PER_HARI'] = i;
             if (hasMatch('TARGET PER JAM') && !hasMatch('TARGET PER JAM/PER PLATE') && offsets['TARGET_PER_JAM'] === undefined) offsets['TARGET_PER_JAM'] = i;
             if (hasMatch('EFEKTIF JAM KERJA') && offsets['EFEKTIF_JAM_KERJA'] === undefined) offsets['EFEKTIF_JAM_KERJA'] = i;
             if (hasExact('KETERANGAN') && offsets['KETERANGAN'] === undefined) offsets['KETERANGAN'] = i;
             // KET-1 through KET-7 (Flexible match for KET-1, KET 1, KET.1, etc.)
             for (let k = 1; k <= 7; k++) {
               const key = `KET_${k}`;
               if (offsets[key] === undefined) {
                 const ketPattern = new RegExp(`^KET(?:[\\s\\-\\.]*)0*${k}$`, 'i');
                 if (headerVals.some(h => ketPattern.test(h))) offsets[key] = i;
               }
             }
           }
           columnOffsetsAtCol[c] = offsets;
        }
      }

      for (let r = 8; r < rawData.length; r++) {
        const row = rawData[r] || [];
        for (let c = 0; c < row.length; c++) {
          const val = (row[c] || '').toString().trim();
          
          // DETECT INLINE GROUP HEADERS (e.g., A.a.c or A.a.c.)
          if (val && /^[A-Z]\.[a-z0-9]\.[a-z0-9]\.?$/i.test(val)) {
             let finalGroup = val;
             const nextGv = (row[c+1] || '').toString().trim();
             // Ensure the next cell isn't a column header or another code
             if (nextGv && !/^[A-Z](?:\.[a-z0-9]+)+$/i.test(nextGv) && !['TARGET', 'KTT', 'STANDART'].includes(nextGv.toUpperCase())) {
               finalGroup = val + " " + nextGv;
             }
             groupAtCol[c] = finalGroup;
             
             // We do NOT recalculate offsets here. Inline groups inherit the column structure defined at the top.
             continue; // Skip processing this as a data row
          }

          if (val && codeRegex.test(val)) {
            // Found a code! The name is in the next column
            const code = val;
            const name = (row[c + 1] || '').toString().trim();
            if (!name) continue;

            // Find values relative to the code column
            const getVal = (offset: number | null | undefined) => {
              if (offset === null || offset === undefined || c + offset >= row.length) return null;
              const v = row[c + offset];
              if (v === null || v === undefined || v === '') return null;
              if (typeof v === 'number') return v;
              
              let strVal = String(v).trim();
              const numStr = strVal.split(' ')[0]; // E.g., "4" from "4 Plate"
              
              let cleanNum = numStr;
              if (cleanNum.includes(',') && cleanNum.includes('.')) {
                  cleanNum = cleanNum.replace(/\./g, '').replace(',', '.'); // "185.300,0" -> "185300.0"
              } else if (cleanNum.includes(',')) {
                  cleanNum = cleanNum.replace(',', '.'); // "0,15" -> "0.15"
              } else if (cleanNum.includes('.') && cleanNum.split('.')[1]?.length === 3 && !isNaN(Number(cleanNum.replace(/\./g, '')))) {
                  cleanNum = cleanNum.replace(/\./g, ''); // "8.500" -> "8500"
              }
              
              const parsed = Number(cleanNum);
              return isNaN(parsed) ? null : parsed;
            };

            const getStringVal = (offset: number | null | undefined) => {
              if (offset === null || offset === undefined || c + offset >= row.length) return '';
              const fRow = formattedData[r] || [];
              const fv = fRow[c + offset];
              // Prefer formatted value (e.g. "19 Cut")
              if (fv !== null && fv !== undefined && String(fv).trim() !== '') return String(fv).trim();
              // Fallback to raw value
              const rv = row[c + offset];
              return rv !== null && rv !== undefined ? String(rv).trim() : '';
            };

            const offsets = columnOffsetsAtCol[c] || {};
            
            let finalTOffset = offsets['TARGET'];
            const finalSOffset = offsets['STANDART TARGET'] === undefined ? null : offsets['STANDART TARGET'];
            
            // Fallback for Target if it's implicitly the very next column (c+2)
            // But ONLY if c+2 is not already confirmed to be STANDART TARGET
            if (finalTOffset === undefined) {
              if (finalSOffset !== 2) {
                 finalTOffset = 2;
              } else {
                 finalTOffset = null;
              }
            }

            items.push({
              code,
              name,
              category:            catAtCol[c]    || '',
              subCategory:         subCatAtCol[c] || '',
              groupPekerjaan:      groupAtCol[c]  || '',
              targetValue:         getVal(finalTOffset),
              standartTarget:      getVal(finalSOffset),
              ket1:                getStringVal(offsets['KET_1']),
              ket2:                getStringVal(offsets['KET_2']),
              ket3:                getStringVal(offsets['KET_3']),
              ket4:                getStringVal(offsets['KET_4']),
              ket5:                getStringVal(offsets['KET_5']),
              ket6:                getStringVal(offsets['KET_6']),
              ket7:                getStringVal(offsets['KET_7']),
              unitMesin:           getStringVal(offsets['UNIT_MESIN']),
              jumlahPlate:         getVal(offsets['JUMLAH_PLATE']),
              targetPerJamPlate:   getVal(offsets['TARGET_PER_JAM_PLATE']),
              persiapanMesin:      getVal(offsets['PERSIAPAN_MESIN']),
              waktuGantiPlate:     getVal(offsets['WAKTU_GANTI_PLATE']),
              jmlGosokPlate:       getVal(offsets['JML_GOSOK_PLATE']),
              waktuGosokPlate:     getVal(offsets['WAKTU_GOSOK_PLATE']),
              asumsiTargetPerHari: getVal(offsets['ASUMSI_TARGET_PER_HARI']),
              targetPerHari:       getVal(offsets['TARGET_PER_HARI']),
              targetPerJam:        getVal(offsets['TARGET_PER_JAM']),
              efektifJamKerja:     getVal(offsets['EFEKTIF_JAM_KERJA']),
              keterangan:          getStringVal(offsets['KETERANGAN']),
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
        body: JSON.stringify({ filename: file.name, data: items }),
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
        // Notify other components to refresh
        window.dispatchEvent(new Event('sintak:data-updated'));
        localStorage.setItem('sintak_data_updated', Date.now().toString());
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
    <div className="h-full shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-[var(--bg-surface)] rounded-none border-[3px] border-black p-5 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3.5px_3.5px_0_0_#000] shadow-[2.5px_2.5px_0_0_#000] transition-all duration-300 flex items-center justify-between gap-4 relative z-50 h-[97px]">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-none bg-[#fde047] border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] flex items-center justify-center shrink-0">
            <Upload className="text-black" size={20} strokeWidth={3} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-800 leading-none mb-1">Upload Master Pekerjaan</h3>
            <p className="text-[11px] text-gray-400 font-medium leading-tight">
              Unggah file Excel Master Pekerjaan untuk sinkronisasi database. Sistem akan memperbarui daftar pekerjaan berdasarkan versi file terbaru.
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
            className="px-4 h-10 bg-black text-white hover:bg-[var(--accent-primary)] hover:border-black text-[13px] font-black uppercase tracking-wider border-[3px] border-black rounded-none transition-all flex items-center gap-2 disabled:opacity-70 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[2.5px_2.5px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
          >
            {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            <span>{status === 'loading' ? 'Mengunggah...' : 'Pilih & Upload Excel'}</span>
          </button>
        </div>

        {status === 'error' && (
          <div className="absolute top-full left-0 right-0 mt-2 p-2.5 bg-[#ff5e5e] text-white border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] rounded-none text-[11px] font-black flex items-start gap-2 animate-in slide-in-from-top-1 z-20">
            <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={3} />
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
          window.dispatchEvent(new Event('sintak:data-updated'));
          localStorage.setItem('sintak_data_updated', Date.now().toString());
          router.refresh();
        }}
      />
    </div>
  );
}








