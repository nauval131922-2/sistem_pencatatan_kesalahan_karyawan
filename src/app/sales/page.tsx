import SalesReportClient from "./SalesReportClient";
import HelpButton from "@/components/HelpButton";

export const metadata = {
  title: "SIKKA | Laporan Penjualan",
};

export const dynamic = 'force-dynamic';


export default function SalesReportPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <header className="flex justify-between items-start shrink-0">
        <div>
          <div className="border-l-4 border-green-500 pl-4 flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-800 leading-tight">Laporan Penjualan</h1>
            <HelpButton />
          </div>
          <p className="text-sm text-gray-400 mt-0.5 pl-4">Tarik data Laporan Penjualan dari <span className="gradient-text font-semibold text-blue-600">Digit</span></p>
        </div>
      </header>

      <SalesReportClient />
    </div>
  );
}
