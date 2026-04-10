import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import PageHeader from '@/components/PageHeader';
import LogsClient from './LogsClient';

export const metadata: Metadata = {
  title: 'SINTAK | Log Aktivitas',
  description: 'Sistem pencatatan riwayat aktivitas pengguna.',
};

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
  const session = await getSession();

  // Hanya Super Admin yang berhak melihat log audit keseluruhan
  if (!session || session.role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Log Aktivitas"
        description="Audit trail semua aktivitas dan sinkronisasi di dalam SINTAK."
      />

      <div className="flex-1 min-h-0 flex flex-col gap-6 w-full">
        <LogsClient />
      </div>
    </div>
  );
}
