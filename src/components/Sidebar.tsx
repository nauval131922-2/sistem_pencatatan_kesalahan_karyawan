'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, AlertCircle, Package, ChevronLeft, ChevronRight, Box, Star, Calculator, ChevronDown, Database, BarChart3 } from 'lucide-react';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMasterOpen, setIsMasterOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Sync with layout via event or shared state if needed, 
  // and save to localStorage
  // but for now we'll use a custom event to notify layout
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isCollapsed));
    const event = new CustomEvent('sidebar-toggle', { detail: { isCollapsed } });
    window.dispatchEvent(event);
  }, [isCollapsed]);

  const topMenus = [
    { name: 'Dashboard', icon: Home, href: '/' },
  ];

  const masterMenus = [
    { name: 'Karyawan', icon: Users, href: '/employees' },
    { name: 'Order Produksi', icon: Package, href: '/orders' },
    { name: 'Bahan Baku', icon: Box, href: '/bahan-baku' },
    { name: 'Barang Jadi', icon: Star, href: '/barang-jadi' },
    { name: 'Laporan Penjualan', icon: BarChart3, href: '/sales' },
    { name: 'HPP Kalkulasi', icon: Calculator, href: '/hpp-kalkulasi' },
  ];

  const bottomMenus = [
    { name: 'Catat Kesalahan', icon: AlertCircle, href: '/records' },
  ];

  return (
    <aside 
      className={`h-screen glass border-r border-slate-200 shrink-0 ${isMounted ? 'transition-all duration-300 ease-in-out' : ''} ${
        isCollapsed ? 'w-[80px]' : 'w-[210px]'
      }`}
    >
      <div className={`p-4 ${isMounted ? 'transition-all duration-300' : ''} ${isCollapsed ? 'px-3 text-center' : 'px-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <h1 className="text-lg font-bold gradient-text whitespace-nowrap overflow-hidden">
              SIKKA
            </h1>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors ${isCollapsed ? '' : 'ml-auto'}`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        {!isCollapsed && (
          <div className="mt-2 space-y-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold italic">PT. Buya Barokah</p>
            <span className="inline-block text-[9px] font-semibold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded px-1.5 py-0.5">
              Div. Percetakan
            </span>
          </div>
        )}
      </div>

      <nav className="mt-2 px-3 overflow-y-auto h-[calc(100vh-80px)] custom-scrollbar pb-10">
        <ul className="space-y-1">
          {/* Top Menus */}
          {topMenus.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group text-sm ${
                  isCollapsed ? 'justify-center px-0 py-3' : ''
                } ${
                  pathname === item.href
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                {!isCollapsed && pathname === item.href && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/50 rounded-r-full" />
                )}
                <item.icon
                  size={18}
                  className={`shrink-0 ${
                    pathname === item.href ? 'text-white' : 'group-hover:text-emerald-600'
                  }`}
                />
                {!isCollapsed && (
                  <span className="font-medium whitespace-nowrap">{item.name}</span>
                )}
              </Link>
            </li>
          ))}

          {/* Master Data Group */}
          <li className="pt-2 pb-1">
            {!isCollapsed ? (
              <button 
                onClick={() => setIsMasterOpen(!isMasterOpen)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Database size={16} className="opacity-70" />
                  <span>Data Master</span>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isMasterOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
                <button 
                  onClick={() => setIsMasterOpen(!isMasterOpen)}
                  className="w-full flex items-center justify-center py-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                  title="Data Master"
                >
                    <Database size={16} className={`transition-all ${isMasterOpen ? 'opacity-100 text-emerald-600' : 'opacity-70'}`} />
                </button>
            )}
            
            <ul className={`space-y-1 mt-1 overflow-hidden transition-all duration-300 ${isMasterOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {masterMenus.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-3 py-1.5 rounded-lg transition-all group text-sm ${
                      isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 ml-2'
                    } ${
                      pathname === item.href
                        ? 'bg-emerald-50 text-emerald-600 font-semibold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {!isCollapsed && pathname === item.href && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-emerald-500 rounded-r-full" />
                    )}
                    <item.icon
                      size={17}
                      className={`shrink-0 ${
                        pathname === item.href ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="whitespace-nowrap">{item.name}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          <div className="my-1 border-t border-slate-100" />

          {/* Bottom Menus */}
          {bottomMenus.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group text-sm ${
                  isCollapsed ? 'justify-center px-0 py-3' : ''
                } ${
                  pathname === item.href
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                {!isCollapsed && pathname === item.href && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/50 rounded-r-full" />
                )}
                <item.icon
                  size={18}
                  className={`shrink-0 ${
                    pathname === item.href ? 'text-white' : 'group-hover:text-emerald-600'
                  }`}
                />
                {!isCollapsed && (
                  <span className="font-medium whitespace-nowrap">{item.name}</span>
                )}
              </Link>
            </li>
          ))}

        </ul>
      </nav>
    </aside>
  );
}
