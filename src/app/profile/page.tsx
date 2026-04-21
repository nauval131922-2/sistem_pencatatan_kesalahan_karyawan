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
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      <PageHeader
        title="Pengaturan Profil"
        description="Kelola informasi data diri dan keamanan akun Anda."
        showHelp={false}
      />

      <div className="flex-1 overflow-y-auto flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white border-[3px] border-black rounded-none shadow-[3.5px_3.5px_0_0_#000] overflow-hidden mb-8">
          <form onSubmit={handleSubmit}>
            <div className="p-8">
              {isInitialLoading ? (
                <div className="animate-pulse space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-12">
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 rounded-none bg-black/5 mb-4 border-2 border-black/10" />
                      <div className="h-2 w-24 bg-black/5" />
                    </div>
                    <div className="space-y-8">
                      <div className="h-4 w-32 bg-black/5" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <div className="h-2 w-20 bg-black/5 mb-1" />
                          <div className="h-11 bg-black/5 border-2 border-black/10" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 w-20 bg-black/5 mb-1" />
                          <div className="h-11 bg-black/5 border-2 border-black/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-12">
                  {/* Avatar Column */}
                   <div className="flex flex-col items-center">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-none bg-black flex items-center justify-center overflow-hidden border-[3px] border-black shadow-[2.5px_2.5px_0_0_#000] relative z-0">
                        {photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoUrl}
                            alt="Preview"
                            className="w-full h-full object-cover animate-in fade-in duration-500"
                          />
                        ) : (
                          <User size={48} className="text-[#fde047]" strokeWidth={3} />
                        )}
                        <div
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera
                            size={32}
                            className="text-[#fde047] transform scale-90 group-hover:scale-100 transition-transform"
                            strokeWidth={3}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#fde047] hover:bg-black text-black hover:text-[#fde047] rounded-none flex items-center justify-center shadow-[2px_2px_0_0_#000] transition-all border-[3px] border-black z-20"
                        title="Ubah Foto"
                        aria-label="Ubah Foto Profil"
                      >
                        <Camera size={18} strokeWidth={3} />
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
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-loose">
                        Foto Profil
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        JPEG/PNG, Max 2MB
                      </p>
                    </div>
                  </div>

                  {/* Form Column */}
                  <div className="space-y-8">
                    {message && (
                      <div
                        className={`p-4 rounded-none flex items-start gap-4 text-sm border-[3px] border-black animate-in slide-in-from-top-2 duration-300 shadow-[2.5px_2.5px_0_0_#000] ${
                          message.type === "success"
                            ? "bg-[#fde047] text-black"
                            : "bg-[#ff5e5e] text-white"
                        }`}
                      >
                        {message.type === "success" ? (
                          <CheckCircle2 size={20} strokeWidth={3} className="shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle size={20} strokeWidth={3} className="shrink-0 mt-0.5" />
                        )}
                        <span className="font-black uppercase tracking-tight leading-tight">
                          {message.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => setMessage(null)}
                          className="ml-auto opacity-40 hover:opacity-100 transition-opacity"
                        >
                          <X size={18} strokeWidth={3} />
                        </button>
                      </div>
                    )}

                    <div className="grid gap-8">
                      {/* Basic Info */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-3 border-b-2 border-black/5">
                          <div className="w-8 h-8 bg-black text-white flex items-center justify-center border-2 border-black">
                            <User size={16} strokeWidth={3} />
                          </div>
                          <h3 className="text-[12px] font-black text-black uppercase tracking-widest">
                            Informasi Dasar
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="grid gap-2 group/field">
                            <label
                              htmlFor="name"
                              className="text-[11px] font-black text-black/40 ml-1 uppercase tracking-widest group-focus-within/field:text-black transition-colors"
                            >
                              Nama Lengkap
                            </label>
                            <input
                              id="name"
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                              placeholder="Administrator"
                              className="w-full h-12 px-4 bg-white border-[3px] border-black rounded-none text-[13px] font-black focus:outline-none shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[2.5px_2.5px_0_0_#000] transition-all text-black placeholder:text-black/20 uppercase tracking-tighter"
                            />
                          </div>

                          <div className="grid gap-2 group/field">
                            <label
                              htmlFor="username"
                              className="text-[11px] font-black text-black/40 ml-1 uppercase tracking-widest group-focus-within/field:text-black transition-colors"
                            >
                              ID Pengguna (Username)
                            </label>
                            <input
                              id="username"
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              required
                              placeholder="admin"
                              className="w-full h-12 px-4 bg-white border-[3px] border-black rounded-none text-[13px] font-black focus:outline-none shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[2.5px_2.5px_0_0_#000] transition-all text-black placeholder:text-black/20 uppercase tracking-tighter"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Security */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-3 border-b-2 border-black/5">
                          <div className="w-8 h-8 bg-black text-white flex items-center justify-center border-2 border-black">
                            <Lock size={16} strokeWidth={3} />
                          </div>
                          <h3 className="text-[12px] font-black text-black uppercase tracking-widest">
                            Keamanan Akun
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="grid gap-2 group/field">
                            <label
                              htmlFor="password"
                              className="text-[11px] font-black text-black/40 ml-1 uppercase tracking-widest group-focus-within/field:text-black transition-colors"
                            >
                              Sandi Baru (Opsional)
                            </label>
                            <input
                              id="password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              autoComplete="new-password"
                              className="w-full h-12 px-4 bg-white border-[3px] border-black rounded-none text-[13px] font-black focus:outline-none shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[2.5px_2.5px_0_0_#000] transition-all text-black placeholder:text-black/20"
                            />
                          </div>

                          <div className="grid gap-2 group/field">
                            <label
                              htmlFor="confirmPassword"
                              className="text-[11px] font-black text-black/40 ml-1 uppercase tracking-widest group-focus-within/field:text-black transition-colors"
                            >
                              Ulangi Sandi
                            </label>
                            <input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              placeholder="••••••••"
                              autoComplete="new-password"
                              className={`w-full h-12 px-4 bg-white border-[3px] rounded-none text-[13px] font-black focus:outline-none shadow-[2.5px_2.5px_0_0_#000] focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[2.5px_2.5px_0_0_#000] transition-all text-black placeholder:text-black/20 ${
                                password && confirmPassword
                                  ? password === confirmPassword
                                    ? "border-black"
                                    : "border-[#ff5e5e]"
                                  : "border-black"
                              }`}
                            />
                            {password && confirmPassword && (
                              <p
                                className={`text-[10px] font-black ml-1 uppercase tracking-tight ${password === confirmPassword ? "text-black/40" : "text-[#ff5e5e]"}`}
                              >
                                {password === confirmPassword
                                  ? "SANDI COCOK!"
                                  : "SANDI TIDAK COCOK."}
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
            <div className="bg-black/5 border-t-[3px] border-black p-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="h-12 px-6 text-[12px] font-black text-black/40 hover:text-black uppercase tracking-widest transition-all"
              >
                BATALKAN
              </button>
              <button
                type="submit"
                disabled={
                  isLoading ||
                  isPending ||
                  (password !== "" && password !== confirmPassword)
                }
                className="h-12 px-10 text-[13px] bg-[#fde047] hover:bg-black hover:text-[#fde047] text-black rounded-none border-[3px] border-black flex items-center gap-3 transition-all shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed font-black uppercase tracking-widest"
              >
                {isLoading || isPending ? (
                  <RefreshCw size={18} className="animate-spin" strokeWidth={3} />
                ) : (
                  <Save size={18} strokeWidth={3} />
                )}
                <span>
                  {isLoading || isPending ? "PROSES..." : "SIMPAN PROFIL"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}








