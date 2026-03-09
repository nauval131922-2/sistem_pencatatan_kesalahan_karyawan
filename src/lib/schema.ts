import path from 'path';

export async function initSchema(db: any) {
  // 1. Initialize core schema using batch for efficiency
  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      photo TEXT,
      role TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
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
    "ALTER TABLE users ADD COLUMN photo TEXT;",
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
    "CREATE INDEX IF NOT EXISTS idx_sales_reports_created_at ON sales_reports(created_at);",
    
    // --- AUTOMATED ACTIVITY LOG TRIGGERS ---
    
    // 1. users
    `CREATE TRIGGER IF NOT EXISTS trg_users_insert AFTER INSERT ON users BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('CREATE', 'users', NEW.id, 'User baru ditambahkan: ' || NEW.name, json_object('name', NEW.name, 'username', NEW.username, 'role', NEW.role), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_users_update AFTER UPDATE ON users BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('UPDATE', 'users', NEW.id, 'Data user diubah: ' || NEW.name, json_object('name', NEW.name, 'username', NEW.username, 'role', NEW.role), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_users_delete AFTER DELETE ON users BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('DELETE', 'users', OLD.id, 'User dihapus: ' || OLD.name, json_object('name', OLD.name, 'username', OLD.username), 'System');
    END;`,

    // 2. employees
    `CREATE TRIGGER IF NOT EXISTS trg_employees_insert AFTER INSERT ON employees BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('CREATE', 'employees', NEW.id, 'Karyawan baru: ' || NEW.name || ' (' || NEW.position || ')', json_object('name', NEW.name, 'position', NEW.position, 'department', NEW.department, 'employee_no', NEW.employee_no), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_employees_update AFTER UPDATE ON employees BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('UPDATE', 'employees', NEW.id, 'Data Karyawan diupdate: ' || NEW.name, json_object('name', NEW.name, 'position', NEW.position, 'department', NEW.department, 'is_active', NEW.is_active), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_employees_delete AFTER DELETE ON employees BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('DELETE', 'employees', OLD.id, 'Karyawan dihapus: ' || OLD.name, json_object('name', OLD.name), 'System');
    END;`,

    // 3. infractions
    `CREATE TRIGGER IF NOT EXISTS trg_infractions_insert AFTER INSERT ON infractions BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('CREATE', 'infractions', NEW.id, 'Pencatatan Kesalahan baru ditambahkan (' || NEW.severity || ')', json_object('date', NEW.date, 'description', NEW.description, 'severity', NEW.severity), IFNULL(NEW.recorded_by, 'System'));
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_infractions_update AFTER UPDATE ON infractions BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('UPDATE', 'infractions', NEW.id, 'Catatan Kesalahan diupdate', json_object('date', NEW.date, 'description', NEW.description, 'severity', NEW.severity), IFNULL(NEW.recorded_by, 'System'));
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_infractions_delete AFTER DELETE ON infractions BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('DELETE', 'infractions', OLD.id, 'Catatan Kesalahan dihapus', json_object('date', OLD.date, 'description', OLD.description), IFNULL(OLD.recorded_by, 'System'));
    END;`,

    // 4. orders
    `CREATE TRIGGER IF NOT EXISTS trg_orders_insert AFTER INSERT ON orders BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('CREATE', 'orders', NEW.id, 'Data Order Baru: ' || IFNULL(NEW.faktur, NEW.nama_prd), json_object('faktur', NEW.faktur, 'nama_prd', NEW.nama_prd), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_orders_update AFTER UPDATE ON orders BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('UPDATE', 'orders', NEW.id, 'Data Order Diperbarui: ' || IFNULL(NEW.faktur, NEW.nama_prd), json_object('faktur', NEW.faktur, 'nama_prd', NEW.nama_prd), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_orders_delete AFTER DELETE ON orders BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('DELETE', 'orders', OLD.id, 'Data Order Dihapus: ' || IFNULL(OLD.faktur, OLD.nama_prd), json_object('faktur', OLD.faktur, 'nama_prd', OLD.nama_prd), 'System');
    END;`,

    // 5. bahan_baku
    `CREATE TRIGGER IF NOT EXISTS trg_bahan_baku_insert AFTER INSERT ON bahan_baku BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('CREATE', 'bahan_baku', NEW.id, 'Bahan Baku Masuk: ' || NEW.nama_barang, json_object('nama_barang', NEW.nama_barang, 'qty', NEW.qty, 'nama_prd', NEW.nama_prd), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_bahan_baku_update AFTER UPDATE ON bahan_baku BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('UPDATE', 'bahan_baku', NEW.id, 'Bahan Baku Diperbarui: ' || NEW.nama_barang, json_object('nama_barang', NEW.nama_barang, 'qty', NEW.qty), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_bahan_baku_delete AFTER DELETE ON bahan_baku BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('DELETE', 'bahan_baku', OLD.id, 'Bahan Baku Dihapus: ' || OLD.nama_barang, json_object('nama_barang', OLD.nama_barang), 'System');
    END;`,

    // 6. barang_jadi
    `CREATE TRIGGER IF NOT EXISTS trg_barang_jadi_insert AFTER INSERT ON barang_jadi BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('CREATE', 'barang_jadi', NEW.id, 'Barang Jadi Masuk: ' || NEW.nama_barang, json_object('nama_barang', NEW.nama_barang, 'qty', NEW.qty, 'nama_prd', NEW.nama_prd), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_barang_jadi_update AFTER UPDATE ON barang_jadi BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('UPDATE', 'barang_jadi', NEW.id, 'Barang Jadi Diperbarui: ' || NEW.nama_barang, json_object('nama_barang', NEW.nama_barang, 'qty', NEW.qty), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_barang_jadi_delete AFTER DELETE ON barang_jadi BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('DELETE', 'barang_jadi', OLD.id, 'Barang Jadi Dihapus: ' || OLD.nama_barang, json_object('nama_barang', OLD.nama_barang), 'System');
    END;`,

    // 7. hpp_kalkulasi
    `CREATE TRIGGER IF NOT EXISTS trg_hpp_kalkulasi_insert AFTER INSERT ON hpp_kalkulasi BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('CREATE', 'hpp_kalkulasi', NEW.id, 'HPP Kalkulasi Baru: ' || NEW.nama_order, json_object('nama_order', NEW.nama_order, 'hpp', NEW.hpp_kalkulasi), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_hpp_kalkulasi_update AFTER UPDATE ON hpp_kalkulasi BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('UPDATE', 'hpp_kalkulasi', NEW.id, 'HPP Kalkulasi Diperbarui: ' || NEW.nama_order, json_object('nama_order', NEW.nama_order, 'hpp', NEW.hpp_kalkulasi), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_hpp_kalkulasi_delete AFTER DELETE ON hpp_kalkulasi BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('DELETE', 'hpp_kalkulasi', OLD.id, 'HPP Kalkulasi Dihapus: ' || OLD.nama_order, json_object('nama_order', OLD.nama_order), 'System');
    END;`,

    // 8. sales_reports
    `CREATE TRIGGER IF NOT EXISTS trg_sales_reports_insert AFTER INSERT ON sales_reports BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('CREATE', 'sales_reports', NEW.id, 'Laporan Penjualan Masuk: ' || IFNULL(NEW.faktur, NEW.nama_prd), json_object('faktur', NEW.faktur, 'nama_prd', NEW.nama_prd), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_sales_reports_update AFTER UPDATE ON sales_reports BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('UPDATE', 'sales_reports', NEW.id, 'Laporan Penjualan Diperbarui: ' || IFNULL(NEW.faktur, NEW.nama_prd), json_object('faktur', NEW.faktur, 'nama_prd', NEW.nama_prd), 'System');
    END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_sales_reports_delete AFTER DELETE ON sales_reports BEGIN
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES ('DELETE', 'sales_reports', OLD.id, 'Laporan Penjualan Dihapus: ' || IFNULL(OLD.faktur, OLD.nama_prd), json_object('faktur', OLD.faktur, 'nama_prd', OLD.nama_prd), 'System');
    END;`
  ];

  for (const sql of migrations) {
    try {
      await db.execute(sql);
    } catch (e) {
      // Ignore errors (usually "column already exists")
    }
  }

  // 3. Insert default admin user if users table is empty
  const userCount = await db.execute("SELECT COUNT(*) as count FROM users");
  if (userCount.rows[0].count === 0 || userCount.rows[0].count === BigInt(0)) {
    // Hash for 'admin123' generated with bcryptjs
    const defaultPasswordHash = "$2b$10$HLZeYWR0DjrRN0Dlk/IxGOIbONTF/wup2YJv8TwApJeRbYQ8K7s3.";
    await db.execute({
      sql: `INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`,
      args: ['admin', defaultPasswordHash, 'Administrator', 'Super Admin']
    });
    console.log("[DB] Default admin user created (admin / admin123)");
  }
}
