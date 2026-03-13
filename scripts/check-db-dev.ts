
import { createClient } from '@libsql/client';
import path from 'path';

async function check() {
  const dbPath = path.join(process.cwd(), 'database_dev.sqlite');
  const db = createClient({ url: `file:${dbPath}` });
  const result = await db.execute("PRAGMA table_info(orders)");
  console.log(JSON.stringify(result.rows, null, 2));
}

check();
