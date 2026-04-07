import path from 'path';
import { initIndexing } from './db-indexing';

export async function initSchema(db: any) {
  // 1. Initial configuration for better concurrency
  try {
    const executor = db.client || db;
    if (executor.execute) {
      await executor.execute("PRAGMA busy_timeout = 5000;");
      await executor.execute("PRAGMA journal_mode = WAL;");
    }
  } catch (e) {
    // Ignore pragma errors
  }

  // 2. Initialize core schema using batch for efficiency
  // All fields are consolidated here so NEW databases are perfect from start.
  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      photo TEXT,
      role TEXT DEFAULT 'Admin',
      recorded_by TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      department TEXT NOT NULL,
      employee_no TEXT UNIQUE,
      is_active INTEGER DEFAULT 1,
      recorded_by TEXT,
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
      faktur TEXT,
      updated_at DATETIME DEFAULT NULL,
      jenis_barang TEXT,
      nama_barang TEXT,
      jenis_harga TEXT,
      jumlah REAL,
      harga REAL,
      total REAL,
      employee_name TEXT,
      employee_position TEXT,
      recorded_by_name TEXT,
      recorded_by_position TEXT,
      employee_no TEXT,
      recorded_by_id INTEGER,
      recorded_by_no TEXT,
      order_faktur TEXT,
      item_code TEXT,
      item_faktur TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      satuan TEXT,
      harga REAL,
      jumlah REAL,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS bahan_baku (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tgl TEXT,
      nama_barang TEXT NOT NULL,
      kd_barang TEXT,
      faktur TEXT,
      faktur_prd TEXT,
      faktur_aktifitas TEXT,
      kd_cabang TEXT,
      kd_gudang TEXT,
      qty REAL,
      satuan TEXT,
      status TEXT,
      hp REAL,
      hp_total REAL,
      keterangan TEXT,
      fkt_hasil TEXT,
      nama_prd TEXT NOT NULL,
      aktifitas TEXT,
      username TEXT,
      kd_pelanggan TEXT,
      recid TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS barang_jadi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tgl TEXT,
      nama_barang TEXT NOT NULL,
      kd_barang TEXT,
      faktur TEXT,
      faktur_prd TEXT,
      faktur_so TEXT,
      kd_cabang TEXT,
      kd_gudang TEXT,
      qty_wip_awal REAL,
      qty REAL,
      qty_wip_akhir REAL,
      total_berat_kg REAL,
      pers_alokasi_hp REAL,
      mtd_alokasi_hp TEXT,
      tgl_expired TEXT,
      selesai INTEGER,
      status INTEGER,
      hp REAL,
      hp_total REAL,
      bbb REAL,
      btkl REAL,
      bop REAL,
      keterangan TEXT,
      username TEXT,
      kd_pelanggan TEXT,
      qty_order REAL,
      qty_so REAL,
      recid TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS hpp_kalkulasi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_order TEXT UNIQUE NOT NULL,
      hpp_kalkulasi REAL NOT NULL DEFAULT 0,
      keterangan TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS sales_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT,
      kd_pelanggan TEXT,
      tgl TEXT,
      kd_barang TEXT,
      faktur_so TEXT,
      jthtmp TEXT,
      harga REAL,
      qty REAL,
      jumlah REAL,
      ppn REAL,
      faktur_prd TEXT,
      nama_prd TEXT,
      no_ref_pelanggan TEXT,
      nama_pelanggan TEXT,
      dati_2 TEXT,
      gol_barang TEXT,
      keterangan_so TEXT,
      recid TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(faktur, kd_barang, tgl)
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
    );`,
    `CREATE TABLE IF NOT EXISTS sph_out (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT UNIQUE NOT NULL,
      tgl TEXT,
      kd_pelanggan TEXT,
      barang TEXT,
      total REAL,
      status TEXT,
      faktur_so TEXT,
      faktur_bom TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS sales_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT UNIQUE NOT NULL,
      kd_pelanggan TEXT,
      tgl TEXT,
      kd_barang TEXT,
      faktur_sph TEXT,
      top_hari TEXT,
      harga REAL,
      qty REAL,
      satuan TEXT,
      jumlah REAL,
      ppn REAL,
      faktur_prd TEXT,
      nama_prd TEXT,
      nama_pelanggan TEXT,
      dati_2 TEXT,
      gol_barang TEXT,
      spesifikasi TEXT,
      keterangan TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS session_context (
      id INTEGER PRIMARY KEY DEFAULT 1,
      username TEXT,
      last_menu TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS bill_of_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT UNIQUE NOT NULL,
      tgl TEXT,
      kd_mtd TEXT,
      nama_prd TEXT,
      kd_pelanggan TEXT,
      bbb REAL,
      btkl REAL,
      bop REAL,
      hp REAL,
      spesifikasi TEXT,
      kd_barang TEXT,
      qty_order REAL,
      satuan TEXT,
      faktur_sph TEXT,
      faktur_prd TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS purchase_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT UNIQUE NOT NULL,
      tgl TEXT,
      tgl_dibutuhkan TEXT,
      faktur_prd TEXT,
      kd_gudang TEXT,
      kd_cabang TEXT,
      status TEXT,
      username TEXT,
      keterangan TEXT,
      faktur_spph TEXT,
      faktur_po TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS spph_out (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT UNIQUE NOT NULL,
      tgl TEXT,
      faktur_pr TEXT,
      faktur_prd TEXT,
      kd_gudang TEXT,
      kd_cabang TEXT,
      kd_supplier TEXT,
      status TEXT,
      keterangan TEXT,
      faktur_sph TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS sph_in (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT UNIQUE NOT NULL,
      tgl TEXT,
      top_hari TEXT,
      faktur_spph TEXT,
      faktur_prd TEXT,
      kd_gudang TEXT,
      kd_cabang TEXT,
      kd_supplier TEXT,
      subtotal REAL,
      persppn REAL,
      ppn REAL,
      total REAL,
      status TEXT,
      username TEXT,
      faktur_po TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT UNIQUE NOT NULL,
      tgl TEXT,
      top_hari TEXT,
      faktur_pr TEXT,
      faktur_sph TEXT,
      kd_gudang TEXT,
      kd_cabang TEXT,
      kd_supplier TEXT,
      subtotal REAL,
      persppn REAL,
      ppn REAL,
      biaya_kirim REAL,
      total REAL,
      status TEXT,
      tgl_close TEXT,
      status_close TEXT,
      mydata TEXT,
      ket_pr TEXT,
      faktur_pb TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS penerimaan_pembelian (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT UNIQUE NOT NULL,
      tgl TEXT,
      top_hari TEXT,
      jthtmp TEXT,
      faktur_po TEXT,
      faktur_prd TEXT,
      faktur_supplier TEXT,
      kd_gudang TEXT,
      kd_cabang TEXT,
      kd_supplier TEXT,
      subtotal REAL,
      diskon REAL,
      pembulatan REAL,
      persppn REAL,
      ppn REAL,
      biaya_kirim REAL,
      total REAL,
      porsekot REAL,
      hutang REAL,
      kas REAL,
      status TEXT,
      tgl_lunas TEXT,
      username TEXT,
      keterangan_pr TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS rekap_pembelian_barang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT,
      kd_supplier TEXT,
      tgl TEXT,
      kd_barang TEXT,
      faktur_po TEXT,
      jthtmp TEXT,
      harga REAL,
      qty REAL,
      kd_cabang TEXT,
      pers_diskon1 REAL,
      diskon_item REAL,
      jumlah REAL,
      ppn REAL,
      username TEXT,
      total_item REAL,
      hj REAL,
      gol_barang TEXT,
      diskon REAL,
      margin REAL,
      recid TEXT UNIQUE,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS pelunasan_hutang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT UNIQUE NOT NULL,
      tgl TEXT,
      kd_cabang TEXT,
      kd_supplier TEXT,
      pembelian REAL,
      retur REAL,
      subtotal REAL,
      diskon REAL,
      pembulatan REAL,
      total REAL,
      kas REAL,
      bgcek REAL,
      bank REAL,
      porsekot REAL,
      kd_porsekot TEXT,
      kd_bank TEXT,
      status TEXT,
      faktur_pb TEXT,
      keterangan TEXT,
      username TEXT,
      recid TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS pelunasan_piutang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT UNIQUE NOT NULL,
      fkt TEXT,
      tgl TEXT,
      kredit REAL,
      kd_pelanggan TEXT,
      kd_gudang TEXT,
      kd_sales TEXT,
      recid TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS pengiriman (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT,
      tgl TEXT,
      kd_supir TEXT,
      kd_armada TEXT,
      kd_eks TEXT,
      no_resi TEXT,
      status TEXT,
      status_faktur TEXT,
      keterangan TEXT,
      username TEXT,
      waktu_kirim TEXT,
      waktu_selesai TEXT,
      total_faktur INTEGER,
      recid TEXT UNIQUE NOT NULL,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
  ], "write");

  // 2. Incremental Migrations (Silent execution to prevent red log noise)
  const migrations = [
    "ALTER TABLE users ADD COLUMN photo TEXT;",
    "ALTER TABLE employees ADD COLUMN employee_no TEXT;",
    "ALTER TABLE employees ADD COLUMN is_active INTEGER DEFAULT 1;",
    "ALTER TABLE users ADD COLUMN recorded_by TEXT DEFAULT NULL;",
    "ALTER TABLE employees ADD COLUMN recorded_by TEXT DEFAULT NULL;",
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
    "ALTER TABLE orders ADD COLUMN satuan TEXT;",
    "ALTER TABLE session_context ADD COLUMN last_menu TEXT;",
    "ALTER TABLE hpp_kalkulasi ADD COLUMN keterangan TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN faktur_aktifitas TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN kd_cabang TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN kd_gudang TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN status TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN hp_total REAL;",
    "ALTER TABLE bahan_baku ADD COLUMN keterangan TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN fkt_hasil TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN aktifitas TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN username TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN kd_pelanggan TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN recid TEXT;",

    "CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_no ON employees(employee_no);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_unique ON sales_reports(faktur, kd_barang, tgl);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_barang_jadi_unique ON barang_jadi(faktur, kd_barang, tgl);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_bahan_baku_unique ON bahan_baku(faktur, kd_barang, tgl);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_orders_unique ON sales_orders(faktur, kd_barang, tgl);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_bom_unique ON bill_of_materials(faktur);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_pr_unique ON purchase_requests(faktur);",
    "ALTER TABLE sales_orders ADD COLUMN satuan TEXT;",
    "ALTER TABLE barang_jadi ADD COLUMN faktur_so TEXT;",
    "ALTER TABLE barang_jadi ADD COLUMN kd_cabang TEXT;",
    "ALTER TABLE barang_jadi ADD COLUMN kd_gudang TEXT;",
    "ALTER TABLE barang_jadi ADD COLUMN qty_wip_awal REAL;",
    "ALTER TABLE barang_jadi ADD COLUMN qty_wip_akhir REAL;",
    "ALTER TABLE barang_jadi ADD COLUMN total_berat_kg REAL;",
    "ALTER TABLE barang_jadi ADD COLUMN pers_alokasi_hp REAL;",
    "ALTER TABLE barang_jadi ADD COLUMN mtd_alokasi_hp TEXT;",
    "ALTER TABLE barang_jadi ADD COLUMN tgl_expired TEXT;",
    "ALTER TABLE barang_jadi ADD COLUMN selesai INTEGER;",
    "ALTER TABLE barang_jadi ADD COLUMN status INTEGER;",
    "ALTER TABLE barang_jadi ADD COLUMN hp_total REAL;",
    "ALTER TABLE barang_jadi ADD COLUMN bbb REAL;",
    "ALTER TABLE barang_jadi ADD COLUMN btkl REAL;",
    "ALTER TABLE barang_jadi ADD COLUMN bop REAL;",
    "ALTER TABLE barang_jadi ADD COLUMN keterangan TEXT;",
    "ALTER TABLE barang_jadi ADD COLUMN username TEXT;",
    "ALTER TABLE barang_jadi ADD COLUMN kd_pelanggan TEXT;",
    "ALTER TABLE barang_jadi ADD COLUMN qty_order REAL;",
    "ALTER TABLE barang_jadi ADD COLUMN qty_so REAL;",
    "ALTER TABLE barang_jadi ADD COLUMN recid TEXT;",
    "ALTER TABLE barang_jadi ADD COLUMN nama_prd TEXT;",
    "ALTER TABLE bill_of_materials ADD COLUMN satuan TEXT;",
    "ALTER TABLE bill_of_materials ADD COLUMN kd_pelanggan TEXT;",
    "ALTER TABLE sph_out ADD COLUMN kd_pelanggan TEXT;",
    "ALTER TABLE sph_out ADD COLUMN faktur_so TEXT;",
    "ALTER TABLE sph_out ADD COLUMN faktur_bom TEXT;",
    "ALTER TABLE sales_orders ADD COLUMN kd_pelanggan TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN kd_pelanggan TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN faktur_so TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN jthtmp TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN harga REAL;",
    "ALTER TABLE sales_reports ADD COLUMN qty REAL;",
    "ALTER TABLE sales_reports ADD COLUMN jumlah REAL;",
    "ALTER TABLE sales_reports ADD COLUMN ppn REAL;",
    "ALTER TABLE sales_reports ADD COLUMN faktur_prd TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN nama_prd TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN no_ref_pelanggan TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN nama_pelanggan TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN dati_2 TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN gol_barang TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN keterangan_so TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN recid TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN raw_data TEXT;"
  ];

  const executor = db.client || db;
  for (const sql of migrations) {
    try {
      if (executor.execute) {
        await executor.execute(sql);
      }
    } catch (e: any) {
      const msg = (e.message || '').toLowerCase();
      // Only throw if it's NOT a 'already exists' or 'locked' error
      if (!msg.includes('already exists') && !msg.includes('duplicate') && !msg.includes('locked')) {
        console.warn(`[DB] Migration failed for: ${sql.slice(0, 50)}...`, e.message);
      }
    }
  }

  // 3. Performance Optimization
  await db.batch([
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
    "CREATE INDEX IF NOT EXISTS idx_sales_orders_expr_tgl ON sales_orders(substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC);",
    "CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(created_at);",
    "CREATE INDEX IF NOT EXISTS idx_sales_reports_expr_tgl ON sales_reports(substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC);",
    "CREATE INDEX IF NOT EXISTS idx_sales_reports_created_at ON sales_reports(created_at);",
    "DROP INDEX IF EXISTS idx_sales_reports_tgl_id;",
    "CREATE INDEX IF NOT EXISTS idx_sales_reports_expr_tgl ON sales_reports(substr(tgl, 7, 4), substr(tgl, 4, 2), substr(tgl, 1, 2), id ASC);",
    "CREATE INDEX IF NOT EXISTS idx_sales_reports_created_at ON sales_reports(created_at);",
    "CREATE INDEX IF NOT EXISTS idx_sales_orders_expr_tgl ON sales_orders(substr(tgl, 7, 4), substr(tgl, 4, 2), substr(tgl, 1, 2), id ASC);",
    "CREATE INDEX IF NOT EXISTS idx_spph_out_expr_tgl ON spph_out(substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC);",
    "CREATE INDEX IF NOT EXISTS idx_sph_in_expr_tgl ON sph_in(substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC);",
    "CREATE INDEX IF NOT EXISTS idx_purchase_orders_expr_tgl ON purchase_orders(substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC);",
    "CREATE INDEX IF NOT EXISTS idx_penerimaan_pembelian_expr_tgl ON penerimaan_pembelian(substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC);"
  ], "write");

  // 4. SMART AUTOMATED ACTIVITY LOG TRIGGERS
  await initDynamicTriggers(db);

  // 5. FTS5 Search Initialization (Global Search Version incl. ID)
  try {
      // Force recreation of FTS5 tables to ensure structure matches triggers
      await db.execute(`DROP TABLE IF EXISTS bahan_baku_fts`);
      await db.execute(`DROP TABLE IF EXISTS barang_jadi_fts`);
      await db.execute(`DROP TABLE IF EXISTS orders_fts`);
      await db.execute(`DROP TABLE IF EXISTS sales_orders_fts`);
      await db.execute(`DROP TABLE IF EXISTS sales_reports_fts`);
      await db.execute(`DROP TABLE IF EXISTS employees_fts`);
      await db.execute(`DROP TABLE IF EXISTS sph_out_fts`);
      await db.execute(`DROP TABLE IF EXISTS hpp_kalkulasi_fts`);

      // --- FTS5 FOR BAHAN BAKU ---
      await db.execute(`
         CREATE VIRTUAL TABLE bahan_baku_fts USING fts5(
           id, nama_barang, nama_prd, kd_barang, faktur, 
           faktur_prd, faktur_aktifitas, kd_cabang, kd_gudang, 
           status, keterangan, fkt_hasil, aktifitas, 
           username, kd_pelanggan, recid,
           tokenize='unicode61 remove_diacritics 1'
         );
      `);

      // --- FTS5 FOR BARANG JADI ---
      await db.execute(`
         CREATE VIRTUAL TABLE barang_jadi_fts USING fts5(
           id, nama_barang, nama_prd, kd_barang, faktur, 
           faktur_prd, faktur_so, kd_pelanggan, keterangan, username,
           tokenize='unicode61 remove_diacritics 1'
         );
      `);

      // --- FTS5 FOR ORDERS ---
      await db.execute(`
         CREATE VIRTUAL TABLE orders_fts USING fts5(
           id, faktur, nama_prd, nama_pelanggan, satuan,
           tokenize='unicode61 remove_diacritics 1'
         );
      `);

      // --- FTS5 FOR SALES ORDERS ---
      await db.execute(`
         CREATE VIRTUAL TABLE sales_orders_fts USING fts5(
           id, faktur, nama_pelanggan, kd_pelanggan, nama_prd, kd_barang, 
           faktur_sph, faktur_prd, keterangan,
           tokenize='unicode61 remove_diacritics 1'
         );
      `);

      // --- FTS5 FOR EMPLOYEES ---
      await db.execute(`
         CREATE VIRTUAL TABLE employees_fts USING fts5(
           id, name, position, department, employee_no,
           tokenize='unicode61 remove_diacritics 1'
         );
      `);
      await db.execute(`
         CREATE VIRTUAL TABLE hpp_kalkulasi_fts USING fts5(
           id, nama_order, keterangan,
           tokenize='unicode61 remove_diacritics 1'
         );
      `);
      await db.execute(`
         CREATE VIRTUAL TABLE sales_reports_fts USING fts5(
           id, faktur, kd_pelanggan, kd_barang, faktur_so, faktur_prd, 
           nama_prd, nama_pelanggan, dati_2, gol_barang, keterangan_so, recid,
           tokenize='unicode61 remove_diacritics 1'
         );
      `);

      // --- FTS5 FOR SPH OUT ---
      await db.execute(`
         CREATE VIRTUAL TABLE sph_out_fts USING fts5(
            id, faktur, kd_pelanggan, barang, faktur_so,
            tokenize='unicode61 remove_diacritics 1'
         );
      `);

      // Background rebuild of index if empty or structure changed
      try {
        // Sync Bahan Baku
        const ftsCountBB = await db.execute("SELECT COUNT(*) as count FROM bahan_baku_fts");
        const bbCount = await db.execute("SELECT COUNT(*) as count FROM bahan_baku");
        if (Number(ftsCountBB.rows[0].count) < Number(bbCount.rows[0].count)) {
           await db.batch([
              "DELETE FROM bahan_baku_fts",
              `INSERT INTO bahan_baku_fts(id, rowid, nama_barang, nama_prd, kd_barang, faktur, faktur_prd, faktur_aktifitas, kd_cabang, kd_gudang, status, keterangan, fkt_hasil, aktifitas, username, kd_pelanggan, recid)
               SELECT id, id, nama_barang, nama_prd, kd_barang, faktur, faktur_prd, faktur_aktifitas, kd_cabang, kd_gudang, status, keterangan, fkt_hasil, aktifitas, username, kd_pelanggan, recid FROM bahan_baku`
           ], "write");
        }

        // Sync Barang Jadi
        const ftsCountBJ = await db.execute("SELECT COUNT(*) as count FROM barang_jadi_fts");
        const bjCount = await db.execute("SELECT COUNT(*) as count FROM barang_jadi");
        if (Number(ftsCountBJ.rows[0].count) < Number(bjCount.rows[0].count)) {
           await db.batch([
              "DELETE FROM barang_jadi_fts",
              `INSERT INTO barang_jadi_fts(id, rowid, nama_barang, nama_prd, kd_barang, faktur, faktur_prd)
               SELECT id, id, nama_barang, nama_prd, kd_barang, faktur, faktur_prd FROM barang_jadi`
           ], "write");
        }

        // Sync Orders
        const ftsCountORD = await db.execute("SELECT COUNT(*) as count FROM orders_fts");
        const ordCount = await db.execute("SELECT COUNT(*) as count FROM orders");
        if (Number(ftsCountORD.rows[0].count) < Number(ordCount.rows[0].count)) {
           await db.batch([
              "DELETE FROM orders_fts",
              `INSERT INTO orders_fts(id, rowid, faktur, nama_prd, nama_pelanggan, satuan)
               SELECT id, id, faktur, nama_prd, nama_pelanggan, satuan FROM orders`
           ], "write");
        }

        // Sync Sales Orders
        const ftsCountSO = await db.execute("SELECT COUNT(*) as count FROM sales_orders_fts");
        const soCount = await db.execute("SELECT COUNT(*) as count FROM sales_orders");
        if (Number(ftsCountSO.rows[0].count) < Number(soCount.rows[0].count)) {
           await db.batch([
              "DELETE FROM sales_orders_fts",
              `INSERT INTO sales_orders_fts(id, rowid, faktur, nama_pelanggan, kd_pelanggan, nama_prd, kd_barang, faktur_sph, faktur_prd, keterangan)
               SELECT id, id, faktur, nama_pelanggan, kd_pelanggan, nama_prd, kd_barang, faktur_sph, faktur_prd, keterangan FROM sales_orders`
           ], "write");
        }

        // Sync Employees
        const ftsCountEMP = await db.execute("SELECT COUNT(*) as count FROM employees_fts");
        const empCount = await db.execute("SELECT COUNT(*) as count FROM employees");
        if (Number(ftsCountEMP.rows[0].count) < Number(empCount.rows[0].count)) {
           await db.batch([
              "DELETE FROM employees_fts",
              `INSERT INTO employees_fts(id, rowid, name, position, department, employee_no)
               SELECT id, id, name, position, department, employee_no FROM employees WHERE is_active = 1`
           ], "write");
        }

        // Sync HPP Kalkulasi
        const ftsCountHPP = await db.execute("SELECT COUNT(*) as count FROM hpp_kalkulasi_fts");
        const hppCount = await db.execute("SELECT COUNT(*) as count FROM hpp_kalkulasi");
        if (Number(ftsCountHPP.rows[0].count) < Number(hppCount.rows[0].count)) {
           await db.batch([
              "DELETE FROM hpp_kalkulasi_fts",
              `INSERT INTO hpp_kalkulasi_fts(id, rowid, nama_order, keterangan)
               SELECT id, id, nama_order, keterangan FROM hpp_kalkulasi`
           ], "write");
        }

        // Sync Sales Reports
        const ftsCountSR = await db.execute("SELECT COUNT(*) as count FROM sales_reports_fts");
        const srCount = await db.execute("SELECT COUNT(*) as count FROM sales_reports");
        if (Number(ftsCountSR.rows[0].count) < Number(srCount.rows[0].count)) {
           await db.batch([
              "DELETE FROM sales_reports_fts",
              `INSERT INTO sales_reports_fts(id, rowid, faktur, kd_pelanggan, kd_barang, faktur_so, faktur_prd, nama_prd, nama_pelanggan, dati_2, gol_barang, keterangan_so, recid)
               SELECT id, id, faktur, kd_pelanggan, kd_barang, faktur_so, faktur_prd, nama_prd, nama_pelanggan, dati_2, gol_barang, keterangan_so, recid FROM sales_reports`
           ], "write");
        }

        // Sync SPH Out
        const ftsCountSPH = await db.execute("SELECT COUNT(*) as count FROM sph_out_fts");
        const sphCount = await db.execute("SELECT COUNT(*) as count FROM sph_out");
        if (Number(ftsCountSPH.rows[0].count) < Number(sphCount.rows[0].count)) {
           await db.batch([
              "DELETE FROM sph_out_fts",
              `INSERT INTO sph_out_fts(id, rowid, faktur, kd_pelanggan, barang, faktur_so)
               SELECT id, id, faktur, kd_pelanggan, barang, faktur_so FROM sph_out`
           ], "write");
        }
      } catch (err) {
        console.warn("FTS5 background sync failed (non-critical):", err);
      }

      // Triggers for FTS5 consistency
      await db.batch([
          // Bahan Baku
          `DROP TRIGGER IF EXISTS trg_bahan_baku_fts_insert;`,
          `CREATE TRIGGER trg_bahan_baku_fts_insert AFTER INSERT ON bahan_baku BEGIN
            INSERT INTO bahan_baku_fts(id, rowid, nama_barang, nama_prd, kd_barang, faktur, faktur_prd, faktur_aktifitas, kd_cabang, kd_gudang, status, keterangan, fkt_hasil, aktifitas, username, kd_pelanggan, recid)
            VALUES (NEW.id, NEW.id, NEW.nama_barang, NEW.nama_prd, NEW.kd_barang, NEW.faktur, NEW.faktur_prd, NEW.faktur_aktifitas, NEW.kd_cabang, NEW.kd_gudang, NEW.status, NEW.keterangan, NEW.fkt_hasil, NEW.aktifitas, NEW.username, NEW.kd_pelanggan, NEW.recid);
          END;`,
          `DROP TRIGGER IF EXISTS trg_bahan_baku_fts_update;`,
          `CREATE TRIGGER trg_bahan_baku_fts_update AFTER UPDATE ON bahan_baku BEGIN
            DELETE FROM bahan_baku_fts WHERE rowid = OLD.id;
            INSERT INTO bahan_baku_fts(id, rowid, nama_barang, nama_prd, kd_barang, faktur, faktur_prd, faktur_aktifitas, kd_cabang, kd_gudang, status, keterangan, fkt_hasil, aktifitas, username, kd_pelanggan, recid)
            VALUES (NEW.id, NEW.id, NEW.nama_barang, NEW.nama_prd, NEW.kd_barang, NEW.faktur, NEW.faktur_prd, NEW.faktur_aktifitas, NEW.kd_cabang, NEW.kd_gudang, NEW.status, NEW.keterangan, NEW.fkt_hasil, NEW.aktifitas, NEW.username, NEW.kd_pelanggan, NEW.recid);
          END;`,
          `DROP TRIGGER IF EXISTS trg_bahan_baku_fts_delete;`,
          `CREATE TRIGGER trg_bahan_baku_fts_delete AFTER DELETE ON bahan_baku BEGIN
            DELETE FROM bahan_baku_fts WHERE rowid = OLD.id;
          END;`,

          // Barang Jadi
          `DROP TRIGGER IF EXISTS trg_barang_jadi_fts_insert;`,
          `CREATE TRIGGER trg_barang_jadi_fts_insert AFTER INSERT ON barang_jadi BEGIN
            INSERT INTO barang_jadi_fts(id, rowid, nama_barang, nama_prd, kd_barang, faktur, faktur_prd, faktur_so, kd_pelanggan, keterangan, username)
            VALUES (NEW.id, NEW.id, NEW.nama_barang, NEW.nama_prd, NEW.kd_barang, NEW.faktur, NEW.faktur_prd, NEW.faktur_so, NEW.kd_pelanggan, NEW.keterangan, NEW.username);
          END;`,
          `DROP TRIGGER IF EXISTS trg_barang_jadi_fts_update;`,
          `CREATE TRIGGER trg_barang_jadi_fts_update AFTER UPDATE ON barang_jadi BEGIN
            DELETE FROM barang_jadi_fts WHERE rowid = OLD.id;
            INSERT INTO barang_jadi_fts(id, rowid, nama_barang, nama_prd, kd_barang, faktur, faktur_prd, faktur_so, kd_pelanggan, keterangan, username)
            VALUES (NEW.id, NEW.id, NEW.nama_barang, NEW.nama_prd, NEW.kd_barang, NEW.faktur, NEW.faktur_prd, NEW.faktur_so, NEW.kd_pelanggan, NEW.keterangan, NEW.username);
          END;`,
          `DROP TRIGGER IF EXISTS trg_barang_jadi_fts_delete;`,
          `CREATE TRIGGER trg_barang_jadi_fts_delete AFTER DELETE ON barang_jadi BEGIN
            DELETE FROM barang_jadi_fts WHERE rowid = OLD.id;
          END;`,

          // Orders
          `DROP TRIGGER IF EXISTS trg_orders_fts_insert;`,
          `CREATE TRIGGER trg_orders_fts_insert AFTER INSERT ON orders BEGIN
            INSERT INTO orders_fts(id, rowid, faktur, nama_prd, nama_pelanggan, satuan)
            VALUES (NEW.id, NEW.id, NEW.faktur, NEW.nama_prd, NEW.nama_pelanggan, NEW.satuan);
          END;`,
          `DROP TRIGGER IF EXISTS trg_orders_fts_update;`,
          `CREATE TRIGGER trg_orders_fts_update AFTER UPDATE ON orders BEGIN
            DELETE FROM orders_fts WHERE rowid = OLD.id;
            INSERT INTO orders_fts(id, rowid, faktur, nama_prd, nama_pelanggan, satuan)
            VALUES (NEW.id, NEW.id, NEW.faktur, NEW.nama_prd, NEW.nama_pelanggan, NEW.satuan);
          END;`,
          `DROP TRIGGER IF EXISTS trg_orders_fts_delete;`,
          `CREATE TRIGGER trg_orders_fts_delete AFTER DELETE ON orders BEGIN
            DELETE FROM orders_fts WHERE rowid = OLD.id;
          END;`,

          // Employees
          `DROP TRIGGER IF EXISTS trg_employees_fts_insert;`,
          `CREATE TRIGGER trg_employees_fts_insert AFTER INSERT ON employees
            WHEN NEW.is_active = 1 BEGIN
            INSERT INTO employees_fts(id, rowid, name, position, department, employee_no)
            VALUES (NEW.id, NEW.id, NEW.name, NEW.position, NEW.department, NEW.employee_no);
          END;`,
          `DROP TRIGGER IF EXISTS trg_employees_fts_update;`,
          `CREATE TRIGGER trg_employees_fts_update AFTER UPDATE ON employees BEGIN
            DELETE FROM employees_fts WHERE rowid = OLD.id;
            INSERT INTO employees_fts(id, rowid, name, position, department, employee_no)
            SELECT NEW.id, NEW.id, NEW.name, NEW.position, NEW.department, NEW.employee_no
            WHERE NEW.is_active = 1;
          END;`,
          `DROP TRIGGER IF EXISTS trg_employees_fts_delete;`,
          `CREATE TRIGGER trg_employees_fts_delete AFTER DELETE ON employees BEGIN
            DELETE FROM employees_fts WHERE rowid = OLD.id;
          END;`,

          // HPP Kalkulasi
          `DROP TRIGGER IF EXISTS trg_hpp_kalkulasi_fts_insert;`,
          `CREATE TRIGGER trg_hpp_kalkulasi_fts_insert AFTER INSERT ON hpp_kalkulasi BEGIN
            INSERT INTO hpp_kalkulasi_fts(id, rowid, nama_order, keterangan)
            VALUES (NEW.id, NEW.id, NEW.nama_order, NEW.keterangan);
          END;`,
          `DROP TRIGGER IF EXISTS trg_hpp_kalkulasi_fts_update;`,
          `CREATE TRIGGER trg_hpp_kalkulasi_fts_update AFTER UPDATE ON hpp_kalkulasi BEGIN
            DELETE FROM hpp_kalkulasi_fts WHERE rowid = OLD.id;
            INSERT INTO hpp_kalkulasi_fts(id, rowid, nama_order, keterangan)
            VALUES (NEW.id, NEW.id, NEW.nama_order, NEW.keterangan);
          END;`,
          `DROP TRIGGER IF EXISTS trg_hpp_kalkulasi_fts_delete;`,
          `CREATE TRIGGER trg_hpp_kalkulasi_fts_delete AFTER DELETE ON hpp_kalkulasi BEGIN
            DELETE FROM hpp_kalkulasi_fts WHERE rowid = OLD.id;
          END;`,

          // Sales Orders
          `DROP TRIGGER IF EXISTS trg_sales_orders_fts_insert;`,
          `CREATE TRIGGER trg_sales_orders_fts_insert AFTER INSERT ON sales_orders BEGIN
            INSERT INTO sales_orders_fts(id, rowid, faktur, nama_pelanggan, kd_pelanggan, nama_prd, kd_barang, faktur_sph, faktur_prd, keterangan)
            VALUES (NEW.id, NEW.id, NEW.faktur, NEW.nama_pelanggan, NEW.kd_pelanggan, NEW.nama_prd, NEW.kd_barang, NEW.faktur_sph, NEW.faktur_prd, NEW.keterangan);
          END;`,
          `DROP TRIGGER IF EXISTS trg_sales_orders_fts_update;`,
          `CREATE TRIGGER trg_sales_orders_fts_update AFTER UPDATE ON sales_orders BEGIN
            DELETE FROM sales_orders_fts WHERE rowid = OLD.id;
            INSERT INTO sales_orders_fts(id, rowid, faktur, nama_pelanggan, kd_pelanggan, nama_prd, kd_barang, faktur_sph, faktur_prd, keterangan)
            VALUES (NEW.id, NEW.id, NEW.faktur, NEW.nama_pelanggan, NEW.kd_pelanggan, NEW.nama_prd, NEW.kd_barang, NEW.faktur_sph, NEW.faktur_prd, NEW.keterangan);
          END;`,
          `DROP TRIGGER IF EXISTS trg_sales_orders_fts_delete;`,
          `CREATE TRIGGER trg_sales_orders_fts_delete AFTER DELETE ON sales_orders BEGIN
            DELETE FROM sales_orders_fts WHERE rowid = OLD.id;
          END;`,

          // Sales Reports
          `DROP TRIGGER IF EXISTS trg_sales_reports_fts_insert;`,
          `CREATE TRIGGER trg_sales_reports_fts_insert AFTER INSERT ON sales_reports BEGIN
            INSERT INTO sales_reports_fts(id, rowid, faktur, kd_pelanggan, kd_barang, faktur_so, faktur_prd, nama_prd, nama_pelanggan, dati_2, gol_barang, keterangan_so, recid)
            VALUES (NEW.id, NEW.id, NEW.faktur, NEW.kd_pelanggan, NEW.kd_barang, NEW.faktur_so, NEW.faktur_prd, NEW.nama_prd, NEW.nama_pelanggan, NEW.dati_2, NEW.gol_barang, NEW.keterangan_so, NEW.recid);
          END;`,
          `DROP TRIGGER IF EXISTS trg_sales_reports_fts_update;`,
          `CREATE TRIGGER trg_sales_reports_fts_update AFTER UPDATE ON sales_reports BEGIN
            DELETE FROM sales_reports_fts WHERE rowid = OLD.id;
            INSERT INTO sales_reports_fts(id, rowid, faktur, kd_pelanggan, kd_barang, faktur_so, faktur_prd, nama_prd, nama_pelanggan, dati_2, gol_barang, keterangan_so, recid)
            VALUES (NEW.id, NEW.id, NEW.faktur, NEW.kd_pelanggan, NEW.kd_barang, NEW.faktur_so, NEW.faktur_prd, NEW.nama_prd, NEW.nama_pelanggan, NEW.dati_2, NEW.gol_barang, NEW.keterangan_so, NEW.recid);
          END;`,
          `DROP TRIGGER IF EXISTS trg_sales_reports_fts_delete;`,
          `CREATE TRIGGER trg_sales_reports_fts_delete AFTER DELETE ON sales_reports BEGIN
            DELETE FROM sales_reports_fts WHERE rowid = OLD.id;
          END;`,

          // SPH Out
          `DROP TRIGGER IF EXISTS trg_sph_out_fts_insert;`,
          `CREATE TRIGGER trg_sph_out_fts_insert AFTER INSERT ON sph_out BEGIN
            INSERT INTO sph_out_fts(id, rowid, faktur, kd_pelanggan, barang, faktur_so)
            VALUES (NEW.id, NEW.id, NEW.faktur, NEW.kd_pelanggan, NEW.barang, NEW.faktur_so);
          END;`,
          `DROP TRIGGER IF EXISTS trg_sph_out_fts_update;`,
          `CREATE TRIGGER trg_sph_out_fts_update AFTER UPDATE ON sph_out BEGIN
            DELETE FROM sph_out_fts WHERE rowid = OLD.id;
            INSERT INTO sph_out_fts(id, rowid, faktur, kd_pelanggan, barang, faktur_so)
            VALUES (NEW.id, NEW.id, NEW.faktur, NEW.kd_pelanggan, NEW.barang, NEW.faktur_so);
          END;`,
          `DROP TRIGGER IF EXISTS trg_sph_out_fts_delete;`,
          `CREATE TRIGGER trg_sph_out_fts_delete AFTER DELETE ON sph_out BEGIN
            DELETE FROM sph_out_fts WHERE rowid = OLD.id;
          END;`
      ], "write");

  } catch (e: any) {
     console.error("[FTS-INIT] Failed to initialize FTS5:", e.message);
  }

  // 6. Default Admin Setup
  const userCount = await db.execute("SELECT COUNT(*) as count FROM users");
  if (userCount.rows[0].count === 0 || userCount.rows[0].count === BigInt(0)) {
    const defaultPasswordHash = "$2b$10$HLZeYWR0DjrRN0Dlk/IxGOIbONTF/wup2YJv8TwApJeRbYQ8K7s3.";
    await db.execute({
      sql: `INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`,
      args: ['admin', defaultPasswordHash, 'Administrator', 'Super Admin']
    });
  }

  // 6. Performance Initialization
  await initIndexing(db);
}

/**
 * Dynamically generates C.R.U.D triggers for all tables to ensure 100% audit coverage.
 */
async function initDynamicTriggers(db: any) {
  try {
    const tablesResult = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_fts%' AND name NOT IN ('activity_logs', 'session_context', 'sqlite_sequence', 'system_settings', 'db_indexing_status', 'faktur_sequences')"
    );

    const tables = tablesResult.rows.map((r: any) => r.name);

    for (const table of tables) {
      const info = await db.execute(`PRAGMA table_info(${table})`);
      const cols = info.rows.map((c: any) => c.name as string);

      let label = "NEW.id";
      if (table === 'infractions') label = "NEW.description || ' (' || NEW.severity || ')'";
      else if (table === 'users') label = "NEW.name";
      else if (cols.includes('faktur')) label = "IFNULL(NEW.faktur, 'ID:' || NEW.id)";
      else if (cols.includes('nama_barang')) label = "NEW.nama_barang";
      else if (cols.includes('name')) label = "NEW.name";
      else if (cols.includes('nama_prd')) label = "NEW.nama_prd";
      else if (cols.includes('username')) label = "NEW.username";

      const oldLabel = label.replace(/NEW\./g, 'OLD.');

      const dataCols = cols.filter((c: string) => c !== 'password').map((c: string) => `'${c}', NEW.${c}`).join(', ');
      const oldDataCols = cols.filter((c: string) => c !== 'password').map((c: string) => `'${c}', OLD.${c}`).join(', ');

      const triggerOps = [
        `DROP TRIGGER IF EXISTS trg_${table}_insert`,
        `DROP TRIGGER IF EXISTS trg_${table}_update`,
        `DROP TRIGGER IF EXISTS trg_${table}_delete`,

        `CREATE TRIGGER trg_${table}_insert AFTER INSERT ON ${table} BEGIN
          INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
          VALUES ('CREATE', '${table}', NEW.id, 
            CASE 
              WHEN '${table}' = 'users' THEN 'User baru ditambahkan: ' || ${label}
              WHEN '${table}' = 'infractions' THEN 'Pencatatan Kesalahan baru: ' || ${label}
              ELSE 'Data ' || '${table}' || ' baru: ' || ${label}
            END, 
            json_object(${dataCols}), 
            COALESCE((SELECT username FROM session_context WHERE id = 1), 'System')
          );
        END;`,

        `CREATE TRIGGER trg_${table}_update AFTER UPDATE ON ${table} BEGIN
          INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
          VALUES ('UPDATE', '${table}', NEW.id, 
            CASE 
              WHEN '${table}' = 'users' AND (SELECT last_menu FROM session_context WHERE id = 1) = 'Pengaturan Profil' THEN 'Profil diperbarui'
              ELSE 'Update ' || '${table}' || ': ' || ${label}
            END, 
            json_object(${dataCols}), 
            COALESCE((SELECT username FROM session_context WHERE id = 1), 'System')
          );
        END;`,

        `CREATE TRIGGER trg_${table}_delete AFTER DELETE ON ${table} BEGIN
          INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
          VALUES ('DELETE', '${table}', OLD.id, 
            'Hapus ' || '${table}' || ': ' || ${oldLabel}, 
            json_object(${oldDataCols}), 
            COALESCE((SELECT username FROM session_context WHERE id = 1), 'System')
          );
        END;`
      ];

      try {
        await db.batch(triggerOps, "write");
      } catch (e) {
        console.error(`[DB] Failed to setup triggers for table ${table}:`, e);
      }
    }

    console.log(`[DB] Automated Audit Triggers initialized for ${tables.length} tables.`);
  } catch (err) {
    console.error("[DB] Dynamic Trigger Initialization failed:", err);
  }
}
