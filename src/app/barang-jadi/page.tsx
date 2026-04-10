import type { Metadata } from "next";
import BarangJadiClient from "./BarangJadiClient";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Penerimaan Barang Hasil Produksi",
};

export const dynamic = "force-dynamic";

export default async function BarangJadiPage() {
  await requirePermission("produksi_barang_jadi");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Penerimaan Barang Hasil Produksi"
        description={
          <>
            Sinkronisasi daftar Barang Hasil Produksi secara langsung dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-bold"
            >
              Digit
            </a>
          </>
        }
      />

      <BarangJadiClient />
    </div>
  );
}
