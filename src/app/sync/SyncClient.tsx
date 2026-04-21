'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Database, 
  Clock, 
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatLastUpdate } from '@/lib/date-utils';
import { formatScrapedPeriodDate, getDefaultScraperDateRange, persistScraperPeriod, hydrateScraperPeriod } from '@/lib/scraper-period';

const MODULE_GROUPS = [
  {
    group: 'Produksi',
    color: 'green',
    modules: [
      { id: 'bom', name: 'Bill of Material Produksi', endpoint: '/api/scrape-bom', description: 'Data formula produksi' },
      { id: 'orders', name: 'Order Produksi', endpoint: '/api/scrape-orders', description: 'Surat Perintah Kerja' },
      { id: 'bahan-baku', name: 'BBB Produksi', endpoint: '/api/scrape-bahan-baku', description: 'Pengeluaran bahan produksi' },
      { id: 'barang-jadi', name: 'Penerimaan Barang Hasil Produksi', endpoint: '/api/scrape-barang-jadi', description: 'Stok produk siap kirim' },
    ]
  },
  {
    group: 'Pembelian',
    color: 'blue',
    modules: [
      { id: 'pr', name: 'Purchase Request (PR)', endpoint: '/api/scrape-pr', description: 'Permintaan pembelian bahan' },
      { id: 'spph-out', name: 'SPPH Keluar', endpoint: '/api/scrape-spph-out', description: 'Permintaan penawaran supplier' },
      { id: 'sph-in', name: 'SPH Masuk', endpoint: '/api/scrape-sph-in', description: 'Penawaran masuk dari supplier' },
      { id: 'purchase-orders', name: 'Purchase Order (PO)', endpoint: '/api/scrape-purchase-orders', description: 'Pesanan resmi ke supplier' },
      { id: 'penerimaan-pembelian', name: 'Penerimaan Barang', endpoint: '/api/scrape-penerimaan-pembelian', description: 'Logistik barang masuk' },
      { id: 'rekap-pembelian-barang', name: 'Laporan Rekap Pembelian Barang', endpoint: '/api/scrape-rekap-pembelian-barang', description: 'Faktur pembelian barang' },
      { id: 'pelunasan-hutang', name: 'Pelunasan Hutang', endpoint: '/api/scrape-pelunasan-hutang', description: 'Pembayaran ke supplier' },
    ]
  },
  {
    group: 'Penjualan',
    color: 'purple',
    modules: [
      { id: 'sph-out', name: 'SPH Keluar', endpoint: '/api/scrape-sph-out', description: 'Surat Penawaran Harga Keluar' },
      { id: 'sales-orders', name: 'Sales Order Barang', endpoint: '/api/scrape-sales-orders', description: 'Pesanan dari pelanggan' },
      { id: 'sales', name: 'Laporan Penjualan', endpoint: '/api/scrape-sales', description: 'Faktur penjualan barang' },
      { id: 'pengiriman', name: 'Pengiriman', endpoint: '/api/scrape-pengiriman', description: 'Logistik barang keluar' },
      { id: 'pelunasan-piutang', name: 'Pelunasan Piutang Penjualan', endpoint: '/api/scrape-pelunasan-piutang', description: 'Penerimaan dari pelanggan' },
    ]
  },
];

// Flat list for batch processing
const MODULES = MODULE_GROUPS.flatMap(g => g.modules);

const PERSISTENCE_KEYS: Record<string, { stateKey: string; periodKey: string }> = {
  'bom': { stateKey: 'bomReportState', periodKey: 'BOMClient_scrapedPeriod' },
  'sph-out': { stateKey: 'sphOutState', periodKey: 'SphOutClient_scrapedPeriod' },
  'sales-orders': { stateKey: 'salesOrderState', periodKey: 'SalesOrderClient_scrapedPeriod' },
  'orders': { stateKey: 'orderProduksiState', periodKey: 'OrderProduksiClient_scrapedPeriod' },
  'pr': { stateKey: 'prReportState', periodKey: 'PRClient_scrapedPeriod' },
  'spph-out': { stateKey: 'spphOutState', periodKey: 'SpphOutClient_scrapedPeriod' },
  'sph-in': { stateKey: 'sphInState', periodKey: 'SphInClient_scrapedPeriod' },
  'purchase-orders': { stateKey: 'purchaseOrderState', periodKey: 'PurchaseOrderClient_scrapedPeriod' },
  'penerimaan-pembelian': { stateKey: 'penerimaanPembelianState', periodKey: 'PenerimaanPembelianClient_scrapedPeriod' },
  'rekap-pembelian-barang': { stateKey: 'rekapPembelianBarangState', periodKey: 'RekapPembelianBarangClient_scrapedPeriod' },
  'pelunasan-hutang': { stateKey: 'pelunasanHutangState', periodKey: 'PelunasanHutangClient_scrapedPeriod' },
  'bahan-baku': { stateKey: 'bahanBakuState', periodKey: 'BahanBakuClient_scrapedPeriod' },
  'barang-jadi': { stateKey: 'barangJadiState', periodKey: 'BarangJadiClient_scrapedPeriod' },
  'sales': { stateKey: 'salesReportState', periodKey: 'SalesReportClient_scrapedPeriod' },
  'pengiriman': { stateKey: 'pengirimanState', periodKey: 'PengirimanClient_scrapedPeriod' },
  'pelunasan-piutang': { stateKey: 'pelunasanPiutangState', periodKey: 'PelunasanPiutangClient_scrapedPeriod' },
};

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface ModuleSyncState {
  status: SyncStatus;
  lastUpdate: string | null;
  message: string | null;
  period?: { start: string; end: string } | null;
}

const SYNC_TO_PERM_MAP: Record<string, string> = {
  'pr': 'pembelian_pr',
  'spph-out': 'pembelian_spph',
  'sph-in': 'pembelian_sph_in',
  'purchase-orders': 'pembelian_po',
  'penerimaan-pembelian': 'pembelian_penerimaan',
  'rekap-pembelian-barang': 'pembelian_rekap',
  'pelunasan-hutang': 'pembelian_hutang',
  'bom': 'produksi_bom',
  'orders': 'produksi_orders',
  'bahan-baku': 'produksi_bahan_baku',
  'barang-jadi': 'produksi_barang_jadi',
  'sph-out': 'penjualan_sph_out',
  'sales-orders': 'penjualan_so',
  'sales': 'penjualan_laporan',
  'pengiriman': 'penjualan_pengiriman',
  'pelunasan-piutang': 'penjualan_piutang',
};

export default function SyncClient({ userPermissions = {} }: { userPermissions?: Record<string, boolean> }) {
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  
  const [syncStates, setSyncStates] = useState<Record<string, ModuleSyncState>>(
    MODULES.reduce((acc, mod) => ({
      ...acc,
      [mod.id]: { status: 'idle', lastUpdate: null, message: null, period: null }
    }), {})
  );

  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '' });

  // Hydrate global date picker on mount
  useEffect(() => {
    const defaultKeys = PERSISTENCE_KEYS['bom'];
    if (defaultKeys) {
      const hydrated = hydrateScraperPeriod(defaultKeys);
      if (hydrated.startDate) setStartDate(hydrated.startDate);
      if (hydrated.endDate) setEndDate(hydrated.endDate);
    }
  }, []);

  // Restore sync status on mount
  useEffect(() => {
    async function restoreStatus() {
      try {
        const response = await fetch('/api/sync-status');
        const data = await response.json();
        
        if (data.success && data.statuses) {
          setSyncStates(prev => {
            const newState = { ...prev };
            for (const modId of Object.keys(newState)) {
              const lastUpdatedTimestamp = data.statuses[modId];
              const apiPeriod = data.periods?.[modId];
              
              // Hydrate period from API first, then fall back to individual module's localStorage
              let period: { start: string; end: string } | null = null;
              
              if (apiPeriod && apiPeriod.start && apiPeriod.end) {
                period = {
                  start: apiPeriod.start,
                  end: apiPeriod.end
                };
              } else {
                const keys = PERSISTENCE_KEYS[modId];
                if (keys) {
                  const hydrated = hydrateScraperPeriod(keys);
                  if (hydrated.scrapedPeriod) {
                    period = {
                      start: hydrated.scrapedPeriod.start,
                      end: hydrated.scrapedPeriod.end
                    };
                  }
                }
              }

              if (lastUpdatedTimestamp) {
                const date = new Date(lastUpdatedTimestamp);
                const formattedNow = formatLastUpdate(date);

                newState[modId] = {
                  ...newState[modId],
                  status: 'success',
                  lastUpdate: formattedNow,
                  period: period
                };
              }
            }
            return newState;
          });
        }
      } catch (err) {
        console.error("Failed to restore sync status:", err);
      }
    }
    restoreStatus();
  }, []);


  const runSync = useCallback(async (modId: string) => {
    const mod = MODULES.find(m => m.id === modId);
    if (!mod) return { success: false, count: 0 };

    setSyncStates(prev => ({
      ...prev,
      [modId]: { ...prev[modId], status: 'loading', message: 'Menghubungkan ke server...' }
    }));

    try {
      const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const startStr = formatDate(startDate);
      const endStr = formatDate(endDate);
      const url = `${mod.endpoint}?start=${startStr}&end=${endStr}&metaStart=${startStr}&metaEnd=${endStr}`;

      const response = await fetch(url, { method: 'GET', cache: 'no-store' });
      const data = await response.json();

      if (data.success || !data.error) {
        const now = new Date();
        const formattedNow = formatLastUpdate(now);

        const keys = PERSISTENCE_KEYS[modId];
        if (keys) {
          persistScraperPeriod(keys, startDate, endDate);
        }

        localStorage.setItem('sintak_data_updated', Date.now().toString());
        localStorage.setItem('sintak_profile_updated', Date.now().toString());

        const processedCount = data.total || data.count || data.processed || 0;

        setSyncStates(prev => ({
          ...prev,
          [modId]: { 
            status: 'success', 
            lastUpdate: formattedNow, 
            period: { 
              start: startDate.toLocaleDateString('en-GB').replace(/\//g, '-'), 
              end: endDate.toLocaleDateString('en-GB').replace(/\//g, '-') 
            },
            message: `Berhasil menarik ${processedCount} data.` 
          }
        }));

        return { success: true, count: processedCount };
      } else {
        throw new Error(data.error || 'Server returned error status');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Gagal sinkronasi';
      setSyncStates(prev => ({
        ...prev,
        [modId]: { ...prev[modId], status: 'error', message: errorMsg }
      }));
      return { success: false, count: 0 };
    }
  }, [startDate, endDate]);

  const runBatchSync = async () => {
    if (isBatchProcessing) return;
    setIsBatchProcessing(true);

    // Filter only permitted modules
    const allowedMods = MODULES.filter(mod => {
      const pKey = SYNC_TO_PERM_MAP[mod.id];
      return !pKey || userPermissions[pKey] !== false;
    });

    // Set all permitted modules to loading state immediately
    setSyncStates(prev => {
      const next = { ...prev };
      for (const mod of allowedMods) {
        next[mod.id] = { ...prev[mod.id], status: 'loading', message: 'Menunggu giliran...' };
      }
      return next;
    });

    let totalSuccessCount = 0;
    let totalModulesSuccess = 0;

    // Process in parallel batches of 4 (avoids overloading MDT host)
    const CONCURRENCY = 4;
    for (let i = 0; i < allowedMods.length; i += CONCURRENCY) {
      const batch = allowedMods.slice(i, i + CONCURRENCY);

      // Mark batch as active
      setSyncStates(prev => {
        const next = { ...prev };
        for (const mod of batch) {
          next[mod.id] = { ...prev[mod.id], status: 'loading', message: 'Sedang diproses...' };
        }
        return next;
      });

      const results = await Promise.all(batch.map(mod => runSync(mod.id)));
      for (const result of results) {
        if (result.success) {
          totalSuccessCount += result.count;
          totalModulesSuccess++;
        }
      }
    }

    setCurrentModuleId(null);
    setIsBatchProcessing(false);

    setDialog({
      isOpen: true,
      title: 'Berhasil',
      message: `Berhasil menarik total ${totalSuccessCount.toLocaleString('id-ID')} data dari ${totalModulesSuccess} modul.`
    });
  };

  return (
    <div className="w-full flex-1 min-h-0 overflow-hidden flex flex-col gap-6">
      {/* Header Section */}
      <div className="bg-[var(--bg-surface)] rounded-none border-[3px] border-black p-5 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3.5px_3.5px_0_0_#000] shadow-[2.5px_2.5px_0_0_#000] transition-all duration-300 flex flex-col gap-5 shrink-0 relative z-50">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Rentang Tanggal</span>
            <div className="flex items-center gap-2">
              <div className="w-[140px] relative group"><DatePicker name="startDate" value={startDate} onChange={setStartDate} /></div>
              <div className="w-4 h-[1px] bg-black mx-1"></div>
              <div className="w-[140px] relative group"><DatePicker name="endDate" value={endDate} onChange={setEndDate} /></div>
            </div>
          </div>

          <button
            onClick={runBatchSync}
            disabled={isBatchProcessing}
            className={`
              px-6 h-12 rounded-none font-black text-[13px] uppercase tracking-wider border-[3px] border-black transition-all flex items-center justify-center gap-2.5 
              ${isBatchProcessing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300' 
                : 'bg-[#fde047] text-black hover:bg-black hover:text-white shadow-[3.5px_3.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[5px_5px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all'}
            `}
          >
            {isBatchProcessing ? <Loader2 size={18} className="animate-spin" strokeWidth={3} /> : <RefreshCw size={18} strokeWidth={3} />}
            <span>{isBatchProcessing ? `Sinkronkan...` : 'Mulai Scrape All'}</span>
          </button>
        </div>
      </div>

      {/* Grouped Modules */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 pb-10 flex flex-col gap-8">
        {MODULE_GROUPS.map((group) => {
          // Filter modules in this group by permission 
          const visibleMods = group.modules.filter(mod => {
            const pKey = SYNC_TO_PERM_MAP[mod.id];
            return !pKey || userPermissions[pKey] !== false; // if no mapping found, assume visible, otherwise check
          });

          if (visibleMods.length === 0) return null;

          const groupColorMap: Record<string, { badge: string; header: string; dot: string }> = {
            green: {
              badge: 'bg-[#93c5fd] text-black border-black',
              header: 'border-black',
              dot: 'bg-black',
            },
            blue: {
              badge: 'bg-[#fde047] text-black border-black',
              header: 'border-black',
              dot: 'bg-black',
            },
            purple: {
              badge: 'bg-[#ff5e5e] text-white border-black',
              header: 'border-black',
              dot: 'bg-black',
            },
          };
          const gc = groupColorMap[group.color] || groupColorMap.green;

          return (
            <div key={group.group} className="flex flex-col gap-4">
              {/* Group Header */}
              <div className={`flex items-center gap-3 border-l-[6px] pl-3 ${gc.header}`}>
                <span className={`text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-none border-[2px] shadow-[2px_2px_0_0_#000] ${gc.badge}`}>
                  {group.group}
                </span>
                <div className="flex-1 h-px bg-black opacity-10" />
                <span className="text-[10px] font-black text-black uppercase tracking-tight">{visibleMods.length} modul</span>
              </div>

              {/* Module Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleMods.map((mod) => {
                  const state = syncStates[mod.id];
                  const isActive = currentModuleId === mod.id;

                  return (
                    <div
                      key={mod.id}
                      className={`
                        relative bg-white rounded-none p-5 transition-all duration-300 border-[3px] border-black
                        ${isActive ? 'bg-[#f0f9ff] -translate-y-1 -translate-x-1 shadow-[3.5px_3.5px_0_0_#000]' : 'shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[2.5px_2.5px_0_0_#000]'}
                      `}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col min-w-0">
                            <h3 className="text-[14px] font-black text-black leading-tight py-0.5 uppercase tracking-tight">{mod.name}</h3>
                            <p className="text-[10px] text-gray-500 font-bold mt-1 truncate uppercase tracking-tighter">{mod.description}</p>
                          </div>
                          <div className={`
                            w-10 h-10 rounded-none flex items-center justify-center shrink-0 border-[2px] border-black shadow-[2px_2px_0_0_#000]
                            ${state?.status === 'success' ? 'bg-[#93c5fd] text-black' :
                              state?.status === 'error' ? 'bg-[#ff5e5e] text-white' :
                              isActive ? 'bg-[#fde047] text-black' : 'bg-gray-50 text-gray-400 border-gray-300'}
                          `}>
                            {state?.status === 'success' ? <CheckCircle2 size={18} strokeWidth={3} /> :
                             state?.status === 'error' ? <AlertCircle size={18} strokeWidth={3} /> :
                             isActive ? <Loader2 size={18} className="animate-spin" strokeWidth={3} /> : <Database size={18} strokeWidth={3} />}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-start gap-2 text-[10px] font-black text-black/60 leading-tight uppercase tracking-tight">
                            <Clock size={12} className="mt-0.5 shrink-0" strokeWidth={3} />
                            <div className="flex flex-col gap-0.5">
                              <span className="tracking-tight">Update: {state?.lastUpdate || '-'}</span>
                              {state?.period && (
                                <span className="text-[9px] font-bold opacity-70">
                                  [{formatScrapedPeriodDate(state.period.start)} - {formatScrapedPeriodDate(state.period.end)}]
                                </span>
                              )}
                            </div>
                          </div>

                          {state?.message && (
                            <div className={`
                              text-[10px] font-black px-2.5 py-2 rounded-none border-[2px] border-black leading-tight shadow-[2px_2px_0_0_#000] uppercase tracking-tighter
                              ${state.status === 'success' ? 'bg-[#93c5fd]/30 text-black' : 'bg-[#ff5e5e]/20 text-black'}
                            `}>
                              {state.message}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => runSync(mod.id)}
                          disabled={isBatchProcessing}
                          className={`
                            w-full h-10 rounded-none border-[2px] border-black text-[11px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest
                            ${isBatchProcessing ? 'bg-gray-50 text-gray-300 border-gray-300 cursor-not-allowed' : 'bg-white text-black hover:bg-[var(--accent-primary)] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none'}
                          `}
                        >
                          <RefreshCw size={14} className={isActive ? 'animate-spin' : ''} strokeWidth={3} />
                          Sinkronkan
                        </button>
                      </div>

                      {isActive && (
                        <div className="absolute top-3 right-3 flex gap-1">
                          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="bg-[#fde047] border-[3px] border-black rounded-none p-6 flex items-start gap-4 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[3.5px_3.5px_0_0_#000] shadow-[2.5px_2.5px_0_0_#000] transition-all duration-300 mt-auto">
        <div className="w-12 h-12 rounded-none bg-white flex items-center justify-center text-black border-[3px] border-black shadow-[2px_2px_0_0_#000] shrink-0">
          <ShieldCheck size={24} strokeWidth={3} />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-[14px] font-black text-black uppercase tracking-tight">Catatan Keamanan & Performa</h4>
          <p className="text-[12px] text-black font-bold leading-relaxed uppercase tracking-tighter opacity-80">
            Batch sinkronisasi menjalankan perintah satu per satu untuk mencegah overload pada server MDT Host. 
            Proses ini mungkin memakan waktu beberapa menit tergantung pada volume data. Pastikan koneksi internet stabil selama proses berlangsung.
          </p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type="success"
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog({ ...dialog, isOpen: false })}
      />
    </div>
  );
}















