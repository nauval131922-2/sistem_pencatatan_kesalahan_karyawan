import db from "../src/lib/db";

async function check() {
  try {
    const res = await (db as any).execute(`
      SELECT bom.faktur as bom_faktur, COUNT(sph.faktur) as sph_count, GROUP_CONCAT(sph.faktur) as sph_list
      FROM bill_of_materials bom
      JOIN sph_out sph ON (sph.barang LIKE '%' || bom.faktur || '%' OR sph.raw_data LIKE '%' || bom.faktur || '%')
      GROUP BY bom.faktur
      HAVING sph_count > 1
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  }
}

check();
