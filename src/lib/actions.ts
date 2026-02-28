import db from '@/lib/db';

export async function getEmployees() {
  return db.prepare('SELECT * FROM employees ORDER BY id ASC').all();
}

export async function addEmployee(name: string, position: string, department: string) {
  return db.prepare('INSERT INTO employees (name, position, department) VALUES (?, ?, ?)')
    .run(name, position, department);
}

export async function getInfractions() {
  return db.prepare(`
    SELECT i.*, e.name as employee_name 
    FROM infractions i 
    JOIN employees e ON i.employee_id = e.id 
    ORDER BY i.date DESC
  `).all();
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
  try {
    // 1. Login to get cookies
    const loginRes = await fetch('https://buyapercetakan.mdthoster.com/il/v1/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({ username: 'nauval', password: '312admin2' })
    });

    const setCookies = loginRes.headers.getSetCookie(); // Use getSetCookie for better handling of multiple cookies
    if (!setCookies || setCookies.length === 0) {
      const body = await loginRes.text();
      console.error('Login Failed Status:', loginRes.status, 'Body:', body);
      throw new Error('Failed to get cookies from login response');
    }

    // Join and clean cookies for the next request
    const cookieString = setCookies.map(c => c.split(';')[0]).join('; ');

    // 2. Fetch data using the cookies
    const requestParam = JSON.stringify({
      limit: 50,
      offset: 0,
      bsearch: { stgl_awal: '01-01-2026', stgl_akhir: '31-12-2026' }
    });
    
    const dataRes = await fetch(`https://buyapercetakan.mdthoster.com/il/v1/prd/trprd_o/gr1?request=${encodeURIComponent(requestParam)}`, {
      headers: {
        'Cookie': cookieString,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!dataRes.ok) {
      const errBody = await dataRes.text();
      throw new Error(`API Data Fetch Failed: ${dataRes.status} ${errBody}`);
    }

    const data = await dataRes.json();
    return data.records || [];
  } catch (error) {
    console.error('API Fetch Error:', error);
    return [];
  }
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
  
  return {
    totalEmployees: totalEmployees.count,
    totalInfractions: totalInfractions.count,
    highSeverity: highSeverity.count
  };
}
