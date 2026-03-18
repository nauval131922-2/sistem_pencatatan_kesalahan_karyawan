'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  User, 
  Users, 
  AlertCircle, 
  Package, 
  ChevronLeft, 
  ChevronRight, 
  Box, 
  Star, 
  Calculator, 
  BarChart2, 
  ShieldCheck, 
  LogOut, 
  Settings,
  ShoppingCart,
  UserCog
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

export default function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);

  // Effectively expanded if NOT collapsed OR being hovered
  const isExpanded = !isCollapsed || isHovered;

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedCollapsed = localStorage.getItem('sidebar_collapsed');
    if (savedCollapsed !== null) {
      setIsCollapsed(savedCollapsed === 'true');
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sidebar_collapsed', String(isCollapsed));
      const event = new CustomEvent('sidebar-toggle', { detail: { isCollapsed } });
      window.dispatchEvent(event);
    }
  }, [isCollapsed, isMounted]);

  // Click outside to close profile dropdown
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
    return pathname.startsWith(href);
  };

  const navItemClasses = (href: string) => {
    const isActive = checkIsActive(href);
    return `
      group flex items-center gap-3 px-3 h-9 rounded-md transition-all text-[13px] font-medium
      ${!isExpanded ? 'justify-center px-0 w-9 mx-auto' : 'w-full'}
      ${isActive 
        ? 'bg-[#16a34a] text-white shadow-sm' 
        : 'text-gray-500 hover:bg-[#f0fdf4] hover:text-[#16a34a]'}
    `;
  };

  const iconSize = 16;

  return (
    <aside 
      onMouseEnter={() => isCollapsed && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`h-screen bg-white border-r border-gray-100 shrink-0 flex flex-col z-30 transition-all duration-300 ease-in-out ${
        !isExpanded ? 'w-16' : 'w-[220px]'
      }`}
    >
      {/* Header Section */}
      <div className={`p-4 relative ${!isExpanded ? 'text-center' : ''}`}>
        <div className={`flex items-center ${!isExpanded ? 'justify-center' : 'justify-between'}`}>
          {isExpanded ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm ring-1 ring-black/5 shrink-0">
                <Image src={logoPic} alt="SIKKA" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-gray-800 tracking-tight leading-none truncate">SIKKA</h1>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5 whitespace-nowrap truncate">PT. Buya Barokah</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm ring-1 ring-black/5 mx-auto">
               <Image src={logoPic} alt="SIKKA" className="w-full h-full object-contain" />
            </div>
          )}
          <button 
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              setIsHovered(false); // Reset hover state when toggling
            }}
            className={`absolute -right-3 top-7 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-green-600 shadow-sm z-10 transition-colors ${
              !isExpanded && isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {isCollapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
          </button>
        </div>
        
        {isExpanded && (
          <div className="mt-4 animate-in fade-in duration-300">
            <span className="inline-block text-[9px] font-bold text-[#16a34a] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#16a34a]/30 bg-transparent">
              Div. Percetakan
            </span>
          </div>
        )}
      </div>

      {/* Navigation section */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden pt-2 px-3 space-y-6 custom-scrollbar">
        {/* Main Section */}
        <div className="space-y-1">
          <Link href="/" className={navItemClasses('/')} title={!isExpanded ? "Dashboard" : undefined}>
            <LayoutDashboard size={iconSize} className="shrink-0" />
            {isExpanded && <span className="truncate">Dashboard</span>}
          </Link>
          <Link href="/stats" className={navItemClasses('/stats')} title={!isExpanded ? "Statistik Performa" : undefined}>
            <BarChart2 size={iconSize} className="shrink-0" />
            {isExpanded && <span className="truncate">Statistik Performa</span>}
          </Link>
        </div>

        {/* Data Master Section */}
        <div className="space-y-1">
          {!isExpanded ? (
             <div className="h-px bg-gray-100 mx-2 my-4" />
          ) : (
            <h2 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-[0.05em] mb-2 truncate">Data Master</h2>
          )}
          <div className="space-y-1">
            <Link href="/employees" className={navItemClasses('/employees')} title={!isExpanded ? "Karyawan" : undefined}>
              <Users size={iconSize} className="shrink-0" />
              {isExpanded && <span className="truncate">Karyawan</span>}
            </Link>
            <Link href="/orders" className={navItemClasses('/orders')} title={!isExpanded ? "Order Produksi" : undefined}>
              <ShoppingCart size={iconSize} className="shrink-0" />
              {isExpanded && <span className="truncate">Order Produksi</span>}
            </Link>
            <Link href="/bahan-baku" className={navItemClasses('/bahan-baku')} title={!isExpanded ? "Bahan Baku" : undefined}>
              <Package size={iconSize} className="shrink-0" />
              {isExpanded && <span className="truncate">Bahan Baku</span>}
            </Link>
            <Link href="/barang-jadi" className={navItemClasses('/barang-jadi')} title={!isExpanded ? "Barang Jadi" : undefined}>
              <Box size={iconSize} className="shrink-0" />
              {isExpanded && <span className="truncate">Barang Jadi</span>}
            </Link>
            <Link href="/sales" className={navItemClasses('/sales')} title={!isExpanded ? "Laporan Penjualan" : undefined}>
              <BarChart2 size={iconSize} className="shrink-0" />
              {isExpanded && <span className="truncate">Laporan Penjualan</span>}
            </Link>
            <Link href="/hpp-kalkulasi" className={navItemClasses('/hpp-kalkulasi')} title={!isExpanded ? "HPP Kalkulasi" : undefined}>
              <Calculator size={iconSize} className="shrink-0" />
              {isExpanded && <span className="truncate">HPP Kalkulasi</span>}
            </Link>
          </div>
        </div>

        {/* System & Records Section */}
        <div className="space-y-1">
          <div className="h-px bg-gray-100 mx-2 my-4" />
          
          <Link href="/records" className={navItemClasses('/records')} title={!isExpanded ? "Catat Kesalahan" : undefined}>
            <AlertCircle size={iconSize} className="shrink-0" />
            {isExpanded && <span className="truncate">Catat Kesalahan</span>}
          </Link>

          {user?.role === 'Super Admin' && (
            <>
              {isExpanded && (
                <h2 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-[0.05em] mt-4 mb-2 truncate">Sistem</h2>
              )}
              <Link href="/users" className={navItemClasses('/users')} title={!isExpanded ? "Kelola User" : undefined}>
                <UserCog size={iconSize} className="shrink-0" />
                {isExpanded && <span className="truncate">Kelola User</span>}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Footer / User Profile Section */}
      <div className={`mt-auto border-t border-gray-100 p-3 relative bg-gray-50/50 ${!isExpanded ? 'px-2' : ''}`} ref={profileRef}>
        {user ? (
          <>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`w-full flex items-center gap-2.5 p-1.5 rounded-lg transition-all hover:bg-gray-100 ${
                isProfileOpen ? 'bg-white shadow-sm ring-1 ring-black/5' : ''
              } ${!isExpanded ? 'justify-center' : ''}`}
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
                <div className="flex flex-col min-w-0 text-left animate-in fade-in duration-300">
                  <p className="text-[13px] font-bold text-gray-700 truncate leading-tight">{user.name}</p>
                  <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">{user.role || 'User'}</p>
                </div>
              )}
            </button>

            {isProfileOpen && (
              <div 
                className={`absolute left-[calc(100%+8px)] bottom-3 min-w-[180px] bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 p-1.5 animate-in fade-in slide-in-from-left-2 z-[100]`}
              >
                <Link
                  href="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors group/item"
                >
                  <Settings size={14} className="text-gray-400 group-hover/item:text-green-600" />
                  <span>Pengaturan Profil</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors group/logout"
                >
                  <LogOut size={14} className="text-red-400 group-hover/logout:text-red-500" />
                  <span>Keluar Sistem</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        )}
      </div>
    </aside>
  );
}
