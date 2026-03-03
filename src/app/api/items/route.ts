import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderName = searchParams.get('order_name');
    const orderFaktur = searchParams.get('order_faktur');
    const jenisBarang = searchParams.get('jenis_barang'); // 'Bahan Baku' | 'Barang Jadi'

    if (!orderName || !jenisBarang) {
      return NextResponse.json({ error: "order_name and jenis_barang are required" }, { status: 400 });
    }

    let items: any[] = [];
    
    // Use the appropriate table based on Jenis Barang
    if (jenisBarang === 'Bahan Baku') {
      // Find all unique items for this specific order from bahan_baku table
      const stmt = db.prepare(`
        SELECT DISTINCT nama_barang, kd_barang, faktur, hp as harga 
        FROM bahan_baku 
        WHERE (faktur_prd = ? OR nama_prd = ?) AND nama_barang IS NOT NULL AND nama_barang != ''
        ORDER BY nama_barang ASC
      `);
      items = stmt.all(orderFaktur || '', orderName) as any[];
      
    } else if (jenisBarang === 'Barang Jadi') {
      // Find all unique items for this specific order from barang_jadi table
      const stmt = db.prepare(`
        SELECT DISTINCT nama_barang, kd_barang, faktur, hp as harga 
        FROM barang_jadi 
        WHERE (faktur_prd = ? OR nama_prd = ?) AND nama_barang IS NOT NULL AND nama_barang != ''
        ORDER BY nama_barang ASC
      `);
      items = stmt.all(orderFaktur || '', orderName) as any[];
      
      items = stmt.all(orderFaktur || '', orderName) as any[];
    } else if (jenisBarang === 'Penjualan Barang') {
      // Find items from sales_reports table
      // We format kd_barang as 'faktur - nama_prd' and nama_barang as 'faktur - nama_prd' as requested
      const stmt = db.prepare(`
        SELECT 
          nama_prd as nama_barang,
          kd_barang,
          faktur,
          harga as harga,
          harga as harga_jual
        FROM sales_reports 
        WHERE (faktur = ? OR nama_prd = ?) AND nama_prd IS NOT NULL AND nama_prd != ''
        ORDER BY substr(tgl, 7, 4) ASC, substr(tgl, 4, 2) ASC, substr(tgl, 1, 2) ASC
      `);
      items = stmt.all(orderFaktur || '', orderName) as any[];
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
