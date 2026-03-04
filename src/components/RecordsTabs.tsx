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
      {/* Tab Navigation */}
      <div className="flex w-full shrink-0 border-b border-zinc-200">
        <button
          onClick={() => {
            setActiveTab('list');
            handleCancelEdit();
          }}
          className={`flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
            activeTab === 'list'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Daftar Kesalahan</span>
        </button>
        <button
          onClick={() => { setActiveTab('form'); handleCancelEdit(); }}
          className={`flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
            activeTab === 'form'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
          }`}
        >
          {editingInfraction ? <Pencil className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          <span>{editingInfraction ? 'Edit Data' : 'Tambah Data'}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-2">
        {activeTab === 'list' && (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-zinc-200/60 p-4 shadow-sm overflow-hidden">
              <InfractionsTable
                infractions={localInfractions}
                onEdit={handleEdit}
                onPeriodChange={handlePeriodChange}
                onRefresh={refreshInfractions}
              />
            </div>
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
