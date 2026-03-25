import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM sales_orders WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) as total FROM sales_orders WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      // Use FTS5 for better performance
      const ftsQuery = `SELECT id FROM sales_orders_fts WHERE sales_orders_fts MATCH ?`;
      const ftsParams = [`${search}*`];
      
      try {
        const ftsResult = await db.execute({ sql: ftsQuery, args: ftsParams });
        if (ftsResult.rows.length > 0) {
          const ids = ftsResult.rows.map(r => r.id).join(',');
          query += ` AND id IN (${ids})`;
          countQuery += ` AND id IN (${ids})`;
        } else {
          // Fallback if FTS5 is empty or not matching well
          const searchPattern = `%${search}%`;
          const searchSql = ` AND (faktur LIKE ? OR kd_pelanggan LIKE ? OR nama_pelanggan LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ?)`;
          query += searchSql;
          countQuery += searchSql;
          params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }
      } catch (e) {
        // Fallback
        const searchPattern = `%${search}%`;
        const searchSql = ` AND (faktur LIKE ? OR kd_pelanggan LIKE ? OR nama_pelanggan LIKE ? OR nama_prd LIKE ? OR kd_barang LIKE ?)`;
        query += searchSql;
        countQuery += searchSql;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }
    }

    if (from && to) {
      // Assuming dates are stored as DD-MM-YYYY in the table, but we might want to convert them for filtering
      // For now, let's assume the table stores strings we can compare via substring if needed, 
      // but standard SINTAK pattern uses substr for efficient sorting in indexes.
      // Filter by converting DD-MM-YYYY to YYYYMMDD for comparison
      const filterSql = ` AND (substr(tgl,7,4)||substr(tgl,4,2)||substr(tgl,1,2)) BETWEEN ? AND ?`;
      const fromFormatted = from.replace(/-/g, '');
      const toFormatted = to.replace(/-/g, '');
      query += filterSql;
      countQuery += filterSql;
      params.push(fromFormatted, toFormatted);
    }

    // Order by date descending
    query += ` ORDER BY substr(tgl,7,4) DESC, substr(tgl,4,2) DESC, substr(tgl,1,2) DESC, id DESC LIMIT ? OFFSET ?`;
    const queryParams = [...params, limit, offset];

    const [dataResults, countResults] = await Promise.all([
      db.execute({ sql: query, args: queryParams }),
      db.execute({ sql: countQuery, args: params })
    ]);

    const total = (countResults.rows[0]?.total as number) || 0;
    
    // Get last updated timestamp if any
    const latest = await db.execute("SELECT strftime('%Y-%m-%dT%H:%M:%SZ', created_at) as lastUpdated FROM activity_logs WHERE table_name = 'sales_orders' AND action_type = 'SCRAPE' ORDER BY created_at DESC LIMIT 1");
    const lastUpdated = latest.rows[0]?.lastUpdated || null;

    return NextResponse.json({
      success: true,
      data: dataResults.rows,
      total,
      lastUpdated
    });

  } catch (error: any) {
    console.error('API Error (sales-orders):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
