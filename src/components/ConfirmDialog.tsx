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
    alert: 'bg-[#fde047] text-black',
    confirm: 'bg-[#4ade80] text-black',
    success: 'bg-[#4ade80] text-black',
    error: 'bg-[#ff5e5e] text-white',
    danger: 'bg-[#ff5e5e] text-white',
  };

  const btnConfirmStyles: Record<DialogType, string> = {
    alert: 'bg-[#fde047] hover:bg-[#facc15] text-black',
    confirm: 'bg-[var(--accent-primary)] hover:bg-[#ff4444] text-white',
    success: 'bg-[#4ade80] hover:bg-[#22c55e] text-black',
    error: 'bg-[#ff5e5e] hover:bg-[#ef4444] text-white',
    danger: 'bg-[#ff5e5e] hover:bg-[#ef4444] text-white',
  };

  const IconComponent = () => {
    switch (type) {
      case 'alert':
        return <AlertTriangle size={24} strokeWidth={2.5} />;
      case 'success':
        return <CheckCircle size={24} strokeWidth={2.5} />;
      case 'error':
        return <X size={24} strokeWidth={3} />;
      case 'danger':
        return <AlertTriangle size={24} strokeWidth={2.5} />;
      case 'confirm':
      default:
        return <Info size={24} strokeWidth={2.5} />;
    }
  };

  const isConfirmType = type === 'confirm' || type === 'danger';

  return (
    <Portal>
      <div className={`fixed inset-0 w-screen h-screen z-[999999] flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-none"
          onClick={isConfirmType ? onCancel : onConfirm}
        />
        
        {/* Modal Box */}
        <div className={`relative w-full max-w-sm bg-white rounded-none shadow-[10px_10px_0_0_#000] overflow-hidden border-[4px] border-black transform transition-transform duration-200 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
          
          {/* Header Icon & Title */}
          <div className="p-6 pb-2">
            <div className={`w-12 h-12 rounded-none border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] flex items-center justify-center mb-5 ${bgStyles[type]}`}>
              <IconComponent />
            </div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight leading-none mb-2">{title}</h3>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 text-[13px] font-bold text-gray-700 leading-relaxed">
            {message}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-[var(--bg-elevated)] border-t-[4px] border-black flex justify-end gap-3">
            {isConfirmType && onCancel && (
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 font-black text-black hover:bg-[#fde047] bg-white border-[3px] border-black rounded-none shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] transition-all text-sm disabled:opacity-50 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
              >
                {cancelLabel}
              </button>
            )}
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 font-black rounded-none border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all text-sm flex items-center justify-center min-w-[80px] ${btnConfirmStyles[type]} ${!isConfirmType ? 'w-full' : ''} disabled:opacity-70`}
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













