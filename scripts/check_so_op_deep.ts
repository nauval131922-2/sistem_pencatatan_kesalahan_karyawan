import { createClient } from "@libsql/client";

async function check() {
  const client = createClient({
    url: "file:database.sqlite",
  });

  try {
    // We need to parse raw_data JSON to find the SO faktur
    // In Digit, it's usually 'faktur_so' or 'so' or 'fkt_so'
    const res = await client.execute(`SELECT faktur, raw_data FROM orders`);
    
    const soMap: Record<string, string[]> = {};
    
    for (const row of res.rows) {
      const raw = JSON.parse(row.raw_data as string);
      const soFaktur = raw.faktur_so || raw.so || raw.fkt_so;
      
      if (soFaktur) {
        if (!soMap[soFaktur]) soMap[soFaktur] = [];
        soMap[soFaktur].push(row.faktur as string);
      }
    }
    
    const manyTo1 = Object.entries(soMap)
      .filter(([so, ops]) => new Set(ops).size > 1)
      .map(([so, ops]) => ({ so, op_count: ops.length, op_list: ops }));
    
    if (manyTo1.length > 0) {
      console.log('FOUND_RELATIONS:', JSON.stringify(manyTo1, null, 2));
    } else {
      console.log('NO_MANY_TO_ONE_SO_OP_FOUND');
    }
  } catch (e) {
    console.error(e);
  } finally {
    client.close();
  }
}

check();
