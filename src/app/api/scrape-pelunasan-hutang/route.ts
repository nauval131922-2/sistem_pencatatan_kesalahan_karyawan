import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import db from '@/lib/db';
import { getSession as getScraperSession, clearCachedSession } from '@/lib/session-cache';

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
    const start = searchParams.get('start'); // YYYY-MM-DD
    const end = searchParams.get('end');     // YYYY-MM-DD

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
    const dataUrl = BASE_URL + "v1/pb/trpelhut/gr1?request=" + reqJson;

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
      r.faktur && String(r.faktur).toLowerCase() !== 'total'
    );

    const batchOps: any[] = [];
    for (const item of filteredRows) {
      batchOps.push({
        sql: `INSERT INTO pelunasan_hutang (
          faktur, tgl, kd_cabang, kd_supplier, pembelian, retur, 
          subtotal, diskon, pembulatan, total, kas, bgcek, bank, 
          porsekot, kd_porsekot, kd_bank, status, faktur_pb, 
          keterangan, username, recid, raw_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(faktur) DO UPDATE SET
          tgl=excluded.tgl,
          kd_cabang=excluded.kd_cabang,
          kd_supplier=excluded.kd_supplier,
          pembelian=excluded.pembelian,
          retur=excluded.retur,
          subtotal=excluded.subtotal,
          diskon=excluded.diskon,
          pembulatan=excluded.pembulatan,
          total=excluded.total,
          kas=excluded.kas,
          bgcek=excluded.bgcek,
          bank=excluded.bank,
          porsekot=excluded.porsekot,
          kd_porsekot=excluded.kd_porsekot,
          kd_bank=excluded.kd_bank,
          status=excluded.status,
          faktur_pb=excluded.faktur_pb,
          keterangan=excluded.keterangan,
          username=excluded.username,
          recid=excluded.recid,
          raw_data=excluded.raw_data`,
        args: [
          item.faktur || '',
          item.tgl || '',
          item.kd_cabang || '',
          item.kd_supplier || '',
          parseFloat(item.pembelian || 0),
          parseFloat(item.retur || 0),
          parseFloat(item.subtotal || 0),
          parseFloat(item.diskon || 0),
          parseFloat(item.pembulatan || 0),
          parseFloat(item.total || 0),
          parseFloat(item.kas || 0),
          parseFloat(item.bgcek || 0),
          parseFloat(item.bank || 0),
          parseFloat(item.porsekot || 0),
          item.kd_porsekot || '',
          item.kd_bank || '',
          item.status || '',
          item.faktur_pb || '',
          item.keterangan || '',
          item.username || '',
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
    await db.execute({
      sql: "INSERT INTO system_settings (key, value, updated_at) VALUES ('last_scrape_pelunasan_hutang', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
      args: [lastUpdated]
    });

    return NextResponse.json({
      success: true,
      total: filteredRows.length,
      lastUpdated
    });
  } catch (err: any) {
    console.error("Scrape Pelunasan Hutang Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
