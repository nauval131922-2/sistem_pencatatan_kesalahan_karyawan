const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

try {
    const infractions = db.prepare('SELECT COUNT(*) as count FROM infractions').get();
    const joined = db.prepare('SELECT COUNT(*) as count FROM infractions i JOIN employees e ON i.employee_id = e.id').get();

    console.log('Total infractions:', infractions.count);
    console.log('Infractions with valid employee refs:', joined.count);

    if (infractions.count > joined.count) {
        console.log('Found orphan infractions!');
    }
} catch (err) {
    console.error(err);
}
db.close();
