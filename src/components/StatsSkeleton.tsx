import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm shadow-green-900/5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-50 rounded-lg shrink-0"></div>
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-3 w-20 bg-gray-100 rounded-full"></div>
          <div className="h-8 w-16 bg-gray-100 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = "400px" }: { height?: string }) {
  return (
    <div className={`bg-white border border-gray-100 p-8 rounded-xl shadow-sm shadow-green-900/5 animate-pulse flex flex-col`} style={{ minHeight: height }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-50 rounded-lg"></div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-gray-100 rounded-full"></div>
            <div className="h-3 w-48 bg-gray-50 rounded-full"></div>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full bg-gray-50/50 rounded-xl border border-dashed border-gray-100"></div>
    </div>
  );
}

export function InsightSkeleton() {
  return (
    <div className="bg-white border border-gray-100 p-8 rounded-xl animate-pulse flex flex-col items-center text-center justify-center min-h-[400px]">
      <div className="w-16 h-16 bg-gray-50 rounded-lg mb-6"></div>
      <div className="h-6 w-48 bg-gray-100 rounded-full mb-4"></div>
      <div className="h-4 w-64 bg-gray-50 rounded-full mb-2"></div>
      <div className="h-4 w-56 bg-gray-50 rounded-full mb-8"></div>
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-gray-50 rounded-lg"></div>
        <div className="h-8 w-24 bg-gray-50 rounded-lg"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-green-900/5 overflow-hidden animate-pulse">
      <div className="h-12 bg-gray-50/50 border-b border-gray-50"></div>
      <div className="p-4 space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-lg"></div>
              <div className="flex flex-col gap-2">
                <div className="h-4 w-32 bg-gray-100 rounded-full"></div>
                <div className="h-3 w-20 bg-gray-50 rounded-full"></div>
              </div>
            </div>
            <div className="h-6 w-12 bg-gray-50 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

















