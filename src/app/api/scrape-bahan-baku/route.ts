import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

const USERNAME = process.env.SCRAPER_USERNAME || "nauval";
const PASSWORD = process.env.SCRAPER_PASSWORD || "312admin2";
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/";
const API_KEY = "bismillah-m377-4j76-bb34-c450-7a62-ad3f";

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

    // 2. Prepare days to fetch
    const days = getDatesInRange(startDate, endDate);
    let allRecords: Record<string, any>[] = [];

    // Helper function to fetch one day
    const fetchDay = async (date: Date): Promise<Record<string, any>[]> => {
      const dayStr = formatDate(date);
      const reqData = {
        limit: 10000,
        offset: 0,
        bsearch: {
          stgl_awal: dayStr,
          stgl_akhir: dayStr,
        },
      };

      const reqJson = encodeURIComponent(JSON.stringify(reqData));
      // API Endpoint for Bahan Baku (Berdasarkan script python)
      const dataUrl = BASE_URL + "v1/prd/r_brg_bbb/gr1?request=" + reqJson;

      try {
        const res = await fetch(dataUrl, {
          method: "GET",
          headers: {
            Accept: "application/json; charset=utf-8",
            "X-Bismillah-Api-Key": API_KEY,
            Cookie: cookies,
          },
        });

        const jsonData = await res.json();
        const records = jsonData.records || jsonData.data || jsonData.rows || jsonData.result || [];
        
        // Filter out totals row like the python script
        return records.filter((r: any) => 
            String(r.kd_barang || "").toLowerCase().trim() !== "total" &&
            String(r.nama_barang || "").toLowerCase().trim() !== "subtotal"
        );
      } catch (error) {
        console.error(`Error fetching day ${dayStr}:`, error);
        return [];
      }
    };

    // Process in batches of 10 days
    const batchSize = 10;
    for (let i = 0; i < days.length; i += batchSize) {
      const batch = days.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(d => fetchDay(d)));
      for (const records of batchResults) {
        allRecords = allRecords.concat(records);
      }
    }

    const finalRecords = allRecords.map((r: any) => {
      // Parse numbers as guided by python
      const parseNumber = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        try {
          return parseFloat(String(val).replace(/,/g, "")) || 0;
        } catch {
          return 0;
        }
      }

      return {
        ...r,
        qty: parseNumber(r.qty),
        hp: parseNumber(r.hp),
      };
    });

    // Save to database
    let importedCount = 0;
    
    // Replace the old data with the newly fetched data
    db.prepare('DELETE FROM bahan_baku').run();
    
    const insertStmt = db.prepare(`
      INSERT INTO bahan_baku (tgl, nama_barang, kd_barang, faktur, faktur_prd, qty, satuan, nama_prd, hp, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const record of finalRecords) {
        if (!record.nama_barang) continue; // Skip invalid rows
        try {
          insertStmt.run(
            record.tgl || '',
            record.nama_barang || '',
            record.kd_barang || '',
            record.faktur || '',
            record.faktur_prd || '',
            record.qty || 0,
            record.satuan || '',
            record.nama_prd || '',
            record.hp || 0,
            JSON.stringify(record)
          );
          importedCount++;
        } catch (err) {
          console.error('Failed to import bahan_baku:', record.nama_barang, err);
        }
      }
    })();

    try {
      db.prepare(`
        INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        'SCRAPE', 
        'bahan_baku', 
        0, 
        `Tarik Data Bahan Baku Produksi (${startParam} s/d ${endParam})`, 
        JSON.stringify({ total: finalRecords.length }), 
        'System'
      );
    } catch (e) {
      console.error("Failed to log activity:", e);
    }

    return NextResponse.json({
      success: true,
      total: finalRecords.length,
      data: finalRecords,
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
