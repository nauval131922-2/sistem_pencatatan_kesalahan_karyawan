'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Loader2,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  X,
  LayoutGrid,
  TableProperties,
  Layers,
  Calculator,
  Database,
  BookOpen,
  Calendar,
  Bookmark,
  Globe,
} from 'lucide-react';
import PricelistExcelUpload from './PricelistExcelUpload';
import PricelistSimulator, { SavedSimulationItem } from './PricelistSimulator';
import PricelistMasterParameter from './PricelistMasterParameter';
import ManasikMasterParameter from './ManasikMasterParameter';
import YasinMasterParameter from './YasinMasterParameter';
import ManasikSimulator, { SavedManasikSimulationItem } from './ManasikSimulator';
import YasinSimulator, { SavedYasinSimulationItem } from './YasinSimulator';
import ManasikMatrixView from './ManasikMatrixView';
import YasinMatrixView from './YasinMatrixView';
import NotaMasterParameter from './NotaMasterParameter';
import NotaSimulator, { SavedNotaSimulationItem } from './NotaSimulator';
import NotaMatrixView from './NotaMatrixView';
import BrosurMasterParameter from './BrosurMasterParameter';
import BrosurSimulator, { SavedBrosurSimulationItem } from './BrosurSimulator';
import BrosurMatrixView from './BrosurMatrixView';
import LabelKhqMasterParameter from './LabelKhqMasterParameter';
import LabelKhqSimulator, { SavedLabelKhqSimulationItem } from './LabelKhqSimulator';
import LabelKhqMatrixView from './LabelKhqMatrixView';
import BukuTulisMasterParameter from './BukuTulisMasterParameter';
import BukuTulisSimulator, { SavedBukuTulisSimulationItem } from './BukuTulisSimulator';
import BukuTulisMatrixView from './BukuTulisMatrixView';
import StopmapMasterParameter from './StopmapMasterParameter';
import StopmapSimulator, { SavedStopmapSimulationItem } from './StopmapSimulator';
import StopmapMatrixView from './StopmapMatrixView';
import SyahadahMasterParameter from './SyahadahMasterParameter';
import SyahadahSimulator, { SavedSyahadahSimulationItem } from './SyahadahSimulator';
import SyahadahMatrixView from './SyahadahMatrixView';
import RaportKalebMasterParameter from './RaportKalebMasterParameter';
import RaportKalebSimulator, { SavedRaportKalebSimulationItem } from './RaportKalebSimulator';
import RaportKalebMatrixView from './RaportKalebMatrixView';
import KopSuratMasterParameter from './KopSuratMasterParameter';
import KopSuratSimulator, { SavedKopSuratSimulationItem } from './KopSuratSimulator';
import KopSuratMatrixView from './KopSuratMatrixView';
import AmplopMasterParameter from './AmplopMasterParameter';
import AmplopSimulator, { SavedAmplopSimulationItem } from './AmplopSimulator';
import AmplopMatrixView from './AmplopMatrixView';
import SertifikatMasterParameter from './SertifikatMasterParameter';
import SertifikatSimulator, { SavedSertifikatSimulationItem } from './SertifikatSimulator';
import SertifikatMatrixView from './SertifikatMatrixView';
import UndanganMasterParameter from './UndanganMasterParameter';
import UndanganSimulator, { SavedUndanganSimulationItem } from './UndanganSimulator';
import UndanganMatrixView from './UndanganMatrixView';
import BukuTabunganNsMasterParameter from './BukuTabunganNsMasterParameter';
import BukuTabunganNsSimulator, { SavedBukuTabunganNsSimulationItem } from './BukuTabunganNsSimulator';
import BukuTabunganNsMatrixView from './BukuTabunganNsMatrixView';
import BukuTabunganSecurityMasterParameter from './BukuTabunganSecurityMasterParameter';
import BukuTabunganSecuritySimulator, { SavedBukuTabunganSecuritySimulationItem } from './BukuTabunganSecuritySimulator';
import BukuTabunganSecurityMatrixView from './BukuTabunganSecurityMatrixView';
import KartuKoperasiPromiseMasterParameter from './KartuKoperasiPromiseMasterParameter';
import KartuKoperasiPromiseSimulator, { SavedKartuKoperasiPromiseSimulationItem } from './KartuKoperasiPromiseSimulator';
import KartuKoperasiPromiseMatrixView from './KartuKoperasiPromiseMatrixView';
import LebelKartuObatMasterParameter from './LebelKartuObatMasterParameter';
import LebelKartuObatSimulator, { SavedLebelKartuObatSimulationItem } from './LebelKartuObatSimulator';
import LebelKartuObatMatrixView from './LebelKartuObatMatrixView';
import BukuSoftCoverMasterParameter from './BukuSoftCoverMasterParameter';
import BukuSoftCoverSimulator from './BukuSoftCoverSimulator';
import BukuSoftCoverMatrixView from './BukuSoftCoverMatrixView';
import BukuSoftCover145x2025MasterParameter from './BukuSoftCover145x2025MasterParameter';
import BukuSoftCover145x2025Simulator from './BukuSoftCover145x2025Simulator';
import BukuSoftCover145x2025MatrixView from './BukuSoftCover145x2025MatrixView';
import { BukuSoftCover145x2025MasterParams, DEFAULT_BUKU_SOFT_COVER_145X2025_PARAMS } from '@/lib/buku-soft-cover-145x2025-calculator';
import BukuHardCover105x148MasterParameter from './BukuHardCover105x148MasterParameter';
import BukuHardCover105x148Simulator from './BukuHardCover105x148Simulator';
import BukuHardCover105x148MatrixView from './BukuHardCover105x148MatrixView';
import { BukuHardCover105x148MasterParams, DEFAULT_BUKU_HARD_COVER_105X148_PARAMS } from '@/lib/buku-hard-cover-105x148-calculator';
import PosterMasterParameter from './PosterMasterParameter';
import PosterSimulator from './PosterSimulator';
import PosterMatrixView from './PosterMatrixView';
import { PosterMasterParams, DEFAULT_POSTER_PARAMS } from '@/lib/poster-calculator';
import MajalahMasterParameter from './MajalahMasterParameter';
import MajalahSimulator from './MajalahSimulator';
import MajalahMatrixView from './MajalahMatrixView';
import { MajalahMasterParams, DEFAULT_MAJALAH_PARAMS } from '@/lib/majalah-calculator';
import StikerMasterParameter from './StikerMasterParameter';
import StikerSimulator from './StikerSimulator';
import StikerMatrixView from './StikerMatrixView';
import { StikerMasterParams, DEFAULT_STIKER_PARAMS } from '@/lib/stiker-calculator';
import BukuSoftCover105x148MasterParameter from './BukuSoftCover105x148MasterParameter';
import BukuSoftCover105x148Simulator from './BukuSoftCover105x148Simulator';
import BukuSoftCover105x148MatrixView from './BukuSoftCover105x148MatrixView';
import { BukuSoftCover105x148MasterParams, DEFAULT_BUKU_SOFT_COVER_105X148_PARAMS } from '@/lib/buku-soft-cover-105x148-calculator';
import BukuHardCover145x2025MasterParameter from './BukuHardCover145x2025MasterParameter';
import BukuHardCover145x2025Simulator from './BukuHardCover145x2025Simulator';
import BukuHardCover145x2025MatrixView from './BukuHardCover145x2025MatrixView';
import { BukuHardCover145x2025MasterParams, DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS } from '@/lib/buku-hard-cover-145x2025-calculator';
import BukuHardCover21x297MasterParameter from './BukuHardCover21x297MasterParameter';
import BukuHardCover21x297Simulator from './BukuHardCover21x297Simulator';
import BukuHardCover21x297MatrixView from './BukuHardCover21x297MatrixView';
import { BukuHardCover21x297MasterParams, DEFAULT_BUKU_HARD_COVER_21X297_PARAMS } from '@/lib/buku-hard-cover-21x297-calculator';
import KalenderKopMasterParameter from './KalenderKopMasterParameter';
import KalenderKopSimulator from './KalenderKopSimulator';
import KalenderKopMatrixView from './KalenderKopMatrixView';
import { KalenderKopMasterParams, DEFAULT_KALENDER_KOP_PARAMS } from '@/lib/kalender-kop-calculator';
import PackagingMasterParameter from './PackagingMasterParameter';
import PackagingSimulator from './PackagingSimulator';
import PackagingMatrixView from './PackagingMatrixView';
import { PackagingMasterParams, DEFAULT_PACKAGING_PARAMS } from '@/lib/packaging-calculator';
import PaperbagMasterParameter from './PaperbagMasterParameter';
import PaperbagSimulator from './PaperbagSimulator';
import PaperbagMatrixView from './PaperbagMatrixView';
import { PaperbagMasterParams, DEFAULT_PAPERBAG_PARAMS } from '@/lib/paperbag-calculator';
import SavedCalculationsList, { UnifiedCalculationItem } from './SavedCalculationsList';
import SquareDropdown from '@/components/SquareDropdown';
import GlobalMasterParameter from './GlobalMasterParameter';
import {
  GlobalMasterParams,
  DEFAULT_GLOBAL_PARAMS,
  applyGlobalParamsToAll,
} from '@/lib/global-master-params';
import { DEFAULT_MASTER_PARAMS, DEFAULT_MASTER_PARAMS_KLEM, SimulatorMasterParams } from '@/lib/pricelist-simulator';
import { DEFAULT_MANASIK_PARAMS, ManasikMasterParams } from '@/lib/manasik-calculator';
import { DEFAULT_YASIN_PARAMS, YasinMasterParams } from '@/lib/yasin-calculator';
import { DEFAULT_NOTA_PARAMS, NotaMasterParams } from '@/lib/nota-calculator';
import { DEFAULT_BROSUR_PARAMS, BrosurMasterParams } from '@/lib/brosur-calculator';
import { DEFAULT_LABEL_KHQ_PARAMS, LabelKhqMasterParams } from '@/lib/label-khq-calculator';
import { DEFAULT_BUKU_TULIS_PARAMS, BukuTulisMasterParams } from '@/lib/buku-tulis-calculator';
import { DEFAULT_STOPMAP_PARAMS, StopmapMasterParams } from '@/lib/stopmap-calculator';
import { DEFAULT_SYAHADAH_PARAMS, SyahadahMasterParams } from '@/lib/syahadah-calculator';
import { DEFAULT_RAPORT_KALEB_PARAMS, RaportKalebMasterParams } from '@/lib/raport-kaleb-calculator';
import { DEFAULT_KOP_SURAT_PARAMS, KopSuratMasterParams } from '@/lib/kop-surat-calculator';
import { DEFAULT_AMPLOP_PARAMS, AmplopMasterParams } from '@/lib/amplop-calculator';
import { DEFAULT_SERTIFIKAT_PARAMS, SertifikatMasterParams } from '@/lib/sertifikat-calculator';
import { DEFAULT_UNDANGAN_PARAMS, UndanganMasterParams } from '@/lib/undangan-calculator';
import { DEFAULT_BUKU_TABUNGAN_NS_PARAMS, BukuTabunganNsMasterParams } from '@/lib/buku-tabungan-ns-calculator';
import { DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS, BukuTabunganSecurityMasterParams } from '@/lib/buku-tabungan-security-calculator';
import { DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS, KartuKoperasiPromiseMasterParams } from '@/lib/kartu-koperasi-promise-calculator';
import { DEFAULT_LEBEL_KARTU_OBAT_PARAMS, LebelKartuObatMasterParams } from '@/lib/lebel-kartu-obat-calculator';
import { DEFAULT_BUKU_SOFT_COVER_PARAMS, BukuSoftCoverMasterParams } from '@/lib/buku-soft-cover-calculator';
import { recalculatePricelistFromParams } from '@/lib/pricelist-calculator';

interface PricelistItem {
  id: number;
  jenis_kalender: string;
  oplah: number;
  proses: string;
  bahan: string;
  ukuran: string;
  hpp: number;
  harga: number;
  harga_nego: number;
  profit_pct: number;
  profit_pct_nego: number;
  profit_tot: number;
  profit_tot_nego: number;
}

export default function PricelistClient() {
  const [items, setItems] = useState<PricelistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastExcelUpdate, setLastExcelUpdate] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Filters state
  const [activeTab, setActiveTab] = useState<'parameter' | 'simulator' | 'matrix' | 'saved'>('saved');
  const [selectedFinishing, setSelectedFinishing] = useState<'Spiral' | 'Klem'>('Spiral');

  // Parameter Buku Manasik, Yasin, Nota, Brosur, Label KHQ & Global
  const [paramsGlobal, setParamsGlobal] = useState<GlobalMasterParams>(DEFAULT_GLOBAL_PARAMS);
  const [showGlobalParamModal, setShowGlobalParamModal] = useState(false);
  const [paramsManasik, setParamsManasik] = useState<ManasikMasterParams>(DEFAULT_MANASIK_PARAMS);
  const [paramsYasin, setParamsYasin] = useState<YasinMasterParams>(DEFAULT_YASIN_PARAMS);
  const [paramsNota, setParamsNota] = useState<NotaMasterParams>(DEFAULT_NOTA_PARAMS);
  const [paramsBrosur, setParamsBrosur] = useState<BrosurMasterParams>(DEFAULT_BROSUR_PARAMS);
  const [paramsLabelKhq, setParamsLabelKhq] = useState<LabelKhqMasterParams>(DEFAULT_LABEL_KHQ_PARAMS);
  const [paramsBukuTulis, setParamsBukuTulis] = useState<BukuTulisMasterParams>(DEFAULT_BUKU_TULIS_PARAMS);
  const [paramsStopmap, setParamsStopmap] = useState<StopmapMasterParams>(DEFAULT_STOPMAP_PARAMS);
  const [paramsSyahadah, setParamsSyahadah] = useState<SyahadahMasterParams>(DEFAULT_SYAHADAH_PARAMS);
  const [paramsRaportKaleb, setParamsRaportKaleb] = useState<RaportKalebMasterParams>(DEFAULT_RAPORT_KALEB_PARAMS);
  const [paramsKopSurat, setParamsKopSurat] = useState<KopSuratMasterParams>(DEFAULT_KOP_SURAT_PARAMS);
  const [paramsAmplop, setParamsAmplop] = useState<AmplopMasterParams>(DEFAULT_AMPLOP_PARAMS);
  const [paramsSertifikat, setParamsSertifikat] = useState<SertifikatMasterParams>(DEFAULT_SERTIFIKAT_PARAMS);
  const [paramsUndangan, setParamsUndangan] = useState<UndanganMasterParams>(DEFAULT_UNDANGAN_PARAMS);
  const [paramsBukuTabunganNs, setParamsBukuTabunganNs] = useState<BukuTabunganNsMasterParams>(DEFAULT_BUKU_TABUNGAN_NS_PARAMS);
  const [paramsBukuTabunganSecurity, setParamsBukuTabunganSecurity] = useState<BukuTabunganSecurityMasterParams>(DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS);
  const [paramsKartuKoperasiPromise, setParamsKartuKoperasiPromise] = useState<KartuKoperasiPromiseMasterParams>(DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS);
  const [paramsLebelKartuObat, setParamsLebelKartuObat] = useState<LebelKartuObatMasterParams>(DEFAULT_LEBEL_KARTU_OBAT_PARAMS);
  const [paramsBukuSoftCover, setParamsBukuSoftCover] = useState<BukuSoftCoverMasterParams>(DEFAULT_BUKU_SOFT_COVER_PARAMS);
  const [paramsBukuSoftCover145x2025, setParamsBukuSoftCover145x2025] = useState<BukuSoftCover145x2025MasterParams>(DEFAULT_BUKU_SOFT_COVER_145X2025_PARAMS);
  const [paramsBukuHardCover105x148, setParamsBukuHardCover105x148] = useState<BukuHardCover105x148MasterParams>(DEFAULT_BUKU_HARD_COVER_105X148_PARAMS);
  const [paramsPoster, setParamsPoster] = useState<PosterMasterParams>(DEFAULT_POSTER_PARAMS);
  const [paramsMajalah, setParamsMajalah] = useState<MajalahMasterParams>(DEFAULT_MAJALAH_PARAMS);
  const [paramsStiker, setParamsStiker] = useState<StikerMasterParams>(DEFAULT_STIKER_PARAMS);
  const [paramsBukuSoftCover105x148, setParamsBukuSoftCover105x148] = useState<BukuSoftCover105x148MasterParams>(DEFAULT_BUKU_SOFT_COVER_105X148_PARAMS);
  const [paramsBukuHardCover145x2025, setParamsBukuHardCover145x2025] = useState<BukuHardCover145x2025MasterParams>(DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS);
  const [paramsBukuHardCover21x297, setParamsBukuHardCover21x297] = useState<BukuHardCover21x297MasterParams>(DEFAULT_BUKU_HARD_COVER_21X297_PARAMS);
  const [paramsKalenderKop, setParamsKalenderKop] = useState<KalenderKopMasterParams>(DEFAULT_KALENDER_KOP_PARAMS);
  const [paramsPackaging, setParamsPackaging] = useState<PackagingMasterParams>(DEFAULT_PACKAGING_PARAMS);
  const [paramsPaperbag, setParamsPaperbag] = useState<PaperbagMasterParams>(DEFAULT_PAPERBAG_PARAMS);
  const [selectedProductCategory, setSelectedProductCategory] = useState<'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026' | 'Label KHQ' | 'Buku Tulis' | 'Stopmap' | 'Syahadah' | 'Raport Kaleb' | 'Kop Surat' | 'Amplop' | 'Sertifikat' | 'Undangan' | 'Buku Tabungan NS' | 'Buku Tabungan Security' | 'Kartu Koperasi Promise' | 'Lebel Kartu Obat' | 'Buku Soft Cover' | 'Buku Soft Cover 14,5×20,25' | 'Buku Hard Cover 10,5×14,8' | 'Poster' | 'Majalah 14,5×20,25' | 'Stiker' | 'Buku Soft Cover 10,5×14,8' | 'Buku Hard Cover 14,5×20,25' | 'Buku Hard Cover 21×29,7' | 'Kalender Kop' | 'Packaging' | 'Paperbag'>('Kalender');
  const [paramsSpiral, setParamsSpiral] = useState<SimulatorMasterParams>(DEFAULT_MASTER_PARAMS);
  const [paramsKlem, setParamsKlem] = useState<SimulatorMasterParams>(DEFAULT_MASTER_PARAMS_KLEM);

  // Active loaded simulation state (persisted across tabs)
  const [activeSimulationId, setActiveSimulationId] = useState<string | null>(null);
  const [activeSimulationTitle, setActiveSimulationTitle] = useState<string | null>(null);
  const [backupParamsSpiral, setBackupParamsSpiral] = useState<SimulatorMasterParams | null>(null);
  const [backupParamsKlem, setBackupParamsKlem] = useState<SimulatorMasterParams | null>(null);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  const previousActiveSimIdRef = useRef<string | null>(null);

  // Helper util untuk memulihkan seluruh master parameter aktif dari localStorage
  const restoreAllMasterParamsFromLocalStorage = useCallback(() => {
    try {
      const savedSpiral = localStorage.getItem('sintak_pricelist_master_params_spiral')
        ?? localStorage.getItem('sintak_pricelist_master_params');
      if (savedSpiral) setParamsSpiral({ ...DEFAULT_MASTER_PARAMS, ...JSON.parse(savedSpiral) });

      const savedKlem = localStorage.getItem('sintak_pricelist_master_params_klem');
      if (savedKlem) setParamsKlem({ ...DEFAULT_MASTER_PARAMS_KLEM, ...JSON.parse(savedKlem) });

      const savedManasik = localStorage.getItem('sintak_pricelist_master_params_manasik');
      if (savedManasik) {
        const parsed = JSON.parse(savedManasik);
        // Migrasi nilai default lama agar presisi 100% dengan desimal UMR Master Excel 2026
        if (parsed.tarifCasingIn === 225 || parsed.tarifCasingIn === 225.49 || parsed.tarifStaplesPalu === 113 || parsed.tarifStaplesPalu === 112.74 || parsed.tarifStaplesPalu === 100) {
          delete parsed.tarifCasingIn;
          delete parsed.tarifStaplesPalu;
          delete parsed.jasaPlastikOpp;
          delete parsed.tarifLubangBor;
          delete parsed.tarifPasangTali;
          delete parsed.tarifBiayaSisipLipat;
          delete parsed.tarifLakbanBox;
        }
        setParamsManasik({ ...DEFAULT_MANASIK_PARAMS, ...parsed });
      }
      const savedYasin = localStorage.getItem('sintak_pricelist_master_params_yasin');
      if (savedYasin) {
        const parsedYasin = JSON.parse(savedYasin);
        // Migrasi jika masih menggunakan nilai default lama (1500 / 100 / 95 / 750 / 280 / 2600)
        if (
          parsedYasin.tarifPrintSisipanTeksA3 === 1500 ||
          parsedYasin.tarifPasangCoverSoft === 100 ||
          parsedYasin.tarifCasingInHardcover === 750 ||
          parsedYasin.tarifBoardHardcover === 280 ||
          parsedYasin.hargaIsiYasin128 === 2600
        ) {
          delete parsedYasin.tarifPrintSisipanTeksA3;
          delete parsedYasin.tarifPasangCoverSoft;
          delete parsedYasin.tarifPlastikOppYasin;
          delete parsedYasin.tarifCasingInHardcover;
          delete parsedYasin.tarifBoardHardcover;
          delete parsedYasin.hargaIsiYasin128;
        }
        setParamsYasin({ ...DEFAULT_YASIN_PARAMS, ...parsedYasin });
      }
      const savedNota = localStorage.getItem('sintak_pricelist_master_params_nota');
      if (savedNota) setParamsNota({ ...DEFAULT_NOTA_PARAMS, ...JSON.parse(savedNota) });

      const savedBrosur = localStorage.getItem('sintak_pricelist_master_params_brosur');
      if (savedBrosur) setParamsBrosur({ ...DEFAULT_BROSUR_PARAMS, ...JSON.parse(savedBrosur) });

      const savedLabelKhq = localStorage.getItem('sintak_pricelist_master_params_label_khq');
      if (savedLabelKhq) setParamsLabelKhq({ ...DEFAULT_LABEL_KHQ_PARAMS, ...JSON.parse(savedLabelKhq) });

      const savedBukuTulis = localStorage.getItem('sintak_pricelist_master_params_buku_tulis');
      if (savedBukuTulis) setParamsBukuTulis({ ...DEFAULT_BUKU_TULIS_PARAMS, ...JSON.parse(savedBukuTulis) });

      const savedStopmap = localStorage.getItem('sintak_pricelist_master_params_stopmap');
      if (savedStopmap) setParamsStopmap({ ...DEFAULT_STOPMAP_PARAMS, ...JSON.parse(savedStopmap) });

      const savedSyahadah = localStorage.getItem('sintak_pricelist_master_params_syahadah');
      if (savedSyahadah) setParamsSyahadah({ ...DEFAULT_SYAHADAH_PARAMS, ...JSON.parse(savedSyahadah) });

      const savedRaportKaleb = localStorage.getItem('sintak_pricelist_master_params_raport_kaleb');
      if (savedRaportKaleb) setParamsRaportKaleb({ ...DEFAULT_RAPORT_KALEB_PARAMS, ...JSON.parse(savedRaportKaleb) });

      const savedKopSurat = localStorage.getItem('sintak_pricelist_master_params_kop_surat');
      if (savedKopSurat) setParamsKopSurat({ ...DEFAULT_KOP_SURAT_PARAMS, ...JSON.parse(savedKopSurat) });

      const savedAmplop = localStorage.getItem('sintak_pricelist_master_params_amplop');
      if (savedAmplop) setParamsAmplop({ ...DEFAULT_AMPLOP_PARAMS, ...JSON.parse(savedAmplop) });

      const savedSertifikat = localStorage.getItem('sintak_pricelist_master_params_sertifikat');
      if (savedSertifikat) setParamsSertifikat({ ...DEFAULT_SERTIFIKAT_PARAMS, ...JSON.parse(savedSertifikat) });

      const savedUndangan = localStorage.getItem('sintak_pricelist_master_params_undangan');
      if (savedUndangan) setParamsUndangan({ ...DEFAULT_UNDANGAN_PARAMS, ...JSON.parse(savedUndangan) });

      const savedBukuTabunganNs = localStorage.getItem('sintak_pricelist_master_params_buku_tabungan_ns');
      if (savedBukuTabunganNs) setParamsBukuTabunganNs({ ...DEFAULT_BUKU_TABUNGAN_NS_PARAMS, ...JSON.parse(savedBukuTabunganNs) });

      const savedBukuTabunganSecurity = localStorage.getItem('sintak_pricelist_master_params_buku_tabungan_security');
      if (savedBukuTabunganSecurity) setParamsBukuTabunganSecurity({ ...DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS, ...JSON.parse(savedBukuTabunganSecurity) });

      const savedKartuKoperasiPromise = localStorage.getItem('sintak_pricelist_master_params_kartu_koperasi_promise');
      if (savedKartuKoperasiPromise) setParamsKartuKoperasiPromise({ ...DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS, ...JSON.parse(savedKartuKoperasiPromise) });

      const savedLebelKartuObat = localStorage.getItem('sintak_pricelist_master_params_lebel_kartu_obat');
      if (savedLebelKartuObat) setParamsLebelKartuObat({ ...DEFAULT_LEBEL_KARTU_OBAT_PARAMS, ...JSON.parse(savedLebelKartuObat) });

      const savedBukuSoftCover = localStorage.getItem('sintak_pricelist_master_params_buku_soft_cover');
      if (savedBukuSoftCover) setParamsBukuSoftCover({ ...DEFAULT_BUKU_SOFT_COVER_PARAMS, ...JSON.parse(savedBukuSoftCover) });

      const savedBukuSoftCover145x2025 = localStorage.getItem('sintak_pricelist_master_params_buku_soft_cover_145x2025');
      if (savedBukuSoftCover145x2025) setParamsBukuSoftCover145x2025({ ...DEFAULT_BUKU_SOFT_COVER_145X2025_PARAMS, ...JSON.parse(savedBukuSoftCover145x2025) });

      const savedBukuHardCover105x148 = localStorage.getItem('sintak_pricelist_master_params_buku_hard_cover_105x148');
      if (savedBukuHardCover105x148) setParamsBukuHardCover105x148({ ...DEFAULT_BUKU_HARD_COVER_105X148_PARAMS, ...JSON.parse(savedBukuHardCover105x148) });

      const savedPoster = localStorage.getItem('sintak_pricelist_master_params_poster');
      if (savedPoster) setParamsPoster({ ...DEFAULT_POSTER_PARAMS, ...JSON.parse(savedPoster) });

      const savedMajalah = localStorage.getItem('sintak_pricelist_master_params_majalah');
      if (savedMajalah) setParamsMajalah({ ...DEFAULT_MAJALAH_PARAMS, ...JSON.parse(savedMajalah) });

      const savedStiker = localStorage.getItem('sintak_pricelist_master_params_stiker');
      if (savedStiker) setParamsStiker({ ...DEFAULT_STIKER_PARAMS, ...JSON.parse(savedStiker) });

      const savedBukuSoftCover105x148 = localStorage.getItem('sintak_pricelist_master_params_buku_soft_cover_105x148');
      if (savedBukuSoftCover105x148) setParamsBukuSoftCover105x148({ ...DEFAULT_BUKU_SOFT_COVER_105X148_PARAMS, ...JSON.parse(savedBukuSoftCover105x148) });

      const savedBukuHardCover145x2025 = localStorage.getItem('sintak_pricelist_master_params_buku_hard_cover_145x2025');
      if (savedBukuHardCover145x2025) setParamsBukuHardCover145x2025({ ...DEFAULT_BUKU_HARD_COVER_145X2025_PARAMS, ...JSON.parse(savedBukuHardCover145x2025) });

      const savedBukuHardCover21x297 = localStorage.getItem('sintak_pricelist_master_params_buku_hard_cover_21x297');
      if (savedBukuHardCover21x297) setParamsBukuHardCover21x297({ ...DEFAULT_BUKU_HARD_COVER_21X297_PARAMS, ...JSON.parse(savedBukuHardCover21x297) });

      const savedKalenderKop = localStorage.getItem('sintak_pricelist_master_params_kalender_kop');
      if (savedKalenderKop) setParamsKalenderKop({ ...DEFAULT_KALENDER_KOP_PARAMS, ...JSON.parse(savedKalenderKop) });

      const savedPackaging = localStorage.getItem('sintak_pricelist_master_params_packaging');
      if (savedPackaging) setParamsPackaging({ ...DEFAULT_PACKAGING_PARAMS, ...JSON.parse(savedPackaging) });

      const savedPaperbag = localStorage.getItem('sintak_pricelist_master_params_paperbag');
      if (savedPaperbag) setParamsPaperbag({ ...DEFAULT_PAPERBAG_PARAMS, ...JSON.parse(savedPaperbag) });

      const savedGlobal = localStorage.getItem('sintak_pricelist_master_params_global');
      if (savedGlobal) setParamsGlobal({ ...DEFAULT_GLOBAL_PARAMS, ...JSON.parse(savedGlobal) });
    } catch (e) {
      console.error('Failed to restore master parameters from localStorage:', e);
    }
  }, []);

  // Pantau saat keluar dari mode edit simulasi (activeSimulationId -> null)
  useEffect(() => {
    if (previousActiveSimIdRef.current && !activeSimulationId) {
      restoreAllMasterParamsFromLocalStorage();
    }
    previousActiveSimIdRef.current = activeSimulationId;
  }, [activeSimulationId, restoreAllMasterParamsFromLocalStorage]);

  // Load preferences from localStorage after mount (client-only) to prevent hydration mismatch
  useEffect(() => {
    try {
      const savedTab = localStorage.getItem('sintak_pricelist_active_tab');
      if (savedTab === 'parameter' || savedTab === 'simulator' || savedTab === 'matrix' || savedTab === 'saved') {
        setActiveTab(savedTab as 'parameter' | 'simulator' | 'matrix' | 'saved');
      }

      const savedFinishing = localStorage.getItem('sintak_pricelist_finishing');
      if (savedFinishing === 'Spiral' || savedFinishing === 'Klem') {
        setSelectedFinishing(savedFinishing);
      }

      const savedView = localStorage.getItem('sintak_pricelist_view_mode');
      if (savedView === 'matrix' || savedView === 'table') {
        setViewMode(savedView);
      }

      const savedCategory = localStorage.getItem('sintak_pricelist_selected_category');
      if (
        savedCategory === 'Kalender' ||
        savedCategory === 'Buku Manasik' ||
        savedCategory === 'Buku Yasin' ||
        savedCategory === 'Nota 1 Warna' ||
        savedCategory === 'Brosur 2026' ||
        savedCategory === 'Label KHQ' ||
        savedCategory === 'Buku Tulis' ||
        savedCategory === 'Stopmap' ||
        savedCategory === 'Syahadah' ||
        savedCategory === 'Raport Kaleb' ||
        savedCategory === 'Kop Surat' ||
        savedCategory === 'Amplop' ||
        savedCategory === 'Sertifikat' ||
        savedCategory === 'Undangan' ||
        savedCategory === 'Buku Tabungan NS' ||
        savedCategory === 'Buku Tabungan Security' ||
        savedCategory === 'Kartu Koperasi Promise' ||
        savedCategory === 'Lebel Kartu Obat' ||
        savedCategory === 'Buku Soft Cover' ||
        savedCategory === 'Buku Soft Cover 14,5×20,25' ||
        savedCategory === 'Buku Hard Cover 10,5×14,8' ||
        savedCategory === 'Poster' ||
        savedCategory === 'Majalah 14,5×20,25' ||
        savedCategory === 'Stiker' ||
        savedCategory === 'Buku Soft Cover 10,5×14,8' ||
        savedCategory === 'Buku Hard Cover 14,5×20,25' ||
        savedCategory === 'Buku Hard Cover 21×29,7' ||
        savedCategory === 'Kalender Kop' ||
        savedCategory === 'Packaging' ||
        savedCategory === 'Paperbag'
      ) {
        setSelectedProductCategory(savedCategory);
      }

      restoreAllMasterParamsFromLocalStorage();
    } catch (e) {
      console.error('Failed to load localStorage preferences:', e);
    } finally {
      setIsInitialLoaded(true);
    }
  }, [restoreAllMasterParamsFromLocalStorage]);

  // Tab change handler — auto release edit mode jika tab selain parameter & simulator diklik
  const handleTabChange = (tab: 'saved' | 'parameter' | 'simulator' | 'matrix') => {
    setActiveTab(tab);
    try {
      localStorage.setItem('sintak_pricelist_active_tab', tab);
    } catch (e) {
      console.error(e);
    }
    // Jika dalam mode edit dan user klik tab selain Master Parameter dan Simulator, lepas mode edit
    if (activeSimulationId && tab !== 'parameter' && tab !== 'simulator') {
      setActiveSimulationId(null);
      setActiveSimulationTitle(null);
    }
  };

  // Sync selectedProductCategory across tabs
  const handleProductCategoryChange = (
    category: 'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026' | 'Label KHQ' | 'Buku Tulis' | 'Stopmap' | 'Syahadah' | 'Raport Kaleb' | 'Kop Surat' | 'Amplop' | 'Sertifikat' | 'Undangan' | 'Buku Tabungan NS' | 'Buku Tabungan Security' | 'Kartu Koperasi Promise' | 'Lebel Kartu Obat' | 'Buku Soft Cover' | 'Buku Soft Cover 14,5×20,25' | 'Buku Hard Cover 10,5×14,8' | 'Poster' | 'Majalah 14,5×20,25' | 'Stiker' | 'Buku Soft Cover 10,5×14,8' | 'Buku Hard Cover 14,5×20,25' | 'Buku Hard Cover 21×29,7' | 'Kalender Kop' | 'Packaging' | 'Paperbag'
  ) => {
    setSelectedProductCategory(category);
    if (activeSimulationId) {
      setActiveSimulationId(null);
      setActiveSimulationTitle(null);
    }
    try {
      localStorage.setItem('sintak_pricelist_selected_category', category);
    } catch (e) {
      console.error(e);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJenis, setSelectedJenis] = useState<string>('ALL');
  const [selectedBahan, setSelectedBahan] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'matrix' | 'table'>('matrix');

  const isKlemActive = selectedFinishing === 'Klem';
  const customParams = isKlemActive ? paramsKlem : paramsSpiral;

  const setCustomParams: React.Dispatch<React.SetStateAction<SimulatorMasterParams>> = (
    valueOrUpdater
  ) => {
    const target = selectedFinishing === 'Klem' ? setParamsKlem : setParamsSpiral;
    if (typeof valueOrUpdater === 'function') {
      target((prev) =>
        (valueOrUpdater as (prev: SimulatorMasterParams) => SimulatorMasterParams)(prev)
      );
    } else {
      target(valueOrUpdater);
    }
  };

  const setParamsForFinishing = (mode: 'Spiral' | 'Klem', params: SimulatorMasterParams) => {
    if (mode === 'Klem') {
      setParamsKlem(params);
    } else {
      setParamsSpiral(params);
    }
  };

  const handleLoadSimulationFromList = (item: UnifiedCalculationItem) => {
    const cat = item.category as typeof selectedProductCategory;
    setSelectedProductCategory(cat);
    try {
      localStorage.setItem('sintak_pricelist_selected_category', cat);
    } catch (e) {
      console.error(e);
    }
    setActiveSimulationId(item.id);
    setActiveSimulationTitle(item.title);
    setActiveTab('simulator');
    try {
      localStorage.setItem('sintak_pricelist_active_tab', 'simulator');
    } catch (e) {
      console.error(e);
    }
    const raw = item.rawData as Record<string, unknown> | undefined;
    const snapshot = raw?.paramsSnapshot || raw?.customParams;
    if (snapshot && typeof snapshot === 'object') {
      const s = snapshot as never;
      if (item.category === 'Kalender') {
        const jilid = (raw?.finishingJilid || (raw?.summary as Record<string, unknown>)?.finishingJilid || 'Spiral') as 'Spiral' | 'Klem';
        if (jilid === 'Klem') setParamsKlem(s);
        else setParamsSpiral(s);
      } else if (item.category === 'Buku Manasik') setParamsManasik(s);
      else if (item.category === 'Buku Yasin') setParamsYasin(s);
      else if (item.category === 'Nota 1 Warna') setParamsNota(s);
      else if (item.category === 'Brosur 2026') setParamsBrosur(s);
      else if (item.category === 'Label KHQ') setParamsLabelKhq(s);
      else if (item.category === 'Buku Tulis') setParamsBukuTulis(s);
      else if (item.category === 'Stopmap') setParamsStopmap(s);
      else if (item.category === 'Syahadah') setParamsSyahadah(s);
      else if (item.category === 'Raport Kaleb') setParamsRaportKaleb(s);
      else if (item.category === 'Kop Surat') setParamsKopSurat(s);
      else if (item.category === 'Amplop') setParamsAmplop(s);
      else if (item.category === 'Sertifikat') setParamsSertifikat(s);
      else if (item.category === 'Undangan') setParamsUndangan(s);
      else if (item.category === 'Buku Tabungan NS') setParamsBukuTabunganNs(s);
      else if (item.category === 'Buku Tabungan Security') setParamsBukuTabunganSecurity(s);
      else if (item.category === 'Kartu Koperasi Promise') setParamsKartuKoperasiPromise(s);
      else if (item.category === 'Lebel Kartu Obat') setParamsLebelKartuObat(s);
      else if (item.category === 'Buku Soft Cover') setParamsBukuSoftCover(s);
      else if (item.category === 'Buku Soft Cover 14,5×20,25') setParamsBukuSoftCover145x2025(s);
      else if (item.category === 'Buku Hard Cover 10,5×14,8') setParamsBukuHardCover105x148(s);
      else if (item.category === 'Poster') setParamsPoster(s);
      else if (item.category === 'Majalah 14,5×20,25') setParamsMajalah(s);
      else if (item.category === 'Stiker') setParamsStiker(s);
      else if (item.category === 'Buku Soft Cover 10,5×14,8') setParamsBukuSoftCover105x148(s);
      else if (item.category === 'Buku Hard Cover 14,5×20,25') setParamsBukuHardCover145x2025(s);
      else if (item.category === 'Buku Hard Cover 21×29,7') setParamsBukuHardCover21x297(s);
      else if (item.category === 'Kalender Kop') setParamsKalenderKop(s);
      else if (item.category === 'Packaging') setParamsPackaging(s);
      else if (item.category === 'Paperbag') setParamsPaperbag(s);

      // Ekstrak dan sinkronkan juga ke Master Parameter Global selama mode edit aktif
      setParamsGlobal((prevGlobal) => {
        const nextGlobal = { ...prevGlobal };
        const snapObj = s as Record<string, unknown>;

        // 1. Nilai langsung dengan key yang sama
        (Object.keys(DEFAULT_GLOBAL_PARAMS) as (keyof GlobalMasterParams)[]).forEach((k) => {
          if (typeof snapObj[k] === 'number') {
            nextGlobal[k] = snapObj[k] as number;
          }
        });

        // 2. Pemetaan alias tarif spesifik produk ke field Master Parameter Global
        if (typeof snapObj.tarifPlatCtpOliver === 'number') nextGlobal.oliverPlatUnit = snapObj.tarifPlatCtpOliver as number;
        if (typeof snapObj.minOngkosOliver === 'number') nextGlobal.oliverMinOngkos = snapObj.minOngkosOliver as number;
        if (typeof snapObj.drekOverOliver === 'number') nextGlobal.oliverDrekOver = snapObj.drekOverOliver as number;
        if (typeof snapObj.tarifKertasHvs70 === 'number') nextGlobal.tarifHvs70 = snapObj.tarifKertasHvs70 as number;
        if (typeof snapObj.hargaKertasHvs70 === 'number') nextGlobal.tarifHvs70 = snapObj.hargaKertasHvs70 as number;
        if (typeof snapObj.tarifKertasAp120 === 'number') nextGlobal.tarifAp120 = snapObj.tarifKertasAp120 as number;
        if (typeof snapObj.hargaKertasAp120 === 'number') nextGlobal.tarifAp120 = snapObj.hargaKertasAp120 as number;
        if (typeof snapObj.tarifKertasAp150 === 'number') nextGlobal.tarifAp150 = snapObj.tarifKertasAp150 as number;
        if (typeof snapObj.hargaKertasAp150 === 'number') nextGlobal.tarifAp150 = snapObj.hargaKertasAp150 as number;
        if (typeof snapObj.tarifKertasAc230 === 'number') nextGlobal.tarifAc230Kg = snapObj.tarifKertasAc230 as number;
        if (typeof snapObj.hargaKertasAc230 === 'number') nextGlobal.tarifAc230Kg = snapObj.hargaKertasAc230 as number;
        if (typeof snapObj.tarifKertasAc260 === 'number') nextGlobal.tarifAc260Kg = snapObj.tarifKertasAc260 as number;
        if (typeof snapObj.hargaKertasAc260 === 'number') nextGlobal.tarifAc260Kg = snapObj.hargaKertasAc260 as number;
        if (typeof snapObj.tarifPrintCoverA3 === 'number') nextGlobal.tarifPrintA3 = snapObj.tarifPrintCoverA3 as number;
        if (typeof snapObj.tarifPrintCover === 'number') nextGlobal.tarifPrintA3 = snapObj.tarifPrintCover as number;
        if (typeof snapObj.tarifPrintInter === 'number') nextGlobal.tarifPrintInter1Muka = snapObj.tarifPrintInter as number;
        if (typeof snapObj.tarifLaminasiGlossy === 'number') nextGlobal.tarifLaminasiGlossyCm2 = snapObj.tarifLaminasiGlossy as number;
        if (typeof snapObj.tarifLaminasiDoff === 'number') nextGlobal.tarifLaminasiDoffCm2 = snapObj.tarifLaminasiDoff as number;
        if (typeof snapObj.tarifUvVarnish === 'number') nextGlobal.tarifUvVarnishCm2 = snapObj.tarifUvVarnish as number;
        if (typeof snapObj.minLaminasiPerOrder === 'number') nextGlobal.minLaminasi = snapObj.minLaminasiPerOrder as number;
        if (typeof snapObj.tarifKardus === 'number') nextGlobal.tarifKardusBox = snapObj.tarifKardus as number;
        if (typeof snapObj.tarifLakban === 'number') nextGlobal.tarifLakbanRoll = snapObj.tarifLakban as number;
        if (typeof snapObj.tarifPlastikOpp === 'number') nextGlobal.tarifPlastikOppPcs = snapObj.tarifPlastikOpp as number;
        if (typeof snapObj.tarifPlastik === 'number') nextGlobal.tarifPlastikOppPcs = snapObj.tarifPlastik as number;

        return nextGlobal;
      });
    }
    setActiveTab('simulator');
  };
  // Otomatis pindah ke tab Daftar Kalkulasi setelah kalkulasi berhasil disimpan
  useEffect(() => {
    const handleSaved = () => {
      setActiveTab('saved');
    };
    window.addEventListener('sintak:pricelist-saved', handleSaved);
    return () => window.removeEventListener('sintak:pricelist-saved', handleSaved);
  }, []);

  // Simpan posisi tab aktif dan view mode ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sintak_pricelist_active_tab', activeTab);
    } catch (e) {
      console.error('Failed to save active tab to localStorage:', e);
    }
  }, [activeTab]);
  useEffect(() => {
    try {
      localStorage.setItem('sintak_pricelist_view_mode', viewMode);
    } catch (e) {
      console.error('Failed to save view mode to localStorage:', e);
    }
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem('sintak_pricelist_finishing', selectedFinishing);
    } catch (e) {
      console.error('Failed to save finishing mode to localStorage:', e);
    }
  }, [selectedFinishing]);

  // Simpan master parameter ke localStorage per profil (debounced 350ms agar tidak lag saat mengetik)
  useEffect(() => {
    if (!isInitialLoaded) return;
    if (activeSimulationId) return; // JANGAN timpa localStorage master parameter permanen jika sedang dalam mode edit simulasi!

    const timer = setTimeout(() => {
      try {
      localStorage.setItem('sintak_pricelist_master_params_spiral', JSON.stringify(paramsSpiral));
      localStorage.setItem('sintak_pricelist_master_params_klem', JSON.stringify(paramsKlem));
      localStorage.setItem('sintak_pricelist_master_params_global', JSON.stringify(paramsGlobal));
      localStorage.setItem('sintak_pricelist_master_params_manasik', JSON.stringify(paramsManasik));
      localStorage.setItem('sintak_pricelist_master_params_yasin', JSON.stringify(paramsYasin));
      localStorage.setItem('sintak_pricelist_master_params_nota', JSON.stringify(paramsNota));
      localStorage.setItem('sintak_pricelist_master_params_brosur', JSON.stringify(paramsBrosur));
      localStorage.setItem('sintak_pricelist_master_params_label_khq', JSON.stringify(paramsLabelKhq));
      localStorage.setItem('sintak_pricelist_master_params_buku_tulis', JSON.stringify(paramsBukuTulis));
      localStorage.setItem('sintak_pricelist_master_params_stopmap', JSON.stringify(paramsStopmap));
      localStorage.setItem('sintak_pricelist_master_params_syahadah', JSON.stringify(paramsSyahadah));
      localStorage.setItem('sintak_pricelist_master_params_raport_kaleb', JSON.stringify(paramsRaportKaleb));
      localStorage.setItem('sintak_pricelist_master_params_kop_surat', JSON.stringify(paramsKopSurat));
      localStorage.setItem('sintak_pricelist_master_params_amplop', JSON.stringify(paramsAmplop));
      localStorage.setItem('sintak_pricelist_master_params_sertifikat', JSON.stringify(paramsSertifikat));
      localStorage.setItem('sintak_pricelist_master_params_undangan', JSON.stringify(paramsUndangan));
      localStorage.setItem('sintak_pricelist_master_params_buku_tabungan_ns', JSON.stringify(paramsBukuTabunganNs));
      localStorage.setItem('sintak_pricelist_master_params_buku_tabungan_security', JSON.stringify(paramsBukuTabunganSecurity));
      localStorage.setItem('sintak_pricelist_master_params_kartu_koperasi_promise', JSON.stringify(paramsKartuKoperasiPromise));
      localStorage.setItem('sintak_pricelist_master_params_lebel_kartu_obat', JSON.stringify(paramsLebelKartuObat));
      localStorage.setItem('sintak_pricelist_master_params_buku_soft_cover', JSON.stringify(paramsBukuSoftCover));
      localStorage.setItem('sintak_pricelist_master_params_buku_soft_cover_145x2025', JSON.stringify(paramsBukuSoftCover145x2025));
      localStorage.setItem('sintak_pricelist_master_params_buku_hard_cover_105x148', JSON.stringify(paramsBukuHardCover105x148));
      localStorage.setItem('sintak_pricelist_master_params_poster', JSON.stringify(paramsPoster));
      localStorage.setItem('sintak_pricelist_master_params_majalah', JSON.stringify(paramsMajalah));
      localStorage.setItem('sintak_pricelist_master_params_stiker', JSON.stringify(paramsStiker));
      localStorage.setItem('sintak_pricelist_master_params_buku_soft_cover_105x148', JSON.stringify(paramsBukuSoftCover105x148));
      localStorage.setItem('sintak_pricelist_master_params_buku_hard_cover_145x2025', JSON.stringify(paramsBukuHardCover145x2025));
      localStorage.setItem('sintak_pricelist_master_params_buku_hard_cover_21x297', JSON.stringify(paramsBukuHardCover21x297));
      localStorage.setItem('sintak_pricelist_master_params_kalender_kop', JSON.stringify(paramsKalenderKop));
      localStorage.setItem('sintak_pricelist_master_params_packaging', JSON.stringify(paramsPackaging));
        localStorage.setItem('sintak_pricelist_master_params_paperbag', JSON.stringify(paramsPaperbag));
      } catch (e) {
        console.error('Failed to save master parameters to localStorage:', e);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [isInitialLoaded, activeSimulationId, paramsSpiral, paramsKlem, paramsGlobal, paramsManasik, paramsYasin, paramsNota, paramsBrosur, paramsLabelKhq, paramsBukuTulis, paramsStopmap, paramsSyahadah, paramsRaportKaleb, paramsKopSurat, paramsAmplop, paramsSertifikat, paramsUndangan, paramsBukuTabunganNs, paramsBukuTabunganSecurity, paramsKartuKoperasiPromise, paramsLebelKartuObat, paramsBukuSoftCover, paramsBukuSoftCover145x2025, paramsBukuHardCover105x148, paramsPoster, paramsMajalah, paramsStiker, paramsBukuSoftCover105x148, paramsBukuHardCover145x2025, paramsBukuHardCover21x297, paramsKalenderKop, paramsPackaging, paramsPaperbag]);

  // Fungsi sebarkan parameter global ke seluruh produk
  const handleApplyGlobalParams = (targetGlobal?: GlobalMasterParams) => {
    const g = targetGlobal || paramsGlobal;
    const { nextSpiral, nextKlem, nextManasik, nextYasin, nextNota, nextBrosur, nextLabelKhq, nextBukuTulis, nextStopmap, nextSyahadah, nextRaportKaleb, nextKopSurat, nextAmplop, nextSertifikat, nextUndangan, nextBukuTabunganNs, nextBukuTabunganSecurity, nextKartuKoperasiPromise, nextLebelKartuObat, nextBukuSoftCover, nextBukuSoftCover145x2025, nextBukuHardCover105x148, nextPoster, nextMajalah, nextStiker, nextBukuSoftCover105x148, nextBukuHardCover145x2025, nextBukuHardCover21x297, nextKalenderKop, nextPackaging, nextPaperbag } = applyGlobalParamsToAll(
      g,
      paramsSpiral,
      paramsKlem,
      paramsManasik,
      paramsYasin,
      paramsNota,
      paramsBrosur,
      paramsLabelKhq,
      paramsBukuTulis,
      paramsStopmap,
      paramsSyahadah,
      paramsRaportKaleb,
      paramsKopSurat,
      paramsAmplop,
      paramsSertifikat,
      paramsUndangan,
      paramsBukuTabunganNs,
      paramsBukuTabunganSecurity,
      paramsKartuKoperasiPromise,
      paramsLebelKartuObat,
      paramsBukuSoftCover,
      paramsBukuSoftCover145x2025,
      paramsBukuHardCover105x148,
      paramsPoster,
      paramsMajalah,
      paramsStiker,
      paramsBukuSoftCover105x148,
      paramsBukuHardCover145x2025,
      paramsBukuHardCover21x297,
      paramsKalenderKop,
      paramsPackaging,
      paramsPaperbag
    );
    setParamsSpiral(nextSpiral);
    setParamsKlem(nextKlem);
    setParamsManasik(nextManasik);
    setParamsYasin(nextYasin);
    setParamsNota(nextNota);
    setParamsBrosur(nextBrosur);
    setParamsLabelKhq(nextLabelKhq);
    setParamsBukuTulis(nextBukuTulis);
    setParamsStopmap(nextStopmap);
    setParamsSyahadah(nextSyahadah);
    setParamsRaportKaleb(nextRaportKaleb);
    setParamsKopSurat(nextKopSurat);
    setParamsAmplop(nextAmplop);
    setParamsSertifikat(nextSertifikat);
    setParamsUndangan(nextUndangan);
    setParamsBukuTabunganNs(nextBukuTabunganNs);
    setParamsBukuTabunganSecurity(nextBukuTabunganSecurity);
    setParamsKartuKoperasiPromise(nextKartuKoperasiPromise);
    setParamsLebelKartuObat(nextLebelKartuObat);
    setParamsBukuSoftCover(nextBukuSoftCover);
    setParamsBukuSoftCover145x2025(nextBukuSoftCover145x2025);
    setParamsBukuHardCover105x148(nextBukuHardCover105x148);
    setParamsPoster(nextPoster);
    setParamsMajalah(nextMajalah);
    setParamsStiker(nextStiker);
    setParamsBukuSoftCover105x148(nextBukuSoftCover105x148);
    setParamsBukuHardCover145x2025(nextBukuHardCover145x2025);
    setParamsBukuHardCover21x297(nextBukuHardCover21x297);
    setParamsKalenderKop(nextKalenderKop);
    setParamsPackaging(nextPackaging);
    setParamsPaperbag(nextPaperbag);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pricelist?_t=${Date.now()}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
        setLastExcelUpdate(json.lastExcelUpdate || null);
        setFileName(json.fileName || null);
      }
    } catch (e) {
      console.error('Failed to fetch pricelist:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Data terhitung secara reaktif: selalu sinkron dengan Master Parameter yang sedang aktif & pilihan finishing (Spiral / Klem)
  const activeItems = useMemo(() => {
    return recalculatePricelistFromParams(customParams, items, selectedFinishing);
  }, [customParams, items, selectedFinishing]);

  // Options for SquareDropdown
  const jenisOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    activeItems.forEach((i) => {
      counts[i.jenis_kalender] = (counts[i.jenis_kalender] || 0) + 1;
    });

    const opts = [
      { value: 'ALL', label: 'Semua Jenis', count: activeItems.length },
      ...Object.keys(counts).map((k) => ({
        value: k,
        label: k,
        count: counts[k],
      })),
    ];
    return opts;
  }, [activeItems]);

  const bahanOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    activeItems.forEach((i) => {
      counts[i.bahan] = (counts[i.bahan] || 0) + 1;
    });

    const opts = [
      { value: 'ALL', label: 'Semua Bahan', count: activeItems.length },
      ...Object.keys(counts).map((k) => ({
        value: k,
        label: k,
        count: counts[k],
      })),
    ];
    return opts;
  }, [activeItems]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return activeItems.filter((item) => {
      if (selectedJenis !== 'ALL' && item.jenis_kalender !== selectedJenis) return false;
      if (selectedBahan !== 'ALL' && item.bahan !== selectedBahan) return false;
      if (q) {
        const matchesSearch =
          item.jenis_kalender.toLowerCase().includes(q) ||
          item.bahan.toLowerCase().includes(q) ||
          item.ukuran.toLowerCase().includes(q) ||
          item.proses.toLowerCase().includes(q) ||
          item.oplah.toString().includes(q) ||
          item.harga.toString().includes(q);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [activeItems, selectedJenis, selectedBahan, searchTerm]);

  // Grouping for matrix view: Jenis -> Bahan -> List of Rows (grouped by Oplah + Proses)
  const groupedData = useMemo(() => {
    const res: Record<string, Record<string, Record<number, { proses: string; sizes: Record<string, PricelistItem> }>>> = {};

    filteredItems.forEach((item) => {
      if (!res[item.jenis_kalender]) res[item.jenis_kalender] = {};
      if (!res[item.jenis_kalender][item.bahan]) res[item.jenis_kalender][item.bahan] = {};
      if (!res[item.jenis_kalender][item.bahan][item.oplah]) {
        res[item.jenis_kalender][item.bahan][item.oplah] = {
          proses: item.proses,
          sizes: {},
        };
      }
      res[item.jenis_kalender][item.bahan][item.oplah].sizes[item.ukuran] = item;
    });

    return res;
  }, [filteredItems]);

  const allSizes = ['32 x 48', '38 x 54', '46 x 64', '48 x 64'];

  const formatRupiah = (val: number) => {
    if (!val) return '0';
    return Math.round(val).toLocaleString('id-ID');
  };

  const formatPercent = (val: number) => {
    if (!val) return '0%';
    return `${(val * 100).toFixed(1)}%`;
  };

  const isFiltered = selectedJenis !== 'ALL' || selectedBahan !== 'ALL' || searchTerm !== '';

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* TABS Navigation + Product Category Selector — 1 baris, tab bisa scroll horizontal */}
      <div className="flex items-center border-b border-gray-100 shrink-0 mt-1 relative z-50 gap-2">
        {/* Tab List — scrollable horizontal jika overflow */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-4 px-1 min-w-max">
            <button
              type="button"
              onClick={() => handleTabChange('saved')}
              className={`flex items-center justify-center gap-1.5 pb-2 px-2 text-[13px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'saved'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bookmark size={14} />
              <span>Daftar Kalkulasi</span>
            </button>

            {/* Tab Master Parameter */}
            <div
              className={`flex items-center gap-1.5 pb-2 px-2 border-b-2 transition-all ${
                activeTab === 'parameter'
                  ? activeSimulationId
                    ? 'border-orange-500 text-orange-700 bg-orange-50/50 rounded-t-lg'
                    : 'border-emerald-600 text-emerald-700'
                  : activeSimulationId
                    ? 'border-transparent text-orange-600/80 hover:text-orange-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <button
                type="button"
                onClick={() => handleTabChange('parameter')}
                className={`flex items-center justify-center gap-1.5 text-[13px] font-bold cursor-pointer whitespace-nowrap ${
                  activeTab === 'parameter'
                    ? activeSimulationId
                      ? 'text-orange-700'
                      : 'text-emerald-700'
                    : activeSimulationId
                      ? 'text-orange-600 hover:text-orange-800'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Database size={14} className={activeSimulationId ? 'text-orange-600' : ''} />
                <span>Master Parameter</span>
                {activeSimulationId && (
                  <span className="text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                    Edit
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGlobalParamModal(true);
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all shadow-2xs cursor-pointer shrink-0 ${
                  activeSimulationId
                    ? 'bg-orange-100/80 hover:bg-orange-200 text-orange-800 border border-orange-300'
                    : 'bg-emerald-100/70 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                }`}
                title="Kelola Master Parameter Global (Shared Rates antar produk)"
              >
                <Globe size={10} className={activeSimulationId ? 'text-orange-700' : 'text-emerald-700'} />
                <span>Global</span>
              </button>
            </div>

            {/* Tab Simulator */}
            <button
              type="button"
              onClick={() => handleTabChange('simulator')}
              className={`flex items-center justify-center gap-1.5 pb-2 px-2 text-[13px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'simulator'
                  ? activeSimulationId
                    ? 'border-orange-500 text-orange-700 bg-orange-50/50 rounded-t-lg'
                    : 'border-emerald-600 text-emerald-700'
                  : activeSimulationId
                    ? 'border-transparent text-orange-600/80 hover:text-orange-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calculator size={14} className={activeSimulationId ? 'text-orange-600' : ''} />
              <span>Simulator</span>
              {activeSimulationId && (
                <span className="text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                  Edit
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('matrix')}
              className={`flex items-center justify-center gap-1.5 pb-2 px-2 text-[13px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileSpreadsheet size={14} />
              <span>Pricelist</span>
            </button>
          </div>
        </div>

        {/* Filter Jenis Produk — nempel kanan, tidak ikut scroll, pakai portal agar tidak tertutup card di bawah */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-100 shrink-0 pb-2">
          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline whitespace-nowrap">Produk:</span>
          <SquareDropdown
            usePortal
            options={[
              { value: 'Buku Manasik', label: '📖 Buku Manasik Haji' },
              { value: 'Buku Yasin', label: '📗 Buku Surat Yasin' },
              { value: 'Nota 1 Warna', label: '📋 Nota 1 Warna' },
              { value: 'Brosur 2026', label: '🗞️ Brosur 2026' },
              { value: 'Label KHQ', label: '🏷️ Label KHQ' },
              { value: 'Buku Tulis', label: '📓 Buku Tulis' },
              { value: 'Stopmap', label: '📁 Stopmap' },
              { value: 'Syahadah', label: '🕌 Syahadah' },
              { value: 'Raport Kaleb', label: '📒 Raport Kaleb' },
              { value: 'Kop Surat', label: '📄 Kop Surat' },
              { value: 'Amplop', label: '✉️ Amplop' },
              { value: 'Sertifikat', label: '📜 Sertifikat' },
              { value: 'Undangan', label: '💌 Undangan' },
              { value: 'Buku Tabungan NS', label: '📒 Buku Tabungan NS' },
              { value: 'Buku Tabungan Security', label: '🔒 Buku Tabungan Security' },
              { value: 'Kartu Koperasi Promise', label: '🪪 Kartu Koperasi' },
              { value: 'Lebel Kartu Obat', label: '💊 Lebel Kartu Obat' },
              { value: 'Buku Soft Cover', label: '📗 Buku Soft Cover' },
              { value: 'Buku Soft Cover 14,5×20,25', label: '📗 Buku Soft Cover 14,5×20,25' },
              { value: 'Buku Hard Cover 10,5×14,8', label: '📕 Buku Hard Cover 10,5×14,8' },
              { value: 'Poster', label: '🖼️ Poster' },
              { value: 'Majalah 14,5×20,25', label: '📰 Majalah 14,5×20,25' },
              { value: 'Kalender', label: '🗓️ Kalender 2027' },
              { value: 'Stiker', label: '🏷️ Stiker' },
              { value: 'Buku Soft Cover 10,5×14,8', label: '📗 Buku Soft Cover 10,5×14,8' },
              { value: 'Buku Hard Cover 14,5×20,25', label: '📕 Buku Hard Cover 14,5×20,25' },
              { value: 'Buku Hard Cover 21×29,7', label: '📕 Buku Hard Cover 21×29,7' },
              { value: 'Kalender Kop', label: '🗓️ Kalender Kop' },
              { value: 'Packaging', label: '📦 Packaging' },
              { value: 'Paperbag', label: '🛍️ Paperbag' },
            ]}
            value={selectedProductCategory}
            onChange={(val) => handleProductCategoryChange(val as any)}
            searchPlaceholder="Cari jenis produk..."
            widthClass="w-44"
          />
        </div>
      </div>

      {activeTab === 'parameter' ? (
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
          {selectedProductCategory === 'Buku Manasik' ? (
            <ManasikMasterParameter
              customParams={paramsManasik}
              setCustomParams={setParamsManasik}
            />
          ) : selectedProductCategory === 'Buku Yasin' ? (
            <YasinMasterParameter
              customParams={paramsYasin}
              setCustomParams={setParamsYasin}
            />
          ) : selectedProductCategory === 'Nota 1 Warna' ? (
            <NotaMasterParameter
              customParams={paramsNota}
              setCustomParams={setParamsNota}
            />
          ) : selectedProductCategory === 'Brosur 2026' ? (
            <BrosurMasterParameter
              customParams={paramsBrosur}
              setCustomParams={setParamsBrosur}
            />
          ) : selectedProductCategory === 'Label KHQ' ? (
            <LabelKhqMasterParameter
              customParams={paramsLabelKhq}
              setCustomParams={setParamsLabelKhq}
            />
          ) : selectedProductCategory === 'Buku Tulis' ? (
            <BukuTulisMasterParameter
              customParams={paramsBukuTulis}
              setCustomParams={setParamsBukuTulis}
            />
          ) : selectedProductCategory === 'Stopmap' ? (
            <StopmapMasterParameter
              customParams={paramsStopmap}
              setCustomParams={setParamsStopmap}
            />
          ) : selectedProductCategory === 'Syahadah' ? (
            <SyahadahMasterParameter
              customParams={paramsSyahadah}
              setCustomParams={setParamsSyahadah}
            />
          ) : selectedProductCategory === 'Raport Kaleb' ? (
            <RaportKalebMasterParameter
              customParams={paramsRaportKaleb}
              setCustomParams={setParamsRaportKaleb}
            />
          ) : selectedProductCategory === 'Kop Surat' ? (
            <KopSuratMasterParameter
              customParams={paramsKopSurat}
              setCustomParams={setParamsKopSurat}
            />
          ) : selectedProductCategory === 'Amplop' ? (
            <AmplopMasterParameter
              customParams={paramsAmplop}
              setCustomParams={setParamsAmplop}
            />
          ) : selectedProductCategory === 'Sertifikat' ? (
            <SertifikatMasterParameter
              customParams={paramsSertifikat}
              setCustomParams={setParamsSertifikat}
            />
          ) : selectedProductCategory === 'Undangan' ? (
            <UndanganMasterParameter
              customParams={paramsUndangan}
              setCustomParams={setParamsUndangan}
            />
          ) : selectedProductCategory === 'Buku Tabungan NS' ? (
            <BukuTabunganNsMasterParameter
              customParams={paramsBukuTabunganNs}
              setCustomParams={setParamsBukuTabunganNs}
            />
          ) : selectedProductCategory === 'Buku Tabungan Security' ? (
            <BukuTabunganSecurityMasterParameter
              customParams={paramsBukuTabunganSecurity}
              setCustomParams={setParamsBukuTabunganSecurity}
            />
          ) : selectedProductCategory === 'Kartu Koperasi Promise' ? (
            <KartuKoperasiPromiseMasterParameter
              customParams={paramsKartuKoperasiPromise}
              setCustomParams={setParamsKartuKoperasiPromise}
            />
          ) : selectedProductCategory === 'Lebel Kartu Obat' ? (
            <LebelKartuObatMasterParameter
              customParams={paramsLebelKartuObat}
              setCustomParams={setParamsLebelKartuObat}
            />
          ) : selectedProductCategory === 'Buku Soft Cover' ? (
            <BukuSoftCoverMasterParameter
              customParams={paramsBukuSoftCover}
              setCustomParams={setParamsBukuSoftCover}
            />
          ) : selectedProductCategory === 'Buku Soft Cover 14,5×20,25' ? (
            <BukuSoftCover145x2025MasterParameter
              customParams={paramsBukuSoftCover145x2025}
              setCustomParams={setParamsBukuSoftCover145x2025}
            />
          ) : selectedProductCategory === 'Buku Hard Cover 10,5×14,8' ? (
            <BukuHardCover105x148MasterParameter
              customParams={paramsBukuHardCover105x148}
              setCustomParams={setParamsBukuHardCover105x148}
            />
          ) : selectedProductCategory === 'Poster' ? (
            <PosterMasterParameter
              customParams={paramsPoster}
              setCustomParams={setParamsPoster}
            />
          ) : selectedProductCategory === 'Majalah 14,5×20,25' ? (
            <MajalahMasterParameter
              customParams={paramsMajalah}
              setCustomParams={setParamsMajalah}
            />
          ) : selectedProductCategory === 'Stiker' ? (
            <StikerMasterParameter
              customParams={paramsStiker}
              setCustomParams={setParamsStiker}
            />
          ) : selectedProductCategory === 'Buku Soft Cover 10,5×14,8' ? (
            <BukuSoftCover105x148MasterParameter
              customParams={paramsBukuSoftCover105x148}
              setCustomParams={setParamsBukuSoftCover105x148}
            />
          ) : selectedProductCategory === 'Buku Hard Cover 14,5×20,25' ? (
            <BukuHardCover145x2025MasterParameter
              customParams={paramsBukuHardCover145x2025}
              setCustomParams={setParamsBukuHardCover145x2025}
            />
          ) : selectedProductCategory === 'Buku Hard Cover 21×29,7' ? (
            <BukuHardCover21x297MasterParameter
              customParams={paramsBukuHardCover21x297}
              setCustomParams={setParamsBukuHardCover21x297}
            />
          ) : selectedProductCategory === 'Kalender Kop' ? (
            <KalenderKopMasterParameter
              customParams={paramsKalenderKop}
              setCustomParams={setParamsKalenderKop}
            />
          ) : selectedProductCategory === 'Packaging' ? (
            <PackagingMasterParameter
              customParams={paramsPackaging}
              setCustomParams={setParamsPackaging}
            />
          ) : selectedProductCategory === 'Paperbag' ? (
            <PaperbagMasterParameter
              customParams={paramsPaperbag}
              setCustomParams={setParamsPaperbag}
            />
          ) : (
            <PricelistMasterParameter
              customParams={customParams}
              setCustomParams={setCustomParams}
              activeFinishing={selectedFinishing}
              onChangeFinishing={setSelectedFinishing}
              activeSimulationId={activeSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              onBackToSimulator={() => setActiveTab('simulator')}
            />
          )}
        </div>
      ) : activeTab === 'simulator' ? (
        <div className="flex-1 overflow-y-auto pr-1">
          {selectedProductCategory === 'Buku Manasik' ? (
            <ManasikSimulator
              customParams={paramsManasik}
              setCustomParams={setParamsManasik}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Buku Yasin' ? (
            <YasinSimulator
              customParams={paramsYasin}
              setCustomParams={setParamsYasin}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Nota 1 Warna' ? (
            <NotaSimulator
              customParams={paramsNota}
              setCustomParams={setParamsNota}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Brosur 2026' ? (
            <BrosurSimulator
              customParams={paramsBrosur}
              setCustomParams={setParamsBrosur}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Label KHQ' ? (
            <LabelKhqSimulator
              customParams={paramsLabelKhq}
              setCustomParams={setParamsLabelKhq}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Buku Tulis' ? (
            <BukuTulisSimulator
              customParams={paramsBukuTulis}
              setCustomParams={setParamsBukuTulis}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Stopmap' ? (
            <StopmapSimulator
              customParams={paramsStopmap}
              setCustomParams={setParamsStopmap}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Syahadah' ? (
            <SyahadahSimulator
              customParams={paramsSyahadah}
              setCustomParams={setParamsSyahadah}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Raport Kaleb' ? (
            <RaportKalebSimulator
              customParams={paramsRaportKaleb}
              setCustomParams={setParamsRaportKaleb}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Kop Surat' ? (
            <KopSuratSimulator
              customParams={paramsKopSurat}
              setCustomParams={setParamsKopSurat}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Amplop' ? (
            <AmplopSimulator
              customParams={paramsAmplop}
              setCustomParams={setParamsAmplop}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Sertifikat' ? (
            <SertifikatSimulator
              customParams={paramsSertifikat}
              setCustomParams={setParamsSertifikat}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Undangan' ? (
            <UndanganSimulator
              customParams={paramsUndangan}
              setCustomParams={setParamsUndangan}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Buku Tabungan NS' ? (
            <BukuTabunganNsSimulator
              customParams={paramsBukuTabunganNs}
              setCustomParams={setParamsBukuTabunganNs}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Buku Tabungan Security' ? (
            <BukuTabunganSecuritySimulator
              customParams={paramsBukuTabunganSecurity}
              setCustomParams={setParamsBukuTabunganSecurity}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Kartu Koperasi Promise' ? (
            <KartuKoperasiPromiseSimulator
              customParams={paramsKartuKoperasiPromise}
              setCustomParams={setParamsKartuKoperasiPromise}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Lebel Kartu Obat' ? (
            <LebelKartuObatSimulator
              customParams={paramsLebelKartuObat}
              setCustomParams={setParamsLebelKartuObat}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Buku Soft Cover' ? (
            <BukuSoftCoverSimulator
              customParams={paramsBukuSoftCover}
              setCustomParams={setParamsBukuSoftCover}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Buku Soft Cover 14,5×20,25' ? (
            <BukuSoftCover145x2025Simulator
              customParams={paramsBukuSoftCover145x2025}
              setCustomParams={setParamsBukuSoftCover145x2025}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Buku Hard Cover 10,5×14,8' ? (
            <BukuHardCover105x148Simulator
              customParams={paramsBukuHardCover105x148}
              setCustomParams={setParamsBukuHardCover105x148}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Poster' ? (
            <PosterSimulator
              customParams={paramsPoster}
              setCustomParams={setParamsPoster}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Majalah 14,5×20,25' ? (
            <MajalahSimulator
              customParams={paramsMajalah}
              setCustomParams={setParamsMajalah}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Stiker' ? (
            <StikerSimulator
              customParams={paramsStiker}
              setCustomParams={setParamsStiker}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Buku Soft Cover 10,5×14,8' ? (
            <BukuSoftCover105x148Simulator
              customParams={paramsBukuSoftCover105x148}
              setCustomParams={setParamsBukuSoftCover105x148}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Buku Hard Cover 14,5×20,25' ? (
            <BukuHardCover145x2025Simulator
              customParams={paramsBukuHardCover145x2025}
              setCustomParams={setParamsBukuHardCover145x2025}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Buku Hard Cover 21×29,7' ? (
            <BukuHardCover21x297Simulator
              customParams={paramsBukuHardCover21x297}
              setCustomParams={setParamsBukuHardCover21x297}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Kalender Kop' ? (
            <KalenderKopSimulator
              customParams={paramsKalenderKop}
              setCustomParams={setParamsKalenderKop}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Packaging' ? (
            <PackagingSimulator
              customParams={paramsPackaging}
              viewMode={viewMode}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : selectedProductCategory === 'Paperbag' ? (
            <PaperbagSimulator
              customParams={paramsPaperbag}
              viewMode={viewMode}
              setActiveSimulationTitle={setActiveSimulationTitle}
            />
          ) : (
            <PricelistSimulator
              customParams={customParams}
              setCustomParams={setCustomParams}
              setParamsForFinishing={setParamsForFinishing}
              finishingJilid={selectedFinishing}
              onChangeFinishingJilid={setSelectedFinishing}
              onOpenMasterParam={() => setActiveTab('parameter')}
              activeSimulationId={activeSimulationId}
              setActiveSimulationId={setActiveSimulationId}
              activeSimulationTitle={activeSimulationTitle}
              setActiveSimulationTitle={setActiveSimulationTitle}
              paramsSpiral={paramsSpiral}
              paramsKlem={paramsKlem}
              backupParamsSpiral={backupParamsSpiral}
              setBackupParamsSpiral={setBackupParamsSpiral}
              backupParamsKlem={backupParamsKlem}
              setBackupParamsKlem={setBackupParamsKlem}
            />
          )}
        </div>
      ) : activeTab === 'matrix' ? (
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
          {selectedProductCategory === 'Buku Manasik' ? (
            <ManasikMatrixView
              customParams={paramsManasik}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Buku Yasin' ? (
            <YasinMatrixView
              customParams={paramsYasin}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Nota 1 Warna' ? (
            <NotaMatrixView
              customParams={paramsNota}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Brosur 2026' ? (
            <BrosurMatrixView
              customParams={paramsBrosur}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Label KHQ' ? (
            <LabelKhqMatrixView
              customParams={paramsLabelKhq}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Buku Tulis' ? (
            <BukuTulisMatrixView
              customParams={paramsBukuTulis}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Stopmap' ? (
            <StopmapMatrixView
              customParams={paramsStopmap}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Syahadah' ? (
            <SyahadahMatrixView
              customParams={paramsSyahadah}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Raport Kaleb' ? (
            <RaportKalebMatrixView
              customParams={paramsRaportKaleb}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Kop Surat' ? (
            <KopSuratMatrixView
              customParams={paramsKopSurat}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Amplop' ? (
            <AmplopMatrixView
              customParams={paramsAmplop}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Sertifikat' ? (
            <SertifikatMatrixView
              customParams={paramsSertifikat}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Undangan' ? (
            <UndanganMatrixView
              customParams={paramsUndangan}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Buku Tabungan NS' ? (
            <BukuTabunganNsMatrixView
              customParams={paramsBukuTabunganNs}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Buku Tabungan Security' ? (
            <BukuTabunganSecurityMatrixView
              customParams={paramsBukuTabunganSecurity}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Kartu Koperasi Promise' ? (
            <KartuKoperasiPromiseMatrixView
              customParams={paramsKartuKoperasiPromise}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Lebel Kartu Obat' ? (
            <LebelKartuObatMatrixView
              customParams={paramsLebelKartuObat}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Buku Soft Cover' ? (
            <BukuSoftCoverMatrixView
              customParams={paramsBukuSoftCover}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Buku Soft Cover 14,5×20,25' ? (
            <BukuSoftCover145x2025MatrixView
              customParams={paramsBukuSoftCover145x2025}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Buku Hard Cover 10,5×14,8' ? (
            <BukuHardCover105x148MatrixView
              customParams={paramsBukuHardCover105x148}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Poster' ? (
            <PosterMatrixView
              customParams={paramsPoster}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Majalah 14,5×20,25' ? (
            <MajalahMatrixView
              customParams={paramsMajalah}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Stiker' ? (
            <StikerMatrixView
              customParams={paramsStiker}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Buku Soft Cover 10,5×14,8' ? (
            <BukuSoftCover105x148MatrixView
              customParams={paramsBukuSoftCover105x148}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Buku Hard Cover 14,5×20,25' ? (
            <BukuHardCover145x2025MatrixView
              customParams={paramsBukuHardCover145x2025}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Buku Hard Cover 21×29,7' ? (
            <BukuHardCover21x297MatrixView
              customParams={paramsBukuHardCover21x297}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Kalender Kop' ? (
            <KalenderKopMatrixView
              customParams={paramsKalenderKop}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Packaging' ? (
            <PackagingMatrixView
              customParams={paramsPackaging}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : selectedProductCategory === 'Paperbag' ? (
            <PaperbagMatrixView
              customParams={paramsPaperbag}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : (
            <>
          {/* Upload card */}
          <PricelistExcelUpload lastExcelUpdate={lastExcelUpdate} fileName={fileName} onUploadSuccess={fetchData} />

          {/* Filter & Search Bar - Style Laporan Pekerjaan */}
          <div className="shrink-0 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center gap-2 flex-1 w-full">
              {/* Tombol Reload Data */}
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="h-8 px-3 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm"
                title="Reload Data Pricelist"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
                <span className="hidden sm:inline">Reload</span>
              </button>

              {/* Input Search */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari jenis kalender, bahan, ukuran, oplah, atau mesin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto min-w-0">
              <div className="flex items-center text-xs text-slate-500 font-medium shrink-0">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> Filter:
              </div>

              {isFiltered && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedJenis('ALL');
                    setSelectedBahan('ALL');
                    setSearchTerm('');
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shrink-0"
                  title="Reset Semua Filter"
                >
                  <X size={12} /> Reset
                </button>
              )}

              <SquareDropdown
                options={jenisOptions}
                value={selectedJenis}
                onChange={setSelectedJenis}
                searchPlaceholder="Cari Jenis..."
                widthClass="w-44"
              />

              <SquareDropdown
                options={bahanOptions}
                value={selectedBahan}
                onChange={setSelectedBahan}
                searchPlaceholder="Cari Bahan..."
                widthClass="w-44"
              />

              {/* Finishing Jilid Switcher (Spiral vs Klem) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedFinishing('Spiral')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    selectedFinishing === 'Spiral'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Jilid Spiral Kawat Gantung"
                >
                  <span>Spiral</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFinishing('Klem')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    selectedFinishing === 'Klem'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Jilid Klem Seng (Jepit Kaleng)"
                >
                  <span>Klem</span>
                </button>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0 ml-1">
                <button
                  type="button"
                  onClick={() => setViewMode('matrix')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'matrix'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tampilan Matriks"
                >
                  <LayoutGrid size={13} />
                  <span className="hidden sm:inline">Matriks</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tampilan Tabel Rinci"
                >
                  <TableProperties size={13} />
                  <span className="hidden sm:inline">Tabel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {loading ? (
            <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200">
              <Loader2 size={32} className="animate-spin text-amber-500 mb-2" />
              <p className="text-xs text-slate-500 font-medium">Memuat data pricelist...</p>
            </div>
          ) : activeItems.length === 0 ? (
            <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
                <FileSpreadsheet size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">Belum Ada Data Pricelist</h4>
              <p className="text-xs text-slate-500 max-w-md mb-4">
                Silakan unggah file master <strong>Pricelist Kalender 2027 Spiral.xlsx</strong> melalui tombol upload di atas.
              </p>
            </div>
          ) : viewMode === 'matrix' ? (
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
              {Object.keys(groupedData).length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                  Tidak ada data yang sesuai dengan pencarian atau filter yang dipilih.
                </div>
              ) : (
                Object.entries(groupedData).map(([jenis, bahanGroups]) => (
                  <div key={jenis} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                        <h3 className="text-sm font-bold text-gray-800 tracking-tight">{jenis}</h3>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Finishing: {selectedFinishing === 'Klem' ? 'Klem Seng' : 'Spiral Gantung'}
                      </span>
                    </div>

                    {Object.entries(bahanGroups).map(([bahan, oplahMap]) => (
                      <div key={bahan} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                        <div className="bg-amber-50/70 px-4 py-2 border-b border-amber-100 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-900 tracking-wider uppercase flex items-center gap-1.5">
                            <Layers size={13} className="text-amber-600" />
                            Bahan: {bahan}
                          </span>
                        </div>

                        <div className="overflow-x-auto max-h-[500px]">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-white shadow-xs">
                              <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                                <th className="py-2.5 px-3 border-r border-gray-200 text-center w-16 bg-gray-100" rowSpan={2}>
                                  Oplah
                                </th>
                                <th className="py-2.5 px-3 border-r border-gray-200 text-center w-20 bg-gray-100" rowSpan={2}>
                                  Mesin
                                </th>
                                {allSizes.map((size) => (
                                  <th
                                    key={size}
                                    colSpan={4}
                                    className="py-1.5 px-2 text-center border-r border-gray-200 font-bold text-gray-900 bg-gray-200/80"
                                  >
                                    {size}
                                  </th>
                                ))}
                              </tr>
                              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-600">
                                {allSizes.map((size) => (
                                  <React.Fragment key={size}>
                                    <th className="py-1.5 px-2 text-right font-semibold bg-gray-50">HPP</th>
                                    <th className="py-1.5 px-2 text-right font-bold text-emerald-800 bg-emerald-100/50">Harga</th>
                                    <th className="py-1.5 px-2 text-right font-bold text-blue-800 bg-blue-100/50">Nego</th>
                                    <th className="py-1.5 px-2 text-right font-semibold border-r border-gray-200 bg-gray-50">%</th>
                                  </React.Fragment>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {Object.entries(oplahMap)
                                .sort(([a], [b]) => Number(a) - Number(b))
                                .map(([oplah, { proses, sizes }]) => (
                                  <tr key={oplah} className="hover:bg-amber-50/30 transition-colors">
                                    <td className="py-2 px-3 text-center font-bold text-gray-900 border-r border-gray-200 bg-gray-50/30">
                                      {Number(oplah).toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-2 px-3 text-center text-gray-600 border-r border-gray-200 font-medium">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          proses === 'SM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}
                                      >
                                        {proses}
                                      </span>
                                    </td>
                                    {allSizes.map((size) => {
                                      const cell = sizes[size];
                                      if (!cell) {
                                        return (
                                          <td key={size} colSpan={4} className="py-2 px-2 text-center text-gray-400 border-r border-gray-200">
                                            -
                                          </td>
                                        );
                                      }
                                      return (
                                        <React.Fragment key={size}>
                                          <td className="py-2 px-2 text-right text-gray-500 font-mono">
                                            {formatRupiah(cell.hpp)}
                                          </td>
                                          <td className="py-2 px-2 text-right font-bold text-emerald-700 font-mono bg-emerald-50/30">
                                            {formatRupiah(cell.harga)}
                                          </td>
                                          <td className="py-2 px-2 text-right font-bold text-blue-700 font-mono bg-blue-50/30">
                                            {formatRupiah(cell.harga_nego)}
                                          </td>
                                          <td className="py-2 px-2 text-right text-gray-600 border-r border-gray-200 font-mono">
                                            {formatPercent(cell.profit_pct)}
                                          </td>
                                        </React.Fragment>
                                      );
                                    })}
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Detailed Flat Table View */
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold sticky top-0">
                      <th className="py-2.5 px-3">Jenis Kalender</th>
                      <th className="py-2.5 px-3">Bahan</th>
                      <th className="py-2.5 px-3 text-center">Ukuran</th>
                      <th className="py-2.5 px-3 text-center">Oplah</th>
                      <th className="py-2.5 px-3 text-center">Proses</th>
                      <th className="py-2.5 px-3 text-right">HPP</th>
                      <th className="py-2.5 px-3 text-right text-emerald-700">Harga Jual</th>
                      <th className="py-2.5 px-3 text-right text-blue-700">Harga Nego</th>
                      <th className="py-2.5 px-3 text-right">Margin %</th>
                      <th className="py-2.5 px-3 text-right">Margin Nego %</th>
                      <th className="py-2.5 px-3 text-right">Profit Total</th>
                      <th className="py-2.5 px-3 text-right">Profit Nego</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-amber-50/20">
                        <td className="py-2 px-3 font-semibold text-gray-800">{item.jenis_kalender}</td>
                        <td className="py-2 px-3 text-gray-700">{item.bahan}</td>
                        <td className="py-2 px-3 text-center font-medium text-gray-600">{item.ukuran}</td>
                        <td className="py-2 px-3 text-center font-bold text-gray-900">{item.oplah.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.proses === 'SM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.proses}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-gray-600">{formatRupiah(item.hpp)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                          {formatRupiah(item.harga)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-700 bg-blue-50/30">
                          {formatRupiah(item.harga_nego)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-gray-700">{formatPercent(item.profit_pct)}</td>
                        <td className="py-2 px-3 text-right font-mono text-gray-700">{formatPercent(item.profit_pct_nego)}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatRupiah(item.profit_tot)}</td>
                        <td className="py-2 px-3 text-right font-mono text-blue-700">{formatRupiah(item.profit_tot_nego)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 font-medium">
                Menampilkan {filteredItems.length} dari {items.length} kombinasi tarif
              </div>
            </div>
          )}
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1">
          <SavedCalculationsList
            selectedCategory={selectedProductCategory}
            onLoadSimulation={handleLoadSimulationFromList}
            activeSimulationId={activeSimulationId}
          />
        </div>
      )}

      {/* Modal Master Parameter Global */}
      {showGlobalParamModal && (
        <div
          onClick={() => setShowGlobalParamModal(false)}
          className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden cursor-default"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Master Parameter Global (Shared Rates)</h3>
                  <p className="text-xs text-slate-500">Kalkulasi dan sinkronisasi tarif dasar lintas semua jenis produk</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGlobalParamModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <GlobalMasterParameter
                globalParams={paramsGlobal}
                setGlobalParams={setParamsGlobal}
                onApplyToAllProducts={(applied) => {
                  handleApplyGlobalParams(applied);
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowGlobalParamModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
