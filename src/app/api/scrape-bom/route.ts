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

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let startParam = searchParams.get("start");
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
    
    const reqData = {
      limit: 10000,
      offset: 0,
      bsearch: {
        stgl_awal: startStr,
        stgl_akhir: endStr,
      },
    };

    const reqJson = encodeURIComponent(JSON.stringify(reqData));
    const dataUrl = BASE_URL + "v1/prd/trprd_bm/gr1?request=" + reqJson;

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
    
    // Filter out total rows if any
    const allRecords = rawRecords.filter((r: any) => 
        String(r.faktur || "").toLowerCase().trim() !== "total"
    );

    const parseDigitVal = (val: any) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      const str = String(val).replace(/,/g, ''); 
      const match = str.match(/^-?\d+(\.\d+)?/); 
      return match ? parseFloat(match[0]) : 0;
    };

    const batchOps: any[] = [];
    for (const record of allRecords) {
      batchOps.push({
        sql: `
          INSERT INTO bill_of_materials (
            faktur, tgl, kd_mtd, nama_prd, kd_pelanggan, 
            bbb, btkl, bop, hp, spesifikasi, 
            kd_barang, qty_order, faktur_sph, faktur_prd, 
            raw_data
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(faktur) DO UPDATE SET
            tgl = excluded.tgl,
            kd_mtd = excluded.kd_mtd,
            nama_prd = excluded.nama_prd,
            kd_pelanggan = excluded.kd_pelanggan,
            bbb = excluded.bbb,
            btkl = excluded.btkl,
            bop = excluded.bop,
            hp = excluded.hp,
            spesifikasi = excluded.spesifikasi,
            kd_barang = excluded.kd_barang,
            qty_order = excluded.qty_order,
            faktur_sph = excluded.faktur_sph,
            faktur_prd = excluded.faktur_prd,
            raw_data = excluded.raw_data
        `,
        args: [
          record.faktur || '',
          record.tgl || '',
          record.kd_mtd || '',
          record.nama_prd || '',
          record.kd_pelanggan || '',
          parseDigitVal(record.bbb),
          parseDigitVal(record.btkl),
          parseDigitVal(record.bop),
          parseDigitVal(record.hp),
          record.spesifikasi || '',
          record.kd_barang || '',
          parseDigitVal(record.qty_order),
          record.faktur_sph || '',
          record.faktur_prd || '',
          JSON.stringify(record)
        ]
      });
    }

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
        args: ['last_scrape_bom', lastUpdated]
      },
      {
        sql: `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `,
        args: [getScrapedPeriodSettingKey('last_scrape_bom'), encodeScrapedPeriod({ start: startStr, end: endStr })]
      }
    ], "write");

    return NextResponse.json({
      success: true,
      total: allRecords.length,
      lastUpdated,
      scrapedPeriod: {
        start: startStr,
        end: endStr,
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
