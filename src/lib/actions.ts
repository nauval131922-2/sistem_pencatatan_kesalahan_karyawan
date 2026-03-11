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
    ORDER BY substr(tgl, 7, 4) DESC, substr(tgl, 4, 2) DESC, substr(tgl, 1, 2) DESC, id DESC
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
    query += ` WHERE substr(i.date, 1, 10) BETWEEN ? AND ? `;
    params.push(startDate, endDate);
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


export const getStats = cache(async (year?: number) => {
  const currentYear = year || new Date().getFullYear();
  const yearFilter = `%-${currentYear} %`; // matches DD-MM-YYYY ...
  const yearFilterAlt = `${currentYear}-%`; // matches YYYY-MM-DD ...

  const results = await db.batch([
    'SELECT COUNT(*) as count FROM employees WHERE is_active = 1',
    {
      sql: `SELECT COUNT(*) as count FROM infractions 
            WHERE (date LIKE ? OR date LIKE ?)`,
      args: [`%-${currentYear}%`, `${currentYear}-%`]
    },
    {
      sql: `SELECT COUNT(*) as count FROM infractions 
            WHERE severity = 'High' AND (date LIKE ? OR date LIKE ?)`,
      args: [`%-${currentYear}%`, `${currentYear}-%`]
    },
    'SELECT COUNT(*) as count FROM orders'
  ], "read");
  
  return {
    totalEmployees: Number(results[0].rows[0]?.count || 0),
    totalInfractions: Number(results[1].rows[0]?.count || 0),
    highSeverity: Number(results[2].rows[0]?.count || 0),
    totalOrders: Number(results[3].rows[0]?.count || 0)
  };
});

export const getDetailedStats = cache(async (year: number) => {
  const yr = year.toString();
  
  const [monthlyRes, repeatersRes, severityRes] = await db.batch([
    // 1. Monthly Trends
    {
      sql: `
        WITH RECURSIVE months(m) AS (SELECT 1 UNION ALL SELECT m+1 FROM months WHERE m < 12)
        SELECT 
          m as month,
          (SELECT COUNT(*) FROM infractions 
           WHERE (
             (substr(date, 4, 2) = printf('%02d', m) AND substr(date, 7, 4) = ?)
             OR 
             (substr(date, 6, 2) = printf('%02d', m) AND substr(date, 1, 4) = ?)
           )
          ) as count
        FROM months
      `,
      args: [yr, yr]
    },
    // 2. Top Repeaters
    {
      sql: `
        SELECT 
          COALESCE(i.employee_name, e.name) as name,
          e.position,
          COUNT(*) as total
        FROM infractions i
        LEFT JOIN employees e ON i.employee_id = e.id
        WHERE (substr(i.date, 7, 4) = ? OR substr(i.date, 1, 4) = ?)
        GROUP BY i.employee_id, COALESCE(i.employee_name, e.name)
        ORDER BY total DESC
        LIMIT 5
      `,
      args: [yr, yr]
    },
    // 3. Severity Distribution for the year
    {
      sql: `
        SELECT severity, COUNT(*) as count 
        FROM infractions 
        WHERE (substr(date, 7, 4) = ? OR substr(date, 1, 4) = ?)
        GROUP BY severity
      `,
      args: [yr, yr]
    }
  ], "read");

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyData = monthlyRes.rows.map((r: any) => ({
    name: monthNames[r.month - 1],
    total: Number(r.count)
  }));

  return {
    monthlyData,
    topRepeaters: repeatersRes.rows,
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
