import { createClient } from '@libsql/client';
import path from 'path';
import { initSchema } from '../src/lib/schema';

async function main() {
  const isDev = process.env.NODE_ENV === 'development';
  const isRemote = !!process.env.TURSO_DATABASE_URL;
  
  let dbUrl = '';
  if (isRemote) {
    dbUrl = process.env.TURSO_DATABASE_URL!;
  } else {
    const defaultDbName = isDev ? 'database_dev.sqlite' : 'database.sqlite';
    const dbPath = path.join(process.cwd(), process.env.DB_PATH || defaultDbName);
    dbUrl = `file:${dbPath}`;
  }

  console.log(`[INIT-DB] Connecting to: ${dbUrl} (Remote: ${isRemote})`);

  const db = createClient({
    url: dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log('[INIT-DB] Calling initSchema...');
    await initSchema(db);
    
    const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
    const tables = result.rows.map(t => t.name);
    console.log('[INIT-DB] Tables after init:', JSON.stringify(tables));
    
    if (tables.length === 0) {
      console.error('[INIT-DB] WARNING: No tables were created!');
    } else {
      console.log('[INIT-DB] Schema initialization successful.');
    }
  } catch (error) {
    console.error('[INIT-DB] Schema initialization failed:', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[INIT-DB] Error in main:', err);
  process.exit(1);
});
