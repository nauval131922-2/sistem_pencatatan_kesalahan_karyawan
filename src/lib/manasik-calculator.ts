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

  tarifStaplesPalu: number; // 112.74
  tarifIsiStaplesPack: number; // 24000 (isi staples 1213)
  tarifCasingIn: number; // 225.49
  tarifSisir: number; // 150
  tarifLubangBor: number; // 225.49
  tarifPasangTali: number; // 112.74
  tarifTaliKurPerPcs: number; // 285.71 (1 roll 16000 / 56 pcs)
  tarifSpiralManasik: number; // 1200
  tarifBiayaSisipLipat: number; // 225.49

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
  jasaPlastikOpp: number; // 225.49
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

  tarifStaplesPalu: 112.74,
  tarifIsiStaplesPack: 24000,
  tarifCasingIn: 225.49,
  tarifSisir: 150,
  tarifLubangBor: 225.49,
  tarifPasangTali: 112.74,
  tarifTaliKurPerPcs: 285.71,
  tarifSpiralManasik: 1200,
  tarifBiayaSisipLipat: 225.49,

  tarifPisauPoundMini: 299.30,
  tarifJasaPoundMini: 225.49,
  tarifTaliCocardMini: 2500,
  tarifRingBinderMini: 925,
  tarifPlastikZiplockMini: 465,
  tarifSusunPasangRingMini: 751.62,
  tarifTransportMini: 150000,

  tarifPlastikOppPack: 9200,
  jasaPlastikOpp: 225.49,
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
  tipeJilid: 'Softcover (Bending/Lem Panas)' | 'Staples Kawat' | 'Tali Cocard' | 'Spiral Kawat' | 'Ring Binder (TikTok)';
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
    defaultJilid: 'Tali Cocard' as const,
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
      // Naik Oliver offset
      // 1 plano 79x109 muat potong & kartu
      kebutuhanPlanoCover = Math.ceil((validOplah * 24) / 48) + params.insheetOffsetCover;
      const beratPlanoKg = (79 * 109 * 310) / 10000000; // ~0.2669 kg/plano
      const biayaKertas = kebutuhanPlanoCover * beratPlanoKg * params.tarifAc310Kg;
      const jmlPlat = 4;
      const biayaPlat = jmlPlat * 43000;
      const lbrCetak = kebutuhanPlanoCover * 2;
      const ongkosDasar = params.oliverMinOngkosCover * jmlPlat;
      const cetakOver = Math.max(0, lbrCetak - 1000);
      const ongkosOver = cetakOver * params.oliverDrekOverCover * jmlPlat;
      const biayaCetakMesin = ongkosDasar + ongkosOver;
      biayaCetakBahan = biayaKertas + biayaPlat + biayaCetakMesin + params.tarifDesainMiniTikTok;

      breakdown.push({
        nama: 'Bahan AC 310 & Ongkos Cetak Oliver Offset',
        nominal: Math.round(biayaCetakBahan),
        pct: 0,
        keterangan: `${kebutuhanPlanoCover} lbr plano AC 310 + 4 Plat + Oliver Offset`,
      });
    }

    // Finishing Khusus TikTok:
    // Pisau pound + Jasa pound
    const biayaPisau = params.tarifPisauPoundMini * validOplah;
    const biayaJasaPound = params.tarifJasaPoundMini * (validOplah * (24 / 8)); // ~3 set pound
    breakdown.push({
      nama: 'Pisau Pound & Jasa Pond Kartu Mini',
      nominal: Math.round(biayaPisau + biayaJasaPound),
      pct: 0,
      keterangan: 'Pond sudut & lubang ring binder tiap kartu',
    });

    // Tali Cocard
    const biayaTali = params.tarifTaliCocardMini * validOplah;
    breakdown.push({
      nama: 'Tali Cocard Mini',
      nominal: Math.round(biayaTali),
      pct: 0,
      keterangan: `@ Rp ${params.tarifTaliCocardMini.toLocaleString('id-ID')} x ${validOplah} pcs`,
    });

    // Ring Binder 3cm
    const biayaRing = params.tarifRingBinderMini * validOplah;
    breakdown.push({
      nama: 'Ring Binder 3 cm',
      nominal: Math.round(biayaRing),
      pct: 0,
      keterangan: `@ Rp ${params.tarifRingBinderMini.toLocaleString('id-ID')} x ${validOplah} pcs`,
    });

    // Plastik Ziplock
    const biayaZiplock = params.tarifPlastikZiplockMini * validOplah;
    breakdown.push({
      nama: 'Plastik Ziplock Satuan',
      nominal: Math.round(biayaZiplock),
      pct: 0,
      keterangan: `@ Rp ${params.tarifPlastikZiplockMini.toLocaleString('id-ID')} x ${validOplah} pcs`,
    });

    // Susun + Pasang Ring
    const biayaSusunRing = params.tarifSusunPasangRingMini * validOplah;
    breakdown.push({
      nama: 'Tenaga Susun & Pasang Ring Binder',
      nominal: Math.round(biayaSusunRing),
      pct: 0,
      keterangan: `@ Rp ${Math.round(params.tarifSusunPasangRingMini).toLocaleString('id-ID')} x ${validOplah} pcs`,
    });

    // Laminasi Glossy
    let biayaLaminasi = 0;
    if (laminasiCover !== 'Tanpa Laminasi') {
      const rawLam = 39 * 54 * (params.tarifLaminasiGlossyCm2 / 100) * (validOplah * 0.5);
      biayaLaminasi = Math.max(params.minLaminasi, (validOplah * 24 * 6.3 * 10.3 * 2 * params.tarifLaminasiGlossyCm2) / 14);
      breakdown.push({
        nama: `Laminasi (${laminasiCover})`,
        nominal: Math.round(biayaLaminasi),
        pct: 0,
        keterangan: 'Laminasi bolak-balik tahan air',
      });
    }

    // Ekspedisi / Transport
    const biayaTransport = params.tarifTransportMini;
    breakdown.push({
      nama: 'Transportasi / Distribusi Finishing',
      nominal: Math.round(biayaTransport),
      pct: 0,
      keterangan: 'Transportasi pengadaan & jilid khusus ring',
    });

    // Kardus & Lakban
    const jmlBox = Math.ceil(validOplah / params.kapasitasKardusMini);
    const biayaLakban = (validOplah / params.kapasitasKardusMini / 39.03) * params.tarifLakbanBox;
    const biayaKardus = jmlBox * params.tarifKardusBox + biayaLakban;
    breakdown.push({
      nama: 'Packing Kardus & Lakban',
      nominal: Math.round(biayaKardus),
      pct: 0,
      keterangan: `${jmlBox} box kardus master (isi 300 pcs/box)`,
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

    // Produksi blok isi manasik kosongan 212 hal (26.5 sheet 10x15.5)
    // 1 Plano muat 8 potong (1 plano muat 8 lbr 21.5x33)
    // HVS 70 gsm @ 15.700/kg
    const lbrIsiPerBuku = 26.5;
    const insheetIsi = 5;
    const kebutuhanLbrCetak = Math.ceil(validOplah * lbrIsiPerBuku + insheetIsi);
    const beratPlanoKg = (21.5 * 33 * 70) / 10000000;
    const biayaKertasIsi = kebutuhanLbrCetak * beratPlanoKg * params.tarifKertasHvs70Kg * 8; // scaled

    // Plat & Cetak 1 Warna
    const jmlPlat = 53; // 212 hal / 4
    const biayaPlat = jmlPlat * params.oliverPlatUnitCover;
    const ongkosDasar = params.oliverMinOngkosCover * jmlPlat;
    const lbrMesin = Math.ceil((validOplah * 4) / 8);
    const cetakOver = Math.max(0, lbrMesin - 1000);
    const ongkosOver = cetakOver * params.oliverDrekOverCover * jmlPlat;
    const biayaCetakIsi = ongkosDasar + ongkosOver;

    breakdown.push({
      nama: 'Kertas HVS 70 gsm & Cetak Offset Isi (1 Warna)',
      nominal: Math.round(biayaKertasIsi + biayaPlat + biayaCetakIsi),
      pct: 0,
      keterangan: `212 Halaman (53 Plat) HVS 70 gsm @ Rp ${params.tarifKertasHvs70Kg.toLocaleString('id-ID')}/kg`,
    });

    // Lipat + Susun + Gabung Lem
    const biayaLipat = 169.11 * validOplah;
    const biayaSusun = 434.86 * validOplah;
    const biayaBelah = 22.55 * validOplah;
    const biayaLem = 188.86 * validOplah;
    const totalFinishingIsi = biayaLipat + biayaSusun + biayaBelah + biayaLem;
    breakdown.push({
      nama: 'Finishing Blok Isi (Lipat + Susun + Lem Bending)',
      nominal: Math.round(totalFinishingIsi),
      pct: 0,
      keterangan: 'Pelipatan kuras, susun urut halaman, dan pengeleman blok buku',
    });

    // Kardus & Packing
    const jmlBox = Math.ceil(validOplah / params.kapasitasKardusManasik);
    const biayaLakban = (validOplah / params.kapasitasKardusManasik / 39.03) * params.tarifLakbanBox;
    const biayaKardus = jmlBox * params.tarifKardusBox + biayaLakban;
    breakdown.push({
      nama: 'Packing Kardus & Lakban Master',
      nominal: Math.round(biayaKardus),
      pct: 0,
      keterangan: `${jmlBox} box kardus master (isi 200 pcs/box)`,
    });

    totalHpp = Math.round(biayaKertasIsi + biayaPlat + biayaCetakIsi + totalFinishingIsi + biayaKardus);
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
    } else if (metodeCetakCover === 'Print Digital (A3+)') {
      metodeCover = 'Print Digital (A3+)';
    } else {
      metodeCover = validOplah >= 300 ? 'Offset (Oliver)' : 'Print Digital (A3+)';
    }

    // A. Biaya Cover
    let biayaCover = 0;
    if (metodeCover === 'Print Digital (A3+)') {
      const a3MuatCover = 4;
      kebutuhanA3Cover = Math.ceil(validOplah / a3MuatCover) + params.insheetCover;
      biayaCover = kebutuhanA3Cover * params.tarifPrintCoverA3 + params.tarifDesainCover;
      breakdown.push({
        nama: 'Cover Print Digital (A3+ Inter)',
        nominal: Math.round(biayaCover),
        pct: 0,
        keterangan: `AC 230 gsm, ${kebutuhanA3Cover} Lbr A3+ @ Rp ${params.tarifPrintCoverA3.toLocaleString('id-ID')} + Desain`,
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
      const kebutuhanSisipanA3 = Math.ceil((4 / 8) * validOplah) + params.insheetSisipan;
      const biayaPrintSisipan = kebutuhanSisipanA3 * params.tarifPrintSisipanA3;
      const biayaLipatSisipan = validOplah * params.tarifBiayaSisipLipat;
      biayaSisipan = biayaPrintSisipan + biayaLipatSisipan;
      breakdown.push({
        nama: 'Sisipan 4 Halaman Custom PT / Travel',
        nominal: Math.round(biayaSisipan),
        pct: 0,
        keterangan: `Print sisipan ${kebutuhanSisipanA3} lbr + jasa sisip & lipat nama PT`,
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

      if (tipeJilid === 'Tali Cocard') {
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

  // Perhitungan Harga Jual Mengikuti Pricelist Excel jika tersedia, atau Margin %
  // Tabel Excel Resmi 2026:
  // 20: 16.000 | 50: 15.000 | 100: 14.500 | 150: 14.000 | 200: 13.500 | 250: 13.000 | 300: 12.500 | 350: 12.000 | 400: 11.500 | 450: 10.900 | 500: 9.900 | 1000: 8.900
  let hargaJualPerPcs = 0;
  let hargaNegoPerPcs = 0;

  if (varian === 'Custom Cover 10 x 15,5' && marginPct === 30) {
    // Pricelist resmi Excel Custom Cover 2026
    const exactPrices: Record<number, { jual: number; nego: number }> = {
      20: { jual: 16000, nego: 15500 },
      50: { jual: 15000, nego: 14500 },
      100: { jual: 14500, nego: 14000 },
      150: { jual: 14000, nego: 13500 },
      200: { jual: 13500, nego: 13000 },
      250: { jual: 13000, nego: 12500 },
      300: { jual: 12500, nego: 12000 },
      350: { jual: 12000, nego: 11500 },
      400: { jual: 11500, nego: 11000 },
      450: { jual: 10900, nego: 10500 },
      500: { jual: 9900, nego: 9500 },
      1000: { jual: 8900, nego: 8500 },
    };

    if (exactPrices[validOplah] && negoDiskonPct === 0) {
      hargaJualPerPcs = exactPrices[validOplah].jual;
      hargaNegoPerPcs = exactPrices[validOplah].nego;
    } else {
      const marginNominal = Math.round((hppPerPcs * marginPct) / 100);
      hargaJualPerPcs = Math.ceil((hppPerPcs + marginNominal) / 50) * 50;
      const diskon = Math.round((hargaJualPerPcs * Math.max(0, Math.min(100, negoDiskonPct))) / 100);
      hargaNegoPerPcs = hargaJualPerPcs - diskon;
    }
  } else if (varian === 'Mini TikTok 6,3 x 10,3') {
    const exactPricesTikTok: Record<number, number> = {
      400: 16730,
      450: 16020,
      500: 15410,
      550: 14950,
      600: 14530,
      650: 14230,
      700: 13920,
      750: 13680,
      800: 13450,
      850: 13270,
      900: 13080,
      950: 12950,
      1000: 12800,
    };
    if (exactPricesTikTok[validOplah] && marginPct === 32) {
      hargaJualPerPcs = exactPricesTikTok[validOplah];
    } else {
      const marginNominal = Math.round((hppPerPcs * marginPct) / 100);
      hargaJualPerPcs = Math.ceil((hppPerPcs + marginNominal) / 10) * 10;
    }
    const diskon = Math.round((hargaJualPerPcs * Math.max(0, Math.min(100, negoDiskonPct))) / 100);
    hargaNegoPerPcs = hargaJualPerPcs - diskon;
  } else {
    // Kosongan & custom margin
    const marginNominal = Math.round((hppPerPcs * marginPct) / 100);
    hargaJualPerPcs = Math.ceil((hppPerPcs + marginNominal) / 10) * 10;
    const diskon = Math.round((hargaJualPerPcs * Math.max(0, Math.min(100, negoDiskonPct))) / 100);
    hargaNegoPerPcs = hargaJualPerPcs - diskon;
  }

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
