import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { initSchema } from '../src/lib/schema';

// Manual .env loader for standalone script
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length === 2) {
        const key = parts[0].trim();
        const value = parts[1].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

async function main() {
  const isDev = process.env.NODE_ENV === 'development';
  const isVercel = !!process.env.VERCEL;
  // Policy: Use Turso when on Vercel OR when USE_REMOTE_DB is explicitly set to true.
  const isRemote = (isVercel || process.env.USE_REMOTE_DB === 'true') && !!process.env.TURSO_DATABASE_URL;
  
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
    
    // Check if tables already exist before trying to init
    let tablesExist = false;
    try {
      const checkResult = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
      tablesExist = checkResult.rows.length > 0;
    } catch (e) {}

    try {
      await initSchema(db);
      console.log('[INIT-DB] Schema initialization successful.');
    } catch (schemaError: any) {
      const isBlocked = schemaError.code === 'BLOCKED' || 
                        (schemaError.message && schemaError.message.toLowerCase().includes('blocked'));
      
      if (isBlocked && tablesExist) {
        console.warn('\n[INIT-DB] ⚠️ WARNING: SQL write operations are BLOCKED by Turso (Quota exceeded?).');
        console.warn('[INIT-DB] ⚠️ Skipping schema update because tables already exist. Build will continue.\n');
      } else {
        throw schemaError;
      }
    }
    
    const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
    const tables = result.rows.map(t => t.name);
    console.log('[INIT-DB] Tables found:', JSON.stringify(tables));
    
  } catch (error: any) {
    console.error('[INIT-DB] Critical Error:', error.message || error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[INIT-DB] Error in main:', err);
  process.exit(1);
});
