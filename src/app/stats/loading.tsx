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
        <div className="shrink-0 h-[72px] bg-white border border-gray-100 rounded-[10px] animate-pulse"></div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartSkeleton height="400px" />
          </div>
          <div className="lg:col-span-1">
            <ChartSkeleton height="400px" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <InsightSkeleton />
          </div>
          <div className="lg:col-span-2">
            <TableSkeleton rows={5} />
          </div>
        </div>
      </div>
    </div>
  );
}
