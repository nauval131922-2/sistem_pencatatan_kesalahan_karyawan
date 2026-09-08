'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { saveCalculationToDb } from '@/lib/pricelist-db-sync';
import {
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  Percent,
  FileText,
  Copy,
  Check,
  Share2,
  Sliders,
  Bookmark,
  BookmarkCheck,
  X,
  Settings2,
  Calculator,
  Info,
  Layers,
  RefreshCw,
} from 'lucide-react';
import {
  calculateNotaSimulator,
  DEFAULT_NOTA_PARAMS,
  NotaMasterParams,
  NotaRangkapType,
  NotaUkuranType,
  NotaSimulatorInput,
  NotaSimulatorResult,
} from '@/lib/nota-calculator';
import { toast } from '@/lib/toast';

export interface SavedNotaSimulationItem {
  id: string;
  savedAt: string;
  title: string;
  oplahRim: number;
  rangkap: NotaRangkapType;
  ukuran: NotaUkuranType;
  jumlahWarna: 1 | 2;
  opsiPorporasi: boolean;
  opsiNomorator: boolean;
  marginPct: number;
  negoDiskonPct: number;
  customParams: NotaMasterParams;
  paramsSnapshot?: NotaMasterParams;
  summary: NotaSimulatorResult['summary'];
}

const RANGKAP_OPTIONS: Array<{ value: NotaRangkapType; label: string; desc: string }> = [
  { value: 1, label: '1 Rangkap (HVS 70)', desc: '100 lembar per buku (5 buku/rim)' },
  { value: 2, label: '2 Rangkap (NCR 55)', desc: '50 set per buku (10 buku/rim)' },
  { value: 3, label: '3 Rangkap (NCR 55)', desc: '50 set per buku (10 buku/rim)' },
  { value: 4, label: '4 Rangkap (NCR 55)', desc: '50 set per buku (10 buku/rim)' },
];

const UKURAN_OPTIONS: Array<{ value: NotaUkuranType; label: string; desc: string }> = [
  { value: 'Folio (21.5 x 33)', label: 'Folio (1/1 Folio)', desc: '21.5 x 33 cm (Ukuran Penuh)' },
  { value: '1/2 Folio (16.5 x 21.5)', label: '1/2 Folio (Kwitansi/Surat Jalan)', desc: '16.5 x 21.5 cm (2 buku per lembar)' },
  { value: '1/3 Folio (11 x 21.5)', label: '1/3 Folio (Nota Kasir Panjang)', desc: '11 x 21.5 cm (3 buku per lembar)' },
  { value: '1/4 Folio (10.7 x 16.5)', label: '1/4 Folio (Nota Toko Standar Populer)', desc: '10.7 x 16.5 cm (4 buku per lembar)' },
  { value: '1/6 Folio (10.7 x 11)', label: '1/6 Folio (Tanda Terima Mini)', desc: '10.7 x 11 cm (6 buku per lembar)' },
  { value: '1/8 Folio (10.75 x 8.25)', label: '1/8 Folio (Kupon / Karcis)', desc: '10.75 x 8.25 cm (8 buku per lembar)' },
];

interface NotaSimulatorProps {
  customParams?: NotaMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<NotaMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function NotaSimulator({
  customParams = DEFAULT_NOTA_PARAMS,
  setCustomParams,
  onOpenMasterParam,
  activeSimulationId: propActiveSimId,
  setActiveSimulationId: propSetActiveSimId,
  activeSimulationTitle: propActiveSimTitle,
  setActiveSimulationTitle: propSetActiveSimTitle,
}: NotaSimulatorProps) {
  const [oplahRim, setOplahRim] = useState<number>(1);
  const [rangkap, setRangkap] = useState<NotaRangkapType>(1);
  const [ukuran, setUkuran] = useState<NotaUkuranType>('1/4 Folio (10.7 x 16.5)');
  const [jumlahWarna, setJumlahWarna] = useState<1 | 2>(1);
  const [opsiPorporasi, setOpsiPorporasi] = useState<boolean>(true);
  const [opsiNomorator, setOpsiNomorator] = useState<boolean>(false);
  const [marginPct, setMarginPct] = useState<number>(30);
  const [negoDiskonPct, setNegoDiskonPct] = useState<number>(4);
  const [copiedQuote, setCopiedQuote] = useState(false);

  // Fitur Simpan Simulasi Nota
  const [savedSimulations, setSavedSimulations] = useState<SavedNotaSimulationItem[]>([]);
  const [simulationTitle, setSimulationTitle] = useState('');
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const [internalActiveTitle, setInternalActiveTitle] = useState<string | null>(null);
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

  // Load saved simulations & load draft simulator states from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sintak_saved_nota_simulations');
      if (raw) {
        const list: SavedNotaSimulationItem[] = JSON.parse(raw);
        setSavedSimulations(list);

        if (activeSimulationId) {
          const item = list.find((s) => s.id === activeSimulationId);
          if (item) {
            setOplahRim(item.oplahRim);
            setRangkap(item.rangkap);
            setUkuran(item.ukuran);
            setJumlahWarna(item.jumlahWarna);
            setOpsiPorporasi(item.opsiPorporasi);
            setOpsiNomorator(item.opsiNomorator);
            setMarginPct(item.marginPct);
            setNegoDiskonPct(item.negoDiskonPct);
            setSimulationTitle(item.title);
            return;
          }
        }
      }

      // Restore draft settingan pengguna dari localStorage saat pindah tab
      const rawDraft = localStorage.getItem('sintak_nota_simulator_draft');
      if (rawDraft) {
        const d = JSON.parse(rawDraft);
        if (d.oplahRim !== undefined) setOplahRim(Number(d.oplahRim) || 1);
        if (d.rangkap !== undefined) setRangkap(d.rangkap);
        if (d.ukuran !== undefined) setUkuran(d.ukuran);
        if (d.jumlahWarna !== undefined) setJumlahWarna(d.jumlahWarna);
        if (d.opsiPorporasi !== undefined) setOpsiPorporasi(Boolean(d.opsiPorporasi));
        if (d.opsiNomorator !== undefined) setOpsiNomorator(Boolean(d.opsiNomorator));
        if (d.marginPct !== undefined) setMarginPct(Number(d.marginPct) || 30);
        if (d.negoDiskonPct !== undefined) setNegoDiskonPct(Number(d.negoDiskonPct) || 0);
      }
    } catch (e) {
      console.error('Failed to load saved nota simulations or draft:', e);
    }
  }, [activeSimulationId]);

  // Simpan draft settingan simulator secara otomatis saat ada perubahan input (auto-persist)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const draft = {
          oplahRim,
          rangkap,
          ukuran,
          jumlahWarna,
          opsiPorporasi,
          opsiNomorator,
          marginPct,
          negoDiskonPct,
        };
        localStorage.setItem('sintak_nota_simulator_draft', JSON.stringify(draft));
      } catch (e) {
        console.error('Failed to save nota simulator draft:', e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [
    oplahRim,
    rangkap,
    ukuran,
    jumlahWarna,
    opsiPorporasi,
    opsiNomorator,
    marginPct,
    negoDiskonPct,
  ]);

  const inputConfig: NotaSimulatorInput = useMemo(
    () => ({
      oplahRim,
      rangkap,
      ukuran,
      jumlahWarna,
      opsiPorporasi,
      opsiNomorator,
      marginPct,
      negoDiskonPct,
    }),
    [oplahRim, rangkap, ukuran, jumlahWarna, opsiPorporasi, opsiNomorator, marginPct, negoDiskonPct]
  );

  const result = useMemo(() => {
    return calculateNotaSimulator(inputConfig, customParams);
  }, [inputConfig, customParams]);

  const handleSaveSimulation = () => {
    const title = simulationTitle.trim() || `Nota ${rangkap} Ply (${ukuran.split(' ')[0]}) - ${oplahRim} Rim`;
    const newItem: SavedNotaSimulationItem = {
      id: 'nota_' + Date.now(),
      savedAt: new Date().toISOString(),
      title,
      oplahRim,
      rangkap,
      ukuran,
      jumlahWarna,
      opsiPorporasi,
      opsiNomorator,
      marginPct,
      negoDiskonPct,
      customParams,
      summary: result.summary,
    };

    const updated = [newItem, ...savedSimulations.slice(0, 49)];
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_nota_simulations', JSON.stringify(updated));
      saveCalculationToDb({ ...newItem, category: 'Nota 1 Warna' });
    } catch (e) {
      console.error('Failed to save simulation to storage:', e);
    }

    setSimulationTitle('');
    toast.success(`Kalkulasi "${title}" berhasil disimpan!`);
    setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    setSimulationTitle('');
  };

  const handleUpdateSavedSimulation = () => {
    if (!activeSimulationId) return;
    const title = simulationTitle.trim() || activeSimulationTitle || `Nota ${rangkap} Ply - ${oplahRim} Rim`;
    const updated = savedSimulations.map((item) => {
      if (item.id === activeSimulationId) {
        return {
          ...item,
          title,
          savedAt: new Date().toISOString(),
          oplahRim,
          rangkap,
          ukuran,
          jumlahWarna,
          opsiPorporasi,
          opsiNomorator,
          marginPct,
          negoDiskonPct,
          customParams,
          summary: result.summary,
        };
      }
      return item;
    });

    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_nota_simulations', JSON.stringify(updated));
      const targetItem = updated.find((s) => s.id === activeSimulationId);
      if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Nota 1 Warna' });
    } catch (e) {
      console.error('Failed to update simulation in storage:', e);
    }
    setActiveSimulationTitle(title);
    toast.success(`Perubahan "${title}" berhasil disimpan!`);
    setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    setSimulationTitle('');
  };

  const handleCopyQuote = () => {
    const text = `*PENAWARAN CETAK NOTA / KWITANSI / SURAT JALAN*
*PT Buya Barokah*
━━━━━━━━━━━━━━━━━━━━
• *Spesifikasi*: Nota ${rangkap} Rangkap (${rangkap === 1 ? 'HVS 70 gr' : 'Kertas NCR 55 gr'})
• *Ukuran*: ${ukuran}
• *Warna Cetak*: ${jumlahWarna} Warna (Mesin Toko Ryobi)
• *Kuantitas*: *${oplahRim} Rim Folio* (~${result.jumlahBukuBendel.toLocaleString('id-ID')} Buku/Bendel)
• *Finishing*: Cover Samson, Alas Board, Susun, Staples & Lem Ngetruk${opsiPorporasi ? ', Porporasi' : ''}${opsiNomorator ? ', Nomorator Seri' : ''}
━━━━━━━━━━━━━━━━━━━━
• *Harga / Rim*: *Rp ${result.summary.hargaJualPerRim.toLocaleString('id-ID')}* (~Rp ${result.summary.hargaJualPerBuku.toLocaleString('id-ID')} / buku)
${negoDiskonPct > 0 ? `• *Harga Nego (${negoDiskonPct}%)*: *Rp ${result.summary.hargaNegoPerRim.toLocaleString('id-ID')}* / rim\n• *Total Penawaran*: *Rp ${result.summary.totalHargaNego.toLocaleString('id-ID')}*` : `• *Total Penawaran*: *Rp ${result.summary.totalHargaJual.toLocaleString('id-ID')}*`}
━━━━━━━━━━━━━━━━━━━━
_Kualitas cetak tajam & tembusan NCR pekat. Desain dibantu layouting standar._`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Penawaran harga Nota berhasil disalin ke WhatsApp clipboard!');
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-emerald-950 flex items-center gap-2">
              Simulator & Kalkulator Nota 1 Warna (NCR / HVS)
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Katalog 03
              </span>
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Kalkulasi HPP cetak nota per rim folio berbasis mesin Ryobi, HVS 70 / NCR 55, porporasi, dan nomorator.
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
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Input Spesifikasi Nota</h3>
            </div>

            {/* Oplah Rim */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kuantitas Oplah (Rim Folio)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={oplahRim}
                  onChange={(e) => setOplahRim(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-xs font-semibold text-slate-500 shrink-0">Rim</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                1 Rim = 500 lembar plano Folio (~{result.jumlahBukuBendel.toLocaleString('id-ID')} buku)
              </p>
            </div>

            {/* Rangkap / Ply */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pilihan Rangkap (Ply) & Kertas
              </label>
              <div className="grid grid-cols-2 gap-2">
                {RANGKAP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRangkap(opt.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      rangkap === opt.value
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-500/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ukuran Potongan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ukuran Potongan Buku Nota
              </label>
              <div className="space-y-1.5">
                {UKURAN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUkuran(opt.value)}
                    className={`w-full p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                      ukuran === opt.value
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-500/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{opt.label}</div>
                      <div className="text-[10px] text-slate-500">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Jumlah Warna */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Warna Tinta Cetak
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setJumlahWarna(1)}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                    jumlahWarna === 1
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  1 Warna (Hitam / Biru)
                </button>
                <button
                  type="button"
                  onClick={() => setJumlahWarna(2)}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                    jumlahWarna === 2
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  2 Warna
                </button>
              </div>
            </div>

            {/* Opsi Tambahan Finishing */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Finishing Tambahan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={opsiPorporasi}
                    onChange={(e) => setOpsiPorporasi(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block text-[11px]">Porporasi</span>
                    <span className="text-[10px] text-slate-400">Garis putus</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={opsiNomorator}
                    onChange={(e) => setOpsiNomorator(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block text-[11px]">Nomorator</span>
                    <span className="text-[10px] text-slate-400">Nomor seri</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Target Margin & Nego */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Margin Profit (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={marginPct}
                    onChange={(e) => setMarginPct(Number(e.target.value) || 0)}
                    className="w-full pl-3 pr-7 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Batas Nego (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
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
                <span className="text-[11px] font-semibold">HPP / Rim</span>
                <DollarSign size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                  Rp {result.summary.hppPerRim.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  ~Rp {result.summary.hppPerBuku.toLocaleString('id-ID')} / buku
                </span>
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
                  Rp {result.summary.hargaJualPerRim.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-emerald-700/80 mt-0.5">
                  ~Rp {result.summary.hargaJualPerBuku.toLocaleString('id-ID')} / buku
                </span>
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
                  Rp {result.summary.hargaNegoPerRim.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-blue-700/80 mt-0.5">
                  ~Rp {result.summary.hargaNegoPerBuku.toLocaleString('id-ID')} / buku
                </span>
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
              <span className="text-slate-400">Total Buku: </span>
              <span className="font-semibold text-slate-800">{result.jumlahBukuBendel.toLocaleString('id-ID')} Buku ({rangkap === 1 ? '100 set' : '50 set'})</span>
            </div>
            <div>
              <span className="text-slate-400">Total Lembar Folio: </span>
              <span className="font-semibold text-slate-800">{result.totalLembarFolio.toLocaleString('id-ID')} Lbr</span>
            </div>
            <div>
              <span className="text-slate-400">Plat CTP Ryobi: </span>
              <span className="font-semibold text-slate-800">{result.jumlahPlat} Plat</span>
            </div>
          </div>

          {/* Rincian Komponen Biaya Produksi */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Rincian Estimasi Komponen Biaya Nota
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Oplah: {oplahRim} Rim ({rangkap} Ply)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2 px-3 w-10 text-center">No</th>
                    <th className="py-2 px-3">Komponen Biaya</th>
                    <th className="py-2 px-3">Keterangan Teknis</th>
                    <th className="py-2 px-3 text-right">Biaya (Rp)</th>
                    <th className="py-2 px-3 text-right w-16">Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {result.breakdown.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-800 font-sans">{item.nama}</td>
                      <td className="py-2 px-3 text-slate-500 text-[10.5px] font-sans">{item.keterangan}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">
                        Rp {item.nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {item.pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/90 font-bold border-t border-slate-200 text-xs">
                    <td colSpan={3} className="py-2.5 px-3 text-slate-800 font-sans">
                      Total HPP Biaya Produksi ({oplahRim} Rim)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">
                      Rp {result.summary.totalHpp.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Tombol Aksi Simpan Simulasi (Full Width) */}
          <div className="pt-1">
            {activeSimulationId ? (
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={handleUpdateSavedSimulation}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Perbarui kalkulasi yang sedang diedit"
                >
                  <BookmarkCheck size={15} />
                  <span>Update Perubahan</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveSimulation}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Simpan sebagai kalkulasi baru & keluar dari mode edit"
                >
                  <Bookmark size={14} />
                  <span>Simpan Baru</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSaveSimulation}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bookmark size={16} />
                <span>Simpan Kalkulasi Ini ke Daftar Kalkulasi</span>
              </button>
            )}
          </div>
        </div>
      </div>

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
                  <h3 className="text-base font-bold tracking-tight">Panduan Simulator Nota 1 Warna (Ryobi)</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Alur perhitungan berbasis rim folio, kertas HVS 70 / NCR 55, jilid bendel, porporasi, dan nomorator
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
                  Langkah Menggunakan Simulator Nota
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">1. Kuantitas Rim</span>
                    <p className="text-[11px] text-slate-600">
                      Tentukan jumlah <strong>Oplah Rim Folio</strong> (misal 1, 2, 5, 10 rim).
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">2. Tipe Rangkap</span>
                    <p className="text-[11px] text-slate-600">
                      Pilih <strong>1 Rangkap (HVS 70)</strong> atau <strong>2 / 3 / 4 Rangkap (NCR 55 Carbonless)</strong>.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">3. Ukuran & Finishing</span>
                    <p className="text-[11px] text-slate-600">
                      Pilih ukuran (Folio, 1/2, 1/3, 1/4, 1/6, 1/8) serta opsi <strong>Porporasi</strong> & <strong>Nomorator Seri</strong>.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-xs">4. Salin Penawaran</span>
                    <p className="text-[11px] text-slate-600">
                      Klik <strong>Salin Penawaran</strong> untuk teks penawaran WA otomatis atau simpan ke daftar kalkulasi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rincian Komponen Biaya Produksi Nota */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  Struktur Biaya Produksi Nota 1 Warna
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-white rounded border border-emerald-100 space-y-1">
                    <span className="font-bold text-emerald-900 block">Kertas & Plat Cetak Ryobi:</span>
                    <p className="text-slate-600 leading-snug">
                      Kertas HVS 70 / NCR 55 (Top/Middle/Bottom) per rim folio. Tiap rangkap membutuhkan 1 plat CTP Ryobi (@ Rp 10.000) dengan minimum ongkos cetak Rp 15.000 / 500 drek.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-blue-100 space-y-1">
                    <span className="font-bold text-blue-900 block">Finishing & Jilid Bendel:</span>
                    <p className="text-slate-600 leading-snug">
                      Termasuk cover samson cokelat, kertas board alas, susun komplit, staples kawat, blok lem ngetruk, potong sisir sisi, serta opsi porporasi dan nomorator.
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
