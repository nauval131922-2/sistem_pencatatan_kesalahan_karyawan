import { createClient } from "@libsql/client";

async function check() {
  const client = createClient({
    url: "file:database.sqlite",
  });

  try {
    const res = await client.execute(`
      SELECT bom.faktur as bom_faktur, COUNT(sph.faktur) as sph_count, GROUP_CONCAT(sph.faktur) as sph_list
      FROM bill_of_materials bom
      JOIN sph_out sph ON (sph.barang LIKE '%' || bom.faktur || '%' OR sph.raw_data LIKE '%' || bom.faktur || '%')
      GROUP BY bom.faktur
      HAVING sph_count > 1
    `);
    
    if (res.rows.length > 0) {
      console.log('FOUND_RELATIONS:', JSON.stringify(res.rows, null, 2));
    } else {
      console.log('NO_MANY_TO_MANY_FOUND');
    }
  } catch (e) {
    console.error(e);
  } finally {
    client.close();
  }
}

check();
