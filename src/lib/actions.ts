'use server';

import db from '@/lib/db';

export async function getEmployees() {
  return db.prepare('SELECT * FROM employees WHERE is_active = 1 ORDER BY id ASC').all();
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

export async function getInfractions(startDate?: string, endDate?: string) {
  let query = `
    SELECT 
      i.*,
      COALESCE(i.employee_name, e.name) as employee_name, 
      i.employee_no, 
      COALESCE(i.employee_position, e.position) as employee_position,
      COALESCE(i.recorded_by_name, r.name, i.recorded_by) as recorded_by_name, 
      COALESCE(i.recorded_by_position, r.position) as recorded_by_position,
      COALESCE(i.order_name, o.nama_prd) as order_name_display,
      COALESCE(i.nama_barang, bb.nama_barang, bj.nama_barang) as nama_barang_display
    FROM infractions i 
    LEFT JOIN employees e ON (i.employee_id = e.id OR (i.employee_no IS NOT NULL AND i.employee_no = e.employee_no))
    LEFT JOIN employees r ON (i.recorded_by_id = r.id OR (i.recorded_by_no IS NOT NULL AND i.recorded_by_no = r.employee_no))
    LEFT JOIN orders o ON (i.order_faktur = o.faktur)
    LEFT JOIN bahan_baku bb ON (i.item_faktur = bb.faktur AND i.jenis_barang = 'Bahan Baku' AND i.order_name = bb.nama_prd)
    LEFT JOIN barang_jadi bj ON (i.item_faktur = bj.faktur AND i.jenis_barang = 'Barang Jadi' AND i.order_name = bj.nama_prd)
  `;

  const params: any[] = [];
  if (startDate && endDate) {
    query += ` WHERE substr(i.date, 1, 10) BETWEEN ? AND ? `;
    params.push(startDate, endDate);
  }

  query += ` ORDER BY i.date DESC, i.id DESC `;
  
  return db.prepare(query).all(...params);
}

export async function getActivityLogs(limit = 1000) {
  return db.prepare(`
    SELECT * FROM activity_logs
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
}

export async function addInfraction(employeeId: number, description: string, severity: string, date: string, recordedById: number|string, orderName?: string) {
  // If date only (YYYY-MM-DD), append current time
  let fullDate = date;
  if (date.length === 10) {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    fullDate = `${date} ${time}`;
  }

  // Fetch snapshots
  const emp = db.prepare('SELECT name, position, employee_no FROM employees WHERE id = ?').get(employeeId) as any;
  const rec = db.prepare('SELECT name, position, employee_no FROM employees WHERE id = ?').get(recordedById) as any;

  return db.prepare(`
    INSERT INTO infractions (
      employee_id, employee_no, employee_name, employee_position,
      description, severity, date, 
      recorded_by, recorded_by_id, recorded_by_no, recorded_by_name, recorded_by_position,
      order_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    employeeId, emp?.employee_no, emp?.name, emp?.position,
    description, severity, fullDate,
    rec?.name, recordedById, rec?.employee_no, rec?.name, rec?.position,
    orderName || null
  );
}

export async function fetchProductionOrders() {
  // Ordered by id ASC because we sorted them by descending date before bulk insertion
  return db.prepare('SELECT id, faktur, nama_prd FROM orders ORDER BY id ASC').all();
}

export async function getStats() {
  const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees WHERE is_active = 1').get() as { count: number };
  const totalInfractions = db.prepare(`
    SELECT COUNT(*) as count FROM infractions i
    LEFT JOIN employees e ON (i.employee_id = e.id OR (i.employee_no IS NOT NULL AND i.employee_no = e.employee_no))
  `).get() as { count: number };
  const highSeverity = db.prepare(`
    SELECT COUNT(*) as count FROM infractions i
    LEFT JOIN employees e ON (i.employee_id = e.id OR (i.employee_no IS NOT NULL AND i.employee_no = e.employee_no))
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
  try {
    const log = db.prepare(`SELECT * FROM activity_logs WHERE table_name = 'employees' AND action_type = 'IMPORT' ORDER BY id DESC LIMIT 1`).get() as any;
    return log || null;
  } catch (err) {
    console.error('Failed to get last employee import log', err);
    return null;
  }
}

export async function getLastHppImport() {
  try {
    const log = db.prepare(`SELECT * FROM activity_logs WHERE table_name = 'hpp_kalkulasi' AND action_type = 'UPLOAD' ORDER BY id DESC LIMIT 1`).get() as any;
    return log || null;
  } catch (err) {
    console.error('Failed to get last hpp kalkulasi import log', err);
    return null;
  }
}
