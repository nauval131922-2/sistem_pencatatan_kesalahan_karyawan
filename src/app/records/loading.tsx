import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden animate-pulse">
      <header className="flex flex-col shrink-0 mb-4">
        <div className="h-9 w-72 bg-black rounded-none mb-3 opacity-20"></div>
        <div className="h-5 w-[500px] bg-black rounded-none ml-2 opacity-10"></div>
      </header>
      
      <div className="flex-1 bg-white border-[3px] border-black rounded-none shadow-[6px_6px_0_0_#000] overflow-hidden flex flex-col p-8 opacity-40">
        <div className="flex gap-4 mb-8">
          <div className="h-12 w-40 bg-[#fde047] border-[3px] border-black rounded-none shadow-[3px_3px_0_0_#000]"></div>
          <div className="h-12 w-40 bg-white border-[3px] border-black rounded-none shadow-[3px_3px_0_0_#000]"></div>
        </div>
        
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-5 space-y-6">
            <div className="h-72 bg-white border-[3px] border-black rounded-none shadow-[4px_4px_0_0_#000]"></div>
            <div className="h-14 bg-white border-[3px] border-black rounded-none shadow-[4px_4px_0_0_#000]"></div>
          </div>
          <div className="col-span-7">
            <div className="h-full bg-white border-[3px] border-black rounded-none shadow-[4px_4px_0_0_#000] min-h-[400px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}





