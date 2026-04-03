import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import db from '@/lib/db';
import { getSession as getScraperSession, clearCachedSession } from '@/lib/session-cache';
import { encodeScrapedPeriod, getScrapedPeriodSettingKey } from '@/lib/server-scraped-period';

const API_EMAIL = process.env.SCRAPER_EMAIL || "nauval"; 
const API_PASSWORD = process.env.SCRAPER_PASSWORD || "312admin2";
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/";
const API_KEY = "bismillah-m377-4j76-bb34-c450-7a62-ad3f";

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start'); 
    const end = searchParams.get('end');     

    if (!start || !end) {
      return NextResponse.json({ success: false, error: 'Start and end date required' }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const startIndo = formatDate(startDate);
    const endIndo = formatDate(endDate);

    let cookies = await getScraperSession(async () => {
      const loginRes = await fetch(BASE_URL + "v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Bismillah-Api-Key": API_KEY,
        },
        body: JSON.stringify({ username: API_EMAIL, password: API_PASSWORD }),
      });
      return loginRes.headers.get("set-cookie");
    });

    if (!cookies) {
      return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 401 });
    }

    const reqData = {
      limit: 10000,
      offset: 0,
      bsearch: {
        stgl_awal: startIndo,
        stgl_akhir: endIndo
      }
    };

    const reqJson = encodeURIComponent(JSON.stringify(reqData));
    const dataUrl = BASE_URL + "v1/pj/r_jual_kr/gr1?request=" + reqJson;

    const res = await fetch(dataUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Bismillah-Api-Key': API_KEY,
        'Cookie': cookies
      }
    });

    if (res.status === 401) {
      clearCachedSession();
      return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
    }

    if (!res.ok) {
      throw new Error(`Digit system error: ${res.status}`);
    }

    const json = await res.json();
    const rows = json.data || json.records || json.rows || [];
    
    const filteredRows = rows.filter((r: any) => 
      r.recid && String(r.recid).toLowerCase() !== 'total'
    );

    const batchOps: any[] = [];
    for (const item of filteredRows) {
      batchOps.push({
        sql: `INSERT INTO pengiriman (
          faktur, tgl, kd_supir, kd_armada, kd_eks, no_resi,
          status, status_faktur, keterangan, username, waktu_kirim,
          waktu_selesai, total_faktur, recid, raw_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(recid) DO UPDATE SET
          faktur=excluded.faktur,
          tgl=excluded.tgl,
          kd_supir=excluded.kd_supir,
          kd_armada=excluded.kd_armada,
          kd_eks=excluded.kd_eks,
          no_resi=excluded.no_resi,
          status=excluded.status,
          status_faktur=excluded.status_faktur,
          keterangan=excluded.keterangan,
          username=excluded.username,
          waktu_kirim=excluded.waktu_kirim,
          waktu_selesai=excluded.waktu_selesai,
          total_faktur=excluded.total_faktur,
          raw_data=excluded.raw_data`,
        args: [
          item.faktur || '',
          item.tgl || '',
          item.kd_supir || '',
          item.kd_armada || '',
          item.kd_eks || '',
          item.no_resi || '',
          item.status || '',
          item.status_faktur || '',
          item.keterangan || '',
          item.username || '',
          item.waktu_kirim || '',
          item.waktu_selesai || '',
          parseInt(item.total_faktur || 0),
          item.recid || '',
          JSON.stringify(item)
        ]
      });
    }

    const chunkSize = 50; 
    for (let i = 0; i < batchOps.length; i += chunkSize) {
      await db.batch(batchOps.slice(i, i + chunkSize), "write");
    }

    const lastUpdated = new Date().toISOString();
    await db.batch([
      {
        sql: "INSERT INTO system_settings (key, value, updated_at) VALUES ('last_scrape_pengiriman', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
        args: [lastUpdated]
      },
      {
        sql: "INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
        args: [getScrapedPeriodSettingKey('last_scrape_pengiriman'), encodeScrapedPeriod({ start: startIndo, end: endIndo })]
      }
    ], "write");

    return NextResponse.json({
      success: true,
      total: filteredRows.length,
      lastUpdated,
      scrapedPeriod: { start: startIndo, end: endIndo }
    });
  } catch (err: any) {
    console.error("Scrape Pengiriman Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
