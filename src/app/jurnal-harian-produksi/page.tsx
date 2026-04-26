import JurnalClient from "./JurnalClient";
import type { Metadata } from "next";
import { getLastJurnalHarianImport } from "@/lib/actions";
import PageHeader from "@/components/PageHeader";
import { formatLastUpdate } from "@/lib/date-utils";
import { requirePermission } from "@/lib/permissions";
export const metadata: Metadata = {
  title: "SINTAK | Jurnal Harian Produksi",
};

export const dynamic = "force-dynamic";

export default async function JurnalHarianPage() {
  await requirePermission("produksi_jhp");
  const lastImport = await getLastJurnalHarianImport();

  let importFileName = "";
  let importTime = "";

  if (lastImport) {
    try {
      const raw = JSON.parse(lastImport.raw_data as string);
      importFileName = raw.fileName || "";
      importTime = formatLastUpdate(lastImport.created_at as string);
    } catch (e) {
      console.warn("Failed to parse Jurnal Harian import metadata");
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Jurnal Harian Produksi"
        description="Laporan target dan realisasi pekerjaan harian produksi."
      />

      <JurnalClient
        importInfo={
          importFileName
            ? { fileName: importFileName, time: importTime }
            : undefined
        }
      />
    </div>
  );
}



