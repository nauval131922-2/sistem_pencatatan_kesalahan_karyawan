import { createClient } from '@libsql/client';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const isVercel = !!process.env.VERCEL;

// Policy: Only use Turso when deployed on Vercel. 
// Local environments always use file-based SQLite to prevent accidental data loss in cloud.
const useRemote = isVercel && !!process.env.TURSO_DATABASE_URL;

let dbUrl = '';
if (useRemote) {
  dbUrl = process.env.TURSO_DATABASE_URL!;
} else {
  const defaultDbName = isDev ? 'database_dev.sqlite' : 'database.sqlite';
  const dbPath = path.join(process.cwd(), process.env.DB_PATH || defaultDbName);
  dbUrl = `file:${dbPath}`;
}

console.log(`[DB] Env: ${process.env.NODE_ENV}, Platform: ${isVercel ? 'Vercel' : 'Local'}, Storage: ${useRemote ? 'Cloud (Turso)' : 'File (' + dbUrl.split(':').pop() + ')'}`);

const client = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Wrapper to automatically handle session context for triggers
const db = {
  ...client,
  async execute(stmt: any, menuContext?: string) {
    await this.injectContext(menuContext);
    return client.execute(stmt);
  },
  async batch(stmts: any[], mode?: any, menuContext?: string) {
    await this.injectContext(menuContext);
    return client.batch(stmts, mode);
  },
  async injectContext(menuContext?: string) {
    try {
      const { getSession } = await import('./session');
      const session = await getSession();
      const username = session?.username || null;
      
      // Try to update with last_menu first
      try {
        await client.execute({
          sql: 'INSERT OR REPLACE INTO session_context (id, username, last_menu) VALUES (1, ?, ?)',
          args: [username, menuContext || null]
        });
      } catch (e) {
        // Fallback to old schema if last_menu column doesn't exist yet
        await client.execute({
          sql: 'INSERT OR REPLACE INTO session_context (id, username) VALUES (1, ?)',
          args: [username]
        });
      }
    } catch (e) {
      // If everything fails, try a simple update to NULL to clear state
      try {
        await client.execute('UPDATE session_context SET username = NULL WHERE id = 1');
      } catch (e2) {}
    }
  }
};

export default db;
