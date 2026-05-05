import { requirePermission } from '@/lib/permissions';
import RekAkuntansiClient from './RekAkuntansiClient';
import PageHeader from '@/components/PageHeader';

export const metadata = {
  title: 'Data Rekening Akuntansi - SINTAK',
};

export default async function RekAkuntansiPage() {
  await requirePermission('akt_mrek');

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader 
        title="Data Rekening Akuntansi" 
        description="Scraping dan sinkronisasi data master rekening akuntansi dari Digit."
      />
      <RekAkuntansiClient />
    </div>
  );
}
