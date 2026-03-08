import path from 'path';

export async function initSchema(db: any) {
  // 1. Initialize core schema using batch for efficiency
  await db.batch([
    `CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      department TEXT NOT NULL,
      employee_no TEXT UNIQUE,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS infractions (
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
    );`,
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      raw_data TEXT NOT NULL,
      recorded_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS orders (
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
    );`,
    `CREATE TABLE IF NOT EXISTS bahan_baku (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tgl TEXT,
      nama_barang TEXT NOT NULL,
      qty REAL,
      satuan TEXT,
      nama_prd TEXT NOT NULL,
      hp REAL,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS barang_jadi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tgl TEXT,
      nama_barang TEXT NOT NULL,
      qty REAL,
      satuan TEXT,
      nama_prd TEXT NOT NULL,
      hp REAL,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS hpp_kalkulasi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_order TEXT UNIQUE NOT NULL,
      hpp_kalkulasi REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS sales_reports (
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
    );`,
    `CREATE TABLE IF NOT EXISTS faktur_sequences (
      prefix TEXT PRIMARY KEY,
      last_seq INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
  ], "write");

  // 2. Incremental Migrations (catch errors if already exists)
  const migrations = [
    "ALTER TABLE employees ADD COLUMN employee_no TEXT;",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_no ON employees(employee_no);",
    "ALTER TABLE employees ADD COLUMN is_active INTEGER DEFAULT 1;",
    "ALTER TABLE infractions ADD COLUMN order_name TEXT;",
    "ALTER TABLE infractions ADD COLUMN faktur TEXT;",
    "ALTER TABLE infractions ADD COLUMN updated_at DATETIME DEFAULT NULL;",
    "ALTER TABLE infractions ADD COLUMN jenis_barang TEXT;",
    "ALTER TABLE infractions ADD COLUMN nama_barang TEXT;",
    "ALTER TABLE infractions ADD COLUMN jenis_harga TEXT;",
    "ALTER TABLE infractions ADD COLUMN jumlah REAL;",
    "ALTER TABLE infractions ADD COLUMN harga REAL;",
    "ALTER TABLE infractions ADD COLUMN total REAL;",
    "ALTER TABLE infractions ADD COLUMN employee_name TEXT;",
    "ALTER TABLE infractions ADD COLUMN employee_position TEXT;",
    "ALTER TABLE infractions ADD COLUMN recorded_by_name TEXT;",
    "ALTER TABLE infractions ADD COLUMN recorded_by_position TEXT;",
    "ALTER TABLE infractions ADD COLUMN employee_no TEXT;",
    "ALTER TABLE infractions ADD COLUMN recorded_by_id INTEGER;",
    "ALTER TABLE infractions ADD COLUMN recorded_by_no TEXT;",
    "ALTER TABLE infractions ADD COLUMN order_faktur TEXT;",
    "ALTER TABLE infractions ADD COLUMN item_code TEXT;",
    "ALTER TABLE infractions ADD COLUMN item_faktur TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN kd_barang TEXT;",
    "ALTER TABLE barang_jadi ADD COLUMN kd_barang TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN faktur TEXT;",
    "ALTER TABLE barang_jadi ADD COLUMN faktur TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN faktur_prd TEXT;",
    "ALTER TABLE barang_jadi ADD COLUMN faktur_prd TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN faktur TEXT;",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_unique ON sales_reports(faktur, kd_barang, tgl);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_barang_jadi_unique ON barang_jadi(faktur, kd_barang, tgl);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_bahan_baku_unique ON bahan_baku(faktur, kd_barang, tgl);",
    "CREATE INDEX IF NOT EXISTS idx_infractions_date ON infractions(date);",
    "CREATE INDEX IF NOT EXISTS idx_infractions_faktur ON infractions(faktur);",
    "CREATE INDEX IF NOT EXISTS idx_infractions_emp_id ON infractions(employee_id);",
    "CREATE INDEX IF NOT EXISTS idx_infractions_rec_id ON infractions(recorded_by_id);",
    "CREATE INDEX IF NOT EXISTS idx_infractions_emp_no ON infractions(employee_no);",
    "DROP INDEX IF EXISTS idx_barang_jadi_tgl_id;",
    "CREATE INDEX IF NOT EXISTS idx_barang_jadi_expr_tgl ON barang_jadi(substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC);",
    "CREATE INDEX IF NOT EXISTS idx_barang_jadi_created_at ON barang_jadi(created_at);",
    "DROP INDEX IF EXISTS idx_bahan_baku_tgl_id;",
    "CREATE INDEX IF NOT EXISTS idx_bahan_baku_expr_tgl ON bahan_baku(substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC);",
    "CREATE INDEX IF NOT EXISTS idx_bahan_baku_created_at ON bahan_baku(created_at);",
    "DROP INDEX IF EXISTS idx_orders_tgl_id;",
    "DROP INDEX IF EXISTS idx_orders_sorting;",
    "CREATE INDEX IF NOT EXISTS idx_orders_expr_tgl ON orders(substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC);",
    "CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);",
    "DROP INDEX IF EXISTS idx_sales_reports_tgl_id;",
    "CREATE INDEX IF NOT EXISTS idx_sales_reports_expr_tgl ON sales_reports(substr(tgl, 7, 4), substr(tgl, 4, 2), substr(tgl, 1, 2), id ASC);",
    "CREATE INDEX IF NOT EXISTS idx_sales_reports_created_at ON sales_reports(created_at);"
  ];

  for (const sql of migrations) {
    try {
      await db.execute(sql);
    } catch (e) {
      // Ignore errors (usually "column already exists")
    }
  }
}
