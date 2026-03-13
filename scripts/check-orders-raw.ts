
import { createClient } from '@libsql/client';
import path from 'path';

async function check() {
  const dbPath = path.join(process.cwd(), 'database_dev.sqlite');
  const db = createClient({ url: `file:${dbPath}` });
  const result = await db.execute("SELECT raw_data FROM orders LIMIT 1");
  if (result.rows.length > 0) {
    console.log(JSON.stringify(result.rows[0], null, 2));
  } else {
    console.log("No data found in orders table.");
  }
}

check();
