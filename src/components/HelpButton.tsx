'use client';

import { HelpCircle } from 'lucide-react';

export default function HelpButton({ className = "" }: { className?: string }) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('open-manual'));
  };

  return (
    <button
      onClick={handleClick}
      className={`text-slate-300 hover:text-slate-400 transition-colors inline-flex items-center justify-center ${className}`}
      title="Buka Panduan"
    >
      <HelpCircle size={16} className="cursor-pointer" />
    </button>
  );
}
