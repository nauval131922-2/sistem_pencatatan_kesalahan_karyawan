'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, User, Camera, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { updateProfile } from '@/lib/auth';

interface UserData {
  name: string;
  username: string;
  photo?: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  
  // State for form
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  // State for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data (in a real app, this might come from a context or an API fetch)
  useEffect(() => {
    // For now we will fetch the session info from an API route we'll create or directly
    // Because it's a client component, we'll fetch from a quick API route or pass it via layout
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setName(data.name || '');
          setUsername(data.username || '');
          setPhotoUrl(data.photo || null);
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };
    fetchUserData();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: add validation for file type and size (e.g., < 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran foto maksimal 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateProfile({
        name,
        username,
        password: password || undefined,
        photo: photoUrl
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });
        setPassword('');
        setConfirmPassword('');
        // Force a refresh to update the Layout header
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.message || 'Gagal memperbarui profil.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="mb-6">
        <div className="border-l-4 border-green-500 pl-4 flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-800 leading-tight">Pengaturan Profil</h1>
        </div>
        <p className="text-sm text-gray-400 mt-0.5 pl-4">Kelola informasi data diri dan keamanan akun Anda.</p>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-8">
            
            {/* Avatar Column (1/4) */}
            <div className="flex flex-col items-center">
              <div className="relative mx-auto">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} className="text-slate-300" />
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors border-2 border-white"
                  title="Ubah Foto"
                >
                  <Camera size={14} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoChange} 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                />
              </div>
              <p className="text-xs text-center text-gray-400 mt-3">Format JPEG/PNG, Max 2MB.</p>
            </div>

            {/* Form Column (3/4) */}
            <div className="space-y-6">
              {message && (
                <div className={`p-4 rounded-lg flex items-start gap-3 text-sm border ${
                  message.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 pb-2 border-b border-gray-100">Informasi Dasar</h3>
                
                <div className="grid gap-1.5">
                  <label htmlFor="name" className="text-xs font-medium text-gray-500">Nama Lengkap</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-700"
                  />
                </div>
                
                <div className="grid gap-1.5">
                  <label htmlFor="username" className="text-xs font-medium text-gray-500">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="pb-2 border-b border-gray-100 flex items-center gap-2">
                  <Lock size={14} className="text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-700">Keamanan (Opsional)</h3>
                </div>
                <p className="text-xs text-gray-400 -mt-2">Biarkan kosong jika tidak ingin mengubah password.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <label htmlFor="password" className="text-xs font-medium text-gray-500">Password Baru</label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-700"
                    />
                  </div>
                  
                  <div className="grid gap-1.5">
                    <label htmlFor="confirmPassword" className="text-xs font-medium text-gray-500">Konfirmasi Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-700"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-sm"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
