/**
 * CRITICAL SAFETY FOR AI AGENTS (Antigravity/Gemini):
 * 1. ALWAYS verify process.env.NODE_ENV before modifying database data.
 * 2. NEVER run destructive commands or migrations on 'database.sqlite' (Production).
 * 3. Use 'database_dev.sqlite' for all bug-fixing and testing tasks.
 */
import Database from 'better-sqlite3';
import path from 'path';
import { initSchema } from './schema';

const isDev = process.env.NODE_ENV === 'development';
// Use .env.development for safe debugging. Default is database_dev.sqlite for safety.
const defaultDbName = isDev ? 'database_dev.sqlite' : 'database.sqlite';
const dbPath = path.join(process.cwd(), process.env.DB_PATH || defaultDbName);
console.log(`[DB] Using database: ${dbPath} (Mode: ${process.env.NODE_ENV || 'production'})`);

const db = new Database(dbPath, { timeout: 10000 });

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 10000');

// Only auto-initialize in development to avoid locking issues during production build workers
// In production, we run this via scripts/init-db.mjs during the prebuild phase
if (isDev || process.env.AUTO_INIT_DB === 'true') {
  try {
    initSchema(db);
  } catch (e) {
    console.error("Database auto-initialization failed:", e);
  }
}

export default db;
