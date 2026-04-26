'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save, RefreshCw, AlertCircle, Search, ChevronDown, User, ShieldCheck, UserCog, Lock } from 'lucide-react';
import { createUser, updateUser } from '@/lib/users';

interface UserData {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface UserFormModalProps {
  user: UserData | null;
  customRoles?: string[];
  onClose: (refresh: boolean) => void;
}

export default function UserFormModal({ user, customRoles = [], onClose }: UserFormModalProps) {
  const isEditing = !!user;

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [role, setRole] = useState(user?.role || (customRoles.length > 0 ? customRoles[0] : ''));
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom Dropdown State
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    if (isRoleDropdownOpen) {
      window.addEventListener('mousedown', handleGlobalClick);
    }
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, [isRoleDropdownOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || (!isEditing && !password)) {
      setError('Harap lengkapi semua field wajib.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let res;
      if (isEditing) {
        res = await updateUser(user!.id, { name, username, role, password: password || undefined });
      } else {
        res = await createUser({ name, username, role, password });
      }

      if (res.success) {
        onClose(true);
        localStorage.setItem('sintak_data_updated', Date.now().toString());
      } else {
        setError(res.message || 'Gagal menyimpan user.');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-300 relative border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
               <UserCog size={24} />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-gray-800 tracking-tight leading-none mb-1.5">
                {isEditing ? 'Edit Profil User' : 'Buat Akun Baru'}
              </h2>
              <p className="text-[11px] text-gray-400 font-bold leading-none">Manajemen Akses & Otoritas</p>
            </div>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-start gap-3 text-[12px] font-bold shadow-sm shadow-red-900/5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 ml-1 flex items-center gap-2">
                <User size={14} className="text-gray-300" /> Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50/30 border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all font-bold text-[13px] tracking-tight placeholder:text-gray-300 shadow-sm"
                placeholder="Contoh: Budi Santoso"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 ml-1 flex items-center gap-2">
                <ShieldCheck size={14} className="text-gray-300" /> Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                className="w-full px-4 py-2.5 bg-gray-50/30 border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all font-bold text-[13px] lowercase tracking-tight placeholder:text-gray-300 shadow-sm"
                placeholder="Contoh: budis"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 ml-1 flex items-center gap-2">
                <UserCog size={14} className="text-gray-300" /> Peran Akses (Role)
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(prev => !prev)}
                  className="w-full px-4 py-2.5 text-left bg-gray-50/30 border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all font-bold text-[13px] text-gray-700 flex items-center justify-between tracking-tight shadow-sm hover:border-emerald-200 group"
                >
                  <span className="truncate">{role}</span>
                  <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform duration-300 ${isRoleDropdownOpen ? 'rotate-180 text-emerald-500' : 'group-hover:text-emerald-500'}`} />
                </button>
                {isRoleDropdownOpen && (
                  <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-white border border-gray-100 rounded-xl shadow-md py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[250px]">
                    <div className="px-4 pb-3 shrink-0 border-b border-gray-50 mb-2">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-300 group-focus-within:text-green-500">
                          <Search size={14} />
                        </div>
                        <input
                          type="text"
                          autoFocus
                          placeholder="Cari role..."
                          value={roleSearchQuery}
                          onChange={(e) => setRoleSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 text-[12px] bg-gray-50 border-none focus:outline-none rounded-lg placeholder:text-gray-300 font-bold transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                      {customRoles
                        .filter(r => r.toLowerCase().includes(roleSearchQuery.toLowerCase()))
                        .map(cr => (
                          <button
                            type="button"
                            key={cr}
                            onClick={() => {
                              setRole(cr);
                              setIsRoleDropdownOpen(false);
                              setRoleSearchQuery('');
                            }}
                            className={`w-full text-left px-4 py-2 text-[12px] font-bold rounded-lg transition-all mb-1 ${
                              role === cr 
                                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100' 
                                : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                            }`}
                          >
                            {cr}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 ml-1 flex items-center gap-2">
                <Lock size={14} className="text-gray-300" /> {isEditing ? 'Password Baru (Opsional)' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 bg-gray-50/30 border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all font-bold text-[13px] tracking-tight placeholder:text-gray-300 shadow-sm"
                placeholder={isEditing ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                required={!isEditing}
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-6 py-3 text-[13px] font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 max-w-[200px] px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl shadow-md shadow-emerald-900/10 transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              <span>{isEditing ? 'Update User' : 'Buat User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

  );
}











