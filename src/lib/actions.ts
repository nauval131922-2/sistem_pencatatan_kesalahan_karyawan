'use server';

import { cache } from 'react';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export const getEmployees = cache(async () => {
  const result = await db.execute('SELECT * FROM employees WHERE is_active = 1 ORDER BY id ASC');
  return result.rows.map((row: any) => ({ ...row }));
});

export const fetchProductionOrders = cache(async () => {
  const result = await db.execute(`
    SELECT id, faktur, nama_prd 
    FROM orders 
    ORDER BY id DESC
    LIMIT 2000
  `);
  return result.rows.map((row: any) => ({ ...row }));
});

export async function addEmployee(name: string, position: string, department: string) {
  const result = await db.execute({
    sql: 'INSERT INTO employees (name, position, department) VALUES (?, ?, ?)',
    args: [name, position, department]
  });
  return result;
}

export const getInfractions = cache(async (startDate?: string, endDate?: string) => {
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
    query += ` WHERE i.date >= ? AND i.date <= ? `;
    params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
  }

  query += ` ORDER BY i.date DESC, i.id DESC `;
  
  const result = await db.execute({
    sql: query,
    args: params
  });
  return result.rows.map((row: any) => ({ ...row }));
});

export async function getActivityLogs(limit = 1000) {
  const [recordsResult] = await db.batch([
    {
      sql: `
        SELECT * FROM activity_logs
        ORDER BY created_at DESC
        LIMIT ?
      `,
      args: [limit]
    }
  ], "read");

  return recordsResult.rows.map(row => ({ ...row }));
}

export async function addInfraction(employeeId: number, description: string, severity: string, date: string, recordedById: number|string, orderName?: string) {
  let fullDate = date;
  if (date.length === 10) {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    fullDate = `${date} ${time}`;
  }

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

  if (!emp || !rec) throw new Error('Data karyawan tidak ditemukan.');

  const result = await db.execute({
    sql: `INSERT INTO infractions (
            employee_id, employee_no, employee_name, employee_position,
            description, severity, date, 
            recorded_by_id, recorded_by_no, recorded_by_name, recorded_by_position,
            order_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      employeeId, emp.employee_no, emp.name, emp.position,
      description, severity, fullDate,
      recordedById, rec.employee_no, rec.name, rec.position,
      orderName || null
    ]
  }, "Catat Kesalahan");

  return result;
}

export const getStats = cache(async (year?: number) => {
  const currentYear = year || new Date().getFullYear();
  const startOfYear = `${currentYear}-01-01 00:00:00`;
  const endOfYear = `${currentYear}-12-31 23:59:59`;

  const results = await db.batch([
    'SELECT COUNT(*) as count FROM employees WHERE is_active = 1',
    {
      sql: `SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high
            FROM infractions 
            WHERE (date >= ? AND date <= ?)`,
      args: [startOfYear, endOfYear]
    },
    'SELECT COUNT(*) as count FROM orders'
  ], "read");

  return {
    totalEmployees: Number(results[0].rows[0]?.count || 0),
    totalInfractions: Number(results[1].rows[0]?.total || 0),
    highSeverity: Number(results[1].rows[0]?.high || 0),
    totalOrders: Number(results[2].rows[0]?.count || 0)
  };
});

export const getDashboardSummary = cache(async () => {
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
  const thisMonth = ("0" + (now.getMonth() + 1)).slice(-2);
  const thisYear = now.getFullYear().toString();

  const startOfMonth = `${thisYear}-${thisMonth}-01 00:00:00`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const endOfMonth = `${thisYear}-${thisMonth}-${lastDay} 23:59:59`;
  const startOfToday = `${today} 00:00:00`;
  const endOfToday = `${today} 23:59:59`;

  const results = await db.batch([
    'SELECT COUNT(*) as count FROM employees WHERE is_active = 1',
    {
      sql: `SELECT COUNT(*) as count FROM infractions 
            WHERE (date >= ? AND date <= ?)`,
      args: [startOfMonth, endOfMonth]
    },
    {
      sql: `SELECT COUNT(*) as count FROM infractions 
            WHERE (date >= ? AND date <= ?)`,
      args: [startOfToday, endOfToday]
    }
  ], "read");

  return {
    activeEmployees: Number(results[0].rows[0]?.count || 0),
    infractionsThisMonth: Number(results[1].rows[0]?.count || 0),
    infractionsToday: Number(results[2].rows[0]?.count || 0)
  };
});

export const getDetailedStats = cache(async (year: number) => {
  const yr = year.toString();
  const startOfYear = `${yr}-01-01 00:00:00`;
  const endOfYear = `${yr}-12-31 23:59:59`;
  
  const [monthlyRes, repeatersRes, severityRes] = await db.batch([
    {
      sql: `
        SELECT 
          CAST(strftime('%m', date) AS INTEGER) as month_idx,
          COUNT(*) as total,
          SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low_count,
          SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as med_count,
          SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high_count,
          SUM(IFNULL(total, 0)) as amount
        FROM infractions
        WHERE date >= ? AND date <= ?
        GROUP BY month_idx
      `,
      args: [startOfYear, endOfYear]
    },
    {
      sql: `
        SELECT 
          COALESCE(i.employee_name, e.name) as name,
          e.position,
          COUNT(*) as total,
          SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low_count,
          SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as med_count,
          SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high_count,
          SUM(IFNULL(i.total, 0)) as total_amount
        FROM infractions i
        LEFT JOIN employees e ON i.employee_id = e.id
        WHERE i.date >= ? AND i.date <= ?
        GROUP BY i.employee_id, COALESCE(i.employee_name, e.name)
        ORDER BY total_amount DESC
        LIMIT 5
      `,
      args: [startOfYear, endOfYear]
    },
    {
      sql: `
        SELECT severity, COUNT(*) as count 
        FROM infractions 
        WHERE date >= ? AND date <= ?
        GROUP BY severity
      `,
      args: [startOfYear, endOfYear]
    }
  ], "read");

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyData = monthNames.map((name, idx) => {
    const monthIdx = idx + 1;
    const dbRow = monthlyRes.rows.find((r: any) => r.month_idx === monthIdx);
    return {
      name,
      total: dbRow ? Number(dbRow.total) : 0,
      low: dbRow ? Number(dbRow.low_count) : 0,
      medium: dbRow ? Number(dbRow.med_count) : 0,
      high: dbRow ? Number(dbRow.high_count) : 0,
      amount: dbRow ? Number(dbRow.amount) : 0
    };
  });

  return {
    monthlyData,
    topRepeaters: repeatersRes.rows.map((r: any) => ({ ...r, total: Number(r.total) })),
    severityData: severityRes.rows.reduce((acc: any, curr: any) => {
      acc[curr.severity] = Number(curr.count);
      return acc;
    }, { Low: 0, Medium: 0, High: 0 })
  };
});

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

export async function getLiveRecord(tableName: string, recordId: number | string) {
  try {
    const allowedTables = ['users', 'employees', 'infractions', 'orders', 'bahan_baku', 'barang_jadi', 'hpp_kalkulasi', 'sales_reports'];
    if (!allowedTables.includes(tableName)) throw new Error('Table not allowed');
    const result = await db.execute({
      sql: `SELECT * FROM ${tableName} WHERE id = ?`,
      args: [recordId]
    });
    return result.rows.length > 0 ? { ...result.rows[0] } : null;
  } catch (err) {
    console.error('Failed to get live record', err);
    return null;
  }
}
