import HasilProduksiClient from './HasilProduksiClient';
import PageHeader from "@/components/PageHeader";

export const metadata = {
  title: "SINTAK | Hasil Produksi",
  description: "Laporan hasil produksi harian.",
};

export default function HasilProduksiPage() {
  return (
    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div id="sticky-page-header" className="sticky -top-6 z-[80] bg-[var(--bg-deep)] py-6 -mt-6 -mx-4 px-4 xl:-mx-8 xl:px-8 relative">
        {/* Extend background upward to prevent content leaking above sticky header */}
        <div className="absolute inset-x-0 -top-16 h-16 bg-[var(--bg-deep)]" />
        <PageHeader 
          title="Hasil Produksi"
          description="Laporan dan analisis hasil produksi harian."
        />
      </div>
      
      <HasilProduksiClient />
    </div>
  );
}



