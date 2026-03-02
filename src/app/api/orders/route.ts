import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const records = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all();
    
    // Sort logic from original scraper
    records.sort((a: any, b: any) => {
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

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch cached orders", details: error.message },
      { status: 500 }
    );
  }
}
