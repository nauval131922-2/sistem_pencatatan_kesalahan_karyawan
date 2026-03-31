import fs from 'fs';
import path from 'path';

const files = [
    'src/app/orders/OrderProduksiClient.tsx',
    'src/app/bom/BOMClient.tsx', // No initialStart block, handled in isMounted
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
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // 1. First, REVERT the broken injection that causes "Cannot find name 'initialStart'"
  content = content.replace(
      /try \{ const parsed = JSON.parse\(savedPeriod\); setScrapedPeriod\(parsed\); if \(parsed\.startRaw\) initialStart = new Date\(parsed\.startRaw\); if \(parsed\.endRaw\) initialEnd = new Date\(parsed\.endRaw\); \} catch\(e\) \{\}/,
       "try { const parsed = JSON.parse(savedPeriod); setScrapedPeriod(parsed); if (parsed.startRaw) setStartDate(new Date(parsed.startRaw)); if (parsed.endRaw) setEndDate(new Date(parsed.endRaw)); } catch(e) {}"
  );

  // 2. Now find the SECOND block (the one with useEffect and initialStart) and add prioritized hydration there
  const hydrationBlockRegex = /(useEffect\(\(\) => \{[\s\S]*?const todayStr = new Date\(\)\.toLocaleDateString\('en-CA'\);[\s\S]*?let initialStart = .*?;[\s\S]*?let initialEnd = .*?;)/;
  
  if (content.match(hydrationBlockRegex)) {
      const savedPeriodKey = `${path.basename(filePath, '.tsx')}_scrapedPeriod`;
      content = content.replace(
          hydrationBlockRegex,
          `$1\n\n    const savedPeriod = localStorage.getItem('${savedPeriodKey}');\n    if (savedPeriod) {\n      try {\n        const parsed = JSON.parse(savedPeriod);\n        if (parsed.startRaw) initialStart = new Date(parsed.startRaw);\n        if (parsed.endRaw) initialEnd = new Date(parsed.endRaw);\n      } catch(e) {}\n    }`
      );
  }

  // 3. Special handling for OrderProduksiClient which has different structure (sessionDate todayStr)
  if (filePath.includes('OrderProduksiClient.tsx')) {
      // It already has isMounted block. Let's make sure it doesn't overwrite manually.
      // Already patched in step 1.
  }

  if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${relPath}`);
  }
}
console.log('Done fix_datepicker_scope!');
