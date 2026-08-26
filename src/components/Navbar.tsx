"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogOut, Clock, User } from "lucide-react";

interface NavbarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string | null;
    jobTitle?: string | null;
    avatarUrl?: string | null;
  };
  onMenuToggle?: () => void;
}

export default function Navbar({ user, onMenuToggle }: NavbarProps) {
  const router = useRouter();
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/login");
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === "ADMIN") return "Admin HR";
    if (role === "MANAGER") return "Manager Tim";
    return "Karyawan";
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 shadow-xs">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
            aria-label="Buka menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <Link href={user.role === "EMPLOYEE" ? "/dashboard" : "/manager"} className="flex items-center gap-2.5">
          {/* Taharica Red & Blue Badge Logo */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 shadow-md shadow-red-600/25">
            <span className="font-black text-white text-lg tracking-tight">T</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-black tracking-tight text-slate-900 text-base">
              <span className="text-red-600">Taharica</span>
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                HRIS CamStamp
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Sistem Presensi & Tugas Harian</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        {/* Live Clock with Blue Accent */}
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 md:flex shadow-2xs">
          <Clock className="h-3.5 w-3.5 text-blue-600" />
          <span className="font-mono font-bold text-slate-800">{timeStr || "--:--:--"}</span>
          <span className="text-[10px] font-bold text-red-600">WIB</span>
        </div>

        {/* User Info & Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="text-[11px] text-slate-500">{user.department || "Umum"}</span>
              <span
                className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                  user.role === "ADMIN"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : user.role === "MANAGER"
                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
              >
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>

          <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-600 shadow-2xs">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-slate-500" />
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Keluar / Logout"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
