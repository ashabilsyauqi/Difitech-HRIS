"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Layers,
  Users,
  Sparkles,
  Eye,
  EyeOff,
  UserCheck,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  MessageSquare,
  CheckCircle2,
  Zap
} from "lucide-react";

const SLIDES = [
  {
    id: 1,
    tag: "BIGBOARD KANBAN 6 DIVISI",
    title: "Kolaborasi Horizontal Lintas Tim Tanpa Sekat",
    desc: "Papan kerja terpadu untuk Sosmed, Web Dev, Ads Performance, SEO, Marketplace, & Bisnis dengan alur delegasi otomatis dan visibilitas menyeluruh.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=85",
    badgeIcon: Layers,
    featureChip: "Corong Delegasi Otomatis",
    metrics: "6 Divisi Terintegrasi"
  },
  {
    id: 2,
    tag: "KONSOLIDASI DEADLINE BILATERAL",
    title: "Negosiasi Target Fleksibel & Audit Logs Lengkap",
    desc: "Deadline bukan lagi patokan kaku sepihak. Assignee dan Creator dapat saling bernegosiasi tanggal penyelesaian hingga sepakat dengan riwayat logs transparan.",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1400&q=85",
    badgeIcon: CalendarClock,
    featureChip: "⚡ Nego & ✓ ACC Realtime",
    metrics: "100% Tercatat di Logs"
  },
  {
    id: 3,
    tag: "LEMBAR KERJA & REVIEW GATE",
    title: "Diskusi Berbalas, Lampiran & Validasi Hasil",
    desc: "Lembar kerja lengkap dengan ruang chat berbalas, berbagi lampiran media, histori mutasi pengerjaan, serta gerbang ACC atau Minta Revisi langsung.",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85",
    badgeIcon: MessageSquare,
    featureChip: "Komentar & Attachment Live",
    metrics: "Approval & Revision Gate"
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberAccount, setRememberAccount] = useState(true);
  const [savedUser, setSavedUser] = useState<{ email: string; name?: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play slider
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

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

      window.location.href = "/dashboard/workspace";
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk ke sistem");
    } finally {
      setIsLoading(false);
    }
  };

  const activeSlide = SLIDES[currentSlide];
  const BadgeIcon = activeSlide.badgeIcon;

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col lg:grid lg:grid-cols-12 overflow-x-hidden selection:bg-red-500 selection:text-white">
      {/* ======================================================== */}
      {/* COLUMN 1: Visual Showcase, Interactive Carousel & Slides */}
      {/* ======================================================== */}
      <div
        className="relative lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-hidden bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Image Layers with Full Clarity & Vividness */}
        <div className="absolute inset-0 z-0">
          {SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center transition-transform duration-1000"
              />
              {/* Gentle directional scrim to maintain bright contrast while keeping the photo fully visible */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-slate-950/15 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-slate-950/20" />
            </div>
          ))}
        </div>

        {/* Top Header inside Column 1 */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-2.5 backdrop-blur-md border border-white/90 shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-xs border border-red-100 ring-2 ring-red-50">
              <img src="/logo.png" alt="DifWorkBoard" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span className="text-red-600">Dif</span>
                <span className="text-slate-900">WorkBoard</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                  Agile
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Enterprise Task & Team Coordination</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 border border-white/90 shadow-md backdrop-blur-md text-[11px] text-slate-700 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>difworkboard.difitech.id</span>
          </div>
        </div>

        {/* Center Main Carousel Content */}
        <div className="relative z-10 my-8 sm:my-12 lg:my-14 max-w-xl rounded-3xl bg-white/95 p-6 sm:p-8 backdrop-blur-xl border border-white/90 shadow-2xl shadow-slate-900/15">
          {/* Animated Category Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200/80 shadow-xs mb-4 text-xs font-bold text-red-700 tracking-wide">
            <BadgeIcon className="h-4 w-4 text-red-600" />
            <span>{activeSlide.tag}</span>
          </div>

          {/* Slide Title & Description */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {activeSlide.title}
          </h2>
          <p className="mt-3.5 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {activeSlide.desc}
          </p>

          {/* Modern Minimalist Feature Card Preview */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100/80 border border-red-200/60 flex items-center justify-center text-red-600 shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Fitur Unggulan</p>
                <p className="text-sm font-bold text-slate-900">{activeSlide.featureChip}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{activeSlide.metrics}</span>
            </div>
          </div>
        </div>

        {/* Carousel Bottom Controls & Pagination */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 backdrop-blur-md border border-white/90 shadow-md">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Pindah ke slide ${idx + 1}`}
                className={`group relative h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide
                    ? "w-8 bg-red-600 shadow-sm shadow-red-500/30"
                    : "w-2.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
              className="p-2 rounded-xl bg-white/95 border border-white/90 text-slate-700 hover:text-slate-950 hover:bg-white shadow-md backdrop-blur-md transition"
              title="Slide Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
              className="p-2 rounded-xl bg-white/95 border border-white/90 text-slate-700 hover:text-slate-950 hover:bg-white shadow-md backdrop-blur-md transition"
              title="Slide Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* COLUMN 2: High-Conversion Modern White & Red Login Form  */}
      {/* ======================================================== */}
      <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between bg-white p-6 sm:p-10 lg:p-12 xl:p-16 relative">
        {/* Subtle Ambient Red Tint */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-50/50 rounded-full blur-3xl pointer-events-none" />

        {/* Top Status & Mobile Brand */}
        <div className="relative z-10">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div className="flex lg:hidden items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-white p-1.5 shadow-xs border border-slate-200 ring-1 ring-red-50 flex items-center justify-center">
                <img src="/logo.png" alt="DifWorkBoard" className="h-full w-full object-contain" />
              </div>
              <span className="font-black text-slate-900 text-lg">
                <span className="text-red-600">Dif</span>WorkBoard
              </span>
            </div>

            <div className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Aktif (v1.0 Pro)</span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mt-8 sm:mt-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Masuk ke Workspace
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Gunakan alamat email terdaftar dan kata sandi akun Difitech Anda untuk mengakses lembar kerja dan BigBoard.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 font-semibold flex items-center gap-3 animate-in fade-in duration-200">
              <div className="h-2.5 w-2.5 rounded-full bg-red-600 flex-shrink-0 animate-ping" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Saved Account Card on Local Device */}
          {savedUser && (
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-800 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white font-bold text-xs shadow-xs">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs">
                    {savedUser.name ? `Akun Anda: ${savedUser.name}` : "Akun Tersimpan di Perangkat Ini"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">{savedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearSavedAccount}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                title="Hapus akun tersimpan di perangkat ini"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Semantic Accessible Form */}
          <form onSubmit={handleLogin} className="mt-8 space-y-4 sm:space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Alamat Email Akun
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  enterKeyHint="next"
                  required
                  placeholder="nama@difitech.id atau email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 hover:bg-white focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-600/15 focus:outline-none transition shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="current-password" className="block text-xs font-bold text-slate-700">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="current-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  enterKeyHint="done"
                  required
                  placeholder="Masukkan kata sandi akun Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-11 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 hover:bg-white focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-600/15 focus:outline-none transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberAccount}
                  onChange={(e) => setRememberAccount(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs text-slate-600 font-medium">Ingat saya di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-red-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-red-600/20 transition hover:bg-red-700 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? "Memverifikasi Kredensial..." : "Masuk ke DifWorkBoard"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Bottom Security Badge & Copyright */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 relative z-10">
          <div className="flex items-center gap-1.5 font-medium text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Enkripsi SSL & Sesi JWT Aktif</span>
          </div>
          <p>© {new Date().getFullYear()} PT Jaya Bersama Digital</p>
        </div>
      </div>
    </div>
  );
}
