"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, Camera, MapPin, CheckSquare, Eye, EyeOff, KeyRound, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail) {
      setErrorMsg("Silakan masukkan alamat email akun Anda");
      return;
    }

    if (!loginPass) {
      setErrorMsg("Silakan masukkan kata sandi Anda");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Email atau kata sandi tidak sesuai");
      }

      if (data.user.role === "ADMIN" || data.user.role === "MANAGER") {
        router.push("/manager");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk ke sistem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setEmail("admin@difitech.id");
    setPassword("password123");
    handleLogin(undefined, "admin@difitech.id", "password123");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 p-4 sm:p-6">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Product Info with Difitech Red Header & Blue Accents */}
        <div className="flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 bg-gradient-to-b from-red-50/40 via-white to-blue-50/30 p-8 lg:col-span-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 shadow-md shadow-red-600/25">
                <span className="font-black text-white text-xl">D</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  <span className="text-red-600">Difitech</span> <span className="text-blue-600 text-lg font-bold">HRIS</span>
                </h1>
                <p className="text-xs text-slate-500 font-semibold">Presensi Verifikasi & Manajemen SDM</p>
              </div>
            </div>

            <div className="mt-8 space-y-3.5">
              <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-white p-3.5 shadow-2xs">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">CamStamp Watermark</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Akses kamera langsung dengan pembakaran stempel koordinat GPS & waktu ISO otomatis.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-white p-3.5 shadow-2xs">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Geofence Kantor Difitech</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Validasi radius perimeter kantor SCBD Jakarta dengan filter anti-manipulasi lokasi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Manajemen Tugas & Payroll</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Papan kerja harian, pelacakan waktu nyata, dan kalkulasi slip gaji otomatis.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Difitech HRIS • Enkripsi SHA-256</span>
            </div>
            <span className="text-red-600 font-bold">v1.0 Pro</span>
          </div>
        </div>

        {/* Right Side: Clean Production Login Form */}
        <div className="flex flex-col justify-between p-8 sm:p-10 lg:col-span-7">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Masuk ke Portal</h2>
                <p className="text-xs text-slate-500 mt-1">Masukkan alamat email dan kata sandi akun Anda</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Server Aktif
              </span>
            </div>

            {errorMsg && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 font-semibold flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-red-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Main Clean Form */}
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Email Perusahaan
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="nama@difitech.id atau admin@difitech.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Masukkan kata sandi Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label="Tampilkan kata sandi"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs text-slate-600">Ingat sesi saya</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3 text-xs font-bold text-white shadow-lg shadow-red-600/25 transition hover:from-red-700 hover:to-rose-700 active:scale-[0.99] disabled:opacity-50"
              >
                <span>{isLoading ? "Memverifikasi Kredensial..." : "Masuk ke Portal Difitech HRIS"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick Fill Super Admin Helper Card for initial setup */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Akun Super Admin Default</p>
                    <p className="text-[11px] text-slate-500 font-mono">admin@difitech.id • password123</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFillAdmin}
                  disabled={isLoading}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 hover:border-red-300 transition shadow-2xs disabled:opacity-50"
                >
                  ⚡ Masuk Cepat Admin
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[11px] text-slate-400">
              Hak Cipta © {new Date().getFullYear()} PT. Difitech Group. Seluruh Hak Dilindungi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
