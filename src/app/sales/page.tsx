import SalesReportClient from "./SalesReportClient";
import HelpButton from "@/components/HelpButton";

export const metadata = {
  title: "SIKKA | Laporan Penjualan",
};

export default function SalesReportPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Laporan Penjualan</h2>
            <HelpButton />
          </div>
          <p className="text-slate-500 mt-1 text-sm">Tarik data Laporan Penjualan dari <span className="gradient-text font-semibold text-blue-600">Digit</span></p>
        </div>
      </header>

      <SalesReportClient />
    </div>
  );
}
