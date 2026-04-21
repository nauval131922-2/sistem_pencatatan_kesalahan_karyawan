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
    <div className="flex items-center justify-between shrink-0 px-1 mt-1 min-h-[30px]">
      <div className="flex items-center gap-4">
        <span className="text-[12px] leading-none font-black text-[oklab(0_0_0/0.4)]">
          {totalCount === 0 ? `Tidak ada ${label}` : `Menampilkan ${currentCount} dari ${totalCount} ${label}`}
        </span>
        
        {selectedCount > 0 && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
            <span className="text-[12px] leading-none font-bold text-gray-400">{selectedCount} dipilih</span>
            <button 
              onClick={onClearSelection}
              className="text-[12px] leading-none font-black text-black hover:text-[#ff5e5e] underline underline-offset-4"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Pagination Controls */}
        {page !== undefined && totalPages !== undefined && onPageChange && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange(1)}
                className="w-7 h-7 flex items-center justify-center text-[14px] font-black border-[2px] border-black bg-white hover:bg-[#fde047] disabled:opacity-30 disabled:hover:bg-white transition-all shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                title="Halaman Pertama"
              >
                «
              </button>
              <button
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="w-7 h-7 flex items-center justify-center border-[2px] border-black bg-white hover:bg-[#fde047] disabled:opacity-30 disabled:hover:bg-white transition-all shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={14} strokeWidth={3} />
              </button>
            </div>

            <span className="text-[11px] font-black uppercase tracking-tighter bg-black text-white px-2 py-0.5 border-[2px] border-black shadow-[2px_2px_0_0_#000]">
              Hal. {page} / {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="w-7 h-7 flex items-center justify-center border-[2px] border-black bg-white hover:bg-[#fde047] disabled:opacity-30 disabled:hover:bg-white transition-all shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                title="Halaman Berikutnya"
              >
                <ChevronRight size={14} strokeWidth={3} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(totalPages)}
                className="w-7 h-7 flex items-center justify-center text-[14px] font-black border-[2px] border-black bg-white hover:bg-[#fde047] disabled:opacity-30 disabled:hover:bg-white transition-all shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                title="Halaman Terakhir"
              >
                »
              </button>
            </div>
          </div>
        )}

        {loadTime !== null && loadTime !== undefined && (
          <span className={`text-[11px] px-2 py-0.5 rounded-none font-black flex items-center gap-1.5 shadow-[2px_2px_0_0_#000] border-[2px] border-black uppercase tracking-tight ${
            loadTime < 300  ? 'bg-[#93c5fd] text-black' :
            loadTime < 1000 ? 'bg-[#fde047] text-black' :
                              'bg-[#ff5e5e] text-white'
          }`}>
            <span className="animate-pulse">⚡</span>
            <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
          </span>
        )}
      </div>
    </div>
  );
}
