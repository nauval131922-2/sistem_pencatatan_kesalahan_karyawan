import { createClient } from '@libsql/client';
import fs from 'fs';

const db = createClient({ url: 'file:database_dev.sqlite' });

async function check() {
  const op = await db.execute(`SELECT * FROM orders WHERE faktur = 'PR00126030500007'`);
  const bom = await db.execute(`SELECT * FROM bill_of_materials WHERE faktur_prd = 'PR00126030500007' OR faktur = 'PR00126030500007' OR nama_prd LIKE '%OP.277%'`);
  const allBoms = await db.execute(`SELECT * FROM bill_of_materials LIMIT 5`);

  fs.writeFileSync('debug_bom.json', JSON.stringify({
    op: op.rows,
    bom: bom.rows,
    sample: allBoms.rows
  }, null, 2));

  console.log('done!');
  process.exit(0);
}

check();
