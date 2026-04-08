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
    
    // 2. Get SPH Details (linked via bom.faktur = sph out.faktur_bom)
    if (bom?.faktur) {
      const sphRes = await db.execute({
        sql: `SELECT * FROM sph_out WHERE json_extract(raw_data, '$.faktur_bom') = ? LIMIT 1`,
        args: [bom.faktur]
      });
      if (sphRes.rows.length > 0) {
        sphOut = sphRes.rows[0] as any;
      }
    }

    // 4. Get Sales Order Details (linked via sph out.faktur = sales order.faktur_sph)
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

    // Second try: Exact search by SO Number AND BOM Number in raw_data if still not found
    if (!productionOrder && salesOrder?.faktur && bom?.faktur) {
      const fuzzyRes = await db.execute({
        sql: `SELECT * FROM orders WHERE json_extract(raw_data, '$.faktur_so') = ? AND json_extract(raw_data, '$.faktur_bom') = ? LIMIT 1`,
        args: [salesOrder.faktur, bom.faktur]
      });
      if (fuzzyRes.rows.length > 0) {
        productionOrder = fuzzyRes.rows[0];
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

    // 8. (Pengiriman now fetched iteratively in Step 17 to handle HTML faktur tags)

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

    // 11. Get Penerimaan Pembelian (linked via purchase_orders.faktur = penerimaan_pembelian.faktur_po)
    let penerimaanPembelian: any[] = [];
    const poFakturs = purchaseOrders.map((po: any) => po.faktur).filter(Boolean);
    if (poFakturs.length > 0) {
      const placeholders = poFakturs.map(() => '?').join(',');
      const pbRes = await db.execute({
        sql: `SELECT * FROM penerimaan_pembelian WHERE faktur_po IN (${placeholders})`,
        args: poFakturs
      });
      penerimaanPembelian = pbRes.rows;
    }

    // 12. Get Pembelian Barang (linked via purchase_orders.faktur = rekap_pembelian_barang.faktur_po)
    let pembelianBarang: any[] = [];
    if (poFakturs.length > 0) {
      const placeholders = poFakturs.map(() => '?').join(',');
      const pbRes2 = await db.execute({
        sql: `SELECT * FROM rekap_pembelian_barang WHERE faktur_po IN (${placeholders})`,
        args: poFakturs
      });
      pembelianBarang = pbRes2.rows;
    }

    // 13. Get Pelunasan Hutang (linked via pembelian_barang.faktur = pelunasan_hutang.faktur_pb)
    let pelunasanHutang: any[] = [];
    const pbFakturs = pembelianBarang.map((pb: any) => pb.faktur).filter(Boolean);
    if (pbFakturs.length > 0) {
      const placeholders = pbFakturs.map(() => '?').join(',');
      const phRes = await db.execute({
        sql: `SELECT * FROM pelunasan_hutang WHERE faktur_pb IN (${placeholders})`,
        args: pbFakturs
      });
      pelunasanHutang = phRes.rows;
    }

    // 14. Get Bahan Baku (linked via productionOrder.faktur = bahan_baku.faktur_prd)
    let bahanBaku: any[] = [];
    if (productionOrder?.faktur) {
      const bbRes = await db.execute({
        sql: `SELECT * FROM bahan_baku WHERE faktur_prd = ?`,
        args: [productionOrder.faktur]
      });
      bahanBaku = bbRes.rows;
    }

    // 15. Get Barang Jadi (linked via productionOrder.faktur = barang_jadi.faktur_prd)
    let barangJadi: any[] = [];
    if (productionOrder?.faktur) {
      const bjRes = await db.execute({
        sql: `SELECT * FROM barang_jadi WHERE faktur_prd = ?`,
        args: [productionOrder.faktur]
      });
      barangJadi = bjRes.rows;
    }

    // 16. Get Laporan Penjualan (linked via salesOrder.faktur = sales_reports.faktur_so)
    let laporanPenjualan: any[] = [];
    if (salesOrder?.faktur) {
      const lpRes = await db.execute({
        sql: `SELECT * FROM sales_reports WHERE faktur_so = ? OR kd_barang = ?`,
        args: [salesOrder.faktur, salesOrder.kd_barang]
      });
      laporanPenjualan = lpRes.rows;
    }

    // 17. Get Pengiriman (linked via pengiriman.faktur containing laporanPenjualan.faktur)
    let pengiriman: any[] = [];
    const lpFakturs = laporanPenjualan.map(lp => lp.faktur).filter(Boolean);
    if (lpFakturs.length > 0) {
      const criteria = lpFakturs.map(() => `faktur LIKE ?`).join(" OR ");
      const args = lpFakturs.map(f => `%${f}%`);
      const pgRes = await db.execute({
        sql: `SELECT * FROM pengiriman WHERE ${criteria}`,
        args: args
      });
      pengiriman = pgRes.rows;
    }

    // 18. Get Pelunasan Piutang (linked via laporanPenjualan.faktur = pelunasan_piutang.fkt)
    let pelunasanPiutang: any[] = [];
    if (lpFakturs.length > 0) {
      const placeholders = lpFakturs.map(() => '?').join(',');
      const ppRes = await db.execute({
        sql: `SELECT * FROM pelunasan_piutang WHERE fkt IN (${placeholders})`,
        args: lpFakturs
      });
      pelunasanPiutang = ppRes.rows;
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
        penerimaanPembelian: penerimaanPembelian.map(pb => parseRawData(pb)),
        pembelianBarang: pembelianBarang.map(pb => parseRawData(pb)),
        pelunasanHutang: pelunasanHutang.map(ph => parseRawData(ph)),
        bahanBaku: bahanBaku.map(bb => parseRawData(bb)),
        barangJadi: barangJadi.map(bj => parseRawData(bj)),
        laporanPenjualan: laporanPenjualan.map(lp => parseRawData(lp)),
        pengiriman: pengiriman.map(pg => parseRawData(pg)),
        pelunasanPiutang: pelunasanPiutang.map(pp => parseRawData(pp))
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
