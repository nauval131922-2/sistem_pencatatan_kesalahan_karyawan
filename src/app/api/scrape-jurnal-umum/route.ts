import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { clearCachedSession, getSession as getScraperSession } from "@/lib/session-cache";
import { encodeScrapedPeriod, getScrapedPeriodSettingKey } from "@/lib/server-scraped-period";

export const dynamic = 'force-dynamic';

const API_EMAIL = process.env.SCRAPER_EMAIL || "nauval";
const API_PASSWORD = process.env.SCRAPER_PASSWORD || "312admin2";
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/";
const API_KEY = "bismillah-m377-4j76-bb34-c450-7a62-ad3f";

function formatIndoDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return d + "-" + m + "-" + y;
}

function normalizeDate(raw: string): string {
  if (!raw) return "";
  const parts = raw.split(/[-/]/);
  if (parts.length !== 3) return raw;
  const d = parts[0].padStart(2, "0");
  const m = parts[1].padStart(2, "0");
  let y = parts[2];
  if (y.length === 2) y = "20" + y;
  return y + "-" + m + "-" + d;
}

async function ensureTable() {
  const executor = (db as any).client || db;
  if (!executor.execute) return;

  try {
    const cols = await executor.execute("PRAGMA table_info(jurnal_umum)");
    const colNames = (cols.rows || []).map((r: any) => String(r.name || ""));
    if (colNames.length > 0 && !colNames.includes("child_order")) {
      await executor.execute("DROP TABLE IF EXISTS jurnal_umum");
    }
  } catch (_) {}

  await executor.execute(`CREATE TABLE IF NOT EXISTS jurnal_umum (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faktur TEXT NOT NULL,
    tgl TEXT,
    rekening TEXT,
    keterangan TEXT,
    debit REAL,
    kredit REAL,
    username TEXT,
    create_at TEXT,
    parent_faktur TEXT,
    is_child INTEGER DEFAULT 0,
    child_order INTEGER DEFAULT 0,
    raw_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faktur, child_order, is_child)
  )`);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    if (!startParam || !endParam) {
      return NextResponse.json({ success: false, error: "Start and end dates are required" }, { status: 400 });
    }

    const startDate = new Date(startParam);
    const endDate = new Date(endParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    await ensureTable();

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

    const startStr = formatIndoDate(startDate);
    const endStr = formatIndoDate(endDate);

    const metaStart = searchParams.get("metaStart") || startStr;
    const metaEnd = searchParams.get("metaEnd") || endStr;

    const payload = {
      limit: 5000,
      offset: 0,
      bsearch: {
        stgl_awal: startStr,
        stgl_akhir: endStr,
      }
    };

    const reqJson = encodeURIComponent(JSON.stringify(payload));
    const dataUrl = BASE_URL + "v1/akt/r_jurnal/gr1?request=" + reqJson;

    const res = await fetch(dataUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json, text/plain, */*",
        "X-Bismillah-Api-Key": API_KEY,
        "Cookie": cookies
      }
    });

    if (res.status === 401) {
      clearCachedSession();
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    if (!res.ok) throw new Error("Digit API Error: " + res.status);

    const resultJson = await res.json();
    const rows = resultJson.data || resultJson.records || [];

    if (rows.length === 0) {
      return NextResponse.json({ success: true, total: 0 });
    }

    const insertSql = `
      INSERT INTO jurnal_umum (
        faktur, tgl, rekening, keterangan, debit, kredit,
        username, create_at, parent_faktur, is_child, child_order, raw_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(faktur, child_order, is_child) DO UPDATE SET
        tgl=excluded.tgl,
        rekening=excluded.rekening,
        keterangan=excluded.keterangan,
        debit=excluded.debit,
        kredit=excluded.kredit,
        username=excluded.username,
        create_at=excluded.create_at,
        parent_faktur=excluded.parent_faktur,
        raw_data=excluded.raw_data
    `;

    const queries: any[] = [];

    for (const r of rows) {
      queries.push({
        sql: insertSql,
        args: [
          r.faktur || "",
          normalizeDate(r.tgl || ""),
          r.rekening || "",
          r.keterangan || "",
          parseFloat(String(r.debit || "0").replace(/,/g, "")) || 0,
          parseFloat(String(r.kredit || "0").replace(/,/g, "")) || 0,
          r.username || "",
          r.create_at || "",
          "",
          0,
          0,
          JSON.stringify(r)
        ]
      });

      const children: any[] = r.w2ui?.children || [];
      children.forEach((child, ci) => {
        queries.push({
          sql: insertSql,
          args: [
            r.faktur || "",
            normalizeDate(r.tgl || ""),
            child.rekening || "",
            child.keterangan || "",
            parseFloat(String(child.debit || "0").replace(/,/g, "")) || 0,
            parseFloat(String(child.kredit || "0").replace(/,/g, "")) || 0,
            child.username || "",
            r.create_at || "",
            r.faktur || "",
            1,
            ci + 1,
            JSON.stringify(child)
          ]
        });
      });
    }

    const chunkSize = 100;
    for (let i = 0; i < queries.length; i += chunkSize) {
      await db.batch(queries.slice(i, i + chunkSize));
    }

    const lastUpdated = new Date().toISOString();
    await db.batch([
      {
        sql: `INSERT INTO system_settings (key, value, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        args: ["last_scrape_jurnal_umum", lastUpdated]
      },
      {
        sql: `INSERT INTO system_settings (key, value, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        args: [getScrapedPeriodSettingKey("last_scrape_jurnal_umum"), encodeScrapedPeriod({ start: metaStart, end: metaEnd })]
      }
    ], "write");

    return NextResponse.json({
      success: true,
      total: rows.length,
      lastUpdated,
      scrapedPeriod: { start: metaStart, end: metaEnd }
    });

  } catch (error: any) {
    console.error("Scrape API Error (jurnal-umum):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
