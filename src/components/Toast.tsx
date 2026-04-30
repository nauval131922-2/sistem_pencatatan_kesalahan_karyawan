'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import Portal from './Portal';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string | null;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (message) {
      setIsShowing(true);
      const timer = setTimeout(() => {
        setIsShowing(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message && !isShowing) return null;

  const bgStyles: Record<ToastType, string> = {
    success: 'bg-white border-green-100 text-green-600 shadow-green-900/5',
    error: 'bg-white border-red-100 text-red-600 shadow-red-900/5',
    info: 'bg-white border-blue-100 text-blue-600 shadow-blue-900/5',
    warning: 'bg-white border-amber-100 text-amber-600 shadow-amber-900/5',
  };

  const IconComponent = () => {
    switch (type) {
      case 'success': return <CheckCircle size={18} className="text-green-500" />;
      case 'error': return <AlertCircle size={18} className="text-red-500" />;
      case 'info': return <Info size={18} className="text-blue-500" />;
      case 'warning': return <AlertCircle size={18} className="text-amber-500" />;
      default: return <Info size={18} />;
    }
  };

  return (
    <Portal>
      <div className="fixed top-6 right-6 z-[9999999] pointer-events-none">
        <div 
          className={`
            pointer-events-auto
            flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white shadow-xl
            transition-all duration-300 ease-out
            ${isShowing ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}
            ${bgStyles[type]}
          `}
          style={{ minWidth: '300px' }}
        >
          <div className="shrink-0">
            <IconComponent />
          </div>
          <div className="flex-1 text-[13px] font-bold tracking-tight pr-4">
            {message}
          </div>
          <button 
            onClick={() => {
              setIsShowing(false);
              setTimeout(onClose, 300);
            }}
            className="shrink-0 p-1 hover:bg-gray-50 rounded-lg transition-colors text-gray-300 hover:text-gray-500"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </Portal>
  );
}
