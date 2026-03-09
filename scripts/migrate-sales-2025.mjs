import { createClient } from '@libsql/client';
import path from 'path';

// Determine if we want to run against development or production DB
// By default, it will use the production database (database.sqlite)
const isDev = process.env.NODE_ENV === 'development';
const isRemote = !!process.env.TURSO_DATABASE_URL;

let dbUrl = '';
if (isRemote) {
  dbUrl = process.env.TURSO_DATABASE_URL;
} else {
  if (!isDev && !isRemote) {
    console.error("[DB ERROR] Running in Production without TURSO_DATABASE_URL environment variable.");
  }
  const defaultDbName = isDev ? 'database_dev.sqlite' : 'database.sqlite';
  const dbPath = path.resolve(process.cwd(), process.env.DB_PATH || defaultDbName);
  dbUrl = `file:${dbPath}`;
}

console.log('--------------------------------------------------');
console.log(`Starting Migration of "Penggantian Karyawan" Sales`);
console.log(`[DB] Environment: ${process.env.NODE_ENV}, Mode: ${isRemote ? 'Remote (Turso)' : 'Local (File)'}`);
if (isRemote) {
    console.log(`[DB] Remote URL: ${dbUrl.substring(0, 20)}...`);
} else {
    console.log(`Database: ${dbUrl}`);
}
console.log('--------------------------------------------------');

const db = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Find all records that contain "penggantian karyawan" in kd_barang
// Note: We use lower() to make it case-insensitive
let records = [];
try {
  const result = await db.execute(`
    SELECT * FROM sales_reports
    WHERE substr(tgl, 7, 4) = '2025'
    AND lower(kd_barang) LIKE '%penggantian karyawan%'
  `);
  records = result.rows;
} catch (error) {
  if (error.message.includes('no such table: sales_reports') || error.message.includes('no such table')) {
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
async function generateNextFaktur(dateStr) {
  // Extract DD-MM-YYYY format
  const parts = dateStr.split('-');
  const d = parts[0];
  const m = parts[1];
  const y = parts[2].substring(2, 4); // YY
  const prefix = `ERR-${d}${m}${y}-`;
  
  const getSeqRes = await db.execute({
    sql: 'SELECT last_seq FROM faktur_sequences WHERE prefix = ?',
    args: [prefix]
  });
  
  const row = getSeqRes.rows[0];
  
  let nextSeq = 1;
  if (row) {
    nextSeq = Number(row.last_seq) + 1;
    await db.execute({
      sql: 'UPDATE faktur_sequences SET last_seq = ?, updated_at = CURRENT_TIMESTAMP WHERE prefix = ?',
      args: [nextSeq, prefix]
    });
  } else {
    await db.execute({
      sql: 'INSERT INTO faktur_sequences (prefix, last_seq) VALUES (?, ?)',
      args: [prefix, 1]
    });
  }
  
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

// Ensure "System" employee exists for 'recorded_by'
let systemEmpRes = await db.execute("SELECT id, name, position FROM employees WHERE name = 'System'");
let systemEmp = systemEmpRes.rows[0];

if (!systemEmp) {
  await db.execute("INSERT INTO employees (name, position, department, is_active) VALUES ('System', 'System Admin', 'IT', 1)");
  systemEmpRes = await db.execute("SELECT id, name, position FROM employees WHERE name = 'System'");
  systemEmp = systemEmpRes.rows[0];
}

async function runMigration(recordsToMigrate) {
  let insertedCount = 0;
  const batchOps = [];

  for (const rec of recordsToMigrate) {
    // 1. Check if this exact record has already been migrated by checking if its Sales Faktur is anywhere in the description
    const checkRes = await db.execute({
      sql: "SELECT id FROM infractions WHERE description LIKE ?",
      args: ['%' + rec.faktur + '%']
    });
    
    if (checkRes.rows.length > 0) {
      console.log(`- Skipping ${rec.faktur}: Already migrated (Infraction ID: ${checkRes.rows[0].id})`);
      continue;
    }

    // 2. Resolve employee by name from nama_pelanggan
    // LibSQL uses ILIKE or standard LIKE for case insensitivity depending on compilation, but SQLite LIKE is case-insensitive usually.
    let empRes = await db.execute({
      sql: 'SELECT id, name, position FROM employees WHERE name LIKE ?', // SQLite LIKE is already case-insensitive by default for ASCII
      args: [rec.nama_pelanggan]
    });
    let emp = empRes.rows[0];
    
    if (!emp) {
      await db.execute({
        sql: "INSERT INTO employees (name, position, department) VALUES (?, 'Karyawan', 'Umum')",
        args: [rec.nama_pelanggan || 'Unknown Karyawan']
      });
      empRes = await db.execute({
        sql: 'SELECT id, name, position FROM employees WHERE name = ?',
        args: [rec.nama_pelanggan || 'Unknown Karyawan']
      });
      emp = empRes.rows[0];
    }

    // 3. Generate new Issue Faktur
    const errFaktur = await generateNextFaktur(rec.tgl);
    
    // 4. Extract data from kd_barang 
    // Format is usually: "LEMBAR - Art Paper 150-A3+ (Penggantian Karyawan - OP.1175.SOPD.XII.2025)"
    let extractedNamaBarang = rec.kd_barang;
    let extractedOrderName = '';
    const match = String(rec.kd_barang).match(/(.*?)\s*\((Penggantian Karyawan) - (.*?)\)/i);
    
    if (match) {
      extractedNamaBarang = match[1].trim();
      extractedOrderName = match[3].trim();
    } else {
      const match2 = String(rec.kd_barang).match(/(.*?)\s*\((Penggantian Karyawan)(.*?)\)/i);
      if (match2) {
        extractedNamaBarang = match2[1].trim();
        extractedOrderName = match2[3].replace(/^- /,'').trim();
      }
    }

    const expectedDescStart = `Penggantian Karyawan dari Penjualan: ${rec.faktur}`;
    let description = expectedDescStart;
    if (extractedOrderName) {
      description += ` untuk order ${extractedOrderName}`;
    }

    // 5. Transform Date FROM DD-MM-YYYY (Sales) TO YYYY-MM-DD (Infractions standard)
    const tglParts = String(rec.tgl).split('-');
    let formattedDate = `${tglParts[2]}-${tglParts[1]}-${tglParts[0]}`;

    // 6. Queue Insert data
    batchOps.push({
      sql: `
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
      `,
      args: [
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
      ]
    });
    
    console.log(`+ Queued Migration: ${rec.faktur} -> ${errFaktur} (${formattedDate})`);
    insertedCount++;
  }
  
  if (batchOps.length > 0) {
      console.log(`Executing batch insert of ${batchOps.length} records...`);
      await db.batch(batchOps, "write");
  }

  return insertedCount;
}

try {
  const result = await runMigration(records);
  console.log('--------------------------------------------------');
  console.log(`Migration Complete! Successfully inserted ${result} records.`);
  console.log('--------------------------------------------------');
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}
