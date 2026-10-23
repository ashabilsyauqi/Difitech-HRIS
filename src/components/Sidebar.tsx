"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Layers,
  Users,
  Clapperboard,
  UserCheck,
  CheckSquare,
  Share2,
  TrendingUp,
  Globe,
  Sparkles,
  ShoppingBag,
  X,
  ChevronRight,
  FolderKanban,
} from "lucide-react";

interface SidebarProps {
  role: string;
  department?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
  relevantDivisionKeys?: string[];
}

const DIVISION_BOARDS = [
  { key: "SOSMED", label: "Sosmed", icon: Clapperboard, color: "text-pink-600 bg-pink-50 border-pink-200" },
  { key: "ADS", label: "Ads", icon: TrendingUp, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { key: "SEO", label: "SEO", icon: Globe, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { key: "WEB", label: "Web Dev", icon: Sparkles, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { key: "MARKETPLACE", label: "Marketplace", icon: ShoppingBag, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { key: "HR", label: "HR", icon: Users, color: "text-slate-700 bg-slate-100 border-slate-300" },
];

const isHomeCard = (cardKey?: string | null, userDept?: string | null) => {
  if (!cardKey) return false;
  const key = cardKey.toUpperCase();
  const dept = (userDept || "").toLowerCase();
  if (
    key === "WEB" &&
    (dept.includes("engineer") ||
      dept.includes("web") ||
      dept.includes("it") ||
      dept.includes("tech") ||
      dept.includes("dev") ||
      dept.includes("software"))
  ) {
    return true;
  }
  if (
    key === "SOSMED" &&
    (dept.includes("sosmed") ||
      dept.includes("konten") ||
      dept.includes("content") ||
      dept.includes("creat") ||
      dept.includes("desain") ||
      dept.includes("design") ||
      dept.includes("marketing"))
  ) {
    return true;
  }
  if (
    key === "ADS" &&
    (dept.includes("ads") ||
      dept.includes("advert") ||
      dept.includes("traffic") ||
      dept.includes("media buying"))
  ) {
    return true;
  }
  if (
    key === "SEO" &&
    (dept.includes("seo") ||
      dept.includes("organ") ||
      dept.includes("artik") ||
      dept.includes("writer"))
  ) {
    return true;
  }
  if (
    key === "MARKETPLACE" &&
    (dept.includes("market") ||
      dept.includes("toko") ||
      dept.includes("ecom"))
  ) {
    return true;
  }
  if (
    key === "HR" &&
    (dept.includes("hr") ||
      dept.includes("human") ||
      dept.includes("people") ||
      dept.includes("ops") ||
      dept.includes("operas"))
  ) {
    return true;
  }
  return false;
};

function SidebarInner({ role, department, isOpen, onClose, relevantDivisionKeys }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  const currentCard = searchParams?.get("card")?.toUpperCase() || null;
  const currentView = searchParams?.get("view") || null;
  const currentTab = searchParams?.get("tab") || null;
  const isWorkspace = pathname === "/dashboard/workspace";

  // Check active state
  const isDifitechActive = isWorkspace && !currentCard && currentView !== "personal";
  const isMyTasksActive = isWorkspace && currentView === "personal" && currentTab !== "delegated";
  const isDelegatedActive = isWorkspace && currentView === "personal" && currentTab === "delegated";
  const isContentActive = pathname.startsWith("/dashboard/content-production");
  const isEmployeesActive = pathname.startsWith("/manager/employees");

  // Filter divisions to display based on user role & department
  const visibleDivisions = useMemo(() => {
    if (isManagerOrAdmin) {
      return DIVISION_BOARDS;
    }
    // For regular employee: only show their home division and any division with active tasks/collaboration
    const filtered = DIVISION_BOARDS.filter((div) => {
      if (isHomeCard(div.key, userDept)) return true;
      if (relevantDivisionKeys && relevantDivisionKeys.includes(div.key)) return true;
      return false;
    });

    // Fallback: if no division matched yet, at least show the first home match or all
    return filtered.length > 0 ? filtered : DIVISION_BOARDS.slice(0, 1);
  }, [isManagerOrAdmin, userDept, relevantDivisionKeys]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-60 bg-white border-r border-slate-200 p-3.5 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:h-[calc(100vh-4rem)] lg:z-30 shrink-0 shadow-lg lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-4">
          {/* Mobile Drawer Header with Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 lg:hidden">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="DifWorkBoard Logo" className="h-7 w-7 object-contain" />
              <div className="flex items-center gap-1 font-black text-slate-900 text-sm">
                <span className="text-red-600">Dif</span>WorkBoard
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Section 1: BigBoard Utama */}
          <div>
            <div className="px-2.5 mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              BigBoard Utama
            </div>
            <Link
              href="/dashboard/workspace"
              onClick={onClose}
              className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                isDifitechActive
                  ? "bg-red-50 text-red-600 border border-red-200/80 shadow-2xs"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Layers className={`h-4 w-4 shrink-0 ${isDifitechActive ? "text-red-600" : "text-slate-400"}`} />
                <span className="font-bold">BigBoard Difitech</span>
              </div>
              {isManagerOrAdmin ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-slate-100 text-slate-600 shrink-0">
                  6 Divisi
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-slate-100 text-slate-600 shrink-0">
                  Radar
                </span>
              )}
            </Link>
          </div>

          {/* Section 2: BigBoard per Divisi (Disesuaikan berdasarkan divisi karyawan) */}
          <div>
            <div className="px-2.5 mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>{isManagerOrAdmin ? "BigBoard Divisi (Semua)" : "BigBoard Divisi"}</span>
              {!isManagerOrAdmin && (
                <span className="text-[9px] text-blue-600 font-bold">Terkait</span>
              )}
            </div>
            <nav className="space-y-0.5">
              {visibleDivisions.map((div) => {
                const Icon = div.icon;
                const isActive = isWorkspace && currentCard === div.key;
                const isHome = isHomeCard(div.key, userDept);

                return (
                  <Link
                    key={div.key}
                    href={`/dashboard/workspace?card=${div.key}`}
                    onClick={onClose}
                    className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition whitespace-nowrap group ${
                      isActive
                        ? "bg-slate-900 text-white shadow-2xs font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border text-[10px] ${
                          isActive ? "bg-white/20 border-white/20 text-white" : div.color
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="truncate">{div.label}</span>
                      {isHome && !isManagerOrAdmin && (
                        <span className="text-[9px] px-1 py-0.2 rounded font-black bg-blue-100 text-blue-700 shrink-0">
                          Saya
                        </span>
                      )}
                    </div>
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        isActive ? "text-white opacity-100" : "text-slate-300 opacity-60"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Section 3: BigBoard Pribadi */}
          <div>
            <div className="px-2.5 mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              BigBoard Pribadi
            </div>
            <nav className="space-y-0.5">
              <Link
                href="/dashboard/workspace?view=personal&tab=my_tasks"
                onClick={onClose}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                  isMyTasksActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs font-bold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <CheckSquare className={`h-4 w-4 shrink-0 ${isMyTasksActive ? "text-blue-600" : "text-slate-400"}`} />
                <span className="truncate">Tugas Saya</span>
              </Link>

              <Link
                href="/dashboard/workspace?view=personal&tab=delegated"
                onClick={onClose}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                  isDelegatedActive
                    ? "bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs font-bold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Share2 className={`h-4 w-4 shrink-0 ${isDelegatedActive ? "text-purple-600" : "text-slate-400"}`} />
                <span className="truncate">Delegasi Saya</span>
              </Link>
            </nav>
          </div>

          {/* Section 4: Fitur Tambahan */}
          {(isSosmedMember || isManagerOrAdmin) && (
            <div>
              <div className="px-2.5 mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Fitur Tim
              </div>
              <nav className="space-y-0.5">
                {isSosmedMember && (
                  <Link
                    href="/dashboard/content-production"
                    onClick={onClose}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                      isContentActive
                        ? "bg-pink-50 text-pink-700 border border-pink-200/80 shadow-2xs font-bold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Clapperboard className={`h-4 w-4 shrink-0 ${isContentActive ? "text-pink-600" : "text-slate-400"}`} />
                    <span className="truncate">Kanban Konten Sosmed</span>
                  </Link>
                )}

                {isManagerOrAdmin && (
                  <Link
                    href="/manager/employees"
                    onClick={onClose}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                      isEmployeesActive
                        ? "bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs font-bold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <UserCheck className={`h-4 w-4 shrink-0 ${isEmployeesActive ? "text-slate-800" : "text-slate-400"}`} />
                    <span className="truncate">Anggota Tim & Divisi</span>
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>

        {/* Minimal Footer Info (Clean & Zero Clutter) */}
        <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 px-2 flex items-center justify-between">
          <span className="font-semibold text-slate-500">DifWorkBoard</span>
          <span>v2.1</span>
        </div>
      </aside>
    </>
  );
}

export default function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<aside className="w-60 shrink-0 hidden lg:block bg-white border-r border-slate-200" />}>
      <SidebarInner {...props} />
    </Suspense>
  );
}
