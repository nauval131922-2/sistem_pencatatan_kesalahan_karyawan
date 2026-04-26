import fs from 'fs';
import path from 'path';

const filesToFix = [
  'src/app/pr/PRClient.tsx',
  'src/app/purchase-orders/PurchaseOrderClient.tsx',
  'src/app/spph-out/SpphOutClient.tsx',
  'src/app/sph-in/SphInClient.tsx',
  'src/app/sph-out/SPHOutClient.tsx',
  'src/app/sales-orders/SalesOrderClient.tsx',
  'src/app/sales/SalesReportClient.tsx',
  'src/app/bom/BOMClient.tsx',
  'src/app/orders/OrderProduksiClient.tsx'
];

filesToFix.forEach(relPath => {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Replace ' uppercase ' with ' ' or ' uppercase' with '' in className template literals inside cell: ({ getValue
  // Actually, let's just globally replace " uppercase " with " " and " uppercase`" with "`" and "'uppercase " with "'" in those files.
  // Wait, no, we might want to keep uppercase for some things like STATUS. 
  // Status column is often "ACTIVE" / "INACTIVE" which is fine to be uppercase.
  // We want to remove uppercase from data columns: kd_supplier, nama_pelanggan, nama_prd, etc.
  
  content = content.replace(/(accessorKey:\s*'(kd_supplier|kd_pelanggan|nama_pelanggan|nama_prd|nama_supplier)'.*?cell:\s*.*?className={`[^`]*?)\buppercase\b([^`]*`})/gs, '$1$3');

  fs.writeFileSync(fullPath, content, 'utf-8');
});

console.log('Fixed uppercase in columns.');
