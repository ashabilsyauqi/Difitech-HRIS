"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  CheckSquare,
  History,
  LayoutDashboard,
  MapPin,
  Users,
  FileSpreadsheet,
  Settings,
  CalendarCheck,
  ShieldCheck,
  Wallet,
  UserCheck,
  FileCheck2,
  Inbox,
  Layers,
  Clapperboard,
  ActivitySquare,
} from "lucide-react";

interface SidebarProps {
  role: string;
  department?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ role, department, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [userDept, setUserDept] = useState<string | null>(department || null);

  useEffect(() => {
    if (department !== undefined) {
      setUserDept(department);
      return;
    }
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.department) {
          setUserDept(data.user.department);
        }
      })
      .catch(() => {});
  }, [department]);

  const isManagerOrAdmin = role === "ADMIN" || role === "MANAGER";
  const deptLower = (userDept || "").toLowerCase();
  const isSosmedMember =
    isManagerOrAdmin ||
    deptLower.includes("sosmed") ||
    deptLower.includes("social") ||
    deptLower.includes("konten") ||
    deptLower.includes("content") ||
    deptLower.includes("creat") ||
    deptLower.includes("desain") ||
    deptLower.includes("design");

  const isDifWorkBoardRoute =
    pathname?.includes("/dashboard/workspace") || pathname?.includes("/dashboard/content-production");

  const difWorkBoardLinks = [
    { href: "/dashboard/workspace", label: "BigBoard Divisi (Kanban 6 Divisi)", icon: Layers },
    { href: "/dashboard/workspace?view=personal", label: "BigBoard Pribadi", icon: Users },
    ...(isSosmedMember
      ? [{ href: "/dashboard/content-production", label: "Kanban Konten (Sosmed)", icon: Clapperboard }]
      : []),
  ];

  const employeeHrisLinks = [
    { href: "/dashboard", label: "Presensi Harian", icon: Clock },
    { href: "/dashboard/tasks", label: "Lembar Tugas Harian", icon: CheckSquare },
    { href: "/dashboard/leave", label: "Pengajuan Izin & Cuti", icon: FileCheck2 },
    { href: "/dashboard/history", label: "Riwayat Presensi", icon: CalendarCheck },
  ];

  const managerHrisLinks = [
    { href: "/manager", label: "Ringkasan Tim & Radar", icon: LayoutDashboard },
    { href: "/manager/task-radar", label: "Radar Tugas CEO & HR", icon: ActivitySquare },
    { href: "/dashboard/tasks", label: "Lembar Tugas Harian", icon: CheckSquare },
    { href: "/manager/employees", label: "Manajemen Karyawan", icon: UserCheck },
    { href: "/manager/live-map", label: "Peta Presensi Live", icon: MapPin },
    { href: "/manager/attendance", label: "Log & Audit Presensi", icon: CalendarCheck },
    { href: "/manager/tasks", label: "Matriks Tugas Tim", icon: Users },
    { href: "/manager/leave", label: "Persetujuan Izin & Cuti", icon: FileCheck2 },
    { href: "/manager/reports", label: "Ekspor Laporan (Excel/PDF)", icon: FileSpreadsheet },
    { href: "/manager/settings", label: "Pengaturan Kantor & Shift", icon: Settings },
  ];

  const hrisLinks = isManagerOrAdmin ? managerHrisLinks : employeeHrisLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-4 transition-transform duration-200 lg:static lg:translate-x-0 shadow-xs flex flex-col justify-between overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {isDifWorkBoardRoute ? (
            /* ================================================================= */
            /* DIFWORKBOARD DEDICATED NAVIGATION (UNMERGED VIEW)                 */
            /* ================================================================= */
            <div>
              <div className="mb-3 px-3 text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse"></span>
                  DifWorkBoard
                </span>
                <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black tracking-wider uppercase">
                  Standalone
                </span>
              </div>

              <nav className="space-y-1.5 mb-6">
                {difWorkBoardLinks.map((item) => {
                  const Icon = item.icon;
                  const isPersonal = item.href.includes("view=personal");
                  const isActive = isPersonal
                    ? typeof window !== "undefined" && window.location.search.includes("view=personal")
                    : pathname === item.href.split("?")[0] &&
                      (typeof window === "undefined" || !window.location.search.includes("view=personal"));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? "bg-red-50 text-red-600 border border-red-200/80 shadow-2xs font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-red-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Quick switch to HRIS Portal */}
              <div className="pt-4 border-t border-slate-100">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Integrasi Sistem
                </div>
                <Link
                  href={userDept ? "/dashboard" : "/login"}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition border border-dashed border-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Ke Difitech HRIS</span>
                  </span>
                  <span className="text-[10px] text-slate-400">→</span>
                </Link>
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* HRIS & PRESENSI NAVIGATION                                        */
            /* ================================================================= */
            <div>
              {/* Top Banner to open DifWorkBoard */}
              <div className="mb-4">
                <Link
                  href="/dashboard/workspace"
                  onClick={onClose}
                  className="flex items-center justify-between rounded-xl bg-gradient-to-r from-red-600 to-rose-600 p-2.5 text-xs font-bold text-white shadow-xs hover:from-red-700 hover:to-rose-700 transition"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-white" />
                    <span>Buka DifWorkBoard</span>
                  </span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-black">
                    Board
                  </span>
                </Link>
              </div>

              <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isManagerOrAdmin ? "HRIS & Presensi (Manajemen)" : "HRIS & Presensi"}
              </div>

              <nav className="space-y-1">
                {hrisLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? "bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {isManagerOrAdmin && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Akses Karyawan
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                  >
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>Lihat Tampilan Presensi</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {isDifWorkBoardRoute ? (
          <div className="rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50 to-orange-50/40 p-3.5 text-xs text-slate-700 mt-6">
            <div className="flex items-center gap-1.5 font-black text-red-700">
              <Layers className="h-4 w-4 text-red-600" />
              <span>DifWorkBoard System</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-snug">
              BigBoard Kanban Divisi non-stage & Corong Kolaborasi Mandiri.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-red-100 bg-gradient-to-br from-red-50/60 to-blue-50/30 p-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-red-700">
              <ShieldCheck className="h-4 w-4 text-red-600" />
              <span>Difitech HRIS CamStamp</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-snug">
              Perlindungan anti-spoof GPS & verifikasi kamera stempel aktif.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
