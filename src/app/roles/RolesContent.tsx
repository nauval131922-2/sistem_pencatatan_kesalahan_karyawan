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
  'Dashboard':           { text: 'text-blue-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  'Data Digit':          { text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  'Data Digit - Pembelian':  { text: 'text-blue-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  'Data Digit - Produksi':   { text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  'Data Digit - Penjualan':  { text: 'text-indigo-700', bg: 'bg-indigo-50', dot: 'bg-indigo-500' },

  'Sistem':              { text: 'text-slate-700', bg: 'bg-slate-50',     dot: 'bg-slate-500' },
  'Sistem - Umum':       { text: 'text-slate-700', bg: 'bg-slate-50',     dot: 'bg-slate-500' },
  'Sistem - HRD':        { text: 'text-rose-700', bg: 'bg-rose-50',     dot: 'bg-rose-500' },
  'Sistem - Kalkulasi':  { text: 'text-amber-700', bg: 'bg-amber-50',     dot: 'bg-amber-500' },
  'Sistem - Produksi':   { text: 'text-emerald-700', bg: 'bg-emerald-50',     dot: 'bg-emerald-500' },
  'Sistem - Penjualan':  { text: 'text-indigo-700', bg: 'bg-indigo-50',     dot: 'bg-indigo-500' },
  'Sistem - User':       { text: 'text-slate-700', bg: 'bg-slate-50',     dot: 'bg-slate-500' },
  'Sistem - Settings':   { text: 'text-violet-700', bg: 'bg-violet-50',   dot: 'bg-violet-500' },
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

  const toggleCollapse = (group: string, currentIsCollapsed: boolean) => {
    if (!selectedRole) return;
    setCollapsedGroups(prev => {
      const roleCollapsed = prev[selectedRole] || {};
      const nextRoleCollapsed = { ...roleCollapsed, [group]: !currentIsCollapsed };
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
      let groupName: string = m.group;
      if (groupName.startsWith('Data Digit - ')) groupName = 'Data Digit';
      if (groupName.startsWith('Sistem - ')) groupName = 'Sistem';

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(m);
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
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Hak Akses & Role"
        description="Konfigurasi izin penggunaan setiap modul operasional SINTAK."
      />

      <div className="flex-1 min-h-0 flex gap-6 overflow-hidden max-w-[1200px] w-full mx-auto">
        {/* LEFT PANEL: ROLES */}
        <div className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-10">
          <div className="flex flex-col gap-2.5">
             <h4 className="text-[12px] font-semibold text-gray-400 px-1">Role Sistem</h4>
             <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm shadow-emerald-900/5 ring-1 ring-emerald-50/50">
               <div className="flex items-center gap-4">
                 <div className="w-11 h-11 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-900/10">
                   <ShieldCheck size={20} />
                 </div>
                 <div>
                   <h5 className="text-[14px] font-bold text-gray-800 tracking-tight">Super Admin</h5>
                   <p className="text-[10px] text-emerald-600 font-bold">Akses Sistem Penuh</p>
                 </div>
               </div>
             </div>
          </div>

          <div className="flex flex-col gap-2.5 mt-4">
             <div className="flex items-center justify-between px-1">
               <h4 className="text-[12px] font-semibold text-gray-400">Role Terkonfigurasi</h4>
               <button 
                 onClick={() => { setIsAddingRole(true); setEditingRole(null); }}
                 className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
               >
                 <Plus size={16} />
               </button>
             </div>

             <div className="flex flex-col gap-2">
               {isAddingRole && (
                 <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 animate-in slide-in-from-top-2 duration-300 shadow-sm mb-2">
                    <input
                      type="text"
                      placeholder="Nama Role..."
                      className="w-full bg-white border border-emerald-100 rounded-lg px-4 py-2 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-3"
                      value={newRoleName}
                      onChange={e => setNewRoleName(e.target.value)}
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Deskripsi..."
                      className="w-full bg-white border border-emerald-100 rounded-lg px-4 py-2 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-4"
                      value={newRoleDesc}
                      onChange={e => setNewRoleDesc(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setIsAddingRole(false)} className="text-[11px] font-bold text-gray-400 hover:text-gray-600 px-3">Batal</button>
                      <button onClick={handleAddRole} disabled={saving} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[11px] font-bold shadow-sm shadow-emerald-900/10">Simpan</button>
                    </div>
                 </div>
               )}

               {customRoles.map(m => {
                 const role = m.name;
                 const isActive = selectedRole === role;
                 const { enabled, total } = getTotalStats(role);

                 if (editingRole === role) {
                    return (
                      <div key={`edit-${role}`} className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm mb-2">
                        <input
                          type="text"
                          className="w-full bg-white border border-emerald-100 rounded-lg px-4 py-2 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-3"
                          value={editRoleName}
                          onChange={e => setEditRoleName(e.target.value)}
                          autoFocus
                        />
                        <input
                          type="text"
                          className="w-full bg-white border border-emerald-100 rounded-lg px-4 py-2 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-4"
                          value={editRoleDesc}
                          onChange={e => setEditRoleDesc(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingRole(null)} className="text-[11px] font-bold text-gray-400 hover:text-gray-600 px-3">Batal</button>
                          <button onClick={handleUpdateRole} disabled={saving} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[11px] font-bold shadow-sm shadow-emerald-900/10">Update</button>
                        </div>
                      </div>
                    );
                 }

                 return (
                   <div key={role} className="group relative">
                     <button
                        onClick={() => { setSelectedRole(role); setEditingRole(null); setIsAddingRole(false); }}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 ${
                          isActive 
                            ? 'bg-white border-emerald-200 shadow-sm shadow-emerald-900/5 ring-1 ring-emerald-50' 
                            : 'bg-white/50 border-gray-100 hover:border-emerald-200 hover:bg-white'
                        }`}
                     >
                       <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                         isActive ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-gray-50 text-gray-400 border-gray-100'
                       }`}>
                         <UserCog size={20} />
                       </div>
                       <div className="flex-1 min-w-0">
                         <h5 className={`text-[14px] font-bold truncate ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>{role}</h5>
                         <p className={`text-[10px] font-semibold ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                           {enabled}/{total} Modul
                         </p>
                       </div>
                       {isActive && <ChevronRight size={18} className="text-emerald-600" />}
                     </button>
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setEditingRole(role); setEditRoleName(role); setEditRoleDesc(m.description || ''); }} className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-400 hover:text-blue-600 hover:border-emerald-100 transition-all"><Pencil size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }} className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-400 hover:text-red-600 hover:border-red-100 transition-all"><Trash2 size={14} /></button>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>

        {/* RIGHT PANEL: PERMISSIONS */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 overflow-hidden">
          {!selectedRole ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl shadow-sm shadow-green-900/5">
               <div className="w-20 h-20 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100 shadow-sm">
                 <ShieldCheck size={40} />
               </div>
               <h3 className="text-lg font-bold text-gray-800 mb-2">Pilih Role</h3>
               <p className="text-[13px] text-gray-400 font-medium text-center max-w-sm px-8">
                 Silakan pilih role di sebelah kiri untuk mengkonfigurasi hak akses modul operasional SINTAK.
               </p>
            </div>
          ) : (
            <>
              <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm shadow-green-900/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-900/10">
                    <UserCog size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedRole}</h3>
                    <p className="text-[11px] text-gray-400 font-semibold">{currentRoleMeta.description || 'Pengaturan Hak Akses pada Sistem'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   {saving && (
                     <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100 text-[11px] font-bold text-gray-400">
                       <Loader2 size={14} className="animate-spin text-emerald-600" />
                       Menyimpan...
                     </div>
                   )}
                   {result && !saving && (
                     <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-bold animate-in fade-in slide-in-from-top-2 ${
                       result.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                     }`}>
                       {result.type === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                       {result.msg}
                     </div>
                   )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6 pb-10">
                {/* Module Tree Renderer */}
                {(() => {
                  const renderModuleRow = (module: typeof MODULE_REGISTRY[number], gc: { text: string; bg: string; dot: string }, indent = 'px-6') => {
                    const isEnabled = permissions[selectedRole]?.[module.key] ?? false;
                    return (
                      <div
                        key={module.key}
                        onClick={() => togglePermission(module.key)}
                        className={`flex items-center justify-between ${indent} py-3.5 cursor-pointer hover:bg-gray-50/30 transition-all border-b border-gray-50 last:border-b-0`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`text-[13px] font-bold truncate transition-colors ${isEnabled ? 'text-gray-800' : 'text-gray-300 font-medium'}`}>
                            {module.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); togglePermission(module.key); }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${isEnabled ? 'bg-emerald-600' : 'bg-gray-200'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          <span className={`text-[11px] font-bold w-16 text-right transition-colors ${isEnabled ? 'text-emerald-600' : 'text-gray-300'}`}>
                            {isEnabled ? 'Aktif' : 'Off'}
                          </span>
                        </div>
                      </div>
                    );
                  };

                  return Object.entries(groupedModules).map(([group, modules]) => {
                    if (group.startsWith('Data Digit - ') || group.startsWith('Sistem - ')) return null;
                    const gc = GROUP_COLORS[group] || { text: 'text-gray-500', bg: 'bg-gray-100', dot: 'bg-gray-400' };

                    // Standard Group
                    if (group === 'Dashboard' || (!group.includes('Data Digit') && !group.includes('Sistem'))) {
                      const { enabled, total } = getGroupStats(selectedRole, group);
                      const isDashboard = group === 'Dashboard';
                      const isCollapsed = isDashboard ? false : (currentRoleCollapsed[group] ?? (enabled === 0));
                      
                      return (
                        <div key={group} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                          <div
                            className={`flex items-center justify-between px-6 py-4 bg-gray-50/50 border-b border-gray-100 select-none ${isDashboard ? '' : 'cursor-pointer hover:bg-gray-100/50'} transition-colors`}
                            onClick={() => !isDashboard && toggleCollapse(group, isCollapsed)}
                          >
                            <div className="flex items-center gap-3">
                              {!isDashboard && <ChevronRight size={16} className={`text-gray-400 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-90'}`} />}
                              <span className="text-[13px] font-bold text-gray-800">{group}</span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">{enabled}/{total} Aktif</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button onClick={e => { e.stopPropagation(); toggleGroup(group, true); }} className="text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all">On All</button>
                              <div className="w-px h-3 bg-gray-200" />
                              <button onClick={e => { e.stopPropagation(); toggleGroup(group, false); }} className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all">Off All</button>
                            </div>
                          </div>
                          {!isCollapsed && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                              {modules.map(m => renderModuleRow(m, gc))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Complex Tree Groups (Data Digit / Sistem)
                    const isDD = group === 'Data Digit';
                    const treeData = isDD ? [
                      { type: 'leaf', key: 'sync', label: 'Sinkronisasi All Data' },
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
                    ] : [
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
                          ]},
                          { type: 'leaf', key: 'produksi_jhp', label: 'Jurnal Harian Produksi' },
                          { type: 'leaf', key: 'produksi_jhp_target', label: 'Target Harian' }
                        ]},
                        { type: 'leaf', key: 'produksi_hasil', label: 'Hasil Produksi' }
                      ]},
                      { type: 'node', label: 'Penjualan', colorKey: 'Sistem - Penjualan', children: [
                        { type: 'leaf', key: 'kalkulasi_rekap_so', label: 'Rekap Sales Order Barang' }
                      ]},
                      { type: 'node', label: 'User', colorKey: 'Sistem - User', children: [
                        { type: 'leaf', key: 'hak_akses', label: 'Hak Akses' },
                        { type: 'leaf', key: 'kelola_user', label: 'Kelola User' }
                      ]},
                      { type: 'node', label: 'Settings', colorKey: 'Sistem - Settings', children: [
                        { type: 'node', label: 'Konversi Data', children: [
                          { type: 'node', label: 'Produksi', children: [
                            { type: 'leaf', key: 'settings_konversi_data', label: 'Jurnal Harian Produksi' }
                          ]}
                        ]}
                      ]},
                    ];

                    const collectKeys = (items: any[]): string[] =>
                      items.flatMap(item => item.type === 'leaf' ? [item.key] : collectKeys(item.children));

                    const syncKeys = isDD ? modules.map(m => m.key) : [];
                    const allKeys = Array.from(new Set(isDD ? [...syncKeys, ...collectKeys(treeData)] : collectKeys(treeData)));
                    const allEnabled = allKeys.filter(k => permissions[selectedRole]?.[k]).length;
                    const isParentCollapsed = currentRoleCollapsed[group] ?? (allEnabled === 0);

                    const renderTree = (items: any[], depth: number, parentColor?: any): React.ReactNode =>
                      items.map((item, idx) => {
                        if (item.type === 'leaf') {
                          const isEnabled = permissions[selectedRole]?.[item.key] ?? false;
                          return (
                            <div
                              key={item.key}
                              onClick={() => togglePermission(item.key)}
                              className="flex items-center justify-between py-3 pr-6 cursor-pointer hover:bg-gray-50/50 transition-all border-t border-gray-50"
                              style={{ paddingLeft: `${24 + depth * 16}px` }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`text-[13px] font-bold truncate transition-colors tracking-tight ${isEnabled ? 'text-gray-800' : 'text-gray-300 font-medium'}`}>{item.label}</span>
                                <code className="hidden sm:block text-[9px] font-bold text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded-lg border border-gray-100 shrink-0">{item.key}</code>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 ml-3">
                                <button onClick={e => { e.stopPropagation(); togglePermission(item.key); }} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-300 ${isEnabled ? 'bg-emerald-600' : 'bg-gray-200'}`}>
                                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${isEnabled ? 'translate-x-5.5' : 'translate-x-1'}`} />
                                </button>
                                <span className={`text-[11px] font-bold w-12 text-right transition-colors tracking-tight ${isEnabled ? 'text-emerald-600' : 'text-gray-300'}`}>{isEnabled ? 'Aktif' : 'Off'}</span>
                              </div>
                            </div>
                          );
                        }

                        const nodeColor = item.colorKey ? (GROUP_COLORS[item.colorKey] || parentColor) : parentColor;
                        const nodeKeys = collectKeys(item.children);
                        const nodeEnabled = nodeKeys.filter(k => permissions[selectedRole]?.[k]).length;
                        const collapseKey = `${group.toLowerCase().replace(/\s+/g, '-')}-${item.label.replace(/\s+/g, '-').toLowerCase()}-${depth}`;
                        const isNodeCollapsed = currentRoleCollapsed[collapseKey] ?? (nodeEnabled === 0);
                        const isTop = depth === 0;

                        return (
                          <div key={`${collapseKey}-${idx}`} className="border-t border-gray-100">
                            <div
                              className={`flex items-center justify-between pr-6 ${isTop ? 'py-3.5 bg-gray-50/20' : 'py-2 bg-gray-50/10'} select-none cursor-pointer hover:bg-gray-100/30 transition-colors`}
                              style={{ paddingLeft: `${24 + depth * 16}px` }}
                              onClick={() => toggleCollapse(collapseKey, isNodeCollapsed)}
                            >
                              <div className="flex items-center gap-3">
                                <ChevronRight size={14} className={`text-gray-400 transition-transform duration-300 ${isNodeCollapsed ? '' : 'rotate-90'}`} />
                                <span className={`text-[13px] font-bold text-gray-700`}>
                                  {item.label}
                                </span>
                                <span className="text-[9px] font-bold text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full">{nodeEnabled}/{nodeKeys.length}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={e => { e.stopPropagation(); toggleKeysList(nodeKeys, true); }} className="text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all">On All</button>
                                <div className="w-px h-3 bg-gray-200" />
                                <button onClick={e => { e.stopPropagation(); toggleKeysList(nodeKeys, false); }} className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all">Off All</button>
                              </div>
                            </div>
                            {!isNodeCollapsed && (
                              <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                                {renderTree(item.children, depth + 1, nodeColor || parentColor)}
                              </div>
                            )}
                          </div>
                        );
                      });

                    return (
                      <div key={group} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                        <div
                          className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-b border-gray-100 select-none cursor-pointer hover:bg-gray-100/50 transition-colors"
                          onClick={() => toggleCollapse(group, isParentCollapsed)}
                        >
                           <div className="flex items-center gap-3">
                             <ChevronRight size={16} className={`text-gray-400 transition-transform duration-300 ${isParentCollapsed ? '' : 'rotate-90'}`} />
                             <span className="text-[13px] font-bold text-gray-800">{isDD ? 'Data Digit' : 'Sistem'}</span>
                             <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-0.5 rounded-full">{allEnabled}/{allKeys.length} Aktif</span>
                           </div>
                           <div className="flex items-center gap-1.5 shrink-0">
                             <button onClick={e => { e.stopPropagation(); toggleKeysList(allKeys, true); }} className="text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all">On All</button>
                             <div className="w-px h-3 bg-gray-200" />
                             <button onClick={e => { e.stopPropagation(); toggleKeysList(allKeys, false); }} className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all">Off All</button>
                           </div>
                        </div>
                        {!isParentCollapsed && (
                          <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                            {renderTree(treeData, 0)}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}











