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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const isExpanded = (!isCollapsed || isHovered) || isMobileOpen;
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

    const handleMobileToggle = () => setIsMobileOpen(prev => !prev);
    window.addEventListener('sidebar-mobile-toggle', handleMobileToggle);
    return () => window.removeEventListener('sidebar-mobile-toggle', handleMobileToggle);
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
      group flex items-center gap-3 px-3 h-9 rounded-[8px] transition-all text-[12.5px] font-semibold
      ${!isExpanded ? 'justify-center px-0 w-9 mx-auto' : 'w-full'}
      ${isActive 
        ? 'bg-green-50 text-green-600 font-black' 
        : 'text-gray-500 hover:bg-green-50 hover:text-green-600'}
    `;
  };

  const SectionLabel = ({ label }: { label: string }) => {
    if (!isExpanded) return <div className="h-px bg-gray-100 mx-2 my-4 first:hidden" />;
    return (
      <h2 className="px-3 text-[10px] font-bold text-gray-400 tracking-wide mt-6 mb-2 truncate first:mt-0">
        {label}
      </h2>
    );
  };

  const [activePath, setActivePath] = useState<string[]>([]);
  const [flyoutPositions, setFlyoutPositions] = useState<Record<string, { top: number, left: number }>>({});

  // Reset menu path and close mobile sidebar on route change
  useEffect(() => {
    setActivePath(prev => prev.length > 0 ? [] : prev);
    setIsMobileOpen(false);
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
    {/* Mobile Overlay */}
    {isMobileOpen && (
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] xl:hidden animate-in fade-in duration-300"
        onClick={() => setIsMobileOpen(false)}
      />
    )}

    <aside 
      ref={sidebarRef}
      onMouseEnter={() => isCollapsed && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: currentWidth }}
      className={`
        fixed xl:relative h-screen bg-white border-r border-gray-100 shrink-0 flex flex-col z-[100] transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0 shadow-2xl opacity-100 visible' : '-translate-x-full xl:translate-x-0 xl:opacity-100 xl:visible opacity-0 invisible'}
        ${isResizing ? '' : 'transition-[width,transform,opacity,visibility]'}
      `}
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
          <div className={`w-0.5 h-full mx-auto transition-colors ${isResizing ? 'bg-green-500' : 'group-hover:bg-green-200'}`} />
        </div>
      )}

      {/* Header */}
      <div className="p-4 pb-4 relative min-h-[64px]">
        <div className={`flex items-center ${!isExpanded ? 'justify-center' : 'justify-between'}`}>
          {isExpanded ? (
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-[8px] overflow-hidden shrink-0 bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-100">
                  <BarChart3 size={16} />
                </div>
                <div className="min-w-0 flex flex-col">
                  <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none uppercase">SINTAK</h1>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-wide truncate">PT. Buya Barokah</p>
                </div>
              </div>
              <div className="mt-4 px-3.5 py-1 rounded-[8px] border border-gray-100 inline-flex w-fit bg-gray-50/50">
                <span className="text-[10px] font-bold text-gray-400">Div. Percetakan</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-[8px] overflow-hidden mx-auto bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-100">
               <BarChart3 size={16} />
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
        className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-sm hover:text-green-600 z-50 transition-all xl:flex hidden ${
          !isExpanded && isCollapsed ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
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
            <SectionLabel label="DATA DIGIT" />
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
        <SectionLabel label="SISTEM" />

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
        {(canAccess('produksi_jhp_sopd') || canAccess('produksi_jhp_master_pekerjaan') || canAccess('produksi_jhp') || canAccess('produksi_jhp_target') || canAccess('produksi_hasil')) && (
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
                },
                ...(canAccess('produksi_hasil') ? [{ label: 'Hasil Produksi', href: '/hasil-produksi', icon: <BarChart3 size={16} /> }] : []),
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
      <div className={`mt-auto border-t border-gray-100 p-3 bg-gray-50/50 relative z-10`} ref={profileRef}>
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              onMouseDown={(e) => e.stopPropagation()}
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
              <div className="absolute left-0 bottom-full mb-2 w-full bg-white rounded-[8px] shadow-sm border border-gray-100 p-1.5 animate-in fade-in slide-in-from-bottom-2 z-50">
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
            group flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[12px] font-bold transition-all w-full
            ${itemActive ? 'bg-green-50 text-green-600 font-black' : 'text-gray-500 hover:bg-gray-50 hover:text-green-600'}
          `}
        >
          <span className={itemActive ? 'text-green-600' : 'text-gray-400'}>{item.icon}</span>
          <span className="truncate">{item.label}</span>
        </Link>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); hasSub && handleItemClick(item.label, e, level); }}
          onMouseDown={(e) => e.stopPropagation()}
          className={`
            group flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer w-full
            ${isOpen ? 'bg-green-600 text-white shadow-sm' : itemActive ? 'bg-green-50 text-green-600' : 'text-gray-500 hover:bg-gray-50 hover:text-green-600'}
          `}
        >
          <span className={isOpen ? 'text-white' : itemActive ? 'text-green-600' : 'text-gray-400'}>{item.icon}</span>
          <span className="flex-1 text-left truncate">{item.label}</span>
          {hasSub && <ChevronRight size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-90 sm:rotate-0' : 'text-gray-300'}`} />}
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
            <div className="bg-white border-[1.5px] border-gray-100 rounded-[12px] shadow-md p-1.5 min-w-[200px]">
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
          group flex items-center gap-3 px-3 h-9 rounded-[8px] transition-all text-[12.5px] font-semibold w-full
          ${!isExpanded ? 'justify-center px-0 w-9 mx-auto' : ''}
          ${isActive && !isOpen ? 'bg-green-50 text-green-600' : isOpen ? 'bg-green-600 text-white shadow-sm scale-[1.02]' : 'text-gray-500 hover:bg-green-50 hover:text-green-600'}
        `}
      >
        <span className={`transition-colors ${isOpen ? 'text-white' : isActive ? 'text-green-600' : 'text-gray-500 group-hover:text-green-600'}`}>{icon}</span>
        {isExpanded && (
          <>
            <span className="flex-1 text-left truncate">{label}</span>
            <ChevronRight size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
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
            <div className="bg-white border-[1.5px] border-gray-100 rounded-[12px] shadow-md p-1.5 min-w-[220px]">
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












