import { Metadata } from "next";
import SphInClient from "./SphInClient";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | SPH Masuk",
  description:
    "Halaman monitoring dan audit Surat Penawaran Harga Masuk (SPH In) dari sistem Digit.",
};

export default async function SphInPage() {
  await requirePermission("pembelian_sph_in");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="SPH Masuk"
        description={
          <>
            Sinkronisasi daftar SPH In (Surat Penawaran Harga Masuk) secara
            langsung dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/#cGIvdHJzcGhfaW4="
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-bold"
            >
              Digit
            </a>
          </>
        }
      />

      <SphInClient />
    </div>
  );
}








