import { createClient } from '@libsql/client';
import fs from 'fs';

const db = createClient({ url: 'file:database_dev.sqlite' });

async function check() {
  try {
    // Check total orders
    const totalOrders = await db.execute(`SELECT COUNT(*) as count FROM orders`);
    const countO = totalOrders.rows[0].count;

    // Join using LIKE because of HTML tags in b.faktur_prd
    const result = await db.execute(`
      SELECT o.faktur, o.nama_prd, o.tgl
      FROM orders o
      LEFT JOIN bill_of_materials b ON b.faktur_prd LIKE '%' || o.faktur || '%'
      WHERE b.id IS NULL
    `);
    
    fs.writeFileSync('result_bom3.json', JSON.stringify({
      total_orders: countO,
      missing_bom_count: result.rows.length,
      top10: result.rows.slice(0, 10)
    }, null, 2));
    
    console.log('Done verifying BOM missing records.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
