// ponytail: definisi dan utilitas sinkronisasi Master Parameter Global untuk seluruh jenis produk

import { SimulatorMasterParams, DEFAULT_MASTER_PARAMS, DEFAULT_MASTER_PARAMS_KLEM } from './pricelist-simulator';
import { ManasikMasterParams, DEFAULT_MANASIK_PARAMS } from './manasik-calculator';
import { YasinMasterParams, DEFAULT_YASIN_PARAMS } from './yasin-calculator';
import { NotaMasterParams, DEFAULT_NOTA_PARAMS } from './nota-calculator';
import { BrosurMasterParams, DEFAULT_BROSUR_PARAMS } from './brosur-calculator';
import { LabelKhqMasterParams, DEFAULT_LABEL_KHQ_PARAMS } from './label-khq-calculator';
import { BukuTulisMasterParams, DEFAULT_BUKU_TULIS_PARAMS } from './buku-tulis-calculator';
import { StopmapMasterParams, DEFAULT_STOPMAP_PARAMS } from './stopmap-calculator';
import { SyahadahMasterParams, DEFAULT_SYAHADAH_PARAMS } from './syahadah-calculator';
import { RaportKalebMasterParams, DEFAULT_RAPORT_KALEB_PARAMS } from './raport-kaleb-calculator';
import { KopSuratMasterParams, DEFAULT_KOP_SURAT_PARAMS } from './kop-surat-calculator';
import { AmplopMasterParams, DEFAULT_AMPLOP_PARAMS } from './amplop-calculator';
import { SertifikatMasterParams, DEFAULT_SERTIFIKAT_PARAMS } from './sertifikat-calculator';
import { UndanganMasterParams, DEFAULT_UNDANGAN_PARAMS } from './undangan-calculator';
import { BukuTabunganNsMasterParams, DEFAULT_BUKU_TABUNGAN_NS_PARAMS } from './buku-tabungan-ns-calculator';
import { BukuTabunganSecurityMasterParams, DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS } from './buku-tabungan-security-calculator';
import { KartuKoperasiPromiseMasterParams, DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS } from './kartu-koperasi-promise-calculator';
import { LebelKartuObatMasterParams, DEFAULT_LEBEL_KARTU_OBAT_PARAMS } from './lebel-kartu-obat-calculator';
import { BukuSoftCoverMasterParams, DEFAULT_BUKU_SOFT_COVER_PARAMS } from './buku-soft-cover-calculator';
import { BukuSoftCover145x2025MasterParams, DEFAULT_BUKU_SOFT_COVER_145X2025_PARAMS } from './buku-soft-cover-145x2025-calculator';
import { BukuHardCover105x148MasterParams, DEFAULT_BUKU_HARD_COVER_105X148_PARAMS } from './buku-hard-cover-105x148-calculator';
import { PosterMasterParams, DEFAULT_POSTER_PARAMS } from './poster-calculator';
import { MajalahMasterParams, DEFAULT_MAJALAH_PARAMS } from './majalah-calculator';
import { StikerMasterParams, DEFAULT_STIKER_PARAMS } from './stiker-calculator';
import { BukuSoftCover105x148MasterParams, DEFAULT_BUKU_SOFT_COVER_105X148_PARAMS } from './buku-soft-cover-105x148-calculator';
import { BukuHardCover145x2025MasterParams, DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS } from './buku-hard-cover-145x2025-calculator';
import { BukuHardCover21x297MasterParams, DEFAULT_BUKU_HARD_COVER_21X297_PARAMS } from './buku-hard-cover-21x297-calculator';
import { KalenderKopMasterParams, DEFAULT_KALENDER_KOP_PARAMS } from './kalender-kop-calculator';
import { PackagingMasterParams, DEFAULT_PACKAGING_PARAMS } from './packaging-calculator';
import { PaperbagMasterParams, DEFAULT_PAPERBAG_PARAMS } from './paperbag-calculator';

export interface GlobalMasterParams {
  // 1. Mesin Cetak Offset Oliver (58 / 52)
  oliverPlatUnit: number;        // Rp 45.000 / plat (Kalender, Manasik, Brosur, Stopmap, Sertifikat, dll)
  oliverMinOngkos: number;       // Rp 90.000 (min 1000 drek) (Kalender, Manasik, Brosur, dll)
  oliverDrekOver: number;        // Rp 40 / drek (Kalender, Manasik, Brosur, dll)
  oliverTransport: number;       // Rp 100.000 (Kalender, Packaging)

  // 2. Mesin Cetak Offset Toko / Ryobi (1 Warna / Skala Kecil)
  ryobiPlatUnit: number;         // Rp 25.000 / plat (Nota, Buku Tabungan, Buku Mini)
  ryobiMinOngkos: number;        // Rp 50.000 (min 1000 drek) (Nota, Buku Tabungan, Buku Mini)
  ryobiDrekOver: number;         // Rp 35 / drek (Nota, Buku Tabungan, Buku Mini)

  // 3. Kertas Dasar & Bahan Baku
  tarifHvs70: number;            // Rp 15.700 / kg (Kalender, Nota, Buku Tulis, Buku Tabungan, dll)
  tarifAp120: number;            // Rp 17.400 / kg (Kalender, Brosur, Majalah isi)
  tarifAp150: number;            // Rp 17.400 / kg (Kalender, Buku Hardcover cover)
  tarifAc230Kg: number;          // Rp 15.100 / kg (Manasik, Stopmap, Buku Tulis, Buku Soft/Hard cover)
  tarifAc260Kg: number;          // Rp 15.500 / kg (Manasik, Syahadah, Sertifikat, Buku Tabungan)
  upKertasPct: number;           // 5% margin/ppn kertas dasar

  // 4. Mesin Print Digital POD A3+
  tarifPrintA3: number;          // Rp 2.500 / lembar A3+ (Manasik, Yasin, Buku, Sertifikat, dll)
  tarifPrintInter1Muka: number;  // Rp 1.800 / lembar A3+ (Brosur 1 muka, Buku Tabungan isi)
  tarifPrintInter2Muka: number;  // Rp 3.300 / lembar A3+ (Brosur 2 muka, Majalah isi)

  // 5. Tarif Laminasi Standar
  tarifLaminasiGlossyCm2: number; // Rp 0.35 / cm² (Manasik, Yasin, Brosur, Buku, Stopmap, Sertifikat)
  tarifLaminasiDoffCm2: number;   // Rp 0.40 / cm² (Manasik, Yasin, Brosur, Buku, Sertifikat)
  tarifUvVarnishCm2: number;      // Rp 0.11 / cm² (Manasik, Brosur, Buku)
  minLaminasi: number;            // Rp 50.000 (Manasik, Yasin, Brosur, Buku, dll)

  // 6. Finishing & Kemasan Standar
  tarifKardusBox: number;         // Rp 8.500 / box (Semua produk)
  tarifLakbanRoll: number;        // Rp 8.000 / roll (Semua produk)
  tarifPlastikOppPcs: number;     // Rp 92 / pcs (Manasik, Yasin, Undangan, Buku Tabungan)
  tarifSisirPcs: number;          // Rp 150 / pcs (Semua produk ber-finishing potong/sisir)
  tarifStaplesPcs: number;        // Rp 100 / pcs (Manasik, Yasin, Buku Tulis, Buku Tabungan)

  // 7. Jasa Desain & Margin Standar Perusahaan
  tarifDesainStandar: number;     // Rp 50.000 (Amplop, Kop Surat, Raport, Sertifikat, Cover Buku, dll)
  defaultMarginPct: number;       // 25% (Target margin dasar seluruh 30 produk)
  defaultNegoPct: number;         // 4% (Batas diskon nego dasar seluruh 30 produk)
}

export const DEFAULT_GLOBAL_PARAMS: GlobalMasterParams = {
  oliverPlatUnit: 45000,
  oliverMinOngkos: 90000,
  oliverDrekOver: 40,
  oliverTransport: 100000,

  ryobiPlatUnit: 25000,
  ryobiMinOngkos: 50000,
  ryobiDrekOver: 35,

  tarifHvs70: 15700,
  tarifAp120: 17400,
  tarifAp150: 17400,
  tarifAc230Kg: 15100,
  tarifAc260Kg: 15500,
  upKertasPct: 5,

  tarifPrintA3: 2500,
  tarifPrintInter1Muka: 1800,
  tarifPrintInter2Muka: 3300,

  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  tarifUvVarnishCm2: 0.11,
  minLaminasi: 50000,

  tarifKardusBox: 8500,
  tarifLakbanRoll: 8000,
  tarifPlastikOppPcs: 92,
  tarifSisirPcs: 150,
  tarifStaplesPcs: 100,

  tarifDesainStandar: 50000,
  defaultMarginPct: 25,
  defaultNegoPct: 4,
};

/**
 * Menyebarkan (propagate) nilai parameter global ke seluruh state parameter masing-masing produk
 */
export function applyGlobalParamsToAll(
  g: GlobalMasterParams,
  currSpiral: SimulatorMasterParams,
  currKlem: SimulatorMasterParams,
  currManasik: ManasikMasterParams,
  currYasin: YasinMasterParams,
  currNota: NotaMasterParams,
  currBrosur: BrosurMasterParams,
  currLabelKhq: LabelKhqMasterParams,
  currBukuTulis: BukuTulisMasterParams = DEFAULT_BUKU_TULIS_PARAMS,
  currStopmap: StopmapMasterParams = DEFAULT_STOPMAP_PARAMS,
  currSyahadah: SyahadahMasterParams = DEFAULT_SYAHADAH_PARAMS,
  currRaportKaleb: RaportKalebMasterParams = DEFAULT_RAPORT_KALEB_PARAMS,
  currKopSurat: KopSuratMasterParams = DEFAULT_KOP_SURAT_PARAMS,
  currAmplop: AmplopMasterParams = DEFAULT_AMPLOP_PARAMS,
  currSertifikat: SertifikatMasterParams = DEFAULT_SERTIFIKAT_PARAMS,
  currUndangan: UndanganMasterParams = DEFAULT_UNDANGAN_PARAMS,
  currBukuTabunganNs: BukuTabunganNsMasterParams = DEFAULT_BUKU_TABUNGAN_NS_PARAMS,
  currBukuTabunganSecurity: BukuTabunganSecurityMasterParams = DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS,
  currKartuKoperasiPromise: KartuKoperasiPromiseMasterParams = DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS,
  currLebelKartuObat: LebelKartuObatMasterParams = DEFAULT_LEBEL_KARTU_OBAT_PARAMS,
  currBukuSoftCover: BukuSoftCoverMasterParams = DEFAULT_BUKU_SOFT_COVER_PARAMS,
  currBukuSoftCover145x2025: BukuSoftCover145x2025MasterParams = DEFAULT_BUKU_SOFT_COVER_145X2025_PARAMS,
  currBukuHardCover105x148: BukuHardCover105x148MasterParams = DEFAULT_BUKU_HARD_COVER_105X148_PARAMS,
  currPoster: PosterMasterParams = DEFAULT_POSTER_PARAMS,
  currMajalah: MajalahMasterParams = DEFAULT_MAJALAH_PARAMS,
  currStiker: StikerMasterParams = DEFAULT_STIKER_PARAMS,
  currBukuSoftCover105x148: BukuSoftCover105x148MasterParams = DEFAULT_BUKU_SOFT_COVER_105X148_PARAMS,
  currBukuHardCover145x2025: BukuHardCover145x2025MasterParams = DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS,
  currBukuHardCover21x297: BukuHardCover21x297MasterParams = DEFAULT_BUKU_HARD_COVER_21X297_PARAMS,
  currKalenderKop: KalenderKopMasterParams = DEFAULT_KALENDER_KOP_PARAMS,
  currPackaging: PackagingMasterParams = DEFAULT_PACKAGING_PARAMS,
  currPaperbag: PaperbagMasterParams = DEFAULT_PAPERBAG_PARAMS
) {
  const nextSpiral: SimulatorMasterParams = {
    ...currSpiral,
    oliverPlatUnit: g.oliverPlatUnit,
    oliverMinOngkos: g.oliverMinOngkos,
    oliverDrekOver: g.oliverDrekOver,
    oliverTransport: g.oliverTransport,
    tarifHvs70: g.tarifHvs70,
    tarifAp120: g.tarifAp120,
    tarifAp150: g.tarifAp150,
    ppnMarginKertas: 1 + g.upKertasPct / 100,
    ppnHvs70: 1 + g.upKertasPct / 100,
    ppnAp120: 1 + g.upKertasPct / 100,
    ppnAp150: 1 + g.upKertasPct / 100,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextKlem: SimulatorMasterParams = {
    ...currKlem,
    oliverPlatUnit: g.oliverPlatUnit,
    oliverMinOngkos: g.oliverMinOngkos,
    oliverDrekOver: g.oliverDrekOver,
    oliverTransport: g.oliverTransport,
    tarifHvs70: g.tarifHvs70,
    tarifAp120: g.tarifAp120,
    tarifAp150: g.tarifAp150,
    ppnMarginKertas: 1 + g.upKertasPct / 100,
    ppnHvs70: 1 + g.upKertasPct / 100,
    ppnAp120: 1 + g.upKertasPct / 100,
    ppnAp150: 1 + g.upKertasPct / 100,
    tarifLakbanRoll: g.tarifLakbanRoll,
  };

  const nextManasik: ManasikMasterParams = {
    ...currManasik,
    tarifAc230Kg: g.tarifAc230Kg,
    tarifAc260Kg: g.tarifAc260Kg,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifKertasHvs70Kg: g.tarifHvs70,
    oliverMinOngkosCover: g.oliverMinOngkos,
    oliverPlatUnitCover: g.oliverPlatUnit,
    oliverDrekOverCover: g.oliverDrekOver,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    tarifUvVarnishCm2: g.tarifUvVarnishCm2,
    minLaminasi: g.minLaminasi,
    tarifDesainCover: g.tarifDesainStandar,
    tarifSisir: g.tarifSisirPcs,
    tarifStaplesPalu: g.tarifStaplesPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifPlastikOppPack: Math.round(g.tarifPlastikOppPcs * 100),
  };
  const nextYasin: YasinMasterParams = {
    ...currYasin,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    minLaminasi: g.minLaminasi,
    tarifDesainCover: g.tarifDesainStandar,
    tarifPlastikOppYasin: Math.round(g.tarifPlastikOppPcs),
    tarifSisirYasin: g.tarifSisirPcs,
    tarifStaplesYasin: Math.round(g.tarifStaplesPcs / 2),
  };

  const nextNota: NotaMasterParams = {
    ...currNota,
    tarifHvs70Kg: g.tarifHvs70,
    upHvsPct: g.upKertasPct,
    upNcrPct: g.upKertasPct,
    tarifPlatRyobi: g.ryobiPlatUnit,
    minOngkosCetakRyobi: g.ryobiMinOngkos,
    tarifDrekOverRyobi: g.ryobiDrekOver,
    tarifDesainNota: g.tarifDesainStandar,
  };

  const nextBrosur: BrosurMasterParams = {
    ...currBrosur,
    tarifArtPaperKg: g.tarifAp120,
    upKertasPct: g.upKertasPct,
    tarifPrintInter1Muka: g.tarifPrintInter1Muka,
    tarifPrintInter2Muka: g.tarifPrintInter2Muka,
    tarifPlatOliver: g.oliverPlatUnit,
    minOrderOliver: g.oliverMinOngkos,
    tarifDrekOliver: g.oliverDrekOver,
    tarifKardus: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossy: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoff: g.tarifLaminasiDoffCm2,
    tarifUvVarnish: g.tarifUvVarnishCm2,
    tarifDesainBrosur: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextLabelKhq: LabelKhqMasterParams = {
    ...currLabelKhq,
    tarifPrintA3: g.tarifPrintA3,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    minLaminasi: g.minLaminasi,
    tarifDesain: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextBukuTulis: BukuTulisMasterParams = {
    ...currBukuTulis,
    tarifArtCarton230Kg: g.tarifAc230Kg,
    tarifHvs70Kg: g.tarifHvs70,
    upArtCartonPct: g.upKertasPct,
    upHvsPct: g.upKertasPct,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifPrintIsiA3: g.tarifPrintA3,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    minLaminasi: g.minLaminasi,
    tarifSisirPerPcs: g.tarifSisirPcs,
    tarifStaplesPerPcs: g.tarifStaplesPcs,
    tarifPackingKardus: g.tarifKardusBox,
    tarifLakbanPerOrder: g.tarifLakbanRoll,
    tarifDesignCover: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextStopmap: StopmapMasterParams = {
    ...currStopmap,
    tarifArtCarton230Kg: g.tarifAc230Kg,
    upArtCartonPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    minLaminasi: g.minLaminasi,
    tarifSisirPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifDesign: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextSyahadah: SyahadahMasterParams = {
    ...currSyahadah,
    tarifKertasLinenKg: g.tarifAc260Kg,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifRyobi: g.ryobiMinOngkos,
    tarifPlatOliver: g.oliverPlatUnit,
    minOliver: g.oliverMinOngkos,
    drekOliver: g.oliverDrekOver,
    tarifSisirPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifDesign: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextRaportKaleb: RaportKalebMasterParams = {
    ...currRaportKaleb,
    tarifKertasKalebKg: g.tarifAc230Kg,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifFoilPerPcs: 450,
    tarifSisir: g.tarifSisirPcs,
    tarifKardus: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifDesign: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextKopSurat: KopSuratMasterParams = {
    ...currKopSurat,
    tarifKertasHvsKg: g.tarifHvs70,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifRyobi: g.ryobiMinOngkos,
    tarifPlatOliver: g.oliverPlatUnit,
    minOliver: g.oliverMinOngkos,
    drekOliver: g.oliverDrekOver,
    tarifPotongPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifDesign: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextAmplop: AmplopMasterParams = {
    ...currAmplop,
    tarifKertasHvsKg: g.tarifHvs70,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifRyobi: g.ryobiMinOngkos,
    tarifPlatOliver: g.oliverPlatUnit,
    minOliver: g.oliverMinOngkos,
    drekOliver: g.oliverDrekOver,
    tarifLipatLemPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifDesign: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextSertifikat: SertifikatMasterParams = {
    ...currSertifikat,
    tarifKertasArtCartonKg: g.tarifAc260Kg,
    tarifKertasIvoryKg: g.tarifAc260Kg,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifPlatOliver: g.oliverPlatUnit,
    minOliver: g.oliverMinOngkos,
    drekOliver: g.oliverDrekOver,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    minLaminasi: g.minLaminasi,
    tarifPotongPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifDesign: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextUndangan: UndanganMasterParams = {
    ...currUndangan,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    tarifPlatOliver: g.oliverPlatUnit,
    minOliver: g.oliverMinOngkos,
    drekOliver: g.oliverDrekOver,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    minLaminasi: g.minLaminasi,
    tarifSisirPerPcs: g.tarifSisirPcs,
    tarifPlastikOppPerPcs: g.tarifPlastikOppPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifDesign: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextBukuTabunganNs: BukuTabunganNsMasterParams = {
    ...currBukuTabunganNs,
    tarifKertasCoverKg: g.tarifAc260Kg,
    upKertasCoverPct: g.upKertasPct,
    tarifKertasIsiKg: g.tarifHvs70,
    upKertasIsiPct: g.upKertasPct,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifPrintIsiA3: g.tarifPrintInter1Muka,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    minLaminasi: g.minLaminasi,
    tarifSusunLipatPerPcs: g.tarifSisirPcs,
    tarifJahitPerPcs: g.tarifStaplesPcs * 5,
    tarifPoundPerPcs: g.tarifSisirPcs * 2,
    tarifPlastikSringPerPcs: g.tarifPlastikOppPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifDesignCover: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextBukuTabunganSecurity: BukuTabunganSecurityMasterParams = {
    ...currBukuTabunganSecurity,
    tarifKertasCoverKg: g.tarifAc260Kg,
    upKertasCoverPct: g.upKertasPct,
    tarifKertasIsiKg: g.tarifHvs70,
    upKertasIsiPct: g.upKertasPct,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifPrintIsiA3: g.tarifPrintInter1Muka,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    minLaminasi: g.minLaminasi,
    tarifSusunLipatPerPcs: g.tarifSisirPcs,
    tarifJahitPerPcs: g.tarifStaplesPcs * 5,
    tarifPoundPerPcs: g.tarifSisirPcs * 2,
    tarifPlastikSringPerPcs: g.tarifPlastikOppPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifDesignCover: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextKartuKoperasiPromise: KartuKoperasiPromiseMasterParams = {
    ...currKartuKoperasiPromise,
    tarifKertasKg: g.tarifAc260Kg,
    upKertasPct: g.upKertasPct,
    tarifDesign: g.tarifDesainStandar,
    tarifPlatePerPlat: g.oliverPlatUnit,
    tarifCetakMinPerPlat: g.oliverMinOngkos,
    tarifDrek: g.oliverDrekOver,
    tarifPoundPerUnit: g.tarifSisirPcs * 0.94,
    tarifSisirPer500: g.tarifSisirPcs * 66,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextLebelKartuObat: LebelKartuObatMasterParams = {
    ...currLebelKartuObat,
    tarifKertasKg: g.tarifHvs70,
    upKertasPct: g.upKertasPct,
    tarifDesain: g.tarifDesainStandar,
    tarifPlatePerPlat: g.oliverPlatUnit,
    tarifCetakMinPerPlat: g.oliverMinOngkos,
    tarifDrek: g.oliverDrekOver,
    tarifSisirPer500: g.tarifSisirPcs * 66,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextBukuSoftCover: BukuSoftCoverMasterParams = {
    ...currBukuSoftCover,
    tarifKertasHvs70Kg: g.tarifHvs70,
    upKertasIsiPct: g.upKertasPct,
    tarifOliverPlatUnit: g.oliverPlatUnit,
    tarifOliverMinIsi: g.oliverMinOngkos,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    tarifUvVarnishCm2: g.tarifUvVarnishCm2,
    minLaminasi: g.minLaminasi,
    tarifSisirPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifDesainCover: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextBukuSoftCover145x2025: BukuSoftCover145x2025MasterParams = {
    ...currBukuSoftCover145x2025,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    tarifPlateCoverOliver: g.oliverPlatUnit,
    minOngkosCoverOliver: g.oliverMinOngkos,
    drekCoverOliver: g.oliverDrekOver,
    tarifKertasHvs70Kg: g.tarifHvs70,
    tarifPlateIsiOliver: g.oliverPlatUnit,
    minOngkosIsiOliver: g.oliverMinOngkos,
    drekIsiOliver: g.oliverDrekOver,
    tarifPlateIsiRyobi: g.ryobiPlatUnit,
    minOngkosIsiRyobi: g.ryobiMinOngkos,
    drekIsiRyobi: g.ryobiDrekOver,
    tarifSisirPerPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    tarifUvVarnishCm2: g.tarifUvVarnishCm2,
    minLaminasi: g.minLaminasi,
    tarifDesainCover: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextBukuHardCover105x148: BukuHardCover105x148MasterParams = {
    ...currBukuHardCover105x148,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifKertasAp150Kg: g.tarifAp150,
    tarifPlateCoverOliver: g.oliverPlatUnit,
    minOngkosCoverOliver: g.oliverMinOngkos,
    drekCoverOliver: g.oliverDrekOver,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    tarifKertasHvs70Kg: g.tarifHvs70,
    tarifPlateIsiOliver: g.oliverPlatUnit,
    minOngkosIsiOliver: g.oliverMinOngkos,
    drekIsiOliver: g.oliverDrekOver,
    tarifPlateIsiRyobi: g.ryobiPlatUnit,
    minOngkosIsiRyobi: g.ryobiMinOngkos,
    drekIsiRyobi: g.ryobiDrekOver,
    tarifSisirPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    minLaminasi: g.minLaminasi,
    tarifDesainCover: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextPoster: PosterMasterParams = {
    ...currPoster,
    tarifArtCarton230Kg: g.tarifAc230Kg,
    upKertasPct: g.upKertasPct,
    tarifPrintA3: g.tarifPrintA3,
    oliverPlatUnit: g.oliverPlatUnit,
    oliverMinOngkos: g.oliverMinOngkos,
    oliverDrekOver: g.oliverDrekOver,
    smPlatUnit: 100000,
    smMinOngkos: 250000,
    smDrekOver: 100,
    tarifSisirPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    tarifUvVarnishCm2: g.tarifUvVarnishCm2,
    minLaminasi: g.minLaminasi,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextMajalah: MajalahMasterParams = {
    ...currMajalah,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    tarifPlateCoverOliver: g.oliverPlatUnit,
    minOngkosCoverOliver: g.oliverMinOngkos,
    drekCoverOliver: g.oliverDrekOver,
    tarifKertasAp120Kg: g.tarifAp120,
    tarifPrintIsiA3: g.tarifPrintInter2Muka,
    tarifPlateIsiOliver: g.oliverPlatUnit,
    minOngkosIsiOliver: g.oliverMinOngkos,
    drekIsiOliver: g.oliverDrekOver,
    tarifSisirPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    tarifUvVarnishCm2: g.tarifUvVarnishCm2,
    minLaminasi: g.minLaminasi,
    tarifDesainCover: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextStiker: StikerMasterParams = {
    ...currStiker,
    tarifStikerVinylA3: g.tarifPrintA3,
    tarifRajangPerLbr: 50,
    tarifPackingKardus: g.tarifKardusBox,
    tarifDesainStiker: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextBukuSoftCover105x148: BukuSoftCover105x148MasterParams = {
    ...currBukuSoftCover105x148,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    tarifPlateCoverOliver: g.oliverPlatUnit,
    minOngkosCoverOliver: g.oliverMinOngkos,
    drekCoverOliver: g.oliverDrekOver,
    tarifKertasHvs70Kg: g.tarifHvs70,
    tarifPlateIsiOliver: g.oliverPlatUnit,
    minOngkosIsiOliver: g.oliverMinOngkos,
    drekIsiOliver: g.oliverDrekOver,
    tarifPlateIsiRyobi: g.ryobiPlatUnit,
    minOngkosIsiRyobi: g.ryobiMinOngkos,
    drekIsiRyobi: g.ryobiDrekOver,
    tarifSisirPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    tarifUvVarnishCm2: g.tarifUvVarnishCm2,
    minLaminasi: g.minLaminasi,
    tarifDesainCover: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextBukuHardCover145x2025: BukuHardCover145x2025MasterParams = {
    ...currBukuHardCover145x2025,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifKertasAp150Kg: g.tarifAp150,
    tarifPlateCoverOliver: g.oliverPlatUnit,
    minOngkosCoverOliver: g.oliverMinOngkos,
    drekCoverOliver: g.oliverDrekOver,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    tarifKertasHvs70Kg: g.tarifHvs70,
    tarifPlateIsiOliver: g.oliverPlatUnit,
    minOngkosIsiOliver: g.oliverMinOngkos,
    drekIsiOliver: g.oliverDrekOver,
    tarifPlateIsiRyobi: g.ryobiPlatUnit,
    minOngkosIsiRyobi: g.ryobiMinOngkos,
    drekIsiRyobi: g.ryobiDrekOver,
    tarifSisirPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    minLaminasi: g.minLaminasi,
    tarifDesainCover: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextBukuHardCover21x297: BukuHardCover21x297MasterParams = {
    ...currBukuHardCover21x297,
    tarifPrintCoverA3: g.tarifPrintA3,
    tarifKertasAp150Kg: g.tarifAp150,
    tarifPlateCoverOliver: g.oliverPlatUnit,
    minOngkosCoverOliver: g.oliverMinOngkos,
    drekCoverOliver: g.oliverDrekOver,
    tarifKertasAc230Kg: g.tarifAc230Kg,
    tarifKertasHvs70Kg: g.tarifHvs70,
    tarifPlateIsiOliver: g.oliverPlatUnit,
    minOngkosIsiOliver: g.oliverMinOngkos,
    drekIsiOliver: g.oliverDrekOver,
    tarifSisirPcs: g.tarifSisirPcs,
    tarifKardusBox: g.tarifKardusBox,
    tarifLakbanRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossyCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffCm2: g.tarifLaminasiDoffCm2,
    minLaminasi: g.minLaminasi,
    tarifDesainCover: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextKalenderKop: KalenderKopMasterParams = {
    ...currKalenderKop,
    tarifPackingKardus: g.tarifKardusBox,
    tarifDesainKop: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextPackaging: PackagingMasterParams = {
    ...currPackaging,
    tarifPlatOliverPerWarna: g.oliverPlatUnit,
    oliverMinOngkosPerWarna: g.oliverMinOngkos,
    oliverDrekOverPerWarna: g.oliverDrekOver,
    biayaTransport: g.oliverTransport,
    tarifLakbanPerRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossyPerCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffPerCm2: g.tarifLaminasiDoffCm2,
    minBiayaLaminasi: g.minLaminasi,
    biayaDesain: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  const nextPaperbag: PaperbagMasterParams = {
    ...currPaperbag,
    tarifPlatOliverPerWarna: g.oliverPlatUnit,
    oliverMinOngkosPerWarna: g.oliverMinOngkos,
    oliverDrekOverPerWarna: g.oliverDrekOver,
    tarifLakbanPerRoll: g.tarifLakbanRoll,
    tarifLaminasiGlossyPerCm2: g.tarifLaminasiGlossyCm2,
    tarifLaminasiDoffPerCm2: g.tarifLaminasiDoffCm2,
    minBiayaLaminasi: g.minLaminasi,
    biayaDesain: g.tarifDesainStandar,
    marginDefaultPct: g.defaultMarginPct,
    negoDefaultPct: g.defaultNegoPct,
  };

  return {
    nextSpiral,
    nextKlem,
    nextManasik,
    nextYasin,
    nextNota,
    nextBrosur,
    nextLabelKhq,
    nextBukuTulis,
    nextStopmap,
    nextSyahadah,
    nextRaportKaleb,
    nextKopSurat,
    nextAmplop,
    nextSertifikat,
    nextUndangan,
    nextBukuTabunganNs,
    nextBukuTabunganSecurity,
    nextKartuKoperasiPromise,
    nextLebelKartuObat,
    nextBukuSoftCover,
    nextBukuSoftCover145x2025,
    nextBukuHardCover105x148,
    nextPoster,
    nextMajalah,
    nextStiker,
    nextBukuSoftCover105x148,
    nextBukuHardCover145x2025,
    nextBukuHardCover21x297,
    nextKalenderKop,
    nextPackaging,
    nextPaperbag,
  };
}
