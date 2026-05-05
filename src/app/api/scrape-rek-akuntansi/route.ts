import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { clearCachedSession, getSession as getScraperSession } from "@/lib/session-cache";

export const dynamic = 'force-dynamic';

const API_EMAIL = process.env.SCRAPER_EMAIL || "nauval";
const API_PASSWORD = process.env.SCRAPER_PASSWORD || "312admin2";
const BASE_URL = "https://buyapercetakan.mdthoster.com/il/";
const API_KEY = "bismillah-m377-4j76-bb34-c450-7a62-ad3f";

export async function GET(req: NextRequest) {
  try {
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

    let offset = 0;
    const limit = 100;
    let hasMore = true;
    let totalScraped = 0;
    const queries: any[] = [];

    const insertSql = `
      INSERT INTO rek_akuntansi (
        kode, keterangan, jenis, arus_kas, analisa_rasio, harga_pokok,
        username, recid, raw_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(kode) DO UPDATE SET
        keterangan=excluded.keterangan,
        jenis=excluded.jenis,
        arus_kas=excluded.arus_kas,
        analisa_rasio=excluded.analisa_rasio,
        harga_pokok=excluded.harga_pokok,
        username=excluded.username,
        recid=excluded.recid,
        raw_data=excluded.raw_data,
        updated_at=CURRENT_TIMESTAMP,
        fetched_at=CURRENT_TIMESTAMP
    `;

    while (hasMore) {
      const payload = {
        limit,
        offset,
      };

      const reqJson = encodeURIComponent(JSON.stringify(payload));
      const dataUrl = BASE_URL + "v1/akt/mrek/gr1?request=" + reqJson;

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
        hasMore = false;
        break;
      }

      for (const r of rows) {
        queries.push({
          sql: insertSql,
          args: [
            r.kode || "",
            r.keterangan || "",
            r.jenis || "",
            r.arus_kas || "",
            r.analisa_rasio || "",
            r.harga_pokok || "",
            r.username || "",
            r.recid || "",
            JSON.stringify(r),
            r.create_at || null
          ]
        });
      }

      totalScraped += rows.length;
      if (rows.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    if (queries.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < queries.length; i += chunkSize) {
        await db.batch(queries.slice(i, i + chunkSize), "write");
      }
    }

    const lastUpdated = new Date().toISOString();
    await db.batch([
      {
        sql: `INSERT INTO system_settings (key, value, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        args: ["last_scrape_rek_akuntansi", lastUpdated]
      }
    ], "write");

    return NextResponse.json({
      success: true,
      total: totalScraped,
      lastUpdated
    });

  } catch (error: any) {
    console.error("Scrape API Error (rek-akuntansi):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
