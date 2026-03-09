'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function getEmployees() {
  const result = await db.execute('SELECT * FROM employees WHERE is_active = 1 ORDER BY id ASC');
  return result.rows.map(row => ({ ...row }));
}

export async function addEmployee(name: string, position: string, department: string) {
  const result = await db.execute({
    sql: 'INSERT INTO employees (name, position, department) VALUES (?, ?, ?)',
    args: [name, position, department]
  });


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
  
  const result = await db.execute({
    sql: query,
    args: params
  });
  return result.rows.map(row => ({ ...row }));
}

export async function getActivityLogs(limit = 1000) {
  const result = await db.execute({
    sql: `
      SELECT * FROM activity_logs
      ORDER BY created_at DESC
      LIMIT ?
    `,
    args: [limit]
  });
  return result.rows.map(row => ({ ...row }));
}

export async function addInfraction(employeeId: number, description: string, severity: string, date: string, recordedById: number|string, orderName?: string) {
  // If date only (YYYY-MM-DD), append current time
  let fullDate = date;
  if (date.length === 10) {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    fullDate = `${date} ${time}`;
  }

  // Fetch snapshots
  const empRes = await db.execute({
    sql: 'SELECT name, position, employee_no FROM employees WHERE id = ?',
    args: [employeeId]
  });
  const recRes = await db.execute({
    sql: 'SELECT name, position, employee_no FROM employees WHERE id = ?',
    args: [recordedById]
  });

  const emp = empRes.rows[0] as any;
  const rec = recRes.rows[0] as any;

  return await db.execute({
    sql: `
      INSERT INTO infractions (
        employee_id, employee_no, employee_name, employee_position,
        description, severity, date, 
        recorded_by, recorded_by_id, recorded_by_no, recorded_by_name, recorded_by_position,
        order_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      employeeId, emp?.employee_no, emp?.name, emp?.position,
      description, severity, fullDate,
      rec?.name, recordedById, rec?.employee_no, rec?.name, rec?.position,
      orderName || null
    ]
  });
}

export async function fetchProductionOrders() {
  const result = await db.execute(`
    SELECT id, faktur, nama_prd 
    FROM orders 
    ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC
  `);
  return result.rows.map(row => ({ ...row }));
}

export async function getStats() {
  const results = await Promise.all([
    db.execute('SELECT COUNT(*) as count FROM employees WHERE is_active = 1'),
    db.execute(`
      SELECT COUNT(*) as count FROM infractions i
      LEFT JOIN employees e ON (i.employee_id = e.id OR (i.employee_no IS NOT NULL AND i.employee_no = e.employee_no))
    `),
    db.execute(`
      SELECT COUNT(*) as count FROM infractions i
      LEFT JOIN employees e ON (i.employee_id = e.id OR (i.employee_no IS NOT NULL AND i.employee_no = e.employee_no))
      WHERE i.severity = 'High'
    `),
    db.execute('SELECT COUNT(*) as count FROM orders')
  ]);
  
  return {
    totalEmployees: Number(results[0].rows[0]?.count || 0),
    totalInfractions: Number(results[1].rows[0]?.count || 0),
    highSeverity: Number(results[2].rows[0]?.count || 0),
    totalOrders: Number(results[3].rows[0]?.count || 0)
  };
}

export async function getLastEmployeeImport() {
  try {
    const result = await db.execute(`SELECT * FROM activity_logs WHERE table_name = 'employees' AND action_type = 'IMPORT' ORDER BY id DESC LIMIT 1`);
    return result.rows.length > 0 ? { ...result.rows[0] } : null;
  } catch (err) {
    console.error('Failed to get last employee import log', err);
    return null;
  }
}

export async function getLastHppImport() {
  try {
    const result = await db.execute(`SELECT * FROM activity_logs WHERE table_name = 'hpp_kalkulasi' AND action_type = 'UPLOAD' ORDER BY id DESC LIMIT 1`);
    return result.rows.length > 0 ? { ...result.rows[0] } : null;
  } catch (err) {
    console.error('Failed to get last hpp kalkulasi import log', err);
    return null;
  }
}
