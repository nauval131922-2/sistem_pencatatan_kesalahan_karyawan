import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden p-6 animate-pulse">
      <header className="flex flex-col shrink-0 mb-3">
        <div className="h-8 w-64 bg-gray-200 rounded-lg mb-2"></div>
        <div className="h-4 w-96 bg-gray-100 rounded-md ml-5"></div>
      </header>
      
      <div className="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col p-6">
        <div className="flex gap-4 mb-6">
          <div className="h-10 w-32 bg-gray-100 rounded-lg"></div>
          <div className="h-10 w-32 bg-gray-100 rounded-lg"></div>
        </div>
        
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5 space-y-4">
            <div className="h-64 bg-gray-50 rounded-2xl border border-gray-100"></div>
            <div className="h-12 bg-gray-50 rounded-xl border border-gray-100"></div>
          </div>
          <div className="col-span-7">
            <div className="h-full bg-gray-50 rounded-2xl border border-gray-100 min-h-[400px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
