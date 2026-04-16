
import MasterPekerjaanClient from "./MasterPekerjaanClient";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Master Pekerjaan",
};

export const dynamic = "force-dynamic";

export default async function MasterPekerjaanPage() {
  await requirePermission("produksi_jhp_master_pekerjaan");

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Master Pekerjaan"
        description="Referensi kode dan nama pekerjaan untuk Jurnal Harian Produksi."
      />
      <MasterPekerjaanClient />
    </div>
  );
}
