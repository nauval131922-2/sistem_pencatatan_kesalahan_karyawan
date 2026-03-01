// test/verify_updated_at.js
// Requires node-fetch (already used in project) and better-sqlite3
// const fetch = require('node-fetch');
const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  // Create a new infraction via API POST
  const createRes = await fetch('http://localhost:3000/api/infractions', {
    method: 'POST',
    body: new URLSearchParams({
      employee_id: '1',
      description: 'Test infraction',
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      recorded_by: 'tester',
      order_name: ''
    })
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error('Create failed: ' + JSON.stringify(createData));
  console.log('Created infraction');

  // Get the latest id
  const row = db.prepare('SELECT id FROM infractions ORDER BY id DESC LIMIT 1').get();
  const id = row.id;
  console.log('Infraction ID:', id);

  // Wait a moment then update via PUT
  await sleep(1000);
  const updateRes = await fetch(`http://localhost:3000/api/infractions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'Updated description', date: new Date().toISOString().split('T')[0], recorded_by: 'tester', order_name: null })
  });
  const updateData = await updateRes.json();
  if (!updateRes.ok) throw new Error('Update failed: ' + JSON.stringify(updateData));
  console.log('Updated infraction');

  // Query DB for timestamps
  const result = db.prepare('SELECT created_at, updated_at FROM infractions WHERE id = ?').get(id);
  console.log('Timestamps:', result);
}

run().catch(err => console.error('Error:', err));
