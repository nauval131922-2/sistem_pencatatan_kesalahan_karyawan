
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('--- Database Performance Check ---');

function measure(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name}: ${Math.round(end - start)}ms`);
    return result;
}

// Check if indexes exist
const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all();
console.log('Indexes found:', indexes.map(i => i.name).join(', '));

// Test main data query
measure('Main Data Query', () => {
    return db.prepare(`
        SELECT id, tgl, nama_barang, kd_barang, qty, satuan, hp, nama_prd, faktur, faktur_prd, created_at 
        FROM barang_jadi 
        ORDER BY substr(tgl, 7, 4) ASC, substr(tgl, 4, 2) ASC, substr(tgl, 1, 2) ASC, id ASC 
        LIMIT 10 OFFSET 0
    `).all();
});

// Test metadata query
measure('Metadata MAX(created_at)', () => {
    return db.prepare(`SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM barang_jadi`).get();
});

// Test count query
measure('Count Query', () => {
    return db.prepare(`SELECT COUNT(*) as count FROM barang_jadi`).get();
});

// Check execution plan for main query
const plan = db.prepare(`EXPLAIN QUERY PLAN
        SELECT id, tgl, nama_barang, kd_barang, qty, satuan, hp, nama_prd, faktur, faktur_prd, created_at 
        FROM barang_jadi 
        ORDER BY substr(tgl, 7, 4) ASC, substr(tgl, 4, 2) ASC, substr(tgl, 1, 2) ASC, id ASC 
        LIMIT 10 OFFSET 0`).all();
console.log('Query Plan:');
console.log(JSON.stringify(plan, null, 2));

db.close();
