import SalesReportClient from "./SalesReportClient";
import PageHeader from "@/components/PageHeader";

export const metadata = {
  title: "SIKKA | Laporan Penjualan",
};

export const dynamic = 'force-dynamic';


export default function SalesReportPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Laporan Penjualan"
        description={
          <>
            Tarik data Laporan Penjualan dari <a href="https://digit.ptbuya.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-bold">Digit</a>
          </>
        }
      />

      <SalesReportClient />
    </div>
  );
}
