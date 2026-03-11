import PageHeader from '@/components/PageHeader';
import { CardSkeleton, TableSkeleton } from '@/components/StatsSkeleton';

export default function Loading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-pulse">
      <PageHeader
        title="Dashboard"
        description="Menyiapkan ringkasan aktivitas..."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <TableSkeleton rows={10} />
      </div>
    </div>
  );
}
