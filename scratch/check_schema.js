import db from './src/lib/db.js';

async function check() {
  try {
    const result = await db.execute("PRAGMA table_info(sales_orders)");
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (e) {
    console.error(e);
  }
}

check();
