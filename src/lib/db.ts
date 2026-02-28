import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS infractions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    severity TEXT CHECK(severity IN ('Low', 'Medium', 'High')) NOT NULL,
    date TEXT NOT NULL,
    recorded_by TEXT NOT NULL,
    order_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );
`);

// Migration: tambah kolom employee_no jika belum ada
try {
  db.exec("ALTER TABLE employees ADD COLUMN employee_no TEXT;");
} catch (e) {
  // Kolom sudah ada
}

// Migration to add order_name if it doesn't exist
try {
  db.exec("ALTER TABLE infractions ADD COLUMN order_name TEXT;");
} catch (e) {}

// Migration: tambah kolom faktur
try {
  db.exec("ALTER TABLE infractions ADD COLUMN faktur TEXT;");
} catch (e) {}


export default db;
