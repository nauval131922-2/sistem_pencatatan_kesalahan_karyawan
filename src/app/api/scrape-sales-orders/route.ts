import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCachedSession, clearCachedSession, getSession as getScraperSession } from "@/lib/session-cache";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

const API_EMAIL = process.env.SCRAPER_EMAIL || "nauval";
const API_PASSWORD = process.env.SCRAPER_PASSWORD || "312admin2";
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/";
const API_KEY = "bismillah-m377-4j76-bb34-c450-7a62-ad3f";

// Helper to format date object to DD-MM-YYYY
function formatIndoDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get('start'); // YYYY-MM-DD
    const endParam = searchParams.get('end'); // YYYY-MM-DD

    if (!startParam || !endParam) {
      return NextResponse.json({ success: false, error: 'Start and end dates are required' }, { status: 400 });
    }

    const startDate = new Date(startParam);
    const endDate = new Date(endParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    // 1. Handle Auth & Session
    let cookies = await getScraperSession(async () => {
      const loginRes = await fetch(BASE_URL + "v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Bismillah-Api-Key": API_KEY,
        },
        body: JSON.stringify({ username: API_EMAIL, password: API_PASSWORD }),
      });
      return loginRes.ok ? loginRes.headers.get("set-cookie") : null;
    });

    if (!cookies) {
      return NextResponse.json({ error: "Failed to login to Digit." }, { status: 401 });
    }

    // 2. Fetch Data from Digit
    const startStr = formatIndoDate(startDate);
    const endStr = formatIndoDate(endDate);

    const payload = {
      limit: 5000,
      offset: 0,
      bsearch: {
        stgl_awal: startStr,
        stgl_akhir: endStr,
        ppn: "semua"
      }
    };

    const reqJson = encodeURIComponent(JSON.stringify(payload));
    const dataUrl = BASE_URL + "v1/pj/r_so_brg/gr1?request=" + reqJson;

    const res = await fetch(dataUrl, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json, text/plain, */*',
        'X-Bismillah-Api-Key': API_KEY,
        'Cookie': cookies
      }
    });

    if (res.status === 401) {
      clearCachedSession();
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    if (!res.ok) throw new Error(`Digit API Error: ${res.status}`);

    const resultJson = await res.json();
    const rows = resultJson.data || resultJson.records || [];

    if (rows.length === 0) {
      return NextResponse.json({ success: true, total: 0 });
    }

    // 3. Save to Database (UPSERT)
    // Map with defensive parsing
    const finalRecords = rows.map((r: any) => ({
      faktur: r.faktur,
      kd_pelanggan: r.kd_pelanggan || '',
      tgl: r.tgl || '',
      kd_barang: r.kd_barang || '',
      faktur_sph: r.faktur_sph || '',
      top_hari: String(r.top_hari || '0'),
      harga: parseFloat(String(r.harga).replace(/,/g, '')) || 0,
      qty: parseFloat(String(r.qty).replace(/,/g, '')) || 0,
      satuan: r.kd_barang?.split(' - ')[0] || r.kd_satuan || r.satuan || '',
      jumlah: parseFloat(String(r.jumlah).replace(/,/g, '')) || 0,
      ppn: parseFloat(String(r.ppn).replace(/,/g, '')) || 0,
      faktur_prd: r.faktur_prd || '',
      nama_prd: r.nama_prd || '',
      nama_pelanggan: r.nama_pelanggan || '',
      dati_2: r.dati_2 || '',
      gol_barang: r.gol_barang || '',
      spesifikasi: r.spesifikasi || '',
      keterangan: r.keterangan || '',
      raw_data: JSON.stringify(r)
    }));

    const insertSql = `
      INSERT INTO sales_orders (
        faktur, kd_pelanggan, tgl, kd_barang, faktur_sph, top_hari, harga, qty, satuan, jumlah, ppn, 
        faktur_prd, nama_prd, nama_pelanggan, dati_2, gol_barang, spesifikasi, keterangan, raw_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(faktur, kd_barang, tgl) DO UPDATE SET
        kd_pelanggan=excluded.kd_pelanggan,
        faktur_sph=excluded.faktur_sph,
        top_hari=excluded.top_hari,
        harga=excluded.harga,
        qty=excluded.qty,
        satuan=excluded.satuan,
        jumlah=excluded.jumlah,
        ppn=excluded.ppn,
        faktur_prd=excluded.faktur_prd,
        nama_prd=excluded.nama_prd,
        nama_pelanggan=excluded.nama_pelanggan,
        dati_2=excluded.dati_2,
        gol_barang=excluded.gol_barang,
        spesifikasi=excluded.spesifikasi,
        keterangan=excluded.keterangan,
        raw_data=excluded.raw_data
    `;

    const queries = finalRecords.map((r: any) => ({
      sql: insertSql,
      args: [
        r.faktur, r.kd_pelanggan, r.tgl, r.kd_barang, r.faktur_sph, r.top_hari, 
        r.harga, r.qty, r.satuan, r.jumlah, r.ppn, r.faktur_prd, r.nama_prd, r.nama_pelanggan, 
        r.dati_2, r.gol_barang, r.spesifikasi, r.keterangan, r.raw_data
      ]
    }));

    // Batch execute
    const chunkSize = 100;
    for (let i = 0; i < queries.length; i += chunkSize) {
      await db.batch(queries.slice(i, i + chunkSize));
    }

    return NextResponse.json({ 
      success: true, 
      total: finalRecords.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Scrape API Error (sales-orders):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
