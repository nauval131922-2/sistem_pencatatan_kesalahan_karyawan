import React from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import DatePicker from '@/components/DatePicker';

interface DateRangeCardProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onFetch: () => void;
  isFetching: boolean;
  progress?: number;
  statusText?: string;
  fetchText?: string;
  title?: string;
  children?: React.ReactNode;
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
  children
}: DateRangeCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 py-3.5 px-6 shadow-sm shadow-green-900/5 flex flex-col gap-4 shrink-0 relative z-50">
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2 pl-1">
            <span className="text-[13px] font-semibold text-gray-500">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-[150px] relative group">
              <DatePicker name="startDate" value={startDate} onChange={onStartDateChange} />
            </div>
            <div className="w-4 h-0.5 bg-gray-100 rounded-full"></div>
            <div className="w-[150px] relative group">
              <DatePicker name="endDate" value={endDate} onChange={onEndDateChange} />
            </div>
          </div>
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
            disabled={isFetching}
            className={`
              px-8 h-12 rounded-lg font-bold text-[13px] border transition-all flex items-center justify-center gap-3 shadow-sm
              ${isFetching 
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' 
                : 'bg-green-600 text-white border-green-500 hover:bg-green-700 shadow-green-100 ring-4 ring-green-500/0 hover:ring-green-500/5'}
            `}
          >
            {isFetching && progress === undefined ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
            )}
            <span>
              {isFetching && progress !== undefined 
                ? `${progress}%` 
                : isFetching 
                  ? 'Sinkronisasi...' 
                  : fetchText}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
