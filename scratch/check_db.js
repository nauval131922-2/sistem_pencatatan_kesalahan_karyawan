
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all("SELECT DISTINCT category, sub_category, group_pekerjaan FROM master_pekerjaan", [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
