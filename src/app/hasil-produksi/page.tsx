import HasilProduksiClient from './HasilProduksiClient';
import PageHeader from "@/components/PageHeader";

export const metadata = {
  title: "SINTAK | Hasil Produksi",
  description: "Laporan hasil produksi harian.",
};

export default function HasilProduksiPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader 
        title="Hasil Produksi"
        description="Laporan dan analisis hasil produksi harian."
      />
      
      <HasilProduksiClient />
    </div>
  );
}



