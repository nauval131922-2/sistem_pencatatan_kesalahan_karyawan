// ponytail: kalkulator dan master parameter brosur 2026 (04. Pricelist Brosur 2026)
// Referensi: Pricelist BROSUR 2026.xlsm sheet HARGA JULI 2026 + Source/*.xlsm sheet BUKU

export interface BrosurMasterParams {
  // A. Bahan Kertas Art Paper
  tarifArtPaperKg: number;    // Master!D12 default 16.900
  upKertasPct: number;        // Master!E12 default 5%

  // B. Cetak Print Inter (digital inkjet A3+)
  tarifPrintInter1Muka: number; // Rp 1.800 per lembar A3+
  tarifPrintInter2Muka: number; // Rp 3.300 per lembar A3+

  // C. Cetak Oliver (offset)
  tarifPlatOliver: number;    // BUKU!Z6 default Rp 45.000 per plat
  jumlahPlatOliver: number;   // BUKU!Z2 default 4 plat (4 warna)
  minOrderOliver: number;     // BUKU!AB6 default Rp 90.000 per plat/min
  tarifDrekOliver: number;    // BUKU!AC6 default Rp 40 per drek/warna

  // D. Finishing per order
  tarifSisirMin: number;      // BUKU!AM6 default Rp 10.000 (min ≤500)
  tarifSisirPer1000: number;  // Rp 10.000 per 1000 pcs
  tarifKardus: number;        // BUKU!AW6 default Rp 8.500 per box
  tarifLakbanRoll: number;    // Master!D21 default Rp 8.000

  // E. Laminasi per lembar A3+ (Rp per lembar) – opsional
  tarifLaminasiGlossy: number;  // Rp 0.35 per cm² → dikonversi ke per lbr di simulator
  tarifLaminasiDoff: number;    // Rp 0.4 per cm²
  tarifUvVarnish: number;       // Rp 0.12 per cm²

  // F. Desain & lain-lain
  tarifDesainBrosur: number;  // Master!D17 default Rp 20.000

  // G. Margin & nego default
  marginDefaultPct: number;   // default 30%
  negoDefaultPct: number;     // default 4%
}

export const DEFAULT_BROSUR_PARAMS: BrosurMasterParams = {
  tarifArtPaperKg: 16900,
  upKertasPct: 5,

  tarifPrintInter1Muka: 2000, // Master!D18 file Source: Rp 2.000 / lbr A3+
  tarifPrintInter2Muka: 3300,

  tarifPlatOliver: 45000,
  jumlahPlatOliver: 4,
  minOrderOliver: 90000,
  tarifDrekOliver: 40,

  tarifSisirMin: 10000,
  tarifSisirPer1000: 10000,
  tarifKardus: 8500,
  tarifLakbanRoll: 8000,

  tarifLaminasiGlossy: 0.35,
  tarifLaminasiDoff: 0.40,
  tarifUvVarnish: 0.12,

  tarifDesainBrosur: 20000,

  marginDefaultPct: 30,
  negoDefaultPct: 4,
};

export type BrosurGramaturType = 'Art Paper 120 gsm' | 'Art Paper 150 gsm';

export type BrosurUkuranType =
  | '10,5 x 21'
  | '14,5 x 21'
  | '21 x 29,7'
  | '21,5 x 33'
  | '29,7 x 42';

export type BrosurMukaType = '1 Muka' | '2 Muka';
export type BrosurMesinType = 'Print Inter' | 'Oliver';
export type BrosurLaminasiType = 'Tanpa Laminasi' | 'Glossy' | 'Doff' | 'UV Varnish';

// Konfigurasi fisik per ukuran (lebar x tinggi cm, insheet, plano yg bisa dipotong)
const UKURAN_CONFIG: Record<BrosurUkuranType, {
  w: number; h: number;
  insheetPrint: number;   // berapa brosur per lembar A3+
  muatPlano: number;      // berapa brosur per plano cetak Oliver
  potongPlano: number;    // 1 plano jadi berapa potong
  insheetPlat: number;    // insheet lembar plat
  planoL: number;         // panjang plano Oliver (cm)
  planoP: number;         // lebar plano Oliver (cm)
}> = {
  // Di Excel master Oliver (sheet BUKU):
  // 10,5 x 21: plano 79x109, muatPlano = 30, potong = 5, insheetPlat = 100
  // 14,5 x 21: plano 65x90,  muatPlano = 16, potong = 4, insheetPlat = 150
  // 21 x 29,7: plano 65x90,  muatPlano = 8,  potong = 4, insheetPlat = 150
  // 21,5 x 33: plano 79x109, muatPlano = 10, potong = 5, insheetPlat = 100
  // 29,7 x 42: plano 65x90,  muatPlano = 4,  potong = 4, insheetPlat = 100
  '10,5 x 21':  { w: 10.5, h: 21,   insheetPrint: 6, muatPlano: 30, potongPlano: 5, insheetPlat: 100, planoL: 79, planoP: 109 },
  '14,5 x 21':  { w: 14.5, h: 21,   insheetPrint: 4, muatPlano: 16, potongPlano: 4, insheetPlat: 150, planoL: 65, planoP: 90 },
  '21 x 29,7':  { w: 21,   h: 29.7, insheetPrint: 2, muatPlano: 8,  potongPlano: 4, insheetPlat: 150, planoL: 65, planoP: 90 },
  '21,5 x 33':  { w: 21.5, h: 33,   insheetPrint: 1, muatPlano: 10, potongPlano: 5, insheetPlat: 100, planoL: 79, planoP: 109 },
  '29,7 x 42':  { w: 29.7, h: 42,   insheetPrint: 1, muatPlano: 4,  potongPlano: 4, insheetPlat: 100, planoL: 65, planoP: 90 },
};
// Gramatur Art Paper: berat per plano = gramatur × (planoL/100 × planoP/100) / 1000 kg
function beratPlanoKg(planoL: number, planoP: number, gramatur = 120): number {
  return gramatur * (planoL / 100) * (planoP / 100) / 1000;
}

// Harga per plano (harga kertas dgn up)
function hargaPlanoRupiah(p: BrosurMasterParams, planoL: number, planoP: number, gramatur = 120): number {
  const berat = beratPlanoKg(planoL, planoP, gramatur);
  return berat * p.tarifArtPaperKg * (1 + p.upKertasPct / 100);
}

export interface BrosurBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface BrosurSimulatorResult {
  input: BrosurSimulatorInput;
  breakdown: BrosurBreakdownItem[];
  totalHpp: number;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  hargaNegoPerPcs: number;
  totalHargaJual: number;
  totalHargaNego: number;
  profitPerPcs: number;
  profitNegoPerPcs: number;
  profitTotal: number;
  profitNegoTotal: number;
  marginPct: number;
  marginNegoPct: number;
}

export interface BrosurSimulatorInput {
  oplah: number;
  gramatur?: BrosurGramaturType;
  ukuran: BrosurUkuranType;
  muka: BrosurMukaType;
  mesin: BrosurMesinType;
  laminasi: BrosurLaminasiType;
  opsiSisir: boolean;
  opsiPacking: boolean;
  marginPct: number;
  negoDiskonPct: number;
}

export function calculateBrosurSimulator(
  input: BrosurSimulatorInput,
  rawParams: BrosurMasterParams = DEFAULT_BROSUR_PARAMS
): BrosurSimulatorResult {
  const p: BrosurMasterParams = { ...DEFAULT_BROSUR_PARAMS, ...(rawParams || {}) };
  const { oplah, gramatur = 'Art Paper 120 gsm', ukuran, muka, mesin, laminasi, opsiSisir, marginPct, negoDiskonPct } = input;
  const cfg = UKURAN_CONFIG[ukuran];
  const is2Muka = muka === '2 Muka';
  const isOliver = mesin === 'Oliver';
  const gramaturNum = gramatur === 'Art Paper 150 gsm' ? 150 : 120;
  const breakdown: BrosurBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    const pct = 0; // computed setelah totalHpp diketahui
    breakdown.push({ nama, nominal: Math.round(nominal), pct, keterangan });
    totalHpp += nominal;
  };

  // 1. Biaya Kertas
  if (isOliver) {
    // Oliver: Kebutuhan plano sesuai Excel cell R = ROUNDUP((oplah / muatPlano) + (insheetPlat / potongPlano), 0)
    const planoPerOrder = Math.ceil((oplah / cfg.muatPlano) + (cfg.insheetPlat / cfg.potongPlano));
    const hargaPlano = hargaPlanoRupiah(p, cfg.planoL, cfg.planoP, gramaturNum);
    const biayaKertas = planoPerOrder * hargaPlano;
    add(`Kertas ${gramatur}`, biayaKertas,
      `${planoPerOrder} plano × Rp ${Math.round(hargaPlano).toLocaleString('id-ID')} (${cfg.planoL}×${cfg.planoP}cm, +${p.upKertasPct}%)`);
  } else {
    // Print Inter: hitung kebutuhan lembar A3+ (di Excel cell R: ROUNDUP((oplah / muat) + 5 insheet, 0))
    const insheetA3 = 5;
    const lbrPerOrder = Math.ceil((oplah / cfg.insheetPrint) + insheetA3);
    const tarifPrint = is2Muka ? p.tarifPrintInter2Muka : p.tarifPrintInter1Muka;
    const biayaPrint = lbrPerOrder * tarifPrint;
    add('Biaya Cetak Print Inter', biayaPrint,
      `${lbrPerOrder} lbr A3+ × Rp ${tarifPrint.toLocaleString('id-ID')}/${is2Muka ? '2 muka' : '1 muka'} (inkl. ${insheetA3} insheet)`);
  }

  // 2. Biaya Cetak Oliver (hanya jika mesin = Oliver)
  if (isOliver) {
    const jmlPlat = p.jumlahPlatOliver * (is2Muka ? 2 : 1);
    const biayaPlat = jmlPlat * p.tarifPlatOliver;
    add('Plate CTP Oliver', biayaPlat, `${jmlPlat} plat × Rp ${p.tarifPlatOliver.toLocaleString('id-ID')}`);

    // Ongkos cetak: Di Excel cell AD = jmlPlat * Rp 90.000 (untuk oplah s/d 3.000 = 600 drek plat)
    // Drek plat = (planoPerOrder * potongPlano * muka)
    const planoPerOrder = Math.ceil((oplah / cfg.muatPlano) + (cfg.insheetPlat / cfg.potongPlano));
    const totalDrekPlat = planoPerOrder * cfg.potongPlano * (is2Muka ? 2 : 1);
    const drekOverPerPlat = Math.max(0, totalDrekPlat - 1000);
    const ongkosCetakPerPlat = p.minOrderOliver + (drekOverPerPlat * p.tarifDrekOliver);
    const ongkosCetak = ongkosCetakPerPlat * jmlPlat;
    add('Ongkos Cetak Oliver', ongkosCetak,
      `${jmlPlat} plat × Rp ${ongkosCetakPerPlat.toLocaleString('id-ID')}`);
  }

  // 3. Desain
  if (p.tarifDesainBrosur > 0) {
    add('Desain', p.tarifDesainBrosur, 'Biaya desain artwork');
  }

  // 4. Laminasi (opsional)
  if (laminasi !== 'Tanpa Laminasi') {
    const areaCm2 = cfg.w * cfg.h * oplah;
    let tarifPerCm2 = 0;
    if (laminasi === 'Glossy') tarifPerCm2 = p.tarifLaminasiGlossy;
    else if (laminasi === 'Doff') tarifPerCm2 = p.tarifLaminasiDoff;
    else if (laminasi === 'UV Varnish') tarifPerCm2 = p.tarifUvVarnish;
    const biayaLaminasi = areaCm2 * tarifPerCm2 * (is2Muka ? 2 : 1);
    add(`Laminasi ${laminasi}`, biayaLaminasi,
      `${oplah} pcs × ${cfg.w}×${cfg.h}cm × Rp ${tarifPerCm2}/cm²`);
  }

  // 5. Sisir (potong)
  // Di Excel master cell AM: =IF((oplah/500)*AM6 < 10000, 10000, (oplah/500)*AM6) di mana AM6 = Rp 10.000
  if (opsiSisir) {
    const tarifSisirPer500 = 10000;
    const biayaSisir = Math.max(10000, Math.ceil(oplah / 500) * tarifSisirPer500);
    add('Sisir / Potong', biayaSisir, `${oplah} pcs (potong rapi)`);
  }
  // 6. Kardus & Packing (Di Excel file Source cell BA9 default 0 kecuali opsi kardus dicentang khusus)
  // Recompute pct
  breakdown.forEach(b => { b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0; });

  const hppPerPcs = totalHpp / oplah;
  // Di Excel cell BI: =ROUNDUP(BH, -1) (pembulatan ke kelipatan 10 terdekat)
  const rawHargaJual = hppPerPcs * (1 + marginPct / 100);
  const hargaJualPerPcs = Math.ceil(rawHargaJual / 10) * 10;
  const hargaNegoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 10) * 10;
  const totalHargaJual = hargaJualPerPcs * oplah;
  const totalHargaNego = hargaNegoPerPcs * oplah;
  const profitPerPcs = hargaJualPerPcs - hppPerPcs;
  const profitNegoPerPcs = hargaNegoPerPcs - hppPerPcs;
  const profitTotal = profitPerPcs * oplah;
  const profitNegoTotal = profitNegoPerPcs * oplah;
  const marginPctActual = hargaJualPerPcs > 0 ? profitPerPcs / hargaJualPerPcs : 0;
  const marginNegoPct = hargaNegoPerPcs > 0 ? profitNegoPerPcs / hargaNegoPerPcs : 0;

  return {
    input,
    breakdown,
    totalHpp,
    hppPerPcs,
    hargaJualPerPcs,
    hargaNegoPerPcs,
    totalHargaJual,
    totalHargaNego,
    profitPerPcs,
    profitNegoPerPcs,
    profitTotal,
    profitNegoTotal,
    marginPct: marginPctActual,
    marginNegoPct,
  };
}

export type SavedBrosurSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: BrosurSimulatorResult;
  paramsSnapshot?: any;
};
