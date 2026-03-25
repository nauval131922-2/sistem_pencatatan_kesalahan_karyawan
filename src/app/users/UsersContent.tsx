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

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  photo?: string | null;
  created_at?: string | null;
}

export default function UsersContent({ currentUser, currentUserId }: { currentUser: string, currentUserId: number }) {
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);


  // Column Resizing State
  const [columnWidths, setColumnWidths] = useState({
    profile: 400,
    role: 250,
    action: 200
  });

  const [isResizing, setIsResizing] = useState<string | null>(null);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof User | 'role', direction: 'asc' | 'desc' } | null>(null);

  const [dialog, setDialog] = useState<{
    isOpen: boolean, 
    type: 'success' | 'error' | 'danger' | 'confirm' | 'alert', 
    title: string, 
    message: string,
    onConfirm?: () => void
  }>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: ''
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const startTime = performance.now();
    try {
      const res = await getUsers();
      const endTime = performance.now();
      setLoadTime(Math.round(endTime - startTime));
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
      if (e.key === 'sikka_data_updated') {
        loadUsers();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadUsers]);


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

  // Sorting logic
  const sortedUsers = useMemo(() => {
    if (!sortConfig) return users;
    
    return [...users].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof User];
      let bValue: any = b[sortConfig.key as keyof User];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, sortConfig]);

  // Filter logic
  const filteredUsers = useMemo(() => {
    const query = searchDebounced.toLowerCase().trim();
    return sortedUsers.filter(user => {
      const matchesSearch = !query || 
                            user.name.toLowerCase().includes(query) || 
                            user.username.toLowerCase().includes(query);
      const matchesRole = roleFilter === 'Semua Jabatan' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [sortedUsers, searchDebounced, roleFilter]);

  // Resize Handler
  const startResizing = useCallback((column: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(column);

    const startX = e.pageX;
    const startWidth = columnWidths[column as keyof typeof columnWidths];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentWidth = Math.max(100, startWidth + (moveEvent.pageX - startX));
      setColumnWidths(prev => ({ ...prev, [column]: currentWidth }));
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths]);

  const toggleSort = (key: keyof User | 'role') => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const toggleSelectRow = (id: number, e: React.MouseEvent) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (e.shiftKey && lastSelectedId !== null) {
        // Range selection with Shift+Click
        const currentIndex = filteredUsers.findIndex((u) => u.id === id);
        const lastIndex = filteredUsers.findIndex((u) => u.id === lastSelectedId);

        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);
          for (let i = start; i <= end; i++) {
            next.add(filteredUsers[i].id);
          }
        }
      } else if (e.ctrlKey || e.metaKey) {
        // Toggle single with Ctrl/Cmd+Click
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      } else {
        // Single select (toggle off if already selected exclusively)
        if (next.has(id) && next.size === 1) {
          // Only deselect if it's a single click
          if (e.detail === 1) {
            next.clear();
          }
        } else {
          next.clear();
          next.add(id);
        }
      }

      setLastSelectedId(id);
      return next;
    });
  };


  const SortIcon = ({ sortKey }: { sortKey: string }) => {
    if (sortConfig?.key !== sortKey) return <div className="w-3" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-green-600" /> : <ChevronDown size={14} className="text-green-600" />;
  };

  const stats = useMemo(() => {
    let superAdmins = 0;
    let admins = 0;
    users.forEach(u => {
      if (u.role === 'Super Admin') superAdmins++;
      else if (u.role === 'Admin') admins++;
    });
    return { total: users.length, superAdmins, admins };
  }, [users]);

  const handleDelete = (id: number, username: string) => {
    if (id === currentUserId || username === currentUser) {
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'Akses Ditolak',
        message: 'Anda tidak dapat menghapus akun Anda sendiri.'
      });
      return;
    }

    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Hapus User',
      message: `Apakah Anda yakin ingin menghapus user "${username}"? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const result = await deleteUser(id);
          if (result.success) {
            localStorage.setItem('sikka_data_updated', Date.now().toString());
            setMessage({ type: 'success', text: 'User berhasil dihapus.' });
            loadUsers();
          } else {

            setMessage({ type: 'error', text: result.message || 'Gagal menghapus user.' });
          }
        } catch (error) {
          setMessage({ type: 'error', text: 'Terjadi kesalahan sistem.' });
        }
      }
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const getInitials = (name: string) => {
    return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      {/* Stats Cards at the Top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white rounded-[10px] border border-[#e5e7eb] p-5 h-[100px] flex items-center gap-4 shadow-sm hover:border-[#16a34a]/30 transition-colors text-blue-600">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-gray-800 leading-none mb-1">{stats.total}</span>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Total Pengguna</span>
          </div>
        </div>
        
        <div className="bg-white rounded-[10px] border border-[#e5e7eb] p-5 h-[100px] flex items-center gap-4 shadow-sm hover:border-[#16a34a]/30 transition-colors text-purple-600">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-gray-800 leading-none mb-1">{stats.superAdmins}</span>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Super Admin</span>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-[#e5e7eb] p-5 h-[100px] flex items-center gap-4 shadow-sm hover:border-[#16a34a]/30 transition-colors text-indigo-600">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <UserCog size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-gray-800 leading-none mb-1">{stats.admins}</span>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Admin</span>
          </div>
        </div>
      </div>

      {/* Top Controls Row */}
      <div className="shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 bg-white border border-gray-200 rounded-2xl shadow-sm">
          {[
            { label: 'Semua', value: 'Semua Jabatan', icon: Users },
            { label: 'Super Admin', value: 'Super Admin', icon: ShieldCheck },
            { label: 'Admin', value: 'Admin', icon: UserCog }
          ].map((role) => (
            <button
              key={role.value}
              onClick={() => {
                startTransition(() => {
                  setRoleFilter(role.value);
                });
              }}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200
                ${roleFilter === role.value 
                  ? 'bg-green-600 text-white shadow-md shadow-green-600/20' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <role.icon size={14} className={roleFilter === role.value ? 'text-white' : 'opacity-50'} />
              <span>{role.label}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={handleCreate}
          className="px-6 h-[52px] bg-green-600 hover:bg-green-700 text-white text-[13px] font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-green-600/10 active:scale-95"
        >
          <Plus size={20} />
          <span>Tambah User Baru</span>
        </button>
      </div>

      {/* Modern Search Bar - MATCHING InfractionsTable */}
      <div className="shrink-0 relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          {isSearching || isPending ? (
            <RefreshCw size={18} className="text-green-500 animate-spin" />
          ) : (
            <Search size={18} className="text-gray-400 group-focus-within:text-green-500 transition-colors" />
          )}
        </div>
        <input 
          type="text" 
          placeholder="Cari user berdasarkan nama lengkap atau username sistem..." 
          className="w-full pl-12 pr-12 h-[56px] bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-sm font-semibold placeholder:text-gray-300 shadow-sm"
          value={searchImmediate}
          onChange={(e) => setSearchImmediate(e.target.value)}
        />
        {searchImmediate && (
          <button 
            onClick={() => setSearchImmediate('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
            aria-label="Hapus Pencarian"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-in slide-in-from-top-2 border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {message.type === 'success' ? <BadgeCheck size={18} /> : <AlertCircle size={18} />}
          <span className="font-bold">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100" aria-label="Tutup Pesan"><X size={16} /></button>
        </div>
      )}

      {/* Table & Footer Wrapper */}
      <div className="flex-1 flex flex-col min-h-0 gap-2 overflow-hidden">
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col min-h-0 overflow-hidden relative">
          <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-left table-fixed border-collapse" style={{ width: Object.values(columnWidths).reduce((a, b) => a + b, 0), minWidth: '100%' }}>
              <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-md z-10 border-b border-gray-100">
                <tr className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">
                  <th 
                    className="px-6 py-4 relative group cursor-pointer hover:bg-gray-100/50 transition-colors border-r border-gray-100"
                    style={{ width: columnWidths.profile }}
                    onClick={() => toggleSort('name')}
                    role="button"
                    aria-label="Urutkan berdasarkan profil pengguna"
                  >
                    <div className="flex items-center gap-2 leading-none">Profil Pengguna <SortIcon sortKey="name" /></div>
                    <div 
                      className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                      onMouseDown={(e) => { e.stopPropagation(); startResizing('profile', e); }}
                    >
                      <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                    </div>
                  </th>

                  <th 
                    className="px-6 py-4 relative group cursor-pointer hover:bg-gray-100/50 transition-colors border-r border-gray-100"
                    style={{ width: columnWidths.role }}
                    onClick={() => toggleSort('role')}
                    role="button"
                    aria-label="Urutkan berdasarkan jabatan"
                  >
                    <div className="flex items-center gap-2 leading-none">Jabatan / Peran <SortIcon sortKey="role" /></div>
                    <div 
                      className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                      onMouseDown={(e) => { e.stopPropagation(); startResizing('role', e); }}
                    >
                      <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                    </div>
                  </th>

                  <th className="px-6 py-4 relative group" style={{ width: columnWidths.action }}>
                    <div className="text-right pr-4 leading-none">Manajemen</div>
                    <div 
                      className="absolute -right-2 top-0 bottom-0 w-4 z-20 cursor-col-resize group/resizer" 
                      onMouseDown={(e) => { e.stopPropagation(); startResizing('action', e); }}
                    >
                      <div className="absolute inset-y-0 right-2 w-[2px] bg-transparent group-hover/resizer:bg-green-500/50 group-active/resizer:bg-green-600 transition-colors" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse h-14">
                      <td className="px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100"></div>
                          <div className="flex flex-col gap-1.5">
                            <div className="h-3 w-32 bg-gray-100 rounded"></div>
                            <div className="h-2.5 w-20 bg-gray-50 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6">
                        <div className="h-5 w-24 bg-gray-100 rounded-full"></div>
                      </td>
                      <td className="px-6">
                        <div className="flex justify-end gap-2">
                          <div className="h-8 w-16 bg-gray-50 rounded-lg"></div>
                          <div className="h-8 w-16 bg-gray-50 rounded-lg"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                        <Users size={48} />
                        <p className="text-sm font-bold text-gray-400">Tidak ada user ditemukan.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => {
                    const isSelected = selectedIds.has(user.id);
                    return (
                      <tr 
                        key={user.id} 
                        onClick={(e) => toggleSelectRow(user.id, e)}
                        onDoubleClick={() => handleEdit(user)}
                        className={`transition-all duration-150 group h-14 cursor-pointer select-none border-b border-gray-100 ${isSelected ? 'bg-green-50 shadow-[inset_4px_0_0_0_#16a34a]' : `${idx % 2 === 1 ? 'bg-slate-50/20' : 'bg-white'} hover:bg-green-50/40`}`}
                      >

                        <td className="px-6 py-2 truncate relative border-r border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white font-black text-[10px] shadow-sm shrink-0 overflow-hidden ring-1 ring-black/5">
                            {user.photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                            ) : getInitials(user.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-extrabold text-gray-700 truncate leading-none mb-1">{user.name}</span>
                            <span className="text-[11px] text-gray-400 font-medium truncate leading-none">@{user.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2 border-r border-gray-100">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tight inline-flex items-center gap-1.5 leading-none ${
                          user.role === 'Super Admin' 
                            ? 'bg-purple-50 text-purple-600 border border-purple-100/50' 
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100/50'
                        }`}>
                          {user.role === 'Super Admin' ? <ShieldCheck size={10} /> : <UserCog size={10} />}
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-2">
                        <div className={`flex items-center justify-end gap-2 transition-all duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>

                          <button 
                            onClick={() => handleEdit(user)}
                            className="h-8 px-3 rounded-lg border border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-100 hover:bg-green-50 text-[11px] font-bold transition-all flex items-center gap-1.5 leading-none"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          {user.id !== currentUserId && (
                            <button 
                              onClick={() => handleDelete(user.id, user.username)}
                              className="h-8 px-3 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 text-[11px] font-bold transition-all flex items-center gap-1.5 leading-none"
                            >
                              <Trash2 size={12} />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>
                      </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info Banner */}
        <div className="flex items-center justify-between px-1 shrink-0 mt-1">
          <span className="text-[12px] leading-none font-bold text-gray-400">
            Menampilkan {filteredUsers.length} dari {users.length} total pengguna sistem
          </span>
          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                <span className="text-[12px] leading-none font-bold text-gray-400">{selectedIds.size} dipilih</span>
                <button 
                  onClick={() => setSelectedIds(new Set())}
                  className="text-[12px] leading-none font-black text-rose-500 hover:text-rose-600 underline underline-offset-4"
                >
                  Batal
                </button>
              </div>
            )}
            {loadTime !== null && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm border ${
                loadTime < 300 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                'bg-red-50 text-red-600 border-red-100'
              }`}>
                <span className="animate-pulse">⚡</span>
                <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
              </span>
            )}
          </div>
        </div>
      </div>


      {showModal && (
        <UserFormModal 
          user={editingUser}
          onClose={(refresh) => {
            setShowModal(false);
            if (refresh) loadUsers();
          }}
        />
      )}

      <ConfirmDialog 
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm || (() => setDialog(prev => ({ ...prev, isOpen: false })))}
        onCancel={() => setDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
