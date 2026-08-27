"use client";

export const dynamic = "force-dynamic";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, Camera, MapPin, CheckSquare, Eye, EyeOff, UserCheck, X } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberAccount, setRememberAccount] = useState(true);
  const [savedUser, setSavedUser] = useState<{ email: string; name?: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load saved user from local device only
  useEffect(() => {
    try {
      const stored = localStorage.getItem("difitech_saved_account");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) {
          setSavedUser(parsed);
          setEmail(parsed.email);
        }
      }
    } catch {
      // Ignore localStorage errors in private browsing
    }
  }, []);

  const handleClearSavedAccount = () => {
    localStorage.removeItem("difitech_saved_account");
    setSavedUser(null);
    setEmail("");
    setPassword("");
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email.trim()) {
      setErrorMsg("Silakan masukkan alamat email akun Anda");
      return;
    }

    if (!password) {
      setErrorMsg("Silakan masukkan kata sandi Anda");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      let data: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (text.includes("Timeout")) {
          throw new Error("Server sedang menyelesaikan proses, silakan klik login sekali lagi");
        }
        throw new Error("Gagal terhubung ke server");
      }

      if (!res.ok) {
        throw new Error(data.error || "Email atau kata sandi tidak sesuai");
      }

      // Save or remove from personal device localStorage
      if (rememberAccount) {
        localStorage.setItem(
          "difitech_saved_account",
          JSON.stringify({
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
          })
        );
      } else {
        localStorage.removeItem("difitech_saved_account");
      }

      const redirectPath = data.user.role === "ADMIN" || data.user.role === "MANAGER" ? "/manager" : "/dashboard";
      window.location.href = redirectPath;
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk ke sistem");
    } finally {
      setIsLoading(false);
    }
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
                Sistem Aktif
              </span>
            </div>

            {errorMsg && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 font-semibold flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-red-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Personal Saved Account Banner (Only visible on this specific device if user checked remember) */}
            {savedUser && (
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-blue-900 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">
                      {savedUser.name ? `Akun Anda: ${savedUser.name}` : "Akun Tersimpan di Perangkat Ini"}
                    </p>
                    <p className="text-[11px] text-slate-500">{savedUser.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSavedAccount}
                  className="rounded-lg p-1 text-slate-400 hover:bg-blue-100 hover:text-slate-700 transition"
                  title="Hapus akun tersimpan di perangkat ini"
                >
                  <X className="h-4 w-4" />
                </button>
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
                    placeholder="nama@difitech.id atau email Anda"
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
                    checked={rememberAccount}
                    onChange={(e) => setRememberAccount(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs text-slate-600 font-medium">Ingat akun saya di perangkat ini</span>
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
