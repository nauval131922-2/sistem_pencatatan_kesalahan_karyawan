'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  User, 
  Users, 
  Package, 
  ChevronLeft, 
  ChevronRight, 
  Box, 
  Calculator, 
  BarChart2, 
  BarChart3,
  LogOut, 
  Settings,
  ShoppingCart,
  UserCog,
  Search,
  ShieldCheck,
  TrendingDown,
  ClipboardCheck,
  Monitor,
  FileText,
  FileCheck,
  ClipboardList,
  Truck
} from 'lucide-react';
import Image from 'next/image';
import logoPic from '../../public/icon.png';

interface SidebarProps {
  user: {
    name: string;
    username: string;
    role?: string;
    photo?: string | null;
  } | null;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 480;
const COLLAPSED_WIDTH = 64;

export default function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedWidth, setExpandedWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const isExpanded = !isCollapsed || isHovered;
  const currentWidth = isExpanded ? expandedWidth : COLLAPSED_WIDTH;

  useEffect(() => {
    setIsMounted(true);
    const savedCollapsed = localStorage.getItem('sidebar_collapsed');
    const savedWidth = localStorage.getItem('sidebar_expanded_width');
    
    if (savedCollapsed !== null) {
      setIsCollapsed(savedCollapsed === 'true');
    }
    if (savedWidth !== null) {
      setExpandedWidth(parseInt(savedWidth));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sidebar_collapsed', String(isCollapsed));
      const event = new CustomEvent('sidebar-toggle', { detail: { isCollapsed, width: currentWidth } });
      window.dispatchEvent(event);
    }
  }, [isCollapsed, currentWidth, isMounted]);

  // Handle Resizing
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    localStorage.setItem('sidebar_expanded_width', String(expandedWidth));
  }, [expandedWidth]);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && isExpanded) {
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setExpandedWidth(newWidth);
      }
    }
  }, [isResizing, isExpanded]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const { logout } = await import('@/lib/auth');
    await logout();
    window.location.href = '/login';
  };

  const checkIsActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const navItemClasses = (href: string) => {
    const isActive = checkIsActive(href);
    return `
      group flex items-center gap-3 px-3 h-9 rounded-lg transition-all text-[12.5px] font-semibold
      ${!isExpanded ? 'justify-center px-0 w-9 mx-auto' : 'w-full'}
      ${isActive 
        ? 'bg-green-600 text-white shadow-md' 
        : 'text-gray-500 hover:bg-green-50 hover:text-green-600'}
    `;
  };

  const SectionLabel = ({ label }: { label: string }) => {
    if (!isExpanded) return <div className="h-px bg-gray-100 mx-2 my-4" />;
    return (
      <h2 className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-4 mb-2 truncate">
        {label}
      </h2>
    );
  };

  return (
    <aside 
      ref={sidebarRef}
      onMouseEnter={() => isCollapsed && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: currentWidth }}
      className={`h-screen bg-white border-r border-gray-100 shrink-0 flex flex-col z-30 relative ${
        isResizing ? '' : 'transition-[width] duration-300 ease-in-out'
      }`}
    >
      {/* Resizer Handle */}
      {isExpanded && (
        <div 
          onMouseDown={startResizing}
          className={`absolute -right-1.5 top-0 w-3 h-full cursor-col-resize z-30 group`}
        >
          <div className={`w-0.5 h-full mx-auto transition-colors ${isResizing ? 'bg-green-500' : 'group-hover:bg-green-300'}`} />
        </div>
      )}

      {/* Header */}
      <div className="p-4 pb-2 relative min-h-[64px]">
        <div className={`flex items-center ${!isExpanded ? 'justify-center' : 'justify-between'}`}>
          {isExpanded ? (
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-[#16a34a]">
                  <Image src={logoPic} alt="SINTAK" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0 flex flex-col">
                  <h1 className="text-[14px] font-black text-[#1e293b] tracking-tight leading-none uppercase">SINTAK</h1>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-wide truncate">PT. Buya Barokah</p>
                </div>
              </div>
              <div className="mt-4 px-3.5 py-1 rounded-[4px] border border-green-200 inline-flex w-fit bg-white">
                <span className="text-[9px] font-black text-[#008d4c] tracking-wider uppercase">Div. Percetakan</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg overflow-hidden mx-auto bg-[#16a34a]">
               <Image src={logoPic} alt="SINTAK" className="w-full h-full object-contain" />
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => {
          setIsCollapsed(!isCollapsed);
          setIsHovered(false);
        }}
        className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-green-600 shadow-sm z-50 transition-opacity ${
          !isExpanded && isCollapsed ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {isCollapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
      </button>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 custom-scrollbar">
        {/* DASHBOARD SECTION */}
        <SectionLabel label="Dashboard" />
        <div className="space-y-1">
          <Link href="/dashboard-kesalahan-karyawan" className={navItemClasses('/dashboard-kesalahan-karyawan')} title={!isExpanded ? "Dashboard Kesalahan Karyawan" : ""}>
            <TrendingDown size={18} />
            {isExpanded && <span className="truncate">Kesalahan Karyawan</span>}
          </Link>
          <Link href="/dashboard-manufaktur" className={navItemClasses('/dashboard-manufaktur')} title={!isExpanded ? "Dashboard Tracking Manufaktur" : ""}>
            <Monitor size={18} />
            {isExpanded && <span className="truncate">Tracking Manufaktur</span>}
          </Link>
        </div>

        {/* DATA DIGIT */}
        <SectionLabel label="Data Digit" />
        <div className="space-y-1">
          <Link href="/sph-out" className={navItemClasses('/sph-out')} title={!isExpanded ? "SPH Out" : ""}>
            <FileText size={18} />
            {isExpanded && <span className="truncate">SPH Out</span>}
          </Link>
          <Link href="/sph-in" className={navItemClasses('/sph-in')} title={!isExpanded ? "SPH In" : ""}>
            <FileText size={18} />
            {isExpanded && <span className="truncate">SPH In</span>}
          </Link>
          <Link href="/spph-out" className={navItemClasses('/spph-out')} title={!isExpanded ? "SPPH Out" : ""}>
            <FileText size={18} />
            {isExpanded && <span className="truncate">SPPH Out</span>}
          </Link>
          <Link href="/sales-orders" className={navItemClasses('/sales-orders')} title={!isExpanded ? "Sales Order" : ""}>
            <FileCheck size={18} />
            {isExpanded && <span className="truncate">Sales Order</span>}
          </Link>
          <Link href="/orders" className={navItemClasses('/orders')} title={!isExpanded ? "Order Produksi" : ""}>
            <ClipboardList size={18} />
            {isExpanded && <span className="truncate">Order Produksi</span>}
          </Link>
          <Link href="/purchase-orders" className={navItemClasses('/purchase-orders')} title={!isExpanded ? "Purchase Order" : ""}>
            <ShoppingCart size={18} />
            {isExpanded && <span className="truncate">Purchase Order</span>}
          </Link>
          <Link href="/bom" className={navItemClasses('/bom')} title={!isExpanded ? "Bill of Material" : ""}>
            <Calculator size={18} />
            {isExpanded && <span className="truncate">Bill of Material</span>}
          </Link>
          <Link href="/pr" className={navItemClasses('/pr')} title={!isExpanded ? "Purchase Request" : ""}>
            <FileText size={18} />
            {isExpanded && <span className="truncate">Purchase Request</span>}
          </Link>
          <Link href="/bahan-baku" className={navItemClasses('/bahan-baku')} title={!isExpanded ? "Bahan Baku" : ""}>
            <Package size={18} />
            {isExpanded && <span className="truncate">Bahan Baku</span>}
          </Link>
          <Link href="/barang-jadi" className={navItemClasses('/barang-jadi')} title={!isExpanded ? "Barang Jadi" : ""}>
            <Box size={18} />
            {isExpanded && <span className="truncate">Barang Jadi</span>}
          </Link>
          <Link href="/sales" className={navItemClasses('/sales')} title={!isExpanded ? "Laporan Penjualan" : ""}>
            <BarChart3 size={18} />
            {isExpanded && <span className="truncate">Laporan Penjualan</span>}
          </Link>
        </div>

        {/* DATA MASTER UMUM */}
        <SectionLabel label="Data Master Umum" />
        <div className="space-y-1">
          <Link href="/employees" className={navItemClasses('/employees')} title={!isExpanded ? "Karyawan" : ""}>
            <Users size={18} />
            {isExpanded && <span className="truncate">Karyawan</span>}
          </Link>
        </div>

        {/* DATA MASTER KESALAHAN */}
        <SectionLabel label="Data Master Kesalahan Karyawan" />
        <div className="space-y-1">
          <Link href="/hpp-kalkulasi" className={navItemClasses('/hpp-kalkulasi')} title={!isExpanded ? "HPP Kalkulasi" : ""}>
            <Calculator size={18} />
            {isExpanded && <span className="truncate">HPP Kalkulasi</span>}
          </Link>
        </div>

        {/* KESALAHAN KARYAWAN */}
        <SectionLabel label="Kesalahan Karyawan" />
        <div className="space-y-1">
          <Link href="/stats" className={navItemClasses('/stats')} title={!isExpanded ? "Statistik Performa" : ""}>
            <BarChart2 size={18} />
            {isExpanded && <span className="truncate">Statistik Performa</span>}
          </Link>
          <Link href="/records" className={navItemClasses('/records')} title={!isExpanded ? "Catat Kesalahan" : ""}>
            <ClipboardCheck size={18} />
            {isExpanded && <span className="truncate">Catat Kesalahan</span>}
          </Link>
        </div>

        {/* TRACKING MANUFAKTUR */}
        <SectionLabel label="Tracking Manufaktur" />
        <div className="space-y-1">
          <Link href="/tracking-manufaktur" className={navItemClasses('/tracking-manufaktur')} title={!isExpanded ? "Tracking Manufaktur" : ""}>
            <Search size={18} />
            {isExpanded && <span className="truncate">Tracking Manufaktur</span>}
          </Link>
        </div>

        {/* SISTEM */}
        {user?.role === 'Super Admin' && (
          <>
            <SectionLabel label="Sistem" />
            <div className="space-y-1">
              <Link href="/users" className={navItemClasses('/users')} title={!isExpanded ? "Kelola User" : ""}>
                <UserCog size={18} />
                {isExpanded && <span className="truncate">Kelola User</span>}
              </Link>
              <Link href="/roles" className={navItemClasses('/roles')} title={!isExpanded ? "Hak Akses" : ""}>
                <ShieldCheck size={18} />
                {isExpanded && <span className="truncate">Hak Akses</span>}
              </Link>
            </div>
          </>
        )}
      </nav>

      {/* User Focus Footer */}
      <div className={`mt-auto border-t border-gray-100 p-3 bg-gray-50/50 relative z-10`} ref={profileRef}>
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-white hover:shadow-sm ${
                isProfileOpen ? 'bg-white shadow-sm ring-1 ring-black/5' : ''
              } ${!isExpanded ? 'justify-center p-1' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center overflow-hidden shrink-0 border border-green-200">
                {user.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-green-600" />
                )}
              </div>
              {isExpanded && (
                <div className="flex flex-col min-w-0 text-left">
                  <p className="text-[12px] font-bold text-gray-700 truncate leading-none">{user.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 truncate">{user.role}</p>
                </div>
              )}
            </button>

            {isProfileOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 animate-in fade-in slide-in-from-bottom-2 z-50">
                <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Settings size={14} />
                  <span>Pengaturan Profil</span>
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut size={14} />
                  <span>Keluar Sistem</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
        )}
      </div>
    </aside>
  );
}
