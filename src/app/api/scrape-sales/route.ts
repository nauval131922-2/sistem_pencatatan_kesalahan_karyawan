import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import db from "@/lib/db";
import { getCachedSession, setCachedSession, clearCachedSession, getSession as getScraperSession } from "@/lib/session-cache";
import { getSession } from "@/lib/session";

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
    
    const reqData = {
      limit: 10000,
      offset: 0,
      bsearch: {
        stgl_awal: startStr,
        stgl_akhir: endStr,
        ppn: "semua",
      },
    };

    const reqJson = encodeURIComponent(JSON.stringify(reqData));
    const dataUrl = BASE_URL + "v1/pj/r_jual_rkp/gr1?request=" + reqJson;

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
    
    const allRecords = rawRecords.filter((r: any) => 
        String(r.kd_barang || "").toLowerCase().trim() !== "total"
    );

    // 1. Prepare batch inserts
    const batchOps: any[] = [];
    for (const record of allRecords) {
      batchOps.push({
        sql: `
          INSERT INTO sales_reports (
            faktur, kd_pelanggan, tgl, kd_barang, faktur_so, 
            jthtmp, harga, qty, jumlah, ppn, 
            faktur_prd, nama_prd, no_ref_pelanggan, nama_pelanggan, dati_2, 
            gol_barang, keterangan_so, recid, raw_data
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(faktur, kd_barang, tgl) DO UPDATE SET
            kd_pelanggan = excluded.kd_pelanggan,
            faktur_so = excluded.faktur_so,
            jthtmp = excluded.jthtmp,
            harga = excluded.harga,
            qty = excluded.qty,
            jumlah = excluded.jumlah,
            ppn = excluded.ppn,
            faktur_prd = excluded.faktur_prd,
            nama_prd = excluded.nama_prd,
            no_ref_pelanggan = excluded.no_ref_pelanggan,
            nama_pelanggan = excluded.nama_pelanggan,
            dati_2 = excluded.dati_2,
            gol_barang = excluded.gol_barang,
            keterangan_so = excluded.keterangan_so,
            recid = excluded.recid,
            raw_data = excluded.raw_data
        `,
        args: [
          record.faktur || '',
          record.kd_pelanggan || '',
          record.tgl || '',
          record.kd_barang || '',
          record.faktur_so || '',
          record.jthtmp || '',
          parseFloat(record.harga || "0") || 0,
          parseFloat(record.qty || "0") || 0,
          parseFloat(record.jumlah || "0") || 0,
          parseFloat(record.ppn || "0") || 0,
          record.faktur_prd || '',
          record.nama_prd || '',
          record.no_ref_pelanggan || '',
          record.nama_pelanggan || '',
          record.dati_2 || '',
          record.gol_barang || '',
          record.keterangan_so || '',
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
        args: ['last_scrape_sales', lastUpdated]
      }
    ];

    await db.batch(finalOps, "write");

    return NextResponse.json({ success: true, total: allRecords.length, newly_inserted: 0, lastUpdated });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
