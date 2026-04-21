'use client';

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
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
  Database,
  Target
} from 'lucide-react';
import Image from 'next/image';
import logoPic from '../../public/icon.png';
import type { PermissionMap } from '@/lib/permissions-constants';
import Portal from './Portal';

// --- Shared types (module-level for stable component references) ---
export interface MenuItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  items?: MenuItem[];
  exact?: boolean;
}

interface SidebarContextValue {
  activePath: string[];
  flyoutPositions: Record<string, { top: number; left: number }>;
  handleItemClick: (label: string, e: React.MouseEvent, level: number) => void;
  setActivePath: React.Dispatch<React.SetStateAction<string[]>>;
  isAnyChildActive: (item: MenuItem) => boolean;
  isExpanded: boolean;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);
function useSidebarCtx() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('Missing SidebarContext');
  return ctx;
}

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

  const checkIsActive = (href: string, exact: boolean = false) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Check if user has access to a module key.
  // Super Admin always has full access.
  const canAccess = (moduleKey: string): boolean => {
    if (user?.role === 'Super Admin') return true;
    // If permissions not yet loaded, hide everything to prevent "leak by default"
    if (Object.keys(permissions).length === 0) return false;
    return permissions[moduleKey] === true;
  };



  // Recursive child check
  const isAnyChildActive = (item: MenuItem): boolean => {
    if (item.href && checkIsActive(item.href, item.exact)) return true;
    if (item.items && item.items.length > 0) {
      return item.items.some(child => isAnyChildActive(child));
    }
    return false;
  };

  const navItemClasses = (href: string) => {
    const isActive = checkIsActive(href);
    return `
      group flex items-center gap-3 px-3 h-10 rounded-none transition-all text-[12.5px] font-black border-2
      ${!isExpanded ? 'justify-center px-0 w-10 mx-auto' : 'w-full'}
      ${isActive 
        ? 'bg-[#fde047] text-black border-black shadow-[2px_2px_0_0_#000] -translate-y-[1px] -translate-x-[1px]' 
        : 'border-transparent text-black/60 hover:bg-[#fde047] hover:text-black hover:border-black hover:shadow-[2px_2px_0_0_#000] hover:-translate-y-[1px] hover:-translate-x-[1px]'}
    `;
  };

  const SectionLabel = ({ label }: { label: string }) => {
    if (!isExpanded) return <div className="h-px bg-black opacity-10 mx-2 my-4 first:hidden" />;
    return (
      <h2 className="px-3 text-[10px] font-black text-black opacity-30 uppercase tracking-[0.2em] mt-6 mb-2 truncate first:mt-0">
        {label}
      </h2>
    );
  };

  const [activePath, setActivePath] = useState<string[]>([]);
  const [flyoutPositions, setFlyoutPositions] = useState<Record<string, { top: number, left: number }>>({});

  // Reset menu path on route change
  useEffect(() => {
    setActivePath(prev => prev.length > 0 ? [] : prev);
  }, [pathname]);

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
      const target = event.target as HTMLElement;
      // Don't close if clicking inside a portal-flyout
      if (target.closest('[data-sidebar-flyout]')) return;

      setActivePath([]);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);






  // Removed isMounted skeleton gating to fix hydration mismatch
  // The sidebar will render in its expanded state by default on server and first client pass

  const sidebarCtxValue: SidebarContextValue = {
    activePath, flyoutPositions, handleItemClick, setActivePath, isAnyChildActive, isExpanded,
  };

  return (
    <SidebarContext.Provider value={sidebarCtxValue}>
    <aside 
      ref={sidebarRef}
      onMouseEnter={() => isCollapsed && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: currentWidth }}
      className={`h-screen bg-[var(--bg-surface)] border-r-[3px] border-black shrink-0 flex flex-col z-[50] relative ${
        isResizing ? '' : 'transition-[width] duration-300 ease-in-out'
      }`}
    >
      {/* Resizer Handle */}
      {isExpanded && (
        <div 
          onMouseDown={(e) => {
            startResizing(e);
            setActivePath([]);
          }}
          className={`absolute -right-1.5 top-0 w-3 h-full cursor-col-resize z-30 group`}
        >
          <div className={`w-0.5 h-full mx-auto transition-colors ${isResizing ? 'bg-green-500' : 'group-hover:bg-green-300'}`} />
        </div>
      )}

      {/* Header */}
      <div className="p-4 pb-4 relative min-h-[64px] bg-[var(--bg-deep)] border-b-[3px] border-black">
        <div className={`flex items-center ${!isExpanded ? 'justify-center' : 'justify-between'}`}>
          {isExpanded ? (
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-none overflow-hidden shrink-0 bg-[#fde047] border-2 border-black">
                  <Image src={logoPic} alt="SINTAK" className="w-full h-full object-contain p-0.5" />
                </div>
                <div className="min-w-0 flex flex-col">
                  <h1 className="text-[15px] font-black text-black tracking-tight leading-none uppercase">SINTAK</h1>
                  <p className="text-[10px] text-gray-700 font-bold mt-1 tracking-wide truncate">PT. Buya Barokah</p>
                </div>
              </div>
              <div className="mt-4 px-3.5 py-1 rounded-none border-2 border-black inline-flex w-fit bg-[#fde047] shadow-[2px_2px_0_0_#000]">
                <span className="text-[10px] font-black text-black">Div. Percetakan</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-none overflow-hidden mx-auto bg-[#fde047] border-2 border-black">
               <Image src={logoPic} alt="SINTAK" className="w-full h-full object-contain p-0.5" />
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => {
          setIsCollapsed(!isCollapsed);
          setIsHovered(false);
          setActivePath([]);
        }}
        className={`absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#fde047] border-[2px] border-black rounded-none flex items-center justify-center text-black shadow-[2px_2px_0_0_#000] hover:bg-[var(--accent-primary)] hover:text-white z-50 transition-all active:translate-y-[-40%] active:translate-x-[2px] active:shadow-none ${
          !isExpanded && isCollapsed ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
      </button>

      <nav ref={navRef} className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-4 pb-2 custom-scrollbar">
        {/* DASHBOARD SECTION */}
        {canAccess('dashboard') && (
          <div className="space-y-1">
            <Link 
              href="/dashboard" 
              className={navItemClasses('/dashboard')} 
              title={!isExpanded ? "Dashboard" : ""}
              onMouseDown={(e) => e.stopPropagation()}
            >
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
            <div className={!isExpanded ? 'mx-0' : ''}>
              <Link 
                href="/sync" 
                className={navItemClasses('/sync')} 
                title={!isExpanded ? "Sinkronisasi All Data" : ""}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <RefreshCw size={18} />
                {isExpanded && <span className="truncate">Sinkronisasi All Data</span>}
              </Link>
            </div>
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
                id="penjualan_digit"
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

        {/* LABEL MULTI-PURPOSE / MANAGEMENT */}
        <SectionLabel label="Sistem" />

        {/* UMUM */}
        {(canAccess('tracking_manufaktur') || canAccess('karyawan')) && (
          <div className="space-y-1 mb-1" data-group="Umum">
            <FlyoutMenu
              label="Umum"
              icon={<Monitor size={18} />}
              items={[
                ...(canAccess('karyawan') ? [{
                  label: 'Data',
                  icon: <Database size={16} />,
                  items: [
                    { label: 'Karyawan', href: '/employees', icon: <Users size={14} /> }
                  ]
                }] : []),
                ...(canAccess('tracking_manufaktur') ? [{ label: 'Tracking Manufaktur', href: '/tracking-manufaktur', icon: <Search size={16} /> }] : [])
              ]}
            />
          </div>
        )}

        {/* HRD */}
        {(canAccess('catat_kesalahan') || canAccess('statistik')) && (
          <div className="space-y-1 mb-1" data-group="HRD">
            <FlyoutMenu
              label="HRD"
              icon={<Users size={18} />}
              items={[
                {
                  label: 'Kesalahan Karyawan',
                  icon: <ClipboardCheck size={16} />,
                  items: [
                    ...(canAccess('catat_kesalahan') ? [{ label: 'Catat Kesalahan', href: '/records', icon: <ClipboardCheck size={14} /> }] : []),
                    ...(canAccess('statistik') ? [{ label: 'Statistik Performa', href: '/stats', icon: <BarChart2 size={14} /> }] : []),
                  ]
                }
              ]}
            />
          </div>
        )}

        {/* KALKULASI */}
        {canAccess('hpp_kalkulasi') && (
          <div className="space-y-1 mb-1" data-group="Kalkulasi">
            <FlyoutMenu
              label="Kalkulasi"
              icon={<Calculator size={18} />}
              items={[
                {
                  label: 'Data',
                  icon: <Database size={16} />,
                  items: [
                    { label: 'HPP Kalkulasi', href: '/hpp-kalkulasi', icon: <Calculator size={14} /> }
                  ]
                }
              ]}
            />
          </div>
        )}

        {/* PRODUKSI */}
        {(canAccess('produksi_jhp_sopd') || canAccess('produksi_jhp_master_pekerjaan') || canAccess('produksi_jhp') || canAccess('produksi_jhp_target')) && (
          <div className="space-y-1 mb-1" data-group="Produksi">
            <FlyoutMenu
              id="Produksi Jurnal Harian"
              label="Produksi"
              icon={<Package size={18} />}
              items={[
                {
                  label: 'Jurnal Harian Produksi',
                  icon: <ClipboardList size={16} />,
                  items: [
                    ...(canAccess('produksi_jhp_sopd') || canAccess('produksi_jhp_stp') ? [{
                      label: 'Data',
                      icon: <Database size={14} />,
                      items: [
                        ...(canAccess('produksi_jhp_sopd') ? [{ label: 'SOPd', href: '/jurnal-harian-produksi/data/excel-sopd', icon: <FileText size={12} /> }] : []),
                        ...(canAccess('produksi_jhp_master_pekerjaan') ? [{ label: 'Master Pekerjaan', href: '/jurnal-harian-produksi/data/master-pekerjaan', icon: <Database size={12} /> }] : []),
                      ]
                    }] : []),
                    ...(canAccess('produksi_jhp') ? [{ label: 'Jurnal Harian Produksi', href: '/jurnal-harian-produksi', icon: <ClipboardList size={14} />, exact: true }] : []),
                    ...(canAccess('produksi_jhp_target') ? [{ label: 'Target Harian', href: '/jurnal-harian-produksi/target', icon: <TrendingUp size={14} /> }] : []),
                  ]
                }
              ]}
            />
          </div>
        )}

        {/* PENJUALAN */}
        {canAccess('kalkulasi_rekap_so') && (
          <div className="space-y-1 mb-1" data-group="Penjualan">
            <FlyoutMenu
              id="penjualan_sistem"
              label="Penjualan"
              icon={<TrendingUp size={18} />}
              items={[
                { label: 'Rekap Sales Order Barang', href: '/rekap-sales-order', icon: <FileCheck size={16} /> }
              ]}
            />
          </div>
        )}

        {/* SISTEM / USER — Super Admin only */}
        {user?.role === 'Super Admin' && (
          <div className="space-y-1 mb-1" data-group="User">
            <FlyoutMenu
              label="User"
              icon={<Settings size={18} />}
              items={[
                { label: 'Hak Akses', href: '/roles', icon: <ShieldCheck size={16} /> },
                { label: 'Kelola User', href: '/users', icon: <UserCog size={16} /> }
              ]}
            />
          </div>
        )}
      </nav>


      {/* User Focus Footer */}
      <div className={`mt-auto border-t-[3px] border-black p-3 bg-[var(--bg-deep)] relative z-10`} ref={profileRef}>
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              onMouseDown={(e) => e.stopPropagation()}
              className={`w-full flex items-center gap-3 p-2 border-2 border-transparent transition-all hover:bg-[#fde047] hover:border-black hover:shadow-[2px_2px_0_0_#000] hover:-translate-y-[1px] hover:-translate-x-[1px] ${
                isProfileOpen ? 'bg-[#fde047] border-black shadow-[2px_2px_0_0_#000] -translate-y-[1px] -translate-x-[1px]' : ''
              } ${!isExpanded ? 'justify-center p-1' : ''}`}
            >
              <div className="w-8 h-8 rounded-none bg-black flex items-center justify-center overflow-hidden shrink-0 border-2 border-black">
                {user.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-[#fde047]" strokeWidth={3} />
                )}
              </div>
              {isExpanded && (
                <div className="flex flex-col min-w-0 text-left">
                  <p className="text-[13px] font-black text-black truncate leading-none">{user.name}</p>
                  <p className="text-[11px] text-gray-800 font-bold mt-1.5 truncate">{user.role}</p>
                </div>
              )}
            </button>

            {isProfileOpen && (
              <div className="absolute left-0 bottom-full mb-3 w-full bg-white rounded-none border-[3px] border-black shadow-[3.5px_3.5px_0_0_#000] p-1.5 animate-in fade-in slide-in-from-bottom-2 z-50">
                <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[12px] font-black text-black border-2 border-transparent hover:bg-[#fde047] hover:border-black transition-all">
                  <Settings size={14} strokeWidth={3} />
                  <span>Pengaturan Profil</span>
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-black text-black border-2 border-transparent hover:bg-[#ff5e5e] hover:text-white hover:border-black transition-all">
                  <LogOut size={14} strokeWidth={3} />
                  <span>Keluar Sistem</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-10 border-2 border-black bg-gray-200 rounded-none animate-pulse" />
        )}
      </div>
    </aside>
    </SidebarContext.Provider>
  );
}

// =============================================================================
// Module-level components — defined OUTSIDE Sidebar so their reference is stable
// across re-renders. Using SidebarContext to access shared state.
// =============================================================================

function FlyoutItem({ item, level }: { item: MenuItem; level: number }) {
  const { activePath, flyoutPositions, handleItemClick, setActivePath, isAnyChildActive } = useSidebarCtx();
  const hasSub = item.items && item.items.length > 0;
  const itemActive = isAnyChildActive(item);
  const isOpen = activePath[level] === item.label;
  const pos = flyoutPositions[item.label];

  return (
    <div className="relative">
      {item.href ? (
        <Link
          href={item.href}
          onClick={() => setActivePath([])}
          className={`
            group flex items-center gap-3 px-3 py-2.5 rounded-none text-[12px] font-black transition-all w-full border-2 border-transparent
            ${itemActive 
              ? 'bg-[#fde047] text-black border-black shadow-[2px_2px_0_0_#000] -translate-x-[1px] -translate-y-[1px]' 
              : 'text-black/60 hover:bg-black hover:text-white hover:border-black'}
          `}
        >
          <span className={`transition-colors ${itemActive ? 'text-black' : 'text-black/40 group-hover:text-white'}`}>{item.icon}</span>
          <span className="truncate">{item.label}</span>
        </Link>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); hasSub && handleItemClick(item.label, e, level); }}
          onMouseDown={(e) => e.stopPropagation()}
          className={`
            group flex items-center gap-3 px-3 py-2.5 rounded-none text-[12px] font-black transition-all cursor-pointer w-full border-2 border-transparent
            ${isOpen 
              ? 'bg-black text-white border-black shadow-[4px_4px_0_0_#fde047]' 
              : itemActive 
                ? 'bg-[#fde047] text-black border-black shadow-[2px_2px_0_0_#000]' 
                : 'text-black/60 hover:bg-[#fde047] hover:text-black hover:border-black'}
          `}
        >
          <span className={`transition-colors ${isOpen ? 'text-white' : itemActive ? 'text-black' : 'text-black/40 group-hover:text-black'}`}>{item.icon}</span>
          <span className="flex-1 text-left truncate">{item.label}</span>
          {hasSub && <ChevronRight size={14} strokeWidth={3} className={`transition-transform duration-200 ${isOpen ? 'rotate-90 sm:rotate-0' : 'text-black/20'}`} />}
        </button>
      )}

      {hasSub && isOpen && pos && (
        <Portal>
          <div
            className="fixed z-[10000] pl-1 animate-in fade-in zoom-in-95 duration-200 slide-in-from-left-2"
            data-sidebar-flyout="true"
            onClick={(e) => e.stopPropagation()}
            style={{ left: `${pos.left - 4}px`, top: `${pos.top - 6}px` }}
          >
            <div className="bg-white border-[3px] border-black rounded-none shadow-[2.5px_2.5px_0_0_#000] p-1.5 min-w-[200px]">
              <div className="flex flex-col gap-1">
                {item.items?.map((subItem) => (
                  <FlyoutItem key={subItem.label} item={subItem} level={level + 1} />
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

function FlyoutMenu({ id, label, icon, items }: { id?: string; label: string; icon: React.ReactNode; items: MenuItem[] }) {
  const { activePath, flyoutPositions, handleItemClick, isAnyChildActive, isExpanded } = useSidebarCtx();
  const menuId = id || label;
  const isActive = items.some(item => isAnyChildActive(item));
  const isOpen = activePath[0] === menuId;
  const pos = flyoutPositions[menuId];

  return (
    <div className="relative">
      <button
        onClick={(e) => handleItemClick(menuId, e, 0)}
        onMouseDown={(e) => e.stopPropagation()}
        className={`
          group flex items-center gap-3 px-3 h-10 rounded-none transition-all text-[12.5px] font-black w-full border-2
          ${!isExpanded ? 'justify-center px-0 w-10 mx-auto' : ''}
          ${isActive && !isOpen 
            ? 'bg-[#fde047] text-black border-black shadow-[2px_2px_0_0_#000] -translate-y-[1px] -translate-x-[1px]' 
            : isOpen 
              ? 'bg-black text-white border-black shadow-[4px_4px_0_0_#fde047] -translate-y-[2px] -translate-x-[2px]' 
              : 'text-black/60 border-transparent hover:bg-[#fde047] hover:text-black hover:border-black hover:shadow-[2px_2px_0_0_#000] hover:-translate-y-[1px] hover:-translate-x-[1px]'}
        `}
      >
        <span className={`transition-colors ${isOpen ? 'text-white' : isActive ? 'text-black' : 'text-black/60 group-hover:text-black'}`}>{icon}</span>
        {isExpanded && (
          <>
            <span className="flex-1 text-left truncate">{label}</span>
            <ChevronRight size={14} strokeWidth={3} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
          </>
        )}
      </button>

      {isOpen && pos && (
        <Portal>
          <div
            className={`fixed z-[9999] pl-3 animate-in fade-in zoom-in-95 duration-200 slide-in-from-left-2 ${!isExpanded ? 'ml-[-8px]' : 'ml-[-2px]'}`}
            data-sidebar-flyout="true"
            onClick={(e) => e.stopPropagation()}
            style={{ left: `${pos.left}px`, top: `${pos.top - 6}px` }}
          >
            <div className="bg-white border-[3px] border-black rounded-none shadow-[2.5px_2.5px_0_0_#000] p-1.5 min-w-[220px]">
              <div className="flex flex-col gap-1">
                {items.map((item) => (
                  <FlyoutItem key={item.label} item={item} level={1} />
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}









