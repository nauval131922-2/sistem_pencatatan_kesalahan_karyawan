'use client';

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

export default function MainContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleToggle = (e: any) => {
      setIsCollapsed(e.detail.isCollapsed);
    };

    window.addEventListener('sidebar-toggle', handleToggle);
    return () => window.removeEventListener('sidebar-toggle', handleToggle);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out p-6 md:p-10 ${
          isCollapsed ? 'ml-[80px]' : 'ml-[210px]'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
