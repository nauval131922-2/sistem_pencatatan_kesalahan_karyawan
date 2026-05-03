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
    // We try to find the root BOM. If targetFaktur is not a BOM, we try to trace it back from rekap_pembelian_barang.
    let bomRes = await db.execute({
      sql: `SELECT * FROM bill_of_materials WHERE faktur = ? OR faktur_prd = ? OR raw_data LIKE ? LIMIT 1`,
      args: [targetFaktur, targetFaktur, `%${targetFaktur}%`]
    });

    let bom = bomRes.rows[0] as any || null;
    
    // Global flags to determine mode
    let isStartingFromRekap = false;
    let isStartingFromPO = false;

    let purchaseOrders: any[] = [];
    let pembelianBarang: any[] = [];
    let purchaseRequests: any[] = [];

    // If not found in BOM, check if it's a Rekap Pembelian record or a PO record and trace back
    let tracedPrdFakturs = new Set<string>();
    let tracedResultFakturs = new Set<string>();

    if (!bom) {
      // 1. Try Rekap Pembelian
      const rekapRes = await db.execute({
        sql: `SELECT * FROM rekap_pembelian_barang WHERE faktur = ? LIMIT 1`,
        args: [targetFaktur]
      });
      const rekap = rekapRes.rows[0] as any;

      if (rekap) {
        isStartingFromRekap = true;
        pembelianBarang = [rekap];
        
        // Trace Path 1: via Bahan Baku (Direct Usage)
        const bbUsageRes = await db.execute({
          sql: `SELECT DISTINCT faktur_prd, fkt_hasil FROM bahan_baku WHERE raw_data LIKE ?`,
          args: [`%${targetFaktur}%`]
        });
        bbUsageRes.rows.forEach((r: any) => {
          if (r.faktur_prd) tracedPrdFakturs.add(r.faktur_prd);
          if (r.fkt_hasil) tracedResultFakturs.add(r.fkt_hasil);
        });

        if (rekap.faktur_po) {
          const poRes = await db.execute({
            sql: `SELECT * FROM purchase_orders WHERE faktur = ? LIMIT 1`,
            args: [rekap.faktur_po]
          });
          const po = poRes.rows[0] as any;

          if (po) {
            purchaseOrders = [po];
            await traceFromPO(po);
          }
        }
      } else {
        // 2. Try Purchase Order
        const poRes = await db.execute({
          sql: `SELECT * FROM purchase_orders WHERE faktur = ? LIMIT 1`,
          args: [targetFaktur]
        });
        const po = poRes.rows[0] as any;

        if (po) {
          isStartingFromPO = true;
          purchaseOrders = [po];
          await traceFromPO(po);

          // Find PBs for this PO early to trace forward to usage
          const pbRes = await db.execute({
            sql: `SELECT * FROM rekap_pembelian_barang WHERE faktur_po = ?`,
            args: [po.faktur]
          });
          const foundPBs = pbRes.rows as any[];
          if (foundPBs.length > 0) {
            pembelianBarang = foundPBs;
            // Trace usage from these PBs
            for (const pb of foundPBs) {
               const usageRes = await db.execute({
                  sql: `SELECT DISTINCT faktur_prd, fkt_hasil FROM bahan_baku WHERE raw_data LIKE ?`,
                  args: [`%${pb.faktur}%`]
               });
               usageRes.rows.forEach((r: any) => {
                  if (r.faktur_prd) tracedPrdFakturs.add(r.faktur_prd);
                  if (r.fkt_hasil) tracedResultFakturs.add(r.fkt_hasil);
               });
            }
          }
        }
      }
    }

    // Helper function to trace flow from a PO record
    async function traceFromPO(po: any) {
      if (!po) return;

      if (po.faktur_sph) {
        const sphInRes = await db.execute({
          sql: `SELECT * FROM sph_in WHERE faktur = ? LIMIT 1`,
          args: [po.faktur_sph]
        });
        const sphIn = sphInRes.rows[0] as any;

        if (sphIn?.faktur_spph) {
          const spphRes = await db.execute({
            sql: `SELECT * FROM spph_out WHERE faktur = ? LIMIT 1`,
            args: [sphIn.faktur_spph]
          });
          const spph = spphRes.rows[0] as any;
          const prFaktur = spph?.faktur_pr;

          if (prFaktur) {
            const prRes = await db.execute({
              sql: `SELECT * FROM purchase_requests WHERE faktur = ? LIMIT 1`,
              args: [prFaktur]
            });
            const pr = prRes.rows[0] as any;
            if (pr) {
              purchaseRequests = [pr];
              if (pr.faktur_prd) tracedPrdFakturs.add(pr.faktur_prd);

              const prdFaktur = pr.faktur_prd;
              if (prdFaktur) {
                const bomFromPrd = await db.execute({
                  sql: `SELECT * FROM bill_of_materials WHERE faktur_prd = ? LIMIT 1`,
                  args: [prdFaktur]
                });
                if (bomFromPrd.rows[0]) {
                  bom = bomFromPrd.rows[0] as any;
                }
              }
            }
          }
        }
      }
    }

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
    let productionOrders: any[] = [];
    let laporanPenjualanList: any[] = [];
    
    // Determine all possible PRD Fakturs to search
    const prdFaktursToSearch = new Set<string>();
    if (bom?.faktur_prd) prdFaktursToSearch.add(bom.faktur_prd);
    if (salesOrder?.faktur_prd) prdFaktursToSearch.add(salesOrder.faktur_prd);
    tracedPrdFakturs.forEach(f => prdFaktursToSearch.add(f));

    const fakturPrdArray = Array.from(prdFaktursToSearch);
    
    const [prdRes, lpRes] = await Promise.all([
      fakturPrdArray.length > 0 ? db.execute({
        sql: `SELECT * FROM orders WHERE faktur IN (${fakturPrdArray.map(() => '?').join(',')})`,
        args: fakturPrdArray
      }) : Promise.resolve({ rows: [] }),
      salesOrder?.faktur ? db.execute({
        sql: `SELECT * FROM sales_reports WHERE faktur_so = ? OR kd_barang = ?`,
        args: [salesOrder.faktur, salesOrder.kd_barang]
      }) : Promise.resolve({ rows: [] })
    ]);

    productionOrders = prdRes.rows;
    laporanPenjualanList = lpRes.rows;

    // Second try for Production Orders if still empty and we have SO/BOM
    if (productionOrders.length === 0 && salesOrder?.faktur && bom?.faktur) {
      const fuzzyRes = await db.execute({
        sql: `SELECT * FROM orders WHERE json_extract(raw_data, '$.faktur_so') = ? AND json_extract(raw_data, '$.faktur_bom') = ?`,
        args: [salesOrder.faktur, bom.faktur]
      });
      productionOrders = fuzzyRes.rows;
    }

    // Third try: via BOM Faktur (Fallback if SO link fails or SO is missing)
    if (productionOrders.length === 0 && bom?.faktur) {
      const bomResOnly = await db.execute({
        sql: `SELECT * FROM orders WHERE json_extract(raw_data, '$.faktur_bom') = ?`,
        args: [bom.faktur]
      });
      productionOrders = bomResOnly.rows;
    }

    // --- LEVEL 4: Sub-branches (Dependent on Production Order & Reports) ---
    // 1. Production Branch: PRs, Bahan Baku, Penerimaan Barang Hasil Produksi
    // 2. Sales Branch: Pengiriman, Pelunasan Piutang Penjualan
    const prdFaktursForSub = Array.from(prdFaktursToSearch);
    const lpFakturs = laporanPenjualanList.map(lp => lp.faktur).filter(Boolean);

    let bahanBaku: any[] = [];
    let barangJadi: any[] = [];
    let pengiriman: any[] = [];
    let pelunasanPiutang: any[] = [];

    const dateSort = `ORDER BY substr(tgl,7,4) ASC, substr(tgl,4,2) ASC, substr(tgl,1,2) ASC, faktur ASC`;

    const [prRes, bbRes, bjRes, pgRes, ppRes] = await Promise.all([
      prdFaktursForSub.length > 0 ? db.execute({
        sql: `SELECT * FROM purchase_requests WHERE (faktur_prd IN (${prdFaktursForSub.map(() => '?').join(',')}) OR ${prdFaktursForSub.map(() => `raw_data LIKE ?`).join(" OR ")}) ${dateSort}`,
        args: [...prdFaktursForSub, ...prdFaktursForSub.map(f => `%${f}%`)]
      }) : Promise.resolve({ rows: [] }),
      (prdFaktursForSub.length > 0 || isStartingFromPO) ? db.execute({
        sql: `SELECT * FROM bahan_baku WHERE (faktur_prd IN (${prdFaktursForSub.map(() => '?').join(',')}) OR raw_data LIKE ? OR raw_data LIKE ?) ${dateSort}`,
        args: [...prdFaktursForSub, `%${targetFaktur}%`, ...purchaseOrders.map(p => `%${p.faktur}%`)]
      }) : (targetFaktur.startsWith('PB') || targetFaktur.startsWith('RQ') ? db.execute({
        sql: `SELECT * FROM bahan_baku WHERE raw_data LIKE ? ${dateSort}`,
        args: [`%${targetFaktur}%`]
      }) : Promise.resolve({ rows: [] })),
      (() => {
        const conditions = [
          (!isStartingFromRekap && prdFaktursForSub.length > 0) ? `faktur_prd IN (${prdFaktursForSub.map(() => '?').join(',')})` : '',
          (tracedResultFakturs.size > 0) ? `faktur IN (${Array.from(tracedResultFakturs).map(() => '?').join(',')})` : '',
          (isStartingFromPO) ? `raw_data LIKE ?` : ''
        ].filter(Boolean);

        if (conditions.length === 0) return Promise.resolve({ rows: [] });

        const args = [
          ...(!isStartingFromRekap && prdFaktursForSub.length > 0 ? prdFaktursForSub : []),
          ...(tracedResultFakturs.size > 0 ? Array.from(tracedResultFakturs) : []),
          ...(isStartingFromPO ? [`%${targetFaktur}%`] : [])
        ];

        return db.execute({
          sql: `SELECT * FROM barang_jadi WHERE (${conditions.join(' OR ')}) ${dateSort}`,
          args: args
        });
      })(),
      lpFakturs.length > 0 ? db.execute({
        sql: `SELECT * FROM pengiriman WHERE (${lpFakturs.map(() => `faktur LIKE ?`).join(" OR ")}) ${dateSort}`,
        args: lpFakturs.map(f => `%${f}%`)
      }) : Promise.resolve({ rows: [] }),
      lpFakturs.length > 0 ? db.execute({
        sql: `SELECT * FROM pelunasan_piutang WHERE fkt IN (${lpFakturs.map(() => '?').join(',')}) ORDER BY substr(tgl,7,4) ASC, substr(tgl,4,2) ASC, substr(tgl,1,2) ASC, fkt ASC`,
        args: lpFakturs
      }) : Promise.resolve({ rows: [] })
    ]);

    const dedupe = (arr: any[], key: string = 'id') => {
      const seen = new Set();
      return arr.filter(item => {
        const val = item[key];
        if (!val || seen.has(val)) return false;
        seen.add(val);
        return true;
      });
    };

    const sortData = (arr: any[], dateKey: string = 'tgl', fakturKey: string = 'faktur') => {
      return [...arr].sort((a, b) => {
        const parseDate = (dStr: string) => {
          if (!dStr || typeof dStr !== 'string') return 0;
          const parts = dStr.split('-');
          if (parts.length !== 3) return 0;
          const [d, m, y] = parts.map(Number);
          return y * 10000 + m * 100 + d;
        };
        
        const timeA = parseDate(a[dateKey]);
        const timeB = parseDate(b[dateKey]);
        
        if (timeA !== timeB) return timeA - timeB;
        
        const fA = String(a[fakturKey] || '');
        const fB = String(b[fakturKey] || '');
        return fA.localeCompare(fB);
      });
    };

    purchaseRequests = dedupe([...purchaseRequests, ...prRes.rows]);
    
    // Filter bahanBaku based on mode
    if (isStartingFromRekap || isStartingFromPO) {
      // Collect all related PB fakturs if starting from PO
      const relatedPBFakturs = isStartingFromPO ? pembelianBarang.map(pb => pb.faktur) : [targetFaktur];
      
      // Strictly only show BBB that actually used these specific PB fakturs or the PO itself
      bahanBaku = dedupe(bbRes.rows.filter((r: any) => {
        const content = (String(r.hp_detil || "") + String(r.raw_data || "")).toLowerCase();
        const matchesPB = relatedPBFakturs.some(f => content.includes(String(f).toLowerCase()));
        const matchesPO = isStartingFromPO && content.includes(targetFaktur.toLowerCase());
        return matchesPB || matchesPO;
      }));
    } else {
      bahanBaku = dedupe(bbRes.rows);
    }
    
    barangJadi = dedupe(bjRes.rows);
    pengiriman = dedupe(pgRes.rows);
    pelunasanPiutang = dedupe(ppRes.rows);

    // --- LEVEL 5: SPPH (Dependent on PRs) ---
    let spphOutList: any[] = [];
    const prFakturs = purchaseRequests.map((pr: any) => pr.faktur).filter(Boolean);
    
    // Extract SPPH fakturs directly from PRs and clean them from HTML tags
    const prSpphFakturs = purchaseRequests.map((pr: any) => {
      const raw = pr.faktur_spph || "";
      return raw.replace(/<[^>]*>?/gm, '').trim();
    }).filter(Boolean);

    if (prFakturs.length > 0 || prSpphFakturs.length > 0) {
      const conditions: string[] = [];
      const args: any[] = [];

      // Path A: Search in SPPH where faktur_pr contains the PR ID
      if (prFakturs.length > 0) {
        prFakturs.forEach(f => {
          conditions.push(`faktur_pr LIKE ?`);
          args.push(`%${f}%`);
        });
      }

      // Path B: Search in SPPH where faktur contains the cleaned SPPH ID from PR table
      if (prSpphFakturs.length > 0) {
        prSpphFakturs.forEach(f => {
          conditions.push(`faktur LIKE ?`);
          args.push(`%${f}%`);
        });
      }

      const spphRes = await db.execute({
        sql: `SELECT * FROM spph_out WHERE (${conditions.join(' OR ')}) ${dateSort}`,
        args: args
      });
      spphOutList = spphRes.rows;
    }

    // --- LEVEL 6: SPH In (Dependent on SPPH) ---
    let sphInList: any[] = [];
    const spphFakturs = spphOutList.map((spph: any) => spph.faktur).filter(Boolean);
    if (spphFakturs.length > 0) {
      const sphInRes = await db.execute({
        sql: `SELECT * FROM sph_in WHERE faktur_spph IN (${spphFakturs.map(() => '?').join(',')}) ${dateSort}`,
        args: spphFakturs
      });
      sphInList = sphInRes.rows;
    }

    // --- LEVEL 7: Purchase Orders (Dependent on SPH In) ---
    const sphFakturs = sphInList.map((sph: any) => sph.faktur).filter(Boolean);
    
    // Only append other POs from the flow if we are NOT starting from a specific Rekap or PO
    // This ensures the PO column strictly follows: user selection or specific flow
    if (sphFakturs.length > 0 && !isStartingFromRekap && !isStartingFromPO) {
      const poRes = await db.execute({
        sql: `SELECT * FROM purchase_orders WHERE faktur_sph IN (${sphFakturs.map(() => '?').join(',')}) ${dateSort}`,
        args: sphFakturs
      });
      purchaseOrders = dedupe([...purchaseOrders, ...poRes.rows]);
    }

    // --- LEVEL 8: Penerimaan & Rekap Pembelian (Dependent on POs) ---
    let penerimaanPembelian: any[] = [];
    const poFakturs = purchaseOrders.map((po: any) => po.faktur).filter(Boolean);
    if (poFakturs.length > 0) {
      const poPlaceholders = poFakturs.map(() => '?').join(',');
      const [pbRes1, pbRes2] = await Promise.all([
        db.execute({
          sql: `SELECT * FROM penerimaan_pembelian WHERE faktur_po IN (${poPlaceholders}) ${dateSort}`,
          args: poFakturs
        }),
        db.execute({
          sql: `SELECT * FROM rekap_pembelian_barang WHERE faktur_po IN (${poPlaceholders}) ${dateSort}`,
          args: poFakturs
        })
      ]);
      penerimaanPembelian = dedupe(pbRes1.rows);
      
      // Only append other PB records from the same PO if we are NOT starting from a specific Rekap
      // This keeps the starting column focused on the user's selection while still tracking the rest
      if (!isStartingFromRekap) {
        pembelianBarang = dedupe([...pembelianBarang, ...pbRes2.rows]);
      }
    }

    // --- LEVEL 9: Pelunasan Hutang (Dependent on Pembelian Barang) ---
    let pelunasanHutang: any[] = [];
    const pbFakturs = pembelianBarang.map((pb: any) => pb.faktur).filter(Boolean);
    if (pbFakturs.length > 0) {
      const phRes = await db.execute({
        sql: `SELECT * FROM pelunasan_hutang WHERE faktur_pb IN (${pbFakturs.map(() => '?').join(',')}) ${dateSort}`,
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
        spphOut: sortData(spphOutList).map(spph => parseRawData(spph)),
        sphIn: sortData(sphInList).map(sph => parseRawData(sph)),
        purchaseOrders: sortData(purchaseOrders).map(po => parseRawData(po)),
        salesOrder: parseRawData(salesOrder),
        productionOrders: sortData(productionOrders).map(prd => parseRawData(prd)),
        purchaseRequests: sortData(purchaseRequests).map(pr => parseRawData(pr)),
        penerimaanPembelian: sortData(penerimaanPembelian).map(pb => parseRawData(pb)),
        pembelianBarang: sortData(pembelianBarang).map(pb => parseRawData(pb)),
        pelunasanHutang: sortData(pelunasanHutang).map(ph => parseRawData(ph)),
        bahanBaku: sortData(bahanBaku).map(bb => parseRawData(bb)),
        barangJadi: sortData(barangJadi).map(bj => parseRawData(bj)),
        laporanPenjualan: sortData(laporanPenjualanList).map(lp => parseRawData(lp)),
        pengiriman: sortData(pengiriman).map(pg => parseRawData(pg)),
        pelunasanPiutang: sortData(pelunasanPiutang, 'tgl', 'fkt').map(pp => parseRawData(pp))
      },
      meta: {
        isStartingFromRekap,
        isStartingFromPO,
        isBomPath: !!bom && !isStartingFromRekap && !isStartingFromPO
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
