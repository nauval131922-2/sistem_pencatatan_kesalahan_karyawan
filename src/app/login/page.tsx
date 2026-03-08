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
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-4 min-h-screen animate-in fade-in duration-700">
      <div className="w-full max-w-sm">
        {/* Logo/Brand */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex items-center justify-center mb-6">
            <Image
              src={logoPic}
              alt="SIKKA Logo"
              className="w-20 h-20 object-contain rounded-2xl shadow-xl ring-1 ring-black/5"
              priority
            />
          </div>
          <div className="border-l-4 border-green-500 pl-4 py-1 text-left">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight leading-none mb-1">SIKKA LOGIN</h1>
            <p className="text-xs text-gray-400 font-medium">Sistem Pencatatan Kesalahan Karyawan</p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm animate-in shake duration-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-gray-400 mb-2 ml-1 uppercase tracking-widest">USERNAME</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-300 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full h-11 pl-11 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all bg-white hover:border-gray-300 text-gray-700 placeholder:text-gray-300"
                    placeholder="Masukkan username anda"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-gray-400 mb-2 ml-1 uppercase tracking-widest">PASSWORD</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <KeyRound size={18} className="text-gray-300 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full h-11 pl-11 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all bg-white hover:border-gray-300 text-gray-700 placeholder:text-gray-300"
                    placeholder="Masukkan password anda"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 flex items-center justify-center gap-2 px-4 rounded-lg shadow-md text-sm font-bold text-white bg-green-600 hover:bg-green-700 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  <span>MASUK SISTEM</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} PT. Buya Barokah
          </p>
          <div className="h-1 w-8 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
