'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, CheckCircle2, XCircle,
  Loader2, ChevronRight, UserCog, Plus, Pencil, Save, Trash2,
  AlertCircle, X, SlidersHorizontal, Layers, Users, Columns, Search, CheckSquare, Square, UserX, ShieldX
} from 'lucide-react';
import { saveRolePermissions, addRole, updateRole, deleteRole } from '@/lib/permissions-actions';
import { MODULE_REGISTRY } from '@/lib/permissions-constants';
import type { PermissionMap } from '@/lib/permissions-constants';
import {
  LAPORAN_PEKERJAAN_COLUMNS,
  LAPORAN_PEKERJAAN_BAGIAN_LIST,
  type RoleLaporanPekerjaanConfig,
} from '@/lib/permissions-laporan-pekerjaan-constants';
import { saveRoleLaporanPekerjaanConfig } from '@/lib/permissions-laporan-pekerjaan-actions';
import PageHeader from '@/components/PageHeader';

export interface CustomRole {
  name: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}

interface RolesContentProps {
  allPermissions: Record<string, PermissionMap>;
  customRoles: CustomRole[];
  allLaporanConfigs?: Record<string, RoleLaporanPekerjaanConfig>;
  availablePics?: string[];
}

const GROUP_COLORS: Record<string, { text: string; bg: string; dot: string }> = {
  'Dashboard':                        { text: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  'Data Digit':                       { text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  'Data Digit - Pembelian':           { text: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  'Data Digit - Produksi':            { text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  'Data Digit - Penjualan':           { text: 'text-indigo-700',  bg: 'bg-indigo-50',  dot: 'bg-indigo-500' },
  'Sistem':                           { text: 'text-slate-700',   bg: 'bg-slate-50',   dot: 'bg-slate-500' },
  'Sistem - Umum':                    { text: 'text-slate-700',   bg: 'bg-slate-50',   dot: 'bg-slate-500' },
  'Sistem - HRD':                     { text: 'text-rose-700',    bg: 'bg-rose-50',    dot: 'bg-rose-500' },
  'Sistem - Kalkulasi':               { text: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-500' },
  'Sistem - Produksi':                { text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  'Sistem - Penjualan':               { text: 'text-indigo-700',  bg: 'bg-indigo-50',  dot: 'bg-indigo-500' },
  'Sistem - User':                    { text: 'text-slate-700',   bg: 'bg-slate-50',   dot: 'bg-slate-500' },
  'Sistem - Settings':                { text: 'text-violet-700',  bg: 'bg-violet-50',  dot: 'bg-violet-500' },
};

export default function RolesContent({
  allPermissions,
  customRoles,
  allLaporanConfigs = {},
  availablePics = [],
}: RolesContentProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, PermissionMap>>(() =>
    JSON.parse(JSON.stringify(allPermissions))
  );
  const [laporanConfigs, setLaporanConfigs] = useState<Record<string, RoleLaporanPekerjaanConfig>>(() =>
    JSON.parse(JSON.stringify(allLaporanConfigs))
  );
  const [configModalRole, setConfigModalRole] = useState<string | null>(null);

  useEffect(() => {
    setPermissions(JSON.parse(JSON.stringify(allPermissions)));
    setLaporanConfigs(JSON.parse(JSON.stringify(allLaporanConfigs)));
    setSelectedRole(prev => {
      if (!prev) return '';
      if (prev === 'Super Admin') return prev;
      if (!customRoles.some(r => r.name === prev)) return '';
      return prev;
    });
  }, [allPermissions, customRoles, allLaporanConfigs]);

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, Record<string, boolean>>>({});

  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDesc, setEditRoleDesc] = useState('');
  const editFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingRole) {
      editFormRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [editingRole]);

  // Confirm delete dialog
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sintak_roles_collapsed');
      if (stored) setCollapsedGroups(JSON.parse(stored));
    } catch {}
  }, []);

  const toggleCollapse = (group: string, currentIsCollapsed: boolean) => {
    if (!selectedRole) return;
    setCollapsedGroups(prev => {
      const roleCollapsed = prev[selectedRole] || {};
      const next = { ...prev, [selectedRole]: { ...roleCollapsed, [group]: !currentIsCollapsed } };
      try { localStorage.setItem('sintak_roles_collapsed', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const showResult = (type: 'success' | 'error', msg: string) => {
    setResult({ type, msg });
    setTimeout(() => setResult(null), 3000);
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    setSaving(true);
    const res = await addRole(newRoleName, newRoleDesc);
    setSaving(false);
    if (res.success) {
      showResult('success', 'Role ditambahkan');
      setIsAddingRole(false);
      setNewRoleName('');
      setNewRoleDesc('');
      setSelectedRole(newRoleName.trim());
      router.refresh();
    } else {
      showResult('error', res.message || 'Gagal menambah role');
    }
  };

  const handleUpdateRole = async () => {
    if (!editRoleName.trim() || !editingRole) return;
    setSaving(true);
    const res = await updateRole(editingRole, editRoleName, editRoleDesc);
    setSaving(false);
    if (res.success) {
      showResult('success', 'Role diperbarui');
      if (selectedRole === editingRole) setSelectedRole(editRoleName.trim());
      setEditingRole(null);
      router.refresh();
    } else {
      showResult('error', res.message || 'Gagal mengubah role');
    }
  };

  const handleDeleteRole = async (role: string) => {
    setSaving(true);
    const res = await deleteRole(role);
    setSaving(false);
    if (res.success) {
      showResult('success', 'Role dihapus');
      if (selectedRole === role) {
        const next = customRoles.find(r => r.name !== role)?.name || '';
        setSelectedRole(next);
      }
      router.refresh();
    } else {
      showResult('error', res.message || 'Gagal menghapus role');
    }
    setDeleteConfirm(null);
  };

  const currentRoleMeta = customRoles.find(r => r.name === selectedRole) || {
    name: selectedRole, description: '', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200'
  };

  const groupedModules = useMemo(() => {
    const groups: Record<string, typeof MODULE_REGISTRY[number][]> = {};
    for (const m of MODULE_REGISTRY) {
      let g: string = m.group;
      if (g.startsWith('Data Digit - ')) g = 'Data Digit';
      if (g.startsWith('Sistem - ')) g = 'Sistem';
      if (!groups[g]) groups[g] = [];
      groups[g].push(m);
    }
    return groups;
  }, []);

  const currentRoleCollapsed = collapsedGroups[selectedRole] || {};

  const togglePermission = async (moduleKey: string) => {
    const newValue = !(permissions[selectedRole]?.[moduleKey] ?? false);
    const updatedRolePerms = { ...permissions[selectedRole], [moduleKey]: newValue };
    setPermissions(prev => ({ ...prev, [selectedRole]: updatedRolePerms }));
    setSaving(true);
    const res = await saveRolePermissions(selectedRole, updatedRolePerms);
    setSaving(false);
    if (!res.success) {
      showResult('error', res.message || 'Gagal menyimpan.');
      setPermissions(permissions);
    } else {
      showResult('success', 'Tersimpan');
    }
  };

  const toggleKeysList = async (keys: string[], value: boolean) => {
    const updatedRolePerms = { ...permissions[selectedRole] };
    for (const k of keys) updatedRolePerms[k] = value;
    setPermissions(prev => ({ ...prev, [selectedRole]: updatedRolePerms }));
    setSaving(true);
    const res = await saveRolePermissions(selectedRole, updatedRolePerms);
    setSaving(false);
    if (!res.success) {
      showResult('error', res.message || 'Gagal menyimpan.');
      setPermissions(permissions);
    } else {
      showResult('success', 'Tersimpan');
    }
  };

  const toggleGroup = (group: string, value: boolean) => {
    const keys = (groupedModules[group] || []).map(m => m.key);
    toggleKeysList(keys, value);
  };

  const getGroupStats = (role: string, group: string) => {
    const keys = (groupedModules[group] || []).map(m => m.key);
    return { enabled: keys.filter(k => permissions[role]?.[k]).length, total: keys.length };
  };

  const getTotalStats = (role: string) => {
    const total = MODULE_REGISTRY.length;
    const enabled = MODULE_REGISTRY.filter(m => permissions[role]?.[m.key]).length;
    return { enabled, total };
  };

  const collectKeys = (items: any[]): string[] =>
    items.flatMap(item => item.type === 'leaf' ? [item.key] : collectKeys(item.children));

  // ─── Tree data definitions ────────────────────────────────────────────────
  const ddTree: any[] = [
    { type: 'leaf', key: 'sync', label: 'Sinkronisasi All Data' },
    { type: 'node', label: 'Pembelian', colorKey: 'Data Digit - Pembelian', children: [
      { type: 'leaf', key: 'pembelian_pr', label: 'Purchase Request (PR)' },
      { type: 'leaf', key: 'pembelian_spph', label: 'SPPH Keluar' },
      { type: 'leaf', key: 'pembelian_sph_in', label: 'SPH Masuk' },
      { type: 'leaf', key: 'pembelian_po', label: 'Purchase Order (PO)' },
      { type: 'leaf', key: 'pembelian_penerimaan', label: 'Penerimaan Barang' },
      { type: 'leaf', key: 'pembelian_rekap', label: 'Rekap Pembelian Barang' },
      { type: 'leaf', key: 'pembelian_hutang', label: 'Pelunasan Hutang' },
    ]},
    { type: 'node', label: 'Produksi', colorKey: 'Data Digit - Produksi', children: [
      { type: 'leaf', key: 'produksi_bom', label: 'BOM Produksi' },
      { type: 'leaf', key: 'produksi_orders', label: 'Order Produksi' },
      { type: 'leaf', key: 'produksi_bahan_baku', label: 'BBB Produksi' },
      { type: 'leaf', key: 'produksi_barang_jadi', label: 'Penerimaan Barang Hasil Produksi' },
    ]},
    { type: 'node', label: 'Penjualan', colorKey: 'Data Digit - Penjualan', children: [
      { type: 'leaf', key: 'penjualan_sph_out', label: 'SPH Keluar (Penjualan)' },
      { type: 'leaf', key: 'penjualan_so', label: 'Sales Order Barang' },
      { type: 'leaf', key: 'penjualan_laporan', label: 'Laporan Penjualan' },
      { type: 'leaf', key: 'penjualan_piutang', label: 'Pelunasan Piutang' },
      { type: 'leaf', key: 'penjualan_pengiriman', label: 'Pengiriman (SJ)' },
    ]},
    { type: 'node', label: 'Akuntansi & Keuangan', colorKey: 'Data Digit - Akuntansi', children: [
      { type: 'leaf', key: 'akt_mrek', label: 'Rek Akuntansi' },
      { type: 'leaf', key: 'akt_jurnal_umum', label: 'Jurnal Umum' },
    ]},
    { type: 'node', label: 'Stok', colorKey: 'Data Digit - Stok', children: [
      { type: 'leaf', key: 'stok_master_barang', label: 'Master Barang' },
    ]},
  ];

  const sistemTree: any[] = [
    { type: 'node', label: 'Umum', colorKey: 'Sistem - Umum', children: [
      { type: 'leaf', key: 'karyawan', label: 'Karyawan' },
      { type: 'leaf', key: 'tracking_manufaktur', label: 'Tracking Manufaktur' },
    ]},
    { type: 'node', label: 'HRD', colorKey: 'Sistem - HRD', children: [
      { type: 'leaf', key: 'catat_kesalahan', label: 'Catat Kesalahan' },
    ]},
    { type: 'node', label: 'Kalkulasi', colorKey: 'Sistem - Kalkulasi', children: [
      { type: 'leaf', key: 'hpp_kalkulasi', label: 'HPP Kalkulasi' },
      { type: 'leaf', key: 'pricelist_kalkulasi', label: 'Pricelist' },
    ]},
    { type: 'node', label: 'Produksi', colorKey: 'Sistem - Produksi', children: [
      { type: 'leaf', key: 'produksi_hasil', label: 'Hasil Produksi' },
      { type: 'leaf', key: 'produksi_laporan_pekerjaan', label: 'Laporan Pekerjaan' },
      { type: 'node', label: 'Jurnal Harian Produksi', children: [
        { type: 'leaf', key: 'produksi_jhp', label: 'Jurnal Harian Produksi' },
        { type: 'leaf', key: 'produksi_jhp_penjadwalan', label: 'Input Target (Penjadwalan)' },
        { type: 'leaf', key: 'produksi_jhp_realisasi', label: 'Input Realisasi' },
        { type: 'leaf', key: 'produksi_jhp_target', label: 'Target Harian' },
        { type: 'leaf', key: 'produksi_jhp_sopd', label: 'SOPd' },
        { type: 'leaf', key: 'produksi_jhp_master_pekerjaan', label: 'Master Pekerjaan' },
        { type: 'leaf', key: 'produksi_jhp_master_pekerjaan_jurnal_produksi', label: 'Master Pekerjaan Jurnal Produksi' },
      ]},
    ]},
    { type: 'node', label: 'Penjualan', colorKey: 'Sistem - Penjualan', children: [
      { type: 'leaf', key: 'kalkulasi_rekap_so', label: 'Rekap Sales Order Barang' },
    ]},
    { type: 'node', label: 'User', colorKey: 'Sistem - User', children: [
      { type: 'leaf', key: 'hak_akses', label: 'Hak Akses' },
      { type: 'leaf', key: 'kelola_user', label: 'Kelola User' },
    ]},
    { type: 'node', label: 'Settings', colorKey: 'Sistem - Settings', children: [
      { type: 'leaf', key: 'settings_konversi_data_hpp', label: 'Konversi Data - HPP Kalkulasi' },
      { type: 'leaf', key: 'settings_konversi_data', label: 'Konversi Data - JHP' },
    ]},
  ];

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderToggle = (isEnabled: boolean, onToggle: () => void) => (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onToggle(); }}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${isEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${isEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
    </button>
  );

  const renderLeaf = (item: any, depth: number) => {
    const isEnabled = permissions[selectedRole]?.[item.key] ?? false;
    const isLaporanPekerjaan = item.key === 'produksi_laporan_pekerjaan';
    const lpConfig = laporanConfigs[selectedRole];

    const hasCustomBagian = !!(lpConfig?.allowed_bagian && lpConfig.allowed_bagian.length > 0);
    const isLockedToMe = !!(lpConfig?.allowed_pic && lpConfig.allowed_pic.includes('@me'));
    const rolePics = (lpConfig?.allowed_pic || []).filter(p => p.startsWith('@role:')).map(p => p.slice(6));
    const excludedRolePics = (lpConfig?.excluded_pic || []).filter(p => p.startsWith('@role:')).map(p => p.slice(6));
    const excludedCustomPics = (lpConfig?.excluded_pic || []).filter(p => !p.startsWith('@'));
    const hasUnassigned = !!(lpConfig?.allowed_pic && (lpConfig.allowed_pic.includes('@unassigned') || lpConfig.allowed_pic.includes('Tanpa PIC')));
    const customPicNames = (lpConfig?.allowed_pic || []).filter(p => !p.startsWith('@') && p.toLowerCase() !== 'tanpa pic');
    const hasCustomPic = !!(lpConfig?.allowed_pic && lpConfig.allowed_pic.length > 0);
    const hasExcludedPic = !!(lpConfig?.excluded_pic && lpConfig.excluded_pic.length > 0);
    const hasCustomCols = !!(
      lpConfig?.visible_columns &&
      lpConfig.visible_columns.length > 0 &&
      lpConfig.visible_columns.length < LAPORAN_PEKERJAAN_COLUMNS.length
    );
    const deleteScope = lpConfig?.delete_scope || (lpConfig?.can_delete === false ? 'none' : 'all');
    const hasCustomActions = lpConfig?.can_add === false || lpConfig?.can_edit === false || deleteScope !== 'all';
    const hasCustomLp = hasCustomBagian || hasCustomPic || hasExcludedPic || hasCustomCols || hasCustomActions;

    const deleteLabel = deleteScope === 'none'
      ? null
      : deleteScope === 'table_only'
      ? 'Hapus (Tabel Utama Saja)'
      : deleteScope === 'card_only'
      ? 'Hapus (Card Detail Saja)'
      : 'Hapus (Semua)';

    const actionSummary = [
      lpConfig?.can_add !== false ? 'Tambah' : null,
      lpConfig?.can_edit !== false ? 'Edit' : null,
      deleteLabel,
    ].filter(Boolean).join(', ');

    let picSummary = 'Semua PIC';
    if (isLockedToMe && hasUnassigned) {
      picSummary = 'Kunci @me + Tanpa PIC';
    } else if (isLockedToMe) {
      picSummary = 'Kunci PIC @me';
    } else if (hasUnassigned && rolePics.length === 0 && customPicNames.length === 0) {
      picSummary = 'Hanya Tanpa PIC';
    } else if (rolePics.length > 0 && customPicNames.length === 0) {
      picSummary = `Role PIC: ${rolePics.join(', ')}${hasUnassigned ? ' + Tanpa PIC' : ''}`;
    } else if (rolePics.length > 0 && customPicNames.length > 0) {
      picSummary = `Role PIC (${rolePics.length}) + ${customPicNames.length} Nama${hasUnassigned ? ' + Tanpa PIC' : ''}`;
    } else if (customPicNames.length > 0) {
      picSummary = `${customPicNames.length} PIC${hasUnassigned ? ' + Tanpa PIC' : ''}`;
    }

    if (hasExcludedPic) {
      const excDesc = excludedRolePics.length > 0
        ? `Kecuali Role ${excludedRolePics.join(', ')}`
        : `Kecuali ${excludedCustomPics.length} Nama`;
      picSummary = `${picSummary} (${excDesc})`;
    }

    return (
      <div
        key={item.key}
        onClick={() => togglePermission(item.key)}
        className="group/row flex items-center justify-between py-2.5 pr-5 cursor-pointer hover:bg-emerald-50/40 transition-colors border-t border-gray-50"
        style={{ paddingLeft: `${20 + depth * 20}px` }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
          <span className={`w-1 h-1 rounded-full shrink-0 ${isEnabled ? 'bg-emerald-400' : 'bg-gray-200'}`} />
          <span className={`text-[12.5px] truncate transition-colors ${isEnabled ? 'text-gray-700 font-semibold' : 'text-gray-400 font-medium'}`}>
            {item.label}
          </span>
          {isLaporanPekerjaan && isEnabled && (
            <span
              className={`text-[10.5px] px-2 py-0.5 rounded-md font-medium border flex items-center gap-1 shrink-0 ${
                hasCustomLp
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
              title={
                hasCustomLp
                  ? `Filter Aktif: ${hasCustomBagian ? `${lpConfig.allowed_bagian.length} Bagian` : 'Semua Bagian'}, PIC: ${picSummary}, Aksi: [${actionSummary || 'Tanpa Aksi'}], ${lpConfig.visible_columns?.length || 9} Kolom`
                  : 'Akses penuh ke semua Bagian, PIC, Aksi, dan Kolom'
              }
            >
              <SlidersHorizontal size={10} className={hasCustomLp ? 'text-blue-600' : 'text-slate-400'} />
              {isLockedToMe ? 'Kunci PIC @me' : hasCustomLp ? `Hak: ${picSummary}` : 'Semua Bagian & PIC'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isLaporanPekerjaan && isEnabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfigModalRole(selectedRole);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-lg transition-colors shadow-xs"
              title="Atur Bagian, PIC, dan Kolom yang boleh diakses role ini"
            >
              <SlidersHorizontal size={12} />
              <span>Setting Filter & Kolom</span>
            </button>
          )}
          <span className={`text-[11px] font-bold w-8 text-right transition-colors ${isEnabled ? 'text-emerald-600' : 'text-gray-300'}`}>
            {isEnabled ? 'ON' : 'OFF'}
          </span>
          {renderToggle(isEnabled, () => togglePermission(item.key))}
        </div>
      </div>
    );
  };

  const renderNode = (item: any, depth: number): React.ReactNode => {
    const nodeKeys = collectKeys(item.children);
    const nodeEnabled = nodeKeys.filter(k => permissions[selectedRole]?.[k]).length;
    const collapseKey = `node-${item.label.replace(/\s+/g, '-').toLowerCase()}-${depth}`;
    const isCollapsed = currentRoleCollapsed[collapseKey] ?? (nodeEnabled === 0);
    const isTop = depth === 0;

    return (
      <div key={collapseKey} className="border-t border-gray-100">
        <div
          className={`flex items-center justify-between pr-5 cursor-pointer select-none transition-colors ${isTop ? 'py-3 bg-gray-50/60 hover:bg-gray-100/60' : 'py-2 hover:bg-gray-50/60'}`}
          style={{ paddingLeft: `${20 + depth * 20}px` }}
          onClick={() => toggleCollapse(collapseKey, isCollapsed)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ChevronRight size={14} className={`text-gray-400 shrink-0 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
            <span className={`truncate transition-colors ${isTop ? 'text-[12.5px] font-bold text-gray-700' : 'text-[12px] font-semibold text-gray-600'}`}>
              {item.label}
            </span>
            <span className={`shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded-full border ${nodeEnabled > 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-gray-400 bg-gray-50 border-gray-100'}`}>
              {nodeEnabled}/{nodeKeys.length}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggleKeysList(nodeKeys, true); }}
              className="text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-all"
            >On</button>
            <span className="text-gray-200 text-[11px]">|</span>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggleKeysList(nodeKeys, false); }}
              className="text-[11px] font-bold text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all"
            >Off</button>
          </div>
        </div>
        {!isCollapsed && (
          <div className="animate-in slide-in-from-top-1 fade-in duration-200">
            {item.children.map((child: any) =>
              child.type === 'leaf' ? renderLeaf(child, depth + 1) : renderNode(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTopGroup = (label: string, tree: any[], groupKey: string) => {
    const allKeys = Array.from(new Set(collectKeys(tree)));
    const allEnabled = allKeys.filter(k => permissions[selectedRole]?.[k]).length;
    const isCollapsed = currentRoleCollapsed[groupKey] ?? (allEnabled === 0);

    return (
      <div key={groupKey} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {/* Group Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-emerald-50 border-b border-gray-100 cursor-pointer select-none hover:from-emerald-100/60 hover:to-emerald-100/60 transition-colors"
          onClick={() => toggleCollapse(groupKey, isCollapsed)}
        >
          <div className="flex items-center gap-2.5">
            <ChevronRight size={15} className={`text-emerald-600 shrink-0 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
            <span className="text-[13px] font-bold text-gray-800">{label}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${allEnabled > 0 ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : 'text-gray-400 bg-white border-gray-200'}`}>
              {allEnabled}/{allKeys.length} aktif
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={e => { e.stopPropagation(); toggleKeysList(allKeys, true); }} className="text-[11px] font-bold text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-all">On All</button>
            <span className="w-px h-3 bg-gray-200" />
            <button type="button" onClick={e => { e.stopPropagation(); toggleKeysList(allKeys, false); }} className="text-[11px] font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all">Off All</button>
          </div>
        </div>
        {!isCollapsed && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            {tree.map(item => item.type === 'leaf' ? renderLeaf(item, 0) : renderNode(item, 0))}
          </div>
        )}
      </div>
    );
  };

  const renderDashboardGroup = () => {
    const dashModules = groupedModules['Dashboard'] || [];
    const { enabled, total } = getGroupStats(selectedRole, 'Dashboard');
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-emerald-50 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-bold text-gray-800">Dashboard</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${enabled > 0 ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : 'text-gray-400 bg-white border-gray-200'}`}>
              {enabled}/{total} aktif
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => toggleGroup('Dashboard', true)} className="text-[11px] font-bold text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-all">On All</button>
            <span className="w-px h-3 bg-gray-200" />
            <button type="button" onClick={() => toggleGroup('Dashboard', false)} className="text-[11px] font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all">Off All</button>
          </div>
        </div>
        {dashModules.map(m => renderLeaf({ type: 'leaf', key: m.key, label: m.label }, 0))}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden h-[calc(100vh-130px)]">
      <PageHeader
        title="Hak Akses & Role"
        description="Konfigurasi izin penggunaan setiap modul operasional SINTAK."
      />

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-5 overflow-hidden">

        {/* ── LEFT PANEL: ROLES ─────────────────────────────────────────── */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-3 h-full min-h-0 overflow-hidden">

          {/* Super Admin card */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden shrink-0">
            <div className="px-4 py-2.5 border-b border-gray-50 bg-gray-50/50">
              <span className="text-[11px] font-bold text-gray-400">Sistem</span>
            </div>
            <div className="p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <ShieldCheck size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-800 truncate">Super Admin</p>
                <p className="text-[11px] text-emerald-600 font-semibold">Akses Penuh</p>
              </div>
            </div>
          </div>

          {/* Configurable roles */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-bold text-gray-400">Role</span>
              <button
                onClick={() => { setIsAddingRole(v => !v); setEditingRole(null); }}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
              >
                {isAddingRole ? <X size={12} /> : <Plus size={12} />}
              </button>
            </div>

            {/* Add role form */}
            {isAddingRole && (
              <div className="p-3.5 border-b border-gray-100 bg-emerald-50/30 animate-in slide-in-from-top-2 duration-200 shrink-0">
                <input
                  type="text"
                  placeholder="Nama role..."
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-semibold focus:outline-none focus:border-emerald-400 mb-2 placeholder:text-gray-300 placeholder:font-normal"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAddRole()}
                />
                <input
                  type="text"
                  placeholder="Deskripsi (opsional)..."
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-medium focus:outline-none focus:border-emerald-400 mb-3 placeholder:text-gray-300 placeholder:font-normal"
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAddingRole(false)} className="text-[11px] font-bold text-gray-400 hover:text-gray-600 px-2 py-1">Batal</button>
                  <button
                    onClick={handleAddRole}
                    disabled={saving || !newRoleName.trim()}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-50 transition-all"
                  >
                    {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                    Simpan
                  </button>
                </div>
              </div>
            )}

            {/* Role list */}
            <div className="flex flex-col divide-y divide-gray-50 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              {customRoles.length === 0 && (
                <p className="text-[11px] text-gray-400 text-center py-6 italic">Belum ada role</p>
              )}
              {customRoles.map(m => {
                const role = m.name;
                const isActive = selectedRole === role;
                const { enabled, total } = getTotalStats(role);

                if (editingRole === role) {
                  return (
                    <div key={`edit-${role}`} ref={editFormRef} className="p-3.5 bg-emerald-50/30 animate-in slide-in-from-top-1 duration-200">
                      <input
                        type="text"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-semibold focus:outline-none focus:border-emerald-400 mb-2"
                        value={editRoleName}
                        onChange={e => setEditRoleName(e.target.value)}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleUpdateRole()}
                      />
                      <input
                        type="text"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-medium focus:outline-none focus:border-emerald-400 mb-3"
                        value={editRoleDesc}
                        onChange={e => setEditRoleDesc(e.target.value)}
                        placeholder="Deskripsi..."
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingRole(null)} className="text-[11px] font-bold text-gray-400 hover:text-gray-600 px-2 py-1">Batal</button>
                        <button
                          onClick={handleUpdateRole}
                          disabled={saving}
                          className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                          Update
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={role} className="group relative">
                    <button
                      onClick={() => { setSelectedRole(role); setEditingRole(null); setIsAddingRole(false); }}
                      className={`w-full text-left px-3.5 py-3 flex items-center gap-3 transition-colors ${
                        isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <UserCog size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12.5px] font-bold truncate ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>{role}</p>
                        <p className={`text-[11px] font-semibold ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>{enabled}/{total} modul</p>
                      </div>
                      {isActive && <ChevronRight size={14} className="text-emerald-500 shrink-0" />}
                    </button>
                    {/* Edit/Delete — visible on hover */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); setEditingRole(role); setEditRoleName(role); setEditRoleDesc(m.description || ''); setIsAddingRole(false); }}
                        className="p-1.5 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-400 hover:text-blue-600 transition-all"
                      ><Pencil size={12} /></button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteConfirm(role); }}
                        className="p-1.5 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-400 hover:text-red-500 transition-all"
                      ><Trash2 size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: PERMISSIONS ──────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">

          {!selectedRole ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-[15px] font-bold text-gray-700 mb-1.5">Pilih Role</h3>
              <p className="text-[12px] text-gray-400 text-center max-w-xs">
                Pilih role di sebelah kiri untuk mengkonfigurasi hak akses modul.
              </p>
            </div>
          ) : (
            <>
              {/* Role header bar */}
              <div className="shrink-0 flex items-center justify-between gap-4 px-5 py-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                    <UserCog size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-gray-800 truncate">{selectedRole}</p>
                    <p className="text-[11px] text-gray-400 font-medium truncate">
                      {currentRoleMeta.description || 'Pengaturan Hak Akses'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {saving && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 text-[11px] font-bold text-gray-400">
                      <Loader2 size={12} className="animate-spin text-emerald-500" />
                      Menyimpan...
                    </div>
                  )}
                  {result && !saving && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold animate-in fade-in duration-200 ${
                      result.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {result.type === 'success' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {result.msg}
                    </div>
                  )}
                </div>
              </div>

              {/* Permission tree */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pb-10 pr-0.5">
                {renderDashboardGroup()}
                {renderTopGroup('Data Digit', ddTree, 'Data Digit')}
                {renderTopGroup('Sistem', sistemTree, 'Sistem')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── LAPORAN PEKERJAAN ROLE CONFIG MODAL ───────────────────────── */}
      {configModalRole && (
        <LaporanPekerjaanRoleModal
          role={configModalRole}
          initialConfig={
            laporanConfigs[configModalRole] || {
              role: configModalRole,
              allowed_bagian: [],
              allowed_pic: [],
              excluded_pic: [],
              visible_columns: LAPORAN_PEKERJAAN_COLUMNS.map((c) => c.key),
              can_add: true,
              can_edit: true,
              can_delete: true,
            }
          }
          availablePics={availablePics}
          availableRoles={customRoles}
          onClose={() => setConfigModalRole(null)}
          onSave={async (newConfig) => {
            setSaving(true);
            const res = await saveRoleLaporanPekerjaanConfig(configModalRole, newConfig);
            setSaving(false);
            if (res.success) {
              setLaporanConfigs((prev) => ({
                ...prev,
                [configModalRole]: {
                  role: configModalRole,
                  allowed_bagian: newConfig.allowed_bagian,
                  allowed_pic: newConfig.allowed_pic,
                  excluded_pic: newConfig.excluded_pic || [],
                  visible_columns: newConfig.visible_columns,
                  can_add: newConfig.can_add,
                  can_edit: newConfig.can_edit,
                  can_delete: newConfig.delete_scope !== 'none',
                  delete_scope: newConfig.delete_scope,
                },
              }));
              showResult('success', `Pengaturan Laporan Pekerjaan untuk ${configModalRole} disimpan.`);
              setConfigModalRole(null);
              router.refresh();
            } else {
              showResult('error', res.message || 'Gagal menyimpan konfigurasi.');
            }
          }}
        />
      )}

      {/* ── DELETE CONFIRM DIALOG ─────────────────────────────────────── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-red-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 size={16} />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gray-800">Hapus Role</p>
                  <p className="text-[11px] text-gray-500 font-medium">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/80 transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
                <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[12px] font-semibold text-amber-700">
                  User yang memiliki role <b>&quot;{deleteConfirm}&quot;</b> tidak akan bisa login sampai Super Admin menugaskan role baru.
                </p>
              </div>
              <p className="text-[12px] text-gray-600 font-medium">
                Yakin ingin menghapus role <span className="font-bold text-gray-800">&quot;{deleteConfirm}&quot;</span>?
              </p>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-[12px] font-bold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
              >Batal</button>
              <button
                onClick={() => handleDeleteRole(deleteConfirm)}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-[12px] font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 rounded-xl shadow-sm transition-all"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Hapus Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Modal Konfigurasi Laporan Pekerjaan untuk Role Tertentu
// ----------------------------------------------------------------------

interface LaporanPekerjaanRoleModalProps {
  role: string;
  initialConfig: RoleLaporanPekerjaanConfig;
  availablePics: string[];
  availableRoles?: CustomRole[];
  onClose: () => void;
  onSave: (config: {
    allowed_bagian: string[];
    allowed_pic: string[];
    excluded_pic?: string[];
    visible_columns: string[];
    can_add?: boolean;
    can_edit?: boolean;
    can_delete?: boolean;
    delete_scope?: 'none' | 'table_only' | 'card_only' | 'all';
  }) => Promise<void>;
}

function LaporanPekerjaanRoleModal({
  role,
  initialConfig,
  availablePics,
  availableRoles = [],
  onClose,
  onSave,
}: LaporanPekerjaanRoleModalProps) {
  const [activeTab, setActiveTab] = useState<'bagian' | 'pic' | 'aksi' | 'kolom'>('bagian');
  const [allowedBagian, setAllowedBagian] = useState<string[]>(() => [...(initialConfig.allowed_bagian || [])]);
  const [allowedPic, setAllowedPic] = useState<string[]>(() => [...(initialConfig.allowed_pic || [])]);
  const [excludedPic, setExcludedPic] = useState<string[]>(() => [...(initialConfig.excluded_pic || [])]);
  const [canAdd, setCanAdd] = useState<boolean>(initialConfig.can_add !== false);
  const [canEdit, setCanEdit] = useState<boolean>(initialConfig.can_edit !== false);
  const [deleteScope, setDeleteScope] = useState<'none' | 'table_only' | 'card_only' | 'all'>(() => {
    if (initialConfig.delete_scope) return initialConfig.delete_scope;
    return initialConfig.can_delete === false ? 'none' : 'all';
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    initialConfig.visible_columns && initialConfig.visible_columns.length > 0
      ? [...initialConfig.visible_columns]
      : LAPORAN_PEKERJAAN_COLUMNS.map((c) => c.key)
  );

  const [picSearch, setPicSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter PIC berdasarkan search input
  const filteredPics = useMemo(() => {
    if (!picSearch.trim()) return availablePics;
    const query = picSearch.toLowerCase();
    return availablePics.filter((p) => p.toLowerCase().includes(query));
  }, [availablePics, picSearch]);

  // Bagian handlers
  const toggleBagian = (b: string) => {
    setAllowedBagian((prev) =>
      prev.includes(b) ? prev.filter((item) => item !== b) : [...prev, b]
    );
  };

  const selectAllBagian = () => {
    setAllowedBagian([...LAPORAN_PEKERJAAN_BAGIAN_LIST]);
  };

  const resetAllBagian = () => {
    setAllowedBagian([]); // [] = Semua Bagian diizinkan
  };
  const selectAllPics = () => {
    setAllowedPic([...availablePics]);
  };


  const resetAllPics = () => {
    setAllowedPic([]); // [] = Semua PIC diizinkan
  };

  const toggleExcludedRole = (roleName: string) => {
    const roleKey = `@role:${roleName}`;
    setExcludedPic(prev =>
      prev.includes(roleKey) ? prev.filter(item => item !== roleKey) : [...prev, roleKey]
    );
  };
  // PIC handlers
  const togglePic = (p: string) => {
    setAllowedPic((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  // Column handlers
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const selectAllColumns = () => {
    setVisibleColumns(LAPORAN_PEKERJAAN_COLUMNS.map((c) => c.key));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave({
        allowed_bagian: allowedBagian,
        allowed_pic: allowedPic,
        excluded_pic: excludedPic,
        visible_columns: visibleColumns.length === 0 ? LAPORAN_PEKERJAAN_COLUMNS.map((c) => c.key) : visibleColumns,
        can_add: canAdd,
        can_edit: canEdit,
        can_delete: deleteScope !== 'none',
        delete_scope: deleteScope,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                Setting Hak Akses Laporan Pekerjaan
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {role}
                </span>
              </h3>
              <p className="text-[11.5px] text-slate-500">
                Atur pembatasan Bagian, PIC, dan Kolom modal detail untuk role ini.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-5 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('bagian')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'bagian'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 rounded-t-lg'
            }`}
          >
            <Layers size={14} />
            <span>Bagian ({allowedBagian.length === 0 ? 'Semua' : allowedBagian.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pic')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'pic'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 rounded-t-lg'
            }`}
          >
            <Users size={14} />
            <span>PIC ({allowedPic.length === 0 ? 'Semua' : allowedPic.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('aksi')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'aksi'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 rounded-t-lg'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Hak Aksi ({[canAdd, canEdit, deleteScope !== 'none'].filter(Boolean).length}/3)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kolom')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'kolom'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 rounded-t-lg'
            }`}
          >
            <Columns size={14} />
            <span>Kolom Modal ({visibleColumns.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0 bg-white">
          {/* TAB 1: BAGIAN */}
          {activeTab === 'bagian' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Status Izin Bagian: </span>
                  {allowedBagian.length === 0 ? (
                    <span className="text-emerald-700 font-bold">Akses SEMUA Bagian</span>
                  ) : (
                    <span className="text-blue-700 font-bold">Dibatasi ({allowedBagian.length} Bagian terpilih)</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={selectAllBagian}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100/80 bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={resetAllBagian}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  >
                    Reset (Semua)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {LAPORAN_PEKERJAAN_BAGIAN_LIST.map((bagian) => {
                  const isChecked = allowedBagian.length === 0 || allowedBagian.includes(bagian);
                  const isExplicitChecked = allowedBagian.includes(bagian);

                  return (
                    <div
                      key={bagian}
                      onClick={() => toggleBagian(bagian)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isExplicitChecked
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-xs'
                          : allowedBagian.length === 0
                          ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isExplicitChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : allowedBagian.length === 0
                              ? 'bg-slate-300 border-slate-400 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {(isExplicitChecked || allowedBagian.length === 0) && (
                            <CheckCircle2 size={12} className="text-white" />
                          )}
                        </div>
                        <span className="text-xs font-bold">{bagian}</span>
                      </div>
                      {isExplicitChecked && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Aktif
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                * Catatan: Jika tidak ada Bagian yang dicentang secara khusus (semua abu-abu/reset), role ini dapat melihat dan memilih semua Bagian.
              </p>
            </div>
          )}

          {/* TAB 2: PIC */}
          {activeTab === 'pic' && (
            <div className="space-y-3">
              {/* Opsi 1: Kunci Otomatis ke PIC Akun Login (@me) */}
              <div
                onClick={() => {
                  setAllowedPic((prev) =>
                    prev.includes('@me') ? prev.filter((p) => p !== '@me') : [...prev, '@me']
                  );
                }}
                className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex items-start justify-between gap-3 ${
                  allowedPic.includes('@me')
                    ? 'border-emerald-500 bg-emerald-50/90 text-emerald-950 shadow-xs ring-1 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${
                      allowedPic.includes('@me')
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {allowedPic.includes('@me') && <CheckCircle2 size={13} className="text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Kunci Otomatis ke PIC Akun Login (@me)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                        Otomatis Per User
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">
                      Setiap pengguna dengan role ini otomatis <b>hanya bisa melihat pekerjaan miliknya sendiri</b> (sesuai nama akun / data karyawan yang tertaut).
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10.5px] font-bold px-2 py-0.5 rounded shrink-0 ${
                    allowedPic.includes('@me') ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {allowedPic.includes('@me') ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>

              {/* Opsi 2: Izinkan Tugas Tanpa PIC / Belum Ditugaskan (@unassigned) */}
              <div
                onClick={() => {
                  setAllowedPic((prev) =>
                    prev.includes('@unassigned') ? prev.filter((p) => p !== '@unassigned') : [...prev, '@unassigned']
                  );
                }}
                className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex items-start justify-between gap-3 ${
                  allowedPic.includes('@unassigned')
                    ? 'border-amber-500 bg-amber-50/90 text-amber-950 shadow-xs ring-1 ring-amber-500/20'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${
                      allowedPic.includes('@unassigned')
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {allowedPic.includes('@unassigned') && <CheckCircle2 size={13} className="text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Tampilkan Tugas &quot;Tanpa PIC&quot; (Belum Ditugaskan)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                        Order Terbuka
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">
                      Mengizinkan role ini melihat dan mengambil tugas/order yang <b>kolom PIC-nya masih kosong</b> (belum diassign ke karyawan lain).
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10.5px] font-bold px-2 py-0.5 rounded shrink-0 ${
                    allowedPic.includes('@unassigned') ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {allowedPic.includes('@unassigned') ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>

              {/* Pilihan Berdasarkan Role User */}
              {availableRoles.length > 0 && (
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <UserCog size={13} className="text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Izinkan Berdasarkan Role User (Dinamis):</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    Pilih role di bawah untuk mengizinkan semua akun/karyawan yang memiliki role tersebut secara dinamis.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableRoles.map((r) => {
                      const roleKey = `@role:${r.name}`;
                      const isRoleChecked = allowedPic.includes(roleKey);

                      return (
                        <button
                          key={r.name}
                          type="button"
                          onClick={() => {
                            setAllowedPic((prev) =>
                              prev.includes(roleKey)
                                ? prev.filter((item) => item !== roleKey)
                                : [...prev, roleKey]
                            );
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none ${
                            isRoleChecked
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-xs ring-1 ring-indigo-400/30'
                              : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                              isRoleChecked
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-slate-300'
                            }`}
                          >
                            {isRoleChecked && <CheckCircle2 size={10} className="text-white" />}
                          </div>
                          <span>Role: {r.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FITUR KECUALIKAN ROLE USER (DINAMIS) */}
              {availableRoles.length > 0 && (
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200/80">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldX size={13} className="text-rose-600" />
                      <span className="text-xs font-bold text-rose-950">Kecualikan Role User (Dinamis):</span>
                    </div>
                    {excludedPic.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExcludedPic([])}
                        className="text-[10.5px] font-bold text-rose-700 hover:text-rose-900 hover:underline"
                      >
                        Hapus Semua Pengecualian
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-rose-900/70 mb-2.5">
                    Karyawan dengan role yang ditandai di bawah <b>tidak akan dapat dilihat/dipilih</b> oleh role ini (bahkan saat mode &quot;Semua PIC&quot; aktif).
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableRoles.map((r) => {
                      const roleKey = `@role:${r.name}`;
                      const isExcluded = excludedPic.includes(roleKey);

                      return (
                        <button
                          key={`exc-${r.name}`}
                          type="button"
                          onClick={() => toggleExcludedRole(r.name)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none ${
                            isExcluded
                              ? 'border-rose-500 bg-rose-500 text-white shadow-xs ring-2 ring-rose-400/30'
                              : 'border-rose-200 bg-white hover:bg-rose-50/80 text-rose-900'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                              isExcluded
                                ? 'bg-white border-white text-rose-600'
                                : 'bg-white border-rose-300'
                            }`}
                          >
                            {isExcluded && <X size={10} className="text-rose-600 stroke-[3]" />}
                          </div>
                          <span>Kecuali Role: {r.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Status Izin PIC: </span>
                  {allowedPic.length === 0 ? (
                    <span className="text-emerald-700 font-bold">
                      Akses SEMUA PIC Karyawan
                      {excludedPic.length > 0 && (
                        <span className="text-rose-700 font-bold ml-1">
                          (Dikecualikan: {excludedPic.map(p => p.startsWith('@role:') ? `Role ${p.slice(6)}` : p).join(', ')})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-blue-700 font-bold">
                      Dibatasi ({[
                        allowedPic.includes('@me') ? '@me (Akun Login)' : null,
                        allowedPic.includes('@unassigned') ? 'Tanpa PIC' : null,
                        allowedPic.filter(p => p.startsWith('@role:')).length > 0 ? `${allowedPic.filter(p => p.startsWith('@role:')).length} Role` : null,
                        allowedPic.filter(p => !p.startsWith('@')).length > 0 ? `${allowedPic.filter(p => !p.startsWith('@')).length} PIC Nama` : null,
                      ].filter(Boolean).join(', ')})
                      {excludedPic.length > 0 && (
                        <span className="text-rose-700 font-bold ml-1">
                          (Dikecualikan: {excludedPic.map(p => p.startsWith('@role:') ? `Role ${p.slice(6)}` : p).join(', ')})
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={selectAllPics}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100/80 bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
                  >
                    Pilih Semua Nama
                  </button>


                  <button
                    type="button"
                    onClick={resetAllPics}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  >
                    Reset (Semua)
                  </button>
                </div>
              </div>
              {/* Search bar PIC */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama PIC / Karyawan spesifik..."
                  value={picSearch}
                  onChange={(e) => setPicSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar p-0.5">
                    {filteredPics.map((pic) => {
                      const isChecked = allowedPic.includes(pic);

                      return (
                        <div
                          key={pic}
                          onClick={() => togglePic(pic)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-xs'
                              : allowedPic.length === 0
                              ? 'border-slate-200 bg-slate-50/40 hover:bg-slate-100/70 text-slate-700'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                isChecked
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : allowedPic.length === 0
                                  ? 'bg-slate-300 border-slate-400 text-white'
                                  : 'bg-white border-slate-300'
                              }`}
                            >
                              {(isChecked || allowedPic.length === 0) && (
                                <CheckCircle2 size={12} className="text-white" />
                              )}
                            </div>
                            <span className="text-xs font-semibold truncate">{pic}</span>
                          </div>
                          {isChecked && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                              Aktif
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {filteredPics.length === 0 && (
                      <p className="col-span-2 text-center text-xs text-slate-400 py-6 italic">
                        PIC &quot;{picSearch}&quot; tidak ditemukan.
                      </p>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    * Catatan: Jika tidak ada PIC yang dipilih secara khusus (semua abu-abu/reset), role ini dapat melihat semua PIC.
                  </p>
                </div>
              )}

          {/* TAB 3: HAK AKSI (TAMBAH, EDIT, HAPUS) */}
          {activeTab === 'aksi' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Izin Aksi Pekerjaan: </span>
                  <span className="text-emerald-700 font-bold">
                    {[
                      canAdd && 'Tambah',
                      canEdit && 'Edit',
                      deleteScope === 'all'
                        ? 'Hapus (Manapun)'
                        : deleteScope === 'table_only'
                        ? 'Hapus (Tabel Utama)'
                        : deleteScope === 'card_only'
                        ? 'Hapus (Card Detail)'
                        : null,
                    ].filter(Boolean).join(', ') || 'Semua Aksi Dinonaktifkan'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Atur hak akses operasional (tambah baris baru, edit data, dan hapus data) secara spesifik untuk role ini.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Tambah Pekerjaan */}
                <div
                  onClick={() => setCanAdd((prev) => !prev)}
                  className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                    canAdd
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        canAdd ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Plus size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800">Tambah Pekerjaan Baru</p>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            canAdd ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {canAdd ? 'DIIZINKAN' : 'DINONAKTIFKAN'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Menampilkan tombol <b className="text-emerald-700">+ Tambah Pekerjaan</b> di pojok kanan atas modal detail order untuk membuat aktivitas baru.
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                      canAdd ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300'
                    }`}
                  >
                    {canAdd && <CheckCircle2 size={13} className="text-white" />}
                  </div>
                </div>

                {/* 2. Edit Pekerjaan */}
                <div
                  onClick={() => setCanEdit((prev) => !prev)}
                  className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                    canEdit
                      ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        canEdit ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Pencil size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800">Ubah / Edit Pekerjaan</p>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            canEdit ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {canEdit ? 'DIIZINKAN' : 'DINONAKTIFKAN'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mengizinkan user mengklik icon pensil / double click pada baris pekerjaan untuk mengubah bagian, PIC, task, tanggal, status, atau catatan.
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                      canEdit ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'
                    }`}
                  >
                    {canEdit && <CheckCircle2 size={13} className="text-white" />}
                  </div>
                </div>

                {/* 3. Pengaturan Izin Hapus Pekerjaan */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        deleteScope !== 'none' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Trash2 size={15} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800">Izin Hapus Data</p>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            deleteScope === 'all'
                              ? 'bg-rose-100 text-rose-700'
                              : deleteScope === 'none'
                              ? 'bg-slate-100 text-slate-400'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {deleteScope === 'all'
                            ? 'BISA DI MANAPUN'
                            : deleteScope === 'table_only'
                            ? 'HANYA TABEL UTAMA'
                            : deleteScope === 'card_only'
                            ? 'HANYA CARD DETAIL'
                            : 'TIDAK BISA HAPUS'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tentukan cakupan izin tombol hapus: di tabel utama (hapus seluruh order), di card/modal detail (hapus baris pekerjaan), di keduanya, atau dilarang sama sekali.
                      </p>
                    </div>
                  </div>

                  {/* 4 Opsi Radio Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {[
                      {
                        value: 'none' as const,
                        label: 'Tidak bisa hapus',
                        desc: 'Tombol hapus disembunyikan di tabel utama maupun modal detail order.',
                      },
                      {
                        value: 'table_only' as const,
                        label: 'Hanya bisa hapus di table utama',
                        desc: 'Bisa hapus order di list/tabel utama, tidak bisa hapus task di card detail.',
                      },
                      {
                        value: 'card_only' as const,
                        label: 'Hanya bisa hapus di card detail',
                        desc: 'Bisa hapus aktivitas di card detail modal, tidak bisa hapus order di tabel utama.',
                      },
                      {
                        value: 'all' as const,
                        label: 'Bisa hapus di manapun',
                        desc: 'Bebas menghapus data baik di tabel utama maupun di card detail modal.',
                      },
                    ].map((opt) => {
                      const isSelected = deleteScope === opt.value;
                      return (
                        <div
                          key={opt.value}
                          onClick={() => setDeleteScope(opt.value)}
                          className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50/70 shadow-xs ring-1 ring-rose-400/30'
                              : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100/70 text-slate-600'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? 'border-rose-600 bg-rose-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold ${isSelected ? 'text-rose-950' : 'text-slate-800'}`}>
                              {opt.label}
                            </p>
                            <p className="text-[10.5px] text-slate-500 leading-tight mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KOLOM MODAL DETAIL */}
          {activeTab === 'kolom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Kolom Tampil: </span>
                  <span className="text-emerald-700 font-bold">{visibleColumns.length} dari {LAPORAN_PEKERJAAN_COLUMNS.length} Kolom Data</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={selectAllColumns}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100/80 bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
                  >
                    Tampilkan Semua
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LAPORAN_PEKERJAAN_COLUMNS.map((col) => {
                  const isChecked = visibleColumns.includes(col.key);

                  return (
                    <div
                      key={col.key}
                      onClick={() => toggleColumn(col.key)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {isChecked && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{col.label}</p>
                          <p className="text-[10.5px] text-slate-500">
                            {col.key === 'start_end'
                              ? 'Tanggal mulai & target selesai'
                              : col.key === 'work_days'
                              ? 'Durasi hari kerja'
                              : `Kolom data ${col.label.toLowerCase()}`}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isChecked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isChecked ? 'TAMPIL' : 'SEMBUNYI'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                * Catatan: Kolom yang tidak dicentang akan disembunyikan secara otomatis dari popup Modal List Pekerjaan untuk role ini.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span>Simpan Konfigurasi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
