import type { Metadata } from 'next';
import TrackingClient from './TrackingClient';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'SINTAK | Tracking Manufaktur',
};

export default function TrackingManufakturPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
      <PageHeader
        title="Tracking Manufaktur"
        description="Lacak alur produksi dari BOM hingga SPH Out secara transparan."
      />
      
      <TrackingClient />
    </div>
  );
}





