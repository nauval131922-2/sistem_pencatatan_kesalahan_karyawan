import { Metadata } from 'next';
import PRClient from './PRClient';
import PageHeader from '@/components/PageHeader';
import HelpButton from '@/components/HelpButton';

export const metadata: Metadata = {
  title: 'Purchase Request | SINTAK',
  description: 'Halaman monitoring dan audit Purchase Request dari sistem Digit.',
};

export default function PRPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader 
        title="Purchase Request" 
        description={
          <>
            Sinkronisasi daftar Purchase Request secara langsung dari <a href="https://buyapercetakan.mdthoster.com/#cGIvdHJwcg==" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-bold">Digit</a>
          </>
        }
        rightElement={<HelpButton />}
      />

      <PRClient />
    </div>
  );
}
