import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function logActivity(
  action_type: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'SCRAPE' | 'IMPORT' | 'EXPORT' | 'LOGIN' | 'LOGOUT',
  table_name: string,
  message: string,
  raw_data?: any,
  recorded_by?: string
) {
  try {
    const session = await getSession();
    
    // We update session_context so triggers can use the correct username
    if (session?.username) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO session_context (id, username, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)`,
        args: [session.username]
      });
    }

    const user = recorded_by || session?.username || 'System';

    await db.execute({
      sql: `
        INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
        VALUES (?, ?, 0, ?, ?, ?)
      `,
      args: [
        action_type,
        table_name,
        message,
        JSON.stringify(raw_data || {}),
        user
      ]
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
