import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

const USERNAME = process.env.SCRAPER_USERNAME || "nauval";
const PASSWORD = process.env.SCRAPER_PASSWORD || "312admin2";
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/";
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

    // 1. Login
    const loginRes = await fetch(BASE_URL + "v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json; charset=utf-8",
        "X-Bismillah-Api-Key": API_KEY,
      },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });

    const cookies = loginRes.headers.get("set-cookie");
    if (!cookies) {
      return NextResponse.json({ error: "Failed to login." }, { status: 401 });
    }

    // 2. Fetch data
    const days = getDatesInRange(startDate, endDate);
    let allRecords: ScrapeRecord[] = [];

    const fetchDay = async (date: Date): Promise<ScrapeRecord[]> => {
      const dayStr = formatDate(date);
      const reqData = {
        limit: 10000,
        offset: 0,
        bsearch: {
          stgl_awal: dayStr,
          stgl_akhir: dayStr,
          ppn: "semua",
        },
      };

      const reqJson = encodeURIComponent(JSON.stringify(reqData));
      const dataUrl = BASE_URL + "v1/pj/r_jual_rkp/gr1?request=" + reqJson;

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
        
        return records.filter((r: any) => 
            String(r.kd_barang || "").toLowerCase().trim() !== "total"
        );
      } catch (error) {
        console.error(`Error fetching sales for ${dayStr}:`, error);
        return [];
      }
    };

    const batchSize = 10;
    for (let i = 0; i < days.length; i += batchSize) {
      const batch = days.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(d => fetchDay(d)));
      for (const records of batchResults) {
        allRecords = allRecords.concat(records);
      }
    }

    // 3. Save to database
    db.prepare('DELETE FROM sales_reports').run();
    
    const insertStmt = db.prepare(`
      INSERT INTO sales_reports (tgl, kd_barang, nama_prd, nama_pelanggan, dati_2, qty, harga, jumlah, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    return NextResponse.json({ success: true, total: allRecords.length });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
