import { createClient } from '@libsql/client';

const db = createClient({ url: 'file:database_dev.sqlite' });

async function check() {
  const op = await db.execute(`SELECT * FROM orders WHERE faktur = 'PR00126030500007'`);
  console.log("ORDER PRODUKSI:", op.rows);

  const bom = await db.execute(`SELECT * FROM bill_of_materials WHERE faktur_prd = 'PR00126030500007' OR faktur = 'PR00126030500007' OR nama_prd LIKE '%OP.277.SOPD.III%'`);
  console.log("BOM:", bom.rows);
}

check();
