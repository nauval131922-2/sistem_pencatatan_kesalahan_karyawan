import type { Metadata } from "next";
import TrackingClient from "./TrackingClient";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Tracking Manufaktur",
};

export default async function TrackingManufakturPage() {
  await requirePermission("tracking_manufaktur");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
      <PageHeader
        title="Tracking Manufaktur"
        description={
          <>
            Lacak data manufaktur dari BOM hingga Pelunasan Piutang Penjualan
            dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-bold"
            >
              Digit.
            </a>
          </>
        }
      />

      <TrackingClient />
    </div>
  );
}











