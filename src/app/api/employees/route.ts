import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let sqlData = "";
    let sqlTotal = "";
    let argsData: any[] = [];
    let argsTotal: any[] = [];

    if (search) {
      const queryValue = `${search}*`;
      try {
          // Attempt FTS matching
          const ftsMatch = await db.execute({ 
            sql: "SELECT id FROM employees_fts WHERE employees_fts MATCH ?", 
            args: [queryValue] 
          });
          
          if (ftsMatch.rows.length > 0) {
              const ids = ftsMatch.rows.map(r => r.id).join(',');
              sqlData = `SELECT * FROM employees WHERE id IN (${ids}) AND is_active = 1 ORDER BY id ASC LIMIT ? OFFSET ?`;
              sqlTotal = `SELECT COUNT(*) as count FROM employees WHERE id IN (${ids}) AND is_active = 1`;
              argsData = [limit, offset];
              argsTotal = [];
          } else {
              // Fallback to LIKE
              const qPattern = `%${search}%`;
              sqlData = `SELECT * FROM employees WHERE is_active = 1 AND (name LIKE ? OR position LIKE ? OR employee_no LIKE ? OR department LIKE ?) ORDER BY id ASC LIMIT ? OFFSET ?`;
              sqlTotal = `SELECT COUNT(*) as count FROM employees WHERE is_active = 1 AND (name LIKE ? OR position LIKE ? OR employee_no LIKE ? OR department LIKE ?)`;
              argsData = [qPattern, qPattern, qPattern, qPattern, limit, offset];
              argsTotal = [qPattern, qPattern, qPattern, qPattern];
          }
      } catch (e) {
          // Fallback if FTS table not ready
          const qPattern = `%${search}%`;
          sqlData = `SELECT * FROM employees WHERE is_active = 1 AND (name LIKE ? OR position LIKE ? OR employee_no LIKE ? OR department LIKE ?) ORDER BY id ASC LIMIT ? OFFSET ?`;
          sqlTotal = `SELECT COUNT(*) as count FROM employees WHERE is_active = 1 AND (name LIKE ? OR position LIKE ? OR employee_no LIKE ? OR department LIKE ?)`;
          argsData = [qPattern, qPattern, qPattern, qPattern, limit, offset];
          argsTotal = [qPattern, qPattern, qPattern, qPattern];
      }
    } else {
      sqlData = "SELECT * FROM employees WHERE is_active = 1 ORDER BY id ASC LIMIT ? OFFSET ?";
      sqlTotal = "SELECT COUNT(*) as count FROM employees WHERE is_active = 1";
      argsData = [limit, offset];
      argsTotal = [];
    }

    const batchResults = await db.batch([
      { sql: sqlData, args: argsData },
      { sql: sqlTotal, args: argsTotal },
      { sql: "SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM employees", args: [] }
    ], "read");

    const data = batchResults[0].rows;
    const total = Number((batchResults[1].rows[0] as any).count);
    const lastUpdated = (batchResults[2].rows[0] as any).lastUpdated;

    return NextResponse.json({ success: true, data, total, lastUpdated, page, limit });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
