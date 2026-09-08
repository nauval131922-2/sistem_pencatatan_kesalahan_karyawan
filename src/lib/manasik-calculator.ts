// ponytail: kalkulator dan master parameter buku manasik (01. Pricelist Buku Manasik)

export type ManasikVarianType =
  | 'Custom Cover 10 x 15,5'
  | 'Kosongan 10 x 15,5'
  | 'Mini TikTok 6,3 x 10,3';

export interface ManasikMasterParams {
  // 1. Bahan & Kertas Cover & Print POD
  tarifAc230Kg: number; // 16400 per kg
  tarifAc260Kg: number; // 16400 per kg
  tarifAc310Kg: number; // 33500 per kg (Mini TikTok)
  tarifPrintCoverA3: number; // 2700 per lembar A3+ (POD)
  tarifPrintMiniTikTokA3: number; // 2500 per lembar A3+
  insheetCover: number; // 5 lembar
  insheetOffsetCover: number; // 150 lembar

  // 2. Ongkos Cetak Cover Offset (Oliver)
  oliverMinOngkosCover: number; // 90000 (1000 lbr)
  oliverPlatUnitCover: number; // 45000 (ctp/plat)
  oliverDrekOverCover: number; // 40 per drek over
  tarifDesainCover: number; // 20000
  tarifDesainMiniTikTok: number; // 2500

  // 3. Blok Isi Manasik (Kosongan / Ready / Offset)
  hargaIsiKosongan96: number; // 1800
  hargaIsiKosongan128: number; // 2300
  hargaIsiKosongan192: number; // 3421 (standar 192 hal)
  hargaIsiKosongan208: number; // 3620 (standar 208/212 hal 2026)
  tarifKertasHvs70Kg: number; // 15700 per kg
  tarifPrintSisipanA3: number; // 350 per lbr A3+
  insheetSisipan: number; // 10

  // 4. Finishing & Jilid
  tarifBendingPerCm2: number; // 50 (min 100000)
  minBending: number; // 100000
  tarifLaminasiGlossyCm2: number; // 0.35 (min 50000)
  tarifLaminasiDoffCm2: number; // 0.40 (min 50000)
  tarifUvVarnishCm2: number; // 0.11 (min 50000)
  minLaminasi: number; // 50000

  tarifStaplesPalu: number; // 112.7434
  tarifIsiStaplesPack: number; // 24000 (isi staples 1213)
  tarifCasingIn: number; // 225.4868
  tarifSisir: number; // 150
  tarifLubangBor: number; // 225.4868
  tarifPasangTali: number; // 112.7434
  tarifTaliKurPerPcs: number; // 285.7143 (1 roll 16000 / 56 pcs)
  tarifSpiralManasik: number; // 1200
  tarifBiayaSisipLipat: number; // 225.4868

  // Mini TikTok Finishing Khusus
  tarifPisauPoundMini: number; // 299.30
  tarifJasaPoundMini: number; // 225.49
  tarifTaliCocardMini: number; // 2500
  tarifRingBinderMini: number; // 925
  tarifPlastikZiplockMini: number; // 465
  tarifSusunPasangRingMini: number; // 751.62
  tarifTransportMini: number; // 150000

  // 5. Packing & Kemasan
  tarifPlastikOppPack: number; // 9200 (isi 100) -> 92/pcs
  jasaPlastikOpp: number; // 225.4868
  tarifKardusBox: number; // 8500
  kapasitasKardusManasik: number; // 200 pcs / box
  kapasitasKardusMini: number; // 300 pcs / box
  tarifLakbanBox: number; // 8000
  marginDefaultPct: number; // 30%
  negoDefaultPct: number; // 4%
}

export const DEFAULT_MANASIK_PARAMS: ManasikMasterParams = {
  tarifAc230Kg: 16400,
  tarifAc260Kg: 16400,
  tarifAc310Kg: 33500,
  tarifPrintCoverA3: 2700,
  tarifPrintMiniTikTokA3: 2500,
  insheetCover: 5,
  insheetOffsetCover: 150,

  oliverMinOngkosCover: 90000,
  oliverPlatUnitCover: 45000,
  oliverDrekOverCover: 40,
  tarifDesainCover: 20000,
  tarifDesainMiniTikTok: 2500,

  hargaIsiKosongan96: 1800,
  hargaIsiKosongan128: 2300,
  hargaIsiKosongan192: 3421,
  hargaIsiKosongan208: 3620,
  tarifKertasHvs70Kg: 15700,
  tarifPrintSisipanA3: 350,
  insheetSisipan: 10,

  tarifBendingPerCm2: 50,
  minBending: 100000,
  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  tarifUvVarnishCm2: 0.11,
  minLaminasi: 50000,

  tarifStaplesPalu: 112.7434,
  tarifIsiStaplesPack: 24000,
  tarifCasingIn: 225.4868,
  tarifSisir: 150,
  tarifLubangBor: 225.4868,
  tarifPasangTali: 112.7434,
  tarifTaliKurPerPcs: 285.7143,
  tarifSpiralManasik: 1200,
  tarifBiayaSisipLipat: 225.4868,

  tarifPisauPoundMini: 299.30,
  tarifJasaPoundMini: 225.49,
  tarifTaliCocardMini: 2500,
  tarifRingBinderMini: 925,
  tarifPlastikZiplockMini: 465,
  tarifSusunPasangRingMini: 751.62,
  tarifTransportMini: 150000,

  tarifPlastikOppPack: 9200,
  jasaPlastikOpp: 225.4868,
  tarifKardusBox: 8500,
  kapasitasKardusManasik: 200,
  kapasitasKardusMini: 300,
  tarifLakbanBox: 8000,
  marginDefaultPct: 30,
  negoDefaultPct: 4,
};

export interface ManasikSimulatorInput {
  varian: ManasikVarianType;
  oplah: number;
  jumlahHalaman: 48 | 96 | 128 | 192 | 208 | 212 | 216;
  tipeJilid: 'Softcover (Bending/Lem Panas)' | 'Staples Kawat' | 'Tali Kur' | 'Spiral Kawat' | 'Ring Binder (TikTok)';
  metodeCetakCover: 'Otomatis' | 'Print Digital (A3+)' | 'Offset (Oliver)';
  laminasiCover: 'Tanpa Laminasi' | 'Glossy' | 'Doff' | 'UV Varnish';
  opsiPlastikOpp: boolean;
  opsiKardus: boolean;
  opsiSisipan?: boolean;
  marginPct: number; // Default 30%
  negoDiskonPct: number; // 0-100%
}

export interface ManasikBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface ManasikSimulatorOutput {
  input: ManasikSimulatorInput;
  metodeCoverTerpilih: 'Print Digital (A3+)' | 'Offset (Oliver)';
  tebalPunggungCm: number;
  breakdown: ManasikBreakdownItem[];
  kebutuhanPlanoCover: number;
  kebutuhanA3Cover: number;
  summary: {
    totalHpp: number;
    hppPerPcs: number;
    marginNominalPerPcs: number;
    totalHargaJual: number;
    hargaJualPerPcs: number;
    totalHargaNego: number;
    hargaNegoPerPcs: number;
    totalProfit: number;
    totalProfitNego: number;
  };
}

export const MANASIK_VARIAN_CONFIG = {
  'Custom Cover 10 x 15,5': {
    label: 'Custom Cover 10 x 15,5 cm',
    ukuran: '10 x 15,5 cm',
    widthCm: 10,
    heightCm: 15.5,
    defaultHal: 216 as const,
    defaultJilid: 'Tali Kur' as const,
    defaultCover: 'Art Carton 230 gsm',
    desc: 'Cover Full Colour Custom Nama/Biro + Sisipan 4 Hal + Isi Kosongan 212 Hal + Tali Kur + Plastik OPP',
  },
  'Kosongan 10 x 15,5': {
    label: 'Kosongan Ready 10 x 15,5 cm',
    ukuran: '10 x 15,5 cm',
    widthCm: 10,
    heightCm: 15.5,
    defaultHal: 212 as const,
    defaultJilid: 'Softcover (Bending/Lem Panas)' as const,
    defaultCover: 'Tanpa Cover',
    desc: 'Blok Isi Buku Manasik Kosongan Ready Stock (HVS 70 gsm, 1 Warna Offset, Susun + Lem Panas)',
  },
  'Mini TikTok 6,3 x 10,3': {
    label: 'Mini TikTok 6,3 x 10,3 cm',
    ukuran: '6,3 x 10,3 cm',
    widthCm: 6.3,
    heightCm: 10.3,
    defaultHal: 48 as const,
    defaultJilid: 'Ring Binder (TikTok)' as const,
    defaultCover: 'Art Carton 310 gsm',
    desc: 'Buku Saku Manasik Mini TikTok (Art Carton 310 gsm FC Bolak-balik + Ring Binder 3cm + Tali Cocard + Plastik Ziplock)',
  },
};

export function calculateManasikSimulator(
  input: ManasikSimulatorInput,
  rawParams: ManasikMasterParams = DEFAULT_MANASIK_PARAMS
): ManasikSimulatorOutput {
  const params: ManasikMasterParams = { ...DEFAULT_MANASIK_PARAMS, ...(rawParams || {}) };
  const {
    varian = 'Custom Cover 10 x 15,5',
    oplah,
    jumlahHalaman,
    tipeJilid,
    metodeCetakCover,
    laminasiCover,
    opsiPlastikOpp,
    opsiKardus,
    opsiSisipan = true,
    marginPct = params.marginDefaultPct,
    negoDiskonPct = params.negoDefaultPct,
  } = input;

  const validOplah = Math.max(1, oplah);
  const cfg = MANASIK_VARIAN_CONFIG[varian] || MANASIK_VARIAN_CONFIG['Custom Cover 10 x 15,5'];
  const widthCm = cfg.widthCm;
  const heightCm = cfg.heightCm;

  let metodeCover: 'Print Digital (A3+)' | 'Offset (Oliver)' = 'Print Digital (A3+)';
  let tebalPunggung = 0.5;
  let kebutuhanPlanoCover = 0;
  let kebutuhanA3Cover = 0;
  const breakdown: ManasikBreakdownItem[] = [];
  let totalHpp = 0;

  // ==========================================
  // 1. VARIAN: MINI TIKTOK (6,3 x 10,3 cm)
  // ==========================================
  if (varian === 'Mini TikTok 6,3 x 10,3') {
    tebalPunggung = 0;
    // Otomatis: oplah >= 400 bisa naik offset Oliver
    if (metodeCetakCover === 'Offset (Oliver)') {
      metodeCover = 'Offset (Oliver)';
    } else if (metodeCetakCover === 'Print Digital (A3+)') {
      metodeCover = 'Print Digital (A3+)';
    } else {
      metodeCover = validOplah >= 400 ? 'Offset (Oliver)' : 'Print Digital (A3+)';
    }

    // 48 halaman = 24 lembar bolak-balik 6.3 x 10.3 cm
    let biayaCetakBahan = 0;
    if (metodeCover === 'Print Digital (A3+)') {
      // 1 Lbr A3+ muat 12 kartu mini
      kebutuhanA3Cover = Math.ceil((validOplah * 24) / 12) + params.insheetCover;
      biayaCetakBahan = kebutuhanA3Cover * params.tarifPrintMiniTikTokA3 + params.tarifDesainMiniTikTok;
      breakdown.push({
        nama: 'Kertas & Print POD A3+ (AC 310 gsm 2 Muka)',
        nominal: Math.round(biayaCetakBahan),
        pct: 0,
        keterangan: `${kebutuhanA3Cover} lbr A3+ POD @ Rp ${params.tarifPrintMiniTikTokA3.toLocaleString('id-ID')}`,
      });
    } else {
      // Naik Oliver offset sesuai sheet BUKU baris 9:
      // Insheet K6 di Excel BUKU = 200 lbr mesin
      const insheetPlano = (200 / 4) * 1; // 50 plano
      kebutuhanPlanoCover = Math.ceil(((validOplah * 24) / 96) + insheetPlano);
      // Harga Kertas per plano = W29 / 500 = 8.942,5235 (1.564.941,61 untuk 175 plano)
      const hargaPlano = (params.tarifAc310Kg * (79 * 109 * 310)) / 10000000;
      const biayaKertas = kebutuhanPlanoCover * (4471261.75 / 500);
      
      // Desain file: 24 kartu x Rp 2.500 = Rp 60.000
      const biayaDesain = params.tarifDesainMiniTikTok * 24;
      
      // Plate: 8 plat @ Rp 43.000 (CTP 2 Muka) = Rp 344.000
      const jmlPlat = 8;
      const biayaPlat = jmlPlat * 43000;
      
      // Ongkos Cetak Oliver:
      // Q9 = kebutuhanPlanoCover * 4 * 2 (lbr mesin)
      // Ongkos dasar = Rp 90.000 * 8 = Rp 720.000
      // Over = max(0, Q9 - 1000) * 40 * 4
      const lbrMesin = kebutuhanPlanoCover * 4 * 2;
      const ongkosDasar = params.oliverMinOngkosCover * jmlPlat;
      const cetakOver = Math.max(0, lbrMesin - 1000);
      const ongkosOver = cetakOver * params.oliverDrekOverCover * 4;
      const biayaCetakMesin = ongkosDasar + ongkosOver;
      biayaCetakBahan = biayaKertas + biayaDesain + biayaPlat + biayaCetakMesin;

      breakdown.push({
        nama: 'Kertas AC 310, Plat & Cetak Oliver Offset (2 Muka)',
        nominal: Math.round(biayaCetakBahan),
        pct: 0,
        keterangan: `${kebutuhanPlanoCover} lbr plano AC 310 + 8 Plat CTP + Oliver Offset (Over ${cetakOver} lbr)`,
      });
    }

    // Finishing Khusus TikTok (Sheet BUKU):
    // Pisau pound (AL9): 27 * 32 * 299.30 = Rp 258.595,20 (tetap per pesanan)
    // Jasa pond (AM9): max(50000, kebutuhanPlanoCover * 2 * 225.4868)
    const biayaPisau = 27 * 32 * params.tarifPisauPoundMini;
    const biayaJasaPound = Math.max(50000, (kebutuhanPlanoCover * 2) * params.tarifJasaPoundMini);
    breakdown.push({
      nama: 'Pisau Pond & Jasa Pond Kartu Mini',
      nominal: Math.round(biayaPisau + biayaJasaPound),
      pct: 0,
      keterangan: `Pisau pond custom (Rp ${Math.round(biayaPisau).toLocaleString('id-ID')}) + jasa pond ${kebutuhanPlanoCover * 2} lbr`,
    });

    // Tali Cocard: Rp 2.500 * oplah
    const biayaTali = params.tarifTaliCocardMini * validOplah;
    breakdown.push({
      nama: 'Tali Cocard Mini',
      nominal: Math.round(biayaTali),
      pct: 0,
      keterangan: `@ Rp ${params.tarifTaliCocardMini.toLocaleString('id-ID')} x ${validOplah} pcs`,
    });

    // Ring Binder 3cm: Rp 925 * oplah
    const biayaRing = params.tarifRingBinderMini * validOplah;
    breakdown.push({
      nama: 'Ring Binder 3 cm',
      nominal: Math.round(biayaRing),
      pct: 0,
      keterangan: `@ Rp ${params.tarifRingBinderMini.toLocaleString('id-ID')} x ${validOplah} pcs`,
    });

    // Plastik Ziplock: Rp 465 * oplah
    const biayaZiplock = params.tarifPlastikZiplockMini * validOplah;
    breakdown.push({
      nama: 'Plastik Ziplock Satuan',
      nominal: Math.round(biayaZiplock),
      pct: 0,
      keterangan: `@ Rp ${params.tarifPlastikZiplockMini.toLocaleString('id-ID')} x ${validOplah} pcs`,
    });

    // Susun + Pasang Ring: Rp 751,62 * oplah
    const biayaSusunRing = params.tarifSusunPasangRingMini * validOplah;
    breakdown.push({
      nama: 'Tenaga Susun & Pasang Ring Binder',
      nominal: Math.round(biayaSusunRing),
      pct: 0,
      keterangan: `@ Rp ${Math.round(params.tarifSusunPasangRingMini).toLocaleString('id-ID')} x ${validOplah} pcs`,
    });

    // Laminasi Glossy 2 Muka: AU30 * AV30 * 0.35 * kebutuhanPlanoCover * 2
    let biayaLaminasi = 0;
    if (laminasiCover !== 'Tanpa Laminasi') {
      biayaLaminasi = Math.max(params.minLaminasi, 39 * 54 * params.tarifLaminasiGlossyCm2 * kebutuhanPlanoCover * 2);
      breakdown.push({
        nama: `Laminasi (${laminasiCover}) 2 Muka`,
        nominal: Math.round(biayaLaminasi),
        pct: 0,
        keterangan: `${kebutuhanPlanoCover * 2} lbr laminasi 39x54 cm @ Rp ${params.tarifLaminasiGlossyCm2}/cm²`,
      });
    }

    // Ekspedisi / Transport: Rp 150.000 per order
    const biayaTransport = params.tarifTransportMini;
    breakdown.push({
      nama: 'Transportasi / Distribusi Finishing',
      nominal: Math.round(biayaTransport),
      pct: 0,
      keterangan: 'Transportasi pengadaan & distribusi pengerjaan ring',
    });

    // Kardus & Lakban: 1 kardus isi 300 pcs
    const jmlBox = Math.ceil(validOplah / params.kapasitasKardusMini);
    const biayaLakban = (validOplah / params.kapasitasKardusMini / 39.03061224489796) * params.tarifLakbanBox;
    const biayaKardus = jmlBox * params.tarifKardusBox + biayaLakban;
    breakdown.push({
      nama: 'Packing Kardus & Lakban Master',
      nominal: Math.round(biayaKardus),
      pct: 0,
      keterangan: `${jmlBox} box kardus (isi 300 pcs/box) + segel lakban`,
    });

    totalHpp = Math.round(
      biayaCetakBahan +
        biayaPisau +
        biayaJasaPound +
        biayaTali +
        biayaRing +
        biayaZiplock +
        biayaSusunRing +
        biayaLaminasi +
        biayaTransport +
        biayaKardus
    );
  }
  // ==========================================
  // 2. VARIAN: KOSONGAN (10 x 15,5 cm)
  // ==========================================
  else if (varian === 'Kosongan 10 x 15,5') {
    tebalPunggung = 1.0;
    metodeCover = 'Offset (Oliver)';

    // Rumus Cetak Buku Kosongan sesuai Sheet BUKU & HARGA 2026:
    // 212 Halaman = 26.5 sheet (AN18 = 26.5)
    // Kebutuhan lbr cetak (AP): (oplah * 26.5) + (5 insheet * 27)
    const ap = Math.ceil(validOplah * 26.5 + 5 * 27);

    // 1. Kertas Isi HVS 70 gsm: 26.5 lbr plano roll @ Rp 38.987,025 / rim potong
    const hargaPlanoRim = 38987.025 * (params.tarifKertasHvs70Kg / 15700);
    const biayaKertasIsi = (ap / 500) * hargaPlanoRim;

    // 2. Desain File Isi: 26.5 set @ Rp 5.000
    const biayaDesain = 5000 * 26.5;

    // 3. Ongkos Cetak Rotary Web (Print Buya): Rp 350 / lbr cetak
    const biayaCetakIsi = ap * 350;

    breakdown.push({
      nama: 'Kertas HVS 70 gsm & Cetak Mesin Buya (212 Hal)',
      nominal: Math.round(biayaKertasIsi + biayaDesain + biayaCetakIsi),
      pct: 0,
      keterangan: `${ap.toLocaleString('id-ID')} lbr cetak HVS 70 gsm @ Rp 350 + kertas & desain`,
    });

    // 4. Finishing Blok Isi (Kuras: Lipat, Susun, Belah, Lem Panas):
    // BF: 6.26352222 * 27 * oplah (Rp 169.115,10 / 1000 eks)
    // BG: 16.1062 * 27 * oplah (Rp 434.867,40 / 1000 eks)
    // BH: 22.54868 * oplah (Rp 22.548,68 / 1000 eks)
    // BM: 187.90567 * oplah + 4800 lem (Rp 192.705,67 / 1000 eks)
    const biayaLipat = 6.26352222 * 27 * validOplah;
    const biayaSusun = 16.1062 * 27 * validOplah;
    const biayaBelah = params.tarifCasingIn / 10 * validOplah;
    const biayaLem = 187.90567 * validOplah + 4800;
    const totalFinishingIsi = biayaLipat + biayaSusun + biayaBelah + biayaLem;

    breakdown.push({
      nama: 'Finishing Blok Isi (Lipat, Susun, Belah, Lem Bending)',
      nominal: Math.round(totalFinishingIsi),
      pct: 0,
      keterangan: 'Pelipatan kuras, susun urut halaman, belah dan pengeleman blok',
    });

    // 5. Sisipan 4 Halaman:
    const biayaSisipan = Math.ceil((4 / 8) * validOplah + 10) * 350 + validOplah * params.tarifBiayaSisipLipat;
    breakdown.push({
      nama: 'Sisipan 4 Halaman PT',
      nominal: Math.round(biayaSisipan),
      pct: 0,
      keterangan: 'Print sisipan A3+ dan jasa sisip lipat nama PT',
    });

    // 6. Finishing Jilid & Tali (Staples, Casing In, Bor & Pasang Tali):
    const staplesIsi = Math.max(0.3, validOplah / (10000 / 12)) * 16000;
    const staplesTenaga = validOplah * params.tarifStaplesPalu;
    const casingIn = validOplah * params.tarifCasingIn;
    const lubangBor = validOplah * params.tarifLubangBor;
    const taliBahan = (validOplah / 56) * 16000;
    const taliPasang = validOplah * params.tarifPasangTali;
    const biayaJilidTali = staplesIsi + staplesTenaga + casingIn + lubangBor + taliBahan + taliPasang;
    breakdown.push({
      nama: 'Jilid Staples, Casing In & Pasang Tali Kur',
      nominal: Math.round(biayaJilidTali),
      pct: 0,
      keterangan: 'Staples kawat, casing in, bor lubang & tali kur leher',
    });

    // 7. Potong Sisir & Kemasan OPP:
    const biayaSisir = validOplah * params.tarifSisir;
    const oppBahan = (params.tarifPlastikOppPack / 100) * validOplah;
    const oppJasa = validOplah * params.jasaPlastikOpp;
    const biayaKemasan = biayaSisir + oppBahan + oppJasa;
    breakdown.push({
      nama: 'Potong Sisir 3 Sisi & Plastik OPP',
      nominal: Math.round(biayaKemasan),
      pct: 0,
      keterangan: 'Potong sisir rapi & kemasan segel plastik OPP per pcs',
    });

    // 8. Laminasi Doff Cover:
    const lamDoff = Math.max(50000, 10 * 15.5 * 2 * params.tarifLaminasiDoffCm2 * validOplah);
    breakdown.push({
      nama: 'Laminasi Doff Cover',
      nominal: Math.round(lamDoff),
      pct: 0,
      keterangan: 'Finishing laminasi doff (min. Rp 50.000)',
    });

    // 9. Kardus & Packing Lakban:
    const jmlBox = Math.ceil(validOplah / params.kapasitasKardusManasik);
    const biayaLakban = (validOplah / params.kapasitasKardusManasik / 39.03061224489796) * params.tarifLakbanBox;
    const biayaKardus = jmlBox * params.tarifKardusBox + biayaLakban;
    breakdown.push({
      nama: 'Packing Kardus Master & Lakban',
      nominal: Math.round(biayaKardus),
      pct: 0,
      keterangan: `${jmlBox} box kardus master (isi 200 pcs/box)`,
    });

    totalHpp = Math.round(
      biayaKertasIsi +
        biayaDesain +
        biayaCetakIsi +
        totalFinishingIsi +
        biayaSisipan +
        biayaJilidTali +
        biayaKemasan +
        lamDoff +
        biayaKardus
    );
  }
  // ==========================================
  // 3. VARIAN: CUSTOM COVER (10 x 15,5 cm) - DEFAULT 2026
  // ==========================================
  else {
    if (jumlahHalaman <= 100) tebalPunggung = 0.5;
    else if (jumlahHalaman <= 200) tebalPunggung = 0.9;
    else if (jumlahHalaman <= 216) tebalPunggung = 1.0;
    else tebalPunggung = 1.5;

    if (metodeCetakCover === 'Offset (Oliver)') {
      metodeCover = 'Offset (Oliver)';
    } else {
      // Master Excel Custom Cover 2026 (Master!D16 = "Print Inter"):
      // Semua oplah 20 s/d 5.000 menggunakan POD Print Inter A3+ @ Rp 2.700
      metodeCover = 'Print Digital (A3+)';
    }
    // A. Biaya Cover
    let biayaCover = 0;
    if (metodeCover === 'Print Digital (A3+)') {
      const a3MuatCover = 4;
      // Di Excel cell R9: =(H9/P9) + (K9/O9) tanpa Math.ceil (misal 50/4 + 5 = 17.5 lbr A3+)
      const lbrA3Cover = (validOplah / a3MuatCover) + params.insheetCover;
      kebutuhanA3Cover = Math.ceil(lbrA3Cover);
      biayaCover = lbrA3Cover * params.tarifPrintCoverA3 + params.tarifDesainCover;
      breakdown.push({
        nama: 'Cover Print Digital (A3+ Inter)',
        nominal: Math.round(biayaCover),
        pct: 0,
        keterangan: `AC 230 gsm, ${lbrA3Cover} Lbr A3+ @ Rp ${params.tarifPrintCoverA3.toLocaleString('id-ID')} + Desain`,
      });
    } else {
      const planoMuatCover = 16;
      kebutuhanPlanoCover = Math.ceil(validOplah / planoMuatCover) + Math.ceil(params.insheetCover / 4);
      const beratPlanoKg = (65 * 100 * 230) / 10000000;
      const biayaKertasPlano = kebutuhanPlanoCover * beratPlanoKg * params.tarifAc230Kg;
      const jmlPlat = 4;
      const biayaPlat = jmlPlat * params.oliverPlatUnitCover;
      const lbrCetak = kebutuhanPlanoCover * 4;
      const ongkosDasar = params.oliverMinOngkosCover * jmlPlat;
      const cetakOver = Math.max(0, lbrCetak - 1000);
      const ongkosOver = cetakOver * params.oliverDrekOverCover * jmlPlat;
      biayaCover = biayaKertasPlano + biayaPlat + ongkosDasar + ongkosOver + params.tarifDesainCover;
      breakdown.push({
        nama: 'Cover Cetak Offset Oliver (4 Warna)',
        nominal: Math.round(biayaCover),
        pct: 0,
        keterangan: `AC 230 gsm, ${kebutuhanPlanoCover} plano + 4 plat CTP + Mesin Oliver`,
      });
    }

    // B. Blok Isi Kosongan (212 hal standar 2026)
    let hargaIsiPerPcs = params.hargaIsiKosongan208;
    if (jumlahHalaman === 96) hargaIsiPerPcs = params.hargaIsiKosongan96;
    else if (jumlahHalaman === 128) hargaIsiPerPcs = params.hargaIsiKosongan128;
    else if (jumlahHalaman === 192) hargaIsiPerPcs = params.hargaIsiKosongan192;
    else hargaIsiPerPcs = params.hargaIsiKosongan208;

    const insheetIsi = 2;
    const biayaIsi = hargaIsiPerPcs * (validOplah + insheetIsi);
    breakdown.push({
      nama: `Blok Isi Manasik (${jumlahHalaman >= 208 ? '212' : jumlahHalaman} Hal Ready)`,
      nominal: Math.round(biayaIsi),
      pct: 0,
      keterangan: `@ Rp ${hargaIsiPerPcs.toLocaleString('id-ID')} x ${validOplah + insheetIsi} eks (inkl. 2 insheet)`,
    });

    // C. Sisipan 4 Halaman (Nama PT / Biro Travel)
    let biayaSisipan = 0;
    if (opsiSisipan) {
      // Excel cell AL9: =(((4 / 8) * H9) + 10)
      const lbrSisipanA3 = ((4 / 8) * validOplah) + params.insheetSisipan;
      const biayaPrintSisipan = lbrSisipanA3 * params.tarifPrintSisipanA3;
      const biayaLipatSisipan = validOplah * params.tarifBiayaSisipLipat;
      biayaSisipan = biayaPrintSisipan + biayaLipatSisipan;
      breakdown.push({
        nama: 'Sisipan 4 Halaman Custom PT / Travel',
        nominal: Math.round(biayaSisipan),
        pct: 0,
        keterangan: `Print sisipan ${lbrSisipanA3} lbr + jasa sisip & lipat nama PT`,
      });
    }

    // D. Laminasi Cover
    let biayaLaminasi = 0;
    if (laminasiCover === 'Doff') {
      const rawLam = widthCm * heightCm * 2 * params.tarifLaminasiDoffCm2 * validOplah;
      biayaLaminasi = Math.max(params.minLaminasi, rawLam);
    } else if (laminasiCover === 'Glossy') {
      const rawLam = (widthCm + 1) * (heightCm + 1) * params.tarifLaminasiGlossyCm2 * validOplah;
      biayaLaminasi = Math.max(params.minLaminasi, rawLam);
    } else if (laminasiCover === 'UV Varnish') {
      const rawLam = (widthCm + 1) * (heightCm + 1) * params.tarifUvVarnishCm2 * validOplah;
      biayaLaminasi = Math.max(params.minLaminasi, rawLam);
    }
    if (biayaLaminasi > 0) {
      breakdown.push({
        nama: `Laminasi Cover (${laminasiCover})`,
        nominal: Math.round(biayaLaminasi),
        pct: 0,
        keterangan: `Finishing laminasi tahan air (min. Rp ${params.minLaminasi.toLocaleString('id-ID')})`,
      });
    }

    // E. Jilid & Finishing
    let biayaJilid = 0;
    let biayaTali = 0;
    const biayaSisir = params.tarifSisir * validOplah;

    if (tipeJilid === 'Softcover (Bending/Lem Panas)') {
      const rawBending = params.tarifBendingPerCm2 * heightCm * tebalPunggung * validOplah;
      biayaJilid = Math.max(params.minBending, rawBending);
      breakdown.push({
        nama: 'Jilid Bending Lem Panas',
        nominal: Math.round(biayaJilid),
        pct: 0,
        keterangan: `Bending punggung rapi (min. Rp ${params.minBending.toLocaleString('id-ID')})`,
      });
    } else if (tipeJilid === 'Spiral Kawat') {
      biayaJilid = Math.max(250000, params.tarifSpiralManasik * (validOplah + 5));
      breakdown.push({
        nama: 'Jilid Spiral Kawat',
        nominal: Math.round(biayaJilid),
        pct: 0,
        keterangan: `@ Rp ${params.tarifSpiralManasik.toLocaleString('id-ID')} / eks`,
      });
    } else {
      // Staples Kawat + Casing In (Standar Custom Cover)
      const staplesKebutuhan = Math.max(0.3, validOplah / (10000 / 12));
      const staplesIsi = staplesKebutuhan * params.tarifIsiStaplesPack;
      const staplesTenaga = validOplah * params.tarifStaplesPalu;
      const totalStaples = staplesIsi + staplesTenaga;
      const totalCasingIn = validOplah * params.tarifCasingIn;
      biayaJilid = totalStaples + totalCasingIn;

      breakdown.push({
        nama: 'Jilid Staples Kawat & Casing In',
        nominal: Math.round(biayaJilid),
        pct: 0,
        keterangan: 'Staples kawat tengah 1213 + jilid casing in cover',
      });

      if (tipeJilid === 'Tali Kur') {
        const biayaBor = params.tarifLubangBor * validOplah;
        const biayaBahanTali = (validOplah / 56) * 16000;
        const biayaPasangTali = params.tarifPasangTali * validOplah;
        biayaTali = biayaBor + biayaBahanTali + biayaPasangTali;
        breakdown.push({
          nama: 'Tali Kur Cocard & Lubang Bor',
          nominal: Math.round(biayaTali),
          pct: 0,
          keterangan: 'Tali kur leher warna + lubang bor mata ayam',
        });
      }
    }

    breakdown.push({
      nama: 'Potong Sisir 3 Sisi',
      nominal: Math.round(biayaSisir),
      pct: 0,
      keterangan: `@ Rp ${params.tarifSisir} x ${validOplah} eks`,
    });

    // F. Kemasan & Packing
    let biayaOpp = 0;
    if (opsiPlastikOpp) {
      const hargaBahanOpp = (params.tarifPlastikOppPack / 100) * validOplah;
      const jasaOpp = params.jasaPlastikOpp * validOplah;
      biayaOpp = hargaBahanOpp + jasaOpp;
      breakdown.push({
        nama: 'Plastik OPP Satuan',
        nominal: Math.round(biayaOpp),
        pct: 0,
        keterangan: 'Kemasan segel plastik opp per pcs',
      });
    }

    let biayaKardus = 0;
    if (opsiKardus) {
      const boxCount = Math.ceil(validOplah / params.kapasitasKardusManasik);
      const lakbanCost = (validOplah / params.kapasitasKardusManasik / 39.03061224489796) * params.tarifLakbanBox;
      biayaKardus = boxCount * params.tarifKardusBox + lakbanCost;
      breakdown.push({
        nama: 'Kardus Master & Lakban',
        nominal: Math.round(biayaKardus),
        pct: 0,
        keterangan: `${boxCount} box kardus (isi 200 pcs/box) + segel lakban`,
      });
    }

    totalHpp = Math.round(
      biayaCover +
        biayaIsi +
        biayaSisipan +
        biayaLaminasi +
        biayaJilid +
        biayaTali +
        biayaSisir +
        biayaOpp +
        biayaKardus
    );
  }

  const hppPerPcs = Math.round(totalHpp / validOplah);

  // Update percentage breakdown
  breakdown.forEach((b) => {
    b.pct = totalHpp > 0 ? (b.nominal / totalHpp) * 100 : 0;
  });

  // Perhitungan Harga Jual murni sesuai formula Excel Sheet BUKU (Cell DE9 s/d DE20):
  // Formula Excel DE: =ROUNDUP(DD9, -1) di mana DD9 = (Total_HPP / Oplah) * (1 + margin%)
  // Menggunakan HPP float presisi desimal sebelum pembulatan ke kelipatan 10 terdekat
  const rawHppPerPcs = totalHpp / validOplah;
  const rawHargaJual = rawHppPerPcs * (1 + marginPct / 100);
  const hargaJualPerPcs = Math.ceil(rawHargaJual / 10) * 10;
  
  const diskon = (hargaJualPerPcs * Math.max(0, Math.min(100, negoDiskonPct))) / 100;
  const hargaNegoPerPcs = Math.ceil((hargaJualPerPcs - diskon) / 10) * 10;
  const totalHargaJual = hargaJualPerPcs * validOplah;
  const totalProfit = totalHargaJual - totalHpp;
  const totalHargaNego = hargaNegoPerPcs * validOplah;
  const totalProfitNego = totalHargaNego - totalHpp;
  const marginNominalPerPcs = hargaJualPerPcs - hppPerPcs;

  return {
    input,
    metodeCoverTerpilih: metodeCover,
    tebalPunggungCm: tebalPunggung,
    breakdown,
    kebutuhanPlanoCover,
    kebutuhanA3Cover,
    summary: {
      totalHpp,
      hppPerPcs,
      marginNominalPerPcs,
      totalHargaJual,
      hargaJualPerPcs,
      totalHargaNego,
      hargaNegoPerPcs,
      totalProfit,
      totalProfitNego,
    },
  };
}
