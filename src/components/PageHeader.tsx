'use client';

import React from 'react';
import HelpButton from './HelpButton';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  showHelp?: boolean;
  rightElement?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageHeader({ 
  title, 
  description, 
  showHelp = true, 
  rightElement,
  children 
}: PageHeaderProps) {
  return (
    <header className="flex flex-col shrink-0 animate-in fade-in slide-in-from-top-1 duration-500">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 border-l-4 border-green-500 pl-4">
          <h1 className="text-[22px] font-extrabold text-gray-800 tracking-tight leading-none">
            {title}
          </h1>
          {showHelp && <HelpButton />}
        </div>
        {rightElement && (
          <div className="shrink-0">
            {rightElement}
          </div>
        )}
      </div>
      
      {(description || children) && (
        <div className="pl-5 mt-2 flex flex-col gap-2">
          {description && (
            <div className="text-[13px] text-gray-400 font-medium">
              {description}
            </div>
          )}
          {children}
        </div>
      )}
    </header>
  );
}
