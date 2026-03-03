import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

const USERNAME = process.env.SCRAPER_USERNAME || "nauval";
const PASSWORD = process.env.SCRAPER_PASSWORD || "312admin2";
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/";
const API_KEY = "bismillah-m377-4j76-bb34-c450-7a62-ad3f";

// Types
type ScrapeRecord = Record<string, any>;

// Helper to format date object to DD-MM-YYYY
function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

// Generate array of dates between start and end
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
    let startParam = searchParams.get("start"); // YYYY-MM-DD
    let endParam = searchParams.get("end");

    if (!startParam || !endParam) {
      // Default to today
      const today = new Date();
      startParam = today.toISOString().split("T")[0];
      endParam = startParam;
    }

    const startDate = new Date(startParam);
    const endDate = new Date(endParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    // 1. Login to get cookies
    const loginReqUrl = BASE_URL + "v1/auth/login";
    const loginBody = JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
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

    const cookies = loginRes.headers.get("set-cookie");
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
    const dataUrl = BASE_URL + "v1/prd/trprd_o/gr1?request=" + reqJson;

    const res = await fetch(dataUrl, {
      method: "GET",
      headers: {
        Accept: "application/json; charset=utf-8",
        "X-Bismillah-Api-Key": API_KEY,
        Cookie: cookies,
      },
    });

    const jsonData = await res.json();
    const rawRecords = jsonData.records || jsonData.data || jsonData.rows || jsonData.result || [];
    
    // Filter out totals row
    const filteredRecords = rawRecords.filter((r: any) => 
        String(r.kd_barang || "").toLowerCase().trim() !== "total"
    );

    const finalRecords = filteredRecords.map((r: any) => {
      const parsedQty = parseFloat(r.qty_order || r.qty_so || r.qty || "0") || 0;
      const parsedHarga = parseFloat(r.hp || r.bbb || r.harga || "0") || 0;
      return {
        ...r,
        qty: parsedQty,
        harga: parsedHarga,
        jumlah: parsedQty * parsedHarga
      };
    });

    // Sort descending by date (Tgl = DD-MM-YYYY)
    finalRecords.sort((a: any, b: any) => {
      const parseDate = (dStr: string) => {
        if (!dStr) return 0;
        const parts = dStr.split('-');
        if (parts.length === 3) {
           return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`).getTime();
        }
        return 0;
      };
      return parseDate(b.tgl) - parseDate(a.tgl);
    });

    // Save to database
    let importedCount = 0;
    
    const insertStmt = db.prepare(`
      INSERT INTO orders (faktur, nama_prd, nama_pelanggan, tgl, qty, harga, jumlah, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(faktur) DO UPDATE SET
        nama_prd = excluded.nama_prd,
        nama_pelanggan = excluded.nama_pelanggan,
        tgl = excluded.tgl,
        qty = excluded.qty,
        harga = excluded.harga,
        jumlah = excluded.jumlah,
        raw_data = excluded.raw_data
    `);

    db.transaction(() => {
      for (const record of finalRecords) {
        if (!record.faktur) continue; // Skip invalid rows
        try {
          insertStmt.run(
            record.faktur,
            record.nama_prd || '',
            record.nama_pelanggan || record.kd_pelanggan || '',
            record.tgl || '',
            record.qty || 0,
            record.harga || 0,
            record.jumlah || 0,
            JSON.stringify(record)
          );
          importedCount++;
        } catch (err) {
          console.error('Failed to import order:', record.faktur, err);
        }
      }
    })();

    try {
      db.prepare(`
        INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        'SCRAPE', 
        'orders', 
        0, 
        `Tarik Data Order Produksi (${startParam} s/d ${endParam})`, 
        JSON.stringify({ total: finalRecords.length }), 
        'System'
      );
    } catch (e) {
      console.error("Failed to log activity:", e);
    }

    const lastUpdated = new Date().toISOString();
    try {
      db.prepare(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).run('last_scrape_orders', lastUpdated);
    } catch (e) {
      console.error("Failed to update system_settings:", e);
    }

    return NextResponse.json({
      success: true,
      total: finalRecords.length,
      lastUpdated
    }, {
      headers: {
        // Prevent caching
        "Cache-Control": "no-store, max-age=0"
      }
    });

  } catch (error: any) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { error: "Failed to scrape data", details: error.message },
      { status: 500 }
    );
  }
}
