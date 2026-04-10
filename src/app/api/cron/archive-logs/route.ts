import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Archiving Policy:
 * - Logs older than 90 days are moved to activity_logs_archive
 * - action_type = 'DELETE' logs are NEVER archived (forensic protection)
 * - Runs daily at 02:00 WIB (19:00 UTC) — 1 hour before sync-daily
 */

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoff = cutoffDate.toISOString().replace('T', ' ').slice(0, 19);

    // 1. Preview: count eligible rows
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM activity_logs 
            WHERE created_at < ? AND action_type != 'DELETE'`,
      args: [cutoff],
    });
    const eligibleCount = Number((countResult.rows[0] as any).count ?? 0);

    if (eligibleCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada log yang perlu diarsip.',
        archived: 0,
        cutoff,
      });
    }

    // 2. Copy eligible rows to archive table
    await db.execute({
      sql: `INSERT OR IGNORE INTO activity_logs_archive 
              (id, action_type, table_name, record_id, message, raw_data, recorded_by, created_at)
            SELECT id, action_type, table_name, record_id, message, raw_data, recorded_by, created_at
            FROM activity_logs
            WHERE created_at < ? AND action_type != 'DELETE'`,
      args: [cutoff],
    });

    // 3. Verify archive count before deleting
    const archiveVerify = await db.execute({
      sql: `SELECT COUNT(*) as count FROM activity_logs_archive 
            WHERE created_at < ? AND action_type != 'DELETE'`,
      args: [cutoff],
    });
    const archivedCount = Number((archiveVerify.rows[0] as any).count ?? 0);

    if (archivedCount < eligibleCount) {
      throw new Error(
        `Verifikasi arsip gagal: ${archivedCount} baris tersimpan, harusnya ${eligibleCount}. Pembersihan dibatalkan.`
      );
    }

    // 4. Safe to delete from active table
    await db.execute({
      sql: `DELETE FROM activity_logs 
            WHERE created_at < ? AND action_type != 'DELETE'`,
      args: [cutoff],
    });

    // 5. Record the archiving action itself as a maintenance log
    await db.execute({
      sql: `INSERT INTO activity_logs 
              (action_type, table_name, record_id, message, raw_data, recorded_by)
            VALUES (?, ?, 0, ?, ?, ?)`,
      args: [
        'MAINTENANCE',
        'activity_logs',
        `Arsip log aktivitas: ${eligibleCount} baris (> 90 hari, non-DELETE) dipindahkan ke activity_logs_archive. Cutoff: ${cutoff}.`,
        JSON.stringify({ archived: eligibleCount, cutoff, policy: 'DELETE logs kept permanently' }),
        'system',
      ],
    });

    console.log(`[ARCHIVE LOGS] Berhasil mengarsip ${eligibleCount} baris. Cutoff: ${cutoff}`);

    return NextResponse.json({
      success: true,
      message: `Berhasil mengarsip ${eligibleCount} log aktivitas lama.`,
      archived: eligibleCount,
      cutoff,
      policy: 'Log DELETE tidak diarsip (disimpan permanen).',
    });

  } catch (error: any) {
    console.error('[ARCHIVE LOGS] Error:', error);

    await db.execute({
      sql: `INSERT INTO activity_logs 
              (action_type, table_name, record_id, message, raw_data, recorded_by)
            VALUES (?, ?, 0, ?, ?, ?)`,
      args: [
        'MAINTENANCE',
        'activity_logs',
        `GAGAL mengarsip log aktivitas: ${error.message}`,
        JSON.stringify({ error: error.message }),
        'system',
      ],
    }).catch(() => {});

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
