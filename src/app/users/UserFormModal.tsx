'use client';

import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { createUser, updateUser } from '@/lib/users';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface UserFormModalProps {
  user: User | null;
  onClose: (refresh: boolean) => void;
}

export default function UserFormModal({ user, onClose }: UserFormModalProps) {
  const isEditing = !!user;

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [role, setRole] = useState(user?.role || 'Admin');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        localStorage.setItem('sikka_data_updated', Date.now().toString());
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            {isEditing ? 'Edit User' : 'Tambah User Baru'}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-start gap-2 text-sm border border-red-100">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                placeholder="Ex. John Doe"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                placeholder="Ex. johnd"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Peran Akses (Role)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all font-medium"
              >
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {isEditing ? 'Password Baru (Opsional)' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                placeholder={isEditing ? 'Biarkan kosong jika tidak diubah' : 'Minimal 6 karakter'}
                required={!isEditing}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isEditing ? 'Simpan Perubahan' : 'Buat User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
