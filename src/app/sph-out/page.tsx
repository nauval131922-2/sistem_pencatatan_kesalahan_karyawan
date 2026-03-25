import SPHOutClient from './SPHOutClient';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'SINTAK | SPH Out',
};

export const dynamic = 'force-dynamic';

export default function SPHOutPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="SPH Out"
        description={
          <>
            Sinkronisasi daftar SPH Out (Surat Penawaran Harga Keluar) secara langsung dari <a href="https://buyapercetakan.mdthoster.com/#cGovdHJzcGhfb3V0" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-bold">Digit</a>
          </>
        }
      />

      <SPHOutClient />
    </div>
  );
}
