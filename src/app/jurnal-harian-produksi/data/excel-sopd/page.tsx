import SopdClient from "./SopdClient";
import SopdExcelUpload from "./SopdExcelUpload";
import type { Metadata } from "next";
import { getLastSopdImport } from "@/lib/actions";
import PageHeader from "@/components/PageHeader";
import { formatLastUpdate } from "@/lib/date-utils";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | SOPd",
};

export const dynamic = "force-dynamic";

export default async function SopdPage() {
  await requirePermission("produksi_jhp_sopd");
  const lastImport = await getLastSopdImport();

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
      console.warn("Failed to parse SOPD import metadata");
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="SOPd"
        description="Upload data Sisa Order Produksi (SOPd) dari file Excel."
      />

      <SopdClient
        importInfo={
          importFileName
            ? { fileName: importFileName, time: importTime }
            : undefined
        }
      />
    </div>
  );
}
