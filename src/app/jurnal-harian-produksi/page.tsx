import JurnalClient from "./JurnalClient";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { requirePermission, getRolePermissions } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "SINTAK | Jurnal Harian Produksi",
};

export const dynamic = "force-dynamic";

export default async function JurnalHarianPage() {
  await requirePermission("produksi_jhp");

  const session = await getSession();
  const isSuperAdmin = session?.role === 'Super Admin';

  let canInputTarget = isSuperAdmin;
  let canInputRealisasi = isSuperAdmin;

  if (!isSuperAdmin && session?.role) {
    const perms = await getRolePermissions(session.role);
    canInputTarget    = perms['produksi_jhp_penjadwalan'] !== false;
    canInputRealisasi = perms['produksi_jhp_realisasi'] !== false;
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Jurnal Harian Produksi"
        description="Laporan target dan realisasi pekerjaan harian produksi."
      />

      <JurnalClient canInputTarget={canInputTarget} canInputRealisasi={canInputRealisasi} />
    </div>
  );
}




