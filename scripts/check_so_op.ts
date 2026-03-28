import { createClient } from "@libsql/client";

async function check() {
  const client = createClient({
    url: "file:database.sqlite",
  });

  try {
    const res = await client.execute(`
      SELECT faktur_so, COUNT(DISTINCT faktur) as op_count, GROUP_CONCAT(DISTINCT faktur) as op_list
      FROM orders
      WHERE faktur_so IS NOT NULL AND faktur_so != ''
      GROUP BY faktur_so
      HAVING op_count > 1
    `);
    
    if (res.rows.length > 0) {
      console.log('FOUND_RELATIONS:', JSON.stringify(res.rows, null, 2));
    } else {
      console.log('NO_MANY_TO_ONE_SO_FOUND');
    }
  } catch (e) {
    console.error(e);
  } finally {
    client.close();
  }
}

check();
