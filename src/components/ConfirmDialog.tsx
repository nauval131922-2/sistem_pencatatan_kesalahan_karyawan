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
    alert: 'bg-amber-50 text-amber-600 border-amber-200',
    confirm: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    error: 'bg-red-50 text-red-600 border-red-200',
    danger: 'bg-red-50 text-red-600 border-red-200',
  };

  const btnConfirmStyles: Record<DialogType, string> = {
    alert: 'bg-amber-500 hover:bg-amber-600 text-white',
    confirm: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    error: 'bg-red-600 hover:bg-red-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const IconComponent = () => {
    switch (type) {
      case 'alert':
        return <AlertTriangle size={24} className="text-amber-500" />;
      case 'success':
        return <CheckCircle size={24} className="text-emerald-500" />;
      case 'error':
        return <X size={24} className="text-red-500" />;
      case 'danger':
        return <AlertTriangle size={24} className="text-red-500" />;
      case 'confirm':
      default:
        return <Info size={24} className="text-emerald-500" />;
    }
  };

  const isConfirmType = type === 'confirm' || type === 'danger';

  return (
    <Portal>
      <div className={`fixed inset-0 w-screen h-screen z-[999999] flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={isConfirmType ? onCancel : onConfirm}
        />
        
        {/* Modal Box */}
        <div className={`relative w-full max-w-sm bg-white rounded-[8px] shadow-xl overflow-hidden border border-slate-100 transform transition-transform duration-200 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
          
          {/* Header Icon & Title */}
          <div className="p-6 pb-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${bgStyles[type]}`}>
              <IconComponent />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 text-sm text-slate-500">
            {message}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            {isConfirmType && onCancel && (
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200/50 bg-white border border-slate-200 rounded-[8px] transition-colors text-sm disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            )}
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 font-medium rounded-[8px] transition-colors text-sm shadow-sm flex items-center justify-center min-w-[80px] ${btnConfirmStyles[type]} ${!isConfirmType ? 'w-full' : ''} disabled:opacity-70`}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
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





