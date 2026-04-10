import { Metadata } from "next";
import PelunasanPiutangClient from "./PelunasanPiutangClient";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Pelunasan Piutang Penjualan",
};

export const dynamic = "force-dynamic";

export default async function PelunasanPiutangPage() {
  await requirePermission("penjualan_piutang");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Pelunasan Piutang Penjualan"
        description={
          <>
            Sinkronisasi Daftar Pelunasan Piutang Penjualan dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/#cGovcl9wcA=="
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-bold"
            >
              Digit
            </a>
          </>
        }
      />

      <PelunasanPiutangClient />
    </div>
  );
}
