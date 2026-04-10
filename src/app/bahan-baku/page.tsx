import type { Metadata } from "next";
import BahanBakuClient from "./BahanBakuClient";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | BBB Produksi",
};

export const dynamic = "force-dynamic";

export default async function BahanBakuPage() {
  await requirePermission("produksi_bahan_baku");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="BBB Produksi"
        description={
          <>
            Sinkronisasi daftar Pengeluaran BBB Produksi secara langsung dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/#cHJkL3JfYnJnX2JiYg=="
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-bold"
            >
              Digit
            </a>
          </>
        }
      />

      <BahanBakuClient />
    </div>
  );
}
