import { getStats, getDetailedStats } from "@/lib/actions";
import type { Metadata } from "next";
import StatsClient from "./StatsClient";
import PageHeader from "@/components/PageHeader";
import { Calendar } from "lucide-react";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Statistik Performa",
};

export const dynamic = "force-dynamic";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const yearStr = resolvedSearchParams.year;
  const currentYear = yearStr ? parseInt(yearStr) : new Date().getFullYear();

  const [stats, detailedData] = await Promise.all([
    getStats(currentYear),
    getDetailedStats(currentYear),
  ]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
      <PageHeader
        title={`Analitik Performa ${currentYear}`}
        description="Statistik akumulasi kesalahan dan evaluasi performa karyawan."
        showHelp={false}
      />
      <StatsClient
        stats={stats}
        detailedData={detailedData}
        year={currentYear}
      />
    </div>
  );
}
