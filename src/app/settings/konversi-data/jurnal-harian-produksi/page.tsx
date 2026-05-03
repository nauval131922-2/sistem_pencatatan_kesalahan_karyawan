import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import KonversiJHPClient from './KonversiJHPClient';

export const metadata: Metadata = {
  title: 'SINTAK | Konversi Data - Jurnal Harian Produksi',
};

export const dynamic = 'force-dynamic';

export default async function KonversiDataJHPPage() {
  const session = await getSession();
  if (!session?.userId) redirect('/login');
  if (session.role !== 'Super Admin') redirect('/unauthorized');

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Konversi Data — Jurnal Harian Produksi"
        description="Upload file Excel untuk mengimpor data historis Jurnal Harian Produksi ke sistem. Gunakan fitur ini hanya sekali saat cut-off data."
      />
      <KonversiJHPClient />
    </div>
  );
}
