import { getStats, getDetailedStats } from '@/lib/actions';
import type { Metadata } from 'next';
import StatsClient from './StatsClient';

export const metadata: Metadata = {
  title: 'SIKKA | Statistik Performa',
};

export const dynamic = 'force-dynamic';

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const yearStr = resolvedSearchParams.year;
  const currentYear = yearStr ? parseInt(yearStr) : new Date().getFullYear();

  const [stats, detailedData] = await Promise.all([
    getStats(currentYear),
    getDetailedStats(currentYear)
  ]);

  return <StatsClient stats={stats} detailedData={detailedData} year={currentYear} />;
}
