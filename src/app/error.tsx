'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';


interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary for Next.js App Router.
 * Catches unhandled errors in server components and client components.
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global Error Boundary caught an error:', error);
    }

    // Optionally report to an error tracking service here
    // e.g., sendToMonitoringService(error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} className="text-red-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Terjadi Kesalahan
        </h2>
        
        <p className="text-gray-600 mb-6">
          Halaman ini mengalami masalah. Berikut adalah informasi teknis:
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left overflow-auto max-h-48">
            <p className="text-xs font-mono text-red-800 whitespace-pre-wrap break-words">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Coba Muat Ulang
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>

        {process.env.NODE_ENV === 'production' && (
          <p className="text-xs text-gray-500 mt-6">
            Jika masalah terus berlanjut, hubungi administrator.
            {error.digest && `\nID Error: ${error.digest}`}
          </p>
        )}
      </div>
    </div>
  );
}
