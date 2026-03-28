'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, User, Camera, Lock, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { updateProfile } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data (in a real app, this might come from a context or an API fetch)
  useEffect(() => {
    // For now we will fetch the session info from an API route we'll create or directly
    // Because it's a client component, we'll fetch from a quick API route or pass it via layout
    const fetchUserData = async () => {
      setIsInitialLoading(true);
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
      } finally {
        setTimeout(() => setIsInitialLoading(false), 500); // Small delay for smooth transition
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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

    startTransition(async () => {
      try {
        const result = await updateProfile({
          name,
          username,
          password: password || undefined,
          photo: photoUrl
        });

        if (result.success) {
          setMessage({ type: 'success', text: 'Profil Anda berhasil diperbarui dan disinkronkan.' });
          setPassword('');
          setConfirmPassword('');
          // Trigger cross-tab synchronization
          localStorage.setItem('sintak_profile_updated', Date.now().toString());
          // Force a refresh to update the Layout header
          router.refresh();
        } else {
          setMessage({ type: 'error', text: result.message || 'Gagal memperbarui profil.' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Terjadi kesalahan sistem saat menyimpan.' });
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      <PageHeader
        title="Pengaturan Profil"
        description="Kelola informasi data diri dan keamanan akun Anda."
        showHelp={false}
      />

      <div className="flex-1 overflow-y-auto flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white border border-[#e5e7eb] rounded-[12px] shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-8">
              {isInitialLoading ? (
                <div className="animate-pulse space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-12">
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 rounded-2xl bg-gray-100 mb-4" />
                      <div className="h-2 w-24 bg-gray-100 rounded" />
                    </div>
                    <div className="space-y-8">
                      <div className="h-4 w-32 bg-gray-100 rounded" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <div className="h-2 w-20 bg-gray-100 rounded mb-1" />
                          <div className="h-11 bg-gray-50 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 w-20 bg-gray-100 rounded mb-1" />
                          <div className="h-11 bg-gray-50 rounded-xl" />
                        </div>
                      </div>
                      <div className="h-4 w-32 bg-gray-100 rounded" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="h-11 bg-gray-50 rounded-xl" />
                        <div className="h-11 bg-gray-50 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-12">
                  
                  {/* Avatar Column */}
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-3xl bg-slate-50 flex items-center justify-center overflow-hidden ring-4 ring-slate-100 group-hover:ring-green-100 transition-all shadow-inner relative z-0">
                        {photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photoUrl} alt="Preview" className="w-full h-full object-cover animate-in fade-in duration-500" />
                        ) : (
                          <User size={48} className="text-slate-200" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10" onClick={() => fileInputRef.current?.click()}>
                          <Camera size={24} className="text-white transform scale-90 group-hover:scale-100 transition-transform" />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 border-4 border-white z-20"
                        title="Ubah Foto"
                        aria-label="Ubah Foto Profil"
                      >
                        <Camera size={18} />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handlePhotoChange} 
                        accept="image/jpeg, image/png, image/webp" 
                        className="hidden" 
                      />
                    </div>
                    <div className="mt-6 text-center">
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-loose">Foto Profil</p>
                      <p className="text-[10px] text-gray-400 font-medium">JPEG/PNG, Max 2MB</p>
                    </div>
                  </div>

                  {/* Form Column */}
                  <div className="space-y-8">
                    {message && (
                      <div className={`p-4 rounded-xl flex items-start gap-3 text-sm border animate-in slide-in-from-top-2 duration-300 ${
                        message.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {message.type === 'success' ? (
                          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        )}
                        <span className="font-medium text-[13px]">{message.text}</span>
                        <button type="button" onClick={() => setMessage(null)} className="ml-auto opacity-40 hover:opacity-100"><X size={14} /></button>
                      </div>
                    )}

                    <div className="grid gap-8">
                      {/* Basic Info */}
                      <div className="space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                          <User size={14} className="text-gray-400" />
                          <h3 className="text-[12px] font-extrabold text-gray-700 uppercase tracking-wider">Informasi Dasar</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="grid gap-2 group/field">
                            <label htmlFor="name" className="text-[11px] font-bold text-gray-400 ml-1 uppercase tracking-tight group-focus-within/field:text-green-600 transition-colors">Nama Lengkap</label>
                            <input
                              id="name"
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                              placeholder="Administrator"
                              className="w-full h-11 px-4 bg-slate-50/30 border border-gray-200 rounded-xl text-[13px] font-semibold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all text-gray-700 placeholder:text-gray-300 shadow-sm shadow-black/[0.02]"
                            />
                          </div>
                          
                          <div className="grid gap-2 group/field">
                            <label htmlFor="username" className="text-[11px] font-bold text-gray-400 ml-1 uppercase tracking-tight group-focus-within/field:text-green-600 transition-colors">Username</label>
                            <input
                              id="username"
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              required
                              placeholder="admin"
                              className="w-full h-11 px-4 bg-slate-50/30 border border-gray-200 rounded-xl text-[13px] font-semibold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all text-gray-700 placeholder:text-gray-300 shadow-sm shadow-black/[0.02]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Security */}
                      <div className="space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                          <Lock size={14} className="text-gray-400" />
                          <h3 className="text-[12px] font-extrabold text-gray-700 uppercase tracking-wider">Keamanan Akun</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="grid gap-2 group/field">
                            <label htmlFor="password" className="text-[11px] font-bold text-gray-400 ml-1 uppercase tracking-tight group-focus-within/field:text-green-600 transition-colors">Password Baru (Opsional)</label>
                            <input
                              id="password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              autoComplete="new-password"
                              className="w-full h-11 px-4 bg-slate-50/30 border border-gray-200 rounded-xl text-[13px] font-semibold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all text-gray-700 placeholder:text-gray-300 shadow-sm shadow-black/[0.02]"
                            />
                          </div>
                          
                          <div className="grid gap-2 group/field">
                            <label htmlFor="confirmPassword" className="text-[11px] font-bold text-gray-400 ml-1 uppercase tracking-tight group-focus-within/field:text-green-600 transition-colors">Konfirmasi Password</label>
                            <input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              autoComplete="new-password"
                              className={`w-full h-11 px-4 bg-slate-50/30 border rounded-xl text-[13px] font-semibold focus:outline-none focus:ring-4 transition-all text-gray-700 placeholder:text-gray-300 shadow-sm shadow-black/[0.02] ${
                                password && confirmPassword 
                                  ? (password === confirmPassword ? 'border-green-500 focus:ring-green-500/10' : 'border-red-500 focus:ring-red-500/10')
                                  : 'border-gray-200 focus:ring-green-500/10 focus:border-green-500 focus:bg-white'
                              }`}
                            />
                            {password && confirmPassword && (
                              <p className={`text-[10px] font-bold ml-1 ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                                {password === confirmPassword ? 'Password cocok!' : 'Password tidak cocok.'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Actions Footer */}
            <div className="bg-slate-50/50 border-t border-gray-100 p-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="h-11 px-6 text-[13px] font-bold text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading || isPending || (password !== '' && password !== confirmPassword)}
                className="h-11 px-8 text-[13px] bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2.5 transition-all hover:shadow-lg hover:shadow-green-600/20 active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed font-extrabold"
              >
                {isLoading || isPending ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                <span>{isLoading || isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

