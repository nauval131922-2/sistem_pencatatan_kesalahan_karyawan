import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    // Keamanan sederhana via Bearer token atau secret key dari environment
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Jika CRON_SECRET terpasang di environment (.env), pastikan request memiliki token yang sesuai
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const start = Date.now();

    // Jalankan perintah VACUUM untuk mendefrag file SQLite
    // SQL ini merestrukturisasi database, membuang cell kosong dari DELETE/UPDATE (Scraper massal)
    await db.execute('VACUUM');

    // Kosongkan log lama (opsional: simpan hanya 30 hari terakhir)
    await db.execute(`
      DELETE FROM activity_logs 
      WHERE created_at < datetime('now', '-30 days')
    `);

    // Catat log maintenance
    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, changed_data, user_id, message) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['MAINTENANCE', 'system', '0', null, 0, 'Sistem menjalankan DB VACUUM & Pembersihan Log otomatis.']
    });

    const durationMs = Date.now() - start;

    return NextResponse.json({ 
      success: true, 
      message: 'Database vacuumed and cleaned successfully.',
      durationMs 
    });

  } catch (error: any) {
    console.error('[MAINTENANCE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
