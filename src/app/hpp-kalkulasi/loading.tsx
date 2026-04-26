export default function Loading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-pulse">
      <header className="flex flex-col shrink-0 px-1">
        <div className="h-10 w-72 bg-gray-100 rounded-full mb-3"></div>
        <div className="h-4 w-96 bg-gray-50 rounded-full"></div>
      </header>
      
      <div className="shrink-0">
        <div className="h-16 bg-white border border-gray-100 rounded-lg shadow-sm shadow-green-900/5"></div>
      </div>

      <div className="flex-1 flex flex-col gap-5">
        <div className="h-14 w-full bg-white border border-gray-100 rounded-lg shadow-sm"></div>
        <div className="flex-1 bg-white border border-gray-100 rounded-lg shadow-sm shadow-green-900/5 overflow-hidden">
          <div className="h-12 bg-gray-50/50 border-b border-gray-50"></div>
          <div className="p-6 space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-50"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 bg-gray-100 rounded-full"></div>
                  <div className="h-3 w-1/3 bg-gray-50 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



