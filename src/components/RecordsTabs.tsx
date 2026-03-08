'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import RecordsForm from './RecordsForm';
import InfractionsTable from './InfractionsTable';
import { ClipboardList, PlusCircle, Pencil } from 'lucide-react';

type RecordsTabsProps = {
  employees: any[];
  orders: any[];
  infractions: any[];
  initialPeriod: { start: string; end: string };
};

export default function RecordsTabs({ employees, orders, infractions: initialInfractions, initialPeriod }: RecordsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'form' ? 'form' : 'list';

  const [editingInfraction, setEditingInfraction] = useState<any | null>(null);
  // Local state for infractions — updated client-side after save, no full page reload needed
  const [localInfractions, setLocalInfractions] = useState<any[]>(initialInfractions);
  const [currentPeriod, setCurrentPeriod] = useState(initialPeriod);

  const setActiveTab = (tab: 'list' | 'form') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Lightweight client-side refetch for the current period (no full page reload)
  const refreshInfractions = useCallback(async (period?: { start: string; end: string }) => {
    const p = period || currentPeriod;
    try {
      const res = await fetch(`/api/infractions?start=${p.start}&end=${p.end}`);
      if (res.ok) {
        const json = await res.json();
        setLocalInfractions(json.data || []);
      }
    } catch (e) {
      console.error('Failed to refresh infractions', e);
    }
  }, [currentPeriod]);

  const handleEdit = (inf: any) => {
    setEditingInfraction(inf);
    setActiveTab('form');
  };

  const handleCancelEdit = () => {
    setEditingInfraction(null);
  };

  const handlePeriodChange = (start: string, end: string) => {
    setCurrentPeriod({ start, end });
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden min-h-0">
      {/* Tab Navigation - Modern Underline Style */}
      <div className="flex items-center gap-6 w-full shrink-0 border-b border-slate-200 mb-6">
        <button
          onClick={() => {
            setActiveTab('list');
            handleCancelEdit();
          }}
          className={`pb-2 text-sm font-medium transition-all relative ${
            activeTab === 'list'
              ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-500 after:rounded-full'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Daftar Kesalahan
        </button>
        <button
          onClick={() => { setActiveTab('form'); handleCancelEdit(); }}
          className={`pb-2 text-sm font-medium transition-all relative ${
            activeTab === 'form'
              ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-500 after:rounded-full'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {editingInfraction ? 'Edit Data' : 'Tambah Data'}
        </button>
      </div>

      {/* Tab Content - Clean & Spacious */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'list' && (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <InfractionsTable
              infractions={localInfractions}
              onEdit={handleEdit}
              onPeriodChange={handlePeriodChange}
              onRefresh={refreshInfractions}
              initialStartDate={currentPeriod.start}
              initialEndDate={currentPeriod.end}
            />
          </div>
        )}

        {activeTab === 'form' && (
          <div className="overflow-auto animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
            <RecordsForm 
              employees={employees} 
              orders={orders} 
              editingInfraction={editingInfraction}
              onCancelEdit={() => {
                handleCancelEdit();
                setActiveTab('list');
              }}
              onSuccessEdit={() => { handleCancelEdit(); setActiveTab('list'); }}
              onRefreshInfractions={refreshInfractions}
            />
          </div>
        )}
      </div>
    </div>
  );
}
