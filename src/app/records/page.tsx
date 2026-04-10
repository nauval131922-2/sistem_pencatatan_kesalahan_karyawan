import {
  getEmployees,
  getInfractions,
  fetchProductionOrders,
} from "@/lib/actions";
import { getSession } from "@/lib/session";
import type { Metadata } from "next";
import RecordsTabs from "@/components/RecordsTabs";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Pencatatan Kesalahan",
};

export const dynamic = "force-dynamic";

async function RecordsContent({ today }: { today: string }) {
  const [employees, infractions, orders] = await Promise.all([
    getEmployees(),
    getInfractions(today, today),
    fetchProductionOrders(),
  ]);

  return (
    <RecordsTabs
      employees={employees as any}
      orders={orders as any}
      infractions={infractions as any}
      initialPeriod={{ start: today, end: today }}
    />
  );
}

export default async function RecordsPage() {
  await requirePermission("catat_kesalahan");
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Gunakan timezone WIB (UTC+7) agar tanggal konsisten dengan tampilan lokal
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Pencatatan Kesalahan"
        description="Kelola data kesalahan karyawan dan rincian bebannya."
      />

      <div className="flex-1 min-h-0 flex flex-col gap-6 w-full">
        <Suspense fallback={<RecordsSkeleton />}>
          <RecordsContent today={today} />
        </Suspense>
      </div>
    </div>
  );
}

function RecordsSkeleton() {
  return (
    <div className="flex-1 bg-white border border-gray-100 rounded-[8px] shadow-sm overflow-hidden flex flex-col p-6 animate-pulse">
      <div className="flex gap-4 mb-6">
        <div className="h-10 w-32 bg-gray-100 rounded-[8px]"></div>
        <div className="h-10 w-32 bg-gray-100 rounded-[8px]"></div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 space-y-4">
          <div className="h-64 bg-gray-50 rounded-[8px] border border-gray-100"></div>
          <div className="h-12 bg-gray-50 rounded-[8px] border border-gray-100"></div>
        </div>
        <div className="col-span-7">
          <div className="h-full bg-gray-50 rounded-[8px] border border-gray-100 min-h-[400px]"></div>
        </div>
      </div>
    </div>
  );
}
