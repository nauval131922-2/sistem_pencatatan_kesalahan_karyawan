import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-pulse">
      <header className="flex flex-col shrink-0">
        <div className="h-9 w-72 bg-black rounded-none mb-3 opacity-20"></div>
        <div className="h-5 w-[500px] bg-black rounded-none ml-2 opacity-10"></div>
      </header>
      
      <div className="shrink-0">
        <div className="h-16 bg-white border-[3px] border-black rounded-none shadow-[2.5px_2.5px_0_0_#000] opacity-30"></div>
      </div>

      <div className="flex-1 flex flex-col gap-5">
        <div className="h-12 w-full bg-white border-[3px] border-black rounded-none shadow-[2.5px_2.5px_0_0_#000] opacity-30"></div>
        <div className="flex-1 bg-white border-[3px] border-black rounded-none shadow-[2.5px_2.5px_0_0_#000] overflow-hidden opacity-40">
          <div className="h-12 bg-[#fde047] border-b-[3px] border-black"></div>
          <div className="p-5 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 bg-black/5 border-b-[2px] border-black/10"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}













