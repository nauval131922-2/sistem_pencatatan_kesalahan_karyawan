'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TableFooterProps {
  totalCount: number;
  currentCount: number;
  label: string;
  selectedCount?: number;
  onClearSelection?: () => void;
  loadTime?: number | null;
  // Pagination props
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function TableFooter({
  totalCount,
  currentCount,
  label,
  selectedCount = 0,
  onClearSelection,
  loadTime,
  page,
  totalPages,
  onPageChange
}: TableFooterProps) {
  return (
    <div className="flex items-center justify-between shrink-0 px-2 min-h-[30px]">
      <div className="flex items-center gap-4">
        <span className="text-[11px] font-bold text-gray-400 tracking-wide">
          {totalCount === 0 ? `Tidak ada ${label}` : `Menampilkan ${currentCount} dari ${totalCount} ${label}`}
        </span>
        
        {selectedCount > 0 && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
            <span className="text-[11px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 tracking-wide shadow-sm">
              {selectedCount} dipilih
            </span>
            <button 
              onClick={onClearSelection}
              className="text-[11px] font-bold text-gray-400 hover:text-red-600 tracking-wide transition-colors"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Pagination Controls */}
        {page !== undefined && totalPages !== undefined && onPageChange && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange(1)}
                className="w-8 h-8 flex items-center justify-center text-[12px] font-bold border border-gray-100 bg-white hover:bg-green-50 hover:text-green-600 hover:border-green-100 rounded-lg disabled:opacity-30 transition-all shadow-sm"
                title="Halaman Pertama"
              >
                «
              </button>
              <button
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="w-8 h-8 flex items-center justify-center border border-gray-100 bg-white hover:bg-green-50 hover:text-green-600 hover:border-green-100 rounded-lg disabled:opacity-30 transition-all shadow-sm"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>
            </div>

            <div className="flex items-center px-4 py-1.5 bg-gray-50/50 border border-gray-100 rounded-full shadow-inner">
               <span className="text-[11px] font-bold tracking-wide text-gray-400">
                Hal. <span className="text-gray-800">{page}</span> <span className="mx-1.5 opacity-30">/</span> {totalPages}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="w-8 h-8 flex items-center justify-center border border-gray-100 bg-white hover:bg-green-50 hover:text-green-600 hover:border-green-100 rounded-lg disabled:opacity-30 transition-all shadow-sm"
                title="Halaman Berikutnya"
              >
                <ChevronRight size={14} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(totalPages)}
                className="w-8 h-8 flex items-center justify-center text-[12px] font-bold border border-gray-100 bg-white hover:bg-green-50 hover:text-green-600 hover:border-green-100 rounded-lg disabled:opacity-30 transition-all shadow-sm"
                title="Halaman Terakhir"
              >
                »
              </button>
            </div>
          </div>
        )}

        {loadTime !== null && loadTime !== undefined && (
          <div className={`text-[9px] px-2 py-1 rounded-full font-bold flex items-center gap-1.5 border tracking-wide shadow-sm ${
            loadTime < 300  ? 'bg-green-50 text-green-600 border-green-100' :
            loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-red-50 text-red-600 border-red-100'
          }`}>
            <span className="animate-pulse">⚡</span>
            <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
          </div>
        )}
      </div>
    </div>

  );
}



