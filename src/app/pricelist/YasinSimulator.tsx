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
  calculateYasinSimulator,
  DEFAULT_YASIN_PARAMS,
  YasinMasterParams,
  YasinSimulatorInput,
  YasinSimulatorOutput as YasinSimulatorResult,
} from '@/lib/yasin-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

export interface SavedYasinSimulationItem {
  id: string;
  savedAt: string;
  title: string;
  oplah: number;
  tipeCover: 'Softcover' | 'Hardcover';
  ukuran: '11.7 x 15' | '9.5 x 14';
  jumlahHalamanIsi: 64 | 96 | 112 | 128 | 144 | 192;
  lembarSisipanFoto: number;
  lembarSisipanKeluarga: number;
  laminasiCover: 'Glossy' | 'Doff';
  opsiPitaRumbai: boolean;
  opsiSikuEmas: boolean;
  opsiPlastikOpp: boolean;
  marginPct: number;
  negoDiskonPct: number;
  customParams: YasinMasterParams;
  paramsSnapshot?: YasinMasterParams;
  summary: YasinSimulatorResult['summary'];
  data?: any;
}

const HALAMAN_OPTIONS = [
  { value: 64, label: '64 Halaman', desc: 'Yasin Ringkas / Tahlil' },
  { value: 96, label: '96 Halaman', desc: 'Standar Populer Buya Barokah' },
  { value: 112, label: '112 Halaman', desc: 'Yasin & Tahlil Lengkap' },
  { value: 128, label: '128 Halaman', desc: 'Yasin + Doa-doa Pilihan' },
  { value: 144, label: '144 Halaman', desc: 'Yasin + Surat Pilihan' },
  { value: 192, label: '192 Halaman', desc: 'Kitab Yasin & Majmu Syarif' },
];

const UKURAN_OPTIONS = [
  { value: '11.7 x 15', label: '11.7 x 15 cm', desc: 'Ukuran Standar Umum' },
  { value: '9.5 x 14', label: '9.5 x 14 cm', desc: 'Ukuran Saku / Mini' },
];

interface YasinSimulatorProps {
  customParams?: YasinMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<YasinMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function YasinSimulator({
  customParams = DEFAULT_YASIN_PARAMS,
  setCustomParams,
  onOpenMasterParam,
  activeSimulationId: propActiveSimId,
  setActiveSimulationId: propSetActiveSimId,
  activeSimulationTitle: propActiveSimTitle,
  setActiveSimulationTitle: propSetActiveSimTitle,
}: YasinSimulatorProps) {
  const [oplah, setOplah] = useState<number>(100);
  const [tipeCover, setTipeCover] = useState<'Softcover' | 'Hardcover'>('Hardcover');
  const [ukuran, setUkuran] = useState<'11.7 x 15' | '9.5 x 14'>('11.7 x 15');
  const [jumlahHalamanIsi, setJumlahHalamanIsi] = useState<64 | 96 | 112 | 128 | 144 | 192>(96);
  const [lembarSisipanFoto, setLembarSisipanFoto] = useState<number>(1);
  const [lembarSisipanKeluarga, setLembarSisipanKeluarga] = useState<number>(1);
  const [laminasiCover, setLaminasiCover] = useState<'Glossy' | 'Doff'>('Glossy');
  const [opsiPitaRumbai, setOpsiPitaRumbai] = useState<boolean>(true);
  const [opsiSikuEmas, setOpsiSikuEmas] = useState<boolean>(false);
  const [opsiPlastikOpp, setOpsiPlastikOpp] = useState<boolean>(true);
  const [marginPct, setMarginPct] = useState<number>(30);
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(0);
  const [copiedQuote, setCopiedQuote] = useState(false);

  // Fitur Simpan Simulasi Yasin
  const [savedSimulations, setSavedSimulations] = useState<SavedYasinSimulationItem[]>([]);
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sintak_saved_yasin_simulations');
      if (raw) {
        const list: SavedYasinSimulationItem[] = JSON.parse(raw);
        setSavedSimulations(list);

        if (activeSimulationId) {
          const item = list.find((s) => s.id === activeSimulationId);
          if (item) {
            setOplah(item.oplah);
            setTipeCover(item.tipeCover);
            setUkuran(item.ukuran);
            setJumlahHalamanIsi(item.jumlahHalamanIsi);
            setLembarSisipanFoto(item.lembarSisipanFoto);
            setLembarSisipanKeluarga(item.lembarSisipanKeluarga);
            setLaminasiCover(item.laminasiCover);
            setOpsiPitaRumbai(item.opsiPitaRumbai);
            setOpsiSikuEmas(item.opsiSikuEmas);
            setOpsiPlastikOpp(item.opsiPlastikOpp);
            setMarginPct(item.marginPct);
            setNegoDiskonPct(item.negoDiskonPct);
            setSimulationTitle(item.title);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load saved yasin simulations:', e);
    }
  }, [activeSimulationId]);

  const inputConfig: YasinSimulatorInput = useMemo(
    () => ({
      oplah,
      tipeCover,
      ukuran,
      jumlahHalamanIsi,
      lembarSisipanFoto,
      lembarSisipanKeluarga,
      laminasiCover,
      opsiPitaRumbai: tipeCover === 'Hardcover' ? opsiPitaRumbai : false,
      opsiSikuEmas: tipeCover === 'Hardcover' ? opsiSikuEmas : false,
      opsiPlastikOpp,
      marginPct,
      negoDiskonPct,
    }),
    [
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
    ]
  );

  const result = useMemo(
    () => calculateYasinSimulator(inputConfig, customParams),
    [inputConfig, customParams]
  );

  const handleSaveSimulation = () => {
    const defaultTitle = `Buku Yasin ${tipeCover} ${jumlahHalamanIsi} Hal (${oplah.toLocaleString('id-ID')} buku - ${ukuran} cm)`;
    const titleToUse = simulationTitle.trim() || defaultTitle;

    const newItem: SavedYasinSimulationItem = {
      id: 'sim_yasin_' + Date.now(),
      savedAt: new Date().toISOString(),
      title: titleToUse,
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
      customParams: { ...customParams },
      summary: result.summary,
    };

    const updated = [newItem, ...savedSimulations].slice(0, 50);
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_yasin_simulations', JSON.stringify(updated));
      saveCalculationToDb({ ...newItem, category: 'Buku Yasin' });
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
    const titleToUse = simulationTitle.trim() || activeSimulationTitle || 'Simulasi Yasin';

    const updated = savedSimulations.map((sim) => {
      if (sim.id === activeSimulationId) {
        return {
          ...sim,
          title: titleToUse,
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
          customParams: { ...customParams },
          summary: result.summary,
        };
      }
      return sim;
    });

    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_yasin_simulations', JSON.stringify(updated));
      const targetItem = updated.find((s) => s.id === activeSimulationId);
      if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Buku Yasin' });
      setActiveSimulationTitle(titleToUse);
      toast.success(`Perubahan riwayat "${titleToUse}" berhasil disimpan!`);
    setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    setSimulationTitle('');
    } catch (e) {
      console.error('Failed to update simulation:', e);
      toast.error('Gagal memperbarui riwayat simulasi.');
    }
  };

  const handleLoadSimulation = (item: SavedYasinSimulationItem) => {
    setOplah(item.oplah);
    setTipeCover(item.tipeCover);
    setUkuran(item.ukuran);
    setJumlahHalamanIsi(item.jumlahHalamanIsi);
    setLembarSisipanFoto(item.lembarSisipanFoto);
    setLembarSisipanKeluarga(item.lembarSisipanKeluarga);
    setLaminasiCover(item.laminasiCover);
    setOpsiPitaRumbai(item.opsiPitaRumbai);
    setOpsiSikuEmas(item.opsiSikuEmas);
    setOpsiPlastikOpp(item.opsiPlastikOpp);
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
      localStorage.setItem('sintak_saved_yasin_simulations', JSON.stringify(updated));
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
        sim.tipeCover.toLowerCase().includes(q) ||
        String(sim.jumlahHalamanIsi).includes(q) ||
        String(sim.oplah).includes(q)
    );
  }, [savedSimulations, savedSearchTerm]);

  const handleCopyQuote = () => {
    const text = `*PENAWARAN BUKU SURAT YASIN & TAHLIL*
*PT Buya Barokah*
━━━━━━━━━━━━━━━━━━━━
• *Produk*: Buku Yasin ${tipeCover} (${jumlahHalamanIsi} Halaman)
• *Ukuran*: ${ukuran} cm
• *Kuantitas (Oplah)*: ${oplah.toLocaleString('id-ID')} buku
• *Sisipan Foto*: ${lembarSisipanFoto} Lembar Full Color
• *Sisipan Doa/Keluarga*: ${lembarSisipanKeluarga} Lembar
• *Cover & Finishing*: Cover Laminasi ${laminasiCover}${tipeCover === 'Hardcover' ? ` + Foil Emboss Gembos ${opsiSikuEmas ? '+ Siku Emas ' : ''}${opsiPitaRumbai ? '+ Pita Rumbai ' : ''}` : ''}
• *Kemasan*: ${opsiPlastikOpp ? 'Plastik OPP Satuan' : 'Standar'}
━━━━━━━━━━━━━━━━━━━━
• *Harga Satuan*: *Rp ${result.summary.hargaJualPerPcs.toLocaleString('id-ID')}* / buku
${negoDiskonPct > 0 ? `• *Harga Nego (${negoDiskonPct}%)*: *Rp ${result.summary.hargaNegoPerPcs.toLocaleString('id-ID')}* / buku\n• *Total Penawaran*: *Rp ${result.summary.totalHargaNego.toLocaleString('id-ID')}*` : `• *Total Penawaran*: *Rp ${result.summary.totalHargaJual.toLocaleString('id-ID')}*`}
━━━━━━━━━━━━━━━━━━━━
_Desain foto almarhum & silsilah keluarga dibantu layouting sampai approved._`;

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
              Simulator & Kalkulator Buku Surat Yasin & Tahlil
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Katalog 02
              </span>
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Kalkulasi HPP Softcover & Hardcover lengkap dengan sisipan foto almarhum, doa keluarga, dan foil gembos emas.
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
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Input Spesifikasi Order</h3>
            </div>

            {/* Pilihan Softcover vs Hardcover */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tipe Cover Buku
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Hardcover', 'Softcover'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipeCover(t)}
                    className={`py-2 px-2.5 rounded-lg border text-center font-bold text-xs transition cursor-pointer ${
                      tipeCover === t
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t === 'Hardcover' ? '📘 Hard Cover (Mewah)' : '📄 Soft Cover (Standar)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Oplah & Ukuran */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kuantitas (Oplah)
                </label>
                <ThousandInput
                  value={oplah}
                  allowDecimals={false}
                  onValueChange={(val) => setOplah(Math.max(1, val))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  placeholder="Jumlah buku"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ukuran Buku
                </label>
                <select
                  value={ukuran}
                  onChange={(e) => setUkuran(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                >
                  {UKURAN_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Halaman Isi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jumlah Halaman Kitab Yasin
              </label>
              <div className="grid grid-cols-3 gap-2">
                {HALAMAN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setJumlahHalamanIsi(opt.value as any)}
                    className={`p-2 text-center rounded-lg border text-xs transition cursor-pointer ${
                      jumlahHalamanIsi === opt.value
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {opt.value} Hal
                  </button>
                ))}
              </div>
            </div>

            {/* Sisipan Foto & Sisipan Teks */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sisipan Foto FC (Lbr)
                </label>
                <select
                  value={lembarSisipanFoto}
                  onChange={(e) => setLembarSisipanFoto(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                >
                  {[0, 1, 2, 3, 4, 6, 8].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? 'Tanpa Foto' : `${n} Lembar`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sisipan Silsilah/Doa (Lbr)
                </label>
                <select
                  value={lembarSisipanKeluarga}
                  onChange={(e) => setLembarSisipanKeluarga(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                >
                  {[0, 1, 2, 3, 4, 6].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? 'Tanpa Sisipan' : `${n} Lembar`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Aksesoris & Fitur Tambahan */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laminasiCover === 'Doff'}
                    onChange={(e) => setLaminasiCover(e.target.checked ? 'Doff' : 'Glossy')}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700">Laminasi Doff (Default: Glossy)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opsiPlastikOpp}
                    onChange={(e) => setOpsiPlastikOpp(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700">Plastik Satuan</span>
                </label>
              </div>

              {tipeCover === 'Hardcover' && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-dashed border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={opsiSikuEmas}
                      onChange={(e) => setOpsiSikuEmas(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">Siku Sudut Emas (4 Sudut)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={opsiPitaRumbai}
                      onChange={(e) => setOpsiPitaRumbai(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">Pita Rumbai</span>
                  </label>
                </div>
              )}
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
              <span className="text-slate-400">Format: </span>
              <span className="font-semibold text-slate-800">{tipeCover} ({ukuran} cm)</span>
            </div>
            <div>
              <span className="text-slate-400">Punggung: </span>
              <span className="font-semibold text-slate-800">{result.tebalPunggungCm} cm</span>
            </div>
            <div>
              <span className="text-slate-400">Kebutuhan Cover: </span>
              <span className="font-semibold text-slate-800">{result.kebutuhanA3Cover} Lbr A3+</span>
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
                Oplah: {oplah.toLocaleString('id-ID')} Buku
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

      {/* Modal Daftar Riwayat Simulasi Yasin */}
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
                  <h3 className="text-base font-bold tracking-tight">Daftar Riwayat Simulasi Buku Surat Yasin</h3>
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
                    placeholder="Cari judul, oplah, cover, varian halaman..."
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
                  <p className="text-xs font-semibold text-slate-600">Belum ada riwayat simulasi Yasin yang disimpan.</p>
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
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              sim.tipeCover === 'Hardcover'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {sim.tipeCover}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <span>Oplah: <strong className="text-slate-700 font-mono">{sim.oplah.toLocaleString('id-ID')} buku</strong></span>
                            <span>•</span>
                            <span>Isi: <strong className="text-slate-700">{sim.jumlahHalamanIsi} Hal</strong></span>
                            <span>•</span>
                            <span>Ukuran: <strong className="text-slate-700">{sim.ukuran} cm</strong></span>
                            <span>•</span>
                            <span>Sisipan: <strong className="text-slate-700">{sim.lembarSisipanFoto} F / {sim.lembarSisipanKeluarga} D</strong></span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock size={11} /> {dateFormatted}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <span className="block text-[10px] text-slate-400 font-medium">Harga / Buku</span>
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
                  <h3 className="text-base font-bold tracking-tight">Panduan Simulator Buku Surat Yasin & Tahlil</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Alur perhitungan berbasis blok isi Yasin ready, cover soft/hardcover, sisipan foto/doa, dan aksesoris mewah
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
                  Langkah Menggunakan Simulator Buku Yasin
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">1. Tipe Cover & Isi</span>
                    <p className="text-[11px] text-slate-600">
                      Pilih <strong>Softcover (AC 230)</strong> atau <strong>Hardcover Board Mewah</strong>, lalu pilih tebal isi (64 - 192 Halaman).
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">2. Sisipan Foto & Doa</span>
                    <p className="text-[11px] text-slate-600">
                      Tentukan jumlah lembar <strong>Foto FC Almarhum</strong> (misal 2 lbr) dan <strong>Teks Doa / Silsilah Keluarga</strong> (misal 2 lbr).
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">3. Aksesoris Mewah</span>
                    <p className="text-[11px] text-slate-600">
                      Centang opsi <strong>Pita Pembatas Rumbai</strong>, <strong>Siku Sudut Emas</strong>, serta plastik segel OPP satuan.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">4. Target Margin & Nego</span>
                    <p className="text-[11px] text-slate-600">
                      Tentukan margin keuntungan (+30%) & diskon. Klik <strong>Salin Penawaran</strong> untuk teks WA instan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rincian Komponen Biaya Produksi Yasin */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  Struktur Biaya Produksi Buku Surat Yasin
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-white rounded border border-emerald-100 space-y-1">
                    <span className="font-bold text-emerald-900 block">Struktur Hardcover & Gembos Emas:</span>
                    <p className="text-slate-600 leading-snug">
                      Memakai Greyboard 30, kertas Art Paper 150 cetak custom + laminasi, lembar skiblat pembungkus, dan finishing foil emas (hotprint kaligrafi/nama almarhum).
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-blue-100 space-y-1">
                    <span className="font-bold text-blue-900 block">Perakitan & Finishing:</span>
                    <p className="text-slate-600 leading-snug">
                      Termasuk penyusunan lembar sisipan foto/doa, staples kawat tengah, casing-in pasang cover, potong sisir 3 sisi, pita rumbai, siku sudut emas, dan plastik OPP.
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
