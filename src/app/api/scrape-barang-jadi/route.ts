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
    const dataUrl = BASE_URL + "v1/prd/r_brg_hasil/gr1?request=" + reqJson;

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

    const finalRecords = filteredRecords.map((r: any) => {
      const parseNumber = (val: any) => {
        if (!val === undefined || val === null) return 0;
        if (typeof val === 'number') return val;
        try {
          const s = String(val).replace(/,/g, "");
          return isNaN(parseFloat(s)) ? 0 : parseFloat(s);
        } catch {
          return 0;
        }
      }

      return {
        ...r,
        qty: parseNumber(r.qty),
        qty_wip_awal: parseNumber(r.qty_wip_awal),
        qty_wip_akhir: parseNumber(r.qty_wip_akhir),
        qty_order: parseNumber(r.qty_order),
        qty_so: parseNumber(r.qty_so),
        total_berat_kg: parseNumber(r.total_berat_kg),
        pers_alokasi_hp: parseNumber(r.pers_alokasi_hp),
        hp: parseNumber(r.hp),
        hp_total: parseNumber(r.hp_total),
        bbb: parseNumber(r.bbb),
        btkl: parseNumber(r.btkl),
        bop: parseNumber(r.bop),
      };
    });

    // 1. Prepare batch inserts
    const batchOps: any[] = [];
    for (const record of finalRecords) {
      if (!record.nama_barang) continue;
      
      batchOps.push({
        sql: `
          INSERT INTO barang_jadi (
            tgl, nama_barang, kd_barang, faktur, faktur_prd, faktur_so,
            kd_cabang, kd_gudang, qty_wip_awal, qty, qty_wip_akhir,
            total_berat_kg, pers_alokasi_hp, mtd_alokasi_hp, tgl_expired,
            selesai, status, hp, hp_total, bbb, btkl, bop,
            keterangan, username, kd_pelanggan, nama_prd, qty_order, qty_so, recid, raw_data
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(faktur, kd_barang, tgl) DO UPDATE SET
            nama_barang = excluded.nama_barang,
            faktur_prd = excluded.faktur_prd,
            faktur_so = excluded.faktur_so,
            kd_cabang = excluded.kd_cabang,
            kd_gudang = excluded.kd_gudang,
            qty_wip_awal = excluded.qty_wip_awal,
            qty = excluded.qty,
            qty_wip_akhir = excluded.qty_wip_akhir,
            total_berat_kg = excluded.total_berat_kg,
            pers_alokasi_hp = excluded.pers_alokasi_hp,
            mtd_alokasi_hp = excluded.mtd_alokasi_hp,
            tgl_expired = excluded.tgl_expired,
            selesai = excluded.selesai,
            status = excluded.status,
            hp = excluded.hp,
            hp_total = excluded.hp_total,
            bbb = excluded.bbb,
            btkl = excluded.btkl,
            bop = excluded.bop,
            keterangan = excluded.keterangan,
            username = excluded.username,
            kd_pelanggan = excluded.kd_pelanggan,
            nama_prd = excluded.nama_prd,
            qty_order = excluded.qty_order,
            qty_so = excluded.qty_so,
            recid = excluded.recid,
            raw_data = excluded.raw_data
        `,
        args: [
          record.tgl || '',
          record.nama_barang || '',
          record.kd_barang || '',
          record.faktur || '',
          record.faktur_prd || '',
          record.faktur_so || '',
          record.kd_cabang || '',
          record.kd_gudang || '',
          record.qty_wip_awal || 0,
          record.qty || 0,
          record.qty_wip_akhir || 0,
          record.total_berat_kg || 0,
          record.pers_alokasi_hp || 0,
          record.mtd_alokasi_hp || '',
          record.tgl_expired || '',
          record.selesai || 0,
          record.status || 0,
          record.hp || 0,
          record.hp_total || 0,
          record.bbb || 0,
          record.btkl || 0,
          record.bop || 0,
          record.keterangan || '',
          record.username || '',
          record.kd_pelanggan || '',
          record.nama_prd || '',
          record.qty_order || 0,
          record.qty_so || 0,
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
        args: ['last_scrape_barang_jadi', lastUpdated]
      },
      {
        sql: `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `,
        args: [getScrapedPeriodSettingKey('last_scrape_barang_jadi'), encodeScrapedPeriod({ start: metaStart, end: metaEnd })]
      }
    ];

    await db.batch(finalOps, "write");

    return NextResponse.json({
      success: true,
      total: finalRecords.length,
      newly_inserted: 0,
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
