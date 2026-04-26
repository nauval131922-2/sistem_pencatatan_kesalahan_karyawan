const XLSX = require('xlsx');
const workbook = XLSX.readFile('d:/repo github/sintak_pt_buya_barokah/Referensi/Produksi/Jurnal Harian Produksi/Jurnal Harian Produksi/06030224 2026 JADWAL PRODUKSI HARIAN.xlsm');
const worksheet = workbook.Sheets['JURNAL'];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

for (let i = 2657; i < 2665; i++) {
  const row = rawData[i];
  if (!row) continue;
  console.log('Row', i + 1, 'Column L (idx 11):', row[11], 'Type:', typeof row[11]);
}
