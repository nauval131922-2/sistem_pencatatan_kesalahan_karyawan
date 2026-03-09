import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
        <p className="text-sm font-bold text-gray-500 animate-pulse">Menghubungkan...</p>
      </div>
    </div>
  );
}
