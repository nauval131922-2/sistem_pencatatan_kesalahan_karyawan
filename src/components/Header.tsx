'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const pathMap: Record<string, string> = {
  '/': 'Dashboard',
  '/employees': 'Karyawan',
  '/orders': 'Order Produksi',
  '/bahan-baku': 'Bahan Baku',
  '/barang-jadi': 'Barang Jadi',
  '/sales': 'Laporan Penjualan',
  '/hpp-kalkulasi': 'HPP Kalkulasi',
  '/users': 'Kelola User',
  '/records': 'Catat Kesalahan',
  '/profile': 'Pengaturan Profil',
  '/stats': 'Statistik Performa',
};

interface HeaderProps {
  user: {
    name: string;
    username: string;
    role?: string;
    photo?: string | null;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const currentPageTitle = pathMap[pathname] || 'Dashboard';
  const [userData, setUserData] = useState<{
    name: string;
    username: string;
    role?: string;
    photo?: string | null;
  } | null>(user as any);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
        }
      } catch (error) {
        console.error("Failed to fetch user data for header", error);
      }
    };
    if (user) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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

  return (
    <header className="h-16 w-full bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-10 transition-all duration-300">
      {/* Left side: Brand/Logo (Visible on smaller screens or as a breadcrumb) */}
      <div className="flex items-center gap-2">
        <div className="md:hidden">
          <h1 className="text-xl font-bold gradient-text">SIKKA</h1>
        </div>
        <div className="hidden md:flex items-center gap-3 text-slate-400">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-400">System</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-slate-500">{currentPageTitle}</span>
        </div>
      </div>

      {/* Right side: User Profile - Final Polish */}
      <div className="flex items-center gap-4">
        {userData ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 group transition-all"
            >
              {/* Avatar: Simple w-8 */}
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-emerald-50">
                {userData.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userData.photo} alt={userData.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-emerald-600" />
                )}
              </div>

              {/* Identity: Stacked, muted role text */}
              <div className="text-left hidden sm:flex flex-col">
                <p className="text-sm font-medium text-slate-700 leading-tight group-hover:text-emerald-700 transition-colors">{userData.name}</p>
                <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">{userData.role || 'User'}</p>
              </div>

              <ChevronDown 
                size={12} 
                className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''} ml-1`} 
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 min-w-[210px] bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 origin-top-right animate-in fade-in slide-in-from-top-2 z-50">
                {/* Profile Section inside Dropdown - Clear Separation */}
                <div className="px-2 py-2 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0 border border-emerald-50 shadow-sm">
                    {userData.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userData.photo} alt={userData.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-emerald-600" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{userData.name}</p>
                    <p className="text-xs text-slate-400 font-medium truncate mb-1">@{userData.username}</p>
                    <div className="flex">
                      {/* Tiny Pill Badge - Subtle Label Style */}
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                        userData.role === 'Super Admin' 
                          ? 'bg-purple-50 text-purple-500 border-purple-100' 
                          : 'bg-emerald-50 text-emerald-500 border-emerald-100'
                      }`}>
                        {userData.role || 'User'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 my-1 mx-2" />
                
                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors group/item"
                >
                  <Settings size={16} strokeWidth={1.5} className="text-slate-400 group-hover/item:text-emerald-600" />
                  <span className="font-medium">Pengaturan Profil</span>
                </Link>

                <div className="border-t border-slate-100 my-1 mx-2" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors group/logout"
                >
                  <LogOut size={16} strokeWidth={1.5} className="text-red-400 group-hover/logout:text-red-500" />
                  <span className="font-bold">Keluar Sistem</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-50 animate-pulse border border-slate-100"></div>
        )}
      </div>
    </header>
  );
}
