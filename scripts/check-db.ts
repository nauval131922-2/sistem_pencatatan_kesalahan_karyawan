
import { createClient } from '@libsql/client';
import path from 'path';

async function main() {
  const dbUrl = `file:${path.join(process.cwd(), 'database_dev.sqlite')}`;
  const db = createClient({ url: dbUrl });
  const res = await db.execute("SELECT COUNT(*) as count FROM master_pekerjaan");
  console.log('Rows in master_pekerjaan:', res.rows[0].count);
}
main();
