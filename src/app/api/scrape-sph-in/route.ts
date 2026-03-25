import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import db from "@/lib/db";
import { clearCachedSession, getSession as getScraperSession } from "@/lib/session-cache";

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
        stgl_akhir: endStr
      },
    };

    const reqJson = encodeURIComponent(JSON.stringify(reqData));
    const dataUrl = BASE_URL + "v1/pb/trsph_in/gr1?request=" + reqJson;

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
    
    const allRecords = rawRecords.filter((r: any) => 
        String(r.faktur || "").toLowerCase().trim() !== "total"
    );

    const batchOps: any[] = [];
    for (const record of allRecords) {
      batchOps.push({
        sql: `
          INSERT INTO sph_in (
            faktur, tgl, top_hari, faktur_spph, faktur_prd, kd_gudang,
            kd_cabang, kd_supplier, subtotal, persppn, ppn, total,
            status, username, faktur_po, raw_data
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(faktur) DO UPDATE SET
            tgl = excluded.tgl,
            top_hari = excluded.top_hari,
            faktur_spph = excluded.faktur_spph,
            faktur_prd = excluded.faktur_prd,
            kd_gudang = excluded.kd_gudang,
            kd_cabang = excluded.kd_cabang,
            kd_supplier = excluded.kd_supplier,
            subtotal = excluded.subtotal,
            persppn = excluded.persppn,
            ppn = excluded.ppn,
            total = excluded.total,
            status = excluded.status,
            username = excluded.username,
            faktur_po = excluded.faktur_po,
            raw_data = excluded.raw_data
        `,
        args: [
          record.faktur || '',
          record.tgl || '',
          record.top_hari || '0',
          record.faktur_spph || '',
          record.faktur_prd || '',
          record.kd_gudang || '',
          record.kd_cabang || '',
          record.kd_supplier || '',
          parseFloat(record.subtotal || '0'),
          parseFloat(record.persppn || '0'),
          parseFloat(record.ppn || '0'),
          parseFloat(record.total || '0'),
          record.status || '0',
          record.username || '',
          record.faktur_po || '',
          JSON.stringify(record)
        ]
      });
    }

    const chunkSize = 100;
    for (let i = 0; i < batchOps.length; i += chunkSize) {
      await db.batch(batchOps.slice(i, i + chunkSize), "write");
    }

    const lastUpdated = new Date().toISOString();
    await db.execute({
      sql: `
        INSERT INTO system_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `,
      args: ['last_scrape_sph_in', lastUpdated]
    });

    return NextResponse.json({ success: true, total: allRecords.length, lastUpdated });

  } catch (error: any) {
    console.error("Scrape SPH In Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
