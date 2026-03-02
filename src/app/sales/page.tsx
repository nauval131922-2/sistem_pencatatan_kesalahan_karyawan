import SalesReportClient from "./SalesReportClient";

export const metadata = {
  title: "SIKKA | Laporan Penjualan",
};

export default function SalesReportPage() {
  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Laporan Penjualan</h2>
          <p className="text-zinc-500 mt-1">Tarik data Laporan Penjualan dari <span className="gradient-text font-semibold">Digit</span></p>
        </div>
      </header>

      <SalesReportClient />
    </div>
  );
}
