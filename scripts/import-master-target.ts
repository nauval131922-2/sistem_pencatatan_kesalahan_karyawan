
import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

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
  const dbUrl = `file:${path.join(process.cwd(), process.env.DB_PATH || 'database_dev.sqlite')}`;
  console.log(`[IMPORT TARGET] Connecting to: ${dbUrl}`);

  const db = createClient({
    url: dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const jsonPath = path.join(process.cwd(), 'scripts', 'extracted_master_targets.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Extracted targets JSON not found.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`[IMPORT TARGET] Preparing to import ${data.length} items...`);

  const batchSize = 50;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const queries = batch.map((item: any) => ({
      sql: "INSERT OR REPLACE INTO master_target_pekerjaan (name, target_value) VALUES (?, ?)",
      args: [item.name, item.target]
    }));
    
    await db.batch(queries, "write");
    console.log(`[IMPORT TARGET] Processed ${Math.min(i + batchSize, data.length)} items...`);
  }

  console.log('[IMPORT TARGET] Import successful.');
}

main().catch(console.error);
