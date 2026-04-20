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
    const start = searchParams.get('start'); // YYYY-MM-DD
    const end = searchParams.get('end');     // YYYY-MM-DD

    if (!start || !end) {
      return NextResponse.json({ success: false, error: 'Start and end date required' }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const startIndo = formatDate(startDate);
    const endIndo = formatDate(endDate);

    // Support custom metadata period (useful for chunked requests)
    const metaStart = searchParams.get("metaStart") || startIndo;
    const metaEnd = searchParams.get("metaEnd") || endIndo;

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
        stgl_akhir: endIndo,
        ppn: "semua"
      }
    };

    const reqJson = encodeURIComponent(JSON.stringify(reqData));
    const dataUrl = BASE_URL + "v1/pb/r_beli_rkp/gr1?request=" + reqJson;

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
      r.recid && r.faktur && String(r.faktur).toLowerCase() !== 'total'
    );

    const batchOps: any[] = [];
    for (const item of filteredRows) {
      batchOps.push({
        sql: `INSERT INTO rekap_pembelian_barang (
          faktur, kd_supplier, tgl, kd_barang, faktur_po, jthtmp, 
          harga, qty, kd_cabang, pers_diskon1, diskon_item, jumlah, 
          ppn, username, total_item, hj, gol_barang, diskon, margin, 
          recid, raw_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(recid) DO UPDATE SET
          faktur=excluded.faktur,
          kd_supplier=excluded.kd_supplier,
          tgl=excluded.tgl,
          kd_barang=excluded.kd_barang,
          faktur_po=excluded.faktur_po,
          jthtmp=excluded.jthtmp,
          harga=excluded.harga,
          qty=excluded.qty,
          kd_cabang=excluded.kd_cabang,
          pers_diskon1=excluded.pers_diskon1,
          diskon_item=excluded.diskon_item,
          jumlah=excluded.jumlah,
          ppn=excluded.ppn,
          username=excluded.username,
          total_item=excluded.total_item,
          hj=excluded.hj,
          gol_barang=excluded.gol_barang,
          diskon=excluded.diskon,
          margin=excluded.margin,
          raw_data=excluded.raw_data`,
        args: [
          item.faktur || '',
          item.kd_supplier || '',
          item.tgl || '',
          item.kd_barang || '',
          item.faktur_po || '',
          item.jthtmp || '',
          parseFloat(item.harga || 0),
          parseFloat(item.qty || 0),
          item.kd_cabang || '',
          parseFloat(item.pers_diskon1 || 0),
          parseFloat(item.diskon_item || 0),
          parseFloat(item.jumlah || 0),
          parseFloat(item.ppn || 0),
          item.username || '',
          parseFloat(item.total_item || 0),
          parseFloat(item.hj || 0),
          item.gol_barang || '',
          parseFloat(item.diskon || 0),
          parseFloat(item.margin || 0),
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
        sql: "INSERT INTO system_settings (key, value, updated_at) VALUES ('last_scrape_rekap_pembelian_barang', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
        args: [lastUpdated]
      },
      {
        sql: "INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
        args: [getScrapedPeriodSettingKey('last_scrape_rekap_pembelian_barang'), encodeScrapedPeriod({ start: metaStart, end: metaEnd })]
      }
    ], "write");

    return NextResponse.json({
      success: true,
      total: filteredRows.length,
      lastUpdated,
      scrapedPeriod: { start: metaStart, end: metaEnd }
    });
  } catch (err: any) {
    console.error("Scrape Rekap Pembelian Barang Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
