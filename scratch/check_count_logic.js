const XLSX = require('xlsx');
const workbook = XLSX.readFile('d:/repo github/sintak_pt_buya_barokah/Referensi/Produksi/Jurnal Harian Produksi/Jurnal Harian Produksi/06030224 2026 JADWAL PRODUKSI HARIAN.xlsm');
const worksheet = workbook.Sheets['JURNAL'];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

let countTotal = 0;
let countWithCriteria = 0;

for (let i = 0; i < rawData.length; i++) {
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

  if (tgl === '2026-04-12' || tgl === '2026-04-13') {
    countTotal++;
    const namaKaryawan = String(row[5] || '').trim();
    if (namaKaryawan && namaKaryawan.toLowerCase() !== 'nama karyawan' && !namaKaryawan.startsWith('-')) {
      countWithCriteria++;
    } else {
      console.log('Row', i + 1, 'rejected. Name:', namaKaryawan);
    }
  }
}

console.log('Total rows with date 12-13 Apr:', countTotal);
console.log('Rows matching Name criteria:', countWithCriteria);
