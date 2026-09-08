'use client';

import React, { useState } from 'react';
import {
  Database,
  BookOpen,
  RotateCcw,
  Sparkles,
  X,
  Sliders,
  Layers,
  Printer,
  FileText,
  Box,
} from 'lucide-react';
import {
  DEFAULT_MANASIK_PARAMS,
  ManasikMasterParams,
} from '@/lib/manasik-calculator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface ManasikMasterParameterProps {
  customParams: ManasikMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<ManasikMasterParams>>;
}

const MANASIK_VISIBLE_KEYS: (keyof ManasikMasterParams)[] = [
  'hargaIsiKosongan96',
  'hargaIsiKosongan128',
  'hargaIsiKosongan192',
  'hargaIsiKosongan208',
  'tarifPrintCoverA3',
  'tarifPrintMiniTikTokA3',
  'tarifDesainCover',
  'tarifDesainMiniTikTok',
  'insheetCover',
  'tarifKertasHvs70Kg',
  'tarifPrintSisipanA3',
  'tarifBendingPerCm2',
  'tarifTaliKurPerPcs',
  'tarifSpiralManasik',
  'tarifLubangBor',
  'tarifPasangTali',
  'tarifTaliCocardMini',
  'tarifRingBinderMini',
  'tarifPlastikZiplockMini',
  'tarifPisauPoundMini',
];

export default function ManasikMasterParameter({
  customParams,
  setCustomParams,
}: ManasikMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);
  const handleChange = (key: keyof ManasikMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const isFieldModified = (key: keyof ManasikMasterParams) => {
    return customParams[key] !== DEFAULT_MANASIK_PARAMS[key];
  };

  const handleResetField = (key: keyof ManasikMasterParams) => {
    setCustomParams((prev) => ({ ...prev, [key]: DEFAULT_MANASIK_PARAMS[key] }));
    toast.info(`Field dikembalikan ke standar master (${DEFAULT_MANASIK_PARAMS[key]}).`);
  };

  const isModified = React.useMemo(() => {
    return MANASIK_VISIBLE_KEYS.some((key) => customParams[key] !== DEFAULT_MANASIK_PARAMS[key]);
  }, [customParams]);

  const handleResetAll = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      MANASIK_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = DEFAULT_MANASIK_PARAMS[k];
      });
      return resetObj;
    });
    toast.success('Semua parameter Buku Manasik dikembalikan ke standar master.');
  };

  const fieldRow = (
    key: keyof ManasikMasterParams,
    label: string,
    isRupiah = true,
    isDecimal = false
  ) => (
    <div
      className={`p-2.5 rounded-lg border transition-all ${
        isFieldModified(key)
          ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <label className="text-xs font-semibold text-slate-700 truncate" title={label}>
          {label}
        </label>
        {isFieldModified(key) && (
          <button
            type="button"
            onClick={() => handleResetField(key)}
            className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
            title="Reset ke default"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Def
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {isRupiah ? (
          <ThousandInput
            value={customParams[key] as number}
            onValueChange={(v) => handleChange(key, v || 0)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
            prefix="Rp"
            allowDecimals={isDecimal}
          />
        ) : (
          <input
            type="number"
            value={customParams[key] as number}
            onChange={(e) => handleChange(key, Number(e.target.value) || 0)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      {/* Header Info */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
                Master Parameter Buku Manasik Haji / Umroh
              </h2>
              {isModified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Dimodifikasi
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tarif acuan harga blok kosongan (96–208 hal), bahan cover AC, ongkos jilid bending & tali cocard.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all cursor-pointer shadow-2xs"
          >
            <BookOpen size={13} />
            <span>Manual Pengguna</span>
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            disabled={!isModified}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 ${
              isModified
                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer ring-2 ring-amber-400/40'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70'
            }`}
          >
            <RotateCcw size={13} />
            <span>Reset Standar Master</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Blok Isi Kosongan (Ready 2026) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Box className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800">1. Blok Isi Kosongan (Ready Stock)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('hargaIsiKosongan208', 'Isi 212 Hal Ready (Rp/eks)')}
            {fieldRow('hargaIsiKosongan192', 'Isi 192 Halaman (Rp/eks)')}
            {fieldRow('hargaIsiKosongan128', 'Isi 128 Halaman (Rp/eks)')}
            {fieldRow('hargaIsiKosongan96', 'Isi 96 Halaman (Rp/eks)')}
            {fieldRow('tarifKertasHvs70Kg', 'Kertas HVS 70 gsm (Rp/kg)')}
            {fieldRow('tarifPrintSisipanA3', 'Print Sisipan PT A3+ (Rp/lbr)')}
          </div>
        </div>

        {/* Card 2: Print Cover & Jasa Desain */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Print Cover POD & Desain</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifPrintCoverA3', 'Print Cover AC230 A3+ (Rp)')}
            {fieldRow('tarifPrintMiniTikTokA3', 'Print TikTok AC310 A3+ (Rp)')}
            {fieldRow('tarifDesainCover', 'Desain Custom Cover (Rp)')}
            {fieldRow('tarifDesainMiniTikTok', 'Desain Mini TikTok (Rp)')}
            {fieldRow('insheetCover', 'Insheet POD (lembar)', false)}
          </div>
        </div>

        {/* Card 3: Jilid, Tali & Finishing Custom Cover */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Jilid, Tali & Finishing Manasik</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifTaliKurPerPcs', 'Tali Kur Warna Leher (Rp/pcs)')}
            {fieldRow('tarifBendingPerCm2', 'Tarif Bending (Rp/cm²)')}
            {fieldRow('tarifSpiralManasik', 'Spiral Kawat (Rp/eks)')}
            {fieldRow('tarifLubangBor', 'Jasa Lubang Bor Mata Ayam (Rp)')}
            {fieldRow('tarifPasangTali', 'Jasa Pasang Tali Kur (Rp)')}
          </div>
        </div>

        {/* Card 4: Komponen Khusus Mini TikTok */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Komponen Khusus Mini TikTok</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifRingBinderMini', 'Ring Binder 3cm (Rp/pcs)')}
            {fieldRow('tarifTaliCocardMini', 'Tali Cocard Mini (Rp/pcs)')}
            {fieldRow('tarifPlastikZiplockMini', 'Plastik Ziplock (Rp/pcs)')}
            {fieldRow('tarifPisauPoundMini', 'Pisau Pond TikTok (Rp/pcs)')}
          </div>
        </div>
      </div>

      {/* Modal Manual Pengguna Master Parameter */}
      {showManualModal && (
        <div
          onClick={() => setShowManualModal(false)}
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
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Manual Pengguna & Pemetaan Sumber Excel</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Dokumentasi referensi letak sheet, cell, dan formula dari master kalkulasi Buku Manasik
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              {/* Bagian 1: Pemetaan 4 Kelompok Master Parameter */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Pemetaan 4 Bagian Master Parameter ke File Excel (Folder 01. Pricelist Buku Manasik/*.xlsm)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Poin 1 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Blok Isi Kosongan (Ready)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga Netto HPP Blok Isi</strong>: <span className="font-mono text-emerald-700">Master!D21</span> & <span className="font-mono text-emerald-700">BUKU!AJ6</span>.</li>
                      <li>• <strong>Tarif Standar</strong>: 192 Hal: Rp 3.421, 208 Hal: Rp 3.650, 96 Hal: Rp 1.800, 128 Hal: Rp 2.300.</li>
                      <li>• <strong>Insheet Blok Isi</strong>: <span className="font-mono text-slate-600">Master!D22</span> = 2 eksemplar.</li>
                    </ul>
                  </div>

                  {/* Kelompok 2 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Bahan Cover & Print Inter A3+ / Offset</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga Kertas AC 230</strong>: <span className="font-mono text-blue-700">Master!D12</span> (Rp 15.100 / kg).</li>
                      <li>• <strong>Tarif Print Cover A3+ (POD)</strong>: <span className="font-mono text-blue-700">Master!D18</span> (Rp 2.500 / lbr).</li>
                      <li>• <strong>Desain Cover</strong>: <span className="font-mono text-blue-700">Master!D17</span> (Rp 20.000).</li>
                      <li>• <strong>Insheet Cover Cetak</strong>: <span className="font-mono text-blue-700">Master!D13</span> (5 lembar).</li>
                      <li>• <strong>Offset Oliver Cover</strong>: Plat CTP <span className="font-mono text-blue-700">BUKU!Y4</span> (Rp 45.000), Min Order <span className="font-mono text-blue-700">BUKU!AB4</span> (Rp 90.000).</li>
                    </ul>
                  </div>

                  {/* Kelompok 3 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Ongkos Jilid & Finishing</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Tali Kur Warna /Roll</strong>: <span className="font-mono text-amber-700">Master!D28</span> (Rp 16.000 / roll = Rp 285,71 / pcs).</li>
                      <li>• <strong>Steples 1213 /Pack</strong>: <span className="font-mono text-amber-700">Master!D27</span> (Rp 24.000 = Rp 112,74 / pcs).</li>
                      <li>• <strong>Casing-In Pasang Cover</strong>: <span className="font-mono text-amber-700">BUKU!AP6</span> (Rp 225,49 / buku).</li>
                      <li>• <strong>Lubang Bor Mata Ayam</strong>: <span className="font-mono text-amber-700">BUKU!AQ6</span> (Rp 225,49 / buku).</li>
                      <li>• <strong>Potong Sisir Sisi</strong>: <span className="font-mono text-amber-700">BUKU!AR6</span> (Rp 150 / buku).</li>
                      <li>• <strong>Laminasi Doff/Glossy</strong>: <span className="font-mono text-amber-700">Master!D24</span> & <span className="font-mono text-amber-700">BUKU!AO6</span>.</li>
                    </ul>
                  </div>

                  {/* Kelompok 4 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Kemasan OPP, Lakban & Kardus</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Plastik OPP /Pack 100</strong>: <span className="font-mono text-violet-700">Master!D26</span> (Rp 9.200 = Rp 92 / pcs).</li>
                      <li>• <strong>Jasa Kemas OPP</strong>: <span className="font-mono text-violet-700">BUKU!BE4</span> (Rp 225,49 / pcs).</li>
                      <li>• <strong>Kardus Master Box</strong>: <span className="font-mono text-violet-700">Master!D30</span> (Rp 8.500 / box isi 200 buku).</li>
                      <li>• <strong>Lakban Box</strong>: <span className="font-mono text-violet-700">Master!D29</span> (Rp 8.000 / roll).</li>
                      <li>• <strong>Target Margin Standar</strong>: <span className="font-mono text-violet-700">Master!E32</span> (30%).</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
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
