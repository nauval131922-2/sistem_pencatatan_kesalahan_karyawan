import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import db from "@/lib/db";
import { clearCachedSession, getSession as getScraperSession } from "@/lib/session-cache";
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
    console.log(`[SCRAPE] Starting Order Produksi scrape for range: ${startParam} - ${endParam}`);

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
    const dataUrl = BASE_URL + "v1/prd/trprd_o/gr1?request=" + reqJson;

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
    
    const filteredRecords = rawRecords.filter((r: any) => 
        String(r.kd_barang || "").toLowerCase().trim() !== "total"
    );

    const parseDigitQty = (val: any) => {
      if (!val) return 0;
      const str = String(val).replace(/,/g, ''); // Remove commas
      const match = str.match(/^-?\d+(\.\d+)?/); // Extract numeric part from start
      return match ? parseFloat(match[0]) : 0;
    };

    // Map faktur -> raw record
    const rawRecordMap = new Map(filteredRecords.map((r: any) => [r.faktur, r]));

    const finalRecords = filteredRecords.map((r: any) => {
      const qty = parseDigitQty(r.qty_so || r.qty_order || r.qty);
      const hp = parseFloat(r.hp || r.bbb || r.harga || "0") || 0;
      return {
        ...r,
        qty,
        satuan: r.kd_satuan || r.satuan || r.sat || '',
        harga: hp,
        jumlah: qty * hp
      };
    });

    // 1. Fetch existing fakturs
    const fakturs = finalRecords.map((r: any) => r.faktur).filter(Boolean);
    let existingFakturs = new Set<string>();
    if (fakturs.length > 0) {
        const placeholders = fakturs.map(() => '?').join(',');
        const existingRes = await db.execute({
            sql: `SELECT faktur FROM orders WHERE faktur IN (${placeholders})`,
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
              INSERT INTO orders (faktur, nama_prd, nama_pelanggan, tgl, qty, satuan, harga, jumlah, raw_data)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(faktur) DO UPDATE SET
                nama_prd = excluded.nama_prd,
                nama_pelanggan = excluded.nama_pelanggan,
                tgl = excluded.tgl,
                qty = excluded.qty,
                satuan = excluded.satuan,
                harga = excluded.harga,
                jumlah = excluded.jumlah,
                raw_data = excluded.raw_data
            `,
            args: [
              record.faktur,
              (record.nama_prd || '').trim(),
              record.nama_pelanggan || record.kd_pelanggan || '',
              record.tgl || '',
              record.qty || 0,
              record.satuan || '',
              record.harga || 0,
              record.jumlah || 0,
              JSON.stringify(rawRecordMap.get(record.faktur) || record)
            ]
        });

        // Sync to SOPd if data is from Jan 1, 2026 onwards
        const tglStr = record.tgl || '';
        const tglParts = tglStr.split('-');
        const isFrom2026 = tglParts.length === 3 && parseInt(tglParts[2], 10) >= 2026;

        if (isFrom2026) {
          batchOps.push({
            sql: `
              INSERT INTO sopd (no_sopd, tgl, nama_order, qty_sopd, unit)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(no_sopd) DO UPDATE SET
                tgl = excluded.tgl,
                nama_order = excluded.nama_order,
                qty_sopd = excluded.qty_sopd,
                unit = excluded.unit
            `,
            args: [
              record.faktur,
              record.tgl || '',
              (record.nama_prd || '').trim(),
              record.qty || 0,
              record.satuan || ''
            ]
          });
        }
    }

    // Process batch in chunks
    const chunkSize = 100;
    for (let i = 0; i < batchOps.length; i += chunkSize) {
        await db.batch(batchOps.slice(i, i + chunkSize), "write");
    }

    const lastUpdated = new Date().toISOString();
    
    // 3. Update settings
    const finalOps = [
      {
        sql: `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `,
        args: ['last_scrape_orders', lastUpdated]
      },
      {
        sql: `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `,
        args: [getScrapedPeriodSettingKey('last_scrape_orders'), encodeScrapedPeriod({ start: metaStart, end: metaEnd })]
      }
    ];

    await db.batch(finalOps, "write");

    return NextResponse.json({
      success: true,
      total: finalRecords.length,
      newly_inserted: newInsertedCount,
      lastUpdated,
      scrapedPeriod: { start: startStr, end: endStr }
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
