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

  // 1. Force the hardcoded default to 2025 if it's 2026
  content = content.replace(/new Date\(2026, 0, 1\)/g, "new Date(2025, 0, 1)");
  content = content.replace(/const defaultStartDate = new Date\(2026, 0, 1\);/g, "const defaultStartDate = new Date(2025, 0, 1);");

  // 2. Fix the overwrite logic: Only use initialStart if no scrapedPeriod was loaded
  // The current code does:
  // if (savedPeriod) { try { ... setStartDate(...) ... } }
  // ...
  // setStartDate(initialStart); <--- THIS OVERWRITES IT
  
  // We want to change the setStartDate(initialStart) to only run if not already set or prioritize scrapedPeriod.
  // Better: Set initialStart and initialEnd from scrapedPeriod SO THAT THE SECOND BLOCK doesn't break it.

  if (content.includes("try { const parsed = JSON.parse(savedPeriod); setScrapedPeriod(parsed); if (parsed.startRaw) setStartDate(new Date(parsed.startRaw)); if (parsed.endRaw) setEndDate(new Date(parsed.endRaw)); } catch(e) {}")) {
      content = content.replace(
          "try { const parsed = JSON.parse(savedPeriod); setScrapedPeriod(parsed); if (parsed.startRaw) setStartDate(new Date(parsed.startRaw)); if (parsed.endRaw) setEndDate(new Date(parsed.endRaw)); } catch(e) {}",
          "try { const parsed = JSON.parse(savedPeriod); setScrapedPeriod(parsed); if (parsed.startRaw) initialStart = new Date(parsed.startRaw); if (parsed.endRaw) initialEnd = new Date(parsed.endRaw); } catch(e) {}"
      );
  }

  if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${relPath}`);
  }
}
console.log('Done fix_datepicker_overwrite!');
