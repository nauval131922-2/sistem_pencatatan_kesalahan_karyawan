import { createClient } from '@libsql/client';
import fs from 'fs';

const db = createClient({ url: 'file:database_dev.sqlite' });

async function check() {
  const result = await db.execute(`
    SELECT o.faktur, o.nama_prd, o.tgl
    FROM orders o
    LEFT JOIN bill_of_materials b ON o.faktur = b.faktur_prd
    WHERE b.id IS NULL
  `);
  
  fs.writeFileSync('result_bom.json', JSON.stringify({
    count: result.rows.length,
    top10: result.rows.slice(0, 10)
  }, null, 2));
  console.log('Done writing result_bom.json');
}

check();
