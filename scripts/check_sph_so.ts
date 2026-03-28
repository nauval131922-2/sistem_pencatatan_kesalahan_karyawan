import { createClient } from "@libsql/client";

async function check() {
  const client = createClient({
    url: "file:database.sqlite",
  });

  try {
    const res = await client.execute(`
      SELECT faktur_sph, COUNT(DISTINCT faktur) as so_count, GROUP_CONCAT(DISTINCT faktur) as so_list
      FROM sales_orders
      WHERE faktur_sph IS NOT NULL AND faktur_sph != ''
      GROUP BY faktur_sph
      HAVING so_count > 1
    `);
    
    if (res.rows.length > 0) {
      console.log('FOUND_RELATIONS:', JSON.stringify(res.rows, null, 2));
    } else {
      console.log('NO_MANY_TO_ONE_SPH_FOUND');
    }
  } catch (e) {
    console.error(e);
  } finally {
    client.close();
  }
}

check();
