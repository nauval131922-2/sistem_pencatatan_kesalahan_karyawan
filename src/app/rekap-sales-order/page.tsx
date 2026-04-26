import type { Metadata } from "next";
import RekapSalesOrderClient from "./RekapSalesOrderClient";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Rekap Sales Order Barang",
};

export const dynamic = "force-dynamic";

export default async function RekapSalesOrderPage() {
  await requirePermission("kalkulasi_rekap_so");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Rekap Sales Order Barang"
        description={
          <>
            Rekap detail baris Sales Order — filter berdasarkan rentang tanggal,{" "}
            <span className="font-bold text-green-700">harga</span>, atau pencarian faktur &amp; produk.
            Data bersumber dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/#cGovcl9zb19icmc="
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-bold"
            >
              Digit
            </a>
            .
          </>
        }
      />
      <RekapSalesOrderClient />
    </div>
  );
}











