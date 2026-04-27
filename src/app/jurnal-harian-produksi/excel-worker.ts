import * as XLSX from 'xlsx';

self.addEventListener('message', async (e) => {
  try {
    const { arrayBuffer, filename, origin } = e.data;
    const apiUrl = `${origin}/api/jurnal-harian-produksi`;
    
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

    // 3. Konfigurasi Chunking
    const CHUNK_SIZE = 4000;
    const totalChunks = Math.ceil(mappedData.length / CHUNK_SIZE);
    let totalImported = 0;

    // 4. Fungsi pembantu untuk mengunggah satu chunk
    const uploadChunk = async (index: number) => {
      const chunkData = mappedData.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);
      const dataWithHeader = index > 0 ? [headerRow, ...chunkData] : chunkData;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: filename,
          data: dataWithHeader,
          chunkIndex: index,
          totalChunks
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || `Gagal mengimpor data pada bagian ${index + 1}.`);
      }
      return data.importedCount || 0;
    };

    // 4. Proses Upload - Chunk pertama harus sinkron (karena ada proses DELETE di server)
    self.postMessage({ 
      type: 'status', 
      message: `Memproses bagian 1 dari ${totalChunks}...`, 
      progress: 0,
      totalRows: mappedData.length,
      currentRows: 0
    });
    totalImported += await uploadChunk(0);

    // 5. Chunk sisanya dikirim secara PARALEL (Concurrency 5) untuk kecepatan maksimal
    const remainingChunks = Array.from({ length: totalChunks - 1 }, (_, i) => i + 1);
    const CONCURRENCY = 5;
    let completedChunks = 1;

    const runWorker = async () => {
      while (remainingChunks.length > 0) {
        const index = remainingChunks.shift();
        if (index === undefined) break;

        const count = await uploadChunk(index);
        totalImported += count;
        completedChunks++;

        self.postMessage({ 
          type: 'status', 
          message: `Mengunggah... (${completedChunks}/${totalChunks})`,
          progress: Math.round((completedChunks / totalChunks) * 100),
          totalRows: mappedData.length,
          currentRows: Math.min(completedChunks * CHUNK_SIZE, mappedData.length)
        });
      }
    };

    // Jalankan worker paralel
    await Promise.all(Array.from({ length: CONCURRENCY }, runWorker));

    self.postMessage({ type: 'done', totalImported, totalRows: mappedData.length });
  } catch (err: any) {
    self.postMessage({ type: 'error', error: err.message });
  }
});
