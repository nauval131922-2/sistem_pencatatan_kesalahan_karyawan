import type { Metadata } from 'next';
import TargetClient from './TargetClient';
import { requirePermission } from '@/lib/permissions';
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: 'SINTAK | Jadwal Produksi Harian',
};

export const dynamic = 'force-dynamic';

export default async function TargetHarianPage() {
  await requirePermission('produksi_jhp');
  
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Jadwal Produksi Harian"
        description="Laporan jadwal harian produksi untuk operasional lapangan."
      />
      <TargetClient />
    </div>
  );
}
