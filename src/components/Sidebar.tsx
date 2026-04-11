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
  Truck,
  CreditCard,
  TrendingUp,
  RefreshCw,
  Database
} from 'lucide-react';
import Image from 'next/image';
import logoPic from '../../public/icon.png';
import type { PermissionMap } from '@/lib/permissions-constants';

interface SidebarProps {
  user: {
    name: string;
    username: string;
    role?: string;
    photo?: string | null;
  } | null;
  permissions?: PermissionMap;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 480;
const COLLAPSED_WIDTH = 64;

export default function Sidebar({ user, permissions = {} }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedWidth, setExpandedWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);

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

  // Auto-scroll to active item
  useEffect(() => {
    if (isMounted) {
      // Small timeout to ensure the DOM has updated classes
      const timer = setTimeout(() => {
        const activeItem = navRef.current?.querySelector('.bg-green-600.text-white');
        if (activeItem) {
          activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname, isMounted]);

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

  // Check if user has access to a module key.
  // Super Admin always has full access.
  const canAccess = (moduleKey: string): boolean => {
    if (user?.role === 'Super Admin') return true;
    // If permissions not yet loaded or key missing, default to allow
    if (Object.keys(permissions).length === 0) return true;
    return permissions[moduleKey] !== false;
  };

  const navItemClasses = (href: string) => {
    const isActive = checkIsActive(href);
    return `
      group flex items-center gap-3 px-3 h-9 rounded-[8px] transition-all text-[12.5px] font-semibold
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

  const [activePath, setActivePath] = useState<string[]>([]);
  const [flyoutPositions, setFlyoutPositions] = useState<Record<string, { top: number, left: number }>>({});

  const handleItemClick = (label: string, e: React.MouseEvent, level: number) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    setActivePath(prev => {
      // If clicking already active item at this level, close it and children
      if (prev[level] === label) {
        return prev.slice(0, level);
      }
      // Otherwise, open this item and set path up to this level
      const newPath = [...prev.slice(0, level), label];
      return newPath;
    });

    setFlyoutPositions(prev => ({
      ...prev,
      [label]: { top: rect.top, left: rect.right }
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setActivePath([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  interface MenuItem {
    label: string;
    href?: string;
    icon: React.ReactNode;
    items?: MenuItem[];
  }

  const FlyoutItem = ({ item, level }: { item: MenuItem, level: number }) => {
    const hasSub = item.items && item.items.length > 0;
    const itemActive = item.href ? checkIsActive(item.href) : item.items?.some(si => si.href && checkIsActive(si.href));
    const isOpen = activePath[level] === item.label;
    const pos = flyoutPositions[item.label];

    return (
      <div className="relative">
        {item.href ? (
          <Link
            href={item.href}
            onClick={() => setActivePath([])}
            className={`
              flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[12px] font-bold transition-all w-full
              ${itemActive ? 'bg-green-50 text-green-600 font-black' : 'text-gray-500 hover:bg-gray-50 hover:text-green-600'}
            `}
          >
            <span className={itemActive ? 'text-green-600' : 'text-gray-400'}>{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        ) : (
          <button
            onClick={(e) => hasSub && handleItemClick(item.label, e, level)}
            className={`
              flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer w-full
              ${isOpen ? 'bg-green-600 text-white shadow-md' : itemActive ? 'bg-green-50 text-green-600' : 'text-gray-500 hover:bg-gray-50 hover:text-green-600'}
            `}
          >
            <span className={isOpen ? 'text-white' : itemActive ? 'text-green-600' : 'text-gray-400'}>{item.icon}</span>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {hasSub && <ChevronRight size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-90 sm:rotate-0' : 'text-gray-300'}`} />}
          </button>
        )}

        {/* Nested Flyout (Level 3 or higher) */}
        {hasSub && isOpen && pos && (
          <div 
            className="fixed z-[120] pl-1 animate-in fade-in zoom-in-95 duration-200 slide-in-from-left-2"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              left: `${pos.left - 4}px`,
              top: `${pos.top - 6}px`
            }}
          >
            <div className="bg-white border-[1.5px] border-gray-100 rounded-[12px] shadow-2xl p-1.5 min-w-[200px]">
              <div className="flex flex-col gap-1">
                {item.items?.map((subItem) => (
                  <FlyoutItem key={subItem.label} item={subItem} level={level + 1} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const FlyoutMenu = ({ label, icon, items }: { label: string, icon: React.ReactNode, items: MenuItem[] }) => {
    const isActive = items.some(item => 
      item.href ? checkIsActive(item.href) : item.items?.some(si => si.href && checkIsActive(si.href))
    );
    const isOpen = activePath[0] === label;
    const pos = flyoutPositions[label];

    return (
      <div className="relative">
        <button 
          onClick={(e) => handleItemClick(label, e, 0)}
          className={`
            group flex items-center gap-3 px-3 h-9 rounded-[8px] transition-all text-[12.5px] font-semibold w-full
            ${!isExpanded ? 'justify-center px-0 w-9 mx-auto' : ''}
            ${isActive && !isOpen ? 'bg-green-50 text-green-600' : isOpen ? 'bg-green-600 text-white shadow-lg scale-[1.02]' : 'text-gray-500 hover:bg-green-50 hover:text-green-600'}
          `}
        >
          {icon}
          {isExpanded && (
            <>
              <span className="flex-1 text-left truncate">{label}</span>
              <ChevronRight size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
            </>
          )}
        </button>

        {/* Level 2 Flyout */}
        {isOpen && pos && (
          <div 
            className={`
              fixed z-[100] pl-3 animate-in fade-in zoom-in-95 duration-200 slide-in-from-left-2
              ${!isExpanded ? 'ml-[-8px]' : 'ml-[-2px]'}
            `}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              left: `${pos.left}px`,
              top: `${pos.top - 6}px`
            }}
          >
            <div className="bg-white border-[1.5px] border-gray-100 rounded-[12px] shadow-2xl p-1.5 min-w-[190px]">
              <div className="flex flex-col gap-1">
                {items.map((item) => (
                  <FlyoutItem key={item.label} item={item} level={1} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Removed isMounted skeleton gating to fix hydration mismatch
  // The sidebar will render in its expanded state by default on server and first client pass

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
      <div className="p-4 pb-4 relative min-h-[64px] bg-gray-50/50 border-b border-gray-100">
        <div className={`flex items-center ${!isExpanded ? 'justify-center' : 'justify-between'}`}>
          {isExpanded ? (
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-[8px] overflow-hidden shrink-0 bg-[#16a34a]">
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
            <div className="w-8 h-8 rounded-[8px] overflow-hidden mx-auto bg-[#16a34a]">
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

      <nav ref={navRef} className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 custom-scrollbar">
        {/* DASHBOARD SECTION */}
        {canAccess('dashboard') && (
          <div className="space-y-1 mt-2">
            <Link href="/dashboard" className={navItemClasses('/dashboard')} title={!isExpanded ? "Dashboard" : ""}>
              <LayoutDashboard size={18} />
              {isExpanded && <span className="truncate">Dashboard</span>}
            </Link>
          </div>
        )}

        {/* DATA DIGIT */}
        {(canAccess('sync') ||
          canAccess('pembelian_pr') || canAccess('pembelian_spph') || canAccess('pembelian_sph_in') ||
          canAccess('pembelian_po') || canAccess('pembelian_penerimaan') || canAccess('pembelian_rekap') || canAccess('pembelian_hutang') ||
          canAccess('produksi_bom') || canAccess('produksi_orders') || canAccess('produksi_bahan_baku') || canAccess('produksi_barang_jadi') ||
          canAccess('penjualan_sph_out') || canAccess('penjualan_so') || canAccess('penjualan_laporan') ||
          canAccess('penjualan_piutang') || canAccess('penjualan_pengiriman')) && (
          <>
            <SectionLabel label="Data Digit" />
            <div className="space-y-1">
          {canAccess('sync') && (
            <>
              <Link href="/sync" className={navItemClasses('/sync')} title={!isExpanded ? "Sinkronisasi All Data" : ""}>
                <RefreshCw size={18} />
                {isExpanded && <span className="truncate">Sinkronisasi All Data</span>}
              </Link>
              <div className={`h-px bg-gray-100 my-2 ${!isExpanded ? 'mx-1' : 'mx-3'}`} />
            </>
          )}

          {/* PEMBELIAN SECTION */}
          {(canAccess('pembelian_pr') || canAccess('pembelian_spph') || canAccess('pembelian_sph_in') ||
            canAccess('pembelian_po') || canAccess('pembelian_penerimaan') || canAccess('pembelian_rekap') ||
            canAccess('pembelian_hutang')) && (
            <div data-group="Pembelian">
              <FlyoutMenu
                label="Pembelian"
                icon={<ShoppingCart size={18} />}
                items={[
                  ...(canAccess('pembelian_pr') ? [{
                    label: 'Purchase Request (PR)',
                    icon: <FileText size={16} />,
                    items: [{ label: 'Purchase Request (PR)', href: '/pr', icon: <FileText size={14} /> }]
                  }] : []),
                  ...(canAccess('pembelian_spph') || canAccess('pembelian_sph_in') ? [{
                    label: 'Penawaran',
                    icon: <FileText size={16} />,
                    items: [
                      ...(canAccess('pembelian_spph') ? [{ label: 'SPPH Keluar', href: '/spph-out', icon: <FileText size={14} /> }] : []),
                      ...(canAccess('pembelian_sph_in') ? [{ label: 'SPH Masuk', href: '/sph-in', icon: <FileText size={14} /> }] : []),
                    ]
                  }] : []),
                  ...(canAccess('pembelian_po') ? [{
                    label: 'Purchase Order (PO)',
                    icon: <ShoppingCart size={16} />,
                    items: [{ label: 'Purchase Order (PO)', href: '/purchase-orders', icon: <ShoppingCart size={14} /> }]
                  }] : []),
                  ...(canAccess('pembelian_penerimaan') || canAccess('pembelian_rekap') ? [{
                    label: 'Pembelian Barang',
                    icon: <Truck size={16} />,
                    items: [
                      ...(canAccess('pembelian_penerimaan') ? [{ label: 'Penerimaan Barang', href: '/penerimaan-pembelian', icon: <Truck size={14} /> }] : []),
                      ...(canAccess('pembelian_rekap') ? [{ label: 'Laporan Rekap Pembelian Barang', href: '/rekap-pembelian-barang', icon: <ShoppingCart size={14} /> }] : []),
                    ]
                  }] : []),
                  ...(canAccess('pembelian_hutang') ? [{
                    label: 'Hutang',
                    icon: <CreditCard size={16} />,
                    items: [{ label: 'Pelunasan Hutang', href: '/pelunasan-hutang', icon: <CreditCard size={14} /> }]
                  }] : []),
                ]}
              />
            </div>
          )}

          {/* PRODUKSI SECTION */}
          {(canAccess('produksi_bom') || canAccess('produksi_orders') || canAccess('produksi_bahan_baku') || canAccess('produksi_barang_jadi')) && (
            <div data-group="Produksi">
              <FlyoutMenu
                label="Produksi"
                icon={<Package size={18} />}
                items={[
                  ...(canAccess('produksi_bom') ? [{ label: 'Bill of Material Produksi', href: '/bom', icon: <Calculator size={16} /> }] : []),
                  ...(canAccess('produksi_orders') ? [{ label: 'Order Produksi', href: '/orders', icon: <ClipboardList size={16} /> }] : []),
                  ...(canAccess('produksi_bahan_baku') || canAccess('produksi_barang_jadi') ? [{
                    label: 'Laporan',
                    icon: <BarChart3 size={16} />,
                    items: [
                      ...(canAccess('produksi_bahan_baku') ? [{ label: 'BBB Produksi', href: '/bahan-baku', icon: <Box size={14} /> }] : []),
                      ...(canAccess('produksi_barang_jadi') ? [{ label: 'Penerimaan Barang Hasil Produksi', href: '/barang-jadi', icon: <Package size={14} /> }] : []),
                    ]
                  }] : []),
                ]}
              />
            </div>
          )}

          {/* PENJUALAN SECTION */}
          {(canAccess('penjualan_sph_out') || canAccess('penjualan_so') || canAccess('penjualan_laporan') ||
            canAccess('penjualan_piutang') || canAccess('penjualan_pengiriman')) && (
            <div data-group="Penjualan">
              <FlyoutMenu
                label="Penjualan"
                icon={<TrendingUp size={18} />}
                items={[
                  ...(canAccess('penjualan_sph_out') ? [{
                    label: 'Penawaran',
                    icon: <FileText size={16} />,
                    items: [{ label: 'SPH Keluar', href: '/sph-out', icon: <FileText size={14} /> }]
                  }] : []),
                  ...(canAccess('penjualan_so') ? [{
                    label: 'Sales Order (SO)',
                    icon: <FileCheck size={16} />,
                    items: [{
                      label: 'Laporan',
                      icon: <BarChart3 size={14} />,
                      items: [{ label: 'Sales Order Barang', href: '/sales-orders', icon: <FileCheck size={12} /> }]
                    }]
                  }] : []),

                  ...(canAccess('penjualan_laporan') ? [{
                    label: 'Penjualan Barang',
                    icon: <TrendingUp size={16} />,
                    items: [{
                      label: 'Laporan',
                      icon: <BarChart3 size={14} />,
                      items: [{ label: 'Laporan Penjualan', href: '/sales', icon: <BarChart3 size={12} /> }]
                    }]
                  }] : []),
                  ...(canAccess('penjualan_piutang') ? [{
                    label: 'Piutang',
                    icon: <TrendingUp size={16} />,
                    items: [{
                      label: 'Laporan',
                      icon: <BarChart3 size={14} />,
                      items: [{ label: 'Pelunasan Piutang Penjualan', href: '/pelunasan-piutang', icon: <TrendingUp size={12} /> }]
                    }]
                  }] : []),
                  ...(canAccess('penjualan_pengiriman') ? [{
                    label: 'Pengiriman (SJ)',
                    icon: <Truck size={16} />,
                    items: [{
                      label: 'Laporan',
                      icon: <BarChart3 size={14} />,
                      items: [{ label: 'Pengiriman', href: '/pengiriman', icon: <Truck size={12} /> }]
                    }]
                  }] : []),
                ]}
              />
            </div>
          )}

            </div>
          </>
        )}

        {/* KESALAHAN KARYAWAN */}
        {(canAccess('karyawan') || canAccess('hpp_kalkulasi') || canAccess('statistik') || canAccess('catat_kesalahan')) && (
          <>
            <SectionLabel label="Kesalahan Karyawan" />
            <div className="space-y-1">
              
              {/* Data Group */}
              {(canAccess('karyawan') || canAccess('hpp_kalkulasi')) && (
                <FlyoutMenu
                  label="Data"
                  icon={<Database size={18} />}
                  items={[
                    ...(canAccess('karyawan') ? [{ label: 'Karyawan', href: '/employees', icon: <Users size={16} /> }] : []),
                    ...(canAccess('hpp_kalkulasi') ? [{ label: 'HPP Kalkulasi', href: '/hpp-kalkulasi', icon: <Calculator size={16} /> }] : []),
                  ]}
                />
              )}

              {canAccess('catat_kesalahan') && (
                <Link href="/records" className={navItemClasses('/records')} title={!isExpanded ? "Catat Kesalahan" : ""}>
                  <ClipboardCheck size={18} />
                  {isExpanded && <span className="truncate">Catat Kesalahan</span>}
                </Link>
              )}
              
              {canAccess('statistik') && (
                <Link href="/stats" className={navItemClasses('/stats')} title={!isExpanded ? "Statistik Performa" : ""}>
                  <BarChart2 size={18} />
                  {isExpanded && <span className="truncate">Statistik Performa</span>}
                </Link>
              )}
              
            </div>
          </>
        )}

        {/* TRACKING MANUFAKTUR */}
        {canAccess('tracking_manufaktur') && (
          <>
            <SectionLabel label="Tracking Manufaktur" />
            <div className="space-y-1">
              <Link href="/tracking-manufaktur" className={navItemClasses('/tracking-manufaktur')} title={!isExpanded ? "Tracking Manufaktur" : ""}>
                <Search size={18} />
                {isExpanded && <span className="truncate">Tracking Manufaktur</span>}
              </Link>
            </div>
          </>
        )}

        {/* KALKULASI */}
        {canAccess('kalkulasi_rekap_so') && (
          <>
            <SectionLabel label="Kalkulasi" />
            <div className="space-y-1">
              <Link href="/rekap-sales-order" className={navItemClasses('/rekap-sales-order')} title={!isExpanded ? "Rekap Sales Order Barang" : ""}>
                <Calculator size={18} />
                {isExpanded && <span className="truncate">Rekap Sales Order Barang</span>}
              </Link>
            </div>
          </>
        )}

        {/* SISTEM — Super Admin only */}
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
              className={`w-full flex items-center gap-3 p-2 rounded-[8px] transition-all hover:bg-white hover:shadow-sm ${
                isProfileOpen ? 'bg-white shadow-sm ring-1 ring-black/5' : ''
              } ${!isExpanded ? 'justify-center p-1' : ''}`}
            >
              <div className="w-8 h-8 rounded-[8px] bg-green-100 flex items-center justify-center overflow-hidden shrink-0 border border-green-200">
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
              <div className="absolute left-0 bottom-full mb-2 w-full bg-white rounded-[8px] shadow-xl border border-gray-100 p-1.5 animate-in fade-in slide-in-from-bottom-2 z-50">
                <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-gray-600 hover:bg-gray-50 rounded-[8px] transition-colors">
                  <Settings size={14} />
                  <span>Pengaturan Profil</span>
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-[8px] transition-colors">
                  <LogOut size={14} />
                  <span>Keluar Sistem</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-10 bg-gray-200 rounded-[8px] animate-pulse" />
        )}
      </div>
    </aside>
  );
}





