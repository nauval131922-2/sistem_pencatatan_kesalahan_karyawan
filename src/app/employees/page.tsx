import { getEmployees, getLastEmployeeImport } from "@/lib/actions";
import type { Metadata } from "next";
import ExcelUpload from "@/components/ExcelUpload";
import EmployeeTable from "@/components/EmployeeTable";
import { FileSpreadsheet, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { formatLastUpdate } from "@/lib/date-utils";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Daftar Karyawan",
};

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  await requirePermission("karyawan");
  const lastImport = await getLastEmployeeImport();

  let importFileName = "";
  let importTime = "";

  if (lastImport) {
    try {
      const raw = JSON.parse(lastImport.raw_data as string);
      importFileName = raw.filename || "";
      importTime = formatLastUpdate(lastImport.created_at as string);
    } catch (e) {}
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Daftar Karyawan"
        description="Data induk karyawan perusahaan."
      />

      <div className="flex-1 min-h-0 flex flex-col gap-6 max-w-4xl mx-auto w-full px-4 md:px-6">
        <ExcelUpload />

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <EmployeeTable
            importInfo={
              importFileName
                ? { fileName: importFileName, time: importTime }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}








