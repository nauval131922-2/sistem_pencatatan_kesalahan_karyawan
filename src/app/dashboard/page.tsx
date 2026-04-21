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
      iconBg: "bg-[#93c5fd]",
      href: "/employees",
      subtitle: "Snapshot Sistem",
    },
    {
      title: "Kesalahan Bulan Ini",
      value: summary.infractionsThisMonth,
      icon: AlertTriangle,
      iconBg: "bg-[#fde047]",
      href: "/stats",
      subtitle: `${new Date().toLocaleString("id-ID", { month: "long", timeZone: "Asia/Jakarta" })}`,
    },
    {
      title: "Kesalahan Hari Ini",
      value: summary.infractionsToday,
      icon: CalendarDays,
      iconBg: "bg-[var(--accent-primary)]",
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
          className="group bg-white border-[3px] border-black rounded-none p-5 h-[110px] flex items-center gap-4 shadow-[3.5px_3.5px_0_0_#000] hover:shadow-[7px_7px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none transition-all duration-150"
        >
          <div
            className={`w-12 h-12 rounded-none border-[2px] border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center shrink-0 ${card.iconBg}`}
          >
            <card.icon size={22} strokeWidth={2.5} className="text-black" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-black tracking-tight leading-none">
                {card.value}
              </span>
              <span className="text-[10px] text-black/50 font-black">
                {card.subtitle}
              </span>
            </div>
            <span className="text-[12px] text-black font-black tracking-tight mt-2">
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
          className="bg-white border-[3px] border-black rounded-none p-5 h-[110px] animate-pulse shadow-[3.5px_3.5px_0_0_#000]"
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
            <div className="h-full bg-white border-[3px] border-black rounded-none animate-pulse shadow-[3.5px_3.5px_0_0_#000]"></div>
          }
        >
          <DashboardLogs />
        </Suspense>
      </div>
    </div>
  );
}








