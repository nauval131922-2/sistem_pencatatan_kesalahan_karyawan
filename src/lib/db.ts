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
    updated_at DATETIME DEFAULT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    raw_data TEXT NOT NULL,
    recorded_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faktur TEXT UNIQUE NOT NULL,
    nama_prd TEXT NOT NULL,
    nama_pelanggan TEXT,
    tgl TEXT,
    qty REAL,
    harga REAL,
    jumlah REAL,
    raw_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bahan_baku (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tgl TEXT,
    nama_barang TEXT NOT NULL,
    qty REAL,
    satuan TEXT,
    nama_prd TEXT NOT NULL,
    hp REAL,
    raw_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS barang_jadi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tgl TEXT,
    nama_barang TEXT NOT NULL,
    qty REAL,
    satuan TEXT,
    nama_prd TEXT NOT NULL,
    hp REAL,
    raw_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS hpp_kalkulasi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_order TEXT UNIQUE NOT NULL,
    hpp_kalkulasi REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS faktur_sequences (
    prefix TEXT PRIMARY KEY,
    last_seq INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

// Migration: tambah kolom updated_at
try {
  db.exec("ALTER TABLE infractions ADD COLUMN updated_at DATETIME DEFAULT NULL;");
} catch (e) {}


// Migration: tambah kolom-kolom baru untuk form kesalahan (relasi Excel)
const infractionColumns = [
  'jenis_barang TEXT',
  'nama_barang TEXT',
  'jenis_harga TEXT',
  'jumlah REAL',
  'harga REAL',
  'total REAL'
];

infractionColumns.forEach(col => {
  try {
    const colName = col.split(' ')[0];
    db.exec(`ALTER TABLE infractions ADD COLUMN ${colName} ${col.split(' ').slice(1).join(' ')};`);
  } catch (e) {}
});

export default db;
