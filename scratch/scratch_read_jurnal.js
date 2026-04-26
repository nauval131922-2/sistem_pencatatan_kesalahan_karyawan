const XLSX = require('xlsx');

try {
  const filePath = 'D:\\repo github\\sintak_pt_buya_barokah\\Referensi\\Produksi\\Jurnal Harian Produksi\\Jurnal Harian Produksi\\06030224 2026 JADWAL PRODUKSI HARIAN.xlsm';
  const workbook = XLSX.readFile(filePath);
  const sheetName = 'JURNAL';
  
  if (!workbook.Sheets[sheetName]) {
    console.error(`Sheet ${sheetName} tidak ditemukan. Sheets yang ada: ${workbook.SheetNames.join(', ')}`);
    process.exit(1);
  }

  const sheet = workbook.Sheets[sheetName];
  
  // Ambil raw data
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  
  // Cetak 20 baris pertama untuk memahami struktur dan letak header
  console.log("=== STRUKTUR SHEET JURNAL (20 Baris Pertama) ===");
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i] || [];
    console.log(`Baris ${i + 1}:`, JSON.stringify(row.slice(0, 15))); // cetak max 15 kolom pertama
  }
} catch (e) {
  console.error("Error membaca file:", e);
}
