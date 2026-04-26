'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Loader2 } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Global Error Boundary caught an error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-white border border-gray-100 shadow-sm shadow-rose-900/5 rounded-lg overflow-hidden">
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mx-auto mb-8 shadow-sm shadow-rose-900/5 transform rotate-3 border border-rose-100">
            <AlertTriangle size={40} />
          </div>

          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-3">
            Terjadi Kesalahan
          </h2>
          
          <p className="text-slate-500 font-medium text-sm mb-10 leading-relaxed">
            Halaman ini mengalami masalah teknis yang tidak terduga. Silakan coba muat ulang atau kembali ke beranda.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-slate-900 rounded-lg p-5 mb-10 text-left overflow-auto max-h-48 shadow-inner border border-slate-800">
              <p className="text-[10px] font-mono text-rose-400 whitespace-pre-wrap break-words leading-relaxed">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
                {error.digest && `\n\nDigest: ${error.digest}`}
              </p>
            </div>
          )}

          <div className="grid gap-4">
            <button
              onClick={reset}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-3 shadow-sm shadow-emerald-900/10 uppercase tracking-widest text-[13px] ring-4 ring-emerald-500/0 hover:ring-emerald-500/5"
            >
              <RefreshCw size={18} />
              Coba Muat Ulang
            </button>

            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full h-14 bg-white hover:bg-gray-50 text-gray-600 font-bold rounded-lg border border-gray-200 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[13px]"
            >
              <Home size={18} />
              Ke Dashboard
            </button>
          </div>

          <p className="mt-10 text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">
            SINTAK • Error
          </p>
        </div>
      </div>
    </div>
  );
}



