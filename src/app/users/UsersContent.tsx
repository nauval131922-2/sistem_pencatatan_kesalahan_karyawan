'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Pencil, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  Search, 
  Users, 
  Crown, 
  Plus,
  Database,
  ShieldCheck,
  Shield
} from 'lucide-react';
import { getUsers, deleteUser } from '@/lib/users';
import UserFormModal from './UserFormModal';
import PageHeader from '@/components/PageHeader';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  photo?: string | null;
  created_at?: string;
}

export default function UsersContent({ currentUser, currentUserId }: { currentUser: string, currentUserId: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      if (data.success && data.users) {
        setUsers(data.users as User[]);
      } else {
        setError(data.message || 'Gagal memuat data user.');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sikka_profile_updated') {
        fetchUsers();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const stats = useMemo(() => {
    return {
      total: users.length,
      superAdmin: users.filter(u => u.role === 'Super Admin').length,
      admin: users.filter(u => u.role === 'Admin').length
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (u.username || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (user: User) => {
    if (confirm(`Apakah Anda yakin ingin menghapus user "${user.name}"?`)) {
      try {
        const res = await deleteUser(user.id);
        if (res.success) {
          fetchUsers();
          localStorage.setItem('sikka_data_updated', Date.now().toString());
        } else {
          alert('Gagal: ' + res.message);
        }
      } catch (err) {
        alert('Terjadi kesalahan saat menghapus.');
      }
    }
  };

  const handleModalClose = (refresh: boolean) => {
    setIsModalOpen(false);
    if (refresh) fetchUsers();
  };

  const getInitials = (name: string) => {
    return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      <PageHeader
        title="Kelola User"
        description="Manajemen akses dan akun pengguna aplikasi."
        rightElement={
          <button
            onClick={handleCreate}
            className="bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg px-5 h-10 text-[13px] font-extrabold transition-all active:scale-[0.98] flex items-center gap-2.5 shadow-sm"
          >
            <Plus size={18} />
            <span>Tambah User Baru</span>
          </button>
        }
      />

      {/* Stat Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white rounded-[10px] border border-[#e5e7eb] p-5 h-[100px] flex items-center gap-4 shadow-sm hover:border-[#16a34a]/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <Users size={24} className="text-[#16a34a]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-800 tracking-tight leading-none mb-1.5">{stats.total}</span>
            <span className="text-[12px] text-[#9ca3af] font-bold tracking-tight">Total Pengguna</span>
          </div>
        </div>
        
        <div className="bg-white rounded-[10px] border border-[#e5e7eb] p-5 h-[100px] flex items-center gap-4 shadow-sm hover:border-purple-200 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <Crown size={24} className="text-purple-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-800 tracking-tight leading-none mb-1.5">{stats.superAdmin}</span>
            <span className="text-[12px] text-[#9ca3af] font-bold tracking-tight">Super Admin</span>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-[#e5e7eb] p-5 h-[100px] flex items-center gap-4 shadow-sm hover:border-blue-200 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} className="text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-800 tracking-tight leading-none mb-1.5">{stats.admin}</span>
            <span className="text-[12px] text-[#9ca3af] font-bold tracking-tight">Admin</span>
          </div>
        </div>
      </div>

      {/* Control Panel (Unified Filter Card) */}
      <div className="shrink-0">
        <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[10px] px-5 py-3.5 flex items-center justify-between gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#16a34a] transition-colors" size={16} />
            <input
              type="text"
              placeholder="Cari nama atau username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 h-10 bg-white border border-gray-200 rounded-[10px] focus:outline-none focus:border-[#16a34a] focus:ring-4 focus:ring-[#16a34a]/10 transition-all text-[13px] font-medium placeholder:text-gray-300 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 h-10 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#16a34a] focus:ring-4 focus:ring-[#16a34a]/10 transition-all text-[13px] text-gray-600 font-bold cursor-pointer shadow-sm"
            >
              <option value="All">Semua Jabatan</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
            </select>
            
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="h-10 w-10 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-[#16a34a] hover:border-[#16a34a] rounded-lg transition-all disabled:opacity-50 shadow-sm active:scale-[0.98]"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container for Results */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 relative">
        <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[10px] overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto custom-scrollbar relative">
            {error && (
              <div className="m-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p className="font-bold">{error}</p>
              </div>
            )}

            {loading && filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <RefreshCw className="animate-spin mb-4" size={40} />
                <p className="text-sm font-bold tracking-widest uppercase">Sinkronisasi Data...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-5">
                  <Search className="text-gray-200" size={32} />
                </div>
                <h3 className="text-sm font-extrabold text-gray-800 mb-2">Tidak ada pengguna ditemukan</h3>
                <p className="text-[12px] text-[#9ca3af] max-w-[280px] mx-auto leading-relaxed font-medium">
                  Silakan coba kata kunci lain atau sesuaikan filter jabatan Anda.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                  <tr className="text-[11px] text-[#6b7280] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">PROFIL PENGGUNA</th>
                    <th className="px-6 py-3.5">JABATAN / PERAN</th>
                    <th className="px-6 py-3.5 text-right">MANAJEMEN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((u, idx) => (
                    <tr 
                      key={u.id} 
                      className={`hover:bg-green-50/30 transition-colors group h-10 ${idx % 2 === 1 ? 'bg-[#f9fafb]' : 'bg-white'}`}
                    >
                      <td className="px-6 py-1">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-[#16a34a] flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm overflow-hidden border border-green-200/50">
                            {u.photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(u.name)
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="font-bold text-gray-800 truncate text-[14px] leading-tight mb-0.5">{u.name}</p>
                            <p className="text-[12px] text-[#9ca3af] font-medium leading-tight">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border tracking-wider ${
                          u.role === 'Super Admin' 
                            ? 'bg-purple-50 text-[#7c3aed] border-purple-100' 
                            : 'bg-blue-50 text-[#2563eb] border-blue-100'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-1 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleEdit(u)}
                            className="px-4 py-1.5 text-[11px] font-extrabold text-[#16a34a] border border-[#16a34a]/30 hover:bg-[#16a34a] hover:text-white rounded-md transition-all active:scale-[0.95]"
                          >
                            Edit
                          </button>
                          
                          {u.id !== currentUserId && (
                            <button
                              onClick={() => handleDelete(u)}
                              className="px-4 py-1.5 text-[11px] font-extrabold text-red-500 border border-red-100 hover:bg-red-500 hover:text-white rounded-md transition-all active:scale-[0.95]"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Footer Banner */}
          {!loading && (
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center shrink-0 shadow-inner">
              <span className="text-[12px] font-bold text-[#9ca3af]">
                Menampilkan {filteredUsers.length} dari {users.length} pengguna terdaftar
              </span>
              <div className="flex items-center gap-2 text-[#9ca3af] opacity-60 font-bold">
                <Shield size={14} className="text-[#9ca3af]" />
                <span className="text-[11px] tracking-widest">SIKKA System Security</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <UserFormModal
          user={editingUser}
          onClose={(refresh: boolean) => handleModalClose(refresh)}
        />
      )}
    </div>
  );
}



