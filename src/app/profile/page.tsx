"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  User,
  Camera,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { updateProfile } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";

interface UserData {
  name: string;
  username: string;
  photo?: string | null;
}

export default function ProfilePage() {
  const router = useRouter();

  // State for form
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // State for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data (in a real app, this might come from a context or an API fetch)
  useEffect(() => {
    // For now we will fetch the session info from an API route we'll create or directly
    // Because it's a client component, we'll fetch from a quick API route or pass it via layout
    const fetchUserData = async () => {
      setIsInitialLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setUsername(data.username || "");
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
      setMessage({ type: "error", text: "Ukuran foto maksimal 2MB." });
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
      setMessage({ type: "error", text: "Konfirmasi password tidak cocok." });
      return;
    }

    setIsLoading(true);

    startTransition(async () => {
      try {
        const result = await updateProfile({
          name,
          username,
          password: password || undefined,
          photo: photoUrl,
        });

        if (result.success) {
          setMessage({
            type: "success",
            text: "Profil Anda berhasil diperbarui dan disinkronkan.",
          });
          setPassword("");
          setConfirmPassword("");
          // Trigger cross-tab synchronization
          localStorage.setItem("sintak_profile_updated", Date.now().toString());
          // Force a refresh to update the Layout header
          router.refresh();
        } else {
          setMessage({
            type: "error",
            text: result.message || "Gagal memperbarui profil.",
          });
        }
      } catch (error) {
        setMessage({
          type: "error",
          text: "Terjadi kesalahan sistem saat menyimpan.",
        });
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700 overflow-hidden">
      <PageHeader
        title="Pengaturan Profil"
        description="Kelola informasi data diri dan keamanan akun Anda."
        showHelp={false}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center px-4 pb-10">
        <div className="w-full max-w-4xl bg-white border border-gray-100 rounded-2xl shadow-md shadow-emerald-900/5 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-8">
              {isInitialLoading ? (
                <div className="animate-pulse space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-16">
                    <div className="flex flex-col items-center">
                      <div className="w-40 h-40 rounded-xl bg-gray-50 border-4 border-white shadow-sm shadow-green-900/5 mb-6" />
                      <div className="h-3 w-24 bg-gray-100 rounded-full" />
                    </div>
                    <div className="space-y-10">
                      <div className="h-5 w-40 bg-gray-100 rounded-full" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <div className="h-3 w-24 bg-gray-100 rounded-full" />
                          <div className="h-12 bg-gray-50 rounded-lg" />
                        </div>
                        <div className="space-y-3">
                          <div className="h-3 w-24 bg-gray-100 rounded-full" />
                          <div className="h-12 bg-gray-50 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10">
                  {/* Avatar Column */}
                   <div className="flex flex-col items-center">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm shadow-emerald-900/10 relative z-0 group-hover:scale-105 transition-transform duration-500">
                        {photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoUrl}
                            alt="Preview"
                            className="w-full h-full object-cover animate-in fade-in duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-emerald-600 flex items-center justify-center">
                            <User size={64} className="text-white opacity-40" />
                          </div>
                        )}
                        <div
                          className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-10"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera
                            size={32}
                            className="text-white transform scale-90 group-hover:scale-110 transition-transform"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center shadow-sm shadow-emerald-900/20 transition-all z-20 border-4 border-white"
                        title="Ubah Foto"
                      >
                        <Camera size={16} />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                        accept="image/jpeg, image/png, image/webp"
                        className="hidden"
                      />
                    </div>
                    <div className="mt-6 text-center space-y-2">
                      <p className="text-[11px] font-bold text-gray-400 leading-loose">
                        Foto Profil
                      </p>
                      <p className="text-[10px] text-gray-300 font-bold bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
                        JPEG/PNG, Max 2MB
                      </p>
                    </div>
                  </div>

                  {/* Form Column */}
                  <div className="space-y-8">
                    {message && (
                      <div
                        className={`p-5 rounded-lg flex items-center gap-4 text-sm border shadow-sm shadow-green-900/5 animate-in slide-in-from-top-2 duration-300 ${
                          message.type === "success"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}
                      >
                        {message.type === "success" ? (
                          <CheckCircle2 size={22} className="shrink-0" />
                        ) : (
                          <AlertCircle size={22} className="shrink-0" />
                        )}
                        <span className="font-bold text-[11px] leading-tight flex-1">
                          {message.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => setMessage(null)}
                          className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}

                    <div className="grid gap-8">
                      {/* Basic Info */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 pb-3 border-b border-gray-50">
                          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-sm shadow-emerald-900/10">
                            <User size={18} />
                          </div>
                          <h3 className="text-[13px] font-bold text-gray-800">
                            Informasi Dasar
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label htmlFor="name" className="text-[10px] font-bold text-gray-400 ml-1">
                              Nama Lengkap
                            </label>
                            <input
                              id="name"
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                              className="w-full h-11 px-4 bg-gray-50/30 border border-gray-100 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                            />
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="username" className="text-[10px] font-bold text-gray-400 ml-1">
                              ID Pengguna
                            </label>
                            <input
                              id="username"
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              required
                              className="w-full h-11 px-4 bg-gray-50/30 border border-gray-100 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Security */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 pb-3 border-b border-gray-50">
                          <div className="w-9 h-9 bg-slate-800 text-white rounded-lg flex items-center justify-center shadow-sm shadow-slate-900/10">
                            <Lock size={18} />
                          </div>
                          <h3 className="text-[13px] font-bold text-gray-800">
                            Keamanan Akun
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label htmlFor="password" className="text-[10px] font-bold text-gray-400 ml-1">
                              Sandi Baru (Opsional)
                            </label>
                            <input
                              id="password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              autoComplete="new-password"
                              className="w-full h-11 px-4 bg-gray-50/30 border border-gray-100 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                            />
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-[10px] font-bold text-gray-400 ml-1">
                              Ulangi Sandi
                            </label>
                            <div className="relative">
                              <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                className={`w-full h-11 px-4 bg-gray-50/30 border rounded-xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white transition-all text-gray-800 ${
                                  password && confirmPassword
                                    ? password === confirmPassword
                                      ? "border-emerald-500"
                                      : "border-rose-500"
                                    : "border-gray-100"
                                }`}
                              />
                              {password && confirmPassword && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                  {password === confirmPassword ? (
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                  ) : (
                                    <AlertCircle size={18} className="text-rose-500" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 max-w-[300px]">
                Pastikan data Anda sudah benar sebelum menekan tombol simpan.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="h-11 px-6 text-[12px] font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    isPending ||
                    (password !== "" && password !== confirmPassword)
                  }
                  className="h-11 px-8 text-[13px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-900/10 flex items-center gap-3 disabled:opacity-50 ring-4 ring-emerald-500/0 hover:ring-emerald-500/5 active:scale-95"
                >
                  {isLoading || isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  <span>
                    {isLoading || isPending ? "Menyimpan..." : "Simpan Profil"}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}






