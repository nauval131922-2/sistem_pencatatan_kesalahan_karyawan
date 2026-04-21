'use client';

import { Search, RefreshCw } from 'lucide-react';

interface SearchAndReloadProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onReload: () => void;
  loading?: boolean;
  placeholder?: string;
}

export default function SearchAndReload({
  searchQuery,
  setSearchQuery,
  onReload,
  loading = false,
  placeholder = "Cari data...",
}: SearchAndReloadProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onReload}
        disabled={loading}
        className="h-10 px-3 bg-[#fde047] border-[3px] border-black rounded-none text-black hover:bg-black hover:text-white flex items-center justify-center transition-all disabled:opacity-50 shrink-0 shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
        title="Refresh Data"
      >
        <RefreshCw size={16} strokeWidth={2.5} className={loading ? 'animate-spin' : ''} />
      </button>
      <div className="relative flex-1 group">
        <Search size={16} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-black z-10" />
        <input 
          type="text" 
          placeholder={placeholder}
          className="w-full pl-12 pr-4 h-10 bg-white border-[3px] border-black rounded-none focus:outline-none shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[2.5px_2.5px_0_0_#000] transition-all text-[13px] font-black placeholder:text-gray-400" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>
    </div>
  );
}








