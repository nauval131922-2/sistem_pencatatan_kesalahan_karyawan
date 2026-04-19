'use client';

import React from 'react';

interface ImportInfoProps {
  info?: {
    fileName: string;
    time: string;
  };
  className?: string;
  showPrefix?: boolean;
}

/**
 * Shared component to display file import metadata (filename and update time)
 * consistently across different modules.
 */
export default function ImportInfo({ info, className = '', showPrefix = true }: ImportInfoProps) {
  if (!info) return null;

  return (
    <div className={`flex items-center gap-1.5 text-[12px] font-medium leading-none ${className}`} style={{ color: '#99a1af' }}>
      {showPrefix && <span className="opacity-40">|</span>}
      <div className="flex items-center gap-1.5 transition-colors">
        <span title={info.fileName}>
          {info.fileName}
        </span>
        <span className="opacity-40">&bull;</span>
        <span>Diperbarui {info.time}</span>
      </div>
    </div>
  );
}
