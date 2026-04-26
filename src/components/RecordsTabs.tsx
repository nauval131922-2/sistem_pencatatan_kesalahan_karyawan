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
      {/* Tab Navigation - Premium Light Style */}
      <div className="flex items-center gap-1.5 mb-5 p-1 bg-gray-100 rounded-full w-fit shrink-0 border border-gray-100 shadow-inner">
        <button
          onClick={() => {
            setActiveTab('list');
            handleCancelEdit();
          }}
          className={`flex items-center gap-1.5 px-5 py-2 text-[12px] font-bold rounded-full transition-all duration-300 ${
            activeTab === 'list'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ClipboardList size={14} />
          <span>Daftar Kesalahan</span>
        </button>
        <button
          onClick={() => { setActiveTab('form'); handleCancelEdit(); }}
          className={`flex items-center gap-1.5 px-5 py-2 text-[12px] font-bold rounded-full transition-all duration-300 ${
            activeTab === 'form'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {editingInfraction ? <Pencil size={14} /> : <PlusCircle size={14} />}
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

















