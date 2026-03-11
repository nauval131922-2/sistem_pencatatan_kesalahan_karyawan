import db from '@/lib/db';

export async function initIndexing(database: any) {
  console.log('[INDEXING] Initializing Performance Indexes...');
  
  const indexes = [
    // 1. Employees Optimization
    "CREATE INDEX IF NOT EXISTS idx_employees_active_id ON employees(is_active, id);",
    "CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);",
    
    // 2. Infractions Optimization (Crucial for Stats & Filter)
    "CREATE INDEX IF NOT EXISTS idx_infractions_composite_query ON infractions(employee_id, date DESC);",
    "CREATE INDEX IF NOT EXISTS idx_infractions_severity_date ON infractions(severity, date DESC);",
    "CREATE INDEX IF NOT EXISTS idx_infractions_faktur_composite ON infractions(faktur, date DESC);",
    
    // 3. Activity Logs Optimization (Dashboard)
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at_desc ON activity_logs(created_at DESC);",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_table_action ON activity_logs(table_name, action_type);",
    
    // 4. Large Data Tables (Digit Sync)
    "CREATE INDEX IF NOT EXISTS idx_orders_faktur ON orders(faktur);",
    "CREATE INDEX IF NOT EXISTS idx_bahan_baku_faktur_prd ON bahan_baku(faktur_prd);",
    "CREATE INDEX IF NOT EXISTS idx_barang_jadi_faktur_prd ON barang_jadi(faktur_prd);",
    "CREATE INDEX IF NOT EXISTS idx_sales_reports_faktur ON sales_reports(faktur);",
    
    // 5. System Optimization
    "ANALYZE;" // Update SQLite statistics for query planner
  ];

  for (const sql of indexes) {
    try {
      await database.execute(sql);
      console.log(`[INDEXING] SUCCESS: ${sql.substring(0, 40)}...`);
    } catch (e) {
      console.error(`[INDEXING] FAILED: ${sql.substring(0, 40)}...`, e);
    }
  }
}
