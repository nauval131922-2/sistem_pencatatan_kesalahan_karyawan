import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { initSchema } from '../src/lib/schema';

async function fixAndInit(filename: string) {
  const dbPath = path.join(process.cwd(), filename);
  const db = createClient({
    url: `file:${dbPath}`,
  });

  console.log(`[REPAIR] Processing ${filename}...`);
  try {
    await db.batch([
      "DROP TABLE IF EXISTS pengiriman",
      "DROP TABLE IF EXISTS pelunasan_piutang"
    ], "write");
    console.log(`[REPAIR] Tables dropped in ${filename}.`);
    
    console.log(`[REPAIR] Re-initializing schema for ${filename}...`);
    await initSchema(db);
    
    // Verify
    const result = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='pengiriman'");
    if (result.rows[0]?.sql?.includes('UNIQUE')) {
       console.log(`[REPAIR] SUCCESS: Table 'pengiriman' in ${filename} has UNIQUE constraint.`);
    } else {
       console.error(`[REPAIR] FAILED: Table 'pengiriman' in ${filename} still missing constraint!`);
    }
  } catch (err) {
    console.error(`[REPAIR] ERROR in ${filename}:`, err);
  }
}

async function main() {
  await fixAndInit('database.sqlite');
  await fixAndInit('database_dev.sqlite');
  console.log('[REPAIR] All databases processed.');
}

main();
