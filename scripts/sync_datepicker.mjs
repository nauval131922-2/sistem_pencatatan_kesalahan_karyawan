import fs from 'fs';
import path from 'path';

const files = [
    'src/app/orders/OrderProduksiClient.tsx',
    'src/app/bom/BOMClient.tsx',
    'src/app/pr/PRClient.tsx',
    'src/app/purchase-orders/PurchaseOrderClient.tsx',
    'src/app/penerimaan-pembelian/PenerimaanPembelianClient.tsx',
    'src/app/rekap-pembelian-barang/PembelianBarangClient.tsx',
    'src/app/pelunasan-hutang/PelunasanHutangClient.tsx',
    'src/app/sales-orders/SalesOrderClient.tsx',
    'src/app/pengiriman/PengirimanClient.tsx',
    'src/app/sales/SalesReportClient.tsx',
    'src/app/pelunasan-piutang/PelunasanPiutangClient.tsx',
    'src/app/bahan-baku/BahanBakuClient.tsx',
    'src/app/barang-jadi/BarangJadiClient.tsx',
    'src/app/sph-in/SphInClient.tsx',
    'src/app/sph-out/SPHOutClient.tsx',
    'src/app/spph-out/SpphOutClient.tsx'
];

for (const relPath of files) {
  const filePath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // 1. Update the state structure if needed (add startRaw and endRaw)
  if (content.includes("try { setScrapedPeriod(JSON.parse(savedPeriod)); } catch(e) {}")) {
      content = content.replace(
          "try { setScrapedPeriod(JSON.parse(savedPeriod)); } catch(e) {}",
          "try { const parsed = JSON.parse(savedPeriod); setScrapedPeriod(parsed); if (parsed.startRaw) setStartDate(new Date(parsed.startRaw)); if (parsed.endRaw) setEndDate(new Date(parsed.endRaw)); } catch(e) {}"
      );
  }

  // 2. Add startRaw and endRaw to the save action
  if (content.match(/end:\s*endDate\?\.toLocaleDateString\('id-ID',\s*\{\s*day:\s*'2-digit',\s*month:\s*'short',\s*year:\s*'numeric'\s*\}\)\s*\|\|\s*''\s*\n\s*\}/)) {
      content = content.replace(
          /end:\s*endDate\?\.toLocaleDateString\('id-ID',\s*\{\s*day:\s*'2-digit',\s*month:\s*'short',\s*year:\s*'numeric'\s*\}\)\s*\|\|\s*''\s*\n\s*\}/g,
          "end: endDate?.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) || '',\n          startRaw: startDate?.toISOString() || '',\n          endRaw: endDate?.toISOString() || ''\n        }"
      );
  }

  // 3. Optional: Fix the default new Date(2026, 0, 1) -> new Date(2025, 0, 1) across the board if we want,
  // but if we load from localStorage, it doesn't matter too much, although 2025 makes more sense as an organic default.
  // We'll leave the dynamic localstorage as the absolute fix.
  
  if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${relPath}`);
  }
}
console.log('Done sync_datepicker!');
