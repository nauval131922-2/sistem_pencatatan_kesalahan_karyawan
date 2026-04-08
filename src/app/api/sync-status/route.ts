import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const res = await db.execute("SELECT key, value FROM system_settings WHERE key LIKE 'last_scrape_%'");
    const statuses = res.rows.reduce((acc: any, row: any) => {
      // Remove 'last_scrape_' prefix to match module IDs
      const modId = row.key.replace('last_scrape_', '').replace(/_/g, '-');
      acc[modId] = row.value;
      return acc;
    }, {});

    return NextResponse.json({ success: true, statuses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
