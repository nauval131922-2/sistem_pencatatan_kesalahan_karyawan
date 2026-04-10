'use client';

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Sidebar from "./Sidebar";
import { ShieldAlert, X } from 'lucide-react';
import type { PermissionMap } from '@/lib/permissions-constants';

interface MainContentWrapperProps {
  children: React.ReactNode;
  user: {
    name: string;
    username: string;
    role?: string;
    photo?: string | null;
  } | null;
  permissions?: PermissionMap;
}

export default function MainContentWrapper({
  children,
  user,
  permissions = {},
}: MainContentWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isStaleRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync initial state from localStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar_expanded');
      if (saved !== null) {
        // localStorage stores 'sidebar_expanded', which is the opposite of 'isCollapsed'
        setIsCollapsed(!JSON.parse(saved));
      }
    }
  }, []);

  useEffect(() => {
    const handleToggle = (e: any) => {
      // Removed isMounted gating to ensure hydration match
      setIsCollapsed(e.detail.isCollapsed);
    };

    const handleRefresh = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        router.refresh();
        isStaleRef.current = false;
      } else {
        isStaleRef.current = true;
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_profile_updated' || e.key === 'sintak_data_updated') {
        handleRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && isStaleRef.current) {
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

  // Stable pathname-based check
  const isLoginPage = pathname ? pathname.startsWith('/login') : false;

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar user={user} permissions={permissions} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Changed from main to div with standardized classes to reduce hydration mismatch risk */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar bg-slate-50 px-6 md:px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}






