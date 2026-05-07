'use client';

import { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { 
  Users, ShieldCheck, UserCog, Plus, Search, 
  Edit2, Trash2, X,
  AlertCircle, BadgeCheck, Loader2, ShieldAlert,
  RefreshCw
} from 'lucide-react';
import SearchableDropdown from '@/components/SearchableDropdown';
import { getUsers, deleteUser } from '@/lib/users';
import UserFormModal from './UserFormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import TableFooter from '@/components/TableFooter';
import SearchAndReload from '@/components/SearchAndReload';
import Toast from '@/components/Toast';

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
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);


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

  // Outside click handling is managed within SearchableDropdown

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

  // Toast duration is handled by the Toast component itself via its duration prop and onClose callback


  const filteredUsers = useMemo(() => {
    const query = searchDebounced.toLowerCase().trim();
    return users.filter(user => {
      const matchesSearch = !query || user.name.toLowerCase().includes(query) || user.username.toLowerCase().includes(query);
      const matchesRole = !roleFilter || user.role === roleFilter;
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
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center text-green-600 font-bold text-[12px] shrink-0 overflow-hidden border border-green-100">
              {user.photo ? (
                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
              ) : getInitials(user.name)}
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-[13px] font-bold text-gray-800 truncate mb-1 tracking-tight">{user.name}</span>
              <span className="text-[11px] text-gray-400 font-semibold truncate">@{user.username}</span>
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
          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-2 leading-none border ${
            role === 'Super Admin' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' : 'bg-green-50 text-green-600 border-green-100'
          }`}>
            {role === 'Super Admin' ? <ShieldCheck size={12} /> : <UserCog size={12} />}
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
            <button onClick={(e) => { e.stopPropagation(); handleEdit(user); }} className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Edit User">
              <Edit2 size={16} />
            </button>
            {user.id !== currentUserId && (
              <button onClick={(e) => { e.stopPropagation(); handleDelete(user.id, user.username); }} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Hapus User">
                <Trash2 size={16} />
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

  const handleCloseToast = useCallback(() => setMessage(null), []);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 animate-in fade-in duration-500 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between gap-3 z-50">
        <SearchableDropdown
          id="users-role"
          value={roleFilter}
          items={customRoles}
          allLabel="Semua Jabatan"
          placeholder="Filter Jabatan"
          searchPlaceholder="Cari role..."
          triggerWidth="w-[300px]"
          panelWidth="w-[300px]"
          icon={<Users size={16} className={roleFilter ? 'text-green-600' : 'text-gray-400'} />}
          onChange={(val) => startTransition(() => setRoleFilter(val))}
        />
        <button 
          onClick={handleCreate} 
          className="flex items-center justify-center gap-3 px-6 h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl transition-all shadow-md shadow-emerald-900/10 active:scale-95"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Tambah Akun Baru</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      <div className="shrink-0">
        <SearchAndReload 
          searchQuery={searchImmediate} 
          setSearchQuery={setSearchImmediate} 
          onReload={loadUsers} 
          loading={loading} 
          placeholder="Cari user berdasarkan nama atau username..." 
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable columns={columns} data={filteredUsers} isLoading={loading} selectedIds={selectedIds} onRowClick={(id: any, e: any) => { setSelectedIds((prev) => { const next = new Set(prev); if (e.shiftKey && lastSelectedId !== null) { const currentIndex = filteredUsers.findIndex((u) => u.id === id); const lastIndex = filteredUsers.findIndex((u) => u.id === lastSelectedId); if (currentIndex !== -1 && lastIndex !== -1) { const start = Math.min(currentIndex, lastIndex); const end = Math.max(currentIndex, lastIndex); for (let i = start; i <= end; i++) next.add(filteredUsers[i].id); } } else if (e.ctrlKey || e.metaKey) { if (next.has(id)) next.delete(id); else next.add(id); } else { if (next.has(id) && next.size === 1) { if (e.detail === 1) next.clear(); } else { next.clear(); next.add(id); } } setLastSelectedId(id); return next; }); }} onRowDoubleClick={(id) => { const user = users.find(u => u.id === id); if (user) handleEdit(user); }} columnWidths={columnWidths} onColumnWidthChange={handleResize} rowHeight="h-16" />
      </div>
      <TableFooter totalCount={users.length} currentCount={filteredUsers.length} label="pengguna" selectedCount={selectedIds.size} onClearSelection={() => setSelectedIds(new Set())} loadTime={loadTime} />

      {showModal && (
        <UserFormModal 
          user={editingUser} 
          customRoles={customRoles} 
          onClose={(refresh) => { 
            setShowModal(false); 
            if (refresh) {
              loadUsers();
              setMessage({ type: 'success', text: `Data user berhasil ${editingUser ? 'diperbarui' : 'ditambahkan'}.` });
            }
          }} 
        />
      )}
      <ConfirmDialog isOpen={dialog.isOpen} type={dialog.type} title={dialog.title} message={dialog.message} onConfirm={dialog.onConfirm || (() => setDialog(prev => ({ ...prev, isOpen: false })))} onCancel={() => setDialog(prev => ({ ...prev, isOpen: false }))} />
      
      <Toast 
        message={message?.text || null} 
        type={message?.type} 
        duration={5000}
        onClose={handleCloseToast} 
      />
    </div>
  );
}



