'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { saveCalculationToDb } from '@/lib/pricelist-db-sync';
import {
  BookOpen,
  DollarSign,
  TrendingUp,
  Percent,
  Cpu,
  Info,
  CheckCircle2,
  FileText,
  RotateCcw,
  Copy,
  Check,
  Share2,
  Sparkles,
  Sliders,
  Bookmark,
  BookmarkCheck,
  Clock,
  Trash2,
  Search,
  X,
  Settings2,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import {
  calculateManasikSimulator,
  DEFAULT_MANASIK_PARAMS,
  ManasikMasterParams,
  ManasikSimulatorInput,
  ManasikSimulatorOutput as ManasikSimulatorResult,
  ManasikVarianType,
  MANASIK_VARIAN_CONFIG,
} from '@/lib/manasik-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

export interface SavedManasikSimulationItem {
  id: string;
  savedAt: string;
  title: string;
  varian?: ManasikVarianType;
  oplah: number;
  jumlahHalaman: 48 | 96 | 128 | 192 | 208 | 212 | 216;
  tipeJilid: 'Softcover (Bending/Lem Panas)' | 'Staples Kawat' | 'Tali Kur' | 'Spiral Kawat' | 'Ring Binder (TikTok)';
  metodeCetakCover: 'Otomatis' | 'Print Digital (A3+)' | 'Offset (Oliver)';
  laminasiCover: 'Tanpa Laminasi' | 'Glossy' | 'Doff' | 'UV Varnish';
  opsiPlastikOpp: boolean;
  opsiKardus: boolean;
  opsiSisipan?: boolean;
  marginPct: number;
  negoDiskonPct: number;
  customParams: ManasikMasterParams;
  paramsSnapshot?: ManasikMasterParams;
  summary: ManasikSimulatorResult['summary'];
}

const VARIAN_OPTIONS: { value: ManasikVarianType; label: string; desc: string }[] = [
  {
    value: 'Custom Cover 10 x 15,5',
    label: 'Custom Cover 10 x 15,5 cm',
    desc: 'Cover AC 230 Custom Travel + Sisipan 4 Hal + Blok 212 Hal + Tali Kur (Pricelist 2026)',
  },
  {
    value: 'Kosongan 10 x 15,5',
    label: 'Kosongan 10 x 15,5 cm',
    desc: 'Blok Isi Kosongan 212 Hal HVS 70 (Tanpa Cover Custom)',
  },
  {
    value: 'Mini TikTok 6,3 x 10,3',
    label: 'Cocard 6,3 x 10,3 cm',
    desc: 'Buku Manasik Saku Cocard AC 310 Bolak-balik + Ring Binder 3cm + Tali + Ziplock',
  },
];

const HALAMAN_OPTIONS: Record<ManasikVarianType, { value: number; label: string; desc: string }[]> = {
  'Custom Cover 10 x 15,5': [
    { value: 216, label: '216 Halaman (Standar 2026)', desc: '212 Hal Blok Isi + 4 Hal Sisipan PT' },
    { value: 192, label: '192 Halaman', desc: 'Blok Manasik Lengkap Klasik' },
    { value: 128, label: '128 Halaman', desc: 'Blok Manasik Standar' },
    { value: 96, label: '96 Halaman', desc: 'Blok Manasik Ringkas' },
  ],
  'Kosongan 10 x 15,5': [
    { value: 212, label: '212 Halaman (Standar 2026)', desc: 'Isi Kosongan Standar 2026' },
    { value: 192, label: '192 Halaman', desc: 'Isi Kosongan Lama' },
  ],
  'Mini TikTok 6,3 x 10,3': [
    { value: 48, label: '48 Halaman (24 Kartu)', desc: 'Ukuran saku cocard ring binder' },
  ],
};

const JILID_OPTIONS = [
  { value: 'Tali Kur', label: 'Tali Kur (Standar 2026)', desc: 'Staples + Casing In + Bor Lubang Tali Kur Leher' },
  { value: 'Softcover (Bending/Lem Panas)', label: 'Softcover (Lem Panas)', desc: 'Jilid bending punggung rapi' },
  { value: 'Staples Kawat', label: 'Staples Kawat', desc: 'Staples tengah / casing in ekonomis' },
  { value: 'Spiral Kawat', label: 'Spiral Kawat', desc: 'Jilid kawat ring spiral' },
  { value: 'Ring Binder (TikTok)', label: 'Ring Binder 3cm', desc: 'Khusus varian Cocard (+ Tali Co Card)' },
];

const METODE_OPTIONS = [
  { value: 'Otomatis', label: 'Otomatis (Rekomendasi)', desc: '< 300 POD Digital, >= 300 Offset' },
  { value: 'Print Digital (A3+)', label: 'Digital Print (A3+)', desc: 'Cepat untuk oplah kecil' },
  { value: 'Offset (Oliver)', label: 'Offset Mesin Oliver', desc: 'Ekonomis untuk oplah partai besar' },
];

const LAMINASI_OPTIONS = [
  { value: 'Doff', label: 'Laminasi Doff (Standar 2026)', desc: 'Matte elegan & eksklusif' },
  { value: 'Glossy', label: 'Laminasi Glossy', desc: 'Mengkilap cerah' },
  { value: 'UV Varnish', label: 'UV Varnish', desc: 'Lapisan vernis mengkilap' },
  { value: 'Tanpa Laminasi', label: 'Tanpa Laminasi', desc: 'Standar cetak polos' },
];
interface ManasikSimulatorProps {
  customParams?: ManasikMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<ManasikMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function ManasikSimulator({
  customParams = DEFAULT_MANASIK_PARAMS,
  setCustomParams,
  onOpenMasterParam,
  activeSimulationId: propActiveSimId,
  setActiveSimulationId: propSetActiveSimId,
  activeSimulationTitle: propActiveSimTitle,
  setActiveSimulationTitle: propSetActiveSimTitle,
}: ManasikSimulatorProps) {
  const [varian, setVarian] = useState<ManasikVarianType>('Custom Cover 10 x 15,5');
  const [oplah, setOplah] = useState<number>(500);
  const [jumlahHalaman, setJumlahHalaman] = useState<48 | 96 | 128 | 192 | 208 | 212 | 216>(216);
  const [tipeJilid, setTipeJilid] = useState<
    'Softcover (Bending/Lem Panas)' | 'Staples Kawat' | 'Tali Kur' | 'Spiral Kawat' | 'Ring Binder (TikTok)'
  >('Tali Kur');
  const [metodeCetakCover, setMetodeCetakCover] = useState<
    'Otomatis' | 'Print Digital (A3+)' | 'Offset (Oliver)'
  >('Otomatis');
  const [laminasiCover, setLaminasiCover] = useState<
    'Tanpa Laminasi' | 'Glossy' | 'Doff' | 'UV Varnish'
  >('Doff');
  const [opsiPlastikOpp, setOpsiPlastikOpp] = useState<boolean>(true);
  const [opsiKardus, setOpsiKardus] = useState<boolean>(true);
  const [opsiSisipan, setOpsiSisipan] = useState<boolean>(true);
  const [marginPct, setMarginPct] = useState<number>(30);
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(0);
  const [copiedQuote, setCopiedQuote] = useState(false);

  // Fitur Simpan Simulasi Manasik
  const [savedSimulations, setSavedSimulations] = useState<SavedManasikSimulationItem[]>([]);
  const [simulationTitle, setSimulationTitle] = useState('');
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const [internalActiveTitle, setInternalActiveTitle] = useState<string | null>(null);
  const [showSavedListModal, setShowSavedListModal] = useState(false);
  const [savedSearchTerm, setSavedSearchTerm] = useState('');
  const [showSimulatorManual, setShowSimulatorManual] = useState(false);

  const activeSimulationId = propActiveSimId !== undefined ? propActiveSimId : internalActiveId;
  const setActiveSimulationId = (id: string | null) => {
    if (propSetActiveSimId) propSetActiveSimId(id);
    else setInternalActiveId(id);
  };

  const activeSimulationTitle = propActiveSimTitle !== undefined ? propActiveSimTitle : internalActiveTitle;
  const setActiveSimulationTitle = (title: string | null) => {
    if (propSetActiveSimTitle) propSetActiveSimTitle(title);
    else setInternalActiveTitle(title);
  };

  // Handle change varian
  const handleVarianChange = (newVarian: ManasikVarianType) => {
    setVarian(newVarian);
    const cfg = MANASIK_VARIAN_CONFIG[newVarian];
    setJumlahHalaman(cfg.defaultHal);
    setTipeJilid(cfg.defaultJilid);
    if (newVarian === 'Mini TikTok 6,3 x 10,3') {
      setLaminasiCover('Glossy');
      setOpsiPlastikOpp(false);
      setOpsiSisipan(false);
      setMarginPct(32);
    } else if (newVarian === 'Kosongan 10 x 15,5') {
      setLaminasiCover('Tanpa Laminasi');
      setOpsiPlastikOpp(false);
      setOpsiSisipan(false);
      setMarginPct(30);
    } else {
      setLaminasiCover('Doff');
      setOpsiPlastikOpp(true);
      setOpsiSisipan(true);
      setMarginPct(30);
    }
  };

  // Load saved simulations & load draft simulator states from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sintak_saved_manasik_simulations');
      if (raw) {
        const list: SavedManasikSimulationItem[] = JSON.parse(raw);
        setSavedSimulations(list);

        if (activeSimulationId) {
          const item = list.find((s) => s.id === activeSimulationId);
          if (item) {
            if (item.varian) setVarian(item.varian);
            setOplah(item.oplah);
            setJumlahHalaman(item.jumlahHalaman);
            setTipeJilid(item.tipeJilid);
            setMetodeCetakCover(item.metodeCetakCover);
            setLaminasiCover(item.laminasiCover);
            setOpsiPlastikOpp(item.opsiPlastikOpp);
            setOpsiKardus(item.opsiKardus);
            setOpsiSisipan(Boolean(item.opsiSisipan));
            setMarginPct(item.marginPct);
            setNegoDiskonPct(item.negoDiskonPct);
            setSimulationTitle(item.title);
            return;
          }
        }
      }

      // Restore draft settingan pengguna dari localStorage saat pindah tab
      const rawDraft = localStorage.getItem('sintak_manasik_simulator_draft');
      if (rawDraft) {
        const d = JSON.parse(rawDraft);
        if (d.varian !== undefined) setVarian(d.varian);
        if (d.oplah !== undefined) setOplah(Number(d.oplah) || 500);
        if (d.jumlahHalaman !== undefined) setJumlahHalaman(d.jumlahHalaman);
        if (d.tipeJilid !== undefined) setTipeJilid(d.tipeJilid);
        if (d.metodeCetakCover !== undefined) setMetodeCetakCover(d.metodeCetakCover);
        if (d.laminasiCover !== undefined) setLaminasiCover(d.laminasiCover);
        if (d.opsiPlastikOpp !== undefined) setOpsiPlastikOpp(Boolean(d.opsiPlastikOpp));
        if (d.opsiKardus !== undefined) setOpsiKardus(Boolean(d.opsiKardus));
        if (d.opsiSisipan !== undefined) setOpsiSisipan(Boolean(d.opsiSisipan));
        if (d.marginPct !== undefined) setMarginPct(Number(d.marginPct) || 30);
        if (d.negoDiskonPct !== undefined) setNegoDiskonPct(Number(d.negoDiskonPct) || 0);
      }
    } catch (e) {
      console.error('Failed to load saved manasik simulations or draft:', e);
    }
  }, [activeSimulationId]);

  // Simpan draft settingan simulator secara otomatis saat ada perubahan input (auto-persist)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const draft = {
          varian,
          oplah,
          jumlahHalaman,
          tipeJilid,
          metodeCetakCover,
          laminasiCover,
          opsiPlastikOpp,
          opsiKardus,
          opsiSisipan,
          marginPct,
          negoDiskonPct,
        };
        localStorage.setItem('sintak_manasik_simulator_draft', JSON.stringify(draft));
      } catch (e) {
        console.error('Failed to save manasik simulator draft:', e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [
    varian,
    oplah,
    jumlahHalaman,
    tipeJilid,
    metodeCetakCover,
    laminasiCover,
    opsiPlastikOpp,
    opsiKardus,
    opsiSisipan,
    marginPct,
    negoDiskonPct,
  ]);

  const inputConfig: ManasikSimulatorInput = useMemo(
    () => ({
      varian,
      oplah,
      jumlahHalaman,
      tipeJilid,
      metodeCetakCover,
      laminasiCover,
      opsiPlastikOpp,
      opsiKardus,
      opsiSisipan,
      marginPct,
      negoDiskonPct,
    }),
    [
      varian,
      oplah,
      jumlahHalaman,
      tipeJilid,
      metodeCetakCover,
      laminasiCover,
      opsiPlastikOpp,
      opsiKardus,
      opsiSisipan,
      marginPct,
      negoDiskonPct,
    ]
  );

  const result = useMemo(() => {
    return calculateManasikSimulator(inputConfig, customParams);
  }, [inputConfig, customParams]);

  const handleSaveSimulation = () => {
    const defaultTitle = `${varian} ${jumlahHalaman} Hal (${oplah.toLocaleString('id-ID')} eks - ${tipeJilid})`;
    const titleToUse = simulationTitle.trim() || defaultTitle;

    const newItem: SavedManasikSimulationItem = {
      id: 'sim_manasik_' + Date.now(),
      savedAt: new Date().toISOString(),
      title: titleToUse,
      varian,
      oplah,
      jumlahHalaman,
      tipeJilid,
      metodeCetakCover,
      laminasiCover,
      opsiPlastikOpp,
      opsiKardus,
      opsiSisipan,
      marginPct,
      negoDiskonPct,
      customParams: { ...customParams },
      summary: result.summary,
    };

    const updated = [newItem, ...savedSimulations].slice(0, 50);
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_manasik_simulations', JSON.stringify(updated));
      saveCalculationToDb({ ...newItem, category: 'Buku Manasik' });
      setActiveSimulationId(null);
      if (setActiveSimulationTitle) setActiveSimulationTitle(null);
      setSimulationTitle('');
      toast.success(`Simulasi "${titleToUse}" berhasil disimpan sebagai kalkulasi baru & keluar dari mode edit!`);
    } catch (e) {
      console.error('Failed to save simulation:', e);
      toast.error('Gagal menyimpan hasil simulasi.');
    }
  };

  const handleUpdateSavedSimulation = () => {
    if (!activeSimulationId) return;
    const titleToUse = simulationTitle.trim() || activeSimulationTitle || 'Simulasi Manasik';

    const updated = savedSimulations.map((sim) => {
      if (sim.id === activeSimulationId) {
        return {
          ...sim,
          title: titleToUse,
          varian,
          oplah,
          jumlahHalaman,
          tipeJilid,
          metodeCetakCover,
          laminasiCover,
          opsiPlastikOpp,
          opsiKardus,
          opsiSisipan,
          marginPct,
          negoDiskonPct,
          customParams: { ...customParams },
          summary: result.summary,
        };
      }
      return sim;
    });
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_manasik_simulations', JSON.stringify(updated));
      const targetItem = updated.find((s) => s.id === activeSimulationId);
      if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Buku Manasik' });
      setActiveSimulationTitle(titleToUse);
      toast.success(`Perubahan pada simulasi "${titleToUse}" berhasil diperbarui!`);
    } catch (e) {
      console.error('Failed to update simulation:', e);
      toast.error('Gagal memperbarui riwayat simulasi.');
    }
  };

  const handleLoadSimulation = (item: SavedManasikSimulationItem) => {
    if (item.varian) setVarian(item.varian);
    setOplah(item.oplah);
    setJumlahHalaman(item.jumlahHalaman);
    setTipeJilid(item.tipeJilid);
    setMetodeCetakCover(item.metodeCetakCover);
    setLaminasiCover(item.laminasiCover);
    setOpsiPlastikOpp(item.opsiPlastikOpp);
    setOpsiKardus(item.opsiKardus);
    if (item.opsiSisipan !== undefined) setOpsiSisipan(item.opsiSisipan);
    setMarginPct(item.marginPct);
    setNegoDiskonPct(item.negoDiskonPct);
    if (setCustomParams && item.customParams) {
      setCustomParams(item.customParams);
    }

    setActiveSimulationId(item.id);
    setActiveSimulationTitle(item.title);
    setSimulationTitle(item.title);
    setShowSavedListModal(false);
    toast.info(`Memuat simulasi: ${item.title}`);
  };

  const handleDeleteSavedSimulation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSimulations.filter((s) => s.id !== id);
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_manasik_simulations', JSON.stringify(updated));
      toast.success('Riwayat simulasi berhasil dihapus.');
      if (activeSimulationId === id) {
        setActiveSimulationId(null);
        setActiveSimulationTitle(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSavedSimulations = useMemo(() => {
    if (!savedSearchTerm.trim()) return savedSimulations;
    const q = savedSearchTerm.toLowerCase();
    return savedSimulations.filter(
      (sim) =>
        sim.title.toLowerCase().includes(q) ||
        sim.tipeJilid.toLowerCase().includes(q) ||
        (sim.varian && sim.varian.toLowerCase().includes(q)) ||
        String(sim.jumlahHalaman).includes(q) ||
        String(sim.oplah).includes(q)
    );
  }, [savedSimulations, savedSearchTerm]);

  const handleCopyQuote = () => {
    const text = `*PENAWARAN BUKU PANDUAN MANASIK HAJI / UMROH*
*PT Buya Barokah*
━━━━━━━━━━━━━━━━━━━━
• *Produk*: ${varian}
• *Halaman*: ${jumlahHalaman} Halaman
• *Ukuran*: ${MANASIK_VARIAN_CONFIG[varian].ukuran}
• *Kuantitas (Oplah)*: ${oplah.toLocaleString('id-ID')} eks
• *Cover*: ${MANASIK_VARIAN_CONFIG[varian].defaultCover} + Laminasi ${laminasiCover}
• *Model Jilid*: ${tipeJilid}
• *Kemasan*: ${opsiPlastikOpp ? 'Plastik OPP Satuan' : 'Standar'} + ${opsiKardus ? 'Kardus Master' : ''}
━━━━━━━━━━━━━━━━━━━━
• *Harga Satuan*: *Rp ${result.summary.hargaJualPerPcs.toLocaleString('id-ID')}* / eks
${negoDiskonPct > 0 ? `• *Harga Nego (${negoDiskonPct}%)*: *Rp ${result.summary.hargaNegoPerPcs.toLocaleString('id-ID')}* / eks\n• *Total Penawaran*: *Rp ${result.summary.totalHargaNego.toLocaleString('id-ID')}*` : `• *Total Penawaran*: *Rp ${result.summary.totalHargaJual.toLocaleString('id-ID')}*`}
━━━━━━━━━━━━━━━━━━━━
_Harga belum termasuk PPN. Spesifikasi & desain dapat dikonsultasikan lebih lanjut._`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Penawaran format WhatsApp berhasil disalin!');
    setTimeout(() => setCopiedQuote(false), 2500);
  };
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-emerald-950 flex items-center gap-2">
              Simulator & Kalkulator Buku Manasik Haji / Umroh
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Katalog 01
              </span>
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Kalkulasi HPP cepat berbasis blok isi ready, cover custom, laminasi, dan variasi jilid cocard/bending.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyQuote}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
              copiedQuote
                ? 'bg-emerald-700 text-white'
                : 'bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300'
            }`}
            title="Salin ringkasan spesifikasi & penawaran harga ke WhatsApp / Clipboard"
          >
            {copiedQuote ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copiedQuote ? 'Tersalin!' : 'Salin Penawaran'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSimulatorManual(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all shadow-2xs cursor-pointer"
          >
            <Info size={14} />
            <span>Panduan</span>
          </button>
          {onOpenMasterParam && (
            <button
              type="button"
              onClick={onOpenMasterParam}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all shadow-2xs cursor-pointer"
            >
              <Settings2 size={14} />
              <span>Master Parameter</span>
            </button>
          )}
        </div>
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Input Spesifikasi */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Input Spesifikasi Order</h3>
            </div>
            {/* Pilihan Varian Produk */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Model / Varian Buku Manasik
              </label>
              <div className="grid grid-cols-1 gap-2">
                {VARIAN_OPTIONS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => handleVarianChange(v.value)}
                    className={`p-2 px-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      varian === v.value
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold">{v.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{v.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Oplah */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Kuantitas Order (Oplah)</label>
                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {oplah.toLocaleString('id-ID')} Eks
                </span>
              </div>
              <ThousandInput
                value={oplah}
                allowDecimals={false}
                onValueChange={(val) => setOplah(Math.max(1, val))}
                placeholder="Jumlah pesanan (eks)"
                className="w-full px-3 py-2 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Jumlah Halaman */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Varian Isi Buku Manasik
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(HALAMAN_OPTIONS[varian] || HALAMAN_OPTIONS['Custom Cover 10 x 15,5']).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setJumlahHalaman(opt.value as any)}
                    className={`p-2 px-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      jumlahHalaman === opt.value
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs">{opt.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tipe Jilid & Finishing */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Model Jilid & Binding
              </label>
              <div className="grid grid-cols-1 gap-2">
                {JILID_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTipeJilid(opt.value as any)}
                    className={`p-2 px-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      tipeJilid === opt.value
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs">{opt.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Laminasi Cover */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Laminasi Cover
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LAMINASI_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLaminasiCover(opt.value as any)}
                    className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      laminasiCover === opt.value
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs block">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cetak Cover */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Metode Produksi Cover
              </label>
              <select
                value={metodeCetakCover}
                onChange={(e) => setMetodeCetakCover(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              >
                {METODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.desc})
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox Kemasan & Sisipan */}
            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2 text-xs">
              {varian === 'Custom Cover 10 x 15,5' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opsiSisipan}
                    onChange={(e) => setOpsiSisipan(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 font-medium">Sisipan 4 Halaman (Nama/Biro Travel)</span>
                </label>
              )}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opsiPlastikOpp}
                    onChange={(e) => setOpsiPlastikOpp(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700">Plastik OPP Satuan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opsiKardus}
                    onChange={(e) => setOpsiKardus(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700">Packing Kardus Master</span>
                </label>
              </div>
            </div>

            {/* Margin & Nego */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Margin (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={marginPct}
                    onChange={(e) => setMarginPct(Number(e.target.value) || 0)}
                    className="w-full pl-3 pr-7 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Diskon Nego (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={negoDiskonPct}
                    onChange={(e) => setNegoDiskonPct(Number(e.target.value) || 0)}
                    className="w-full pl-3 pr-7 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Kalkulasi & Breakdown */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card Hasil Ringkasan - Soft Style Presisi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* HPP Modal Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">HPP Modal</span>
                <DollarSign size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                  Rp {result.summary.hppPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Biaya modal per unit</span>
              </div>
            </div>

            {/* Harga Jual Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[11px] font-bold">Harga Jual (+{marginPct}%)</span>
                <TrendingUp size={13} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                  Rp {result.summary.hargaJualPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-emerald-700/80 mt-0.5">Rekomendasi harga</span>
              </div>
            </div>

            {/* Harga Nego Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-800 mb-1">
                <span className="text-[11px] font-bold">Harga Nego (-{negoDiskonPct}%)</span>
                <Percent size={13} className="text-blue-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-blue-800 font-mono">
                  Rp {result.summary.hargaNegoPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-blue-700/80 mt-0.5">Batas aman diskon</span>
              </div>
            </div>

            {/* Estimasi Profit Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">Total Profit</span>
                <TrendingUp size={13} className="text-emerald-500" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                  Rp {(negoDiskonPct > 0 ? result.summary.totalProfitNego : result.summary.totalProfit).toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Omset: Rp {(negoDiskonPct > 0 ? result.summary.totalHargaNego : result.summary.totalHargaJual).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Info Teknis Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div>
              <span className="text-slate-400">Metode Cover: </span>
              <span className="font-semibold text-slate-800">{result.metodeCoverTerpilih}</span>
            </div>
            <div>
              <span className="text-slate-400">Punggung: </span>
              <span className="font-semibold text-slate-800">{result.tebalPunggungCm} cm</span>
            </div>
            <div>
              <span className="text-slate-400">Kebutuhan Cover: </span>
              <span className="font-semibold text-slate-800">
                {result.kebutuhanA3Cover > 0 ? `${result.kebutuhanA3Cover} Lbr A3+` : `${result.kebutuhanPlanoCover} Lbr Plano`}
              </span>
            </div>
          </div>

          {/* Breakdown Komponen Biaya */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Rincian Estimasi Komponen Biaya
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Oplah: {oplah.toLocaleString('id-ID')} Eks
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2 px-3 w-10 text-center">No</th>
                    <th className="py-2 px-3">Komponen Biaya</th>
                    <th className="py-2 px-3 hidden sm:table-cell text-slate-400">Formula / Deskripsi</th>
                    <th className="py-2 px-3 text-right">Subtotal (Rp)</th>
                    <th className="py-2 px-3 text-right w-16">% Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.breakdown.map((item, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {item.nama}
                        </td>
                        <td className="py-2 px-3 hidden sm:table-cell text-slate-500 text-[11px]">
                          {item.keterangan}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                          Rp {item.nominal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500 text-[11px]">
                          {item.pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50/60 border-t-2 border-emerald-200 font-bold text-emerald-950">
                    <td colSpan={2} className="py-2.5 px-3 uppercase text-emerald-950 font-black text-[11px]">
                      TOTAL BIAYA PRODUKSI
                    </td>
                    <td className="hidden sm:table-cell"></td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-900 font-black text-sm">
                      Rp {result.summary.totalHpp.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-emerald-800">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Fitur Simpan Hasil Simulasi */}
          {activeSimulationId ? (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleUpdateSavedSimulation}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <BookmarkCheck size={15} />
                <span>Update Perubahan</span>
              </button>
              <button
                type="button"
                onClick={handleSaveSimulation}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                title="Simpan sebagai riwayat baru tanpa menimpa yang lama"
              >
                <Bookmark size={14} />
                <span>Simpan Baru</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSaveSimulation}
              className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <BookmarkCheck size={15} />
              <span>Simpan Hasil Simulasi</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal Daftar Riwayat Simulasi Manasik */}
      {showSavedListModal && (
        <div
          onClick={() => setShowSavedListModal(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Daftar Riwayat Simulasi Buku Manasik</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Klik pada simulasi yang diinginkan untuk memuat kembali parameter ke simulator
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSavedListModal(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {/* Search Bar */}
              {savedSimulations.length > 0 && (
                <div className="relative pb-1 border-b border-slate-100">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari judul, oplah, varian halaman, tipe jilid..."
                    value={savedSearchTerm}
                    onChange={(e) => setSavedSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  {savedSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setSavedSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}

              {savedSimulations.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Bookmark className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-600">Belum ada riwayat simulasi Manasik yang disimpan.</p>
                  <p className="text-[11px] text-slate-400">
                    Gunakan tombol &quot;Simpan Hasil Simulasi&quot; di bagian bawah simulator untuk menyimpan skenario hitungan.
                  </p>
                </div>
              ) : filteredSavedSimulations.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <p className="text-xs font-semibold text-slate-600">Tidak ada riwayat yang cocok dengan pencarian.</p>
                  <button
                    type="button"
                    onClick={() => setSavedSearchTerm('')}
                    className="text-[11px] text-emerald-700 font-bold underline cursor-pointer"
                  >
                    Reset Pencarian
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {filteredSavedSimulations.map((sim) => {
                    const dateFormatted = new Date(sim.savedAt).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={sim.id}
                        onClick={() => handleLoadSimulation(sim)}
                        className="p-3.5 hover:bg-emerald-50/40 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 truncate">
                              {sim.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {sim.jumlahHalaman} Hal
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <span>Oplah: <strong className="text-slate-700 font-mono">{sim.oplah.toLocaleString('id-ID')} eks</strong></span>
                            <span>•</span>
                            <span>Jilid: <strong className="text-slate-700">{sim.tipeJilid}</strong></span>
                            <span>•</span>
                            <span>Cover: <strong className="text-slate-700">{sim.laminasiCover}</strong></span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock size={11} /> {dateFormatted}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <span className="block text-[10px] text-slate-400 font-medium">Harga / Eks</span>
                            <span className="text-xs font-bold font-mono text-emerald-700">
                              Rp {sim.summary.hargaJualPerPcs.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSavedSimulation(sim.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Simulasi"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>Total tersimpan: <strong>{savedSimulations.length}</strong> / 50</span>
              <button
                type="button"
                onClick={() => setShowSavedListModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all cursor-pointer shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Panduan Penggunaan Simulator */}
      {showSimulatorManual && (
        <div
          onClick={() => setShowSimulatorManual(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Panduan Simulator Buku Manasik Haji / Umroh</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Alur perhitungan berbasis blok isi siap pakai, variasi cover, laminasi, dan jilid cocard / bending
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSimulatorManual(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              {/* Alur Kerja Simulator */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Langkah Menggunakan Simulator Buku Manasik 2026
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">1. Pilih Model Varian</span>
                    <p className="text-[11px] text-slate-600">
                      Pilih: <strong>Custom Cover 10×15,5</strong> (standar 2026), <strong>Kosongan</strong>, atau <strong>Cocard 6,3×10,3</strong>. Parameter otomatis menyesuaikan.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">2. Tentukan Oplah & Halaman</span>
                    <p className="text-[11px] text-slate-600">
                      Tentukan kuantiti (20 s/d 5.000 eks) dan varian isi (misal 216 hal untuk 212 blok + 4 sisipan PT).
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">3. Jilid, Finishing & Sisipan</span>
                    <p className="text-[11px] text-slate-600">
                      Tersedia: <strong>Staples + Casing In + Tali Kur</strong>, <strong>Bending Lem Panas</strong>, <strong>Spiral</strong>, atau <strong>Ring Binder 3cm + Tali Co Card</strong>.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">4. Target Margin & Salin WA</span>
                    <p className="text-[11px] text-slate-600">
                      Harga jual terhubung ke pricelist resmi Excel 2026. Klik <strong>Salin Penawaran</strong> untuk teks WA instan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rincian Komponen Biaya Produksi Manasik */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  Struktur Biaya Produksi Berdasarkan 3 Varian (Pricelist 2026)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-2.5 bg-white rounded border border-emerald-100 space-y-1">
                    <span className="font-bold text-emerald-900 block">Custom Cover 10 x 15,5 cm:</span>
                    <p className="text-slate-600 leading-snug">
                      Cover AC 230 gsm POD/Oliver + Laminasi Doff + Sisipan 4 hal PT + Blok isi 212 hal + Staples tengah 1213 + Casing In + Bor + Tali Kur warna leher + Plastik OPP + Kardus master.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-blue-100 space-y-1">
                    <span className="font-bold text-blue-900 block">Kosongan 10 x 15,5 cm:</span>
                    <p className="text-slate-600 leading-snug">
                      Blok isi 212 hal HVS 70 gsm cetak mesin Buya/Web Rotary, finishing pelipatan kuras, susun urut, lem panas bending, dan kemasan kardus master.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-purple-100 space-y-1">
                    <span className="font-bold text-purple-900 block">Cocard 6,3 x 10,3 cm:</span>
                    <p className="text-slate-600 leading-snug">
                      Art Carton 310 gsm full color bolak-balik (48 hal / 24 kartu) + Laminasi glossy + Pisau & jasa pond sudut + Ring binder 3cm + Tali cocard + Plastik ziplock.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSimulatorManual(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all cursor-pointer shadow-xs"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
