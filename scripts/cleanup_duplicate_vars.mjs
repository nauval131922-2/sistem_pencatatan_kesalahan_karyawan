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
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // 1. Remove the first (duplicate) scrapedPeriod block that is inside the isMounted useEffect
  // This is the one that looks like:
  // const savedPeriod = localStorage.getItem('..._scrapedPeriod');
  // if (savedPeriod) { try { const parsed = JSON.parse(savedPeriod); ... } catch(e) {} }
  
  const duplicateBlockPattern = /const savedPeriod = localStorage\.getItem\('\w+_scrapedPeriod'\);\s*if \(savedPeriod\) \{\s*try \{ const parsed = JSON\.parse\(savedPeriod\); setScrapedPeriod\(parsed\); if \(parsed\.startRaw\) setStartDate\(new Date\(parsed\.startRaw\)\); if \(parsed\.endRaw\) setEndDate\(new Date\(parsed\.endRaw\)\); \} catch\(e\) \{\}\s*\}/;
  
  content = content.replace(duplicateBlockPattern, "");

  // 2. Also fix the second block where I might have accidentally redefined const savedPeriod
  // If we see "const savedPeriod = ...;" twice or near each other, we fix it.
  // Actually, the build error says "the name savedPeriod is defined multiple times"
  
  // Let's locate the second injection and ensure it's "const savedPeriod" if not already defined,
  // or just "savedPeriod" if we want to be safe.
  
  // More robust: Find all instances of "const savedPeriod" and if there are two in the same function/block, rename or merge.
  // In our case, they are both in the same useEffect in some files.
  
  // Let's just remove the first one entirely since it's redundant.
  
  // 3. Cleanup logic: Ensure setScrapedPeriod is still called in the second block.
  if (content.includes("if (parsed.startRaw) initialStart = new Date(parsed.startRaw);") && !content.includes("setScrapedPeriod(parsed);")) {
       content = content.replace(
           "if (parsed.startRaw) initialStart = new Date(parsed.startRaw);",
           "setScrapedPeriod(parsed); if (parsed.startRaw) initialStart = new Date(parsed.startRaw);"
       );
  }

  if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Cleaned up ${relPath}`);
  }
}
console.log('Done cleanup_duplicate_vars!');
