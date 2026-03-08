import { createClient } from '@libsql/client';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const isRemote = !!process.env.TURSO_DATABASE_URL;

let dbUrl = '';
if (isRemote) {
  dbUrl = process.env.TURSO_DATABASE_URL!;
} else {
  if (!isDev && !isRemote) {
    console.error("[DB ERROR] Running in Production without TURSO_DATABASE_URL environment variable.");
  }
  const defaultDbName = isDev ? 'database_dev.sqlite' : 'database.sqlite';
  const dbPath = path.join(process.cwd(), process.env.DB_PATH || defaultDbName);
  dbUrl = `file:${dbPath}`;
}

console.log(`[DB] Environment: ${process.env.NODE_ENV}, Mode: ${isRemote ? 'Remote (Turso)' : 'Local (File)'}`);
if (isRemote) {
    console.log(`[DB] Remote URL: ${dbUrl.substring(0, 20)}...`);
}

const db = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default db;
