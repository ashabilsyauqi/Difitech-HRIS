"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  Users,
  Clapperboard,
  UserCheck,
  Sparkles,
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

  const difWorkBoardLinks = [
    { href: "/dashboard/workspace", label: "BigBoard Divisi (Kanban 6 Divisi)", icon: Layers },
    { href: "/dashboard/workspace?view=personal", label: "BigBoard Pribadi", icon: Users },
    ...(isSosmedMember
      ? [{ href: "/dashboard/content-production", label: "Kanban Konten (Sosmed)", icon: Clapperboard }]
      : []),
    ...(isManagerOrAdmin
      ? [{ href: "/manager/employees", label: "Anggota Tim & Divisi", icon: UserCheck }]
      : []),
  ];

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
        className={`shrink-0 fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-4 transition-transform duration-200 lg:static lg:translate-x-0 shadow-xs flex flex-col justify-between overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Header */}
          <div className="mb-3 px-3 text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse"></span>
              DifWorkBoard
            </span>
            <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black tracking-wider uppercase">
              Agile Board
            </span>
          </div>

          {/* Navigation Links */}
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
        </div>

        {/* Footer Brand Card */}
        <div className="rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50 to-orange-50/40 p-3.5 text-xs text-slate-700 mt-6">
          <div className="flex items-center gap-1.5 font-black text-red-700">
            <Layers className="h-4 w-4 text-red-600" />
            <span>DifWorkBoard System</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 leading-snug">
            BigBoard Kanban 6 Divisi non-stage & Corong Kolaborasi Mandiri.
          </p>
        </div>
      </aside>
    </>
  );
}
