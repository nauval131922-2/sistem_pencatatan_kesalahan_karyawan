import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-pulse">
      <header className="flex flex-col shrink-0">
        <div className="h-8 w-64 bg-black/20 rounded-none mb-2"></div>
        <div className="h-4 w-96 bg-black/10 rounded-none ml-2"></div>
      </header>
      
      <div className="shrink-0">
        <div className="h-16 bg-white border-[3px] border-black/30 rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,0.15)]"></div>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <div className="h-10 w-full bg-black/10 rounded-none border-[3px] border-black/20"></div>
        <div className="flex-1 bg-white border-[3px] border-black/30 rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="h-12 bg-[#fde047]/50 border-b-[3px] border-black/20"></div>
          <div className="p-4 space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-9 bg-black/5 rounded-none border-b-2 border-black/10"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}





