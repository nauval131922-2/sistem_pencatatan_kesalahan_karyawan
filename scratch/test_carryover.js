const XLSX = require('xlsx');
const workbook = XLSX.readFile('d:/repo github/sintak_pt_buya_barokah/Referensi/Produksi/Jurnal Harian Produksi/Jurnal Harian Produksi/06030224 2026 JADWAL PRODUKSI HARIAN.xlsm');
const worksheet = workbook.Sheets['JURNAL'];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

let lastTgl = null;
let carryOverMatch = 0;

for (let i = 9; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row) continue;

  let currentTgl = null;
  if (row[3]) {
    if (typeof row[3] === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const d = new Date(excelEpoch.getTime() + row[3] * 86400000);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      currentTgl = `${y}-${m}-${day}`;
    } else {
      currentTgl = String(row[3]).trim();
    }
  }

  // Carry over the date from the previous row if current row's date is empty
  // but only if there is other data in the row (like a name)
  if (currentTgl) {
    lastTgl = currentTgl;
  }

  if (lastTgl === '2026-04-12' || lastTgl === '2026-04-13') {
     const namaKaryawan = String(row[5] || '').trim();
     const hasActualDateInRow = !!currentTgl;
     
     if (namaKaryawan && namaKaryawan.toLowerCase() !== 'nama karyawan' && !namaKaryawan.startsWith('-')) {
       carryOverMatch++;
     }
  }
}

console.log('Total matches with Carry-Over logic:', carryOverMatch);
