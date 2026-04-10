"use client";

import PageHeader from "@/components/PageHeader";
import { Hammer } from "lucide-react";

export default function DashboardManufakturPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Dashboard Manufaktur"
        description="Ringkasan operasional dan progres produksi harian."
      />

      <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm">
        <div className="w-16 h-16 bg-blue-50 rounded-[8px] flex items-center justify-center mb-6">
          <Hammer size={32} className="text-blue-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Sedang Dikembangkan</h3>
        <p className="text-sm text-gray-400 mt-2 max-w-sm text-center font-medium leading-relaxed px-6">
          Halaman ini sedang dalam proses sinkronisasi dengan data manufaktur
          Digit. Segera hadir untuk Anda.
        </p>
      </div>
    </div>
  );
}
