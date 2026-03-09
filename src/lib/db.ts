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

const client = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Wrapper to automatically handle session context for triggers
const db = {
  ...client,
  async execute(stmt: any) {
    await this.injectContext();
    return client.execute(stmt);
  },
  async batch(stmts: any[], mode?: any) {
    await this.injectContext();
    return client.batch(stmts, mode);
  },
  async injectContext() {
    try {
      // dynamic import to avoid issues in non-request contexts
      const { getSession } = await import('./session');
      const session = await getSession();
      
      // Always update the context: either with the username or NULL
      await client.execute({
        sql: 'INSERT OR REPLACE INTO session_context (id, username) VALUES (1, ?)',
        args: [session?.username || null]
      });
    } catch (e) {
      // Cookies() inaccessible (e.g. scripts or background tasks)
      // Ensure context is cleared to fallback to 'System'
      try {
        await client.execute('UPDATE session_context SET username = NULL WHERE id = 1');
      } catch (e2) {}
    }
  }
};

export default db;
