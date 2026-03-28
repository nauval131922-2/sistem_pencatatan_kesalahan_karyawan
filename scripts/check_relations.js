const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

try {
  const rows = db.prepare(`
    SELECT bom.faktur as bom_faktur, COUNT(sph.faktur) as sph_count, GROUP_CONCAT(sph.faktur) as sph_list
    FROM bill_of_materials bom
    JOIN sph_out sph ON (sph.barang LIKE '%' || bom.faktur || '%' OR sph.raw_data LIKE '%' || bom.faktur || '%')
    GROUP BY bom.faktur
    HAVING sph_count > 1
  `).all();
  console.log('Duplicated BOM-SPH:', rows);
} catch (e) {
  console.error(e);
}
