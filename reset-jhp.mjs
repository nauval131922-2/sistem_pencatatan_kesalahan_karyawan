import fs from 'fs';
import { createClient } from '@libsql/client';

const dbFile = fs.existsSync('database_dev.sqlite') ? 'database_dev.sqlite' : 'database.sqlite';

const db = createClient({
  url: `file:${dbFile}`
});

async function reset() {
  try {
    console.log("Menghapus semua data dari table jurnal_harian_produksi...");
    await db.execute("DELETE FROM jurnal_harian_produksi");
    // Opsional: Reset auto increment
    await db.execute("DELETE FROM sqlite_sequence WHERE name='jurnal_harian_produksi'");
    console.log("Data berhasil dihapus bersih!");
  } catch (error) {
    console.error("Terjadi kesalahan:", error.message);
  }
}

reset();
