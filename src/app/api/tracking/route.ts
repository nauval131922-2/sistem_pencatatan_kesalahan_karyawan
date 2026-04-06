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
    const fakturSph = bom?.faktur_sph;

    let sphOut = null;
    
    // 2. Get SPH Details (Try by explicit faktur_sph first)
    if (fakturSph) {
      const sphRes = await db.execute({
        sql: `SELECT * FROM sph_out WHERE faktur = ?`,
        args: [fakturSph]
      });
      if (sphRes.rows.length > 0) {
        sphOut = sphRes.rows[0] as any;
      }
    }

    // 3. Fallback: Search SPH if not found yet (Sometimes link is not in BOM record directly)
    if (!sphOut && bom?.faktur) {
      const sphFallbackRes = await db.execute({
        sql: `SELECT * FROM sph_out WHERE (barang LIKE ? OR raw_data LIKE ?) LIMIT 1`,
        args: [`%${bom.faktur}%`, `%${bom.faktur}%`]
      });
      if (sphFallbackRes.rows.length > 0) {
        sphOut = sphFallbackRes.rows[0] as any;
      }
    }

    // 4. Get Sales Order Details (If SPH has a linked SO)
    let salesOrder = null;
    if (sphOut?.faktur_so) {
      const soRes = await db.execute({
        sql: `SELECT * FROM sales_orders WHERE faktur = ? LIMIT 1`,
        args: [sphOut.faktur_so]
      });
      if (soRes.rows.length > 0) {
        salesOrder = soRes.rows[0];
      }
    }

    // 5. Get Production Order Details
    let productionOrder = null;
    let fakturPrd = bom?.faktur_prd || salesOrder?.faktur_prd;
    
    // First try: Direct link via faktur_prd
    if (fakturPrd) {
      const prdRes = await db.execute({
        sql: `SELECT * FROM orders WHERE faktur = ? LIMIT 1`,
        args: [fakturPrd]
      });
      if (prdRes.rows.length > 0) {
        productionOrder = prdRes.rows[0];
      }
    }

    // Second try: Fuzzy search by SO Number or BOM Number in raw_data if still not found
    if (!productionOrder) {
      const criteria = [];
      const args = [];
      
      if (salesOrder?.faktur) {
        criteria.push("raw_data LIKE ?");
        args.push(`%${salesOrder.faktur}%`);
      }
      if (bom?.faktur) {
        criteria.push("raw_data LIKE ?");
        args.push(`%${bom.faktur}%`);
      }

      if (criteria.length > 0) {
        const fuzzyRes = await db.execute({
          sql: `SELECT * FROM orders WHERE ${criteria.join(" OR ")} ORDER BY tgl DESC LIMIT 1`,
          args: args
        });
        if (fuzzyRes.rows.length > 0) {
          productionOrder = fuzzyRes.rows[0];
        }
      }
    }

    // 7. Get Purchase Requests (PRs) linked to this Production Order
    let purchaseRequests: any[] = [];
    if (productionOrder?.faktur) {
      const prRes = await db.execute({
        sql: `SELECT * FROM purchase_requests WHERE faktur_prd = ? OR raw_data LIKE ?`,
        args: [productionOrder.faktur, `%${productionOrder.faktur}%`]
      });
      purchaseRequests = prRes.rows;
    }

    // 7.5. Get SPPH Out (linked via faktur_pr from PRs)
    let spphOutList: any[] = [];
    const prFakturs = purchaseRequests.map((pr: any) => pr.faktur).filter(Boolean);
    if (prFakturs.length > 0) {
      const placeholders = prFakturs.map(() => '?').join(',');
      const spphRes = await db.execute({
        sql: `SELECT * FROM spph_out WHERE faktur_pr IN (${placeholders})`,
        args: prFakturs
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

    // 9. Get SPH In (linked via faktur_spph from SPPH Out)
    let sphInList: any[] = [];
    const spphFakturs = spphOutList.map((spph: any) => spph.faktur).filter(Boolean);
    if (spphFakturs.length > 0) {
      const placeholders = spphFakturs.map(() => '?').join(',');
      const sphInRes = await db.execute({
        sql: `SELECT * FROM sph_in WHERE faktur_spph IN (${placeholders})`,
        args: spphFakturs
      });
      sphInList = sphInRes.rows;
    }

    // 10. Get Purchase Orders (linked via sph_in.faktur = purchase_orders.faktur_sph)
    let purchaseOrders: any[] = [];
    const sphFakturs = sphInList.map((sph: any) => sph.faktur).filter(Boolean);
    if (sphFakturs.length > 0) {
      const placeholders = sphFakturs.map(() => '?').join(',');
      const poRes = await db.execute({
        sql: `SELECT * FROM purchase_orders WHERE faktur_sph IN (${placeholders})`,
        args: sphFakturs
      });
      purchaseOrders = poRes.rows;
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
        delivery: delivery.map(d => parseRawData(d))
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
