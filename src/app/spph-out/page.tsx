import { Metadata } from "next";
import SpphOutClient from "./SpphOutClient";
import PageHeader from "@/components/PageHeader";
import HelpButton from "@/components/HelpButton";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | SPPH Keluar",
  description:
    "Halaman monitoring dan audit Surat Permintaan Penawaran Harga Out (SPPH Out) dari sistem Digit.",
};

export default async function SpphOutPage() {
  await requirePermission("pembelian_spph");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="SPPH Keluar"
        description={
          <>
            Sinkronisasi daftar SPPH Out (Surat Permintaan Penawaran Harga
            Keluar) secara langsung dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/#cGIvdHJzcHBoX291dA=="
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-bold"
            >
              Digit
            </a>
          </>
        }
        rightElement={<HelpButton />}
      />

      <SpphOutClient />
    </div>
  );
}








