import React from 'react';
import { DownloadCloud, Loader2 } from 'lucide-react';
import DatePicker from '@/components/DatePicker';

interface DateRangeCardProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onStartDateChange?: (date: Date) => void;
  onEndDateChange?: (date: Date) => void;
  onFetch: () => void;
  isFetching: boolean;
  progress?: number;
  statusText?: string;
  fetchText?: string;
  title?: string;
  children?: React.ReactNode;
  fetchDisabled?: boolean;
}

export default function DateRangeCard({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFetch,
  isFetching,
  progress,
  statusText,
  fetchText = 'Tarik Data',
  title = 'Rentang Tanggal',
  children,
  fetchDisabled = false
}: DateRangeCardProps) {
  const hasDates = onStartDateChange && onEndDateChange;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 py-3.5 px-6 shadow-sm shadow-green-900/5 flex flex-col gap-4 shrink-0 relative z-50 flex-1 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2 pl-1">
            <span className="text-[13px] font-semibold text-gray-500">{title}</span>
          </div>
          {hasDates && (
            <div className="flex items-center gap-3">
              <div className="w-[150px] relative group">
                <DatePicker name="startDate" value={startDate || null} onChange={onStartDateChange} />
              </div>
              <div className="w-4 h-0.5 bg-gray-100 rounded-full"></div>
              <div className="w-[150px] relative group">
                <DatePicker name="endDate" value={endDate || null} onChange={onEndDateChange} />
              </div>
            </div>
          )}
        </div>
        
        {children && (
          <div className="flex items-center gap-4">
            {children}
          </div>
        )}

        <div className="shrink-0 flex items-center gap-5">
          {isFetching && statusText && (
             <div className="flex flex-col items-end gap-2">
               <div className="text-[10px] text-green-600 font-bold animate-pulse leading-none bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm">
                 {statusText}
               </div>
               {progress !== undefined && (
                 <div className="w-32 h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                   <div className="h-full bg-green-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
                 </div>
               )}
             </div>
          )}
          <button
             onClick={onFetch}
             disabled={isFetching || fetchDisabled}
             className="w-full sm:w-auto min-w-[140px] px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white rounded-xl text-[12px] font-bold shadow-sm shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn relative overflow-hidden"
           >
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
             <span className="relative z-10 flex items-center gap-2">
               {isFetching && progress === undefined ? (
                 <><Loader2 size={16} className="animate-spin" /> {fetchText === 'Tarik Data' ? 'Sedang Menarik...' : 'Sinkronisasi...'}</>
               ) : isFetching && progress !== undefined ? (
                 <><Loader2 size={16} className="animate-spin" /> {progress}%</>
               ) : (
                 <><DownloadCloud size={16} className="group-hover/btn:-translate-y-0.5 transition-transform duration-300" /> {fetchText}</>
               )}
             </span>
           </button>
        </div>
      </div>
    </div>
  );
}
