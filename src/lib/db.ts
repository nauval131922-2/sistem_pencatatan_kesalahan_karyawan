import { createClient } from '@libsql/client';
import path from 'path';
import logger from './logger';

const isDev = process.env.NODE_ENV === 'development';
const isVercel = !!process.env.VERCEL;

// Policy: Use Turso when on Vercel OR when USE_REMOTE_DB is explicitly set to true.
const useRemote = (isVercel || process.env.USE_REMOTE_DB === 'true') && !!process.env.TURSO_DATABASE_URL;

let dbUrl = '';
if (useRemote) {
  dbUrl = process.env.TURSO_DATABASE_URL!;
} else {
  const defaultDbName = isDev ? 'database_dev.sqlite' : 'database.sqlite';
  const dbPath = path.join(process.cwd(), process.env.DB_PATH || defaultDbName);
  dbUrl = `file:${dbPath}`;
}

logger.info('Database initialized', {
  env: process.env.NODE_ENV,
  platform: isVercel ? 'Vercel' : 'Local',
  storage: useRemote ? 'Cloud (Turso)' : `File (${dbUrl.split(':').pop()})`,
});

const client = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Wrapper to automatically handle session context and logging
const db = {
  ...client,
  async execute(stmt: any, menuContext?: string) {
    const startTime = Date.now();
    const sql = typeof stmt === 'string' ? stmt : stmt.sql;
    const isRead = sql.trim().toUpperCase().startsWith('SELECT');

    try {
      // Only inject context for mutations
      if (!isRead) {
        await this.injectContext(menuContext);
      }

      const result = await client.execute(stmt);
      const duration = Date.now() - startTime;

      // Log slow queries (>100ms in dev)
      if (isDev && duration > 100) {
        logger.query(sql, stmt.args || [], duration);
      }

      return result;
    } catch (error: any) {
      logger.error('Database query failed', error, {
        sql: sql.substring(0, 200),
        args: stmt.args,
      });
      throw error;
    }
  },

  async batch(stmts: any[], mode?: any, menuContext?: string) {
    const startTime = Date.now();
    const hasMutation = stmts.some(s => {
      const sql = typeof s === 'string' ? s : s.sql;
      return !sql.trim().toUpperCase().startsWith('SELECT');
    });

    try {
      if (hasMutation) {
        await this.injectContext(menuContext);
      }

      const result = await client.batch(stmts, mode);
      const duration = Date.now() - startTime;

      if (isDev && duration > 200) {
        logger.debug('Batch query executed', {
          count: stmts.length,
          duration,
          hasMutation,
        });
      }

      return result;
    } catch (error: any) {
      logger.error('Batch query failed', error, {
        count: stmts.length,
      });
      throw error;
    }
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
          args: [username, menuContext || null],
        });
      } catch (e) {
        // Fallback to old schema if last_menu column doesn't exist yet
        await client.execute({
          sql: 'INSERT OR REPLACE INTO session_context (id, username) VALUES (1, ?)',
          args: [username],
        });
      }
    } catch (e) {
      // Silently fail - context tracking is best-effort
      if (isDev) {
        console.warn('Failed to inject session context:', e);
      }
    }
  },
};

export default db;
