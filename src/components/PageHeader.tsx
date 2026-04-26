'use client';

import React from 'react';
import { Menu } from 'lucide-react';
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
      <div className="flex items-start justify-between w-full">
        <div className="flex items-start gap-2">
          {/* Custom Hamburger Button (Left of Green Bar) */}
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('sidebar-mobile-toggle'))}
            className="xl:hidden flex flex-col gap-1 p-2 -ml-2 mt-0.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-all shrink-0 group active:scale-95"
            title="Menu"
          >
            <div className="w-5 h-0.5 bg-gray-400 group-hover:bg-green-600 rounded-full transition-all" />
            <div className="w-3 h-0.5 bg-gray-400 group-hover:bg-green-600 rounded-full transition-all" />
            <div className="w-5 h-0.5 bg-gray-400 group-hover:bg-green-600 rounded-full transition-all" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 border-l-4 border-green-500 pl-3">
              <h1 className="text-[22px] font-extrabold text-gray-800 tracking-tight leading-none truncate">
                {title}
              </h1>
              {showHelp && <HelpButton />}
            </div>

            {(description || children) && (
              <div className="pl-4 mt-2 flex flex-col gap-2">
                {description && (
                  <div className="text-sm text-gray-400 font-medium tracking-tight leading-tight max-w-4xl">
                    {description}
                  </div>
                )}
                {children}
              </div>
            )}
          </div>
        </div>
        
        {rightElement && (
          <div className="shrink-0 pt-1">
            {rightElement}
          </div>
        )}
      </div>
    </header>
  );
}
















