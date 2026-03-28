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
    const dataUrl = BASE_URL + "v1/pb/trbeli_p/gr1?request=" + reqJson;

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
        sql: `INSERT INTO penerimaan_pembelian (
          faktur, tgl, top_hari, jthtmp, faktur_po, faktur_prd, faktur_supplier, 
          kd_gudang, kd_cabang, kd_supplier, subtotal, diskon, pembulatan, 
          persppn, ppn, biaya_kirim, total, porsekot, hutang, kas, status, 
          tgl_lunas, username, keterangan_pr, raw_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(faktur) DO UPDATE SET
          tgl=excluded.tgl,
          top_hari=excluded.top_hari,
          jthtmp=excluded.jthtmp,
          faktur_po=excluded.faktur_po,
          faktur_prd=excluded.faktur_prd,
          faktur_supplier=excluded.faktur_supplier,
          kd_gudang=excluded.kd_gudang,
          kd_cabang=excluded.kd_cabang,
          kd_supplier=excluded.kd_supplier,
          subtotal=excluded.subtotal,
          diskon=excluded.diskon,
          pembulatan=excluded.pembulatan,
          persppn=excluded.persppn,
          ppn=excluded.ppn,
          biaya_kirim=excluded.biaya_kirim,
          total=excluded.total,
          porsekot=excluded.porsekot,
          hutang=excluded.hutang,
          kas=excluded.kas,
          status=excluded.status,
          tgl_lunas=excluded.tgl_lunas,
          username=excluded.username,
          keterangan_pr=excluded.keterangan_pr,
          raw_data=excluded.raw_data`,
        args: [
          item.faktur || '',
          item.tgl || '',
          item.top_hari || '0',
          item.jthtmp || '',
          item.faktur_po || '',
          item.faktur_prd || '',
          item.faktur_supplier || '',
          item.kd_gudang || '',
          item.kd_cabang || '',
          item.kd_supplier || '',
          parseFloat(item.subtotal || 0),
          parseFloat(item.diskon || 0),
          parseFloat(item.pembulatan || 0),
          parseFloat(item.persppn || 0),
          parseFloat(item.ppn || 0),
          parseFloat(item.biaya_kirim || 0),
          parseFloat(item.total || 0),
          parseFloat(item.porsekot || 0),
          parseFloat(item.hutang || 0),
          parseFloat(item.kas || 0),
          item.status || '0',
          item.tgl_lunas || null,
          item.username || '',
          item.keterangan_pr || '',
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
      sql: "INSERT INTO system_settings (key, value, updated_at) VALUES ('last_scrape_penerimaan_pembelian', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
      args: [lastUpdated]
    });

    return NextResponse.json({
      success: true,
      total: filteredRows.length,
      lastUpdated
    });
  } catch (err: any) {
    console.error("Scrape Penerimaan Pembelian Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
