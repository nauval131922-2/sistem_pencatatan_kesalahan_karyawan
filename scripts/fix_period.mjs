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
  
  // 1. Get module name
  const matchModuleName = content.match(/export default function (\w+)Client\(/);
  if (!matchModuleName && !content.includes('SPHOutClient') && !content.includes('PRClient')) {
      console.warn(`Could not find module name in ${filePath}`);
  }
  let moduleNameMatch = content.match(/export default function (\w+)\(/);
  let moduleName = moduleNameMatch ? moduleNameMatch[1] : path.basename(filePath, '.tsx');

  // 2. Add scrapedPeriod state
  if (!content.includes('scrapedPeriod')) {
    content = content.replace(
      /const \[lastUpdated, setLastUpdated\] = useState<string \| null>\(null\);/,
      `const [lastUpdated, setLastUpdated] = useState<string | null>(null);\n  const [scrapedPeriod, setScrapedPeriod] = useState<{start: string, end: string} | null>(null);`
    );
  }

  // 3. Add hydration in initial useEffect
  // Find where setIsMounted(true) is used
  if (content.includes('setIsMounted(true);') && !content.includes('_scrapedPeriod')) {
    content = content.replace(
      /setIsMounted\(true\);/,
      `setIsMounted(true);\n    const savedPeriod = localStorage.getItem('${moduleName}_scrapedPeriod');\n    if (savedPeriod) {\n      try { setScrapedPeriod(JSON.parse(savedPeriod)); } catch(e) {}\n    }`
    );
  } else if (!content.includes('_scrapedPeriod') && content.includes('useEffect(() => {') && content.includes('let initialStart')) {
     const hydrationMatch = content.match(/(let initialStart.*?;)/s);
     if (hydrationMatch) {
         content = content.replace(hydrationMatch[1], `\n    const savedPeriod = localStorage.getItem('${moduleName}_scrapedPeriod');\n    if (savedPeriod) {\n      try { setScrapedPeriod(JSON.parse(savedPeriod)); } catch(e) {}\n    }\n    ${hydrationMatch[1]}`);
     }
  }

  if (content.includes('if (successCount > 0) {') && !content.includes('periodStr')) {
    content = content.replace(
      /if \(successCount > 0\) \{/,
      `if (successCount > 0) {\n        const periodStr = { \n          start: startDate?.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) || '', \n          end: endDate?.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) || '' \n        };\n        setScrapedPeriod(periodStr);\n        localStorage.setItem('${moduleName}_scrapedPeriod', JSON.stringify(periodStr));`
    );
  }

  // 5. Fix UI text (handling both span versions cleanly)
  // First case: <span>Diperbarui: {lastUpdated} (Periode: {startDate ? ....})</span>
  // We want to replace everything inside the span after {lastUpdated}
  
  content = content.replace(
    /<span>Diperbarui:\s*\{lastUpdated\}\s*\(Periode:[^<]+<\/span>/g,
    "<span>Diperbarui: {lastUpdated} {scrapedPeriod ? `(Periode: ${scrapedPeriod.start} - ${scrapedPeriod.end})` : ''}</span>"
  );
  
  content = content.replace(
    /<span>\s*Diperbarui:\s*\{lastUpdated\}\s*\(Periode:[^<]+<\/span>/g,
    "<span>Diperbarui: {lastUpdated} {scrapedPeriod ? `(Periode: ${scrapedPeriod.start} - ${scrapedPeriod.end})` : ''}</span>"
  );
  
  content = content.replace(
    /<span>\s*Diperbarui:\s*\{lastUpdated\}\s*\(Periode:[^\)]*\)[^\)]*\)[\s\S]*?<\/span>/g,
    "<span>Diperbarui: {lastUpdated} {scrapedPeriod ? `(Periode: ${scrapedPeriod.start} - ${scrapedPeriod.end})` : ''}</span>"
  );

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${relPath}`);
}
console.log('Done!');
