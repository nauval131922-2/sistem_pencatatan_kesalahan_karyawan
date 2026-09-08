// ponytail: kalkulator dan master parameter nota 1 warna (03. Pricelist Nota 1 Warna)

export interface NotaMasterParams {
  // 1. Bahan Kertas (HVS & NCR per rim folio)
  tarifHvs70Kg: number; // Rp 15.700 per kg
  upHvsPct: number; // 7%
  tarifNcrTopRim: number; // Rp 65.500 per rim (dengan up 5% = 68.775)
  tarifNcrMiddleRim: number; // Rp 65.500 per rim (dengan up 5% = 68.775)
  tarifNcrBottomRim: number; // Rp 62.000 per rim (dengan up 5% = 65.100)
  upNcrPct: number; // 5%

  // 2. Mesin Cetak Toko / Ryobi (1 Warna / 2 Warna)
  tarifPlatRyobi: number; // Rp 10.000 per plat
  minOngkosCetakRyobi: number; // Rp 15.000 (min 500 drek)
  tarifDrekOverRyobi: number; // Rp 30 per drek over
  tarifDesainNota: number; // Rp 0 (Standar Tanpa Desain)

  // 3. Finishing & Jilid per Rim Rangkap
  tarifKertasSamson: number; // Rp 1.600 per rim rangkap
  tarifKertasBoard: number; // Rp 1.250 per rim rangkap
  tarifSusunKomplit: number; // Rp 2.500 per rim rangkap
  tarifStaplesNota: number; // Rp 1.500 per rim rangkap
  tarifLemNgetruk: number; // Rp 1.000 per rim rangkap
  tarifSisirNota: number; // Rp 5.000 per rim rangkap
  tarifPorporasiPerRim: number; // Rp 5.000 per rim rangkap
  tarifNomoratorPerRim: number; // Rp 10.000 per rim rangkap
}

export const DEFAULT_NOTA_PARAMS: NotaMasterParams = {
  tarifHvs70Kg: 15700,
  upHvsPct: 7,
  tarifNcrTopRim: 65500,
  tarifNcrMiddleRim: 65500,
  tarifNcrBottomRim: 62000,
  upNcrPct: 5,

  tarifPlatRyobi: 10000,
  minOngkosCetakRyobi: 15000,
  tarifDrekOverRyobi: 30,
  tarifDesainNota: 0,

  tarifKertasSamson: 1600,
  tarifKertasBoard: 1250,
  tarifSusunKomplit: 2500,
  tarifStaplesNota: 1500,
  tarifLemNgetruk: 1000,
  tarifSisirNota: 5000,
  tarifPorporasiPerRim: 5000,
  tarifNomoratorPerRim: 10000,
};

export type NotaRangkapType = 1 | 2 | 3 | 4;
export type NotaUkuranType =
  | 'Folio (21.5 x 33)'
  | '1/2 Folio (16.5 x 21.5)'
  | '1/3 Folio (11 x 21.5)'
  | '1/4 Folio (10.7 x 16.5)'
  | '1/6 Folio (10.7 x 11)'
  | '1/8 Folio (10.75 x 8.25)';

export interface NotaSimulatorInput {
  oplahRim: number; // Jumlah rim (1 - 50 rim)
  rangkap: NotaRangkapType; // 1, 2, 3, 4 rangkap
  ukuran: NotaUkuranType;
  jumlahWarna: 1 | 2; // 1 Warna / 2 Warna
  opsiPorporasi: boolean;
  opsiNomorator: boolean;
  marginPct: number; // Default 30%
  negoDiskonPct: number; // Default 4%
}

export interface NotaBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface NotaSimulatorResult {
  input: NotaSimulatorInput;
  jumlahBukuBendel: number;
  totalLembarFolio: number;
  jumlahPlat: number;
  breakdown: NotaBreakdownItem[];
  summary: {
    totalHpp: number;
    hppPerRim: number;
    hppPerBuku: number;
    marginNominalPerRim: number;
    totalHargaJual: number;
    hargaJualPerRim: number;
    hargaJualPerBuku: number;
    totalHargaNego: number;
    hargaNegoPerRim: number;
    hargaNegoPerBuku: number;
    totalProfit: number;
    totalProfitNego: number;
  };
}

// Konversi pembagi ukuran terhadap 1 Plano / Folio
export function getNotaUkuranDivider(ukuran: NotaUkuranType): number {
  switch (ukuran) {
    case 'Folio (21.5 x 33)':
      return 1;
    case '1/2 Folio (16.5 x 21.5)':
      return 2;
    case '1/3 Folio (11 x 21.5)':
      return 3;
    case '1/4 Folio (10.7 x 16.5)':
      return 4;
    case '1/6 Folio (10.7 x 11)':
      return 6;
    case '1/8 Folio (10.75 x 8.25)':
      return 8;
    default:
      return 1;
  }
}

export function calculateNotaSimulator(
  input: NotaSimulatorInput,
  rawParams: NotaMasterParams = DEFAULT_NOTA_PARAMS
): NotaSimulatorResult {
  const params: NotaMasterParams = { ...DEFAULT_NOTA_PARAMS, ...(rawParams || {}) };
  const validOplahRim = Math.max(1, input.oplahRim);
  const rangkap = input.rangkap;
  const divider = getNotaUkuranDivider(input.ukuran);
  const jumlahWarna = input.jumlahWarna || 1;

  // Total lembar folio = oplahRim * rangkap * 500 lembar
  const totalLembarFolio = validOplahRim * rangkap * 500;
  // 1 rim folio isi 500 lembar. Buku bendel = (totalLembarFolio / 100 lembar per buku) * divider
  // Atau standar: 1 rim folio = 10 buku isi 50 set (untuk 2/3 rangkap) atau 5 buku isi 100 set (1 rangkap)
  const setPerBuku = rangkap === 1 ? 100 : 50;
  const totalSet = validOplahRim * 500;
  const jumlahBukuBendel = (totalSet / setPerBuku) * divider;

  // 1. Biaya Kertas Isi Sesuai Rumus Master!D11:
  let hargaKertasPerRim = 0;
  if (rangkap === 1) {
    // Kertas HVS 70: rumus berat (21.5 * 33 * 70)/20000 * 15700 * (1 + 7%) = 41.716,11675
    const beratRim = (21.5 * 33 * 70) / 20000;
    const hargaPerKgNet = params.tarifHvs70Kg * (1 + params.upHvsPct / 100);
    hargaKertasPerRim = beratRim * hargaPerKgNet;
  } else if (rangkap === 2) {
    // NCR 2 Rangkap: Top (65.500 * 1.05 = 68.775) + Bottom (62.000 * 1.05 = 65.100) = 133.875 per rim pesanan
    const top = params.tarifNcrTopRim * (1 + params.upNcrPct / 100);
    const bottom = params.tarifNcrBottomRim * (1 + params.upNcrPct / 100);
    hargaKertasPerRim = top + bottom;
  } else if (rangkap === 3) {
    // NCR 3 Rangkap: Top + Middle + Bottom = 68.775 + 68.775 + 65.100 = 202.650 per rim pesanan
    const top = params.tarifNcrTopRim * (1 + params.upNcrPct / 100);
    const middle = params.tarifNcrMiddleRim * (1 + params.upNcrPct / 100);
    const bottom = params.tarifNcrBottomRim * (1 + params.upNcrPct / 100);
    hargaKertasPerRim = top + middle + bottom;
  } else {
    // NCR 4 Rangkap: Top + 2 Middle + Bottom
    const top = params.tarifNcrTopRim * (1 + params.upNcrPct / 100);
    const middle = params.tarifNcrMiddleRim * (1 + params.upNcrPct / 100);
    const bottom = params.tarifNcrBottomRim * (1 + params.upNcrPct / 100);
    hargaKertasPerRim = top + middle * 2 + bottom;
  }

  const biayaKertas = Math.round(hargaKertasPerRim * validOplahRim);

  // 2. Desain & Plat
  // Di Excel Sheet BUKU cell V: jumlah plat ditentukan oleh jumlah warna desain (Top, Middle, Bottom menggunakan plat yang sama)
  const biayaDesain = params.tarifDesainNota;
  const jumlahPlat = jumlahWarna;
  const biayaPlat = jumlahPlat * params.tarifPlatRyobi;

  // 3. Ongkos Cetak Mesin Ryobi (1 Muka)
  // Total lembar folio dicetak = validOplahRim * rangkap * 500
  // Rumus Excel cell Z7: (Q7*V7) - (V7*500) di mana Q7 = lembar cetak folio, V7 = jumlah warna
  const totalPutaranCetak = totalLembarFolio * jumlahWarna;
  const putaranMinOrder = jumlahWarna * 500;
  const cetakMinOrder = jumlahWarna * params.minOngkosCetakRyobi;
  const putaranOver = Math.max(0, totalPutaranCetak - putaranMinOrder);
  const biayaCetakOver = putaranOver * params.tarifDrekOverRyobi;
  const biayaCetakTotal = cetakMinOrder + biayaCetakOver;
  // 4. Finishing per Rim Rangkap (validOplahRim * rangkap)
  const totalVolumeRimRangkap = validOplahRim * rangkap;
  const biayaSamson = params.tarifKertasSamson * totalVolumeRimRangkap;
  const biayaBoard = params.tarifKertasBoard * totalVolumeRimRangkap;
  const biayaSusun = params.tarifSusunKomplit * totalVolumeRimRangkap;
  const biayaStaples = params.tarifStaplesNota * totalVolumeRimRangkap;
  const biayaLem = params.tarifLemNgetruk * totalVolumeRimRangkap;
  const biayaSisir = params.tarifSisirNota * totalVolumeRimRangkap;

  const biayaPorporasi = input.opsiPorporasi ? params.tarifPorporasiPerRim * totalVolumeRimRangkap : 0;
  const biayaNomorator = input.opsiNomorator ? params.tarifNomoratorPerRim * totalVolumeRimRangkap : 0;

  const totalFinishing =
    biayaSamson +
    biayaBoard +
    biayaSusun +
    biayaStaples +
    biayaLem +
    biayaSisir +
    biayaPorporasi +
    biayaNomorator;

  // Total HPP
  // Total HPP & HPP Per Rim (Di Excel cell AT7: AS7 / (H7 * rangkap))
  const totalHpp = Math.round(biayaKertas + biayaDesain + biayaPlat + biayaCetakTotal + totalFinishing);
  const hppPerRim = Math.round(totalHpp / (validOplahRim * rangkap));
  const hppPerBuku = Math.round(totalHpp / Math.max(1, jumlahBukuBendel));
  // Breakdown Table Items
  const breakdown: NotaBreakdownItem[] = [
    {
      nama: `Bahan Kertas Isi (${rangkap === 1 ? 'HVS 70 gsm' : `NCR 55 gsm ${rangkap} Ply`})`,
      nominal: biayaKertas,
      pct: totalHpp > 0 ? (biayaKertas / totalHpp) * 100 : 0,
      keterangan: `@ Rp ${Math.round(hargaKertasPerRim).toLocaleString('id-ID')} x ${validOplahRim} rim`,
    },
    {
      nama: `Plat CTP Ryobi (${jumlahPlat} Plat Cetak)`,
      nominal: biayaPlat,
      pct: totalHpp > 0 ? (biayaPlat / totalHpp) * 100 : 0,
      keterangan: `${jumlahPlat} plat cetak @ Rp ${params.tarifPlatRyobi.toLocaleString('id-ID')}`,
    },
    {
      nama: `Ongkos Cetak Mesin Ryobi (${totalPutaranCetak.toLocaleString('id-ID')} Putaran)`,
      nominal: biayaCetakTotal,
      pct: totalHpp > 0 ? (biayaCetakTotal / totalHpp) * 100 : 0,
      keterangan: `Min order Rp ${cetakMinOrder.toLocaleString('id-ID')}${biayaCetakOver > 0 ? ` + Over Rp ${biayaCetakOver.toLocaleString('id-ID')}` : ''}`,
    },
    {
      nama: 'Cover Samson & Alas Kertas Board',
      nominal: Math.round(biayaSamson + biayaBoard),
      pct: totalHpp > 0 ? ((biayaSamson + biayaBoard) / totalHpp) * 100 : 0,
      keterangan: 'Pelindung sampul cokelat samson + tatakan karton tebal',
    },
    {
      nama: 'Perakitan Buku (Susun Komplit, Staples & Lem Ngetruk)',
      nominal: Math.round(biayaSusun + biayaStaples + biayaLem),
      pct: totalHpp > 0 ? ((biayaSusun + biayaStaples + biayaLem) / totalHpp) * 100 : 0,
      keterangan: 'Jilid staples samping kuat & blok lem',
    },
    {
      nama: 'Potong Sisir Sisi Bersih',
      nominal: Math.round(biayaSisir),
      pct: totalHpp > 0 ? (biayaSisir / totalHpp) * 100 : 0,
      keterangan: 'Perapihan sisi nota sesuai potongan ukuran',
    },
  ];

  if (biayaPorporasi > 0) {
    breakdown.push({
      nama: 'Porporasi (Garis Sobekan Putus-putus)',
      nominal: Math.round(biayaPorporasi),
      pct: (biayaPorporasi / totalHpp) * 100,
      keterangan: `@ Rp ${params.tarifPorporasiPerRim.toLocaleString('id-ID')} x ${totalVolumeRimRangkap} rim`,
    });
  }

  if (biayaNomorator > 0) {
    breakdown.push({
      nama: 'Nomorator (Penomoran Seri Otomatis)',
      nominal: Math.round(biayaNomorator),
      pct: (biayaNomorator / totalHpp) * 100,
      keterangan: `@ Rp ${params.tarifNomoratorPerRim.toLocaleString('id-ID')} x ${totalVolumeRimRangkap} rim`,
    });
  }

  // Margin & Harga Jual
  // Margin & Harga Jual (Sesuai Excel cell AU7, AW7, AY7):
  // AT = HPP per rim kertas = totalHpp / (validOplahRim * rangkap)
  // AW = Total Harga = (AT * (1 + margin%)) * validOplahRim
  // AY = Harga per Rim = ROUNDUP(AW / validOplahRim, -1)
  const marginPct = Math.max(0, input.marginPct);
  const rawHppPerRim = totalHpp / (validOplahRim * rangkap);
  const rawHargaJualPerRim = rawHppPerRim * (1 + marginPct / 100);
  const hargaJualPerRim = Math.ceil(rawHargaJualPerRim / 10) * 10; // ROUNDUP kelipatan 10
  const marginNominalPerRim = hargaJualPerRim - hppPerRim;
  const totalHargaJual = hargaJualPerRim * validOplahRim;
  const hargaJualPerBuku = Math.round(totalHargaJual / Math.max(1, jumlahBukuBendel));
  const totalProfit = totalHargaJual - totalHpp;

  // Nego Diskon
  const negoDiskonPct = Math.max(0, Math.min(100, input.negoDiskonPct));
  const diskonNominalPerRim = Math.round((hargaJualPerRim * negoDiskonPct) / 100);
  const hargaNegoPerRim = Math.floor((hargaJualPerRim - diskonNominalPerRim) / 100) * 100;
  const totalHargaNego = hargaNegoPerRim * validOplahRim;
  const hargaNegoPerBuku = Math.round(totalHargaNego / Math.max(1, jumlahBukuBendel));
  const totalProfitNego = totalHargaNego - totalHpp;

  return {
    input,
    jumlahBukuBendel,
    totalLembarFolio,
    jumlahPlat,
    breakdown,
    summary: {
      totalHpp,
      hppPerRim,
      hppPerBuku,
      marginNominalPerRim,
      totalHargaJual,
      hargaJualPerRim,
      hargaJualPerBuku,
      totalHargaNego,
      hargaNegoPerRim,
      hargaNegoPerBuku,
      totalProfit,
      totalProfitNego,
    },
  };
}
