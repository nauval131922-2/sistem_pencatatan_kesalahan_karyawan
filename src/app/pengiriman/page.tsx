import { Metadata } from "next";
import PengirimanClient from "./PengirimanClient";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Pengiriman",
};

export const dynamic = "force-dynamic";

export default async function PengirimanPage() {
  await requirePermission("penjualan_pengiriman");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Pengiriman"
        description={
          <>
            Sinkronisasi Daftar Pengiriman dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/#cGovcl9qdWFsX2ty"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-bold"
            >
              Digit
            </a>
          </>
        }
      />

      <PengirimanClient />
    </div>
  );
}
