'use client';

import { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { 
  Users, ShieldCheck, UserCog, Plus, Search, 
  Edit2, Trash2, X,
  AlertCircle, BadgeCheck, Loader2, ShieldAlert,
  RefreshCw, ChevronUp, ChevronDown
} from 'lucide-react';
import { getUsers, deleteUser } from '@/lib/users';
import UserFormModal from './UserFormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import TableFooter from '@/components/TableFooter';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  photo?: string | null;
  created_at?: string | null;
}

export default function UsersContent({ currentUser, currentUserId, customRoles = [] }: { currentUser: string, currentUserId: number, customRoles?: string[] }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchImmediate, setSearchImmediate] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [roleFilter, setRoleFilter] = useState('Semua Jabatan');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('user_columnWidths');
        if (saved) return JSON.parse(saved);
    }
    return { profile: 400, role: 250, action: 150 };
  });

  const handleResize = useCallback((widths: any) => {
    setColumnWidths(widths);
    localStorage.setItem('user_columnWidths', JSON.stringify(widths));
  }, []);

  const [dialog, setDialog] = useState<{
    isOpen: boolean, 
    type: 'success' | 'error' | 'danger' | 'confirm' | 'alert', 
    title: string, 
    message: string,
    onConfirm?: () => void
  }>({ isOpen: false, type: 'confirm', title: '', message: '' });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const startTime = performance.now();
    try {
      const res = await getUsers();
      setLoadTime(Math.round(performance.now() - startTime));
      if (res.success && res.users) {
        setUsers(res.users as User[]);
      } else {
        setMessage({ type: 'error', text: res.message || 'Gagal memuat data user.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memuat data user.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') loadUsers();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadUsers]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.role-dropdown-container')) setIsRoleDropdownOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      startTransition(() => {
        setSearchDebounced(searchImmediate);
        setIsSearching(false);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchImmediate]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const filteredUsers = useMemo(() => {
    const query = searchDebounced.toLowerCase().trim();
    return users.filter(user => {
      const matchesSearch = !query || user.name.toLowerCase().includes(query) || user.username.toLowerCase().includes(query);
      const matchesRole = roleFilter === 'Semua Jabatan' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchDebounced, roleFilter]);

  const getInitials = (name: string) => (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      id: 'profile',
      header: 'Profil Pengguna',
      size: columnWidths.profile,
      cell: (info: any) => {
        const user = info.row.original as User;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-black flex items-center justify-center text-[#fde047] font-black text-[11px] shadow-[2px_2px_0_0_#000] shrink-0 overflow-hidden border-2 border-black">
              {user.photo ? (
                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
              ) : getInitials(user.name)}
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-[13px] font-black text-black truncate mb-0.5 uppercase tracking-tighter">{user.name}</span>
              <span className="text-[11px] text-black/40 font-bold truncate">@{user.username}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'role',
      header: 'Jabatan / Peran',
      size: columnWidths.role,
      cell: (info: any) => {
        const role = info.getValue() as string;
        return (
          <span className={`px-2.5 py-1 rounded-none text-[10px] font-black uppercase tracking-tight inline-flex items-center gap-1.5 leading-none border-2 border-black shadow-[2px_2px_0_0_#000] ${
            role === 'Super Admin' ? 'bg-black text-[#fde047]' : 'bg-[#fde047] text-black'
          }`}>
            {role === 'Super Admin' ? <ShieldCheck size={12} strokeWidth={3} /> : <UserCog size={12} strokeWidth={3} />}
            {role}
          </span>
        );
      }
    },
    {
      id: 'action',
      header: 'Manajemen',
      size: columnWidths.action,
      meta: { align: 'right' },
      cell: (info: any) => {
        const user = info.row.original as User;
        return (
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 group-[.is-selected]:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); handleEdit(user); }} className="p-1.5 text-black hover:bg-[#fde047] border-2 border-transparent hover:border-black rounded-none transition-all" title="Edit User">
              <Edit2 size={16} strokeWidth={3} />
            </button>
            {user.id !== currentUserId && (
              <button onClick={(e) => { e.stopPropagation(); handleDelete(user.id, user.username); }} className="p-1.5 text-black hover:bg-[#ff5e5e] hover:text-white border-2 border-transparent hover:border-black rounded-none transition-all" title="Hapus User">
                <Trash2 size={16} strokeWidth={3} />
              </button>
            )}
          </div>
        );
      }
    }
  ], [columnWidths, currentUserId]);

  const handleDelete = (id: number, username: string) => {
    if (id === currentUserId || username === currentUser) {
      setDialog({ isOpen: true, type: 'error', title: 'Akses Ditolak', message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
      return;
    }
    setDialog({
      isOpen: true, type: 'confirm', title: 'Hapus User', message: `Apakah Anda yakin ingin menghapus user "${username}"? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const result = await deleteUser(id);
          if (result.success) {
            localStorage.setItem('sintak_data_updated', Date.now().toString());
            setMessage({ type: 'success', text: 'User berhasil dihapus.' });
            loadUsers();
          } else setMessage({ type: 'error', text: result.message || 'Gagal menghapus user.' });
        } catch (error) { setMessage({ type: 'error', text: 'Terjadi kesalahan sistem.' }); }
      }
    });
  };

  const handleEdit = (user: User) => { setEditingUser(user); setShowModal(true); };
  const handleCreate = () => { setEditingUser(null); setShowModal(true); };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between gap-4 z-50">
        <div className="flex-1 max-w-[280px] relative role-dropdown-container z-50">
          <button onClick={() => setIsRoleDropdownOpen(prev => !prev)} className="w-full h-[52px] pl-10 pr-10 bg-white border-[3px] border-black rounded-none focus:outline-none transition-all text-[13px] font-black text-black shadow-[2.5px_2.5px_0_0_#000] flex items-center justify-between uppercase tracking-tighter hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[2.5px_2.5px_0_0_#000]">
            <span className="truncate">{roleFilter === 'Semua Jabatan' ? 'Filter Jabatan' : roleFilter}</span>
            <div className="absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none text-black"><Users size={18} strokeWidth={3} /></div>
            <div className="absolute top-1/2 -translate-y-1/2 right-3.5 pointer-events-none text-black"><ChevronDown size={18} strokeWidth={3} className={`transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} /></div>
          </button>
          {isRoleDropdownOpen && (
            <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-white border-[3px] border-black rounded-none shadow-[3.5px_3.5px_0_0_#000] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[350px]">
              <div className="px-3 pb-2 shrink-0 border-b-[2px] border-black/10 mb-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black/40"><Search size={14} strokeWidth={3} /></div>
                  <input type="text" autoFocus placeholder="Cari role..." value={roleSearchQuery} onChange={(e) => setRoleSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-[12px] bg-black/5 border-none focus:outline-none rounded-none placeholder:text-black/30 font-black uppercase tracking-tighter" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                {['Semua Jabatan', ...customRoles].filter(r => r.toLowerCase().includes(roleSearchQuery.toLowerCase())).map(role => (
                  <button key={role} onClick={() => { startTransition(() => setRoleFilter(role)); setIsRoleDropdownOpen(false); setRoleSearchQuery(''); }} className={`w-full text-left px-3 py-2.5 text-[12px] font-black rounded-none transition-all uppercase tracking-tighter mb-1 ${roleFilter === role ? 'bg-black text-[#fde047]' : 'text-black hover:bg-[#fde047]'}`}>{role}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={handleCreate} className="px-8 h-[52px] bg-[#fde047] hover:bg-black hover:text-[#fde047] text-black text-[13px] font-black rounded-none transition-all flex items-center justify-center gap-3 shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[3.5px_3.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none border-[3px] border-black uppercase tracking-widest">
          <Plus size={22} strokeWidth={4} /><span className="hidden sm:inline">Tambah Akun Baru</span><span className="sm:hidden">Tambah</span>
        </button>
      </div>

      <div className="shrink-0 relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">{isSearching || isPending ? <RefreshCw size={18} className="text-black animate-spin" strokeWidth={3} /> : <Search size={18} className="text-black/30 group-focus-within:text-black transition-colors" strokeWidth={3} />}</div>
        <input type="text" placeholder="CARI USER BERDASARKAN NAMA ATAU USERNAME..." className="w-full pl-12 pr-12 h-[56px] bg-white border-[3px] border-black rounded-none focus:outline-none transition-all text-[13px] font-black placeholder:text-black/20 shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[2.5px_2.5px_0_0_#000] uppercase tracking-tighter" value={searchImmediate} onChange={(e) => setSearchImmediate(e.target.value)} />
        {searchImmediate && <button onClick={() => setSearchImmediate('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black hover:text-white transition-all text-black border-2 border-transparent hover:border-black"><X size={16} strokeWidth={3} /></button>}
      </div>

      {message && (
        <div className={`p-4 rounded-none flex items-center gap-4 text-sm animate-in slide-in-from-top-2 border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] ${message.type === 'success' ? 'bg-[#fde047] text-black' : 'bg-[#ff5e5e] text-white'}`}>
          {message.type === 'success' ? <BadgeCheck size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
          <span className="font-black uppercase tracking-tight">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100 transition-opacity"><X size={18} strokeWidth={3} /></button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 gap-4 overflow-hidden">
        <DataTable columns={columns} data={filteredUsers} isLoading={loading} selectedIds={selectedIds} onRowClick={(id: any, e: any) => { setSelectedIds((prev) => { const next = new Set(prev); if (e.shiftKey && lastSelectedId !== null) { const currentIndex = filteredUsers.findIndex((u) => u.id === id); const lastIndex = filteredUsers.findIndex((u) => u.id === lastSelectedId); if (currentIndex !== -1 && lastIndex !== -1) { const start = Math.min(currentIndex, lastIndex); const end = Math.max(currentIndex, lastIndex); for (let i = start; i <= end; i++) next.add(filteredUsers[i].id); } } else if (e.ctrlKey || e.metaKey) { if (next.has(id)) next.delete(id); else next.add(id); } else { if (next.has(id) && next.size === 1) { if (e.detail === 1) next.clear(); } else { next.clear(); next.add(id); } } setLastSelectedId(id); return next; }); }} onRowDoubleClick={(id) => { const user = users.find(u => u.id === id); if (user) handleEdit(user); }} columnWidths={columnWidths} onColumnWidthChange={handleResize} rowHeight="h-14" />
        <TableFooter totalCount={users.length} currentCount={filteredUsers.length} label="pengguna" selectedCount={selectedIds.size} onClearSelection={() => setSelectedIds(new Set())} loadTime={loadTime} />
      </div>

      {showModal && <UserFormModal user={editingUser} customRoles={customRoles} onClose={(refresh) => { setShowModal(false); if (refresh) loadUsers(); }} />}
      <ConfirmDialog isOpen={dialog.isOpen} type={dialog.type} title={dialog.title} message={dialog.message} onConfirm={dialog.onConfirm || (() => setDialog(prev => ({ ...prev, isOpen: false })))} onCancel={() => setDialog(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
}
