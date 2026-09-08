import path from 'path'; // Fixed duplicate
import { initIndexing } from './db-indexing';

export async function initSchema(db: any) {
  // 1. Initial configuration for better concurrency
  try {
    const executor = db.client || db;
    if (executor.execute) {
      try { await executor.execute("PRAGMA busy_timeout = 5000;"); } catch {}
      try { await executor.execute("PRAGMA journal_mode = WAL;"); } catch {}
      try { await executor.execute("PRAGMA cache_size = -64000;"); } catch {}    // 64MB cache
      try { await executor.execute("PRAGMA mmap_size = 268435456;"); } catch {}  // 256MB mmap I/O
    }
  } catch {}

  // 2. Auto-migration block: always runs independently of PRAGMA errors
  try {
    const executor = db.client || db;
    if (executor.execute) {
    const fixColumns = [
      { table: 'master_pekerjaan', old: 'target value', new: 'target_value' },
      { table: 'master_pekerjaan', old: 'standart target', new: 'standart_target' },
      { table: 'master_pekerjaan', old: 'target per hari', new: 'target_per_hari' },
      { table: 'master_pekerjaan', old: 'target per jam', new: 'target_per_jam' },
      { table: 'master_pekerjaan', old: 'efektif jam kerja', new: 'efektif_jam_kerja' },
      { table: 'master_pekerjaan', old: 'jumlah plate', new: 'jumlah_plate' },
      { table: 'master_pekerjaan', old: 'target per jam plate', new: 'target_per_jam_plate' },
      { table: 'master_pekerjaan', old: 'persiapan mesin', new: 'persiapan_mesin' },
      { table: 'master_pekerjaan', old: 'waktu ganti plate', new: 'waktu_ganti_plate' },
      { table: 'master_pekerjaan', old: 'jml gosok plate', new: 'jml_gosok_plate' },
      { table: 'master_pekerjaan', old: 'waktu gosok plate', new: 'waktu_gosok_plate' },
      { table: 'master_pekerjaan', old: 'asumsi target per hari', new: 'asumsi_target_per_hari' },
    ];

    for (const col of fixColumns) {
      try {
        const check = await executor.execute(`PRAGMA table_info(${col.table})`);
        const columns = (check.rows as any[]).map(r => r.name);
        if (columns.includes(col.old) && !columns.includes(col.new)) {
          console.log(`[DB] Renaming column ${col.old} to ${col.new}...`);
          await executor.execute(`ALTER TABLE ${col.table} RENAME COLUMN "${col.old}" TO ${col.new}`);
        }
      } catch (e) {
        console.error(`[DB] Failed to fix column ${col.old}:`, e);
      }
    }

    const columns = [
      { table: 'master_pekerjaan', column: 'sub_category', type: 'TEXT' },
      { table: 'master_pekerjaan', column: 'group_pekerjaan', type: 'TEXT' },
      { table: 'master_pekerjaan', column: 'target_value', type: 'REAL' },
      { table: 'master_pekerjaan', column: 'standart_target', type: 'REAL' },
      { table: 'master_pekerjaan', column: 'unit_mesin', type: 'TEXT' },
      { table: 'master_pekerjaan', column: 'jumlah_plate', type: 'REAL' },
      { table: 'master_pekerjaan', column: 'target_per_jam_plate', type: 'REAL' },
      { table: 'master_pekerjaan', column: 'persiapan_mesin', type: 'REAL' },
      { table: 'master_pekerjaan', column: 'waktu_ganti_plate', type: 'REAL' },
      { table: 'master_pekerjaan', column: 'jml_gosok_plate', type: 'REAL' },
      { table: 'master_pekerjaan', column: 'waktu_gosok_plate', type: 'REAL' },
      { table: 'master_pekerjaan', column: 'asumsi_target_per_hari', type: 'REAL' },
      { table: 'master_pekerjaan', column: 'target_per_hari', type: 'REAL' },
      { table: 'master_pekerjaan', column: 'target_per_jam', type: 'REAL' },
      { table: 'master_pekerjaan', column: 'efektif_jam_kerja', type: 'REAL' },
      { table: 'master_pekerjaan', column: 'keterangan', type: 'TEXT' },
      { table: 'sopd_harga', column: 'pending_produksi', type: 'INTEGER DEFAULT 0' },
      { table: 'sopd_harga', column: 'alasan_pending', type: 'TEXT' },
      { table: 'users', column: 'is_active', type: 'INTEGER DEFAULT 1' },
      { table: 'users', column: 'employee_id', type: 'INTEGER DEFAULT NULL' },
      { table: 'laporan_pekerjaan', column: 'bagian', type: 'TEXT DEFAULT \'\'' },
      { table: 'laporan_pekerjaan', column: 'tgl_order', type: 'TEXT DEFAULT \'\'' },
      { table: 'laporan_pekerjaan', column: 'start_time', type: 'TEXT DEFAULT \'\'' },
      { table: 'laporan_pekerjaan', column: 'end_time', type: 'TEXT DEFAULT \'\'' },
    ];

    for (const col of columns) {
      try {
        await executor.execute(`ALTER TABLE ${col.table} ADD COLUMN ${col.column} ${col.type}`);
        console.log(`[DB] Migration: Added column ${col.column} to ${col.table}`);
      } catch {}
    }

    for (let i = 1; i <= 7; i++) {
      try {
        await executor.execute(`ALTER TABLE master_pekerjaan ADD COLUMN ket_${i} TEXT`);
      } catch {}
    }
    // ----------------------------
    }
  } catch {
    // Ignore migration errors
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
      is_active INTEGER DEFAULT 1,
      employee_id INTEGER DEFAULT NULL,
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

    `CREATE TABLE IF NOT EXISTS telegram_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      telegram_username TEXT,
      nama_karyawan TEXT NOT NULL,
      posisi TEXT,
      absensi TEXT,
      bagian TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME,
      approved_by TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subscription TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id)
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
    `CREATE TABLE IF NOT EXISTS activity_logs_archive (
      id INTEGER PRIMARY KEY,
      action_type TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      raw_data TEXT NOT NULL,
      recorded_by TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS app_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_name TEXT UNIQUE NOT NULL,
      description TEXT,
      color TEXT DEFAULT 'text-indigo-600',
      bg TEXT DEFAULT 'bg-indigo-50',
      border TEXT DEFAULT 'border-indigo-200',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      module_key TEXT NOT NULL,
      can_access INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role, module_key)
    );`,
    `CREATE TABLE IF NOT EXISTS role_laporan_pekerjaan_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT UNIQUE NOT NULL,
      allowed_bagian TEXT DEFAULT '[]',
      allowed_pic TEXT DEFAULT '[]',
      excluded_pic TEXT DEFAULT '[]',
      visible_columns TEXT DEFAULT '[]',
      can_add INTEGER DEFAULT 1,
      can_edit INTEGER DEFAULT 1,
      can_delete INTEGER DEFAULT 1,
      delete_scope TEXT DEFAULT 'all',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, role_name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
    `CREATE TABLE IF NOT EXISTS pricelist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jenis_kalender TEXT NOT NULL,
      oplah INTEGER NOT NULL,
      proses TEXT NOT NULL,
      bahan TEXT NOT NULL,
      ukuran TEXT NOT NULL,
      hpp REAL NOT NULL DEFAULT 0,
      harga REAL NOT NULL DEFAULT 0,
      harga_nego REAL NOT NULL DEFAULT 0,
      profit_pct REAL NOT NULL DEFAULT 0,
      profit_pct_nego REAL NOT NULL DEFAULT 0,
      profit_tot REAL NOT NULL DEFAULT 0,
      profit_tot_nego REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS pricelist_saved_calculations (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      oplah INTEGER NOT NULL DEFAULT 0,
      data TEXT NOT NULL,
      params_snapshot TEXT,
      user_id INTEGER,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_pricelist_saved_calc_cat ON pricelist_saved_calculations (category);`,
    `CREATE INDEX IF NOT EXISTS idx_pricelist_saved_calc_updated ON pricelist_saved_calculations (updated_at);`,

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
    `CREATE TABLE IF NOT EXISTS personal_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      sender TEXT,
      source TEXT DEFAULT 'web',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME DEFAULT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS laporan_pekerjaan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task TEXT NOT NULL,
      project TEXT DEFAULT '',
      division TEXT DEFAULT '',
      bagian TEXT DEFAULT '',
      pic TEXT DEFAULT '',
      priority TEXT DEFAULT 'Low',
      start_date TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      start_time TEXT DEFAULT '',
      end_time TEXT DEFAULT '',
      work_days TEXT DEFAULT '',
      note TEXT DEFAULT '',
      status TEXT DEFAULT 'BELUM DIKERJAKAN',
      source TEXT DEFAULT 'manual',
      tgl_order TEXT DEFAULT '',
      sheet_sync_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT NULL
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
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS sales_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT NOT NULL,
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
      recid TEXT UNIQUE,
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
    );`,
    `CREATE TABLE IF NOT EXISTS sopd (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      no_sopd TEXT NOT NULL,
      nama_order TEXT NOT NULL,
      qty_sopd REAL NOT NULL DEFAULT 0,
      unit TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS sopd_harga (
      no_sopd TEXT PRIMARY KEY,
      perkiraan_harga TEXT,
      keterangan TEXT,
      deadline_date TEXT,
      finished_date TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS master_pekerjaan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      sub_category TEXT,
      group_pekerjaan TEXT,
      target_value REAL,
      standart_target REAL,
      ket_1 TEXT, ket_2 TEXT, ket_3 TEXT, ket_4 TEXT, ket_5 TEXT, ket_6 TEXT, ket_7 TEXT,
      unit_mesin TEXT,
      jumlah_plate REAL,
      target_per_jam_plate REAL,
      persiapan_mesin REAL,
      waktu_ganti_plate REAL,
      jml_gosok_plate REAL,
      waktu_gosok_plate REAL,
      asumsi_target_per_hari REAL,
      target_per_hari REAL,
      target_per_jam REAL,
      efektif_jam_kerja REAL,
      keterangan TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS master_pekerjaan_jurnal_produksi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, name)
    );`,
    `CREATE TABLE IF NOT EXISTS jurnal_harian_produksi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      posisi TEXT,
      absensi REAL,
      tgl TEXT,
      shift TEXT,
      nama_karyawan TEXT,
      no_order TEXT,
      nama_order TEXT,
      jenis_pekerjaan TEXT,
      keterangan TEXT,
      target REAL,
      realisasi REAL,
      no_order_2 TEXT,
      nama_order_2 TEXT,
      jenis_pekerjaan_2 TEXT,
      bahan_kertas TEXT,
      jml_plate REAL,
      warna TEXT,
      inscheet REAL,
      rijek REAL,
      jam TEXT,
      kendala TEXT,
      bagian TEXT,
      is_manual_input INTEGER DEFAULT 0,
      nama_order_manual TEXT,
      nama_order_manual_2 TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT NULL,
      deleted_at DATETIME DEFAULT NULL,
      deleted_by TEXT DEFAULT NULL,
      created_by TEXT DEFAULT NULL,
      updated_by TEXT DEFAULT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS generate_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sesi_generate TEXT NOT NULL,
      tgl_target TEXT NOT NULL,
      nama_karyawan TEXT NOT NULL,
      bagian TEXT NOT NULL,
      shift_generated TEXT,
      shift_corrected TEXT,
      bagian_generated TEXT,
      bagian_corrected TEXT,
      jenis_pekerjaan_generated TEXT,
      jenis_pekerjaan_corrected TEXT,
      no_order_generated TEXT,
      no_order_corrected TEXT,
      target_generated REAL,
      target_corrected REAL,
      keterangan_generated TEXT,
      keterangan_corrected TEXT,
      alasan_koreksi TEXT,
      akurasi INTEGER DEFAULT 1,
      dikoreksi_oleh TEXT,
      dibuat_pada DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS rek_akuntansi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kode TEXT UNIQUE NOT NULL,
      keterangan TEXT NOT NULL,
      jenis TEXT,
      arus_kas TEXT,
      analisa_rasio TEXT,
      harga_pokok TEXT,
      username TEXT,
      recid TEXT,
      raw_data TEXT,
      created_at DATETIME,
      updated_at DATETIME,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS stok_master_barang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kode TEXT UNIQUE NOT NULL,
      barcode TEXT,
      nama TEXT,
      kd_satuan TEXT,
      spesifikasi TEXT,
      berat_kg REAL,
      kd_golongan TEXT,
      kd_kelompok TEXT,
      tampil TEXT,
      prd_std TEXT,
      saldo REAL,
      qty_order REAL,
      hj_ppn TEXT,
      ppn REAL,
      status TEXT,
      pj_hide TEXT,
      royalti TEXT,
      create_at DATETIME,
      updated_at DATETIME,
      username TEXT,
      recid TEXT,
      raw_data TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS usr_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT,
      datetime TEXT,
      channel TEXT,
      username TEXT,
      pesan TEXT,
      data_json TEXT,
      tgl TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_usr_log_tgl ON usr_log(tgl);`,
    `CREATE TABLE IF NOT EXISTS produksi_selesai (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faktur TEXT UNIQUE NOT NULL,
      faktur_bom TEXT,
      faktur_so TEXT,
      faktur_pb TEXT,
      kd_cabang TEXT,
      kd_gudang TEXT,
      tgl TEXT,
      kd_mtd TEXT,
      kd_pelanggan TEXT,
      nama_prd TEXT,
      status TEXT,
      perbaikan TEXT,
      regu TEXT,
      bbb REAL,
      pers_btkl REAL,
      btkl REAL,
      pers_bop REAL,
      bop REAL,
      hp REAL,
      datetime_mulai TEXT,
      datetime_selesai TEXT,
      fkt_selesai TEXT,
      tglclose TEXT,
      wip REAL,
      kd_regu TEXT,
      created_at TEXT,
      username TEXT,
      edited_at TEXT,
      username_edited TEXT,
      recid TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN no_order_2 TEXT;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN nama_order_2 TEXT;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN jenis_pekerjaan_2 TEXT;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN bahan_kertas TEXT;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN jml_plate REAL;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN warna TEXT;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN inscheet REAL;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN rijek REAL;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN jam TEXT;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN kendala TEXT;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN bagian TEXT;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN is_manual_input INTEGER DEFAULT 0;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN updated_at DATETIME DEFAULT NULL;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN deleted_at DATETIME DEFAULT NULL;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN created_by TEXT DEFAULT NULL;",
    "ALTER TABLE jurnal_harian_produksi ADD COLUMN updated_by TEXT DEFAULT NULL;",
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
    "ALTER TABLE barang_jadi ADD COLUMN recid TEXT;",
    "ALTER TABLE sales_reports ADD COLUMN recid TEXT;",
    "ALTER TABLE sales_orders ADD COLUMN recid TEXT;",

    "CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_no ON employees(employee_no);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_recid ON sales_reports(recid);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_barang_jadi_recid ON barang_jadi(recid);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_bahan_baku_recid ON bahan_baku(recid);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_bom_unique ON bill_of_materials(faktur);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_pr_unique ON purchase_requests(faktur);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_unique ON role_permissions(role, module_key);",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_role_laporan_pekerjaan_config_role ON role_laporan_pekerjaan_config(role);",
    "ALTER TABLE role_laporan_pekerjaan_config ADD COLUMN delete_scope TEXT DEFAULT 'all';",
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
    "ALTER TABLE sales_reports ADD COLUMN raw_data TEXT;",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_sopd_no_sopd ON sopd(no_sopd);",
    "CREATE INDEX IF NOT EXISTS idx_sopd_nama_order ON sopd(nama_order);",
    "CREATE INDEX IF NOT EXISTS idx_laporan_pekerjaan_project ON laporan_pekerjaan(project);",
    "CREATE INDEX IF NOT EXISTS idx_laporan_pekerjaan_pic ON laporan_pekerjaan(pic);",
    "CREATE INDEX IF NOT EXISTS idx_laporan_pekerjaan_bagian ON laporan_pekerjaan(bagian);",
    "CREATE INDEX IF NOT EXISTS idx_laporan_pekerjaan_status ON laporan_pekerjaan(status);",
    "CREATE INDEX IF NOT EXISTS idx_orders_faktur ON orders(faktur);",
    "ALTER TABLE sopd ADD COLUMN tgl TEXT;",
    "ALTER TABLE sopd_harga ADD COLUMN keterangan TEXT;",
    "ALTER TABLE sopd_harga ADD COLUMN deadline_date TEXT;",
    "ALTER TABLE sopd_harga ADD COLUMN finished_date TEXT;",
    `CREATE TABLE IF NOT EXISTS master_target_pekerjaan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      target_value REAL,
      unit TEXT DEFAULT 'Unit/Jam',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    "UPDATE produksi_selesai SET nama_prd = TRIM(nama_prd);",
    // ponytail: denorm tracking keys — equality index instead of json_extract/raw_data LIKE
    "ALTER TABLE orders ADD COLUMN faktur_bom TEXT;",
    "ALTER TABLE orders ADD COLUMN faktur_so TEXT;",
    "ALTER TABLE sph_out ADD COLUMN faktur_bom TEXT;",
    "ALTER TABLE bahan_baku ADD COLUMN faktur_pb TEXT;",
    "UPDATE orders SET faktur_bom = json_extract(raw_data,'$.faktur_bom') WHERE (faktur_bom IS NULL OR faktur_bom = '') AND raw_data IS NOT NULL;",
    "UPDATE orders SET faktur_so = json_extract(raw_data,'$.faktur_so') WHERE (faktur_so IS NULL OR faktur_so = '') AND raw_data IS NOT NULL;",
    "UPDATE sph_out SET faktur_bom = json_extract(raw_data,'$.faktur_bom') WHERE (faktur_bom IS NULL OR faktur_bom = '') AND raw_data IS NOT NULL;",
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

  // ponytail: one-shot backfill bahan_baku.faktur_pb from hp_detil/raw_data (scraper fills going forward)
  try {
    if (executor.execute) {
      const need = await executor.execute({
        sql: `SELECT COUNT(*) AS c FROM bahan_baku WHERE (faktur_pb IS NULL OR faktur_pb = '') AND raw_data IS NOT NULL AND raw_data LIKE '%PB%'`,
        args: [],
      });
      const c = Number((need.rows[0] as any)?.c ?? 0);
      if (c > 0 && c < 50000) {
        const rows = await executor.execute({
          sql: `SELECT id, raw_data FROM bahan_baku WHERE (faktur_pb IS NULL OR faktur_pb = '') AND raw_data LIKE '%PB%'`,
          args: [],
        });
        const ops: { sql: string; args: any[] }[] = [];
        for (const row of rows.rows as any[]) {
          const seen = new Set<string>();
          const add = (s: string) => {
            const m = String(s).match(/PB\d{8,}/gi);
            if (m) m.forEach(x => seen.add(x.toUpperCase()));
          };
          try {
            const raw = JSON.parse(row.raw_data || '{}');
            if (raw.hp_detil) {
              try {
                const det = typeof raw.hp_detil === 'string' ? JSON.parse(raw.hp_detil) : raw.hp_detil;
                if (det && typeof det === 'object') {
                  for (const [k, v] of Object.entries(det as Record<string, any>)) {
                    add(k);
                    if (v && typeof v === 'object' && v.faktur) add(String(v.faktur));
                  }
                } else add(String(raw.hp_detil));
              } catch { add(String(raw.hp_detil)); }
            } else add(row.raw_data);
          } catch { add(row.raw_data || ''); }
          if (seen.size === 0) continue;
          ops.push({
            sql: `UPDATE bahan_baku SET faktur_pb = ? WHERE id = ?`,
            args: [[...seen].join(','), row.id],
          });
        }
        const chunk = 100;
        for (let i = 0; i < ops.length; i += chunk) {
          await db.batch(ops.slice(i, i + chunk), 'write');
        }
        if (ops.length) console.log(`[DB] Backfilled faktur_pb on ${ops.length} bahan_baku rows`);
      }
    }
  } catch (e) {
    console.warn('[DB] faktur_pb backfill skipped:', e);
  }

  // 2.5 Seed default roles ONLY if app_roles table is entirely empty
  try {
    if (executor.execute) {
      const res = await executor.execute("SELECT COUNT(*) as c FROM app_roles");
      if (res.rows[0].c === 0) {
        await executor.execute("INSERT OR IGNORE INTO app_roles (role_name, description, color, bg, border) VALUES ('Admin', 'Akses standar dapat dikonfigurasi per modul.', 'text-indigo-600', 'bg-indigo-50', 'border-indigo-200');");
        await db.batch([
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'dashboard', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'sync', 0);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'pembelian_pr', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'pembelian_spph', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'pembelian_sph_in', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'pembelian_po', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'pembelian_penerimaan', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'pembelian_rekap', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'pembelian_hutang', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'produksi_dashboard', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'produksi_bom', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'produksi_orders', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'produksi_bahan_baku', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'produksi_barang_jadi', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'penjualan_sph_out', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'penjualan_so', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'penjualan_laporan', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'penjualan_piutang', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'penjualan_pengiriman', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'karyawan', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'hpp_kalkulasi', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'pricelist_kalkulasi', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'catat_kesalahan', 1);",
          "INSERT OR IGNORE INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'tracking_manufaktur', 1);"
        ], "write");
      }
    }
  } catch (e: any) {
    if (!e.message?.includes('no such table')) {
      console.warn("[DB] Failed seeding permissions:", e.message);
    }
  }

  // 2.6 Backfill user_roles dari kolom users.role (migrasi ke multiple role)
  // Hanya jalankan jika user_roles masih kosong tapi users sudah ada data.
  try {
    if (executor.execute) {
      const urCount = await executor.execute("SELECT COUNT(*) as c FROM user_roles");
      const usrCount = await executor.execute("SELECT COUNT(*) as c FROM users");
      const urTotal = Number(urCount.rows[0].c);
      const usrTotal = Number(usrCount.rows[0].c);
      if (urTotal === 0 && usrTotal > 0) {
        const usersResult = await executor.execute("SELECT id, role FROM users WHERE role IS NOT NULL AND role != ''");
        for (const row of usersResult.rows as any[]) {
          try {
            await executor.execute({
              sql: "INSERT OR IGNORE INTO user_roles (user_id, role_name) VALUES (?, ?)",
              args: [row.id, row.role]
            });
          } catch (_) {}
        }
        console.log(`[DB] Backfill user_roles: ${usersResult.rows.length} user(s) migrated.`);
      }
    }
  } catch (e: any) {
    console.warn("[DB] Failed backfill user_roles:", e.message);
  }

  // ponytail: ensure recid populated + unique index created for item-level tables
  try {
    if (executor.execute) {
      // sales_orders
      await executor.execute(`UPDATE sales_orders SET recid = json_extract(raw_data, '$.recid') WHERE (recid IS NULL OR recid = '') AND raw_data LIKE '{%' AND json_extract(raw_data, '$.recid') IS NOT NULL;`).catch(() => {});
      await executor.execute(`UPDATE sales_orders SET recid = 'legacy_' || id WHERE (recid IS NULL OR recid = '');`).catch(() => {});
      await executor.execute(`DELETE FROM sales_orders WHERE id NOT IN (SELECT MAX(id) FROM sales_orders GROUP BY recid);`).catch(() => {});
      await executor.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_orders_recid ON sales_orders(recid);`).catch(() => {});

      // sales_reports
      await executor.execute(`UPDATE sales_reports SET recid = json_extract(raw_data, '$.recid') WHERE (recid IS NULL OR recid = '') AND raw_data LIKE '{%' AND json_extract(raw_data, '$.recid') IS NOT NULL;`).catch(() => {});
      await executor.execute(`UPDATE sales_reports SET recid = 'legacy_' || id WHERE (recid IS NULL OR recid = '');`).catch(() => {});
      await executor.execute(`DELETE FROM sales_reports WHERE id NOT IN (SELECT MAX(id) FROM sales_reports GROUP BY recid);`).catch(() => {});
      await executor.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_recid ON sales_reports(recid);`).catch(() => {});

      // barang_jadi
      await executor.execute(`UPDATE barang_jadi SET recid = json_extract(raw_data, '$.recid') WHERE (recid IS NULL OR recid = '') AND raw_data LIKE '{%' AND json_extract(raw_data, '$.recid') IS NOT NULL;`).catch(() => {});
      await executor.execute(`UPDATE barang_jadi SET recid = 'legacy_' || id WHERE (recid IS NULL OR recid = '');`).catch(() => {});
      await executor.execute(`DELETE FROM barang_jadi WHERE id NOT IN (SELECT MAX(id) FROM barang_jadi GROUP BY recid);`).catch(() => {});
      await executor.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_barang_jadi_recid ON barang_jadi(recid);`).catch(() => {});

      // bahan_baku
      await executor.execute(`UPDATE bahan_baku SET recid = json_extract(raw_data, '$.recid') WHERE (recid IS NULL OR recid = '') AND raw_data LIKE '{%' AND json_extract(raw_data, '$.recid') IS NOT NULL;`).catch(() => {});
      await executor.execute(`UPDATE bahan_baku SET recid = 'legacy_' || id WHERE (recid IS NULL OR recid = '');`).catch(() => {});
      await executor.execute(`DELETE FROM bahan_baku WHERE id NOT IN (SELECT MAX(id) FROM bahan_baku GROUP BY recid);`).catch(() => {});
      await executor.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_bahan_baku_recid ON bahan_baku(recid);`).catch(() => {});
    }
  } catch (e: any) {
    console.warn('[DB] Failed initializing recid unique indexes:', e.message);
  }

  // 2.7 Fix: Hapus UNIQUE constraint pada kolom faktur di sales_orders
  // Constraint ini mencegah satu faktur punya banyak baris (beda kd_barang).
  // Unique key yang benar adalah composite (faktur, kd_barang, tgl) via idx_sales_orders_unique.
  try {
    if (executor.execute) {
      // Cek apakah tabel sales_orders_new sudah ada (artinya migration ini sudah pernah jalan sebagian)
      const tableCheck = await executor.execute(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='sales_orders'`
      );
      if (tableCheck.rows.length > 0) {
        // Cek apakah kolom faktur masih punya UNIQUE constraint dengan melihat index
        const indexCheck = await executor.execute(
          `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='sales_orders' AND name='sqlite_autoindex_sales_orders_1'`
        );
        if (indexCheck.rows.length > 0) {
          // Masih ada auto-index UNIQUE pada faktur, perlu recreate
          await executor.execute(`
            CREATE TABLE IF NOT EXISTS sales_orders_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              faktur TEXT NOT NULL,
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
            )
          `);
          await executor.execute(`INSERT OR IGNORE INTO sales_orders_new SELECT * FROM sales_orders`);
          await executor.execute(`DROP TABLE sales_orders`);
          await executor.execute(`ALTER TABLE sales_orders_new RENAME TO sales_orders`);
          // Recreate composite unique index
          await executor.execute(
            `CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_orders_unique ON sales_orders(faktur, kd_barang, tgl)`
          );
          console.log('[DB] Migration 2.7: sales_orders UNIQUE(faktur) constraint removed, composite index restored.');
        }
      }
    }
  } catch (e: any) {
    console.warn('[DB] Migration 2.7 (sales_orders recreate) failed:', e.message);
  }

  // 3. Performance Optimization
  await db.batch([
    "DROP TRIGGER IF EXISTS trg_jurnal_harian_produksi_insert;",
    "DROP TRIGGER IF EXISTS trg_jurnal_harian_produksi_update;",
    "DROP TRIGGER IF EXISTS trg_jurnal_harian_produksi_delete;",
    "DROP TRIGGER IF EXISTS trg_rek_akuntansi_insert;",
    "DROP TRIGGER IF EXISTS trg_rek_akuntansi_update;",
    "DROP TRIGGER IF EXISTS trg_rek_akuntansi_delete;",
    "DROP TRIGGER IF EXISTS trg_hpp_kalkulasi_insert;",
    "DROP TRIGGER IF EXISTS trg_hpp_kalkulasi_update;",
    "DROP TRIGGER IF EXISTS trg_hpp_kalkulasi_delete;",
    "CREATE INDEX IF NOT EXISTS idx_infractions_date ON infractions(date);",
    "CREATE INDEX IF NOT EXISTS idx_infractions_faktur ON infractions(faktur);",
    "CREATE INDEX IF NOT EXISTS idx_infractions_emp_id ON infractions(employee_id);",
    "CREATE INDEX IF NOT EXISTS idx_infractions_rec_id ON infractions(recorded_by_id);",
    "CREATE INDEX IF NOT EXISTS idx_infractions_emp_no ON infractions(employee_no);",
    "CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id);",
    "CREATE INDEX IF NOT EXISTS idx_telegram_users_nama ON telegram_users(nama_karyawan);",
    "CREATE INDEX IF NOT EXISTS idx_telegram_users_active ON telegram_users(is_active);",
    
    // ponytail: composite indexes untuk activity_logs stats queries (Priority 1)
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at_action ON activity_logs(created_at, action_type);",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at_table ON activity_logs(created_at, table_name);",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at_user ON activity_logs(created_at, recorded_by);",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at_id_desc ON activity_logs(created_at DESC, id DESC);",
    
    // Same for archive table
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_archive_created_at_action ON activity_logs_archive(created_at, action_type);",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_archive_created_at_table ON activity_logs_archive(created_at, table_name);",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_archive_created_at_user ON activity_logs_archive(created_at, recorded_by);",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_archive_created_at_id_desc ON activity_logs_archive(created_at DESC, id DESC);",
    
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
    "CREATE INDEX IF NOT EXISTS idx_penerimaan_pembelian_expr_tgl ON penerimaan_pembelian(substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC);",
    "CREATE INDEX IF NOT EXISTS idx_rekap_pembelian_barang_expr_tgl ON rekap_pembelian_barang(substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC);"
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
      await db.execute(`DROP TABLE IF EXISTS purchase_orders_fts`);
      await db.execute(`DROP TABLE IF EXISTS produksi_selesai_fts`);
      await db.execute(`DROP TABLE IF EXISTS jurnal_harian_produksi_fts`);

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

      // --- FTS5 FOR PURCHASE ORDERS ---
      await db.execute(`
         CREATE VIRTUAL TABLE purchase_orders_fts USING fts5(
            id, faktur, kd_supplier, faktur_pr, faktur_sph, status,
            tokenize='unicode61 remove_diacritics 1'
         );
      `);

      // --- FTS5 FOR PRODUKSI SELESAI ---
      await db.execute(`
         CREATE VIRTUAL TABLE produksi_selesai_fts USING fts5(
            id, faktur, nama_prd, kd_pelanggan, regu, username,
            tokenize='unicode61 remove_diacritics 1'
         );
      `);

      // --- FTS5 FOR JURNAL HARIAN PRODUKSI ---
      await db.execute(`
         CREATE VIRTUAL TABLE jurnal_harian_produksi_fts USING fts5(
            id, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, bagian, shift, no_order_2, nama_order_2, jenis_pekerjaan_2,
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
                SELECT id, id, name, position, department, employee_no FROM employees`
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

        // Sync Purchase Orders
        const ftsCountPO = await db.execute("SELECT COUNT(*) as count FROM purchase_orders_fts");
        const poCount = await db.execute("SELECT COUNT(*) as count FROM purchase_orders");
        if (Number(ftsCountPO.rows[0].count) < Number(poCount.rows[0].count)) {
           await db.batch([
              "DELETE FROM purchase_orders_fts",
              `INSERT INTO purchase_orders_fts(id, rowid, faktur, kd_supplier, faktur_pr, faktur_sph, status)
               SELECT id, id, faktur, kd_supplier, faktur_pr, faktur_sph, status FROM purchase_orders`
           ], "write");
        }

        // Sync Produksi Selesai
        const ftsCountPS = await db.execute("SELECT COUNT(*) as count FROM produksi_selesai_fts");
        const psCount = await db.execute("SELECT COUNT(*) as count FROM produksi_selesai");
        if (Number(ftsCountPS.rows[0].count) < Number(psCount.rows[0].count)) {
           await db.batch([
              "DELETE FROM produksi_selesai_fts",
              `INSERT INTO produksi_selesai_fts(id, rowid, faktur, nama_prd, kd_pelanggan, regu, username)
               SELECT id, id, faktur, nama_prd, kd_pelanggan, regu, username FROM produksi_selesai`
           ], "write");
        }

        // Sync Jurnal Harian Produksi
        const ftsCountJHP = await db.execute("SELECT COUNT(*) as count FROM jurnal_harian_produksi_fts");
        const jhpCount = await db.execute("SELECT COUNT(*) as count FROM jurnal_harian_produksi WHERE deleted_at IS NULL");
        if (Number(ftsCountJHP.rows[0].count) < Number(jhpCount.rows[0].count)) {
           await db.batch([
              "DELETE FROM jurnal_harian_produksi_fts",
              `INSERT INTO jurnal_harian_produksi_fts(id, rowid, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, bagian, shift, no_order_2, nama_order_2, jenis_pekerjaan_2)
               SELECT id, id, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, bagian, shift, no_order_2, nama_order_2, jenis_pekerjaan_2 FROM jurnal_harian_produksi WHERE deleted_at IS NULL`
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
          `CREATE TRIGGER trg_employees_fts_insert AFTER INSERT ON employees BEGIN
            INSERT INTO employees_fts(id, rowid, name, position, department, employee_no)
            VALUES (NEW.id, NEW.id, NEW.name, NEW.position, NEW.department, NEW.employee_no);
          END;`,
          `DROP TRIGGER IF EXISTS trg_employees_fts_update;`,
          `CREATE TRIGGER trg_employees_fts_update AFTER UPDATE ON employees BEGIN
            DELETE FROM employees_fts WHERE rowid = OLD.id;
            INSERT INTO employees_fts(id, rowid, name, position, department, employee_no)
            VALUES (NEW.id, NEW.id, NEW.name, NEW.position, NEW.department, NEW.employee_no);
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
          END;`,

          // Purchase Orders
          `DROP TRIGGER IF EXISTS trg_purchase_orders_fts_insert;`,
          `CREATE TRIGGER trg_purchase_orders_fts_insert AFTER INSERT ON purchase_orders BEGIN
            INSERT INTO purchase_orders_fts(id, rowid, faktur, kd_supplier, faktur_pr, faktur_sph, status)
            VALUES (NEW.id, NEW.id, NEW.faktur, NEW.kd_supplier, NEW.faktur_pr, NEW.faktur_sph, NEW.status);
          END;`,
          `DROP TRIGGER IF EXISTS trg_purchase_orders_fts_update;`,
          `CREATE TRIGGER trg_purchase_orders_fts_update AFTER UPDATE ON purchase_orders BEGIN
            DELETE FROM purchase_orders_fts WHERE rowid = OLD.id;
            INSERT INTO purchase_orders_fts(id, rowid, faktur, kd_supplier, faktur_pr, faktur_sph, status)
            VALUES (NEW.id, NEW.id, NEW.faktur, NEW.kd_supplier, NEW.faktur_pr, NEW.faktur_sph, NEW.status);
          END;`,
          `DROP TRIGGER IF EXISTS trg_purchase_orders_fts_delete;`,
          `CREATE TRIGGER trg_purchase_orders_fts_delete AFTER DELETE ON purchase_orders BEGIN
            DELETE FROM purchase_orders_fts WHERE rowid = OLD.id;
          END;`,

          // Produksi Selesai
          `DROP TRIGGER IF EXISTS trg_produksi_selesai_fts_insert;`,
          `CREATE TRIGGER trg_produksi_selesai_fts_insert AFTER INSERT ON produksi_selesai BEGIN
            INSERT INTO produksi_selesai_fts(id, rowid, faktur, nama_prd, kd_pelanggan, regu, username)
            VALUES (NEW.id, NEW.id, NEW.faktur, NEW.nama_prd, NEW.kd_pelanggan, NEW.regu, NEW.username);
          END;`,
          `DROP TRIGGER IF EXISTS trg_produksi_selesai_fts_update;`,
          `CREATE TRIGGER trg_produksi_selesai_fts_update AFTER UPDATE ON produksi_selesai BEGIN
            DELETE FROM produksi_selesai_fts WHERE rowid = OLD.id;
            INSERT INTO produksi_selesai_fts(id, rowid, faktur, nama_prd, kd_pelanggan, regu, username)
            VALUES (NEW.id, NEW.id, NEW.faktur, NEW.nama_prd, NEW.kd_pelanggan, NEW.regu, NEW.username);
          END;`,
          `DROP TRIGGER IF EXISTS trg_produksi_selesai_fts_delete;`,
          `CREATE TRIGGER trg_produksi_selesai_fts_delete AFTER DELETE ON produksi_selesai BEGIN
            DELETE FROM produksi_selesai_fts WHERE rowid = OLD.id;
          END;`,

          // Jurnal Harian Produksi (only non-deleted)
          `DROP TRIGGER IF EXISTS trg_jurnal_harian_produksi_fts_insert;`,
          `CREATE TRIGGER trg_jurnal_harian_produksi_fts_insert AFTER INSERT ON jurnal_harian_produksi BEGIN
            INSERT INTO jurnal_harian_produksi_fts(id, rowid, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, bagian, shift, no_order_2, nama_order_2, jenis_pekerjaan_2)
            VALUES (NEW.id, NEW.id, NEW.nama_karyawan, NEW.no_order, NEW.nama_order, NEW.jenis_pekerjaan, NEW.keterangan, NEW.bagian, NEW.shift, NEW.no_order_2, NEW.nama_order_2, NEW.jenis_pekerjaan_2);
          END;`,
          `DROP TRIGGER IF EXISTS trg_jurnal_harian_produksi_fts_update;`,
          `CREATE TRIGGER trg_jurnal_harian_produksi_fts_update AFTER UPDATE ON jurnal_harian_produksi WHEN NEW.deleted_at IS NULL BEGIN
            DELETE FROM jurnal_harian_produksi_fts WHERE rowid = OLD.id;
            INSERT INTO jurnal_harian_produksi_fts(id, rowid, nama_karyawan, no_order, nama_order, jenis_pekerjaan, keterangan, bagian, shift, no_order_2, nama_order_2, jenis_pekerjaan_2)
            VALUES (NEW.id, NEW.id, NEW.nama_karyawan, NEW.no_order, NEW.nama_order, NEW.jenis_pekerjaan, NEW.keterangan, NEW.bagian, NEW.shift, NEW.no_order_2, NEW.nama_order_2, NEW.jenis_pekerjaan_2);
          END;`,
          `DROP TRIGGER IF EXISTS trg_jurnal_harian_produksi_fts_delete;`,
          `CREATE TRIGGER trg_jurnal_harian_produksi_fts_delete AFTER DELETE ON jurnal_harian_produksi BEGIN
            DELETE FROM jurnal_harian_produksi_fts WHERE rowid = OLD.id;
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
    const EXCLUDED_TABLES = [
      'activity_logs', 'session_context', 'sqlite_sequence', 'system_settings',
      'db_indexing_status', 'faktur_sequences', 'employees',
      'jurnal_harian_produksi', 'jurnal_umum', 'orders', 'sopd', 'sopd_harga',
      'bahan_baku', 'barang_jadi', 'sales_reports', 'sales_orders',
      'bill_of_materials', 'purchase_requests', 'purchase_orders',
      'penerimaan_pembelian', 'rekap_pembelian_barang', 'pelunasan_hutang',
      'pelunasan_piutang', 'pengiriman', 'spph_out', 'sph_in', 'sph_out', 'rek_akuntansi',
      'hpp_kalkulasi', 'pricelist_items', 'pricelist_saved_calculations', 'stok_master_barang', 'usr_log', 'produksi_selesai', 'user_roles',
      'master_pekerjaan', 'push_subscriptions', 'telegram_users', 'role_permissions', 'app_roles',
      'laporan_pekerjaan', 'role_laporan_pekerjaan_config'
    ];

    // Drop triggers for all excluded tables (cleanup from previous runs)
    for (const tbl of EXCLUDED_TABLES) {
      try {
        await db.batch([
          `DROP TRIGGER IF EXISTS trg_${tbl}_insert`,
          `DROP TRIGGER IF EXISTS trg_${tbl}_update`,
          `DROP TRIGGER IF EXISTS trg_${tbl}_delete`,
        ], "write");
      } catch (_) {}
    }

    const placeholders = EXCLUDED_TABLES.map(() => '?').join(', ');
    const tablesResult = await db.execute(
      `SELECT name FROM sqlite_master 
       WHERE type='table' 
       AND name NOT LIKE 'sqlite_%' 
       AND name NOT LIKE '%_fts%' 
       AND name NOT IN (${placeholders})`,
      EXCLUDED_TABLES
    );

    const tables = tablesResult.rows.map((r: any) => r.name);

    for (const table of tables) {
      const info = await db.execute(`PRAGMA table_info(${table})`);
      const cols = info.rows.map((c: any) => c.name as string);

      const hasId = cols.includes('id');
      const newRecordId = hasId ? "NEW.id" : "0";
      const oldRecordId = hasId ? "OLD.id" : "0";

      let label = hasId ? "NEW.id" : "'NO_ID'";
      if (table === 'infractions') label = "NEW.description || ' (' || NEW.severity || ')'";
      else if (table === 'users') label = "NEW.name";
      else if (cols.includes('faktur')) label = "IFNULL(NEW.faktur, 'ID:' || " + newRecordId + ")";
      else if (cols.includes('no_sopd')) label = "NEW.no_sopd";
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

        `CREATE TRIGGER trg_${table}_insert AFTER INSERT ON ${table}
         WHEN (SELECT COALESCE(last_menu, '') FROM session_context WHERE id = 1) != 'BYPASS_TRIGGER'
         BEGIN
          INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
          VALUES ('INSERT', '${table}', ${newRecordId}, 
            CASE 
              WHEN '${table}' = 'users' THEN 'User baru ditambahkan: ' || ${label}
              WHEN '${table}' = 'infractions' THEN 'Pencatatan Kesalahan baru: ' || ${label}
              ELSE 'Data ' || '${table}' || ' baru: ' || ${label}
            END, 
            json_object(${dataCols}), 
            COALESCE((SELECT username FROM session_context WHERE id = 1), 'System')
          );
        END;`,

        `CREATE TRIGGER trg_${table}_update AFTER UPDATE ON ${table}
         WHEN (SELECT COALESCE(last_menu, '') FROM session_context WHERE id = 1) != 'BYPASS_TRIGGER'
         BEGIN
          INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
          VALUES ('UPDATE', '${table}', ${newRecordId}, 
            CASE 
              WHEN '${table}' = 'users' AND (SELECT last_menu FROM session_context WHERE id = 1) = 'Pengaturan Profil' THEN 'Profil diperbarui'
              ELSE 'Update ' || '${table}' || ': ' || ${label}
            END, 
            json_object('before', json_object(${oldDataCols}), 'after', json_object(${dataCols})), 
            COALESCE((SELECT username FROM session_context WHERE id = 1), 'System')
          );
        END;`,

        `CREATE TRIGGER trg_${table}_delete AFTER DELETE ON ${table}
         WHEN (SELECT COALESCE(last_menu, '') FROM session_context WHERE id = 1) != 'BYPASS_TRIGGER'
         BEGIN
          INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
          VALUES ('DELETE', '${table}', ${oldRecordId}, 
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
