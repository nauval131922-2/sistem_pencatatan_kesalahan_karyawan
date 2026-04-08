import { Metadata } from 'next';
import PelunasanHutangClient from './PelunasanHutangClient';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'SINTAK | Pelunasan Hutang',
};

export const dynamic = 'force-dynamic';

export default function PelunasanHutangPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Pelunasan Hutang"
        description={
          <>
            Sinkronisasi Daftar Pelunasan Hutang dari <a href="https://buyapercetakan.mdthoster.com/#cGIvdHJwZWxodXQ=" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-bold">Digit</a>
          </>
        }
      />

      <PelunasanHutangClient />
    </div>
  );
}





