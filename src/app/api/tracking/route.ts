import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fakturBom = searchParams.get("faktur");

    if (!fakturBom) {
      return NextResponse.json({ error: "Faktur BOM wajib diisi" }, { status: 400 });
    }

    // 1. Get BOM Details
    const bomRes = await db.execute({
      sql: `SELECT * FROM bill_of_materials WHERE faktur = ?`,
      args: [fakturBom]
    });

    if (bomRes.rows.length === 0) {
      return NextResponse.json({ error: "Data BOM tidak ditemukan" }, { status: 404 });
    }

    const bom = bomRes.rows[0];
    const fakturSph = bom.faktur_sph;

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
    if (!sphOut) {
      const sphFallbackRes = await db.execute({
        sql: `SELECT * FROM sph_out WHERE (barang LIKE ? OR raw_data LIKE ?) LIMIT 1`,
        args: [`%${fakturBom}%`, `%${fakturBom}%`]
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
    let productionStatus = "DALAM PROSES"; // Default
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

    // 6. Check Completion Data (from barang_jadi table)
    let completionData = null;
    if (productionOrder?.faktur) {
      const finishRes = await db.execute({
        sql: `SELECT * FROM barang_jadi WHERE faktur_prd = ? OR faktur = ? LIMIT 1`,
        args: [productionOrder.faktur, productionOrder.faktur]
      });
      if (finishRes.rows.length > 0) {
        productionStatus = "SELESAI";
        completionData = finishRes.rows[0];
      }
    }

    // 7. Get Purchase Requests (PRs) linked to this Production Order
    let purchaseRequests: any[] = [];
    if (productionOrder?.faktur) {
      const prRes = await db.execute({
        sql: `SELECT faktur, tgl, status, keterangan FROM purchase_requests WHERE faktur_prd = ?`,
        args: [productionOrder.faktur]
      });
      purchaseRequests = prRes.rows;
    }

    const processRaw = (item: any) => {
      if (!item) return null;
      let parsed = {};
      if (item.raw_data) {
        try { parsed = JSON.parse(item.raw_data); } catch(e){}
      }
      return { ...parsed, ...item };
    };

    return NextResponse.json({
      success: true,
      data: {
        bom: processRaw(bom),
        sphOut: processRaw(sphOut),
        salesOrder: processRaw(salesOrder),
        productionOrder: productionOrder ? { 
           ...(completionData ? processRaw(completionData) : {}),
           ...processRaw(productionOrder), 
           status: productionStatus 
        } : null,
        purchaseRequests: purchaseRequests.map(pr => processRaw(pr))
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
