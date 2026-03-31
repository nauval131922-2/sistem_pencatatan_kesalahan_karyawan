import db from '../src/lib/db';

async function check() {
  try {
    const result = await db.execute(`
      SELECT o.faktur, o.nama_prd, o.tgl
      FROM orders o
      LEFT JOIN bill_of_materials b ON o.faktur = b.faktur_prd
      WHERE b.id IS NULL
    `);
    
    console.log(`\nJumlah Order Produksi tanpa BOM: ${result.rows.length}`);
    if (result.rows.length > 0) {
      console.log("\nDaftar (Top 10):");
      console.table(result.rows.slice(0, 10));
    }
  } catch (err) {
    console.error(err);
  }
}

check();
