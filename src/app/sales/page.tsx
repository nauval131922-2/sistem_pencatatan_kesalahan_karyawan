import SalesReportClient from "./SalesReportClient";
import HelpButton from "@/components/HelpButton";

export const metadata = {
  title: "SIKKA | Laporan Penjualan",
};

export const dynamic = 'force-dynamic';


export default function SalesReportPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 -m-8 p-8 bg-white animate-in fade-in duration-500 overflow-hidden">
      <header className="flex flex-col shrink-0">
        <div className="flex items-center gap-3 border-l-4 border-green-500 pl-4">
          <h1 className="text-[22px] font-extrabold text-gray-800 tracking-tight leading-none">Laporan Penjualan</h1>
          <HelpButton />
        </div>
        <p className="text-[13px] text-gray-400 font-medium pl-5 mt-2">
          Tarik data Laporan Penjualan dari <a href="https://digit.ptbuya.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-bold">Digit</a>
        </p>
      </header>

      <SalesReportClient />
    </div>
  );
}
