'use client';

import { HelpCircle } from 'lucide-react';

export default function HelpButton() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('open-manual'));
  };

  return (
    <button
      onClick={handleClick}
      className="p-1.5 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
      title="Buka Panduan"
    >
      <HelpCircle size={18} />
    </button>
  );
}
