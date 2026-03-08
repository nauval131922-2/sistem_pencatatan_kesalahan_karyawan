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
  ShieldCheck
} from 'lucide-react';
import { getUsers, deleteUser } from '@/lib/users';
import UserFormModal from './UserFormModal';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  created_at?: string;
}

export default function UsersContent({ currentUser }: { currentUser: string }) {
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
    <div className="flex flex-col h-full animate-in fade-in duration-500 w-full">
      {/* Structural Page Header Row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="border-l-4 border-green-500 pl-4 flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-800 leading-tight">Kelola User</h1>
          </div>
          <p className="text-sm text-gray-400 mt-0.5 pl-4">Manajemen akses dan akun pengguna aplikasi.</p>
        </div>
        
        <button
          onClick={handleCreate}
          className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-95 flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          <span>Tambah User Baru</span>
        </button>
      </div>

      {/* Equal-width Grid Stat bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-6 bg-white border border-gray-100 rounded-xl shadow-sm w-full divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden shrink-0">
        <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
            <Users size={20} className="text-gray-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Pengguna</span>
            <span className="text-xl font-bold text-gray-800 leading-none mt-1">{stats.total}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
            <Crown size={20} className="text-gray-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Super Admin</span>
            <span className="text-xl font-bold text-gray-800 leading-none mt-1">{stats.superAdmin}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
            <ShieldCheck size={20} className="text-gray-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Admin</span>
            <span className="text-xl font-bold text-gray-800 leading-none mt-1">{stats.admin}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter bar inner card layout */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-4 shrink-0">
        <div className="flex-1 w-full max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Cari nama atau username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-9 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-auto px-3 h-9 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-sm text-gray-600 font-medium"
          >
            <option value="All">Semua Jabatan</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin">Admin</option>
          </select>
          
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="h-9 w-9 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-500 rounded-lg transition-all disabled:opacity-50 shadow-sm shrink-0"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Full-width Table Card */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Table Content */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {error && (
            <div className="m-5 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm flex items-start gap-2 max-w-2xl mx-auto">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading && filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <RefreshCw className="animate-spin mb-4" size={32} />
              <p className="text-sm font-medium">Sinkronisasi Data...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-100">
                <Database size={48} />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Data User Kosong</h3>
              <p className="text-xs text-gray-400 max-w-[240px] mx-auto leading-relaxed">
                Sistem tidak menemukan data user yang Anda cari. Silakan periksa kembali filter atau tambahkan user baru.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600 min-w-[700px]">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm">
                <tr className="text-[11px] uppercase tracking-wider text-gray-400 font-medium border-b border-gray-100">
                  <th className="px-5 py-3">Profil Pengguna</th>
                  <th className="px-5 py-3">Jabatan / Peran</th>
                  <th className="px-5 py-3 text-right">Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const initials = getInitials(u.name);
                          let bgClass = "bg-gray-50 text-gray-500 border-gray-100";
                          if (initials === 'MS') bgClass = "bg-blue-50 text-blue-600 border-blue-100";
                          if (initials === 'NG') bgClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
                          
                          return (
                            <div className={`w-9 h-9 rounded-lg ${bgClass} flex items-center justify-center font-bold text-xs shrink-0 border transition-colors`}>
                              {initials}
                            </div>
                          );
                        })()}
                        <div className="flex flex-col min-w-0">
                          <p className="font-semibold text-gray-700 truncate text-sm">{u.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium tracking-wide">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        u.role === 'Super Admin' 
                          ? 'bg-purple-50 text-purple-600 border-purple-100' 
                          : 'bg-green-50 text-green-700 border-green-100'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(u)}
                          className="text-blue-500 hover:text-blue-700 text-sm font-medium px-3 py-1.5 transition-colors"
                        >
                          Edit
                        </button>
                        
                        {u.username !== currentUser && (
                          <>
                            <span className="text-gray-100 text-[10px]">|</span>
                            <button
                                onClick={() => handleDelete(u)}
                                className="text-red-400 hover:text-red-600 text-sm font-medium px-3 py-1.5 transition-colors"
                              >
                                Hapus
                              </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer info banner */}
        {!loading && filteredUsers.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs text-gray-400">
            <p className="font-medium">
              Menampilkan {filteredUsers.length} dari {users.length} pengguna terdaftar
            </p>
            <div className="flex items-center gap-2 opacity-50 grayscale">
              <p className="text-[9px] font-bold uppercase tracking-widest">SIKKA SYSTEM SECURITY</p>
              <ShieldCheck size={12} />
            </div>
          </div>
        )}
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



