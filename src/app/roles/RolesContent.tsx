'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, CheckCircle2, XCircle,
  Loader2, Lock, Info, ChevronRight, UserCog, Plus, Pencil, Save, Trash2
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
  'Umum':               { text: 'text-slate-600',   bg: 'bg-slate-100',   dot: 'bg-slate-400' },
  'Pembelian':          { text: 'text-blue-600',    bg: 'bg-blue-50',     dot: 'bg-blue-400' },
  'Produksi':           { text: 'text-orange-600',  bg: 'bg-orange-50',   dot: 'bg-orange-400' },
  'Penjualan':          { text: 'text-emerald-600', bg: 'bg-emerald-50',  dot: 'bg-emerald-400' },
  'Data Master':        { text: 'text-cyan-600',    bg: 'bg-cyan-50',     dot: 'bg-cyan-400' },
  'Kesalahan Karyawan': { text: 'text-rose-600',    bg: 'bg-rose-50',     dot: 'bg-rose-400' },
  'Tracking':           { text: 'text-violet-600',  bg: 'bg-violet-50',   dot: 'bg-violet-400' },
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
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

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
    setCollapsedGroups(prev => {
      const next = { ...prev, [group]: !prev[group] };
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
    name: selectedRole, desc: '', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200'
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
        <div className="w-56 shrink-0 flex flex-col gap-2 overflow-y-auto custom-scrollbar">

          {/* Super Admin — locked badge (tidak bisa dipilih) */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
            Role Sistem
          </p>
          <div className="w-full p-3 rounded-[10px] border border-purple-100 bg-purple-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-purple-100 text-purple-600 border border-purple-200 shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12.5px] font-black text-purple-700 truncate">Super Admin</span>
                  <Lock size={10} className="text-purple-400 shrink-0" />
                </div>
                <span className="text-[10px] font-bold text-purple-400">Semua modul aktif</span>
              </div>
            </div>
            <p className="text-[9.5px] text-purple-400 font-semibold mt-2 leading-relaxed">
              Akses penuh & tidak dapat dibatasi.
            </p>
          </div>

          {/* Configurable Roles */}
          <div className="flex items-center justify-between px-1 mt-2 mb-1.5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Role Sistem Config
            </p>
            <button 
              onClick={() => { setIsAddingRole(true); setEditingRole(null); }}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-green-600 transition-colors"
              title="Tambah Role Baru"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {isAddingRole && (
              <div className="w-full p-3 rounded-[10px] border border-green-200 bg-green-50 animate-in fade-in slide-in-from-top-2">
                <input
                  type="text"
                  placeholder="Nama Role"
                  className="w-full text-[12px] font-bold px-2 py-1.5 bg-white border border-green-200 rounded-[6px] mb-2 focus:outline-none focus:border-green-400"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Deskripsi Role"
                  className="w-full text-[11px] px-2 py-1.5 bg-white border border-green-200 rounded-[6px] mb-2 focus:outline-none focus:border-green-400"
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsAddingRole(false)} className="text-[10px] font-bold text-gray-500 hover:text-gray-700">Batal</button>
                  <button onClick={handleAddRole} disabled={saving} className="flex items-center gap-1 text-[10px] font-bold text-white bg-green-600 px-2 py-1 rounded hover:bg-green-700">
                    <Save size={10} /> Simpan
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
                  <div key={`edit-${role}`} className={`w-full p-3 rounded-[10px] border ${m.border} ${m.bg} animate-in fade-in`}>
                    <input
                      type="text"
                      className="w-full text-[12px] font-bold px-2 py-1.5 bg-white border border-indigo-200 rounded-[6px] mb-2 focus:outline-none focus:border-indigo-400"
                      value={editRoleName}
                      onChange={e => setEditRoleName(e.target.value)}
                      autoFocus
                    />
                    <input
                      type="text"
                      className="w-full text-[11px] px-2 py-1.5 bg-white border border-indigo-200 rounded-[6px] mb-2 focus:outline-none focus:border-indigo-400"
                      value={editRoleDesc}
                      onChange={e => setEditRoleDesc(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingRole(null)} className="text-[10px] font-bold text-gray-500 hover:text-gray-700">Batal</button>
                      <button onClick={handleUpdateRole} disabled={saving} className="flex items-center gap-1 text-[10px] font-bold text-white bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-700">
                        <Save size={10} /> Simpan
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={role} className="relative group">
                  <button
                    onClick={() => { setSelectedRole(role); setEditingRole(null); setIsAddingRole(false); }}
                    className={`relative w-full text-left p-3 rounded-[10px] border transition-all duration-200 ${
                      isActive
                        ? `${m.bg} ${m.border} shadow-sm`
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${
                        isActive ? `${m.bg} ${m.color} border ${m.border}` : 'bg-gray-50 text-gray-400'
                      }`}>
                        <UserCog size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[12.5px] font-black truncate ${isActive ? m.color : 'text-gray-700'}`}>
                            {role}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">
                          {enabled}/{total} modul aktif
                        </span>
                      </div>
                      {isActive ? (
                        <ChevronRight size={12} className={`${m.color} shrink-0`} />
                      ) : (
                        <div className="w-3" />
                      )}
                    </div>
                  </button>
                  <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRole(role);
                        setEditRoleName(role);
                        setEditRoleDesc(m.description || '');
                        setIsAddingRole(false);
                        setSelectedRole(role);
                      }}
                      className="p-1.5 rounded bg-white border border-gray-200 text-gray-400 hover:text-indigo-600 shadow-sm"
                      title="Edit Role"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role);
                      }}
                      className="p-1.5 rounded bg-white border border-gray-200 text-gray-400 hover:text-rose-600 shadow-sm"
                      title="Hapus Role"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2">Grup Modul</p>
            <div className="flex flex-col gap-1">
              {Object.entries(GROUP_COLORS).map(([group, color]) => (
                <div key={group} className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${color.dot}`} />
                  <span className="text-[10px] font-semibold text-gray-400 truncate">{group}</span>
                </div>
              ))}
              {/* Sistem note */}
              <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-gray-100">
                <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-300" />
                <span className="text-[10px] font-semibold text-gray-300 truncate">Sistem (Super Admin)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Permission Matrix ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-0">
          {!selectedRole ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[12px] bg-gray-50/50">
              <div className="w-16 h-16 bg-gray-100 rounded-[16px] flex items-center justify-center mb-4">
                <UserCog size={32} className="text-gray-300" />
              </div>
              <h3 className="text-gray-600 font-extrabold text-lg mb-1">Belum Ada Role Dipilih</h3>
              <p className="text-gray-400 text-sm max-w-sm text-center font-medium">
                Silakan pilih salah satu role dari panel di sebelah kiri untuk mulai mengkonfigurasi hak akses modul sistem.
              </p>
            </div>
          ) : (
            <>
              {/* Role Header Bar */}
              <div className={`shrink-0 flex items-center justify-between px-5 py-3.5 rounded-[10px] border ${currentRoleMeta.bg} ${currentRoleMeta.border}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center ${currentRoleMeta.bg} border ${currentRoleMeta.border} ${currentRoleMeta.color}`}>
                    <UserCog size={16} />
                  </div>
                  <div>
                    <h3 className={`text-[14px] font-black ${currentRoleMeta.color}`}>{selectedRole}</h3>
                    <p className="text-[11px] text-gray-500 font-medium">{currentRoleMeta.desc}</p>
                  </div>
                </div>

            {/* Action Indicators */}
            <div className="flex items-center gap-2">
              {saving && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-400">
                  <Loader2 size={13} className="animate-spin" />
                  Menyimpan...
                </div>
              )}
              {result && !saving && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-bold animate-in fade-in ${
                  result.type === 'success'
                    ? 'text-emerald-500'
                    : 'bg-red-50 text-red-600 border border-red-100'
                }`}>
                  {result.type === 'success' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  {result.msg}
                </div>
              )}
            </div>
          </div>

          {/* Info: Sistem group note */}
          <div className="shrink-0 flex items-center gap-2 px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-[8px]">
            <Info size={13} className="text-gray-400 shrink-0" />
            <p className="text-[11px] text-gray-400 font-semibold">
              Menu <span className="font-black text-gray-500">Sistem</span> (Kelola User &amp; Hak Akses) selalu eksklusif untuk Super Admin dan tidak tampil di sini.
            </p>
          </div>

          {/* Module Groups — scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pr-1">
            {Object.entries(groupedModules).map(([group, modules]) => {
              const { enabled, total } = getGroupStats(selectedRole, group);
              const gc = GROUP_COLORS[group] || { text: 'text-gray-500', bg: 'bg-gray-100', dot: 'bg-gray-400' };
              const isCollapsed = collapsedGroups[group];

              return (
                <div key={group} className="bg-white border border-gray-100 rounded-[10px] overflow-hidden">
                  {/* Group Header */}
                  <div 
                    className="flex items-center justify-between px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 select-none cursor-pointer hover:bg-gray-100/50 transition-colors"
                    onClick={() => toggleCollapse(group)}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight size={14} className={`text-gray-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
                      <div className={`w-1.5 h-1.5 rounded-full ${gc.dot}`} />
                      <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-wider ${gc.bg} ${gc.text}`}>
                        {group}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        {enabled}/{total} aktif
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleGroup(group, true); }}
                        className="px-2 py-1 text-[10px] font-black text-emerald-600 hover:bg-emerald-50 rounded-[4px] transition-all"
                      >
                        Semua Aktif
                      </button>
                      <span className="text-gray-200 text-[10px]">|</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleGroup(group, false); }}
                        className="px-2 py-1 text-[10px] font-black text-rose-500 hover:bg-rose-50 rounded-[4px] transition-all"
                      >
                        Nonaktifkan
                      </button>
                    </div>
                  </div>

                  {/* Module Rows */}
                  {!isCollapsed && (
                    <div className="divide-y divide-gray-50 animate-in slide-in-from-top-1 fade-in duration-200">
                    {modules.map(module => {
                      const isEnabled = permissions[selectedRole]?.[module.key] ?? false;

                      return (
                        <div
                          key={module.key}
                          onClick={() => togglePermission(module.key)}
                          className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-gray-50/70 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isEnabled ? gc.dot : 'bg-gray-200'}`} />
                            <span className={`text-[12.5px] font-semibold truncate transition-colors ${isEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
                              {module.label}
                            </span>
                            <code className="hidden sm:block text-[9px] font-mono text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded shrink-0">
                              {module.key}
                            </code>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <button
                              onClick={e => { e.stopPropagation(); togglePermission(module.key); }}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                                isEnabled ? 'bg-green-500' : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                isEnabled ? 'translate-x-4' : 'translate-x-0.5'
                              }`} />
                            </button>
                            <span className={`text-[10px] font-black w-14 text-right transition-colors ${isEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {isEnabled ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
