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
              {/* Bagian 1: Pemetaan 3 Varian Master File Excel */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Pemetaan Sumber Master Excel (3 File Referensi 2026)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                    <span className="font-bold text-emerald-950 text-xs block">1. Custom Cover 10 x 15,5 cm</span>
                    <p className="text-[10.5px] text-emerald-800 leading-snug">
                      Ref: <code>...UK. 10 x 15,5 - BUKU MANASIK - Custom Cover 2026.xlsm</code><br />
                      Sheet: <span className="font-mono font-semibold">HARGA FILE BARU</span> & <span className="font-mono font-semibold">BUKU</span>.<br />
                      Cover AC 230 POD (Rp 2.700) / Oliver + Sisipan 4 hal PT (Rp 350 + Rp 225,49) + Blok 212 hal (Rp 3.620) + Tali Kur (Rp 285,71) + Staples 1213 (Rp 24.000).
                    </p>
                  </div>
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-1.5">
                    <span className="font-bold text-blue-950 text-xs block">2. Kosongan 10 x 15,5 cm</span>
                    <p className="text-[10.5px] text-blue-800 leading-snug">
                      Ref: <code>...UK. 10 x 15,5 - BUKU MANASIK - Kosongan.xlsm</code><br />
                      Sheet: <span className="font-mono font-semibold">HARGA 2026</span> & <span className="font-mono font-semibold">BUKU</span>.<br />
                      HVS 70 gsm (Rp 15.700/kg) cetak Oliver 1 warna 53 plat CTP + lipat kuras + susun urut + jilid lem panas (bending) + kardus master (200 pcs/box).
                    </p>
                  </div>
                  <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 space-y-1.5">
                    <span className="font-bold text-purple-950 text-xs block">3. Mini TikTok 6,3 x 10,3 cm</span>
                    <p className="text-[10.5px] text-purple-800 leading-snug">
                      Ref: <code>...UK. 6,3 x 10,3 - BUKU MANASIK MINI TIKTOK.xlsm</code><br />
                      Sheet: <span className="font-mono font-semibold">Master</span> & <span className="font-mono font-semibold">BUKU</span>.<br />
                      Art Carton 310 gsm (Rp 33.500/kg) bolak-balik + pisau & jasa pond (Rp 524,79) + Ring Binder 3cm (Rp 925) + Tali cocard (Rp 2.500) + Ziplock (Rp 465).
                    </p>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Rincian 4 Kelompok Parameter */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                  Rincian Rumus & Komponen Parameter Master
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Poin 1 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Blok Isi Kosongan & Kertas HVS</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Isi 212 Hal Ready 2026</strong>: <span className="font-mono text-emerald-700">Master!D21</span> = Rp 3.620 / eks (insheet 2 eks).</li>
                      <li>• <strong>Isi Klasik</strong>: 192 Hal (Rp 3.421), 128 Hal (Rp 2.300), 96 Hal (Rp 1.800).</li>
                      <li>• <strong>Kertas HVS 70 gsm</strong>: <span className="font-mono text-emerald-700">Kosongan!Master!D22</span> = Rp 15.700 / kg.</li>
                      <li>• <strong>Print Sisipan PT A3+</strong>: <span className="font-mono text-emerald-700">BUKU!AM6</span> = Rp 350 / lbr A3+ (4 hal per lembar).</li>
                    </ul>
                  </div>

                  {/* Kelompok 2 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Bahan Cover & Print POD / Offset</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Tarif Print Cover AC 230 (POD)</strong>: <span className="font-mono text-blue-700">Custom!Master!D18</span> = Rp 2.700 / lbr A3+.</li>
                      <li>• <strong>Tarif Print Mini TikTok (POD)</strong>: <span className="font-mono text-blue-700">TikTok!Master!D18</span> = Rp 2.500 / lbr A3+.</li>
                      <li>• <strong>Kertas AC 230 / 260</strong>: Rp 16.400 / kg | <strong>AC 310</strong>: Rp 33.500 / kg.</li>
                      <li>• <strong>Desain Cover</strong>: Custom Cover Rp 20.000 | Mini TikTok Rp 2.500.</li>
                      <li>• <strong>Offset Oliver</strong>: Plat Rp 45.000, Min Rp 90.000, Drek over Rp 40.</li>
                    </ul>
                  </div>

                  {/* Kelompok 3 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Ongkos Jilid & Finishing Custom</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Tali Kur Warna Leher</strong>: <span className="font-mono text-amber-700">BUKU!BQ6</span> (Rp 16.000/roll isi 56 pcs = Rp 285,71) + jasa pasang Rp 112,74.</li>
                      <li>• <strong>Isi Staples 1213</strong>: Rp 24.000/pack + tenaga Rp 112,74 + casing in Rp 225,49.</li>
                      <li>• <strong>Lubang Bor Mata Ayam</strong>: <span className="font-mono text-amber-700">BUKU!BM6</span> (Rp 225,49 / buku).</li>
                      <li>• <strong>Potong Sisir 3 Sisi</strong>: <span className="font-mono text-amber-700">BUKU!BK6</span> (Rp 150 / buku).</li>
                      <li>• <strong>Jasa Sisip & Lipat Nama PT</strong>: Rp 225,49 / buku.</li>
                    </ul>
                  </div>

                  {/* Kelompok 4 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>4. Aksesoris Khusus Mini TikTok & Kemasan</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Ring Binder 3 cm</strong>: <span className="font-mono text-purple-700">TikTok!Master!D24</span> = Rp 925 / pcs.</li>
                      <li>• <strong>Tali Cocard Mini</strong>: <span className="font-mono text-purple-700">TikTok!Master!D23</span> = Rp 2.500 / pcs.</li>
                      <li>• <strong>Plastik Ziplock</strong>: <span className="font-mono text-purple-700">TikTok!Master!D25</span> = Rp 465 / pcs.</li>
                      <li>• <strong>Pisau + Jasa Pond Mini</strong>: Rp 299,30 + Rp 225,49.</li>
                      <li>• <strong>Plastik OPP Satuan</strong>: Rp 92 / pcs + jasa Rp 225,49 | <strong>Kardus</strong>: Rp 8.500/box.</li>
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
