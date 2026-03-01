import db from '@/lib/db';

export async function getEmployees() {
  return db.prepare('SELECT * FROM employees ORDER BY id ASC').all();
}

export async function addEmployee(name: string, position: string, department: string) {
  const result = db.prepare('INSERT INTO employees (name, position, department) VALUES (?, ?, ?)')
    .run(name, position, department);

  const rawData = JSON.stringify({ name, position, department });
  db.prepare(`
    INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('INSERT', 'employees', result.lastInsertRowid, `Tambah Data Karyawan Master: ${name}`, rawData, 'Admin');

  return result;
}

export async function getInfractions() {
  return db.prepare(`
    SELECT i.*, e.name as employee_name 
    FROM infractions i 
    JOIN employees e ON i.employee_id = e.id 
    ORDER BY i.date DESC
  `).all();
}

export async function getActivityLogs(limit = 1000) {
  return db.prepare(`
    SELECT * FROM activity_logs
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
}

export async function addInfraction(employeeId: number, description: string, severity: string, date: string, recordedBy: string, orderName?: string) {
  // If date only (YYYY-MM-DD), append current time
  let fullDate = date;
  if (date.length === 10) {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    fullDate = `${date} ${time}`;
  }
  
  return db.prepare('INSERT INTO infractions (employee_id, description, severity, date, recorded_by, order_name) VALUES (?, ?, ?, ?, ?, ?)')
    .run(employeeId, description, severity, fullDate, recordedBy, orderName || null);
}

export async function fetchProductionOrders() {
  // Ordered by id ASC because we sorted them by descending date before bulk insertion
  return db.prepare('SELECT id, faktur, nama_prd FROM orders ORDER BY id ASC').all();
}

export async function getStats() {
  const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };
  const totalInfractions = db.prepare(`
    SELECT COUNT(*) as count FROM infractions i
    INNER JOIN employees e ON i.employee_id = e.id
  `).get() as { count: number };
  const highSeverity = db.prepare(`
    SELECT COUNT(*) as count FROM infractions i
    INNER JOIN employees e ON i.employee_id = e.id
    WHERE i.severity = 'High'
  `).get() as { count: number };
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
  
  return {
    totalEmployees: totalEmployees.count,
    totalInfractions: totalInfractions.count,
    highSeverity: highSeverity.count,
    totalOrders: totalOrders.count
  };
}

export async function getLastEmployeeImport() {
  return db.prepare(`
    SELECT * FROM activity_logs 
    WHERE action_type = 'IMPORT' AND table_name = 'employees' 
    ORDER BY created_at DESC LIMIT 1
  `).get() as any;
}
