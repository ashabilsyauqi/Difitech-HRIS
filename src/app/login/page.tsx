"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, Camera, MapPin, CheckSquare, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password || "password123";

    if (!loginEmail) {
      setErrorMsg("Silakan masukkan alamat email");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login gagal, periksa email & password");
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

  const demoAccounts = [
    {
      name: "Ashabil",
      role: "MANAGER",
      email: "ashabil@hris.local",
      title: "VP of Engineering & Tech Lead",
      color: "border-blue-200 bg-blue-50/70 text-blue-900 hover:bg-blue-100",
    },
    {
      name: "Rayhan",
      role: "ADMIN",
      email: "rayhan@hris.local",
      title: "Head of People Operations",
      color: "border-red-200 bg-red-50/70 text-red-900 hover:bg-red-100",
    },
    {
      name: "Agus",
      role: "KARYAWAN",
      email: "agus@hris.local",
      title: "Senior Frontend Engineer",
      color: "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100",
    },
    {
      name: "Rohmat",
      role: "KARYAWAN",
      email: "rohmat@hris.local",
      title: "Lead UI/UX Designer",
      color: "border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100",
    },
    {
      name: "Farhan",
      role: "KARYAWAN",
      email: "farhan@hris.local",
      title: "Lead QA Automation Engineer",
      color: "border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100",
    },
    {
      name: "Rafi",
      role: "KARYAWAN",
      email: "rafi@hris.local",
      title: "Growth Marketing (Belum Masuk)",
      color: "border-purple-200 bg-purple-50/70 text-purple-900 hover:bg-purple-100",
    },
  ];

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100/70 p-4 sm:p-6">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl grid grid-cols-1 lg:grid-cols-12">
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
                <p className="text-xs text-slate-500 font-semibold">Presensi Verifikasi & Tugas Harian</p>
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
                  <h4 className="text-xs font-bold text-slate-900">Manajemen Tugas Harian</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Papan kerja Kanban, pencatatan waktu nyata, dan pelampiran bukti hasil kerja.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
            <span>Difitech HRIS • Keamanan Terverifikasi</span>
            <span className="text-red-600 font-bold">v1.0</span>
          </div>
        </div>

        {/* Right Side: Login & Quick Access */}
        <div className="flex flex-col justify-between p-8 lg:col-span-7">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Masuk ke Portal</h2>
                <p className="text-xs text-slate-500 mt-1">Pilih akun demo cepat atau masukkan email</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 border border-red-200">
                <Sparkles className="h-3 w-3 text-red-600" />
                Demo Siap Pakai
              </span>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
                {errorMsg}
              </div>
            )}

            {/* 1-Click Demo Switcher with 6 Indonesian profiles */}
            <div className="mt-5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                ⚡ Akses Cepat 1-Klik (Akun Demo Indonesia)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword("password123");
                      handleLogin(undefined, acc.email, "password123");
                    }}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition ${acc.color} shadow-2xs`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{acc.name}</p>
                      <p className="text-[10px] text-slate-600 truncate max-w-[140px]">{acc.title}</p>
                    </div>
                    <span className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase bg-white/80 border border-slate-200 flex-shrink-0">
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] uppercase font-bold text-slate-400">atau login manual</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="contoh: ashabil@hris.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">Password default demo: <span className="font-mono font-bold text-slate-600">password123</span></p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3 text-xs font-bold text-white shadow-md shadow-red-600/25 transition hover:from-red-700 hover:to-rose-700 disabled:opacity-50"
              >
                <span>{isLoading ? "Memproses..." : "Masuk ke Dashboard Difitech"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
