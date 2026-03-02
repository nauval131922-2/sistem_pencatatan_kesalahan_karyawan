import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderName = searchParams.get('order_name');

    let data;
    if (orderName) {
      data = db.prepare('SELECT * FROM sales_reports WHERE nama_prd = ? ORDER BY tgl DESC LIMIT 1').all(orderName);
    } else {
      data = db.prepare('SELECT * FROM sales_reports ORDER BY tgl DESC, id DESC').all();
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
