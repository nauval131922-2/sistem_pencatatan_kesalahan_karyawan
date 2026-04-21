'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { KeyRound, User, LogIn, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import logoPic from '../../../public/icon.png';

export default function LoginContent() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(username, password);
      if (result.success) {
        router.push(result.firstRoute ?? '/dashboard');
        router.refresh();
      } else {
        setError(result.message || 'Login gagal.');
      }
    } catch (err) {
      setError('Terjadi kesalahan yang tidak terduga.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-deep)] p-4 min-h-screen animate-in fade-in duration-700">
      <div className="w-full max-w-[360px]">
        {/* Logo/Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex items-center justify-center mb-5">
            <div className="w-16 h-16 bg-[var(--accent-primary)] border-[4px] border-black shadow-[2.5px_2.5px_0_0_#000] flex items-center justify-center rounded-none">
              <Image
                src={logoPic}
                alt="SINTAK Logo"
                className="w-10 h-10 object-contain"
                priority
              />
            </div>
          </div>
          <div className="text-center px-4">
            <h1 className="text-3xl font-black text-black tracking-tight leading-none uppercase">SINTAK</h1>
            <div className="mt-3 inline-block border-[3px] border-black bg-[#fde047] px-3 py-1 shadow-[2px_2px_0_0_#000]">
              <p className="text-[11px] font-black text-black uppercase tracking-[0.2em]">
                Sistem Informasi Cetak
              </p>
            </div>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border-[4px] border-black shadow-[10px_10px_0_0_#000] rounded-none overflow-hidden">
          {/* Card header stripe */}
          <div className="bg-[#fde047] border-b-[4px] border-black px-5 py-3">
            <p className="text-[12px] font-black text-black uppercase tracking-widest">— Masuk ke Sistem —</p>
          </div>
          <form onSubmit={handleSubmit} className="p-5 pt-5 flex flex-col gap-4">
            {error && (
              <div className="p-4 bg-[#ff5e5e] border-[3px] border-black rounded-none flex items-start gap-3 text-white text-xs shadow-[2.5px_2.5px_0_0_#000]">
                <AlertCircle size={16} strokeWidth={3} className="mt-0.5 shrink-0" />
                <span className="font-black uppercase tracking-tight">{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-5">
              <div className="relative group">
                <label className="text-[11px] font-black text-black uppercase tracking-widest mb-2 block">ID Pengguna</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={16} strokeWidth={3} className="text-black/40" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full h-12 pl-12 pr-4 border-[3px] border-black rounded-none text-[13px] font-black focus:outline-none shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[2.5px_2.5px_0_0_#000] transition-all bg-white text-black placeholder:text-black/20 uppercase tracking-tighter"
                    placeholder="Masukkan username..."
                    required
                  />
                </div>
              </div>

              <div className="relative group">
                <label className="text-[11px] font-black text-black uppercase tracking-widest mb-2 block">Kata Sandi</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound size={16} strokeWidth={3} className="text-black/40" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full h-12 pl-12 pr-4 border-[3px] border-black rounded-none text-[13px] font-black focus:outline-none shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[2.5px_2.5px_0_0_#000] transition-all bg-white text-black placeholder:text-black/20 uppercase tracking-tighter"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 mt-4 flex items-center justify-center gap-3 px-6 rounded-none border-[3px] border-black font-black text-black uppercase tracking-widest bg-[#fde047] hover:bg-black hover:text-[#fde047] shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[3.5px_3.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-[4px] border-black/20 border-t-black rounded-none animate-spin" />
              ) : (
                <>
                  <LogIn size={20} strokeWidth={3} />
                  <span>Masuk Sistem</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Small Muted Footer */}
        <div className="mt-6 text-center">
          <p className="text-[11px] font-bold text-black/60 leading-relaxed">
            &copy; {new Date().getFullYear()} PT. Buya Barokah &mdash; Div. Percetakan
          </p>
        </div>
      </div>
    </div>
  );
}













