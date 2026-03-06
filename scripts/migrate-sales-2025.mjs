import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine if we want to run against development or production DB
// By default, it will use the production database (database.sqlite)
const isDev = process.env.NODE_ENV === 'development';
const defaultDbName = isDev ? 'database_dev.sqlite' : 'database.sqlite';
const dbPathArg = process.env.DB_PATH || defaultDbName;
const dbPath = path.resolve(process.cwd(), dbPathArg);

console.log('--------------------------------------------------');
console.log(`Starting Migration of "Penggantian Karyawan" Sales`);
console.log(`Database: ${dbPath}`);
console.log('--------------------------------------------------');

const db = new Database(dbPath);

// Find all records that contain "penggantian karyawan" in kd_barang
// Note: We use lower() to make it case-insensitive
let records = [];
try {
  const stmnt = db.prepare(`
    SELECT * FROM sales_reports
    WHERE substr(tgl, 7, 4) = '2025'
    AND lower(kd_barang) LIKE '%penggantian karyawan%'
  `);
  records = stmnt.all();
} catch (error) {
  if (error.message.includes('no such table: sales_reports')) {
    console.log('Table "sales_reports" does not exist yet in the database.');
    console.log('This means there is no sales data to migrate. Exiting smoothly.');
    process.exit(0);
  } else {
    throw error;
  }
}

console.log(`Found ${records.length} sales report records matching criteria from 2025.`);

if (records.length === 0) {
  console.log('No migration needed. Exiting.');
  process.exit(0);
}

// Function to generate error faktur with daily sequence
function generateNextFaktur(dateStr) {
  // Extract DD-MM-YYYY format
  const parts = dateStr.split('-');
  const d = parts[0];
  const m = parts[1];
  const y = parts[2].substring(2, 4); // YY
  const prefix = `ERR-${d}${m}${y}-`;
  
  const getSeqStmt = db.prepare('SELECT last_seq FROM faktur_sequences WHERE prefix = ?');
  const row = getSeqStmt.get(prefix);
  
  let nextSeq = 1;
  if (row) {
    nextSeq = row.last_seq + 1;
    db.prepare('UPDATE faktur_sequences SET last_seq = ?, updated_at = CURRENT_TIMESTAMP WHERE prefix = ?')
      .run(nextSeq, prefix);
  } else {
    db.prepare('INSERT INTO faktur_sequences (prefix, last_seq) VALUES (?, ?)')
      .run(prefix, 1);
  }
  
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

// Ensure "System" employee exists for 'recorded_by'
let systemEmp = db.prepare("SELECT id, name, position FROM employees WHERE name = 'System'").get();
if (!systemEmp) {
  db.prepare("INSERT INTO employees (name, position, department, is_active) VALUES ('System', 'System Admin', 'IT', 1)").run();
  systemEmp = db.prepare("SELECT id, name, position FROM employees WHERE name = 'System'").get();
}

// We wrap the whole migration in a transaction to be safe
const migrateTransaction = db.transaction((recordsToMigrate) => {
  const insertStmt = db.prepare(`
    INSERT INTO infractions (
      employee_id, description, severity, date, recorded_by,
      created_at, faktur, employee_name, employee_position,
      recorded_by_name, recorded_by_position, order_faktur,
      jenis_barang, nama_barang, item_faktur, jenis_harga,
      jumlah, harga, total, order_name, recorded_by_id
    ) VALUES (
      ?, ?, ?, ?, ?,
      CURRENT_TIMESTAMP, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

  let insertedCount = 0;

  for (const rec of recordsToMigrate) {
    // 1. Check if this exact record has already been migrated by checking if its Sales Faktur is anywhere in the description
    const checkStmt = db.prepare("SELECT id FROM infractions WHERE description LIKE ?");
    const exists = checkStmt.get('%' + rec.faktur + '%');
    
    if (exists) {
      console.log(`- Skipping ${rec.faktur}: Already migrated (Infraction ID: ${exists.id})`);
      continue;
    }

    // 2. Resolve employee by name from nama_pelanggan
    let emp = db.prepare('SELECT id, name, position FROM employees WHERE name LIKE ? COLLATE NOCASE').get(rec.nama_pelanggan);
    
    if (!emp) {
      db.prepare("INSERT INTO employees (name, position, department) VALUES (?, 'Karyawan', 'Umum')").run(rec.nama_pelanggan || 'Unknown Karyawan');
      emp = db.prepare('SELECT id, name, position FROM employees WHERE name = ?').get(rec.nama_pelanggan || 'Unknown Karyawan');
    }

    // 3. Generate new Issue Faktur
    const errFaktur = generateNextFaktur(rec.tgl);
    
    // 4. Extract data from kd_barang 
    // Format is usually: "LEMBAR - Art Paper 150-A3+ (Penggantian Karyawan - OP.1175.SOPD.XII.2025)"
    let extractedNamaBarang = rec.kd_barang;
    let extractedOrderName = '';
    const match = rec.kd_barang.match(/(.*?)\\s*\\(Penggantian Karyawan - (.*?)\\)/i);
    if (match) {
      extractedNamaBarang = match[1].trim();
      extractedOrderName = match[2].trim();
    } else {
      const match2 = rec.kd_barang.match(/(.*?)\\s*\\(Penggantian Karyawan(.*?)\\)/i);
      if (match2) {
        extractedNamaBarang = match2[1].trim();
        extractedOrderName = match2[2].replace(/^- /,'').trim();
      }
    }

    const expectedDescStart = `Penggantian Karyawan dari Penjualan: ${rec.faktur}`;
    let description = expectedDescStart;
    if (extractedOrderName) {
      description += ` untuk order ${extractedOrderName}`;
    }

    // 5. Transform Date FROM DD-MM-YYYY (Sales) TO YYYY-MM-DD (Infractions standard)
    const tglParts = rec.tgl.split('-');
    let formattedDate = `${tglParts[2]}-${tglParts[1]}-${tglParts[0]}`;

    // 6. Insert data
    insertStmt.run(
      emp.id,
      description, // Description
      'Low', // Severity
      formattedDate, // date in YYYY-MM-DD format
      'System', // recorded_by string
      errFaktur, // faktur
      emp.name, // employee_name
      emp.position, // employee_position
      'System', // recorded_by_name
      'System Admin', // recorded_by_position
      '', // order_faktur (empty cause not linked by DB relation)
      'Penjualan Barang', // jenis_barang
      extractedNamaBarang, // nama_barang
      rec.kd_barang, // item_faktur (maps to kd_barang of report)
      'Harga Jual Digit', // jenis_harga
      rec.qty, // jumlah
      rec.harga, // harga
      rec.jumlah, // total
      extractedOrderName, // order_name 
      systemEmp.id // recorded_by_id
    );
    
    console.log(`+ Migrated ${rec.faktur} -> ${errFaktur} (${formattedDate})`);
    insertedCount++;
  }

  return insertedCount;
});

try {
  const result = migrateTransaction(records);
  console.log('--------------------------------------------------');
  console.log(`Migration Complete! Successfully inserted ${result} records.`);
  console.log('--------------------------------------------------');
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}
