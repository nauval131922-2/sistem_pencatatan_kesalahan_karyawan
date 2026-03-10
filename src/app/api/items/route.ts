import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderName = searchParams.get('order_name');
    const orderFaktur = searchParams.get('order_faktur');
    const jenisBarang = searchParams.get('jenis_barang'); // 'Bahan Baku' | 'Barang Jadi'

    if (!jenisBarang) {
      return NextResponse.json({ error: "jenis_barang is required" }, { status: 400 });
    }

    let items: any[] = [];
    
    // Add WHERE conditions dynamically based on presence of order filters
    const orderFilter = (orderFaktur || orderName) 
      ? `AND (faktur_prd = ? OR nama_prd = ?)` 
      : '';
    const queryParams = (orderFaktur || orderName) ? [orderFaktur || '', orderName || ''] : [];
    
    if (jenisBarang === 'Bahan Baku') {
      // Find all unique items for this specific order from bahan_baku table
      const sql = `
        SELECT DISTINCT nama_barang, kd_barang, faktur, hp as harga 
        FROM bahan_baku 
        WHERE nama_barang IS NOT NULL AND nama_barang != '' ${orderFilter}
        ORDER BY nama_barang ASC
      `;
      const result = await db.execute({ sql, args: queryParams });
      items = result.rows;
      
    } else if (jenisBarang === 'Barang Jadi') {
      // Find all unique items for this specific order from barang_jadi table
      const sql = `
        SELECT DISTINCT nama_barang, kd_barang, faktur, hp as harga 
        FROM barang_jadi 
        WHERE nama_barang IS NOT NULL AND nama_barang != '' ${orderFilter}
        ORDER BY nama_barang ASC
      `;
      const result = await db.execute({ sql, args: queryParams });
      items = result.rows;
    } else if (jenisBarang === 'Penjualan Barang') {
      // Find items from sales_reports table
      const sql = `
        SELECT 
          nama_prd as nama_barang,
          kd_barang,
          faktur,
          harga as harga,
          harga as harga_jual
        FROM sales_reports 
        WHERE nama_prd IS NOT NULL AND nama_prd != '' ${(orderFaktur || orderName) ? `AND (faktur = ? OR nama_prd = ?)` : ''}
        ORDER BY substr(tgl, 7, 4) ASC, substr(tgl, 4, 2) ASC, substr(tgl, 1, 2) ASC
      `;
      const result = await db.execute({ sql, args: queryParams });
      items = result.rows;
    }

    return NextResponse.json({
      success: true,
      data: items,
    });

  } catch (error: any) {
    console.error("Fetch items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch items", details: error.message },
      { status: 500 }
    );
  }
}
