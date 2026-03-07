import Database from 'better-sqlite3';
import path from 'path';
import { initSchema } from '../src/lib/schema';

const isDev = process.env.NODE_ENV === 'development';
const defaultDbName = isDev ? 'database_dev.sqlite' : 'database.sqlite';
const dbPath = path.join(process.cwd(), process.env.DB_PATH || defaultDbName);

console.log(`[INIT-DB] Current working directory: ${process.cwd()}`);
console.log(`[INIT-DB] Initializing database at: ${dbPath}`);

const db = new Database(dbPath, { timeout: 10000 });
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 10000');

try {
  console.log('[INIT-DB] Calling initSchema...');
  initSchema(db);
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {name: string}[];
  console.log('[INIT-DB] Tables after init:', JSON.stringify(tables.map(t => t.name)));
  
  if (tables.length === 0) {
    console.error('[INIT-DB] WARNING: No tables were created!');
  } else {
    console.log('[INIT-DB] Schema initialization successful.');
  }
} catch (error) {
  console.error('[INIT-DB] Schema initialization failed:', error);
  process.exit(1);
} finally {
  db.close();
}
