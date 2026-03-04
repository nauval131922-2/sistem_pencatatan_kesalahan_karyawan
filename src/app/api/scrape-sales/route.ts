import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCachedSession, setCachedSession, clearCachedSession, getSession } from "@/lib/session-cache";

const API_EMAIL = process.env.SCRAPER_EMAIL || "nauval"; // Changed from USERNAME to API_EMAIL
const API_PASSWORD = process.env.SCRAPER_PASSWORD || "312admin2"; // Changed from PASSWORD to API_PASSWORD
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/"; // Updated BASE_URL
const API_KEY = "bismillah-m377-4j76-bb34-c450-7a62-ad3f";

type ScrapeRecord = Record<string, any>;

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates = [];
  const currentDate = new Date(startDate.getTime());
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
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
    
    let cookies = await getSession(async () => {
      // 1. Login to get cookies
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

    // 2. Fetch data using range
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
    
    // Filter out totals row
    const allRecords = rawRecords.filter((r: any) => 
        String(r.kd_barang || "").toLowerCase().trim() !== "total"
    );

    // 3. Save to database - Use UPSERT logic
    // Ensure UNIQUE constraint exists for UPSERT to work effectively. 
    // In this case, we use 'faktur' and 'kd_barang' and 'nama_prd' as unique combo if needed, 
    // but usually faktur+item is unique enough.
    
    const insertStmt = db.prepare(`
      INSERT INTO sales_reports (tgl, kd_barang, nama_prd, nama_pelanggan, dati_2, qty, harga, jumlah, faktur, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(faktur, kd_barang, tgl) DO UPDATE SET
        nama_prd = excluded.nama_prd,
        nama_pelanggan = excluded.nama_pelanggan,
        dati_2 = excluded.dati_2,
        qty = excluded.qty,
        harga = excluded.harga,
        jumlah = excluded.jumlah,
        raw_data = excluded.raw_data
    `);

    db.transaction(() => {
      for (const record of allRecords) {
        try {
          insertStmt.run(
            record.tgl || '',
            record.kd_barang || '',
            record.nama_prd || '',
            record.nama_pelanggan || '',
            record.dati_2 || '',
            parseFloat(record.qty || "0") || 0,
            parseFloat(record.harga || "0") || 0,
            parseFloat(record.jumlah || "0") || 0,
            record.faktur || '',
            JSON.stringify(record)
          );
        } catch (err) {
          console.error('Failed to import sales record:', record.nama_prd, err);
        }
      }
    })();

    // Log activity
    db.prepare(`
      INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('SCRAPE', 'sales_reports', 0, `Tarik Laporan Penjualan (${startParam} s/d ${endParam})`, JSON.stringify({ total: allRecords.length }), 'System');

    // Update last_scrape_at for this module
    try {
      db.prepare(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).run('last_scrape_sales', new Date().toISOString());
    } catch (e) {
      console.error("Failed to update system_settings:", e);
    }

    const lastUpdated = new Date().toISOString();
    try {
      db.prepare(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).run('last_scrape_sales', lastUpdated);
    } catch (e) {
      console.error("Failed to update system_settings:", e);
    }

    return NextResponse.json({ success: true, total: allRecords.length, lastUpdated });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
