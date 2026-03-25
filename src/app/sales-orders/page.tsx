import type { Metadata } from 'next';
import SalesOrderClient from './SalesOrderClient';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'SINTAK | Sales Order',
};

export const dynamic = 'force-dynamic';

export default function SalesOrdersPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Sales Order"
        description={
          <>
            Sinkronisasi daftar Sales Order secara langsung dari <a href="https://buyapercetakan.mdthoster.com/#cGovcl9zb19icmc=" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-bold">Digit</a>
          </>
        }
      />

      <SalesOrderClient />
    </div>
  );
}
