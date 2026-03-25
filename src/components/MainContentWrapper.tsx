'use client';

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from "./Sidebar";

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
  const isStaleRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleToggle = (e: any) => {
      setIsCollapsed(e.detail.isCollapsed);
    };

    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
        isStaleRef.current = false;
      } else {
        isStaleRef.current = true;
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sikka_profile_updated' || e.key === 'sikka_data_updated') {
        handleRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isStaleRef.current) {
        handleRefresh();
      }
    };

    window.addEventListener('sidebar-toggle', handleToggle);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleToggle);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  // NO LONGER updating sikka_data_updated on every navigation.
  // Data changes should be the only trigger to avoid heavy load across tabs.


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
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar bg-slate-50 px-6 md:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
