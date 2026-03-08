import db from '../src/lib/db';

async function checkDb() {
  console.log("Starting database check...");
  try {
    const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log("Tables in database:");
    tables.rows.forEach(row => console.log(`- ${row.name}`));

    if (tables.rows.some(r => r.name === 'employees')) {
        const employees = await db.execute("SELECT COUNT(*) as count FROM employees");
        console.log(`- Employees count: ${employees.rows[0].count}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error checking database:", error);
    process.exit(1);
  }
}

checkDb();
