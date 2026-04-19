
import MasterPekerjaanClient from "./MasterPekerjaanClient";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";
import { getLastMasterPekerjaanImport } from "@/lib/actions";
import { formatLastUpdate } from "@/lib/date-utils";

export const metadata: Metadata = {
  title: "SINTAK | Master Pekerjaan",
};

export const dynamic = "force-dynamic";

export default async function MasterPekerjaanPage() {
  await requirePermission("produksi_jhp_master_pekerjaan");
  const lastImport = await getLastMasterPekerjaanImport();

  let importFileName = "";
  let importTime = "";

  if (lastImport) {
    try {
      const raw = JSON.parse(lastImport.raw_data as string);
      importFileName = raw.fileName || "";

      let dateString = lastImport.created_at as string;
      if (!dateString.includes("T")) dateString = dateString.replace(" ", "T");
      if (!dateString.endsWith("Z")) dateString += "Z";

      const d = new Date(dateString);
      importTime = formatLastUpdate(d);
    } catch (e) {
      console.warn("Failed to parse Master Pekerjaan import metadata");
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Master Pekerjaan"
        description="Referensi kode dan nama pekerjaan untuk Jurnal Harian Produksi."
      />
      <MasterPekerjaanClient 
        importInfo={
          importFileName
            ? { fileName: importFileName, time: importTime }
            : undefined
        }
      />
    </div>
  );
}
