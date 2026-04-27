import * as XLSX from 'xlsx';

self.addEventListener('message', async (e) => {
  try {
    const { arrayBuffer, filename } = e.data;
    
    // 1. Parsing Excel
    self.postMessage({ type: 'status', message: 'Membaca file Excel (proses ini mungkin memakan waktu)...' });
    
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
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

    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];

    // Filter array kosong
    const mappedData = rawData.filter((row: any) => row && Array.isArray(row) && row.length > 0);

    if (mappedData.length === 0) {
      throw new Error("Tidak dapat menemukan data transaksi pada baris yang dipindai.");
    }

    // 2. Temukan baris header agar bisa disertakan di setiap chunk (jika format dinamis)
    let headerRow = mappedData[0];
    for (let i = 0; i < Math.min(mappedData.length, 20); i++) {
      if (mappedData[i] && mappedData[i].includes('Tanggal') && mappedData[i].includes('Nama Karyawan')) {
        headerRow = mappedData[i];
        break;
      }
    }

    // 3. Upload Chunks secara berurutan langsung dari Worker
    // Ukuran chunk diperbesar untuk mengurangi jumlah request (200k baris / 4k = 50 request)
    const CHUNK_SIZE = 4000; 
    const totalChunks = Math.ceil(mappedData.length / CHUNK_SIZE);
    let totalImported = 0;

    for (let i = 0; i < totalChunks; i++) {
      let chunkData = mappedData.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      
      // Sisipkan header ke chunk ke-2 dan seterusnya agar API bisa mendeteksi kolom
      if (i > 0) {
        chunkData = [headerRow, ...chunkData];
      }

      self.postMessage({ 
        type: 'status', 
        message: `Mengunggah bagian ${i + 1} dari ${totalChunks}...`,
        progress: Math.round(((i + 1) / totalChunks) * 100)
      });

      // Gunakan fetch dengan path absolut dari origin worker
      const res = await fetch('/api/jurnal-harian-produksi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: filename,
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

    self.postMessage({ type: 'done', totalImported });
  } catch (err: any) {
    self.postMessage({ type: 'error', error: err.message });
  }
});
