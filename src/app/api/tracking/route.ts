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

    // --- LEVEL 1: BOM (The root of the tracking) ---
    const bomRes = await db.execute({
      sql: `SELECT * FROM bill_of_materials WHERE faktur = ? OR faktur_prd = ? OR raw_data LIKE ? LIMIT 1`,
      args: [targetFaktur, targetFaktur, `%${targetFaktur}%`]
    });

    let bom = bomRes.rows[0] as any || null;

    // --- LEVEL 2: SPH Keluar & Sales Order Barang (Dependent on BOM) ---
    // These can be run in parallel
    let sphOut = null;
    let salesOrder = null;

    const [sphRes, soResByFaktur] = await Promise.all([
      bom?.faktur ? db.execute({
        sql: `SELECT * FROM sph_out WHERE json_extract(raw_data, '$.faktur_bom') = ? LIMIT 1`,
        args: [bom.faktur]
      }) : Promise.resolve({ rows: [] }),
      bom?.faktur_sph ? db.execute({
        sql: `SELECT * FROM sales_orders WHERE faktur_sph = ? LIMIT 1`,
        args: [bom.faktur_sph]
      }) : Promise.resolve({ rows: [] })
    ]);

    sphOut = sphRes.rows[0] as any || null;
    salesOrder = soResByFaktur.rows[0] as any || null;

    // If SO not found by faktur_sph, try by sphOut.faktur
    if (!salesOrder && sphOut?.faktur) {
      const soRes = await db.execute({
        sql: `SELECT * FROM sales_orders WHERE faktur_sph = ? LIMIT 1`,
        args: [sphOut.faktur]
      });
      salesOrder = soRes.rows[0] as any || null;
    }

    // --- LEVEL 3: Production Order & Reports (Dependent on BOM/SO) ---
    let productionOrder = null;
    let laporanPenjualanList: any[] = [];
    
    const fakturPrdSearch = bom?.faktur_prd || salesOrder?.faktur_prd;
    
    const [prdRes, lpRes] = await Promise.all([
      fakturPrdSearch ? db.execute({
        sql: `SELECT * FROM orders WHERE faktur = ? LIMIT 1`,
        args: [fakturPrdSearch]
      }) : Promise.resolve({ rows: [] }),
      salesOrder?.faktur ? db.execute({
        sql: `SELECT * FROM sales_reports WHERE faktur_so = ? OR kd_barang = ?`,
        args: [salesOrder.faktur, salesOrder.kd_barang]
      }) : Promise.resolve({ rows: [] })
    ]);

    productionOrder = prdRes.rows[0] as any || null;
    laporanPenjualanList = lpRes.rows;

    // Second try for Production Order if still not found
    if (!productionOrder && salesOrder?.faktur && bom?.faktur) {
      const fuzzyRes = await db.execute({
        sql: `SELECT * FROM orders WHERE json_extract(raw_data, '$.faktur_so') = ? AND json_extract(raw_data, '$.faktur_bom') = ? LIMIT 1`,
        args: [salesOrder.faktur, bom.faktur]
      });
      productionOrder = fuzzyRes.rows[0] as any || null;
    }

    // --- LEVEL 4: Sub-branches (Dependent on Production Order & Reports) ---
    // 1. Production Branch: PRs, Bahan Baku, Penerimaan Barang Hasil Produksi
    // 2. Sales Branch: Pengiriman, Pelunasan Piutang Penjualan
    const prdFaktur = productionOrder?.faktur;
    const lpFakturs = laporanPenjualanList.map(lp => lp.faktur).filter(Boolean);

    let purchaseRequests: any[] = [];
    let bahanBaku: any[] = [];
    let barangJadi: any[] = [];
    let pengiriman: any[] = [];
    let pelunasanPiutang: any[] = [];

    const [prRes, bbRes, bjRes, pgRes, ppRes] = await Promise.all([
      prdFaktur ? db.execute({
        sql: `SELECT * FROM purchase_requests WHERE faktur_prd = ? OR raw_data LIKE ?`,
        args: [prdFaktur, `%${prdFaktur}%`]
      }) : Promise.resolve({ rows: [] }),
      prdFaktur ? db.execute({
        sql: `SELECT * FROM bahan_baku WHERE faktur_prd = ?`,
        args: [prdFaktur]
      }) : Promise.resolve({ rows: [] }),
      prdFaktur ? db.execute({
        sql: `SELECT * FROM barang_jadi WHERE faktur_prd = ?`,
        args: [prdFaktur]
      }) : Promise.resolve({ rows: [] }),
      lpFakturs.length > 0 ? db.execute({
        sql: `SELECT * FROM pengiriman WHERE ${lpFakturs.map(() => `faktur LIKE ?`).join(" OR ")}`,
        args: lpFakturs.map(f => `%${f}%`)
      }) : Promise.resolve({ rows: [] }),
      lpFakturs.length > 0 ? db.execute({
        sql: `SELECT * FROM pelunasan_piutang WHERE fkt IN (${lpFakturs.map(() => '?').join(',')})`,
        args: lpFakturs
      }) : Promise.resolve({ rows: [] })
    ]);

    purchaseRequests = prRes.rows;
    bahanBaku = bbRes.rows;
    barangJadi = bjRes.rows;
    pengiriman = pgRes.rows;
    pelunasanPiutang = ppRes.rows;

    // --- LEVEL 5: SPPH (Dependent on PRs) ---
    let spphOutList: any[] = [];
    const prFakturs = purchaseRequests.map((pr: any) => pr.faktur).filter(Boolean);
    if (prFakturs.length > 0) {
      const spphRes = await db.execute({
        sql: `SELECT * FROM spph_out WHERE faktur_pr IN (${prFakturs.map(() => '?').join(',')})`,
        args: prFakturs
      });
      spphOutList = spphRes.rows;
    }

    // --- LEVEL 6: SPH In (Dependent on SPPH) ---
    let sphInList: any[] = [];
    const spphFakturs = spphOutList.map((spph: any) => spph.faktur).filter(Boolean);
    if (spphFakturs.length > 0) {
      const sphInRes = await db.execute({
        sql: `SELECT * FROM sph_in WHERE faktur_spph IN (${spphFakturs.map(() => '?').join(',')})`,
        args: spphFakturs
      });
      sphInList = sphInRes.rows;
    }

    // --- LEVEL 7: Purchase Orders (Dependent on SPH In) ---
    let purchaseOrders: any[] = [];
    const sphFakturs = sphInList.map((sph: any) => sph.faktur).filter(Boolean);
    if (sphFakturs.length > 0) {
      const poRes = await db.execute({
        sql: `SELECT * FROM purchase_orders WHERE faktur_sph IN (${sphFakturs.map(() => '?').join(',')})`,
        args: sphFakturs
      });
      purchaseOrders = poRes.rows;
    }

    // --- LEVEL 8: Penerimaan & Rekap Pembelian (Dependent on POs) ---
    let penerimaanPembelian: any[] = [];
    let pembelianBarang: any[] = [];
    const poFakturs = purchaseOrders.map((po: any) => po.faktur).filter(Boolean);
    if (poFakturs.length > 0) {
      const poPlaceholders = poFakturs.map(() => '?').join(',');
      const [pbRes1, pbRes2] = await Promise.all([
        db.execute({
          sql: `SELECT * FROM penerimaan_pembelian WHERE faktur_po IN (${poPlaceholders})`,
          args: poFakturs
        }),
        db.execute({
          sql: `SELECT * FROM rekap_pembelian_barang WHERE faktur_po IN (${poPlaceholders})`,
          args: poFakturs
        })
      ]);
      penerimaanPembelian = pbRes1.rows;
      pembelianBarang = pbRes2.rows;
    }

    // --- LEVEL 9: Pelunasan Hutang (Dependent on Pembelian Barang) ---
    let pelunasanHutang: any[] = [];
    const pbFakturs = pembelianBarang.map((pb: any) => pb.faktur).filter(Boolean);
    if (pbFakturs.length > 0) {
      const phRes = await db.execute({
        sql: `SELECT * FROM pelunasan_hutang WHERE faktur_pb IN (${pbFakturs.map(() => '?').join(',')})`,
        args: pbFakturs
      });
      pelunasanHutang = phRes.rows;
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
        laporanPenjualan: laporanPenjualanList.map(lp => parseRawData(lp)),
        pengiriman: pengiriman.map(pg => parseRawData(pg)),
        pelunasanPiutang: pelunasanPiutang.map(pp => parseRawData(pp))
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
