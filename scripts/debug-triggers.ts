import { createClient } from '@libsql/client';
import path from 'path';

async function check(dbName: string) {
    const dbPath = path.join(process.cwd(), dbName);
    const db = createClient({ url: `file:${dbPath}` });
    
    console.log(`\n--- Checking ${dbName} ---`);
    
    try {
        const triggerRes = await db.execute("SELECT name, sql FROM sqlite_master WHERE type='trigger' AND name='trg_users_update'");
        if (triggerRes.rows.length > 0) {
            console.log(`Trigger trg_users_update found:`);
            console.log(triggerRes.rows[0].sql);
        } else {
            console.log(`Trigger trg_users_update NOT found.`);
        }
        
        const logsRes = await db.execute("SELECT id, message, table_name, recorded_by FROM activity_logs ORDER BY id DESC LIMIT 5");
        console.log(`Latest 5 logs:`);
        console.table(logsRes.rows);
    } catch (e: any) {
        console.error(`Error checking ${dbName}: ${e.message}`);
    }
}

async function run() {
    await check('database.sqlite');
    await check('database_dev.sqlite');
}

run();
