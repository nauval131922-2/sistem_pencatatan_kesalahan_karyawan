import { Metadata } from "next";
import PenerimaanPembelianClient from "./PenerimaanPembelianClient";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Penerimaan Barang",
};

export const dynamic = "force-dynamic";

export default async function PenerimaanPembelianPage() {
  await requirePermission("pembelian_penerimaan");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Penerimaan Barang"
        description={
          <>
            Sinkronisasi daftar Penerimaan Pembelian secara langsung dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/#cGIvdHJiZWxpX3A="
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-bold"
            >
              Digit
            </a>
          </>
        }
      />

      <PenerimaanPembelianClient />
    </div>
  );
}








