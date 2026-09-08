'use client';

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Search,
  X,
  LayoutGrid,
  TableProperties,
  Layers,
} from 'lucide-react';
import {
  calculateManasikSimulator,
  DEFAULT_MANASIK_PARAMS,
  ManasikMasterParams,
} from '@/lib/manasik-calculator';

interface ManasikMatrixViewProps {
  customParams?: ManasikMasterParams;
  viewMode?: 'matrix' | 'table';
  setViewMode?: (mode: 'matrix' | 'table') => void;
}

const OPLAH_TIERS = [
  20, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1500, 2000, 3000, 5000
];

export default function ManasikMatrixView({
  customParams = DEFAULT_MANASIK_PARAMS,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
}: ManasikMatrixViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVarianFilter, setSelectedVarianFilter] = useState<
    'ALL' | 'Custom Cover 10 x 15,5' | 'Kosongan 10 x 15,5' | 'Mini TikTok 6,3 x 10,3'
  >('ALL');
  const [selectedJilidFilter, setSelectedJilidFilter] = useState<'ALL' | 'Softcover' | 'Cocard' | 'Spiral'>('ALL');
  const [localViewMode, setLocalViewMode] = useState<'matrix' | 'table'>('matrix');

  const viewMode = propViewMode ?? localViewMode;
  const setViewMode = propSetViewMode ?? setLocalViewMode;

  // Matrix data per varian
  const matrixData = useMemo(() => {
    const varianList: Array<{
      id: 'Custom Cover 10 x 15,5' | 'Kosongan 10 x 15,5' | 'Mini TikTok 6,3 x 10,3';
      title: string;
      hal: any;
      desc: string;
    }> = [
      {
        id: 'Custom Cover 10 x 15,5',
        title: 'Buku Manasik Custom Cover (216 Hal)',
        hal: 216,
        desc: 'Uk. 10 x 15,5 cm · 212 Hal Isi + 4 Hal Sisipan PT · Tali Cocard + Plastik OPP',
      },
      {
        id: 'Kosongan 10 x 15,5',
        title: 'Buku Manasik Kosongan Ready (212 Hal)',
        hal: 212,
        desc: 'Uk. 10 x 15,5 cm · HVS 70 gsm Offset 1 Warna · Susun + Lem Panas',
      },
      {
        id: 'Mini TikTok 6,3 x 10,3',
        title: 'Buku Manasik Mini TikTok (48 Hal)',
        hal: 48,
        desc: 'Uk. 6,3 x 10,3 cm · AC 310 gsm FC Bolak-balik + Ring Binder 3cm + Ziplock',
      },
    ];

    const filteredVarians = selectedVarianFilter === 'ALL'
      ? varianList
      : varianList.filter((v) => v.id === selectedVarianFilter);

    return filteredVarians.map((v) => {
      let rows = OPLAH_TIERS.map((oplah) => {
        // Model 1: Softcover Bending
        const softBending = calculateManasikSimulator(
          {
            varian: v.id,
            oplah,
            jumlahHalaman: v.hal,
            tipeJilid: 'Softcover (Bending/Lem Panas)',
            metodeCetakCover: 'Otomatis',
            laminasiCover: v.id === 'Kosongan 10 x 15,5' ? 'Tanpa Laminasi' : 'Doff',
            opsiPlastikOpp: v.id === 'Custom Cover 10 x 15,5',
            opsiKardus: true,
            opsiSisipan: v.id === 'Custom Cover 10 x 15,5',
            marginPct: 30,
            negoDiskonPct: 0,
          },
          customParams
        );

        // Model 2: Tali Cocard (Atau Ring Binder untuk TikTok)
        const taliCocard = calculateManasikSimulator(
          {
            varian: v.id,
            oplah,
            jumlahHalaman: v.hal,
            tipeJilid: v.id === 'Mini TikTok 6,3 x 10,3' ? 'Ring Binder (TikTok)' : 'Tali Cocard',
            metodeCetakCover: 'Otomatis',
            laminasiCover: v.id === 'Mini TikTok 6,3 x 10,3' ? 'Glossy' : v.id === 'Kosongan 10 x 15,5' ? 'Tanpa Laminasi' : 'Doff',
            opsiPlastikOpp: v.id === 'Custom Cover 10 x 15,5',
            opsiKardus: true,
            opsiSisipan: v.id === 'Custom Cover 10 x 15,5',
            marginPct: v.id === 'Mini TikTok 6,3 x 10,3' ? 32 : 30,
            negoDiskonPct: 0,
          },
          customParams
        );

        // Model 3: Spiral Kawat
        const spiral = calculateManasikSimulator(
          {
            varian: v.id,
            oplah,
            jumlahHalaman: v.hal,
            tipeJilid: 'Spiral Kawat',
            metodeCetakCover: 'Otomatis',
            laminasiCover: v.id === 'Kosongan 10 x 15,5' ? 'Tanpa Laminasi' : 'Doff',
            opsiPlastikOpp: v.id === 'Custom Cover 10 x 15,5',
            opsiKardus: true,
            opsiSisipan: v.id === 'Custom Cover 10 x 15,5',
            marginPct: 30,
            negoDiskonPct: 0,
          },
          customParams
        );

        return {
          oplah,
          metode: softBending.metodeCoverTerpilih,
          softBendingHpp: softBending.summary.hppPerPcs,
          softBendingJual: softBending.summary.hargaJualPerPcs,
          taliCocardHpp: taliCocard.summary.hppPerPcs,
          taliCocardJual: taliCocard.summary.hargaJualPerPcs,
          spiralHpp: spiral.summary.hppPerPcs,
          spiralJual: spiral.summary.hargaJualPerPcs,
        };
      });

      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.oplah.toString().includes(query) ||
            r.metode.toLowerCase().includes(query) ||
            v.title.toLowerCase().includes(query)
        );
      }

      return {
        id: v.id,
        title: v.title,
        desc: v.desc,
        rows,
      };
    });
  }, [customParams, searchTerm, selectedVarianFilter]);
  // Flat table rows for table view
  const flatTableRows = useMemo(() => {
    const list: Array<{
      varian: string;
      oplah: number;
      tipeJilid: string;
      metode: string;
      hpp: number;
      hargaJual: number;
      omset: number;
      profitTot: number;
    }> = [];

    const varianList: Array<{
      id: 'Custom Cover 10 x 15,5' | 'Kosongan 10 x 15,5' | 'Mini TikTok 6,3 x 10,3';
      title: string;
      hal: any;
    }> = [
      { id: 'Custom Cover 10 x 15,5', title: 'Custom Cover 10 x 15,5 (216 Hal)', hal: 216 },
      { id: 'Kosongan 10 x 15,5', title: 'Kosongan Ready 10 x 15,5 (212 Hal)', hal: 212 },
      { id: 'Mini TikTok 6,3 x 10,3', title: 'Mini TikTok 6,3 x 10,3 (48 Hal)', hal: 48 },
    ];

    const filteredVarians = selectedVarianFilter === 'ALL'
      ? varianList
      : varianList.filter((v) => v.id === selectedVarianFilter);

    filteredVarians.forEach(({ id, title, hal }) => {
      OPLAH_TIERS.forEach((oplah) => {
        const jilidOptions: Array<{
          type: 'Softcover (Bending/Lem Panas)' | 'Tali Cocard' | 'Spiral Kawat' | 'Ring Binder (TikTok)';
          label: string;
          filterKey: 'Softcover' | 'Cocard' | 'Spiral';
        }> = id === 'Mini TikTok 6,3 x 10,3'
          ? [{ type: 'Ring Binder (TikTok)', label: 'Ring Binder 3cm', filterKey: 'Cocard' }]
          : [
              { type: 'Tali Cocard', label: 'Tali Cocard', filterKey: 'Cocard' },
              { type: 'Softcover (Bending/Lem Panas)', label: 'Softcover Bending', filterKey: 'Softcover' },
              { type: 'Spiral Kawat', label: 'Spiral Kawat', filterKey: 'Spiral' },
            ];

        jilidOptions.forEach(({ type, label, filterKey }) => {
          if (selectedJilidFilter !== 'ALL' && selectedJilidFilter !== filterKey) return;

          const res = calculateManasikSimulator(
            {
              varian: id,
              oplah,
              jumlahHalaman: hal,
              tipeJilid: type,
              metodeCetakCover: 'Otomatis',
              laminasiCover: id === 'Mini TikTok 6,3 x 10,3' ? 'Glossy' : id === 'Kosongan 10 x 15,5' ? 'Tanpa Laminasi' : 'Doff',
              opsiPlastikOpp: id === 'Custom Cover 10 x 15,5',
              opsiKardus: true,
              opsiSisipan: id === 'Custom Cover 10 x 15,5',
              marginPct: id === 'Mini TikTok 6,3 x 10,3' ? 32 : 30,
              negoDiskonPct: 0,
            },
            customParams
          );

          const q = searchTerm.toLowerCase().trim();
          if (q) {
            const match =
              title.toLowerCase().includes(q) ||
              label.toLowerCase().includes(q) ||
              oplah.toString().includes(q) ||
              res.summary.hargaJualPerPcs.toString().includes(q);
            if (!match) return;
          }

          list.push({
            varian: title,
            oplah,
            tipeJilid: label,
            metode: res.metodeCoverTerpilih,
            hpp: res.summary.hppPerPcs,
            hargaJual: res.summary.hargaJualPerPcs,
            omset: res.summary.totalHargaJual,
            profitTot: res.summary.totalProfit,
          });
        });
      });
    });

    return list;
  }, [customParams, searchTerm, selectedVarianFilter, selectedJilidFilter]);

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
              Pricelist Matriks Buku Manasik Haji & Umroh 2026
            </h2>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tabel acuan harga jual resmi master Excel 2026: Custom Cover 10×15,5 cm, Kosongan Ready, dan Mini TikTok 6,3×10,3 cm.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3 text-xs">
        {/* Filter Varian */}
        <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto">
          <select
            value={selectedVarianFilter}
            onChange={(e) => setSelectedVarianFilter(e.target.value as any)}
            className="px-2.5 py-1.5 font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">Semua Varian Manasik</option>
            <option value="Custom Cover 10 x 15,5">Custom Cover 10 x 15,5</option>
            <option value="Kosongan 10 x 15,5">Kosongan 10 x 15,5</option>
            <option value="Mini TikTok 6,3 x 10,3">Mini TikTok 6,3 x 10,3</option>
          </select>
        </div>

        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari oplah, varian, atau mesin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={() => setSelectedJilidFilter('ALL')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedJilidFilter === 'ALL' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua Jilid
          </button>
          <button
            type="button"
            onClick={() => setSelectedJilidFilter('Softcover')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedJilidFilter === 'Softcover' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Softcover
          </button>
          <button
            type="button"
            onClick={() => setSelectedJilidFilter('Cocard')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedJilidFilter === 'Cocard' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tali Cocard
          </button>
          <button
            type="button"
            onClick={() => setSelectedJilidFilter('Spiral')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedJilidFilter === 'Spiral' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Spiral
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
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

      {viewMode === 'matrix' ? (
        <div className="flex flex-col gap-6">
          {matrixData.every((s) => s.rows.length === 0) ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              Tidak ada data yang sesuai pencarian.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  <h3 className="text-sm font-bold text-gray-800 tracking-tight">Buku Manasik Haji &amp; Umroh</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Cover AC 230 + Laminasi Glossy · 10 x 15.5 cm
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {matrixData.map((section) => {
                if (section.rows.length === 0) return null;
                return (
                  <div key={section.id} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="bg-amber-50/70 px-4 py-2 border-b border-amber-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900 tracking-wider uppercase flex items-center gap-1.5">
                        <Layers size={13} className="text-amber-600" />
                        {section.title}
                      </span>
                    </div>
                    <div className="px-4 py-1.5 bg-amber-50/30 border-b border-amber-100/50 text-[10px] text-amber-800">
                      {section.desc}
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-white shadow-xs">
                          <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                            <th className="py-2.5 px-3 border-r border-gray-200 text-center w-20 bg-gray-100" rowSpan={2}>
                              Oplah
                            </th>
                            <th className="py-2.5 px-3 border-r border-gray-200 text-center w-28 bg-gray-100" rowSpan={2}>
                              Mesin
                            </th>
                            {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Softcover') && (
                              <th colSpan={2} className="py-1.5 px-2 text-center border-r border-gray-200 font-bold text-gray-900 bg-gray-200/80">
                                Softcover Bending
                              </th>
                            )}
                            {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Cocard') && (
                              <th colSpan={2} className="py-1.5 px-2 text-center border-r border-gray-200 font-bold text-gray-900 bg-gray-200/80">
                                Tali Cocard
                              </th>
                            )}
                            {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Spiral') && (
                              <th colSpan={2} className="py-1.5 px-2 text-center border-r border-gray-200 font-bold text-gray-900 bg-gray-200/80">
                                Spiral Kawat
                              </th>
                            )}
                          </tr>
                          <tr className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-600">
                            {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Softcover') && (
                              <>
                                <th className="py-1.5 px-2 text-right font-semibold bg-gray-50">HPP</th>
                                <th className="py-1.5 px-2 text-right font-bold text-emerald-800 bg-emerald-100/50 border-r border-gray-200">Harga</th>
                              </>
                            )}
                            {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Cocard') && (
                              <>
                                <th className="py-1.5 px-2 text-right font-semibold bg-gray-50">HPP</th>
                                <th className="py-1.5 px-2 text-right font-bold text-emerald-800 bg-emerald-100/50 border-r border-gray-200">Harga</th>
                              </>
                            )}
                            {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Spiral') && (
                              <>
                                <th className="py-1.5 px-2 text-right font-semibold bg-gray-50">HPP</th>
                                <th className="py-1.5 px-2 text-right font-bold text-emerald-800 bg-emerald-100/50 border-r border-gray-200">Harga</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {section.rows.map((row) => (
                            <tr key={row.oplah} className="hover:bg-amber-50/30 transition-colors">
                              <td className="py-2 px-3 text-center font-bold text-gray-900 border-r border-gray-200 bg-gray-50/30">
                                {row.oplah.toLocaleString('id-ID')}
                              </td>
                              <td className="py-2 px-3 text-center text-gray-600 border-r border-gray-200 font-medium">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    row.metode === 'Cetak Oliver' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                  }`}
                                >
                                  {row.metode === 'Cetak Oliver' ? 'Oliver' : 'Digital'}
                                </span>
                              </td>
                              {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Softcover') && (
                                <>
                                  <td className="py-2 px-2 text-right text-gray-500 font-mono">{row.softBendingHpp.toLocaleString('id-ID')}</td>
                                  <td className="py-2 px-2 text-right font-bold text-emerald-700 font-mono bg-emerald-50/30 border-r border-gray-200">
                                    {row.softBendingJual.toLocaleString('id-ID')}
                                  </td>
                                </>
                              )}
                              {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Cocard') && (
                                <>
                                  <td className="py-2 px-2 text-right text-gray-500 font-mono">{row.taliCocardHpp.toLocaleString('id-ID')}</td>
                                  <td className="py-2 px-2 text-right font-bold text-emerald-700 font-mono bg-emerald-50/30 border-r border-gray-200">
                                    {row.taliCocardJual.toLocaleString('id-ID')}
                                  </td>
                                </>
                              )}
                              {(selectedJilidFilter === 'ALL' || selectedJilidFilter === 'Spiral') && (
                                <>
                                  <td className="py-2 px-2 text-right text-gray-500 font-mono">{row.spiralHpp.toLocaleString('id-ID')}</td>
                                  <td className="py-2 px-2 text-right font-bold text-emerald-700 font-mono bg-emerald-50/30 border-r border-gray-200">
                                    {row.spiralJual.toLocaleString('id-ID')}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Detailed Flat Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Varian Buku</th>
                  <th className="py-2.5 px-3 text-center">Oplah</th>
                  <th className="py-2.5 px-3 text-center">Metode Cover</th>
                  <th className="py-2.5 px-3 text-right">HPP / Eks</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Harga Jual / Eks</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Total Omset</th>
                  <th className="py-2.5 px-3 text-right text-blue-700">Total Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {flatTableRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                      Tidak ada data yang sesuai dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  flatTableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/20">
                      <td className="py-2 px-3 font-semibold text-slate-800 font-sans">{row.varian}</td>
                      <td className="py-2 px-3 font-medium text-slate-700 font-sans">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10.5px]">
                          {row.tipeJilid}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">{row.oplah.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.metode.includes('Oliver') ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {row.metode}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">Rp {row.hpp.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 bg-emerald-50/30">
                        Rp {row.hargaJual.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-800">
                        Rp {row.omset.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-blue-700">
                        Rp {row.profitTot.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium">
            Menampilkan {flatTableRows.length} kombinasi tarif Buku Manasik
          </div>
        </div>
      )}
    </div>
  );
}
