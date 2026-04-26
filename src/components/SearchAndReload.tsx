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
    <div className="flex items-center gap-3">
      <button
        onClick={onReload}
        disabled={loading}
        className="h-10 w-10 bg-white border border-gray-100 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 flex items-center justify-center transition-all disabled:opacity-50 shrink-0 shadow-sm"
        title="Refresh Data"
      >
        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
      </button>
      <div className="relative flex-1 group">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors z-10" />
        <input 
          type="text" 
          placeholder={placeholder}
          className="w-full pl-12 pr-4 h-10 bg-white border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500 transition-all text-[13px] font-medium placeholder:text-gray-300 shadow-sm" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>
    </div>
  );
}











