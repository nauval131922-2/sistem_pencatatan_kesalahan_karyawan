'use client';

import { useState, useCallback, useEffect } from 'react';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import RecordsForm from './RecordsForm';
import InfractionsTable from './InfractionsTable/InfractionsTable';
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

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        refreshInfractions();
        router.refresh();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshInfractions, router]);


  const handleEdit = useCallback((inf: any) => {
    setEditingInfraction(inf);
    setActiveTab('form');
  }, [pathname, searchParams, router]);

  const handleCancelEdit = useCallback(() => {
    setEditingInfraction(null);
  }, []);

  const handlePeriodChange = useCallback((start: string, end: string) => {
    setCurrentPeriod({ start, end });
  }, []);


  return (
    <div className="w-full h-full flex flex-col overflow-hidden min-h-0">
      {/* Tab Navigation - Neo-brutalist Style */}
      <div className="flex items-center gap-3 mb-8 shrink-0">
        <button
          onClick={() => {
            setActiveTab('list');
            handleCancelEdit();
          }}
          className={`flex items-center gap-2 px-6 py-3 text-[13px] font-black uppercase tracking-widest border-[3px] transition-all relative ${
            activeTab === 'list'
              ? 'bg-[#fde047] text-black border-black shadow-[4px_4px_0_0_#000] z-10 translate-x-[-2px] translate-y-[-2px]'
              : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'
          }`}
        >
          <ClipboardList size={18} strokeWidth={2.5} />
          <span>Daftar Kesalahan</span>
        </button>
        <button
          onClick={() => { setActiveTab('form'); handleCancelEdit(); }}
          className={`flex items-center gap-2 px-6 py-3 text-[13px] font-black uppercase tracking-widest border-[3px] transition-all relative ${
            activeTab === 'form'
              ? 'bg-[#fde047] text-black border-black shadow-[4px_4px_0_0_#000] z-10 translate-x-[-2px] translate-y-[-2px]'
              : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'
          }`}
        >
          {editingInfraction ? <Pencil size={18} strokeWidth={2.5} /> : <PlusCircle size={18} strokeWidth={2.5} />}
          <span>{editingInfraction ? 'Edit Data' : 'Tambah Data'}</span>
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






