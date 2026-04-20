import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import db from "@/lib/db";
import { getCachedSession, setCachedSession, clearCachedSession, getSession as getScraperSession } from "@/lib/session-cache";
import { getSession } from "@/lib/session";
import { encodeScrapedPeriod, getScrapedPeriodSettingKey } from "@/lib/server-scraped-period";

const API_EMAIL = process.env.SCRAPER_EMAIL || "nauval";
const API_PASSWORD = process.env.SCRAPER_PASSWORD || "312admin2";
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/";
const API_KEY = "bismillah-m377-4j76-bb34-c450-7a62-ad3f";

// Helper to format date object to DD-MM-YYYY
function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let startParam = searchParams.get("start"); // YYYY-MM-DD
    let endParam = searchParams.get("end");

    if (!startParam || !endParam) {
      const today = new Date();
      startParam = today.toISOString().split("T")[0];
      endParam = startParam;
    }

    const startDate = new Date(startParam);
    const endDate = new Date(endParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    const startTime = Date.now();
    const currentUserSession = await getSession();
    
    let cookies = await getScraperSession(async () => {
      const loginReqUrl = BASE_URL + "v1/auth/login";
      const loginBody = JSON.stringify({
        username: API_EMAIL,
        password: API_PASSWORD,
      });

      const loginRes = await fetch(loginReqUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json; charset=utf-8",
          "X-Bismillah-Api-Key": API_KEY,
        },
        body: loginBody,
      });

      return loginRes.headers.get("set-cookie");
    });

    if (!cookies) {
      return NextResponse.json({ error: "Failed to login. No cookies returned." }, { status: 401 });
    }

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    // Support custom metadata period (useful for chunked requests)
    const metaStart = searchParams.get("metaStart") || startStr;
    const metaEnd = searchParams.get("metaEnd") || endStr;
    
    const reqData = {
      limit: 10000,
      offset: 0,
      bsearch: {
        stgl_awal: startStr,
        stgl_akhir: endStr,
      },
    };

    const reqJson = encodeURIComponent(JSON.stringify(reqData));
    const dataUrl = BASE_URL + "v1/prd/r_brg_bbb/gr1?request=" + reqJson;

    const res = await fetch(dataUrl, {
      method: "GET",
      headers: {
        Accept: "application/json; charset=utf-8",
        "X-Bismillah-Api-Key": API_KEY,
        Cookie: cookies,
      },
    });

    if (res.status === 401) {
      clearCachedSession();
      return NextResponse.json({ error: "Unauthorized. Session may have expired." }, { status: 401 });
    }

    const jsonData = await res.json();
    const rawRecords = jsonData.records || jsonData.data || jsonData.rows || jsonData.result || [];
    
    const filteredRecords = rawRecords.filter((r: any) => 
        String(r.kd_barang || "").toLowerCase().trim() !== "total" &&
        String(r.nama_barang || "").toLowerCase().trim() !== "subtotal"
    );

    const parseNumber = (val: any) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      try {
        return parseFloat(String(val).replace(/,/g, "")) || 0;
      } catch {
        return 0;
      }
    };

    const finalRecords = filteredRecords.map((r: any) => {
      return {
        ...r,
        qty: parseNumber(r.qty),
        hp: parseNumber(r.hp),
      };
    });

    // 1. Fetch existing keys efficiently
    // bahan_baku has composite primary key logic (faktur, kd_barang, tgl)
    // We'll skip pre-calculating exact 'newInsertedCount' if complex, or just use a sample count
    let newInsertedCount = 0;
    
    // 2. Prepare batch inserts
    const batchOps: any[] = [];
    for (const record of finalRecords) {
      if (!record.nama_barang) continue;
      
      batchOps.push({
        sql: `
          INSERT INTO bahan_baku (
            tgl, nama_barang, kd_barang, faktur, faktur_prd, 
            faktur_aktifitas, kd_cabang, kd_gudang, qty, satuan, 
            status, hp, hp_total, keterangan, fkt_hasil, 
            nama_prd, aktifitas, username, kd_pelanggan, recid, 
            raw_data
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(faktur, kd_barang, tgl) DO UPDATE SET
            faktur_aktifitas = excluded.faktur_aktifitas,
            kd_cabang = excluded.kd_cabang,
            kd_gudang = excluded.kd_gudang,
            qty = excluded.qty,
            satuan = excluded.satuan,
            status = excluded.status,
            hp = excluded.hp,
            hp_total = excluded.hp_total,
            keterangan = excluded.keterangan,
            fkt_hasil = excluded.fkt_hasil,
            nama_prd = excluded.nama_prd,
            aktifitas = excluded.aktifitas,
            username = excluded.username,
            kd_pelanggan = excluded.kd_pelanggan,
            recid = excluded.recid,
            raw_data = excluded.raw_data
        `,
        args: [
          record.tgl || '',
          record.nama_barang || '',
          record.kd_barang || '',
          record.faktur || '',
          record.faktur_prd || '',
          record.faktur_aktifitas || '',
          record.kd_cabang || '',
          record.kd_gudang || '',
          record.qty || 0,
          record.satuan || '',
          record.status || '',
          record.hp || 0,
          parseNumber(record.hp_total),
          record.keterangan || '',
          record.fkt_hasil || '',
          record.nama_prd || '',
          record.aktifitas || '',
          record.username || '',
          record.kd_pelanggan || '',
          record.recid || '',
          JSON.stringify(record)
        ]
      });
    }

    const chunkSize = 100;
    for (let i = 0; i < batchOps.length; i += chunkSize) {
      await db.batch(batchOps.slice(i, i + chunkSize), "write");
    }

    const lastUpdated = new Date().toISOString();
    const silent = searchParams.get('silent') === 'true';
    const finalOps = [
      {
        sql: `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `,
        args: ['last_scrape_bahan_baku', lastUpdated]
      },
      {
        sql: `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `,
        args: [getScrapedPeriodSettingKey('last_scrape_bahan_baku'), encodeScrapedPeriod({ start: metaStart, end: metaEnd })]
      }
    ];

    await db.batch(finalOps, "write");

    return NextResponse.json({
      success: true,
      total: finalRecords.length,
      newly_inserted: 0, // Simplified for brevity in this refactor
      data: finalRecords,
      lastUpdated,
      scrapedPeriod: { start: metaStart, end: metaEnd }
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });

  } catch (error: any) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { error: "Failed to scrape data", details: error.message },
      { status: 500 }
    );
  }
}
