import BOMClient from "./BOMClient";
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'SINTAK | Bill of Material',
};

export const dynamic = 'force-dynamic';

export default function BOMPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Bill of Material"
        description={
          <>
            Sinkronisasi daftar Bill of Material secara langsung dari <a href="https://buyapercetakan.mdthoster.com/#cHJkL3RycHJkX2Jt" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-bold">Digit</a>
          </>
        }
      />

      <BOMClient />
    </div>
  );
}
