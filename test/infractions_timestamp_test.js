// test/infractions_timestamp_test.js
require('ts-node/register');
const db = require('../src/lib/db').default || require('../src/lib/db');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log('Inserting test infraction');
  const insert = db.prepare('INSERT INTO infractions (employee_id, description, severity, date, recorded_by, order_name) VALUES (1, ?, ?, ?, ?, ?)');
  const info = insert.run('Test description', 'Low', '2026-03-01', 'tester', null);
  const id = info.lastInsertRowid;
  console.log('Inserted id', id);

  // fetch created_at
  const row1 = db.prepare('SELECT created_at, updated_at FROM infractions WHERE id = ?').get(id);
  console.log('After insert:', row1);

  // wait a second
  await sleep(1000);

  console.log('Updating infraction via API');
  const fetch = require('node-fetch');
  await fetch(`http://localhost:3000/api/infractions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'Updated desc', date: '2026-03-01', recorded_by: 'tester', order_name: null })
  });

  const row2 = db.prepare('SELECT created_at, updated_at FROM infractions WHERE id = ?').get(id);
  console.log('After update:', row2);
}

run().catch(e => console.error(e));
