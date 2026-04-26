import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden animate-pulse">
      <header className="flex flex-col shrink-0 mb-4 px-2">
        <div className="h-10 w-64 bg-gray-100 rounded-full mb-3"></div>
        <div className="h-4 w-96 bg-gray-50 rounded-full"></div>
      </header>
      
      <div className="flex-1 bg-white border border-gray-100 rounded-lg shadow-sm shadow-green-900/5 overflow-hidden flex flex-col p-8">
        <div className="flex gap-3 mb-8">
          <div className="h-12 w-40 bg-gray-100 rounded-full"></div>
          <div className="h-12 w-40 bg-gray-100 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-5 space-y-6">
            <div className="h-64 bg-gray-50 rounded-lg border border-gray-100"></div>
            <div className="h-32 bg-gray-50 rounded-lg border border-gray-100"></div>
          </div>
          <div className="col-span-7">
            <div className="h-full bg-gray-50 rounded-lg border border-gray-100 min-h-[450px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
















