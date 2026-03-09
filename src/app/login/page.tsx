'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { KeyRound, User, LogIn, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import logoPic from '../../../public/icon.png';

export default function LoginPage() {
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
        router.push('/');
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
    <div className="flex-1 flex flex-col items-center justify-center bg-[#f3f4f6] p-4 min-h-screen animate-in fade-in duration-700">
      <div className="w-full max-w-[340px]">
        {/* Logo/Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="inline-flex items-center justify-center mb-3">
            <Image
              src={logoPic}
              alt="SIKKA Logo"
              className="w-12 h-12 object-contain rounded-xl shadow-lg ring-1 ring-black/5"
              priority
            />
          </div>
          <div className="text-center px-4">
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight leading-none">SIKKA Login</h1>
            <p className="text-[11px] text-gray-400 font-semibold mt-1.5 uppercase tracking-wide">
              Sistem Pencatatan Kesalahan Karyawan
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 border-t-4 border-t-green-600 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-5 pt-6 flex flex-col gap-4">
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-xs animate-in shake duration-300">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-3.5">
              <div className="relative group">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={14} className="text-gray-300 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all bg-white hover:border-gray-300 text-gray-700 placeholder:text-gray-300"
                    placeholder="Username"
                    required
                  />
                </div>
              </div>

              <div className="relative group">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound size={14} className="text-gray-300 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all bg-white hover:border-gray-300 text-gray-700 placeholder:text-gray-300"
                    placeholder="Password"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-1 flex items-center justify-center gap-2 px-4 rounded-lg shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Masuk Sistem</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Small Muted Footer */}
        <div className="mt-6 text-center">
          <p className="text-[11px] font-medium text-gray-400 opacity-80 leading-relaxed max-w-[200px] mx-auto">
            &copy; {new Date().getFullYear()} Pt. Buya Barokah<br/>
            <span className="text-[10px] opacity-60">Div. Percetakan</span>
          </p>
        </div>
      </div>
    </div>
  );
}
