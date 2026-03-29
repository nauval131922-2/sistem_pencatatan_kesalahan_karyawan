
import { createClient } from '@libsql/client';
import path from 'path';

async function check() {
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  const db = createClient({ url: `file:${dbPath}` });
  try {
    const result = await db.execute("SELECT * FROM pengiriman LIMIT 3");
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (e) {
    console.error(e);
  }
}

check();
