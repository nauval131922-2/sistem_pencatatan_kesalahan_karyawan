import type { Metadata } from "next";
import SalesOrderClient from "./SalesOrderClient";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Sales Order Barang",
};

export const dynamic = "force-dynamic";

export default async function SalesOrdersPage() {
  await requirePermission("penjualan_so");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Sales Order Barang"
        description={
          <>
            Sinkronisasi daftar Sales Order secara langsung dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/#cGovcl9zb19icmc="
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-bold"
            >
              Digit
            </a>
          </>
        }
      />

      <SalesOrderClient />
    </div>
  );
}
