import OrderProduksiClient from "./OrderProduksiClient";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Order Produksi",
};

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await requirePermission("produksi_orders");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Order Produksi"
        description={
          <>
            Sinkronisasi daftar Order Produksi secara langsung dari{" "}
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

      <OrderProduksiClient />
    </div>
  );
}
