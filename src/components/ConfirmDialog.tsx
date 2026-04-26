'use client';

import { AlertTriangle, CheckCircle, Info, X, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Portal from './Portal';

export type DialogType = 'alert' | 'confirm' | 'success' | 'error' | 'danger';

interface ConfirmDialogProps {
  isOpen: boolean;
  type: DialogType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function ConfirmDialog({
  isOpen,
  type,
  title,
  message,
  confirmLabel = 'Ya',
  cancelLabel = 'Batal',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      setTimeout(() => setShow(false), 200); // Wait for transition
    }
  }, [isOpen]);

  if (!isOpen && !show) return null;

  const bgStyles: Record<DialogType, string> = {
    alert: 'bg-amber-50 text-amber-600',
    confirm: 'bg-green-50 text-green-600',
    success: 'bg-green-50 text-green-600',
    error: 'bg-red-50 text-red-600',
    danger: 'bg-red-50 text-red-600',
  };

  const btnConfirmStyles: Record<DialogType, string> = {
    alert: 'bg-amber-500 hover:bg-amber-600 text-white',
    confirm: 'bg-green-600 hover:bg-green-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    error: 'bg-red-600 hover:bg-red-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const IconComponent = () => {
    switch (type) {
      case 'alert':
        return <AlertTriangle size={24} />;
      case 'success':
        return <CheckCircle size={24} />;
      case 'error':
        return <X size={24} />;
      case 'danger':
        return <AlertTriangle size={24} />;
      case 'confirm':
      default:
        return <Info size={24} />;
    }
  };

  const isConfirmType = type === 'confirm' || type === 'danger';

  return (
    <Portal>
      <div className={`fixed inset-0 w-screen h-screen z-[999999] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={isConfirmType ? onCancel : onConfirm}
        />
        
        {/* Modal Box */}
        <div className={`relative w-full max-w-sm bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
          
          {/* Header Icon & Title */}
          <div className="p-8 pb-2 flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-5 ${bgStyles[type]}`}>
              <IconComponent />
            </div>
            <h3 className="text-xl font-bold text-gray-800 tracking-tight leading-none mb-2">{title}</h3>
          </div>

          {/* Content */}
          <div className="px-8 pb-8 text-[14px] font-medium text-gray-500 leading-relaxed text-center">
            {message}
          </div>

          {/* Actions */}
          <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex justify-center gap-3">
            {isConfirmType && onCancel && (
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-3 font-bold text-gray-500 hover:bg-gray-100 bg-white border border-gray-200 rounded-lg transition-all text-sm disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            )}
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-3 font-bold rounded-lg transition-all text-sm flex items-center justify-center min-w-[100px] shadow-sm shadow-green-900/5 ${btnConfirmStyles[type]} disabled:opacity-70`}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                !isConfirmType ? 'Tutup' : confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
















