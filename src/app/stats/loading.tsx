import PageHeader from '@/components/PageHeader';
import { CardSkeleton, ChartSkeleton, InsightSkeleton, TableSkeleton } from '@/components/StatsSkeleton';

export default function Loading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
      <PageHeader
        title="Analitik Performa"
        description="Memuat data performa..."
        showHelp={false}
      />
      
      <div className="flex-1 flex flex-col gap-6 pb-10 overflow-y-auto custom-scrollbar">
        {/* Year Selector Skeleton */}
        <div className="shrink-0 h-[75px] bg-white border-[3px] border-black rounded-none shadow-[2.5px_2.5px_0_0_#000] opacity-30 animate-pulse"></div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {/* Main Chart Skeleton */}
          <div className="lg:col-span-3">
            <ChartSkeleton height="500px" />
          </div>
          {/* Pie Chart Skeleton */}
          <div className="lg:col-span-1">
            <ChartSkeleton height="400px" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TableSkeleton rows={6} />
          <InsightSkeleton />
        </div>
      </div>
    </div>
  );
}













