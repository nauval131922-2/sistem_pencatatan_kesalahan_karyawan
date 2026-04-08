import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 p-6 animate-pulse">
      <header className="flex flex-col shrink-0">
        <div className="h-8 w-64 bg-gray-200 rounded-[8px] mb-2"></div>
        <div className="h-4 w-96 bg-gray-100 rounded-md ml-5"></div>
        <div className="mt-3 flex gap-4 ml-5">
           <div className="h-8 w-32 bg-gray-100 rounded-md"></div>
           <div className="h-8 w-40 bg-gray-100 rounded-md"></div>
        </div>
      </header>
      
      <div className="shrink-0">
        <div className="h-16 bg-white border border-gray-100 rounded-[8px] shadow-sm"></div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="h-10 w-full bg-gray-100 rounded-[8px]"></div>
        <div className="flex-1 bg-white border border-gray-100 rounded-[8px] shadow-sm overflow-hidden">
          <div className="h-10 bg-gray-50 border-b border-gray-100"></div>
          <div className="p-4 space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-50 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}





