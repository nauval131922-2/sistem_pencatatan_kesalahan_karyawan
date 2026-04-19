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
        className="h-10 px-3 bg-white border border-gray-100 rounded-[8px] text-gray-500 hover:text-green-600 hover:border-green-300 hover:bg-green-50 flex items-center justify-center transition-all disabled:opacity-50 shrink-0 shadow-sm"
        title="Refresh Data"
      >
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
      </button>
      <div className="relative flex-1 group">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-600 transition-colors" />
        <input 
          type="text" 
          placeholder={placeholder}
          className="w-full pl-12 pr-4 h-10 bg-white border border-gray-100 rounded-[8px] focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-semibold placeholder:text-gray-300 shadow-sm" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>
    </div>
  );
}
