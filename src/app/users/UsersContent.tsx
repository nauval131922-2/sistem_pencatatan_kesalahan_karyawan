'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Users, ShieldCheck, UserCog, Plus, Search, 
  Edit2, Trash2, X,
  AlertCircle, BadgeCheck, Loader2, ShieldAlert
} from 'lucide-react';
import { getUsers, deleteUser } from '@/lib/users';
import UserFormModal from './UserFormModal';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua Jabatan');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load users data
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
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
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'Semua Jabatan' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Statistics
  const stats = useMemo(() => ({
    total: users.length,
    superAdmins: users.filter(u => u.role === 'Super Admin').length,
    admins: users.filter(u => u.role === 'Admin').length
  }), [users]);

  const handleDelete = async (id: number, username: string) => {
    if (id === currentUserId || username === currentUser) {
      setMessage({ type: 'error', text: 'Anda tidak dapat menghapus akun Anda sendiri.' });
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        const result = await deleteUser(id);
        if (result.success) {
          setMessage({ type: 'success', text: 'User berhasil dihapus.' });
          loadUsers();
        } else {
          setMessage({ type: 'error', text: result.message || 'Gagal menghapus user.' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Terjadi kesalahan sistem.' });
      }
    }
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
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      <div className="shrink-0">
        <div className="bg-white border border-gray-200 shadow-sm rounded-[10px] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
             <div className="relative w-full max-w-md group">
               <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Cari nama atau username..." 
                 className="w-full pl-11 pr-4 h-10 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-[13px] font-medium placeholder:text-gray-400"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
             
             <div className="flex items-center gap-2">
               <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">Filter:</span>
               <select 
                 value={roleFilter}
                 onChange={(e) => setRoleFilter(e.target.value)}
                 className="h-10 px-4 bg-slate-50 border border-gray-200 rounded-xl text-[12px] font-bold text-gray-700 focus:outline-none focus:border-green-500 cursor-pointer"
               >
                 <option>Semua Jabatan</option>
                 <option>Super Admin</option>
                 <option>Admin</option>
               </select>
             </div>
          </div>

          <button 
            onClick={handleCreate}
            className="px-5 h-10 bg-green-600 hover:bg-green-700 text-white text-[13px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Tambah User Baru</span>
          </button>
        </div>
      </div>

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

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-in slide-in-from-top-2 border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {message.type === 'success' ? <BadgeCheck size={18} /> : <AlertCircle size={18} />}
          <span className="font-bold">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      <div className="flex-1 bg-white border border-[#e5e7eb] rounded-[12px] shadow-sm flex flex-col min-h-0 overflow-hidden relative">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-md z-10 border-b border-gray-100">
              <tr className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Profil Pengguna</th>
                <th className="px-6 py-4">Jabatan / Peran</th>
                <th className="px-6 py-4 text-right">Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5" colSpan={3}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100"></div>
                        <div className="h-4 w-32 bg-gray-100 rounded"></div>
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
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                          {user.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.photo} alt={user.name} className="w-full h-full object-cover rounded-lg" />
                          ) : getInitials(user.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-extrabold text-gray-700">{user.name}</span>
                          <span className="text-[11px] text-gray-400 font-medium">@{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                        user.role === 'Super Admin' 
                          ? 'bg-purple-50 text-purple-600' 
                          : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="h-8 px-3 rounded-lg border border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-100 hover:bg-green-50 text-[11px] font-bold transition-all flex items-center gap-1.5"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        {user.id !== currentUserId && (
                          <button 
                            onClick={() => handleDelete(user.id, user.username)}
                            className="h-8 px-3 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 text-[11px] font-bold transition-all flex items-center gap-1.5"
                          >
                            <Trash2 size={12} />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
           <p className="text-[11px] font-bold text-gray-400">Total: {filteredUsers.length} Pengguna Terdaftar</p>
           <div className="flex items-center gap-2 opacity-30">
              <ShieldAlert size={14} className="text-gray-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">SIKKA System Security</span>
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
    </div>
  );
}
