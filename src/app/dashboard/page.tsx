import { getDashboardSummary, getActivityLogs } from "@/lib/actions";
import { Users, AlertTriangle, CalendarDays } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import ActivityTable from "@/components/ActivityTable";
import PageHeader from "@/components/PageHeader";
import { Suspense } from "react";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Dashboard",
};

export const dynamic = "force-dynamic";

async function DashboardStats() {
  const summary = await getDashboardSummary();
  const statCards = [
    {
      title: "Karyawan Aktif",
      value: summary.activeEmployees,
      icon: Users,
      classes: "bg-blue-50 text-blue-500",
      href: "/employees",
      subtitle: "Snapshot Sistem",
    },
    {
      title: "Kesalahan Bulan Ini",
      value: summary.infractionsThisMonth,
      icon: AlertTriangle,
      classes: "bg-amber-50 text-amber-500",
      href: "/stats",
      subtitle: `${new Date().toLocaleString("id-ID", { month: "long", timeZone: "Asia/Jakarta" })}`,
    },
    {
      title: "Kesalahan Hari Ini",
      value: summary.infractionsToday,
      icon: CalendarDays,
      classes: "bg-red-50 text-red-500",
      href: "/records",
      subtitle: "Real-time",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
      {statCards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className="group bg-white border-[1.5px] border-gray-200 rounded-[8px] p-5 h-[100px] flex items-center gap-4 hover:border-gray-300 hover:shadow-sm transition-all duration-300 active:scale-[0.98]"
        >
          <div
            className={`w-12 h-12 rounded-[8px] flex items-center justify-center shrink-0 transition-colors ${card.classes}`}
          >
            <card.icon size={24} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-800 tracking-tight leading-none">
                {card.value}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {card.subtitle}
              </span>
            </div>
            <span className="text-[12px] text-[#9ca3af] font-bold tracking-tight mt-1.5">
              {card.title}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

async function DashboardLogs() {
  const logs = await getActivityLogs(500);
  return <ActivityTable initialLogs={logs} />;
}

function StatSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-gray-50 border border-gray-100 rounded-[8px] p-5 h-[100px] animate-pulse"
        ></div>
      ))}
    </div>
  );
}

export default async function Home() {
  await requirePermission("dashboard");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Dashboard"
        description="Ringkasan aktivitas dan metrik sistem secara real-time."
      />

      <Suspense fallback={<StatSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Suspense
          fallback={
            <div className="h-full bg-gray-50 rounded-[8px] animate-pulse border border-gray-100"></div>
          }
        >
          <DashboardLogs />
        </Suspense>
      </div>
    </div>
  );
}
