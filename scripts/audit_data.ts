import { createClient } from "@libsql/client";

async function check() {
  const client = createClient({
     url: "file:database.sqlite",
  });

  try {
    const res = await client.execute(`
       SELECT faktur, tgl, raw_data FROM orders LIMIT 2;
    `);
    console.log('--- ORDERS ---');
    for (const r of res.rows) {
       console.log('FAKTUR:', r.faktur);
       console.log('TGL:', r.tgl);
       console.log('RAW JSON:', r.raw_data);
       console.log('---');
    }

    const res2 = await client.execute(`
       SELECT faktur, tgl, raw_data FROM barang_jadi LIMIT 2;
    `);
    console.log('--- BARANG_JADI ---');
    for (const r of res2.rows) {
       console.log('FAKTUR:', r.faktur);
       console.log('TGL:', r.tgl);
       console.log('RAW JSON:', r.raw_data);
       console.log('---');
    }

  } catch(e) {
    console.error(e);
  } finally {
    client.close();
  }
}

check();
