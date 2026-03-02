import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderName = searchParams.get('order_name');
    const jenisBarang = searchParams.get('jenis_barang'); // 'Bahan Baku' | 'Barang Jadi'

    if (!orderName || !jenisBarang) {
      return NextResponse.json({ error: "order_name and jenis_barang are required" }, { status: 400 });
    }

    let items: any[] = [];
    
    // Use the appropriate table based on Jenis Barang
    if (jenisBarang === 'Bahan Baku') {
      // Find all unique items for this specific order from bahan_baku table
      const stmt = db.prepare(`
        SELECT DISTINCT nama_barang, hp as harga 
        FROM bahan_baku 
        WHERE nama_prd = ? AND nama_barang IS NOT NULL AND nama_barang != ''
        ORDER BY nama_barang ASC
      `);
      items = stmt.all(orderName) as any[];
      
    } else if (jenisBarang === 'Barang Jadi') {
      // Find all unique items for this specific order from barang_jadi table
      const stmt = db.prepare(`
        SELECT DISTINCT nama_barang, hp as harga 
        FROM barang_jadi 
        WHERE nama_prd = ? AND nama_barang IS NOT NULL AND nama_barang != ''
        ORDER BY nama_barang ASC
      `);
      items = stmt.all(orderName) as any[];
      
      // We also need to fetch "Harga Jual Digit" which comes from 'orders' table
      const orderStmt = db.prepare(`
        SELECT harga 
        FROM orders 
        WHERE nama_prd = ?
        LIMIT 1
      `);
      const orderData = orderStmt.get(orderName) as { harga: number } | undefined;
      const hargaJual = orderData?.harga || 0;
      
      // Inject the 'harga_jual' property so the frontend knows what to use when 'Harga Jual Digit' is selected
      items = items.map(item => ({
        ...item,
        harga_jual: hargaJual
      }));
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
