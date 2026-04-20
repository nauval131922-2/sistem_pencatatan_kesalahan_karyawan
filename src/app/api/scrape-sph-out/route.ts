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
    console.log(`[SCRAPE] Starting SPH Out scrape for range: ${startParam} - ${endParam}`);

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

      if (!loginRes.ok) {
        return null;
      }
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
    
    // Based on user provided payload
    const reqData = {
      limit: 10000,
      offset: 0,
      bsearch: {
        stgl_awal: startStr,
        stgl_akhir: endStr
      },
    };

    const reqJson = encodeURIComponent(JSON.stringify(reqData));
    const dataUrl = BASE_URL + "v1/pj/trsph_out/gr1?request=" + reqJson;

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

    if (!res.ok) {
       return NextResponse.json({ error: `Fetch failed with status ${res.status}` }, { status: res.status });
    }

    const jsonData = await res.json();
    const rawRecords = jsonData.records || jsonData.data || jsonData.rows || jsonData.result || [];
    
    // Filter out total rows if any
    const filteredRecords = rawRecords.filter((r: any) => 
        String(r.faktur || "").toLowerCase().trim() !== "total"
    );

    const parseDigitVal = (val: any) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      const str = String(val).replace(/,/g, ''); 
      const match = str.match(/^-?\d+(\.\d+)?/); 
      return match ? parseFloat(match[0]) : 0;
    };

    const finalRecords = filteredRecords.map((r: any) => {
      return {
        faktur: r.faktur,
        tgl: r.tgl || '',
        kd_pelanggan: r.kd_pelanggan || '',
        barang: r.barang || '',
        total: parseDigitVal(r.total),
        status: String(r.status || "1"), // Preserve original string status for client logic
        faktur_so: r.faktur_so ? r.faktur_so.replace(/<[^>]*>?/gm, '').trim() : '', // Strip HTML from SO indicator
        raw_data: JSON.stringify(r)
      };
    });

    // 1. Fetch existing fakturs
    const fakturs = finalRecords.map((r: any) => r.faktur).filter(Boolean);
    let existingFakturs = new Set<string>();
    if (fakturs.length > 0) {
        const placeholders = fakturs.map(() => '?').join(',');
        const existingRes = await db.execute({
            sql: `SELECT faktur FROM sph_out WHERE faktur IN (${placeholders})`,
            args: fakturs
        });
        existingFakturs = new Set(existingRes.rows.map((row: any) => row.faktur));
    }

    // 2. Prepare batch inserts
    const batchOps: any[] = [];
    let newInsertedCount = 0;
    
    for (const record of finalRecords) {
        if (!record.faktur) continue;
        if (!existingFakturs.has(record.faktur)) newInsertedCount++;
        
        batchOps.push({
            sql: `
              INSERT INTO sph_out (faktur, tgl, kd_pelanggan, barang, total, status, faktur_so, raw_data)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(faktur) DO UPDATE SET
                tgl = excluded.tgl,
                kd_pelanggan = excluded.kd_pelanggan,
                barang = excluded.barang,
                total = excluded.total,
                status = excluded.status,
                faktur_so = excluded.faktur_so,
                raw_data = excluded.raw_data
            `,
            args: [
              record.faktur,
              record.tgl,
              record.kd_pelanggan,
              record.barang,
              record.total,
              record.status,
              record.faktur_so,
              record.raw_data
            ]
        });
    }

    // Process batch
    const chunkSize = 100;
    for (let i = 0; i < batchOps.length; i += chunkSize) {
        await db.batch(batchOps.slice(i, i + chunkSize), "write");
    }

    const lastUpdated = new Date().toISOString();
    
    await db.batch([
      {
        sql: `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `,
        args: ['last_scrape_sph_out', lastUpdated]
      },
      {
        sql: `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `,
        args: [getScrapedPeriodSettingKey('last_scrape_sph_out'), encodeScrapedPeriod({ start: metaStart, end: metaEnd })]
      }
    ], "write");

    return NextResponse.json({
      success: true,
      total: finalRecords.length,
      newly_inserted: newInsertedCount,
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
