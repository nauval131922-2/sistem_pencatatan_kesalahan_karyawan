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
  calculateBrosurSimulator,
  DEFAULT_BROSUR_PARAMS,
  BrosurMasterParams,
  BrosurUkuranType,
  BrosurGramaturType,
  BrosurMukaType,
  BrosurMesinType,
  BrosurLaminasiType,
  SavedBrosurSimulationItem,
} from '@/lib/brosur-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

export type { SavedBrosurSimulationItem };

const UKURAN_OPTIONS: BrosurUkuranType[] = [
  '10,5 x 21',
  '14,5 x 21',
  '21 x 29,7',
  '21,5 x 33',
  '29,7 x 42',
];

const LAMINASI_OPTIONS: BrosurLaminasiType[] = [
  'Tanpa Laminasi',
  'Glossy',
  'Doff',
  'UV Varnish',
];

const OPLAH_TIERS = [100, 150, 200, 300, 400, 500, 1000, 1500, 2000, 2500, 3000];

interface BrosurSimulatorProps {
  customParams?: BrosurMasterParams;
  setCustomParams?: React.Dispatch<React.SetStateAction<BrosurMasterParams>>;
  onOpenMasterParam?: () => void;
  activeSimulationId?: string | null;
  setActiveSimulationId?: (id: string | null) => void;
  activeSimulationTitle?: string | null;
  setActiveSimulationTitle?: (title: string | null) => void;
}

export default function BrosurSimulator({
  customParams = DEFAULT_BROSUR_PARAMS,
  setCustomParams,
  onOpenMasterParam,
  activeSimulationId: propActiveSimId,
  setActiveSimulationId: propSetActiveSimId,
  activeSimulationTitle: propActiveSimTitle,
  setActiveSimulationTitle: propSetActiveSimTitle,
}: BrosurSimulatorProps) {
  const [oplah, setOplah] = useState<number>(500);
  const [gramatur, setGramatur] = useState<BrosurGramaturType>('Art Paper 120 gsm');
  const [ukuran, setUkuran] = useState<BrosurUkuranType>('21 x 29,7');
  const [muka, setMuka] = useState<BrosurMukaType>('2 Muka');
  const [mesin, setMesin] = useState<BrosurMesinType>('Print Inter');
  const [laminasi, setLaminasi] = useState<BrosurLaminasiType>('Glossy');
  const [opsiSisir, setOpsiSisir] = useState(false);
  const [opsiPacking, setOpsiPacking] = useState(true);
  const [marginPct, setMarginPct] = useState(30);
  const [negoDiskonPct, setNegoDiskonPct] = useState(4);
  const [copiedQuote, setCopiedQuote] = useState(false);

  const [savedSimulations, setSavedSimulations] = useState<SavedBrosurSimulationItem[]>([]);
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
      const raw = localStorage.getItem('sintak_saved_brosur_simulations');
      if (raw) {
        const list: SavedBrosurSimulationItem[] = JSON.parse(raw);
        setSavedSimulations(list);

        if (activeSimulationId) {
          const item = list.find((s) => s.id === activeSimulationId);
          if (item) {
            const input = item.data.input;
            setOplah(input.oplah);
            if (input.gramatur) setGramatur(input.gramatur);
            setUkuran(input.ukuran);
            setMuka(input.muka);
            setMesin(input.mesin);
            setLaminasi(input.laminasi);
            setMarginPct(input.marginPct);
            setNegoDiskonPct(input.negoDiskonPct);
            setSimulationTitle(item.title);
            return;
          }
        }
      }

      // Restore draft settingan pengguna dari localStorage saat pindah tab
      const rawDraft = localStorage.getItem('sintak_brosur_simulator_draft');
      if (rawDraft) {
        const d = JSON.parse(rawDraft);
        if (d.oplah !== undefined) setOplah(Number(d.oplah) || 100);
        if (d.gramatur !== undefined) setGramatur(d.gramatur);
        if (d.ukuran !== undefined) setUkuran(d.ukuran);
        if (d.muka !== undefined) setMuka(d.muka);
        if (d.mesin !== undefined) setMesin(d.mesin);
        if (d.laminasi !== undefined) setLaminasi(d.laminasi);
        if (d.marginPct !== undefined) setMarginPct(Number(d.marginPct) || 30);
        if (d.negoDiskonPct !== undefined) setNegoDiskonPct(Number(d.negoDiskonPct) || 0);
      }
    } catch (e) {
      console.error('Failed to load saved brosur simulations or draft:', e);
    }
  }, [activeSimulationId]);

  // Simpan draft settingan simulator secara otomatis saat ada perubahan input (auto-persist)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const draft = {
          oplah,
          gramatur,
          ukuran,
          muka,
          mesin,
          laminasi,
          marginPct,
          negoDiskonPct,
        };
        localStorage.setItem('sintak_brosur_simulator_draft', JSON.stringify(draft));
      } catch (e) {
        console.error('Failed to save brosur simulator draft:', e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [
    oplah,
    gramatur,
    ukuran,
    muka,
    mesin,
    laminasi,
    marginPct,
    negoDiskonPct,
  ]);

  const result = useMemo(
    () =>
      calculateBrosurSimulator(
        { oplah, gramatur, ukuran, muka, mesin, laminasi, opsiSisir, opsiPacking, marginPct, negoDiskonPct },
        customParams
      ),
    [oplah, gramatur, ukuran, muka, mesin, laminasi, opsiSisir, opsiPacking, marginPct, negoDiskonPct, customParams]
  );

  const defaultTitle = () =>
    `Brosur ${muka} ${ukuran} - ${gramatur} (${oplah} pcs - ${mesin})`;

  const handleSaveSimulation = () => {
    const title = simulationTitle.trim() || defaultTitle();
    const newItem: SavedBrosurSimulationItem = {
      id: 'brosur_' + Date.now(),
      title,
      savedAt: new Date().toISOString(),
      data: result,
      paramsSnapshot: customParams,
    };
    const updated = [newItem, ...savedSimulations.slice(0, 49)];
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_brosur_simulations', JSON.stringify(updated));
    saveCalculationToDb({ ...newItem, category: 'Brosur 2026' });
    } catch (e) {
      console.error('Failed to save brosur simulation:', e);
    }
    setSimulationTitle('');
    toast.success(`Kalkulasi "${title}" berhasil disimpan!`);
    setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    setSimulationTitle('');
  };

  const handleUpdateSavedSimulation = () => {
    if (!activeSimulationId) return;
    const title = simulationTitle.trim() || activeSimulationTitle || defaultTitle();
    const updated = savedSimulations.map((item) =>
      item.id === activeSimulationId
        ? { ...item, title, savedAt: new Date().toISOString(), data: result,
        paramsSnapshot: customParams }
        : item
    );
    setSavedSimulations(updated);
    try {
      localStorage.setItem('sintak_saved_brosur_simulations', JSON.stringify(updated));
    const targetItem = updated.find((x) => x.id === activeSimulationId);
      if (targetItem) saveCalculationToDb({ ...targetItem, category: 'Brosur 2026' });
    } catch (e) {
      console.error('Failed to update brosur simulation:', e);
    }
    setActiveSimulationTitle(title);
    toast.success(`Perubahan "${title}" berhasil disimpan!`);
    setActiveSimulationId(null);
    if (setActiveSimulationTitle) setActiveSimulationTitle(null);
    setSimulationTitle('');
  };

  const handleCopyQuote = () => {
    const fmt = (n: number) => n.toLocaleString('id-ID');
    const text =
      `*PENAWARAN BROSUR 2026*\n` +
      `*PT Buya Barokah*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Produk*: Brosur ${muka}\n` +
      `• *Ukuran*: ${ukuran} cm\n` +
      `• *Bahan*: ${gramatur}\n` +
      `• *Laminasi*: ${laminasi}\n` +
      `• *Kuantitas*: ${oplah} pcs\n` +
      `• *Mesin Cetak*: ${mesin}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Harga / Pcs*: *Rp ${fmt(result.hargaJualPerPcs)}*\n` +
      `• *Total Penawaran*: *Rp ${fmt(result.totalHargaJual)}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Harga belum termasuk PPN._`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success('Penawaran harga Brosur berhasil disalin ke WhatsApp clipboard!');
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-emerald-950 flex items-center gap-2">
              Simulator &amp; Kalkulator Brosur 2026
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Katalog 05
              </span>
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Hitung HPP, harga penawaran, dan estimasi profit cetak brosur Art Paper 120gsm 1/2 Muka.
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

      {/* Banner riwayat aktif */}
      {activeSimulationId && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-200 text-amber-900 rounded-lg">
              <Bookmark className="w-4 h-4 fill-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                  Mode Riwayat Aktif
                </span>
                <h4 className="text-xs font-bold text-amber-950">{activeSimulationTitle}</h4>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Anda sedang melihat atau mengedit data dari riwayat simulasi yang dimuat.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleUpdateSavedSimulation}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <BookmarkCheck size={14} />
              <span>Simpan Perubahan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSimulationId(null);
                setActiveSimulationTitle(null);
                setSimulationTitle('');
              }}
              className="px-3 py-1.5 bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <X size={14} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders size={15} className="text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Input Spesifikasi Brosur</h3>
            </div>

            {/* Oplah */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Kuantitas Oplah (pcs)</label>
                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {oplah.toLocaleString('id-ID')} pcs
                </span>
              </div>
              <ThousandInput
                value={oplah}
                allowDecimals={false}
                onValueChange={(val) => setOplah(Math.max(1, val))}
                placeholder="Jumlah pesanan brosur (pcs)"
                className="w-full px-3 py-2 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Gramatur / Bahan Kertas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Bahan Kertas / Gramatur
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Art Paper 120 gsm', 'Art Paper 150 gsm'] as BrosurGramaturType[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGramatur(g)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                      gramatur === g
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Ukuran */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ukuran Brosur (cm)
              </label>
              <div className="flex flex-col gap-1.5">
                {UKURAN_OPTIONS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUkuran(u)}
                    className={`w-full p-2 rounded-lg border text-left transition-all cursor-pointer text-xs font-bold ${
                      ukuran === u
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-500/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {u} cm
                  </button>
                ))}
              </div>
            </div>

            {/* Jenis Cetak */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Cetak
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['1 Muka', '2 Muka'] as BrosurMukaType[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMuka(m)}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                      muka === m
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Mesin */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mesin Cetak
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Print Inter', 'Oliver'] as BrosurMesinType[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMesin(m)}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                      mesin === m
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Laminasi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Laminasi
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LAMINASI_OPTIONS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLaminasi(l)}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                      laminasi === l
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-500/30'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Finishing */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Finishing
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={opsiSisir}
                    onChange={(e) => setOpsiSisir(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block text-[11px]">Sisir / Potong</span>
                    <span className="text-[10px] text-slate-400">Rapi per pcs</span>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={opsiPacking}
                    onChange={(e) => setOpsiPacking(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block text-[11px]">Packing Kardus</span>
                    <span className="text-[10px] text-slate-400">Kardus + lakban</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Margin & Nego */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Margin Profit (%)</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Batas Nego (%)</label>
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

        {/* Kolom Kanan: Hasil */}
        <div className="lg:col-span-7 space-y-5">
          {/* 4 Kartu Finansial */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">HPP / pcs</span>
                <DollarSign size={13} className="text-slate-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                  Rp {Math.round(result.hppPerPcs).toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  Total HPP: Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[11px] font-bold">Harga Jual (+{marginPct}%)</span>
                <TrendingUp size={13} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                  Rp {result.hargaJualPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-emerald-700/80 mt-0.5">/ pcs</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-800 mb-1">
                <span className="text-[11px] font-bold">Harga Nego (-{negoDiskonPct}%)</span>
                <Percent size={13} className="text-blue-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-blue-800 font-mono">
                  Rp {result.hargaNegoPerPcs.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-blue-700/80 mt-0.5">/ pcs</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">Total Harga Jual</span>
                <TrendingUp size={13} className="text-emerald-500" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                  Rp {result.totalHargaJual.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Profit: Rp {Math.round(result.profitTotal).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Rincian Estimasi Komponen Biaya Brosur
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {oplah.toLocaleString('id-ID')} pcs · {mesin}
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
                        {(item.pct * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/90 font-bold border-t border-slate-200 text-xs">
                    <td colSpan={3} className="py-2.5 px-3 text-slate-800 font-sans">
                      Total HPP Biaya Produksi ({oplah.toLocaleString('id-ID')} pcs)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">
                      Rp {Math.round(result.totalHpp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Simpan */}
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

      {/* Modal Panduan */}
      {showSimulatorManual && (
        <div
          onClick={() => setShowSimulatorManual(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Panduan Simulator Brosur 2026</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Alur perhitungan berbasis oplah pcs, Art Paper 120gsm, Print Inter &amp; Oliver, laminasi, dan finishing
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

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Langkah Menggunakan Simulator Brosur
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    ['1. Oplah & Ukuran', 'Tentukan jumlah pcs (100–3000) dan pilih ukuran brosur dari 5 pilihan yang tersedia.'],
                    ['2. Mesin & Muka', 'Pilih Print Inter (digital inkjet A3+) atau Oliver (offset). Pilih 1 Muka atau 2 Muka.'],
                    ['3. Laminasi & Finishing', 'Pilih jenis laminasi (Glossy, Doff, UV Varnish, atau tanpa). Aktifkan Sisir/Potong dan Packing Kardus bila perlu.'],
                    ['4. Salin Penawaran', 'Klik Salin Penawaran untuk teks WA otomatis, atau simpan ke daftar kalkulasi.'],
                  ].map(([title, desc]) => (
                    <div key={title} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="font-bold text-emerald-800 text-xs">{title}</span>
                      <p className="text-[11px] text-slate-600">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  Struktur Biaya Produksi Brosur 2026
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-white rounded border border-emerald-100 space-y-1">
                    <span className="font-bold text-emerald-900 block">Kertas &amp; Mesin Cetak:</span>
                    <p className="text-slate-600 leading-snug">
                      Art Paper 120gsm dengan harga/kg + up%. Print Inter: tarif per lembar A3+ (1 atau 2 muka). Oliver: biaya plat CTP + ongkos cetak minimum Rp 90.000/plat atau per drek × warna.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-blue-100 space-y-1">
                    <span className="font-bold text-blue-900 block">Laminasi, Finishing &amp; Packing:</span>
                    <p className="text-slate-600 leading-snug">
                      Laminasi dihitung per cm² × luas brosur × oplah (×2 jika 2 Muka). Sisir/Potong min Rp 10.000 atau Rp 10.000/1000 pcs. Packing: kardus + lakban per order.
                    </p>
                  </div>
                </div>
              </div>
            </div>

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
