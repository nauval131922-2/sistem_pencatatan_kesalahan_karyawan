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
    employee_no TEXT UNIQUE,
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

  CREATE TABLE IF NOT EXISTS sales_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tgl TEXT,
    kd_barang TEXT,
    nama_prd TEXT,
    nama_pelanggan TEXT,
    dati_2 TEXT,
    qty REAL,
    harga REAL,
    jumlah REAL,
    raw_data TEXT,
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

// Migration: Tambahkan index UNIQUE pada employee_no untuk mendukung UPSERT
try {
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_no ON employees(employee_no);");
} catch (e) {}

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

// Migration: tambah kolom employee_no ke infractions untuk sinkronisasi permanen
try {
  db.exec("ALTER TABLE infractions ADD COLUMN employee_no TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE infractions ADD COLUMN recorded_by_id INTEGER;");
} catch (e) {}

try {
  db.exec("ALTER TABLE infractions ADD COLUMN recorded_by_no TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE infractions ADD COLUMN order_faktur TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE bahan_baku ADD COLUMN kd_barang TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE barang_jadi ADD COLUMN kd_barang TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE infractions ADD COLUMN item_code TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE bahan_baku ADD COLUMN faktur TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE barang_jadi ADD COLUMN faktur TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE infractions ADD COLUMN item_faktur TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE bahan_baku ADD COLUMN faktur_prd TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE barang_jadi ADD COLUMN faktur_prd TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE sales_reports ADD COLUMN faktur TEXT;");
} catch (e) {}

// --- UPSERT CONSTRAINTS ---
try {
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_unique ON sales_reports(faktur, kd_barang, tgl);");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_barang_jadi_unique ON barang_jadi(faktur, kd_barang, tgl);");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_bahan_baku_unique ON bahan_baku(faktur, kd_barang, tgl);");
} catch (e) {}

// --- PERFORMANCE INDEXES ---
try {
  db.exec("CREATE INDEX IF NOT EXISTS idx_sales_reports_tgl ON sales_reports(tgl);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_sales_reports_nama_prd ON sales_reports(nama_prd);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_sales_reports_faktur ON sales_reports(faktur);");
  
  db.exec("CREATE INDEX IF NOT EXISTS idx_barang_jadi_tgl ON barang_jadi(tgl);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_barang_jadi_nama_prd ON barang_jadi(nama_prd);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_barang_jadi_faktur ON barang_jadi(faktur);");
  
  db.exec("CREATE INDEX IF NOT EXISTS idx_bahan_baku_tgl ON bahan_baku(tgl);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_bahan_baku_nama_prd ON bahan_baku(nama_prd);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_bahan_baku_faktur ON bahan_baku(faktur);");
  
  db.exec("CREATE INDEX IF NOT EXISTS idx_orders_tgl ON orders(tgl);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_orders_faktur ON orders(faktur);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_orders_nama_prd ON orders(nama_prd);");
  
  db.exec("CREATE INDEX IF NOT EXISTS idx_employees_nama ON employees(nama);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_employees_nik ON employees(nik);");
  
  db.exec("CREATE INDEX IF NOT EXISTS idx_infractions_employee_id ON infractions(employee_id);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_infractions_tgl_kejadian ON infractions(tgl_kejadian);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_infractions_no_faktur ON infractions(no_faktur);");
} catch (e) {
  console.error("Failed to create performance indexes:", e);
}

export default db;
