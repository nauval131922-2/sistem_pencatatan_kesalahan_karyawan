'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import RecordsForm from './RecordsForm';
import InfractionsTable from './InfractionsTable';
import { ClipboardList, PlusCircle, Pencil } from 'lucide-react';

type RecordsTabsProps = {
  employees: any[];
  orders: any[];
  infractions: any[];
};

export default function RecordsTabs({ employees, orders, infractions }: RecordsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Get tab from URL, default to 'list'
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'form' ? 'form' : 'list';

  const [editingInfraction, setEditingInfraction] = useState<any | null>(null);

  const setActiveTab = (tab: 'list' | 'form') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleEdit = (inf: any) => {
    setEditingInfraction(inf);
    setActiveTab('form');
  };

  const handleCancelEdit = () => {
    setEditingInfraction(null);
  };


  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex w-full mb-6 border-b border-zinc-200">
        <button
          onClick={() => {
            setActiveTab('list');
            handleCancelEdit();
          }}
          className={`flex items-center justify-center gap-2 py-3 px-6 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
            activeTab === 'list'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span>Daftar Kesalahan</span>
        </button>
        <button
          onClick={() => { setActiveTab('form'); handleCancelEdit(); }}
          className={`flex items-center justify-center gap-2 py-3 px-6 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
            activeTab === 'form'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
          }`}
        >
          {editingInfraction ? <Pencil className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
          <span>{editingInfraction ? 'Edit Data' : 'Tambah Data'}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-2 outline-none">
        {activeTab === 'list' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-xl border border-zinc-200/60 p-4 shadow-sm">
              <InfractionsTable infractions={infractions} onEdit={handleEdit} />
            </div>
          </div>
        )}

        {activeTab === 'form' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <RecordsForm 
              employees={employees} 
              orders={orders} 
              editingInfraction={editingInfraction}
              onCancelEdit={() => {
                handleCancelEdit();
                setActiveTab('list');
              }}
              onSuccessEdit={() => { handleCancelEdit(); setActiveTab('list'); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
