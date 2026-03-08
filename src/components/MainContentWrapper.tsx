'use client';

import { useState, useEffect } from "react";
import { usePathname } from 'next/navigation';
import Sidebar from "./Sidebar";
import Header from "./Header";

interface MainContentWrapperProps {
  children: React.ReactNode;
  user: {
    name: string;
    username: string;
    role?: string;
    photo?: string | null;
  } | null;
}

export default function MainContentWrapper({
  children,
  user
}: MainContentWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleToggle = (e: any) => {
      setIsCollapsed(e.detail.isCollapsed);
    };

    window.addEventListener('sidebar-toggle', handleToggle);
    return () => window.removeEventListener('sidebar-toggle', handleToggle);
  }, []);

  const isLoginPage = pathname?.startsWith('/login');

  if (isLoginPage) {
    return (
      <main className="flex-1 w-full min-h-screen bg-slate-50">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar userRole={user?.role} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header user={user} />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar bg-slate-50 px-6 md:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
