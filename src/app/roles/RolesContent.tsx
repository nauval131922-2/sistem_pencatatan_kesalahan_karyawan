'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, CheckCircle2, XCircle,
  Loader2, Lock, ChevronRight, UserCog, Plus, Pencil, Save, Trash2
} from 'lucide-react';
import { saveRolePermissions, addRole, updateRole, deleteRole } from '@/lib/permissions-actions';
import { MODULE_REGISTRY } from '@/lib/permissions-constants';
import type { PermissionMap } from '@/lib/permissions-constants';
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
}

const GROUP_COLORS: Record<string, { text: string; bg: string; dot: string }> = {
  'Dashboard':           { text: 'text-black', bg: 'bg-[#93c5fd]', dot: 'bg-black' },
  'Data Digit':          { text: 'text-black', bg: 'bg-[#fde047]', dot: 'bg-black' },
  'Data Digit - Pembelian':  { text: 'text-black', bg: 'bg-[#93c5fd]', dot: 'bg-black' },
  'Data Digit - Produksi':   { text: 'text-black', bg: 'bg-[#fde047]', dot: 'bg-black' },
  'Data Digit - Penjualan':  { text: 'text-black', bg: 'bg-[#ff5e5e]', dot: 'bg-black' },

  'Sistem':              { text: 'text-black', bg: 'bg-white',     dot: 'bg-black' },
  'Sistem - Umum':       { text: 'text-black', bg: 'bg-white',     dot: 'bg-black' },
  'Sistem - HRD':        { text: 'text-black', bg: 'bg-[#ff5e5e]', dot: 'bg-black' },
  'Sistem - Kalkulasi':  { text: 'text-black', bg: 'bg-[#fde047]', dot: 'bg-black' },
  'Sistem - Produksi':   { text: 'text-black', bg: 'bg-[#93c5fd]', dot: 'bg-black' },
  'Sistem - Penjualan':  { text: 'text-black', bg: 'bg-[#ff5e5e]', dot: 'bg-black' },
  'Sistem - User':       { text: 'text-black', bg: 'bg-white',     dot: 'bg-black' },
};

export default function RolesContent({ allPermissions, customRoles }: RolesContentProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, PermissionMap>>(() =>
    JSON.parse(JSON.stringify(allPermissions))
  );

  // Sync state when props update (e.g. after renaming a role and calling router.refresh())
  useEffect(() => {
    setPermissions(JSON.parse(JSON.stringify(allPermissions)));
    // If a role was selected but no longer exists, deselect it
    setSelectedRole(prev => {
      if (!prev) return '';
      if (prev === 'Super Admin') return prev;
      if (!customRoles.some(r => r.name === prev)) {
        return '';
      }
      return prev;
    });
  }, [allPermissions, customRoles]);

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, Record<string, boolean>>>({});

  // States for Add/Edit Roles
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDesc, setEditRoleDesc] = useState('');

  // Sync collapsed state from local storage so it persists across reloads
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sintak_roles_collapsed');
      if (stored) {
        setCollapsedGroups(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const toggleCollapse = (group: string) => {
    if (!selectedRole) return;
    setCollapsedGroups(prev => {
      const roleCollapsed = prev[selectedRole] || {};
      const nextRoleCollapsed = { ...roleCollapsed, [group]: !roleCollapsed[group] };
      const next = { ...prev, [selectedRole]: nextRoleCollapsed };
      try {
        localStorage.setItem('sintak_roles_collapsed', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    setSaving(true);
    setResult(null);
    const res = await addRole(newRoleName, newRoleDesc);
    setSaving(false);
    if (res.success) {
      setResult({ type: 'success', msg: 'Role ditambahkan' });
      setIsAddingRole(false);
      setNewRoleName('');
      setNewRoleDesc('');
      setSelectedRole(newRoleName.trim());
      router.refresh();
    } else {
      setResult({ type: 'error', msg: res.message || 'Gagal menambah role' });
    }
    setTimeout(() => setResult(null), 3000);
  };

  const handleUpdateRole = async () => {
    if (!editRoleName.trim() || !editingRole) return;
    setSaving(true);
    setResult(null);
    const res = await updateRole(editingRole, editRoleName, editRoleDesc);
    setSaving(false);
    if (res.success) {
      setResult({ type: 'success', msg: 'Role diperbarui' });
      setEditingRole(null);
      if (selectedRole === editingRole) setSelectedRole(editRoleName.trim());
      router.refresh();
    } else {
      setResult({ type: 'error', msg: res.message || 'Gagal mengubah role' });
    }
    setTimeout(() => setResult(null), 3000);
  };

  const handleDeleteRole = async (role: string) => {
    if (role === 'Super Admin') return;
    
    // Attempt deletion
    if (!window.confirm(`Yakin ingin menghapus role "${role}"?\nUser yang memiliki role ini TIDAK AKAN BISA LOGIN sampai Super Admin menugaskan role baru untuk mereka.`)) return;
    
    setSaving(true);
    setResult(null);
    const res = await deleteRole(role);
    setSaving(false);
    if (res.success) {
      setResult({ type: 'success', msg: 'Role dihapus' });
      // If deleted active role, select the first available role in the updated props instead
      if (selectedRole === role) {
        const nextRole = customRoles.find(r => r.name !== role)?.name || 'Admin';
        setSelectedRole(nextRole);
      }
      router.refresh();
    } else {
      setResult({ type: 'error', msg: res.message || 'Gagal menghapus role' });
    }
    setTimeout(() => setResult(null), 3000);
  };

  const currentRoleMeta = customRoles.find(r => r.name === selectedRole) || {
    name: selectedRole, description: '', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200'
  };

  // Group modules
  const groupedModules = useMemo(() => {
    const groups: Record<string, typeof MODULE_REGISTRY[number][]> = {};
    for (const m of MODULE_REGISTRY) {
      if (!groups[m.group]) groups[m.group] = [];
      groups[m.group].push(m);
    }
    return groups;
  }, []);

  const currentRoleCollapsed = collapsedGroups[selectedRole] || {};

  const togglePermission = async (moduleKey: string) => {
    const newValue = !(permissions[selectedRole]?.[moduleKey] ?? false);
    
    // Optimistic local update
    const updatedRolePerms = { ...permissions[selectedRole], [moduleKey]: newValue };
    const newPermissions = { ...permissions, [selectedRole]: updatedRolePerms };
    setPermissions(newPermissions);

    // Auto-save
    setSaving(true);
    setResult(null);
    const res = await saveRolePermissions(selectedRole, updatedRolePerms);
    setSaving(false);
    
    if (!res.success) {
      setResult({ type: 'error', msg: res.message || 'Gagal menyimpan.' });
      setPermissions(permissions); // Revert on fail
    } else {
      setResult({ type: 'success', msg: 'Tersimpan otomatis' });
    }
    setTimeout(() => setResult(null), 3000);
  };

  const toggleGroup = async (group: string, value: boolean) => {
    const keys = (groupedModules[group] || []).map(m => m.key);
    
    // Optimistic local update
    const updatedRolePerms = { ...permissions[selectedRole] };
    for (const k of keys) updatedRolePerms[k] = value;
    
    const newPermissions = { ...permissions, [selectedRole]: updatedRolePerms };
    setPermissions(newPermissions);

    // Auto-save
    setSaving(true);
    setResult(null);
    const res = await saveRolePermissions(selectedRole, updatedRolePerms);
    setSaving(false);

    if (!res.success) {
      setResult({ type: 'error', msg: res.message || 'Gagal menyimpan.' });
      setPermissions(permissions); // Revert on fail
    } else {
      setResult({ type: 'success', msg: 'Grup tersimpan' });
    }
    setTimeout(() => setResult(null), 3000);
  };

  const getGroupStats = (role: string, group: string) => {
    const keys = (groupedModules[group] || []).map(m => m.key);
    const enabled = keys.filter(k => permissions[role]?.[k]).length;
    return { enabled, total: keys.length };
  };

  const getMultiGroupStats = (role: string, groups: string[]) => {
    const keys = groups.flatMap(g => (groupedModules[g] || []).map(m => m.key));
    const enabled = keys.filter(k => permissions[role]?.[k]).length;
    return { enabled, total: keys.length };
  };

  const toggleMultiGroup = async (groups: string[], value: boolean) => {
    const keys = groups.flatMap(g => (groupedModules[g] || []).map(m => m.key));
    const updatedRolePerms = { ...permissions[selectedRole] };
    for (const k of keys) updatedRolePerms[k] = value;
    const newPermissions = { ...permissions, [selectedRole]: updatedRolePerms };
    setPermissions(newPermissions);
    setSaving(true);
    setResult(null);
    const res = await saveRolePermissions(selectedRole, updatedRolePerms);
    setSaving(false);
    if (!res.success) {
      setResult({ type: 'error', msg: res.message || 'Gagal menyimpan.' });
      setPermissions(permissions);
    } else {
      setResult({ type: 'success', msg: 'Grup tersimpan' });
    }
    setTimeout(() => setResult(null), 3000);
  };

  const toggleKeysList = async (keys: string[], value: boolean) => {
    const updatedRolePerms = { ...permissions[selectedRole] };
    for (const k of keys) updatedRolePerms[k] = value;
    const newPermissions = { ...permissions, [selectedRole]: updatedRolePerms };
    setPermissions(newPermissions);
    setSaving(true); setResult(null);
    const res = await saveRolePermissions(selectedRole, updatedRolePerms);
    setSaving(false);
    if (!res.success) {
      setResult({ type: 'error', msg: res.message || 'Gagal menyimpan.' });
      setPermissions(permissions);
    } else {
      setResult({ type: 'success', msg: 'Tersimpan' });
    }
    setTimeout(() => setResult(null), 3000);
  };

  const getTotalStats = (role: string) => {
    const total = MODULE_REGISTRY.length;
    const enabled = MODULE_REGISTRY.filter(m => permissions[role]?.[m.key]).length;
    return { enabled, total };
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Kelola Hak Akses"
        description="Atur hak akses setiap role terhadap modul dalam sistem SINTAK."
      />

      {/* Split Panel Layout */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden max-w-[1100px] w-full mx-auto">

        {/* ── LEFT PANEL ── */}
        <div className="w-56 shrink-0 flex flex-col gap-2 overflow-y-auto custom-scrollbar px-2 py-1">

          {/* Super Admin — locked badge (tidak bisa dipilih) */}
          <p className="text-[10px] font-black text-black/30 uppercase tracking-widest px-1">
            Role Sistem
          </p>
          <div className="w-full p-3 rounded-none border-[3px] border-black bg-black shadow-[4px_4px_0_0_#fde047]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-none flex items-center justify-center bg-[#fde047] text-black border-2 border-black shrink-0">
                <ShieldCheck size={18} strokeWidth={3} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-black text-[#fde047] truncate uppercase tracking-tighter">Super Admin</span>
                  <Lock size={12} className="text-[#fde047]/50 shrink-0" />
                </div>
                <span className="text-[10px] font-bold text-[#fde047]/50 uppercase">Full Access</span>
              </div>
            </div>
          </div>

          {/* Configurable Roles */}
          <div className="flex items-center justify-between px-1 mt-6 mb-2">
            <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">
              Role Terkonfigurasi
            </p>
            <button 
              onClick={() => { setIsAddingRole(true); setEditingRole(null); }}
              className="p-1 hover:bg-[#fde047] border-2 border-transparent hover:border-black rounded-none text-black transition-all"
              title="Tambah Role Baru"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {isAddingRole && (
              <div className="w-full p-3 rounded-none border-[3px] border-black bg-[#fde047] shadow-[2.5px_2.5px_0_0_#000] animate-in fade-in slide-in-from-top-2 mb-4">
                <input
                  type="text"
                  placeholder="NAMA ROLE..."
                  className="w-full text-[12px] font-black px-3 py-2 bg-white border-[3px] border-black rounded-none mb-3 focus:outline-none uppercase tracking-tighter"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="DESKRIPSI ROLE..."
                  className="w-full text-[11px] font-bold px-3 py-2 bg-white border-[3px] border-black rounded-none mb-3 focus:outline-none uppercase tracking-tighter"
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                />
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setIsAddingRole(false)} className="text-[10px] font-black text-black/40 hover:text-black uppercase">Batal</button>
                  <button onClick={handleAddRole} disabled={saving} className="flex items-center gap-2 text-[10px] font-black text-[#fde047] bg-black px-3 py-1.5 rounded-none border-2 border-black hover:translate-y-[-1px] transition-all uppercase">
                    <Save size={12} strokeWidth={3} /> Simpan
                  </button>
                </div>
              </div>
            )}

            {customRoles.map(m => {
              const role = m.name;
              const isActive = selectedRole === role;
              const { enabled, total } = getTotalStats(role);

              if (editingRole === role) {
                return (
              <div key={`edit-${role}`} className="w-full p-3 rounded-none border-[3px] border-black bg-[#93c5fd] shadow-[2.5px_2.5px_0_0_#000] mb-4">
                <input
                  type="text"
                  className="w-full text-[12px] font-black px-3 py-2 bg-white border-[3px] border-black rounded-none mb-3 focus:outline-none uppercase tracking-tighter"
                  value={editRoleName}
                  onChange={e => setEditRoleName(e.target.value)}
                  autoFocus
                />
                <input
                  type="text"
                  className="w-full text-[11px] font-bold px-3 py-2 bg-white border-[3px] border-black rounded-none mb-3 focus:outline-none uppercase tracking-tighter"
                  value={editRoleDesc}
                  onChange={e => setEditRoleDesc(e.target.value)}
                />
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setEditingRole(null)} className="text-[10px] font-black text-black/40 hover:text-black uppercase">Batal</button>
                  <button onClick={handleUpdateRole} disabled={saving} className="flex items-center gap-2 text-[10px] font-black text-white bg-black px-3 py-1.5 rounded-none border-2 border-black hover:translate-y-[-1px] transition-all uppercase">
                    <Save size={12} strokeWidth={3} /> Simpan
                  </button>
                </div>
              </div>
                );
              }

              return (
                <div key={role} className="relative group">
                  <button
                    onClick={() => { setSelectedRole(role); setEditingRole(null); setIsAddingRole(false); }}
                    className={`relative w-full text-left p-3 rounded-none border-[3px] transition-all duration-200 mb-1 ${
                      isActive
                        ? 'bg-[#fde047] border-black shadow-[2.5px_2.5px_0_0_#000] -translate-y-[2px] -translate-x-[2px] z-10'
                        : 'bg-white border-black/10 hover:border-black/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-none flex items-center justify-center shrink-0 border-2 ${
                        isActive ? 'bg-black text-[#fde047] border-black' : 'bg-black/5 text-black/20 border-transparent'
                      }`}>
                        <UserCog size={18} strokeWidth={3} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[13px] font-black truncate uppercase tracking-tighter ${isActive ? 'text-black' : 'text-black/60'}`}>
                            {role}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'text-black/40' : 'text-black/20'}`}>
                          {enabled}/{total} Modul
                        </span>
                      </div>
                      {isActive && (
                        <ChevronRight size={16} strokeWidth={4} className="text-black shrink-0" />
                      )}
                    </div>
                  </button>
                  <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRole(role);
                        setEditRoleName(role);
                        setEditRoleDesc(m.description || '');
                        setIsAddingRole(false);
                        setSelectedRole(role);
                      }}
                      className="p-1.5 rounded-none bg-white border-2 border-black text-black hover:bg-[#93c5fd] shadow-[2px_2px_0_0_#000] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all"
                      title="Edit Role"
                    >
                      <Pencil size={12} strokeWidth={3} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role);
                      }}
                      className="p-1.5 rounded-none bg-white border-2 border-black text-black hover:bg-[#ff5e5e] hover:text-white shadow-[2px_2px_0_0_#000] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all"
                      title="Hapus Role"
                    >
                      <Trash2 size={12} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="mt-auto pt-4 border-t-2 border-black/10">
            <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-3">Grup Modul Legend</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-black shrink-0" />
                <span className="text-[10px] font-black text-black/40 uppercase tracking-tighter">Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#fde047] border border-black shrink-0" />
                <span className="text-[10px] font-black text-black/40 uppercase tracking-tighter">Operasional</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white border-2 border-black shrink-0" />
                <span className="text-[10px] font-black text-black/40 uppercase tracking-tighter">Sistem</span>
              </div>
            </div>
          </div>    </div>

        {/* ── RIGHT PANEL: Permission Matrix ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-0 pr-2">
          {!selectedRole ? (
            <div className="flex-1 flex flex-col items-center justify-center border-[3px] border-black rounded-none bg-white shadow-[2.5px_2.5px_0_0_#000]">
              <div className="w-16 h-16 bg-[#fde047] border-[3px] border-black flex items-center justify-center mb-6">
                <UserCog size={32} className="text-black" strokeWidth={3} />
              </div>
              <h3 className="text-black font-black text-lg mb-2 uppercase tracking-widest">PILIH ROLE SISTEM</h3>
              <p className="text-black/40 text-xs max-w-xs text-center font-bold uppercase tracking-tight leading-relaxed">
                Silakan pilih salah satu role dari panel kiri untuk mulai mengkonfigurasi hak akses modul operasional SINTAK.
              </p>
            </div>
          ) : (
            <>
              {/* Role Header Bar */}
              <div className="shrink-0 flex items-center justify-between px-5 py-4 rounded-none border-[3px] border-black bg-[#fde047] shadow-[2.5px_2.5px_0_0_#000] mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-none flex items-center justify-center bg-black text-[#fde047] border-2 border-black">
                    <UserCog size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-black uppercase tracking-widest">{selectedRole}</h3>
                    <p className="text-[11px] text-black/60 font-bold uppercase tracking-tight">{currentRoleMeta.description || 'PENGATURAN HAK AKSES MODUL'}</p>
                  </div>
                </div>

            {/* Action Indicators */}
            <div className="flex items-center gap-2">
              {saving && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-black/40 uppercase tracking-tighter">
                  <Loader2 size={13} className="animate-spin" strokeWidth={3} />
                  Saving...
                </div>
              )}
              {result && !saving && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none border-2 border-black text-[11px] font-black animate-in fade-in uppercase tracking-tighter shadow-[2px_2px_0_0_#000] ${
                  result.type === 'success'
                    ? 'bg-[#93c5fd] text-black'
                    : 'bg-[#ff5e5e] text-white'
                }`}>
                  {result.type === 'success' ? <CheckCircle2 size={13} strokeWidth={3} /> : <XCircle size={13} strokeWidth={3} />}
                  {result.msg}
                </div>
              )}
            </div>
          </div>

          {/* Module Groups — scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pr-1">

            {/* Helper to render a single module row */}
            {(() => {
              const renderModuleRow = (module: typeof MODULE_REGISTRY[number], gc: { text: string; bg: string; dot: string }, indent = 'px-6') => {
                const isEnabled = permissions[selectedRole]?.[module.key] ?? false;
                return (
                  <div
                    key={module.key}
                    onClick={() => togglePermission(module.key)}
                    className={`flex items-center justify-between ${indent} py-3 cursor-pointer hover:bg-[#fde047]/20 transition-all border-b-[2px] border-black/10 last:border-b-0`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-3 h-3 rounded-none shrink-0 transition-colors border-[2px] border-black shadow-[1px_1px_0_0_#000] ${isEnabled ? 'bg-black' : 'bg-white'}`} />
                      <span className={`text-[13px] font-black truncate transition-colors uppercase tracking-tighter ${isEnabled ? 'text-black' : 'text-black/20'}`}>
                        {module.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <button
                        onClick={e => { e.stopPropagation(); togglePermission(module.key); }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-none border-[2px] border-black transition-colors duration-200 ${isEnabled ? 'bg-[#93c5fd]' : 'bg-black/5'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform border-[2px] border-black bg-white transition-transform duration-200 ${isEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      <span className={`text-[10px] font-black w-14 text-right transition-colors uppercase tracking-tight ${isEnabled ? 'text-black' : 'text-black/10'}`}>
                        {isEnabled ? 'AKTIF' : 'OFF'}
                      </span>
                    </div>
                  </div>
                );
              };


              return Object.entries(groupedModules).map(([group, modules]) => {
                // Skip sub-groups — rendered inside their parent tree
                if (group.startsWith('Data Digit - ') || group.startsWith('Sistem - ')) return null;

                const gc = GROUP_COLORS[group] || { text: 'text-gray-500', bg: 'bg-gray-100', dot: 'bg-gray-400' };

                // DASHBOARD — flat rows, no collapse header
                if (group === 'Dashboard') {
                  return (
                    <div key="Dashboard" className="bg-white border-[3px] border-black rounded-none overflow-hidden shadow-[2.5px_2.5px_0_0_#000] mb-6">
                      <div className="px-5 py-3 bg-black border-b-[3px] border-black flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#fde047]">Dashboard & Insight</span>
                      </div>
                      <div className="divide-y divide-black/5">
                        {modules.map(m => renderModuleRow(m, gc))}
                      </div>
                    </div>
                  );
                }

                // DATA DIGIT — tree mirrors sidebar exactly
                if (group === 'Data Digit') {
                  type TLeaf = { type: 'leaf'; key: string; label: string };
                  type TNode = { type: 'node'; label: string; colorKey?: string; children: TItem[] };
                  type TItem = TLeaf | TNode;

                  const DD_TREE: TItem[] = [
                    // Sinkronisasi (flat, rendered first from modules)
                    { type: 'node', label: 'Pembelian', colorKey: 'Data Digit - Pembelian', children: [
                      { type: 'node', label: 'Purchase Request (PR)', children: [
                        { type: 'leaf', key: 'pembelian_pr', label: 'Purchase Request (PR)' }
                      ]},
                      { type: 'node', label: 'Penawaran', children: [
                        { type: 'leaf', key: 'pembelian_spph', label: 'SPPH Keluar' },
                        { type: 'leaf', key: 'pembelian_sph_in', label: 'SPH Masuk' },
                      ]},
                      { type: 'node', label: 'Purchase Order (PO)', children: [
                        { type: 'leaf', key: 'pembelian_po', label: 'Purchase Order (PO)' }
                      ]},
                      { type: 'node', label: 'Pembelian Barang', children: [
                        { type: 'leaf', key: 'pembelian_penerimaan', label: 'Penerimaan Barang' },
                        { type: 'leaf', key: 'pembelian_rekap', label: 'Laporan Rekap Pembelian Barang' },
                      ]},
                      { type: 'node', label: 'Hutang', children: [
                        { type: 'leaf', key: 'pembelian_hutang', label: 'Pelunasan Hutang' }
                      ]},
                    ]},
                    { type: 'node', label: 'Produksi', colorKey: 'Data Digit - Produksi', children: [
                      { type: 'leaf', key: 'produksi_bom', label: 'Bill of Material Produksi' },
                      { type: 'leaf', key: 'produksi_orders', label: 'Order Produksi' },
                      { type: 'node', label: 'Laporan', children: [
                        { type: 'leaf', key: 'produksi_bahan_baku', label: 'BBB Produksi' },
                        { type: 'leaf', key: 'produksi_barang_jadi', label: 'Penerimaan Barang Hasil Produksi' },
                      ]},
                    ]},
                    { type: 'node', label: 'Penjualan', colorKey: 'Data Digit - Penjualan', children: [
                      { type: 'node', label: 'Penawaran', children: [
                        { type: 'leaf', key: 'penjualan_sph_out', label: 'SPH Keluar' }
                      ]},
                      { type: 'node', label: 'Sales Order (SO)', children: [
                        { type: 'node', label: 'Laporan', children: [
                          { type: 'leaf', key: 'penjualan_so', label: 'Sales Order Barang' }
                        ]}
                      ]},
                      { type: 'node', label: 'Penjualan Barang', children: [
                        { type: 'node', label: 'Laporan', children: [
                          { type: 'leaf', key: 'penjualan_laporan', label: 'Laporan Penjualan' }
                        ]}
                      ]},
                      { type: 'node', label: 'Piutang', children: [
                        { type: 'node', label: 'Laporan', children: [
                          { type: 'leaf', key: 'penjualan_piutang', label: 'Pelunasan Piutang Penjualan' }
                        ]}
                      ]},
                      { type: 'node', label: 'Pengiriman (SJ)', children: [
                        { type: 'node', label: 'Laporan', children: [
                          { type: 'leaf', key: 'penjualan_pengiriman', label: 'Pengiriman' }
                        ]}
                      ]},
                    ]},
                  ];

                  const ddCollectKeys = (items: TItem[]): string[] =>
                    items.flatMap(item => item.type === 'leaf' ? [item.key] : ddCollectKeys(item.children));

                  // include 'sync' from modules
                  const syncKeys = modules.map(m => m.key);
                  const allDDKeys = [...syncKeys, ...ddCollectKeys(DD_TREE)];
                  const allDDEnabled = allDDKeys.filter(k => permissions[selectedRole]?.[k]).length;
                  const isParentCollapsed = currentRoleCollapsed['Data Digit'];

                  const renderDDTree = (items: TItem[], depth: number, parentColor?: { text: string; bg: string; dot: string }): React.ReactNode =>
                    items.map((item, idx) => {
                      if (item.type === 'leaf') {
                        const isEnabled = permissions[selectedRole]?.[item.key] ?? false;
                        return (
                          <div
                            key={item.key}
                            onClick={() => togglePermission(item.key)}
                            className="flex items-center justify-between py-2.5 pr-4 cursor-pointer hover:bg-[#fde047]/10 transition-all border-t-[2px] border-black/5"
                            style={{ paddingLeft: `${16 + depth * 14}px` }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-2.5 h-2.5 rounded-none shrink-0 transition-colors border-[2px] border-black ${isEnabled ? (parentColor?.dot || 'bg-black') : 'bg-white'}`} />
                              <span className={`text-[12.5px] font-black truncate transition-colors uppercase tracking-tight ${isEnabled ? 'text-black' : 'text-black/20'}`}>{item.label}</span>
                              <code className="hidden sm:block text-[9px] font-black text-black/20 bg-black/5 px-1.5 py-0.5 rounded-none border border-black/10 shrink-0">{item.key}</code>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <button onClick={e => { e.stopPropagation(); togglePermission(item.key); }} className={`relative inline-flex h-5 w-9 items-center rounded-none border-[2px] border-black transition-colors duration-200 ${isEnabled ? 'bg-[#93c5fd]' : 'bg-black/5'}`}>
                                <span className={`inline-block h-3.5 w-3.5 transform border-[2px] border-black bg-white transition-transform duration-200 ${isEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                              </button>
                              <span className={`text-[10px] font-black w-14 text-right transition-colors uppercase tracking-tight ${isEnabled ? 'text-black' : 'text-black/10'}`}>{isEnabled ? 'Aktif' : 'OFF'}</span>
                            </div>
                          </div>
                        );
                      }

                      const nodeColor = item.colorKey ? (GROUP_COLORS[item.colorKey] || parentColor) : parentColor;
                      const nodeKeys = ddCollectKeys(item.children);
                      const nodeEnabled = nodeKeys.filter(k => permissions[selectedRole]?.[k]).length;
                      const collapseKey = `dd-${item.label.replace(/\s+/g, '-').toLowerCase()}-${depth}`;
                      const isCollapsed = currentRoleCollapsed[collapseKey];
                      const isTop = depth === 0;

                      return (
                        <div key={`${collapseKey}-${idx}`} className="border-t-[2px] border-black/10">
                          <div
                            className={`flex items-center justify-between pr-4 ${isTop ? 'py-2.5 bg-black/5' : 'py-1.5 bg-black/[0.02]'} select-none cursor-pointer hover:bg-[#fde047]/10 transition-colors`}
                            style={{ paddingLeft: `${16 + depth * 14}px` }}
                            onClick={() => toggleCollapse(collapseKey)}
                          >
                            <div className="flex items-center gap-2">
                              <ChevronRight size={isTop ? 13 : 11} strokeWidth={4} className={`transition-transform duration-200 ${isCollapsed ? 'text-black/20' : 'rotate-90 text-black/40'}`} />
                              {nodeColor && <div className={`${isTop ? 'w-2 h-2' : 'w-1.5 h-1.5'} rounded-none border-[1.5px] border-black ${nodeColor.dot}`} />}
                              <span className={`px-2 py-0.5 rounded-none border-2 border-black ${isTop ? 'text-[9px]' : 'text-[8.5px]'} font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] ${nodeColor?.bg || 'bg-white'} ${nodeColor?.text || 'text-black'}`}>
                                {item.label}
                              </span>
                              <span className="text-[11px] font-black text-black/20 uppercase tracking-tighter">{nodeEnabled}/{nodeKeys.length} AKTIF</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={e => { e.stopPropagation(); toggleKeysList(nodeKeys, true); }} className="px-2 py-1 text-[10px] font-black text-black hover:bg-[#93c5fd] rounded-none border-2 border-transparent hover:border-black transition-all uppercase tracking-tighter">ALL ON</button>
                              <span className="text-black/10 text-[10px]">|</span>
                              <button onClick={e => { e.stopPropagation(); toggleKeysList(nodeKeys, false); }} className="px-2 py-1 text-[10px] font-black text-black/40 hover:text-white hover:bg-[#ff5e5e] rounded-none border-2 border-transparent hover:border-black transition-all uppercase tracking-tighter">ALL OFF</button>
                            </div>
                          </div>
                          {!isCollapsed && (
                            <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                              {renderDDTree(item.children, depth + 1, nodeColor || parentColor)}
                            </div>
                          )}
                        </div>
                      );
                    });

                  return (
                    <div key="Data Digit" className="bg-white border-[3px] border-black rounded-none overflow-hidden shadow-[2.5px_2.5px_0_0_#000] mb-6">
                      <div
                        className="flex items-center justify-between px-5 py-3 bg-black border-b-[3px] border-black select-none cursor-pointer"
                        onClick={() => toggleCollapse('Data Digit')}
                      >
                        <div className="flex items-center gap-3">
                          <ChevronRight size={16} strokeWidth={4} className={`text-[#fde047] transition-transform duration-200 ${isParentCollapsed ? '' : 'rotate-90'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#fde047]">Modul Operasional (Data Digit)</span>
                          <span className="text-[10px] font-black text-[#fde047]/40 px-2 border-l border-[#fde047]/20">{allDDEnabled}/{allDDKeys.length} AKTIF</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={e => { e.stopPropagation(); toggleKeysList(allDDKeys, true); }} className="px-3 py-1.5 text-[10px] font-black text-black bg-[#93c5fd] border-2 border-black hover:translate-y-[-1px] transition-all uppercase tracking-widest shadow-[2px_2px_0_0_#000]">ON ALL</button>
                          <button onClick={e => { e.stopPropagation(); toggleKeysList(allDDKeys, false); }} className="px-3 py-1.5 text-[10px] font-black text-black bg-[#ff5e5e] border-2 border-black hover:translate-y-[-1px] transition-all uppercase tracking-widest shadow-[2px_2px_0_0_#000]">OFF ALL</button>
                        </div>
                      </div>
                      {!isParentCollapsed && (
                        <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                          {/* Sinkronisasi All Data — flat row */}
                          {modules.map(m => renderModuleRow(m, gc, 'px-8'))}
                          {/* Sub-trees */}
                          {renderDDTree(DD_TREE, 0)}
                        </div>
                      )}
                    </div>
                  );
                }

                // SISTEM — handled by tree-based renderer after the loop
                if (group === 'Sistem' || group.startsWith('Sistem -')) {
                  return null;
                }

                // Regular group
                const { enabled, total } = getGroupStats(selectedRole, group);
                const isCollapsed = currentRoleCollapsed[group];
                return (
                  <div key={group} className="bg-white border-[3px] border-black rounded-none overflow-hidden shadow-[2.5px_2.5px_0_0_#000]">
                    <div
                      className="flex items-center justify-between px-5 py-3 bg-black/5 border-b-[3px] border-black select-none cursor-pointer hover:bg-[#fde047]/10 transition-colors"
                      onClick={() => toggleCollapse(group)}
                    >
                      <div className="flex items-center gap-3">
                        <ChevronRight size={16} strokeWidth={4} className={`text-black transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
                        <div className={`w-2.5 h-2.5 rounded-none border-[2px] border-black ${gc.dot}`} />
                        <span className={`px-2.5 py-1 rounded-none border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] ${gc.bg} ${gc.text}`}>{group}</span>
                        <span className="text-[11px] font-black text-black/20 uppercase tracking-tighter">{enabled}/{total} AKTIF</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={e => { e.stopPropagation(); toggleGroup(group, true); }} className="px-3 py-1.5 text-[10px] font-black text-black bg-[#93c5fd] border-2 border-black hover:translate-y-[-1px] transition-all uppercase tracking-widest shadow-[2px_2px_0_0_#000]">ON ALL</button>
                        <button onClick={e => { e.stopPropagation(); toggleGroup(group, false); }} className="px-3 py-1.5 text-[10px] font-black text-black bg-[#ff5e5e] border-2 border-black hover:translate-y-[-1px] transition-all uppercase tracking-widest shadow-[2px_2px_0_0_#000]">OFF ALL</button>
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div className="divide-y-[2px] divide-black/5 animate-in slide-in-from-top-1 fade-in duration-200">
                        {modules.map(m => renderModuleRow(m, gc))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}

            {/* SISTEM parent collapse — tree mirrors sidebar exactly */}
            {(() => {
              type TreeLeaf = { type: 'leaf'; key: string; label: string };
              type TreeNode = { type: 'node'; label: string; colorKey?: string; children: TreeItem[] };
              type TreeItem = TreeLeaf | TreeNode;

              const SISTEM_TREE: TreeItem[] = [
                { type: 'node', label: 'Umum', colorKey: 'Sistem - Umum', children: [
                  { type: 'node', label: 'Data', children: [
                    { type: 'leaf', key: 'karyawan', label: 'Karyawan' }
                  ]},
                  { type: 'leaf', key: 'tracking_manufaktur', label: 'Tracking Manufaktur' }
                ]},
                { type: 'node', label: 'HRD', colorKey: 'Sistem - HRD', children: [
                  { type: 'node', label: 'Kesalahan Karyawan', children: [
                    { type: 'leaf', key: 'catat_kesalahan', label: 'Catat Kesalahan' },
                    { type: 'leaf', key: 'statistik', label: 'Statistik Performa' }
                  ]}
                ]},
                { type: 'node', label: 'Kalkulasi', colorKey: 'Sistem - Kalkulasi', children: [
                  { type: 'node', label: 'Data', children: [
                    { type: 'leaf', key: 'hpp_kalkulasi', label: 'HPP Kalkulasi' }
                  ]}
                ]},
                { type: 'node', label: 'Produksi', colorKey: 'Sistem - Produksi', children: [
                  { type: 'node', label: 'Jurnal Harian Produksi', children: [
                    { type: 'node', label: 'Data', children: [
                      { type: 'leaf', key: 'produksi_jhp_sopd', label: 'SOPd' },
                      { type: 'leaf', key: 'produksi_jhp_master_pekerjaan', label: 'Master Pekerjaan' },
                      { type: 'leaf', key: 'produksi_jhp_master_target', label: 'Master Target Pekerjaan' }
                    ]},
                    { type: 'leaf', key: 'produksi_jhp', label: 'Jurnal Harian Produksi' },
                    { type: 'leaf', key: 'produksi_jhp_target', label: 'Target Harian' }
                  ]}
                ]},
                { type: 'node', label: 'Penjualan', colorKey: 'Sistem - Penjualan', children: [
                  { type: 'leaf', key: 'kalkulasi_rekap_so', label: 'Rekap Sales Order Barang' }
                ]},
                { type: 'node', label: 'User', colorKey: 'Sistem - User', children: [
                  { type: 'leaf', key: 'hak_akses', label: 'Hak Akses' },
                  { type: 'leaf', key: 'kelola_user', label: 'Kelola User' }
                ]}
              ];

              const collectKeys = (items: TreeItem[]): string[] =>
                items.flatMap(item => item.type === 'leaf' ? [item.key] : collectKeys(item.children));

              const allSistemKeys = collectKeys(SISTEM_TREE);
              const allEnabled = allSistemKeys.filter(k => permissions[selectedRole]?.[k]).length;
              const gc = GROUP_COLORS['Sistem'] || { text: 'text-violet-600', bg: 'bg-violet-50', dot: 'bg-violet-400' };
              const isParentCollapsed = currentRoleCollapsed['Sistem'];

              const renderTree = (items: TreeItem[], depth: number, parentColor?: { text: string; bg: string; dot: string }): React.ReactNode =>
                items.map((item, idx) => {
                  if (item.type === 'leaf') {
                    const isEnabled = permissions[selectedRole]?.[item.key] ?? false;
                    return (
                      <div
                        key={item.key}
                        onClick={() => togglePermission(item.key)}
                        className="flex items-center justify-between py-2.5 pr-4 cursor-pointer hover:bg-[#fde047]/10 transition-all border-t-[2px] border-black/5"
                        style={{ paddingLeft: `${16 + depth * 14}px` }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-2.5 h-2.5 rounded-none shrink-0 transition-colors border-[2px] border-black ${isEnabled ? (parentColor?.dot || 'bg-black') : 'bg-white'}`} />
                          <span className={`text-[12.5px] font-black truncate transition-colors uppercase tracking-tight ${isEnabled ? 'text-black' : 'text-black/20'}`}>{item.label}</span>
                          <code className="hidden sm:block text-[9px] font-black text-black/20 bg-black/5 px-1.5 py-0.5 rounded-none border border-black/10 shrink-0">{item.key}</code>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <button onClick={e => { e.stopPropagation(); togglePermission(item.key); }} className={`relative inline-flex h-5 w-9 items-center rounded-none border-[2px] border-black transition-colors duration-200 ${isEnabled ? 'bg-[#93c5fd]' : 'bg-black/5'}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform border-[2px] border-black bg-white transition-transform duration-200 ${isEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                          <span className={`text-[10px] font-black w-14 text-right transition-colors uppercase tracking-tight ${isEnabled ? 'text-black' : 'text-black/10'}`}>{isEnabled ? 'Aktif' : 'OFF'}</span>
                        </div>
                      </div>
                    );
                  }

                  const nodeColor = item.colorKey ? (GROUP_COLORS[item.colorKey] || parentColor) : parentColor;
                  const nodeKeys = collectKeys(item.children);
                  const nodeEnabled = nodeKeys.filter(k => permissions[selectedRole]?.[k]).length;
                  const collapseKey = `sistem-${item.label.replace(/\s+/g, '-').toLowerCase()}`;
                  const isCollapsed = currentRoleCollapsed[collapseKey];
                  const isTop = depth === 0;

                  return (
                    <div key={`${collapseKey}-${idx}`} className="border-t-[2px] border-black/10">
                      <div
                        className={`flex items-center justify-between pr-4 ${isTop ? 'py-2.5 bg-black/5' : 'py-1.5 bg-black/[0.02]'} select-none cursor-pointer hover:bg-[#fde047]/10 transition-colors`}
                        style={{ paddingLeft: `${16 + depth * 14}px` }}
                        onClick={() => toggleCollapse(collapseKey)}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight size={isTop ? 13 : 11} strokeWidth={4} className={`transition-transform duration-200 ${isCollapsed ? 'text-black/20' : 'rotate-90 text-black/40'}`} />
                          {nodeColor && <div className={`${isTop ? 'w-2 h-2' : 'w-1.5 h-1.5'} rounded-none border-[1.5px] border-black ${nodeColor.dot}`} />}
                          <span className={`px-2 py-0.5 rounded-none border-2 border-black ${isTop ? 'text-[9px]' : 'text-[8.5px]'} font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] ${nodeColor?.bg || 'bg-white'} ${nodeColor?.text || 'text-black'}`}>
                            {item.label}
                          </span>
                          <span className="text-[11px] font-black text-black/20 uppercase tracking-tighter">{nodeEnabled}/{nodeKeys.length} AKTIF</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={e => { e.stopPropagation(); toggleKeysList(nodeKeys, true); }} className="px-2 py-1 text-[10px] font-black text-black hover:bg-[#93c5fd] rounded-none border-2 border-transparent hover:border-black transition-all uppercase tracking-tighter">ALL ON</button>
                          <span className="text-black/10 text-[10px]">|</span>
                          <button onClick={e => { e.stopPropagation(); toggleKeysList(nodeKeys, false); }} className="px-2 py-1 text-[10px] font-black text-black/40 hover:text-white hover:bg-[#ff5e5e] rounded-none border-2 border-transparent hover:border-black transition-all uppercase tracking-tighter">ALL OFF</button>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                          {renderTree(item.children, depth + 1, nodeColor || parentColor)}
                        </div>
                      )}
                    </div>
                  );
                });

              return (
                <div className="bg-white border-[3px] border-black rounded-none overflow-hidden shadow-[2.5px_2.5px_0_0_#000]">
                  <div
                    className="flex items-center justify-between px-5 py-3 bg-black border-b-[3px] border-black select-none cursor-pointer"
                    onClick={() => toggleCollapse('Sistem')}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight size={16} strokeWidth={4} className={`text-[#fde047] transition-transform duration-200 ${isParentCollapsed ? '' : 'rotate-90'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#fde047]">Modul Sistem</span>
                      <span className="text-[10px] font-black text-[#fde047]/40 px-2 border-l border-[#fde047]/20">{allEnabled}/{allSistemKeys.length} AKTIF</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={e => { e.stopPropagation(); toggleKeysList(allSistemKeys, true); }} className="px-3 py-1.5 text-[10px] font-black text-black bg-[#93c5fd] border-2 border-black hover:translate-y-[-1px] transition-all uppercase tracking-widest shadow-[2px_2px_0_0_#000]">ON ALL</button>
                      <button onClick={e => { e.stopPropagation(); toggleKeysList(allSistemKeys, false); }} className="px-3 py-1.5 text-[10px] font-black text-black bg-[#ff5e5e] border-2 border-black hover:translate-y-[-1px] transition-all uppercase tracking-widest shadow-[2px_2px_0_0_#000]">OFF ALL</button>
                    </div>
                  </div>
                  {!isParentCollapsed && (
                    <div className="divide-y-[2px] divide-black/5 animate-in slide-in-from-top-1 fade-in duration-200">
                      {renderTree(SISTEM_TREE, 0)}
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}








