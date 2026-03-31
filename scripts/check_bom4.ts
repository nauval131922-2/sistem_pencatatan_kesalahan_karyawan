import { createClient } from '@libsql/client';
import fs from 'fs';

const db = createClient({ url: 'file:database_dev.sqlite' });

async function check() {
  try {
    const ordersRes = await db.execute(`SELECT faktur, nama_prd, tgl FROM orders`);
    const bomsRes = await db.execute(`SELECT faktur_prd, nama_prd FROM bill_of_materials`);
    
    const orders = ordersRes.rows;
    const boms = bomsRes.rows;
    
    console.log(`Total Orders: ${orders.length}, Total BOMs: ${boms.length}`);
    
    const missing = orders.filter(o => {
      // Return true if NO bom has a faktur_prd that includes the order's faktur
      return !boms.some(b => b.faktur_prd && typeof b.faktur_prd === 'string' && b.faktur_prd.includes(o.faktur as string));
    });
    
    fs.writeFileSync('result_bom4.json', JSON.stringify({
      total_orders: orders.length,
      missing_bom_count: missing.length,
      top10: missing.slice(0, 10)
    }, null, 2));
    
    console.log('Done verifying BOM missing records in memory.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
