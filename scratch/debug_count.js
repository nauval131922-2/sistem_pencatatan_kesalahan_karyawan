const XLSX = require('xlsx');
const workbook = XLSX.readFile('d:/repo github/sintak_pt_buya_barokah/Referensi/Produksi/Jurnal Harian Produksi/Jurnal Harian Produksi/06030224 2026 JADWAL PRODUKSI HARIAN.xlsm');
const worksheet = workbook.Sheets['JURNAL'];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

let matchCount = 0;
let skipCount = 0;

for (let i = 9; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row) continue;

  let tgl = null;
  if (row[3]) {
    if (typeof row[3] === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const d = new Date(excelEpoch.getTime() + row[3] * 86400000);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      tgl = `${y}-${m}-${day}`;
    } else {
      tgl = String(row[3]).trim();
    }
  }

  if (tgl >= '2026-04-12' && tgl <= '2026-04-13') {
    const hasDate = row[3] !== null && row[3] !== undefined && String(row[3]).trim() !== '';
    const namaKaryawan = String(row[5] || '').trim();
    const isHeader = namaKaryawan.toLowerCase() === 'nama karyawan';

    if (hasDate && namaKaryawan && !isHeader) {
      matchCount++;
    } else {
      skipCount++;
      console.log('Skipped row at Excel index', i + 1, ':', JSON.stringify(row.slice(0, 8)));
    }
  }
}
console.log('Final results - Match:', matchCount, '| Skip:', skipCount);
