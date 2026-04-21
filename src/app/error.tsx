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
    <div className="min-h-[400px] flex items-center justify-center bg-[var(--bg-deep)] px-4">
      <div className="max-w-md w-full bg-white border-[4px] border-black shadow-[10px_10px_0_0_#000] rounded-none p-8 text-center">
        <div className="w-16 h-16 bg-[var(--accent-primary)] border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] rounded-none flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} strokeWidth={2.5} className="text-white" />
        </div>

        <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-2">
          Terjadi Kesalahan
        </h2>
        
        <p className="text-gray-700 font-bold mb-6 text-sm">
          Halaman ini mengalami masalah. Berikut adalah informasi teknis:
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-black border-[3px] border-black rounded-none p-4 mb-6 text-left overflow-auto max-h-48 shadow-[4px_4px_0_0_#555]">
            <p className="text-xs font-mono text-green-400 whitespace-pre-wrap break-words">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-[var(--accent-primary)] hover:bg-[#ff4444] text-white font-black py-3 px-4 rounded-none border-[3px] border-black transition-all flex items-center justify-center gap-2 shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none uppercase tracking-wide"
          >
            <RefreshCw size={16} strokeWidth={2.5} />
            Coba Muat Ulang
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full border-[3px] border-black bg-[#fde047] hover:bg-[#facc15] text-black font-black py-3 px-4 rounded-none transition-all shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none uppercase tracking-wide"
          >
            Kembali ke Dashboard
          </button>
        </div>

        {process.env.NODE_ENV === 'production' && (
          <p className="text-xs font-bold text-black/50 mt-6 uppercase tracking-wide">
            Jika masalah terus berlanjut, hubungi administrator.
            {error.digest && ` ID: ${error.digest}`}
          </p>
        )}
      </div>
    </div>
  );
}













