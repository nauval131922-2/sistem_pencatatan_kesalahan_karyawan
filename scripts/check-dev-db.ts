import { createClient } from '@libsql/client';
import path from 'path';

async function main() {
  const dbPath = path.join(process.cwd(), 'database_dev.sqlite');
  const db = createClient({
    url: `file:${dbPath}`,
  });

  const result = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='pengiriman'");
  console.log(JSON.stringify(result.rows[0], null, 2));
}

main();
