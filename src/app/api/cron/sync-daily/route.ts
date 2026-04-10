import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 menit max per Vercel Pro/Hobby

const MODULE_ENDPOINTS = [
  '/api/scrape-bom',
  '/api/scrape-orders',
  '/api/scrape-bahan-baku',
  '/api/scrape-barang-jadi',
  '/api/scrape-pr',
  '/api/scrape-spph-out',
  '/api/scrape-sph-in',
  '/api/scrape-purchase-orders',
  '/api/scrape-penerimaan-pembelian',
  '/api/scrape-rekap-pembelian-barang',
  '/api/scrape-pelunasan-hutang',
  '/api/scrape-sph-out',
  '/api/scrape-sales-orders',
  '/api/scrape-sales',
  '/api/scrape-pengiriman',
  '/api/scrape-pelunasan-piutang',
];

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Auth untuk Vercel Cron
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default cron sync: dari 1 bulan yang lalu sampai hari ini
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setMonth(startDateObj.getMonth() - 1);

    const pad = (n: number) => String(n).padStart(2, '0');
    const end = `${endDateObj.getFullYear()}-${pad(endDateObj.getMonth()+1)}-${pad(endDateObj.getDate())}`;
    const start = `${startDateObj.getFullYear()}-${pad(startDateObj.getMonth()+1)}-${pad(startDateObj.getDate())}`;

    // Jalankan fetch ke tiap scraper internal (host otomatis disesuaikan dari request header)
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host');
    const origin = `${protocol}://${host}`;

    let totalSuccess = 0;

    // Supaya Vercel tidak timeout (max 300s), eksekusi parallel batch (4 concurrent)
    const CONCURRENCY = 4;
    for (let i = 0; i < MODULE_ENDPOINTS.length; i += CONCURRENCY) {
      const batch = MODULE_ENDPOINTS.slice(i, i + CONCURRENCY);
      
      const results = await Promise.allSettled(
        batch.map(async (endpoint) => {
          const url = `${origin}${endpoint}?start=${start}&end=${end}`;
          const res = await fetch(url, { method: 'GET', cache: 'no-store' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (data && !data.error) totalSuccess++;
          return data;
        })
      );
    }

    // Catat ke log histori
    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, user_id) 
            VALUES (?, ?, 0, ?, 0)`,
      args: ['CRON_SYNC', 'system', `Sinkronisasi Otomatis Sukses. Data ditarik dari ${start} s/d ${end}.`]
    });

    return NextResponse.json({ success: true, message: 'Cron sync completed.', totalSuccess });

  } catch (error: any) {
    console.error('[CRON SYNC] Error:', error);
    
    await db.execute({
      sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, user_id) 
            VALUES (?, ?, 0, ?, 0)`,
      args: ['CRON_SYNC', 'system', `Gagal menjalankan Sinkronisasi Otomatis: ${error.message}`]
    }).catch(() => {});

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
