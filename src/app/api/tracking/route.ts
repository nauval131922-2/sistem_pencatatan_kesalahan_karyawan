import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fakturBom = searchParams.get("faktur");
    const targetFaktur = searchParams.get("target_faktur") || fakturBom;

    if (!targetFaktur) {
      return NextResponse.json({ error: "Faktur wajib diisi" }, { status: 400 });
    }

    // 1. Get BOM Details
    // Try find by direct faktur, then by faktur_prd (if targetFaktur is an OP number)
    const bomRes = await db.execute({
      sql: `SELECT * FROM bill_of_materials WHERE faktur = ? OR faktur_prd = ? OR raw_data LIKE ? LIMIT 1`,
      args: [targetFaktur, targetFaktur, `%${targetFaktur}%`]
    });

    let bom = null;
    if (bomRes.rows.length > 0) {
      bom = bomRes.rows[0];
    } else {
        // If BOM not found, but we have an OP, let's at least try to get the OP first
        // But the system is designed to start from BOM for full chain.
        // We'll proceed with bom=null and try other things if available.
    }

    // 2. Get SPH Out (linked via bom.faktur = sph_out.faktur_bom)
    let sphOut = null;
    if (bom?.faktur) {
      const sphRes = await db.execute({
        sql: `SELECT * FROM sph_out WHERE faktur_bom = ? LIMIT 1`,
        args: [bom.faktur]
      });
      if (sphRes.rows.length > 0) {
        sphOut = sphRes.rows[0] as any;
      }
    }

    // 4. Get Sales Order Details (linked via sph_out.faktur = sales_orders.faktur_sph)
    let salesOrder = null;
    if (sphOut?.faktur) {
      const soRes = await db.execute({
        sql: `SELECT * FROM sales_orders WHERE faktur_sph = ? LIMIT 1`,
        args: [sphOut.faktur]
      });
      if (soRes.rows.length > 0) {
        salesOrder = soRes.rows[0];
      }
    }

    // 5. Get Production Order Details (linked via sales_order.faktur = orders.faktur_so)
    let productionOrder = null;
    if (salesOrder?.faktur) {
      const prdRes = await db.execute({
        sql: `SELECT * FROM orders WHERE faktur_so = ? LIMIT 1`,
        args: [salesOrder.faktur]
      });
      if (prdRes.rows.length > 0) {
        productionOrder = prdRes.rows[0];
      }
    }

    // 7. Get Purchase Requests (linked via order_produksi.faktur = purchase_requests.faktur_prd)
    let purchaseRequests: any[] = [];
    if (productionOrder?.faktur) {
      const prRes = await db.execute({
        sql: `SELECT * FROM purchase_requests WHERE faktur_prd = ?`,
        args: [productionOrder.faktur]
      });
      purchaseRequests = prRes.rows;
    }

    // 7.5. Get SPPH Out (linked via order_produksi.faktur = spph_out.faktur_prd)
    let spphOutList: any[] = [];
    if (productionOrder?.faktur) {
      const spphRes = await db.execute({
        sql: `SELECT * FROM spph_out WHERE faktur_prd = ?`,
        args: [productionOrder.faktur]
      });
      spphOutList = spphRes.rows;
    }

    // 8. Get Delivery Details (Pengiriman)
    // Link via sales_reports.faktur_so = salesOrder.faktur
    // and then pengiriman.faktur = sales_reports.faktur
    let delivery: any[] = [];
    if (salesOrder?.faktur) {
      const dlRes = await db.execute({
        sql: `
          SELECT p.* 
          FROM pengiriman p
          JOIN sales_reports sr ON p.faktur = sr.faktur
          WHERE sr.faktur_so = ?
          GROUP BY p.faktur
        `,
        args: [salesOrder.faktur]
      });
      delivery = dlRes.rows;
    }

    // 9. Get SPH In (linked via order_produksi.faktur = sph_in.faktur_prd)
    let sphInList: any[] = [];
    if (productionOrder?.faktur) {
      const sphInRes = await db.execute({
        sql: `SELECT * FROM sph_in WHERE faktur_prd = ?`,
        args: [productionOrder.faktur]
      });
      sphInList = sphInRes.rows;
    }

    // 10. Get Purchase Orders (linked via order_produksi.faktur = purchase_orders.faktur_prd)
    let purchaseOrders: any[] = [];
    if (productionOrder?.faktur) {
      const poRes = await db.execute({
        sql: `SELECT * FROM purchase_orders WHERE faktur_prd = ?`,
        args: [productionOrder.faktur]
      });
      purchaseOrders = poRes.rows;
    }

    // 11. Get Penerimaan Pembelian (linked via order.faktur = penerimaan_pembelian.faktur_prd)
    let penerimaanPembelian: any[] = [];
    if (productionOrder?.faktur) {
      const pbRes = await db.execute({
        sql: `SELECT * FROM penerimaan_pembelian WHERE faktur_prd = ?`,
        args: [productionOrder.faktur]
      });
      penerimaanPembelian = pbRes.rows;
    }

    const parseRawData = (item: any) => {
      if (!item) return null;
      if (item.raw_data) {
        try { return JSON.parse(item.raw_data); } catch(e){}
      }
      return { ...item };
    };

    return NextResponse.json({
      success: true,
      data: {
        bom: parseRawData(bom),
        sphOut: parseRawData(sphOut),
        spphOut: spphOutList.map(spph => parseRawData(spph)),
        sphIn: sphInList.map(sph => parseRawData(sph)),
        purchaseOrders: purchaseOrders.map(po => parseRawData(po)),
        salesOrder: parseRawData(salesOrder),
        productionOrder: productionOrder ? parseRawData(productionOrder) : null,
        purchaseRequests: purchaseRequests.map(pr => parseRawData(pr)),
        delivery: delivery.map(d => parseRawData(d)),
        penerimaanPembelian: penerimaanPembelian.map(pb => parseRawData(pb))
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
