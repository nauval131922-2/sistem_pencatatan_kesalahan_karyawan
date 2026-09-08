// ponytail: kalkulator dan master parameter buku yasin (02. Pricelist Yasin Softcover & Hardcover)

export interface YasinMasterParams {
  // 1. Cover (Digital POD A3+ / Offset)
  tarifPrintCoverA3: number; // 2500 (Softcover AC 230) / 2000 (Hardcover AP 150)
  tarifDesainCover: number; // 25000
  insheetCover: number; // 5-10 lembar

  // 2. Blok Isi Yasin Kosongan (Ready)
  hargaIsiYasin64: number; // 1650
  hargaIsiYasin96: number; // 2250 (standar Buya Barokah)
  hargaIsiYasin112: number; // 2470
  hargaIsiYasin128: number; // 2600
  hargaIsiYasin144: number; // 3200
  hargaIsiYasin192: number; // 3800

  // 3. Sisipan Halaman Foto & Doa/Keluarga (Cetak POD A3+)
  tarifPrintSisipanFotoA3: number; // 1750 (Art Paper 120 FC)
  tarifPrintSisipanTeksA3: number; // 1500 (Art Paper 120 1W / FC)
  insheetSisipan: number; // 2 lembar

  // 4. Laminasi
  tarifLaminasiGlossyCm2: number; // 0.35
  tarifLaminasiDoffCm2: number; // 0.40
  minLaminasi: number; // 50000

  // 5. Finishing Softcover
  tarifSisipLembar: number; // 100 per lembar sisipan
  tarifStaplesYasin: number; // 50
  tarifPasangCoverSoft: number; // 100
  tarifSisirYasin: number; // 150
  tarifPlastikOppYasin: number; // 95

  // 6. Komponen Khusus Hardcover
  tarifBoardHardcover: number; // 280 (Greyboard No. 30/40)
  tarifCasingInHardcover: number; // 750 (perakitan cover tebal)
  tarifSkiblat: number; // 350 (lembar penyambung dalam)
  tarifPitaRumbaiPapercraft: number; // 470
  tarifSikuSudutEmas: number; // 400 (4 pcs sudut kaleng emas)
  tarifEmbossFoilGembos: number; // 4875 per 12 pcs setup
}

export const DEFAULT_YASIN_PARAMS: YasinMasterParams = {
  tarifPrintCoverA3: 2500,
  tarifDesainCover: 25000,
  insheetCover: 5,

  hargaIsiYasin64: 1650,
  hargaIsiYasin96: 2250,
  hargaIsiYasin112: 2470,
  hargaIsiYasin128: 2600,
  hargaIsiYasin144: 3200,
  hargaIsiYasin192: 3800,

  tarifPrintSisipanFotoA3: 1750,
  tarifPrintSisipanTeksA3: 3300, // Excel Master!D31: Rp 3.300 / lbr A3+ (Cetak 2 Muka / Bolak-balik)
  insheetSisipan: 2,

  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  minLaminasi: 50000,

  tarifSisipLembar: 100,
  tarifStaplesYasin: 50,
  tarifPasangCoverSoft: 200, // Excel BUKU!AU6: Rp 200 / buku
  tarifSisirYasin: 150,
  tarifPlastikOppYasin: 90, // Excel BUKU!AX6: Rp 90 / buku

  tarifBoardHardcover: 280,
  tarifCasingInHardcover: 750,
  tarifSkiblat: 350,
  tarifPitaRumbaiPapercraft: 470,
  tarifSikuSudutEmas: 400,
  tarifEmbossFoilGembos: 4875,
};

export interface YasinSimulatorInput {
  oplah: number;
  tipeCover: 'Softcover' | 'Hardcover';
  ukuran: '11.7 x 15' | '9.5 x 14';
  jumlahHalamanIsi: 64 | 96 | 112 | 128 | 144 | 192;
  lembarSisipanFoto: number; // 0, 1, 2, 3, 4
  lembarSisipanKeluarga: number; // 0, 1, 2, 3, 4
  laminasiCover: 'Glossy' | 'Doff';
  opsiPitaRumbai: boolean;
  opsiSikuEmas: boolean;
  opsiPlastikOpp: boolean;
  marginPct: number; // Default 30%
  negoDiskonPct: number; // 0-100%
}

export interface YasinBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface YasinSimulatorOutput {
  input: YasinSimulatorInput;
  tebalPunggungCm: number;
  kebutuhanA3Cover: number;
  kebutuhanA3SisipanFoto: number;
  kebutuhanA3SisipanTeks: number;
  breakdown: YasinBreakdownItem[];
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

export function calculateYasinSimulator(
  input: YasinSimulatorInput,
  rawParams: YasinMasterParams = DEFAULT_YASIN_PARAMS
): YasinSimulatorOutput {
  const params: YasinMasterParams = { ...DEFAULT_YASIN_PARAMS, ...(rawParams || {}) };
  const {
    oplah,
    tipeCover,
    ukuran,
    jumlahHalamanIsi,
    lembarSisipanFoto,
    lembarSisipanKeluarga,
    laminasiCover,
    opsiPitaRumbai,
    opsiSikuEmas,
    opsiPlastikOpp,
    marginPct,
    negoDiskonPct,
  } = input;

  const validOplah = Math.max(1, oplah);
  const isHardcover = tipeCover === 'Hardcover';
  const widthCm = ukuran === '9.5 x 14' ? 9.5 : 11.7;
  const heightCm = ukuran === '9.5 x 14' ? 14 : 15;

  // 1. Tebal Punggung
  let tebalPunggung = 0.4;
  if (jumlahHalamanIsi <= 65) tebalPunggung = 0.3;
  else if (jumlahHalamanIsi <= 96) tebalPunggung = 0.4;
  else if (jumlahHalamanIsi <= 128) tebalPunggung = 0.5;
  else if (jumlahHalamanIsi <= 160) tebalPunggung = 0.6;
  else tebalPunggung = 1.0;

  // 2. Biaya Cover POD A3+
  // Softcover muat 3 cover / A3+, Hardcover muat 2 cover (bentangan lebar + lipatan board)
  const a3MuatCover = isHardcover ? 2 : 3;
  const kebutuhanA3Cover = Math.ceil(validOplah / a3MuatCover) + (params.insheetCover ?? 5);
  const hargaPrintCoverUnit = isHardcover ? 2000 : (params.tarifPrintCoverA3 ?? 2500);
  const biayaPrintCover = (kebutuhanA3Cover * hargaPrintCoverUnit) + (params.tarifDesainCover ?? 25000);

  // 3. Biaya Blok Isi Yasin
  let hargaIsiPerPcs = params.hargaIsiYasin96 ?? DEFAULT_YASIN_PARAMS.hargaIsiYasin96;
  if (jumlahHalamanIsi === 64) hargaIsiPerPcs = params.hargaIsiYasin64 ?? DEFAULT_YASIN_PARAMS.hargaIsiYasin64;
  else if (jumlahHalamanIsi === 96) hargaIsiPerPcs = params.hargaIsiYasin96 ?? DEFAULT_YASIN_PARAMS.hargaIsiYasin96;
  else if (jumlahHalamanIsi === 112) hargaIsiPerPcs = params.hargaIsiYasin112 ?? DEFAULT_YASIN_PARAMS.hargaIsiYasin112;
  else if (jumlahHalamanIsi === 128) hargaIsiPerPcs = params.hargaIsiYasin128 ?? DEFAULT_YASIN_PARAMS.hargaIsiYasin128;
  else if (jumlahHalamanIsi === 144) hargaIsiPerPcs = params.hargaIsiYasin144 ?? DEFAULT_YASIN_PARAMS.hargaIsiYasin144;
  else if (jumlahHalamanIsi === 192) hargaIsiPerPcs = params.hargaIsiYasin192 ?? DEFAULT_YASIN_PARAMS.hargaIsiYasin192;

  const biayaIsi = hargaIsiPerPcs * validOplah;

  // 4. Biaya Sisipan (Foto & Teks Doa/Keluarga)
  // 1 A3+ muat 8 halaman sisipan ukuran Yasin (2 muka x 4 posisi)
  let biayaSisipanFoto = 0;
  let kebutuhanA3SisipanFoto = 0;
  if (lembarSisipanFoto > 0) {
    const totalHalFoto = lembarSisipanFoto * validOplah;
    kebutuhanA3SisipanFoto = Math.ceil(totalHalFoto / 8) + params.insheetSisipan;
    biayaSisipanFoto = kebutuhanA3SisipanFoto * params.tarifPrintSisipanFotoA3;
  }

  let biayaSisipanTeks = 0;
  let kebutuhanA3SisipanTeks = 0;
  if (lembarSisipanKeluarga > 0) {
    const totalHalTeks = lembarSisipanKeluarga * validOplah;
    kebutuhanA3SisipanTeks = Math.ceil(totalHalTeks / 8) + params.insheetSisipan;
    biayaSisipanTeks = kebutuhanA3SisipanTeks * params.tarifPrintSisipanTeksA3;
  }

  // 5. Biaya Laminasi Cover
  const bentanganWidth = isHardcover ? (widthCm * 2 + 4) : (widthCm * 2 + tebalPunggung + 1);
  const bentanganHeight = isHardcover ? (heightCm + 4) : (heightCm + 1);
  const luasCm2Cover = bentanganWidth * bentanganHeight;
  const tarifLamCm2 = laminasiCover === 'Doff' ? params.tarifLaminasiDoffCm2 : params.tarifLaminasiGlossyCm2;
  const rawLam = luasCm2Cover * tarifLamCm2 * validOplah;
  const biayaLaminasi = Math.max(params.minLaminasi, rawLam);

  // 6. Finishing Perakitan Jilid
  const totalLembarSisip = lembarSisipanFoto + lembarSisipanKeluarga;
  const biayaSisip = totalLembarSisip * params.tarifSisipLembar * validOplah;
  const biayaStaples = params.tarifStaplesYasin * validOplah;
  const biayaSisir = params.tarifSisirYasin * validOplah;

  let biayaHardcoverKhusus = 0;
  let biayaPasangCover = 0;

  if (isHardcover) {
    const biayaBoard = params.tarifBoardHardcover * validOplah;
    const biayaCasingIn = params.tarifCasingInHardcover * validOplah;
    const biayaSkiblat = params.tarifSkiblat * validOplah;
    const biayaGembos = Math.ceil((validOplah / 12) + 2) * params.tarifEmbossFoilGembos;
    biayaHardcoverKhusus = biayaBoard + biayaCasingIn + biayaSkiblat + biayaGembos;
  } else {
    biayaPasangCover = params.tarifPasangCoverSoft * validOplah;
  }

  let biayaAksesoris = 0;
  if (opsiPitaRumbai) {
    biayaAksesoris += params.tarifPitaRumbaiPapercraft * validOplah;
  }
  if (opsiSikuEmas) {
    biayaAksesoris += params.tarifSikuSudutEmas * validOplah;
  }

  let biayaOpp = 0;
  if (opsiPlastikOpp) {
    biayaOpp = params.tarifPlastikOppYasin * validOplah;
  }

  // Total HPP
  const totalHpp = Math.round(
    biayaPrintCover +
    biayaIsi +
    biayaSisipanFoto +
    biayaSisipanTeks +
    biayaLaminasi +
    biayaSisip +
    biayaStaples +
    biayaSisir +
    biayaPasangCover +
    biayaHardcoverKhusus +
    biayaAksesoris +
    biayaOpp
  );

  const hppPerPcs = Math.round(totalHpp / validOplah);

  // Breakdown List
  const breakdown: YasinBreakdownItem[] = [
    {
      nama: `Cover ${tipeCover} (Print POD + Desain)`,
      nominal: Math.round(biayaPrintCover),
      pct: totalHpp > 0 ? (biayaPrintCover / totalHpp) * 100 : 0,
      keterangan: `${kebutuhanA3Cover} lbr A3+, ${isHardcover ? 'Art Paper 150' : 'Art Carton 230'}`,
    },
    {
      nama: `Blok Kitab Yasin (${jumlahHalamanIsi} Halaman Ready)`,
      nominal: Math.round(biayaIsi),
      pct: totalHpp > 0 ? (biayaIsi / totalHpp) * 100 : 0,
      keterangan: `@ Rp ${hargaIsiPerPcs.toLocaleString('id-ID')} x ${validOplah} buku`,
    },
  ];

  if (biayaSisipanFoto > 0) {
    breakdown.push({
      nama: `Sisipan Foto Almarhum (${lembarSisipanFoto} Lembar FC)`,
      nominal: Math.round(biayaSisipanFoto),
      pct: (biayaSisipanFoto / totalHpp) * 100,
      keterangan: `${kebutuhanA3SisipanFoto} lbr A3+ Full Color`,
    });
  }

  if (biayaSisipanTeks > 0) {
    breakdown.push({
      nama: `Sisipan Teks / Doa / Keluarga (${lembarSisipanKeluarga} Lembar)`,
      nominal: Math.round(biayaSisipanTeks),
      pct: (biayaSisipanTeks / totalHpp) * 100,
      keterangan: `${kebutuhanA3SisipanTeks} lbr A3+`,
    });
  }

  breakdown.push({
    nama: `Laminasi Cover (${laminasiCover})`,
    nominal: Math.round(biayaLaminasi),
    pct: (biayaLaminasi / totalHpp) * 100,
    keterangan: `Laminasi ${laminasiCover} premium tahan gores`,
  });

  if (isHardcover) {
    breakdown.push({
      nama: 'Struktur Hardcover (Board + Skiblat + Casing In + Gembos Emas)',
      nominal: Math.round(biayaHardcoverKhusus),
      pct: (biayaHardcoverKhusus / totalHpp) * 100,
      keterangan: 'Greyboard kokoh + lembaran skiblat + foil emas',
    });
  }

  const finishingJilidTotal = biayaSisip + biayaStaples + biayaSisir + biayaPasangCover;
  if (finishingJilidTotal > 0) {
    breakdown.push({
      nama: 'Jilid & Perakitan (Sisip, Staples Tengah, Potong Sisir)',
      nominal: Math.round(finishingJilidTotal),
      pct: (finishingJilidTotal / totalHpp) * 100,
      keterangan: 'Susun sisipan + kawat staples + rapikan sisi',
    });
  }

  if (biayaAksesoris > 0) {
    breakdown.push({
      nama: 'Aksesoris (Pita Pembatas Rumbai / Siku Sudut Emas)',
      nominal: Math.round(biayaAksesoris),
      pct: (biayaAksesoris / totalHpp) * 100,
      keterangan: 'Aksesoris pelengkap eksklusif',
    });
  }

  if (biayaOpp > 0) {
    breakdown.push({
      nama: 'Kemasan Plastik OPP Satuan',
      nominal: Math.round(biayaOpp),
      pct: (biayaOpp / totalHpp) * 100,
      keterangan: 'Perlindungan plastik per buku',
    });
  }

  // Summary Profit & Nego (Selaras dengan Sheet Harga Yasin 2026: pembulatan ke kelipatan ratusan terdekat)
  // Di Excel: =ROUNDUP(((G5 * margin) + G5), -2)
  const rawHpp = totalHpp / validOplah;
  const rawHargaJual = rawHpp * (1 + marginPct / 100);
  const hargaJualPerPcs = Math.ceil(rawHargaJual / 100) * 100;
  const totalHargaJual = hargaJualPerPcs * validOplah;
  const marginNominalPerPcs = hargaJualPerPcs - hppPerPcs;
  const totalProfit = totalHargaJual - totalHpp;

  const diskonNominalPerPcs = Math.round((hargaJualPerPcs * Math.max(0, Math.min(100, negoDiskonPct))) / 100);
  const hargaNegoPerPcs = Math.ceil((hargaJualPerPcs - diskonNominalPerPcs) / 10) * 10;
  const totalHargaNego = hargaNegoPerPcs * validOplah;
  const totalProfitNego = totalHargaNego - totalHpp;

  return {
    input,
    tebalPunggungCm: tebalPunggung,
    kebutuhanA3Cover,
    kebutuhanA3SisipanFoto,
    kebutuhanA3SisipanTeks,
    breakdown,
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
