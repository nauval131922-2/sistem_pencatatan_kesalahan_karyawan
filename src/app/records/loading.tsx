import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden animate-pulse">
      <header className="flex flex-col shrink-0 mb-2">
        <div className="h-8 w-64 bg-black/20 rounded-none mb-2"></div>
        <div className="h-4 w-96 bg-black/10 rounded-none ml-2"></div>
      </header>
      
      <div className="flex-1 bg-white border-[3px] border-black/30 rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,0.15)] overflow-hidden flex flex-col p-6">
        <div className="flex gap-3 mb-6">
          <div className="h-10 w-32 bg-black/10 rounded-none border-[2px] border-black/20"></div>
          <div className="h-10 w-32 bg-black/10 rounded-none border-[2px] border-black/20"></div>
        </div>
        
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5 space-y-4">
            <div className="h-64 bg-[#fde047]/30 rounded-none border-[3px] border-black/20"></div>
            <div className="h-12 bg-black/5 rounded-none border-[2px] border-black/15"></div>
          </div>
          <div className="col-span-7">
            <div className="h-full bg-[#fde047]/20 rounded-none border-[3px] border-black/20 min-h-[400px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}





