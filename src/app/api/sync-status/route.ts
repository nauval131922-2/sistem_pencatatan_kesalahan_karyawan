import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const res = await db.execute("SELECT key, value FROM system_settings WHERE key LIKE 'last_scrape_%'");
    
    const statuses: Record<string, string> = {};
    const periods: Record<string, any> = {};

    res.rows.forEach((row: any) => {
      const key = row.key as string;
      const isPeriod = key.endsWith('_period');
      
      // Module ID: remove 'last_scrape_' prefix, then '_period' if it exists, then replace _ with -
      let modId = key.replace('last_scrape_', '');
      if (isPeriod) modId = modId.replace('_period', '');
      modId = modId.replace(/_/g, '-');

      if (isPeriod) {
        try { periods[modId] = JSON.parse(row.value); } catch(e){}
      } else {
        statuses[modId] = row.value;
      }
    });

    return NextResponse.json({ success: true, statuses, periods });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
