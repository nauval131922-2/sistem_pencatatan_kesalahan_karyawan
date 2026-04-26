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
    <div className={`flex items-center gap-2 text-[11px] font-bold leading-none text-black/40 ${className}`}>
      {showPrefix && <span className="text-black/20 font-light">|</span>}
      <div className="flex items-center gap-2">
        <span title={info.fileName} className="text-black/60 truncate max-w-[200px]">
          {info.fileName}
        </span>
        <span className="text-black/20">&bull;</span>
        <span>{info.time}</span>
      </div>
    </div>
  );
}











