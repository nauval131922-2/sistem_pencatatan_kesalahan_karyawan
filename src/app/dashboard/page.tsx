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
      iconBg: "bg-blue-50 text-blue-600 border-blue-100",
      href: "/employees",
      subtitle: "Snapshot Sistem",
    },
    {
      title: "Kesalahan Bulan Ini",
      value: summary.infractionsThisMonth,
      icon: AlertTriangle,
      iconBg: "bg-amber-50 text-amber-600 border-amber-100",
      href: "/stats",
      subtitle: `${new Date().toLocaleString("id-ID", { month: "long", timeZone: "Asia/Jakarta" })}`,
    },
    {
      title: "Kesalahan Hari Ini",
      value: summary.infractionsToday,
      icon: CalendarDays,
      iconBg: "bg-green-50 text-green-600 border-green-100",
      href: "/records",
      subtitle: "Real-time",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 shrink-0">
      {statCards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className="group bg-white border border-gray-100 rounded-2xl p-6 h-[110px] flex items-center gap-5 shadow-sm hover:shadow-sm hover:shadow-green-900/5 hover:-translate-y-1 transition-all duration-300"
        >
          <div
            className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${card.iconBg}`}
          >
            <card.icon size={20} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-800 tracking-tight leading-none">
                {card.value}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {card.subtitle}
              </span>
            </div>
            <span className="text-[12px] text-gray-500 font-bold mt-2">
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 shrink-0">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white border border-gray-100 rounded-2xl p-6 h-[110px] animate-pulse shadow-sm"
        ></div>
      ))}
    </div>
  );
}

export default async function Home() {
  await requirePermission("dashboard");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
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
            <div className="h-full bg-white border border-gray-100 rounded-2xl animate-pulse shadow-sm"></div>
          }
        >
          <DashboardLogs />
        </Suspense>
      </div>
    </div>
  );
}












