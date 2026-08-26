"use client";

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
} from "lucide-react";

interface SidebarProps {
  role: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isManagerOrAdmin = role === "ADMIN" || role === "MANAGER";

  const employeeLinks = [
    { href: "/dashboard", label: "Presensi Harian", icon: Clock },
    { href: "/dashboard/tasks", label: "Papan Tugas Harian", icon: CheckSquare },
    { href: "/dashboard/tasks/history", label: "Arsip Riwayat Tugas", icon: History },
    { href: "/dashboard/payroll", label: "Slip Gaji Saya", icon: Wallet },
    { href: "/dashboard/history", label: "Riwayat Presensi", icon: CalendarCheck },
  ];

  const managerLinks = [
    { href: "/manager", label: "Ringkasan Tim & Radar", icon: LayoutDashboard },
    { href: "/manager/employees", label: "Manajemen Karyawan", icon: UserCheck },
    { href: "/manager/live-map", label: "Peta Presensi Live", icon: MapPin },
    { href: "/manager/attendance", label: "Log & Audit Presensi", icon: CalendarCheck },
    { href: "/manager/tasks", label: "Matriks Tugas Tim", icon: Users },
    { href: "/manager/payroll", label: "Penggajian & Payroll", icon: Wallet },
    { href: "/manager/payroll/settings", label: "Pengaturan Gaji", icon: Settings },
    { href: "/manager/reports", label: "Ekspor Laporan (Excel/PDF)", icon: FileSpreadsheet },
    { href: "/manager/settings", label: "Pengaturan Geofence", icon: MapPin },
  ];

  const links = isManagerOrAdmin ? managerLinks : employeeLinks;

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
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-4 transition-transform duration-200 lg:static lg:translate-x-0 shadow-xs flex flex-col justify-between ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isManagerOrAdmin ? "Menu Manajemen" : "Menu Karyawan"}
          </div>

          <nav className="space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
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

        <div className="rounded-xl border border-red-100 bg-gradient-to-br from-red-50/60 to-blue-50/30 p-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-red-700">
            <ShieldCheck className="h-4 w-4 text-red-600" />
            <span>Difitech HRIS CamStamp</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 leading-snug">
            Perlindungan anti-spoof GPS & verifikasi kamera stempel aktif.
          </p>
        </div>
      </aside>
    </>
  );
}
