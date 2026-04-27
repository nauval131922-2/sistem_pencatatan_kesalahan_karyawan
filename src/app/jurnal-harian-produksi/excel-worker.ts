import * as XLSX from 'xlsx';

self.addEventListener('message', async (e) => {
  try {
    const arrayBuffer = e.data;
    
    // Proses sinkron yang sangat berat kini berjalan di background thread
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

    self.postMessage({ success: true, mappedData });
  } catch (err: any) {
    self.postMessage({ success: false, error: err.message });
  }
});
