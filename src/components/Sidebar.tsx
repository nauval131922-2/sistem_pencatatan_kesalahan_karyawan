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
  ChevronDown,
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
  BookOpen,
  History,
  CheckCircle,
  MessageSquare,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { MODULE_REGISTRY, type PermissionMap } from '@/lib/permissions-constants';


// --- Shared types ---
export interface MenuItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  items?: MenuItem[];
  exact?: boolean;
}

interface SidebarContextValue {
  isExpanded: boolean;
  isCollapsed: boolean;
  openMenuIds: Set<string>;
  toggleMenuId: (id: string) => void;
  resetMenuIds: () => void;
  checkIsActive: (href: string, exact?: boolean) => boolean;
  isAnyChildActive: (item: MenuItem) => boolean;
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
    roles?: string[];
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
  const [openMenuIds, setOpenMenuIds] = useState<Set<string>>(new Set());
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const toggleMenuId = (id: string) => {
    setOpenMenuIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const resetMenuIds = () => setOpenMenuIds(new Set());
  
  const pathname = usePathname() ?? '';
  const profileRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const isExpanded = (!isCollapsed || isHovered) || isMobileOpen;
  const currentWidth = isExpanded ? expandedWidth : COLLAPSED_WIDTH;

  useEffect(() => {
    setIsMounted(true);
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
    const savedCollapsed = localStorage.getItem('sidebar_collapsed');
    const savedWidth = localStorage.getItem('sidebar_expanded_width');
    if (savedCollapsed !== null) setIsCollapsed(savedCollapsed === 'true');
    if (savedWidth !== null) setExpandedWidth(parseInt(savedWidth));

    const handleMobileToggle = () => setIsMobileOpen(prev => !prev);
    window.addEventListener('sidebar-mobile-toggle', handleMobileToggle);
    return () => window.removeEventListener('sidebar-mobile-toggle', handleMobileToggle);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sidebar_collapsed', String(isCollapsed));
      const event = new CustomEvent('sidebar-toggle', { detail: { isCollapsed, isHovered, width: currentWidth } });
      window.dispatchEvent(event);
    }
  }, [isCollapsed, isHovered, currentWidth, isMounted]);

  // Handle Resizing
  const startPosRef = useRef<{ x: number; isDragging: boolean }>({ x: 0, isDragging: false });

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startPosRef.current = { x: e.clientX, isDragging: false };
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    startPosRef.current.isDragging = false;
    localStorage.setItem('sidebar_expanded_width', String(expandedWidth));
  }, [expandedWidth]);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && isExpanded) {
      // Hanya update jika pergeseran mouse > 3px agar tidak mengganggu double-click
      if (Math.abs(e.clientX - startPosRef.current.x) > 3) {
        startPosRef.current.isDragging = true;
      }
      if (startPosRef.current.isDragging) {
        const newWidth = e.clientX;
        if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setExpandedWidth(newWidth);
      }
    }
  }, [isResizing, isExpanded]);

  // Double-click resizer: auto-fit width agar pas dengan isi teks (bisa membesar atau mengecil)
  const autoFitWidth = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!navRef.current) return;

    const measurer = document.createElement('span');
    measurer.style.position = 'fixed';
    measurer.style.left = '-9999px';
    measurer.style.top = '0';
    measurer.style.visibility = 'hidden';
    measurer.style.whiteSpace = 'nowrap';
    document.body.appendChild(measurer);

    let maxRequiredWidth = MIN_WIDTH;

    // Ukur semua tombol dan link di dalam navigasi
    const rows = navRef.current.querySelectorAll<HTMLElement>('a, button');
    rows.forEach(row => {
      const textSpan = row.querySelector<HTMLElement>('.truncate') ?? row.querySelector<HTMLElement>('span:last-child');
      const text = (textSpan?.textContent ?? '').trim();
      if (!text) return;

      const cs = window.getComputedStyle(textSpan ?? row);
      measurer.style.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      measurer.textContent = text;
      const textW = measurer.getBoundingClientRect().width;

      // Hitung indentasi dari accordion bertingkat
      let indent = 0;
      let p = row.parentElement;
      while (p && p !== navRef.current) {
        if (p.classList.contains('border-l-2')) indent += 26;
        p = p.parentElement;
      }

      // Overhead: padding nav (24px) + padding row (24px) + icon (18px) + chevron/gap (32px) + scrollbar (18px) = 116px
      const total = indent + 116 + Math.ceil(textW);
      if (total > maxRequiredWidth) {
        maxRequiredWidth = total;
      }
    });

    document.body.removeChild(measurer);

    const fitWidth = Math.min(Math.max(maxRequiredWidth, MIN_WIDTH), MAX_WIDTH);
    setExpandedWidth(fitWidth);
    localStorage.setItem('sidebar_expanded_width', String(fitWidth));
  }, []);

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
      const timer = setTimeout(() => {
        const activeItem = navRef.current?.querySelector('.sidebar-active');
        if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pathname, isMounted]);

  // Tutup panel popup profil jika sidebar menciut (auto collapse)
  useEffect(() => {
    if (!isExpanded) {
      setIsProfileOpen(false);
    }
  }, [isExpanded]);

  // Reset manual toggles — active menus reopen via isActive fallback
  useEffect(() => {
    setIsMobileOpen(false);
    setIsHovered(false);
    setIsProfileOpen(false);
    setOpenMenuIds(new Set());
  }, [pathname]);


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

  const canAccess = (moduleKey: string): boolean => {
    if (user?.role === 'Super Admin') return true;
    if (Object.keys(permissions).length === 0) return false;
    return permissions[moduleKey] === true;
  };

  const hasDataDigitAccess = user?.role === 'Super Admin' ||
    MODULE_REGISTRY.some(m => m.group.startsWith('Data Digit') && permissions[m.key] === true);

  const hasSistemAccess = user?.role === 'Super Admin' ||
    canAccess('activity_log') ||
    MODULE_REGISTRY.some(m => m.group.startsWith('Sistem') && permissions[m.key] === true);

  const isAnyChildActive = (item: MenuItem): boolean => {
    if (item.href && checkIsActive(item.href, item.exact)) return true;
    if (item.items && item.items.length > 0) return item.items.some(c => isAnyChildActive(c));
    return false;
  };

  const navItemClasses = (href: string) => {
    const isActive = checkIsActive(href);
    return `
      group flex items-center gap-3 px-3 h-9 rounded-[8px] transition-all text-[12.5px] font-semibold
      ${!isExpanded ? 'justify-center px-0 w-9 mx-auto' : 'w-full'}
      ${isActive ? 'bg-emerald-50 text-emerald-600 font-black sidebar-active' : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'}
    `;
  };

  const SectionLabel = ({ label }: { label: string }) => {
    if (!isExpanded) return <div className="h-px bg-gray-100 mx-2 my-4 first:hidden" />;
    return (
      <h2 className="px-3 text-[11px] font-bold text-gray-400 tracking-wide mt-6 mb-2 truncate first:mt-0">
        {label}
      </h2>
    );
  };

  const sidebarCtxValue: SidebarContextValue = {
    isExpanded,
    isCollapsed,
    openMenuIds,
    toggleMenuId,
    resetMenuIds,
    checkIsActive,
    isAnyChildActive,
  };

  return (
    <SidebarContext.Provider value={sidebarCtxValue}>
    {isMobileOpen && (
      <div
        className="fixed inset-0 h-full w-full bg-slate-900/40 backdrop-blur-sm z-[90] xl:hidden animate-in fade-in duration-300"
        onClick={() => setIsMobileOpen(false)}
      />
    )}

    <aside
      ref={sidebarRef}
      onMouseEnter={() => !isTouchDevice && isCollapsed && !isResizing && setIsHovered(true)}
      onMouseLeave={() => { if (!isTouchDevice && !isResizing) setIsHovered(false); }}
      style={{ width: currentWidth }}
      className={`
        fixed xl:sticky top-0 h-full bg-white border-r border-gray-100 shrink-0 flex flex-col z-[100]
        ${isMobileOpen ? 'translate-x-0 shadow-2xl opacity-100 visible' : '-translate-x-full xl:translate-x-0 xl:opacity-100 xl:visible opacity-0 invisible'}
        ${isResizing ? '' : 'transition-[width,transform,opacity,visibility] duration-300 ease-in-out'}
      `}
    >
      {/* Resizer Handle */}
      {isExpanded && (
        <div
          onMouseDown={startResizing}
          onDoubleClick={autoFitWidth}
          title="Drag untuk resize · Double-click untuk auto-fit"
          className="absolute -right-1.5 top-0 w-3 h-full cursor-col-resize z-30 group"
        >
          <div className={`w-0.5 h-full mx-auto transition-colors ${isResizing ? 'bg-emerald-500' : 'group-hover:bg-emerald-200'}`} />
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
                  <p className="text-[11px] text-gray-400 font-bold mt-1 tracking-wide truncate">PT. Buya Barokah</p>
                </div>
              </div>
              <div className="mt-4 px-3.5 py-1 rounded-[8px] border border-gray-100 inline-flex w-fit bg-gray-50/50">
                <span className="text-[11px] font-bold text-gray-400">Div. Percetakan</span>
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
        onClick={() => { setIsCollapsed(!isCollapsed); setIsHovered(false); }}
        className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-sm hover:text-emerald-600 z-50 transition-all xl:flex hidden ${
          (!isExpanded && isCollapsed && !isTouchDevice) ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <nav ref={navRef} className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-4 pb-2 custom-scrollbar">

        {/* DASHBOARD */}
        {(canAccess('dashboard') || canAccess('produksi_dashboard') || canAccess('hrd_dashboard') || canAccess('akt_dashboard')) && (
          <AccordionMenu
            label="Dashboard"
            icon={<LayoutDashboard size={18} />}
            items={[
              ...(canAccess('dashboard') ? [{ label: 'Dashboard Umum', href: '/dashboard', icon: <LayoutDashboard size={16} /> }] : []),
              ...(canAccess('hrd_dashboard') ? [{ label: 'Dashboard HRD', href: '/dashboard-hrd', icon: <Users size={16} /> }] : []),
              ...(canAccess('produksi_dashboard') ? [{ label: 'Dashboard Produksi', href: '/dashboard-manufaktur', icon: <Monitor size={16} /> }] : []),
              ...(canAccess('akt_dashboard') ? [{ label: 'Dashboard Akuntansi', href: '/dashboard-akunting', icon: <BarChart2 size={16} /> }] : []),
            ]}
          />
        )}

        {/* DATA DIGIT */}
        {hasDataDigitAccess && (
          <>
            <SectionLabel label="DATA DIGIT" />
            <div className="space-y-1">
              {canAccess('sync') && (
                <Link href="/sync" className={navItemClasses('/sync')} title={!isExpanded ? 'Sinkronisasi All Data' : ''}>
                  <RefreshCw size={18} />
                  {isExpanded && <span className="truncate">Sinkronisasi All Data</span>}
                </Link>
              )}

              {/* STOK */}
              {canAccess('stok_master_barang') && (
                <AccordionMenu
                  id="stok-digit"
                  label="Stok"
                  icon={<Box size={18} />}
                  items={[
                    {
                      label: 'Data',
                      icon: <Database size={16} />,
                      items: [
                        { label: 'Master Barang', href: '/data-digit/stok/master-barang', icon: <Box size={14} /> },
                      ]
                    },
                  ]}
                />
              )}

              {/* PEMBELIAN */}
              {(canAccess('pembelian_pr') || canAccess('pembelian_spph') || canAccess('pembelian_sph_in') ||
                canAccess('pembelian_po') || canAccess('pembelian_penerimaan') || canAccess('pembelian_rekap') ||
                canAccess('pembelian_hutang')) && (
                <AccordionMenu
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
              )}

              {/* PRODUKSI */}
              {(canAccess('produksi_bom') || canAccess('produksi_orders') || canAccess('produksi_selesai') || canAccess('produksi_bahan_baku') || canAccess('produksi_barang_jadi')) && (
                <AccordionMenu
                  id="produksi-digit"
                  label="Produksi"
                  icon={<Package size={18} />}
                  items={[
                    ...(canAccess('produksi_bom') ? [{ label: 'Bill of Material Produksi', href: '/bom', icon: <Calculator size={16} /> }] : []),
                    ...(canAccess('produksi_orders') ? [{ label: 'Order Produksi', href: '/orders', icon: <ClipboardList size={16} /> }] : []),
                    ...(canAccess('produksi_selesai') ? [{ label: 'Produksi Selesai', href: '/data-digit/produksi/produksi-selesai', icon: <CheckCircle size={16} /> }] : []),
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
              )}

              {/* PENJUALAN */}
              {(canAccess('penjualan_sph_out') || canAccess('penjualan_so') || canAccess('penjualan_laporan') ||
                canAccess('penjualan_piutang') || canAccess('penjualan_pengiriman')) && (
                <AccordionMenu
                  id="penjualan-digit"
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
              )}

              {/* AKUNTANSI */}
              {(canAccess('akt_jurnal_umum') || canAccess('akt_mrek')) && (
                <AccordionMenu
                  label="Akuntansi & Keuangan"
                  icon={<BookOpen size={18} />}
                  items={[
                    ...(canAccess('akt_mrek') ? [{
                      label: 'Data',
                      icon: <Database size={16} />,
                      items: [{ label: 'Rek Akuntansi', href: '/akuntansi/data/rek-akuntansi', icon: <Database size={14} /> }]
                    }] : []),
                    ...(canAccess('akt_jurnal_umum') ? [{
                      label: 'Laporan',
                      icon: <BarChart3 size={16} />,
                      items: [{ label: 'Jurnal Umum', href: '/akuntansi/laporan/jurnal-umum', icon: <FileText size={14} /> }]
                    }] : []),
                  ]}
                />
              )}

              {/* SISTEM (DATA DIGIT) */}
              {canAccess('usr_log_view') && (
                <AccordionMenu
                  id="sistem-digit"
                  label="Sistem"
                  icon={<Monitor size={18} />}
                  items={[{
                    label: 'Log Aktivitas User',
                    href: '/data-digit/sistem/log-aktivitas-user',
                    icon: <History size={16} />,
                  }]}
                />
              )}
            </div>
          </>
        )}

        {/* SISTEM */}
        {hasSistemAccess && (
          <>
            <SectionLabel label="SISTEM" />

            {(canAccess('tracking_manufaktur') || canAccess('activity_log_view') || canAccess('activity_log')) && (
              <AccordionMenu
                label="Umum"
                icon={<Monitor size={18} />}
                items={[
                  ...(canAccess('tracking_manufaktur') ? [{ label: 'Tracking Manufaktur', href: '/tracking-manufaktur', icon: <Search size={16} /> }] : []),
                  ...((canAccess('activity_log_view') || canAccess('activity_log'))
                    ? [{ label: 'Log Aktivitas', href: '/log-aktivitas', icon: <History size={16} /> }]
                    : []),
                ]}
              />
            )}

            {(canAccess('karyawan') || canAccess('catat_kesalahan')) && (
              <AccordionMenu
                label="HRD"
                icon={<Users size={18} />}
                items={[
                  ...(canAccess('karyawan') ? [{
                    label: 'Data',
                    icon: <Database size={16} />,
                    items: [{ label: 'Karyawan', href: '/employees', icon: <Users size={14} /> }]
                  }] : []),
                  ...(canAccess('catat_kesalahan') ? [{ label: 'Catat Kesalahan Karyawan', href: '/records', icon: <ClipboardCheck size={16} /> }] : []),
                ]}
              />
            )}

            {(canAccess('hpp_kalkulasi') || canAccess('pricelist_kalkulasi')) && (
              <AccordionMenu
                label="Kalkulasi"
                icon={<Calculator size={18} />}
                items={[
                  ...(canAccess('hpp_kalkulasi') ? [{
                    label: 'Data',
                    icon: <Database size={16} />,
                    items: [
                      { label: 'HPP Kalkulasi', href: '/hpp-kalkulasi', icon: <Calculator size={14} /> },
                    ]
                  }] : []),
                  ...(canAccess('pricelist_kalkulasi') ? [{ label: 'Pricelist', href: '/pricelist', icon: <FileSpreadsheet size={16} /> }] : []),
                ]}
              />
            )}

            {(canAccess('produksi_jhp_sopd') || canAccess('produksi_jhp_master_pekerjaan') || canAccess('produksi_jhp_master_pekerjaan_jurnal_produksi') || canAccess('produksi_jhp') || canAccess('produksi_jhp_target') || canAccess('produksi_hasil') || canAccess('produksi_jhp_analisa') || canAccess('produksi_laporan_pekerjaan')) && (
              <AccordionMenu
                id="produksi-sistem"
                label="Produksi"
                icon={<Package size={18} />}
                items={[
                  ...((canAccess('produksi_jhp_sopd') || canAccess('produksi_jhp_master_pekerjaan') || canAccess('produksi_jhp_master_pekerjaan_jurnal_produksi') || canAccess('produksi_jhp') || canAccess('produksi_jhp_target') || canAccess('produksi_jhp_analisa')) ? [{
                    label: 'Jurnal Harian Produksi',
                    icon: <ClipboardList size={16} />,
                    items: [
                      ...(canAccess('produksi_jhp_sopd') || canAccess('produksi_jhp_master_pekerjaan') || canAccess('produksi_jhp_master_pekerjaan_jurnal_produksi') ? [{
                        label: 'Data',
                        icon: <Database size={14} />,
                        items: [
                          ...(canAccess('produksi_jhp_sopd') ? [{ label: 'SOPd', href: '/jurnal-harian-produksi/data/excel-sopd', icon: <FileText size={12} /> }] : []),
                          ...(canAccess('produksi_jhp_master_pekerjaan') ? [{ label: 'Master Pekerjaan', href: '/jurnal-harian-produksi/data/master-pekerjaan', icon: <Database size={12} /> }] : []),
                          ...(canAccess('produksi_jhp_master_pekerjaan_jurnal_produksi') ? [{ label: 'Master Pekerjaan Jurnal Produksi', href: '/jurnal-harian-produksi/data/master-pekerjaan-jurnal-produksi', icon: <Database size={12} /> }] : []),
                        ]
                      }] : []),
                      ...(canAccess('produksi_jhp') ? [{ label: 'Jurnal Harian Produksi', href: '/jurnal-harian-produksi', icon: <ClipboardList size={14} />, exact: true }] : []),
                      ...(canAccess('produksi_jhp_target') ? [{ label: 'Target Harian', href: '/jurnal-harian-produksi/target', icon: <TrendingUp size={14} /> }] : []),
                      ...(canAccess('produksi_jhp_analisa') ? [{ label: 'Analisa Produksi', href: '/jurnal-harian-produksi/analisa', icon: <BarChart2 size={14} /> }] : []),
                    ]
                  }] : []),
                  ...(canAccess('produksi_hasil') ? [{ label: 'Hasil Produksi', href: '/hasil-produksi', icon: <BarChart3 size={16} /> }] : []),
                  ...(canAccess('produksi_laporan_pekerjaan') ? [{ label: 'Laporan Pekerjaan', href: '/laporan-pekerjaan', icon: <FileSpreadsheet size={16} /> }] : []),
                ]}
              />
            )}

            {canAccess('kalkulasi_rekap_so') && (
              <AccordionMenu
                id="penjualan-sistem"
                label="Penjualan"
                icon={<TrendingUp size={18} />}
                items={[{ label: 'Rekap Sales Order Barang', href: '/rekap-sales-order', icon: <FileCheck size={16} /> }]}
              />
            )}

            {(user?.role === 'Super Admin' || canAccess('telegram_users')) && (
              <AccordionMenu
                label="Telegram"
                icon={<MessageSquare size={18} />}
                items={[
                  { label: 'Telegram Users', href: '/settings/telegram-users', icon: <MessageSquare size={14} /> },
                ]}
              />
            )}

            {user?.role === 'Super Admin' && (
              <AccordionMenu
                label="User"
                icon={<Settings size={18} />}
                items={[
                  { label: 'Hak Akses', href: '/roles', icon: <ShieldCheck size={16} /> },
                  { label: 'Kelola User', href: '/users', icon: <UserCog size={16} /> },
                ]}
              />
            )}

            {user?.role === 'Super Admin' && (
              <AccordionMenu
                label="Settings"
                icon={<Database size={18} />}
                items={[{
                  label: 'Konversi Data',
                  icon: <RefreshCw size={16} />,
                  items: [
                    {
                      label: 'Kalkulasi',
                      icon: <Calculator size={14} />,
                      items: [{
                        label: 'Data',
                        icon: <Database size={12} />,
                        items: [{ label: 'HPP Kalkulasi', href: '/settings/konversi-data/kalkulasi/hpp-kalkulasi', icon: <Calculator size={12} />, exact: true }]
                      }]
                    },
                    {
                      label: 'Produksi',
                      icon: <Package size={14} />,
                      items: [
                        { label: 'SOPd & Jurnal Harian', href: '/settings/konversi-data/jurnal-harian-produksi', icon: <ClipboardList size={12} />, exact: true },
                        { label: 'Laporan Pekerjaan', href: '/settings/konversi-data/laporan-pekerjaan', icon: <FileSpreadsheet size={12} />, exact: true }
                      ]
                    }
                  ]
                }]}
              />
            )}
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="mt-auto border-t border-gray-100 p-3 bg-gray-50/50 relative z-10" ref={profileRef}>
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`w-full flex items-center gap-3 p-2 rounded-[8px] transition-all hover:bg-white hover:shadow-sm ${
                isProfileOpen ? 'bg-white shadow-sm ring-1 ring-black/5' : ''
              } ${!isExpanded ? 'justify-center p-1' : ''}`}
            >
              <div className="w-8 h-8 rounded-[8px] bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0 border border-emerald-200">
                {user.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-emerald-600" />
                )}
              </div>
              {isExpanded && (
                <div className="flex flex-col min-w-0 text-left">
                  <p className="text-[12px] font-bold text-gray-700 truncate leading-none">{user.name}</p>
                  <p className="text-[11px] text-gray-400 font-bold mt-1 truncate">
                    {user.roles && user.roles.length > 0
                      ? user.roles.join(', ')
                      : (user.role || '')}
                  </p>
                </div>
              )}
            </button>
            {isProfileOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-full bg-white rounded-[8px] shadow-sm border border-gray-100 p-1.5 animate-in fade-in slide-in-from-bottom-2 z-50">
                <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-gray-600 hover:bg-gray-50 rounded-[8px] transition-colors">
                  <Settings size={14} />
                  <span>Pengaturan Profil</span>
                </Link>
                <Link href="/log-perubahan" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-gray-600 hover:bg-gray-50 rounded-[8px] transition-colors">
                  <Sparkles size={14} />
                  <span>Log Perubahan</span>
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
// AccordionMenu — top-level menu item dengan accordion
// Mode collapsed: ikon saja
// Mode expanded: accordion inline, auto-buka jika child aktif
// =============================================================================
function AccordionMenu({
  id,
  label,
  icon,
  items,
}: {
  id?: string;
  label: string;
  icon: React.ReactNode;
  items: MenuItem[];
}) {
  const { isExpanded, isCollapsed, openMenuIds, toggleMenuId, resetMenuIds, isAnyChildActive } = useSidebarCtx();
  const menuId = id ?? label;
  const isActive = items.some(item => isAnyChildActive(item));
  const isOpen = openMenuIds.has(menuId) || isActive;

  // Tutup semua saat sidebar di-collapse
  useEffect(() => {
    if (isCollapsed) resetMenuIds();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCollapsed]);


  // Mode collapsed: ikon saja
  if (!isExpanded) {
    return (
      <div className="flex justify-center my-0.5">
        <div
          className={`w-9 h-9 flex items-center justify-center rounded-[8px] transition-all
            ${isActive ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'}
          `}
        >
          <span className={isActive ? 'text-emerald-600' : ''}>{icon}</span>
        </div>
      </div>
    );
  }

  // Mode expanded: accordion
  return (
    <div className="mb-0.5">
      <button
        onClick={() => toggleMenuId(menuId)}
        className={`
          group flex items-center gap-3 px-3 h-9 rounded-[8px] transition-all text-[12.5px] font-semibold w-full
          ${isActive && !isOpen ? 'bg-emerald-50 text-emerald-600' : isOpen ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'}
        `}
      >
        <span className={`transition-colors shrink-0 ${isOpen ? 'text-emerald-700' : isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-600'}`}>
          {icon}
        </span>
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-emerald-600' : isActive ? 'text-emerald-500' : 'text-gray-300'}`}
        />
      </button>

      {isOpen && (

        <div className="mt-0.5 ml-3 pl-3 border-l-2 border-gray-100 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {items.map(item => (
            <AccordionItem key={item.label} item={item} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// AccordionItem — item rekursif di dalam AccordionMenu
// =============================================================================
function AccordionItem({ item, depth }: { item: MenuItem; depth: number }) {
  const { checkIsActive, isAnyChildActive } = useSidebarCtx();
  const hasSub = item.items && item.items.length > 0;
  const isActive = item.href ? checkIsActive(item.href, item.exact) : false;
  const isChildActive = isAnyChildActive(item);
  // localOpen: toggle manual oleh user, reset saat tidak ada child aktif
  const [localOpen, setLocalOpen] = useState(false);
  // isOpen: child aktif (live) ATAU dibuka manual
  const isOpen = isChildActive || localOpen;

  // Reset localOpen saat tidak ada child aktif lagi (pindah halaman)
  useEffect(() => {
    if (!isChildActive) setLocalOpen(false);
  }, [isChildActive]);

  if (item.href && !hasSub) {
    return (
      <Link
        href={item.href}
        className={`
          flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[12px] font-bold transition-all w-full
          ${isActive ? 'bg-emerald-50 text-emerald-600 font-black sidebar-active' : 'text-gray-500 hover:bg-gray-50 hover:text-emerald-600'}
        `}
      >
        <span className={`shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>{item.icon}</span>
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setLocalOpen(prev => !prev)}
        className={`
          flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[12px] font-bold transition-all w-full
          ${isOpen ? 'bg-emerald-100 text-emerald-700' : isChildActive ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:bg-gray-50 hover:text-emerald-600'}
        `}
      >
        <span className={`shrink-0 ${isOpen ? 'text-emerald-700' : isChildActive ? 'text-emerald-600' : 'text-gray-400'}`}>{item.icon}</span>
        <span className="flex-1 text-left truncate">{item.label}</span>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : isChildActive ? 'text-emerald-500' : 'text-gray-300'}`}
        />
      </button>
      {isOpen && (
        <div className={`mt-0.5 ${depth < 2 ? 'ml-3 pl-3 border-l-2 border-gray-100' : 'ml-2 pl-2'} space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150`}>
          {item.items?.map(sub => (
            <AccordionItem key={sub.label} item={sub} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
