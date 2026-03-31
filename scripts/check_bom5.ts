import { createClient } from '@libsql/client';
import fs from 'fs';

const db = createClient({ url: 'file:database_dev.sqlite' });

async function check() {
  try {
    const ordersRes = await db.execute(`SELECT faktur FROM orders`);
    const bomsRes = await db.execute(`SELECT faktur, faktur_prd, nama_prd, tgl FROM bill_of_materials`);
    
    const orderSet = new Set(ordersRes.rows.map(r => r.faktur));
    const boms = bomsRes.rows;
    
    const belumProses = [];
    const belumTerScrape = [];
    
    for (const b of boms) {
      const p = b.faktur_prd;
      if (typeof p === 'string') {
        const match = p.match(/(PR\d+)/);
        if (match) {
          if (!orderSet.has(match[1])) {
            belumTerScrape.push({ ...b, pr_faktur: match[1] });
          }
        } else {
          belumProses.push({ ...b, reason: 'Tidak ada string PR di faktur_prd' });
        }
      } else {
        belumProses.push({ ...b, reason: 'faktur_prd null' });
      }
    }
    
    fs.writeFileSync('result_bom5.json', JSON.stringify({
      total_boms: boms.length,
      belum_proses_op_count: belumProses.length,
      belum_terscrape_op_count: belumTerScrape.length,
      contoh_belum_proses: belumProses.slice(0, 5),
      contoh_belum_terscrape: belumTerScrape.slice(0, 5)
    }, null, 2));
    
    console.log('Done counting BOM without Order Produksi');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
