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

export default function UserFormModal({ user, customRoles = ['Super Admin', 'Admin'], onClose }: UserFormModalProps) {
  const isEditing = !!user;

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [role, setRole] = useState(user?.role || 'Admin');
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-[4px] border-black shadow-[3.5px_3.5px_0_0_#000] w-full max-w-md animate-in zoom-in-95 duration-200 relative">
        {/* Header */}
        <div className="px-6 py-5 border-b-[4px] border-black flex justify-between items-center bg-[#fde047]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black flex items-center justify-center border-2 border-black">
               <UserCog size={24} className="text-[#fde047]" strokeWidth={3} />
            </div>
            <h2 className="text-[18px] font-black text-black uppercase tracking-tighter leading-none">
              {isEditing ? 'Edit Profil User' : 'Buat Akun Baru'}
            </h2>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-1 text-black hover:bg-black hover:text-white transition-all border-2 border-transparent hover:border-black active:translate-y-[2px]"
          >
            <X size={24} strokeWidth={4} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7">
          {error && (
            <div className="mb-6 p-4 bg-[#ff5e5e] text-white border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] flex items-start gap-3 text-[12px] font-black uppercase tracking-wide">
              <AlertCircle size={18} className="shrink-0 mt-0.5" strokeWidth={3} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-black uppercase tracking-widest ml-1 flex items-center gap-2">
                <User size={14} strokeWidth={3} /> Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-none focus:outline-none focus:bg-[#fde047]/5 transition-all font-black text-[14px] uppercase tracking-tighter placeholder:text-black/20 focus:shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px]"
                placeholder="CONTOH: BUDI SANTOSO"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-black uppercase tracking-widest ml-1 flex items-center gap-2">
                <ShieldCheck size={14} strokeWidth={3} /> Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-none focus:outline-none focus:bg-[#fde047]/5 transition-all font-black text-[14px] lowercase tracking-tighter placeholder:text-black/20 focus:shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px]"
                placeholder="CONTOH: budis"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-black uppercase tracking-widest ml-1 flex items-center gap-2">
                <UserCog size={14} strokeWidth={3} /> Peran Akses (Role)
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(prev => !prev)}
                  className="w-full px-4 py-3 text-left bg-white border-[3px] border-black rounded-none focus:outline-none transition-all font-black text-[14px] text-black flex items-center justify-between uppercase tracking-tighter focus:shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px]"
                >
                  <span className="truncate">{role}</span>
                  <ChevronDown size={18} strokeWidth={3} className={`text-black shrink-0 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isRoleDropdownOpen && (
                  <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-white border-[3px] border-black rounded-none shadow-[3.5px_3.5px_0_0_#000] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[250px]">
                    <div className="px-3 pb-2 shrink-0 border-b-[2px] border-black/10 mb-2">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black/40">
                          <Search size={14} strokeWidth={3} />
                        </div>
                        <input
                          type="text"
                          autoFocus
                          placeholder="CARI ROLE..."
                          value={roleSearchQuery}
                          onChange={(e) => setRoleSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-[12px] bg-black/5 border-none focus:outline-none rounded-none placeholder:text-black/30 font-black uppercase tracking-tighter"
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
                            className={`w-full text-left px-3 py-2.5 text-[12px] font-black rounded-none transition-all uppercase tracking-tighter mb-1 ${
                              role === cr 
                                ? 'bg-black text-[#fde047]' 
                                : 'text-black hover:bg-[#fde047]'
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

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-black uppercase tracking-widest ml-1 flex items-center gap-2">
                <Lock size={14} strokeWidth={3} /> {isEditing ? 'Password Baru (Opsional)' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-none focus:outline-none focus:bg-[#fde047]/5 transition-all font-black text-[14px] tracking-tighter placeholder:text-black/20 focus:shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px]"
                placeholder={isEditing ? 'KOSONGKAN JIKA TIDAK DIUBAH' : 'MINIMAL 6 KARAKTER'}
                required={!isEditing}
              />
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="flex-1 px-4 py-3 text-[13px] font-black text-black/40 hover:text-black border-[3px] border-transparent hover:border-black transition-all uppercase tracking-widest"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 px-8 py-3 bg-[#fde047] hover:bg-black hover:text-[#fde047] text-black text-[13px] font-black border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[3.5px_3.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" strokeWidth={3} />
              ) : (
                <Save size={18} strokeWidth={3} />
              )}
              <span>{isEditing ? 'Update User' : 'Buat User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}








