import SyncClient from "./SyncClient";
import PageHeader from "@/components/PageHeader";
import { requirePermission, getRolePermissions } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export const metadata = {
  title: "SINTAK | Sinkronisasi All Data",
  description: "Pusat Sinkronisasi Data Scraper - SINTAK",
};

export default async function SyncPage() {
  await requirePermission("sync");
  const session = await getSession();
  if (!session) return null; // requirePermission handles redirect for unauthenticated users
  const userPermissions = await getRolePermissions(session.role);
  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Sinkronisasi All Data"
        description={
          <>
            Pusat kendali sinkronisasi seluruh modul operasional secara langsung
            dari <span className="text-green-600 font-bold">MDT Host</span>
          </>
        }
      />
      <SyncClient userPermissions={userPermissions} />
    </div>
  );
}
