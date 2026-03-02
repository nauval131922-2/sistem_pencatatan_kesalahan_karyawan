import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const records = db.prepare(`SELECT * FROM bahan_baku`).all();

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch cached bahan_baku", details: error.message },
      { status: 500 }
    );
  }
}
