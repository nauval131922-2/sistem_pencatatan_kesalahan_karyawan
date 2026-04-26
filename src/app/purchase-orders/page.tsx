import { Metadata } from "next";
import PurchaseOrderClient from "./PurchaseOrderClient";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Purchase Order (PO)",
  description:
    "Halaman monitoring dan audit Purchase Order (PO) dari sistem Digit.",
};

export default async function PurchaseOrderPage() {
  await requirePermission("pembelian_po");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Purchase Order (PO)"
        description={
          <>
            Sinkronisasi daftar Purchase Order secara langsung dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/#cGIvdHJwbw=="
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-bold"
            >
              Digit
            </a>
          </>
        }
      />

      <PurchaseOrderClient />
    </div>
  );
}











