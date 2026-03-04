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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main 
        className="flex-1 min-w-0 min-h-0 transition-all duration-300 ease-in-out flex flex-col p-4 md:p-6 h-full overflow-hidden"
      >
        {children}
      </main>
    </div>
  );
}
