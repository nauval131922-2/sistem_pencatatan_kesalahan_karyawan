'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, AlertCircle, Package, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Sync with layout via event or shared state if needed, 
  // but for now we'll use a custom event to notify layout
  useEffect(() => {
    const event = new CustomEvent('sidebar-toggle', { detail: { isCollapsed } });
    window.dispatchEvent(event);
  }, [isCollapsed]);

  const menuItems = [
    { name: 'Dashboard', icon: Home, href: '/' },
    { name: 'Karyawan', icon: Users, href: '/employees' },
    { name: 'Order Produksi', icon: Package, href: '/orders' },
    { name: 'Catat Kesalahan', icon: AlertCircle, href: '/records' },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen glass border-r border-slate-200 z-50 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-[80px]' : 'w-[210px]'
      }`}
    >
      <div className={`p-6 transition-all duration-300 ${isCollapsed ? 'px-4 text-center' : 'px-6'}`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-lg font-bold gradient-text whitespace-nowrap overflow-hidden">
              RecLog
            </h1>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors ml-auto"
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

      <nav className="mt-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all group text-sm ${
                  isCollapsed ? 'justify-center px-0' : ''
                } ${
                  pathname === item.href
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                }`}
              >
                {!isCollapsed && pathname === item.href && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/50 rounded-r-full" />
                )}
                <item.icon
                  size={17}
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
