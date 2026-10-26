"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  CheckSquare,
  Clock,
  PlayCircle,
  Timer,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  TrendingUp,
  Globe,
  Sparkles,
  ShoppingBag,
  Clapperboard,
  Layers,
  ChevronRight,
  ExternalLink,
  MapPin,
  Calendar,
  AlertTriangle,
  FolderKanban,
  Check,
  RotateCcw,
  UserCheck,
  Eye,
  Loader2,
} from "lucide-react";

interface AdminDashboardWidgetsProps {
  user: any;
  tasks: any[];
  managerStats?: any;
  onSelectTask: (task: any) => void;
  onApproveTask: (taskId: string) => void;
  onRequestRevision: (task: any) => void;
  onOpenDivision: (divisionKey: string) => void;
  onOpenCreateTask: (defaultDept?: string) => void;
  activeTimers: Record<string, number>;
  formatTimerSeconds: (sec: number) => string;
  formatDateTime: (iso?: string | null) => string;
  isLoading: boolean;
  onRefresh: () => void;
}

const DIVISION_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; bg: string; border: string; barColor: string }
> = {
  SOSMED: {
    label: "Sosmed",
    icon: Clapperboard,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    barColor: "bg-pink-500",
  },
  ADS: {
    label: "Ads",
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    barColor: "bg-blue-500",
  },
  SEO: {
    label: "SEO",
    icon: Globe,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    barColor: "bg-amber-500",
  },
  WEB: {
    label: "Web Dev",
    icon: Sparkles,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    barColor: "bg-emerald-500",
  },
  MARKETPLACE: {
    label: "Marketplace",
    icon: ShoppingBag,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    barColor: "bg-purple-500",
  },
  HR: {
    label: "HR & Ops",
    icon: Users,
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-300",
    barColor: "bg-slate-700",
  },
};

export default function AdminDashboardWidgets({
  user,
  tasks,
  managerStats,
  onSelectTask,
  onApproveTask,
  onRequestRevision,
  onOpenDivision,
  onOpenCreateTask,
  activeTimers,
  formatTimerSeconds,
  formatDateTime,
  isLoading,
  onRefresh,
}: AdminDashboardWidgetsProps) {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "ATTENDANCE" | "ALL_TASKS" | "TIMERS">("OVERVIEW");
  const [taskDivisionFilter, setTaskDivisionFilter] = useState<string>("ALL");
  const [taskStageFilter, setTaskStageFilter] = useState<string>("ALL");
  const [taskSearch, setTaskSearch] = useState<string>("");
  const [attendanceSearch, setAttendanceSearch] = useState<string>("");

  // Helper check deadline status
  const isOverdue = (deadline?: string | null, status?: string) => {
    if (!deadline || status === "COMPLETED") return false;
    return new Date(deadline).getTime() < Date.now();
  };

  const isDueToday = (deadline?: string | null, status?: string) => {
    if (!deadline || status === "COMPLETED") return false;
    const d = new Date(deadline);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  // Helper stage key
  const getStageKey = (task: any) => {
    if (task.kanbanStage) return task.kanbanStage.toUpperCase();
    if (task.status === "COMPLETED") return "DONE";
    if (task.status === "IN_PROGRESS") return "ON_PROGRESS";
    return "NOT_STARTED";
  };

  // Metrics Calculation
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === "IN_PROGRESS" || t.isTracking || getStageKey(t) === "ON_PROGRESS"
  );
  const reviewTasks = tasks.filter(
    (t) =>
      getStageKey(t) === "SUBMIT_TO_REVIEW" ||
      getStageKey(t) === "APPROVAL" ||
      t.reviewStatus === "PENDING_APPROVAL" ||
      (t.deliverableUrl && t.status !== "COMPLETED")
  );
  const overdueTasks = tasks.filter((t) => isOverdue(t.expectedDeadline, t.status));
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED" || getStageKey(t) === "DONE");

  // Division Aggregation
  const divisionBreakdown = useMemo(() => {
    const keys = ["SOSMED", "ADS", "SEO", "WEB", "MARKETPLACE", "HR"];
    return keys.map((key) => {
      const divTasks = tasks.filter((t) => (t.departmentCard || "HR").toUpperCase() === key);
      const total = divTasks.length;
      const inProg = divTasks.filter(
        (t) => t.status === "IN_PROGRESS" || t.isTracking || getStageKey(t) === "ON_PROGRESS"
      ).length;
      const review = divTasks.filter(
        (t) =>
          getStageKey(t) === "SUBMIT_TO_REVIEW" ||
          getStageKey(t) === "APPROVAL" ||
          t.reviewStatus === "PENDING_APPROVAL" ||
          (t.deliverableUrl && t.status !== "COMPLETED")
      ).length;
      const done = divTasks.filter((t) => t.status === "COMPLETED" || getStageKey(t) === "DONE").length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        key,
        total,
        inProg,
        review,
        done,
        percent,
        tasks: divTasks,
        config: DIVISION_CONFIG[key] || DIVISION_CONFIG.HR,
      };
    });
  }, [tasks]);

  // Active Timers List
  const liveTrackingTasks = useMemo(() => {
    return tasks.filter((t) => t.isTracking || activeTimers[t.id] > 0 || t.status === "IN_PROGRESS");
  }, [tasks, activeTimers]);

  // Attendance Data from managerStats
  const totalEmployees = managerStats?.totalEmployees ?? 0;
  const todayAttendances = managerStats?.todayAttendances ?? [];
  const clockedInCount = managerStats?.totalClockedIn ?? todayAttendances.length;
  const onTimeCount = managerStats?.onTimeCount ?? todayAttendances.filter((a: any) => a.clockInStatus === "ON_TIME").length;
  const lateCount = managerStats?.lateCount ?? todayAttendances.filter((a: any) => a.clockInStatus === "LATE").length;
  const geofenceWarningCount = managerStats?.geofenceViolations ?? todayAttendances.filter((a: any) => a.clockInStatus === "OUT_OF_GEOFENCE").length;
  const notClockedInCount = Math.max(0, totalEmployees - clockedInCount);
  const idleEmployees = managerStats?.idleEmployees ?? [];

  // Filtered Tasks for ALL_TASKS tab
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskDivisionFilter !== "ALL" && (t.departmentCard || "").toUpperCase() !== taskDivisionFilter) {
        return false;
      }
      if (taskStageFilter !== "ALL") {
        const s = getStageKey(t);
        if (taskStageFilter === "OVERDUE") {
          if (!isOverdue(t.expectedDeadline, t.status)) return false;
        } else if (taskStageFilter === "REVIEW") {
          if (
            s !== "SUBMIT_TO_REVIEW" &&
            s !== "APPROVAL" &&
            t.reviewStatus !== "PENDING_APPROVAL" &&
            !(t.deliverableUrl && t.status !== "COMPLETED")
          ) {
            return false;
          }
        } else if (s !== taskStageFilter) {
          return false;
        }
      }
      if (taskSearch.trim()) {
        const q = taskSearch.toLowerCase();
        const titleMatch = t.title.toLowerCase().includes(q);
        const descMatch = (t.description || "").toLowerCase().includes(q);
        const brandMatch = (t.brandName || "").toLowerCase().includes(q);
        const userMatch = (t.user?.name || "").toLowerCase().includes(q);
        const creatorMatch = (t.creator?.name || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !brandMatch && !userMatch && !creatorMatch) return false;
      }
      return true;
    });
  }, [tasks, taskDivisionFilter, taskStageFilter, taskSearch]);

  // Filtered Attendance for ATTENDANCE tab
  const filteredAttendance = useMemo(() => {
    if (!attendanceSearch.trim()) return todayAttendances;
    const q = attendanceSearch.toLowerCase();
    return todayAttendances.filter((a: any) => {
      const name = (a.user?.name || "").toLowerCase();
      const email = (a.user?.email || "").toLowerCase();
      const dept = (a.user?.department || "").toLowerCase();
      return name.includes(q) || email.includes(q) || dept.includes(q);
    });
  }, [todayAttendances, attendanceSearch]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Executive Command Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-800 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                Executive Command Radar
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-xs font-semibold text-slate-300">
                Pusat Pemantauan HRIS & Operasional 6 Divisi (Watcher)
              </span>
              {isLoading && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700/50 text-[10px] font-bold animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                  <span>Sinkronisasi data...</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Radar Pemantauan HRIS</span>
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-300 border border-white/10 hidden sm:inline-block">
                admin@difitech.id • Watcher Mode
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pantau seluruh aktivitas absensi real-time, pergerakan alur kerja 6 divisi, live time tracker pengerjaan tugas karyawan, dan pantau progres kerja tim dalam satu pusat kontrol.
            </p>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition border border-white/10 shadow-xs cursor-pointer active:scale-95"
              title="Refresh Data Sekarang"
            >
              <RefreshCw className={`h-4 w-4 text-slate-300 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/manager/employees"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold transition border border-indigo-400/30 shadow-xs hover:shadow-indigo-500/20 active:scale-95"
            >
              <UserCheck className="h-4 w-4 text-indigo-200" />
              <span>Kelola Tim</span>
            </Link>

            <button
              type="button"
              onClick={() => onOpenCreateTask()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md hover:shadow-blue-500/30 active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>+ Delegasikan Tugas</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Executive KPI Cards (5 Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Absensi Hari Ini */}
        <div
          onClick={() => setActiveTab("ATTENDANCE")}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-pointer group hover:border-blue-300"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Kehadiran Hari Ini</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{clockedInCount}</span>
            <span className="text-xs text-slate-400 font-semibold">/ {totalEmployees || clockedInCount} staf</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
            <span className="text-emerald-600 font-bold">{onTimeCount} tepat</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{lateCount} telat</span>
            {geofenceWarningCount > 0 && (
              <>
                <span>•</span>
                <span className="text-rose-600 font-bold">{geofenceWarningCount} luar radius</span>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Total Pekerjaan Aktif */}
        <div
          onClick={() => setActiveTab("ALL_TASKS")}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-pointer group hover:border-blue-300"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Pekerjaan</span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalTasks}</span>
            <span className="text-xs text-slate-400 font-semibold">tugas tim</span>
          </div>
          <div className="mt-2.5 text-[10px] text-slate-500 font-medium">
            Tersebar di <span className="font-bold text-slate-700">6 divisi kerja</span>
          </div>
        </div>

        {/* Card 3: Sedang Dikerjakan (Live Tracking) */}
        <div
          onClick={() => setActiveTab("TIMERS")}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-pointer group hover:border-blue-300"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Sedang Berjalan</span>
            <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <Timer className="h-4 w-4 animate-pulse text-indigo-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">{inProgressTasks.length}</span>
            <span className="text-xs text-slate-400 font-semibold">in-progress</span>
          </div>
          <div className="mt-2.5 text-[10px] text-slate-500 font-medium flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-emerald-700">{liveTrackingTasks.filter((t) => t.isTracking).length} timer aktif detik ini</span>
          </div>
        </div>

        {/* Card 4: Sedang Di-Review (Tinjauan Divisi - Watcher) */}
        <div
          onClick={() => {
            setActiveTab("ALL_TASKS");
            setTaskStageFilter("REVIEW");
          }}
          className={`p-4 rounded-2xl border shadow-2xs hover:shadow-md transition cursor-pointer group ${
            reviewTasks.length > 0
              ? "bg-amber-50/80 border-amber-200 hover:border-amber-300"
              : "bg-white border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Sedang Di-Review</span>
            <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">{reviewTasks.length}</span>
            <span className="text-xs text-amber-700/80 font-semibold">tugas dalam review</span>
          </div>
          <div className="mt-2.5 text-[10px] text-amber-800 font-medium">
            {reviewTasks.length > 0 ? "Ditinjau oleh PIC / pemberi tugas" : "Tidak ada tugas di-review"}
          </div>
        </div>

        {/* Card 5: Kritis & Overdue */}
        <div
          onClick={() => {
            setActiveTab("ALL_TASKS");
            setTaskStageFilter("OVERDUE");
          }}
          className={`col-span-2 sm:col-span-1 p-4 rounded-2xl border shadow-2xs hover:shadow-md transition cursor-pointer group ${
            overdueTasks.length > 0
              ? "bg-rose-50/80 border-rose-200 hover:border-rose-300"
              : "bg-white border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Overdue / Telat</span>
            <div className="h-7 w-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-110 transition">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-900">{overdueTasks.length}</span>
            <span className="text-xs text-rose-700/80 font-semibold">melewati target</span>
          </div>
          <div className="mt-2.5 text-[10px] text-rose-800 font-medium">
            {overdueTasks.length > 0 ? "Perlu follow-up segera" : "Semua tugas on-track"}
          </div>
        </div>
      </div>

      {/* 3. Sub-View Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("OVERVIEW")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "OVERVIEW"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Radar 6 Divisi</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black bg-white/20 text-white">
              6
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ATTENDANCE")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "ATTENDANCE"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Absensi Staf Hari Ini</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              activeTab === "ATTENDANCE" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            }`}>
              {clockedInCount} Hadir
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL_TASKS")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "ALL_TASKS"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span>Monitoring Semua Tugas</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              activeTab === "ALL_TASKS" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
            }`}>
              {totalTasks}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("TIMERS")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "TIMERS"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Timer className="h-4 w-4" />
            <span>Live Timers Staf</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              activeTab === "TIMERS" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800"
            }`}>
              {liveTrackingTasks.length}
            </span>
          </button>
        </div>

        {/* BigBoard 6 Divisi Direct Link */}
        <Link
          href="/dashboard/workspace"
          className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition shrink-0"
        >
          <Layers className="h-3.5 w-3.5 text-red-600" />
          <span>Buka BigBoard Kanban (6 Divisi)</span>
          <ChevronRight className="h-3.5 w-3.5 text-red-500" />
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & RADAR 6 DIVISI                                          */}
      {/* ========================================================================= */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">


          {/* 6 Division Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <span>Status & Progress Alur Kerja 6 Divisi</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">Klik divisi untuk membuka alur kerja Kanban</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {divisionBreakdown.map((div) => {
                const Icon = div.config.icon;
                return (
                  <div
                    key={div.key}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition p-5 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top division badge & total */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm border ${div.config.bg} ${div.config.color} ${div.config.border}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition">
                              BigBoard {div.config.label}
                            </h3>
                            <span className="text-[11px] text-slate-400 font-semibold">{div.key}</span>
                          </div>
                        </div>

                        <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full">
                          {div.total} tugas
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5 my-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-600">Penyelesaian Tim</span>
                          <span className="font-black text-slate-900">{div.percent}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${div.config.barColor} transition-all duration-500 rounded-full`}
                            style={{ width: `${Math.max(4, div.percent)}%` }}
                          />
                        </div>
                      </div>

                      {/* Stage status counters */}
                      <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 rounded-xl my-3 border border-slate-100">
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">Berjalan</div>
                          <div className="text-xs font-black text-indigo-700">{div.inProg}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">Review</div>
                          <div className="text-xs font-black text-amber-700">{div.review}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">Selesai</div>
                          <div className="text-xs font-black text-emerald-700">{div.done}</div>
                        </div>
                      </div>

                      {/* 2 Latest Tasks in this division */}
                      <div className="space-y-1.5 mt-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Tugas Terkini:
                        </div>
                        {div.tasks.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t)}
                            className="p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-100 flex items-center justify-between text-xs transition cursor-pointer"
                          >
                            <span className="font-semibold text-slate-800 truncate pr-2 max-w-[180px]">
                              {t.title}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">
                              {t.user?.name ? t.user.name.split(" ")[0] : "Staf"}
                            </span>
                          </div>
                        ))}
                        {div.tasks.length === 0 && (
                          <div className="text-[11px] text-slate-400 italic py-1">Belum ada tugas di divisi ini</div>
                        )}
                      </div>
                    </div>

                    {/* Bottom CTA to open division Stage/Kanban */}
                    <button
                      type="button"
                      onClick={() => onOpenDivision(div.key)}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-black transition cursor-pointer active:scale-98 shadow-2xs"
                    >
                      <span>Buka Kanban {div.config.label}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Idle Employees Alert Section (if any) */}
          {idleEmployees.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center gap-2.5 mb-2">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                <h3 className="text-sm font-black text-rose-950">
                  Radar Efisiensi: {idleEmployees.length} Karyawan Telah Absen Masuk &gt; 2 Jam Tanpa Tugas Aktif
                </h3>
              </div>
              <p className="text-xs text-rose-800 mb-3">
                Karyawan ini sudah clock-in tetapi belum memiliki tugas berstatus IN_PROGRESS. Anda dapat mendelegasikan tugas sekarang.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {idleEmployees.map((emp: any) => (
                  <span
                    key={emp.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-rose-200 text-rose-900 text-xs font-bold shadow-2xs"
                  >
                    <span>{emp.name}</span>
                    <span className="text-[10px] text-rose-500 font-normal">({emp.department || "Staf"})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATTENDANCE & HRIS LIVE MONITORING                                  */}
      {/* ========================================================================= */}
      {activeTab === "ATTENDANCE" && (
        <div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <span>Log Kehadiran Karyawan Hari Ini (Real-Time)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau jam clock-in, foto kehadiran, dan lokasi geofence seluruh karyawan Difitech.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama / divisi staf..."
                value={attendanceSearch}
                onChange={(e) => setAttendanceSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Metrics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Total Staf</span>
              <div className="text-xl font-black text-slate-900">{totalEmployees || clockedInCount}</div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-[10px] text-emerald-700 font-bold uppercase">Sudah Hadir</span>
              <div className="text-xl font-black text-emerald-800">{clockedInCount}</div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
              <span className="text-[10px] text-amber-700 font-bold uppercase">Terlambat</span>
              <div className="text-xl font-black text-amber-800">{lateCount}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Belum Absen / Off</span>
              <div className="text-xl font-black text-slate-700">{notClockedInCount}</div>
            </div>
          </div>

          {/* Table List of Attendance */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <th className="p-3">Karyawan</th>
                  <th className="p-3">Divisi / Jabatan</th>
                  <th className="p-3">Jam Masuk</th>
                  <th className="p-3">Jam Keluar</th>
                  <th className="p-3">Status Absensi</th>
                  <th className="p-3 text-right">Tugas Aktif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.map((att: any) => {
                  const emp = att.user || {};
                  const isLate = att.clockInStatus === "LATE";
                  const isOutGeofence = att.clockInStatus === "OUT_OF_GEOFENCE";
                  const clockInFormatted = att.clockInTime
                    ? new Date(att.clockInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                    : "-";
                  const clockOutFormatted = att.clockOutTime
                    ? new Date(att.clockOutTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                    : "Masih Bekerja";

                  const empTasks = tasks.filter((t) => t.user?.id === emp.id);
                  const activeTask = empTasks.find((t) => t.isTracking || t.status === "IN_PROGRESS");

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover border" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs">
                              {(emp.name || "U")[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{emp.name || "Staf"}</div>
                            <div className="text-[11px] text-slate-400">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-700">{emp.department || "Difitech"}</span>
                        <div className="text-[10px] text-slate-400">{emp.jobTitle || "Karyawan"}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-800">{clockInFormatted}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-mono font-semibold ${
                            att.clockOutTime ? "text-slate-800" : "text-emerald-600 italic text-[11px]"
                          }`}
                        >
                          {clockOutFormatted}
                        </span>
                      </td>
                      <td className="p-3">
                        {isLate ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Terlambat
                          </span>
                        ) : isOutGeofence ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            Luar Geofence
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Tepat Waktu
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {activeTask ? (
                          <span
                            onClick={() => onSelectTask(activeTask)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] cursor-pointer transition max-w-[160px] truncate"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                            <span className="truncate">{activeTask.title}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Tidak ada timer aktif</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredAttendance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Tidak ada data kehadiran yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MONITORING SEMUA TUGAS TIM (GLOBAL TASK FEED)                      */}
      {/* ========================================================================= */}
      {activeTab === "ALL_TASKS" && (
        <div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span>Monitoring Seluruh Tugas Perusahaan ({filteredTasks.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau progres tugas tim di 6 divisi dan status pengerjaan seluruh perusahaan (Watcher).
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Divisi */}
              <select
                value={taskDivisionFilter}
                onChange={(e) => setTaskDivisionFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Semua Divisi (6)</option>
                <option value="WEB">Web Dev</option>
                <option value="SOSMED">Sosmed</option>
                <option value="ADS">Ads</option>
                <option value="SEO">SEO</option>
                <option value="MARKETPLACE">Marketplace</option>
                <option value="HR">HR & Ops</option>
              </select>

              {/* Filter Stage */}
              <select
                value={taskStageFilter}
                onChange={(e) => setTaskStageFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Semua Status Stage</option>
                <option value="REVIEW">Perlu Review / ACC</option>
                <option value="ON_PROGRESS">Sedang Berjalan</option>
                <option value="USER_REQUESTED">Permintaan Masuk</option>
                <option value="NOT_STARTED">Belum Dimulai</option>
                <option value="REVISION">Dalam Revisi</option>
                <option value="DONE">Selesai</option>
                <option value="OVERDUE">Overdue (Terlewat)</option>
              </select>

              {/* Search text */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari tugas / staf / brand..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-44 sm:w-56"
                />
              </div>
            </div>
          </div>

          {/* Task Feed Cards */}
          <div className="space-y-2.5">
            {filteredTasks.map((task) => {
              const stageKey = getStageKey(task);
              const overdue = isOverdue(task.expectedDeadline, task.status);
              const dueToday = isDueToday(task.expectedDeadline, task.status);
              const elapsed = activeTimers[task.id] !== undefined ? activeTimers[task.id] : Number(task.trackedSeconds) || 0;
              const isNeedsApproval =
                stageKey === "SUBMIT_TO_REVIEW" ||
                stageKey === "APPROVAL" ||
                task.reviewStatus === "PENDING_APPROVAL" ||
                (task.deliverableUrl && task.status !== "COMPLETED");

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isNeedsApproval
                      ? "bg-amber-50/40 border-amber-200 hover:border-amber-300"
                      : overdue
                      ? "bg-rose-50/30 border-rose-200 hover:border-rose-300"
                      : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  {/* Left: Task Identity */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {task.departmentCard || "TUGAS"}
                      </span>
                      {task.brandName && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                          {task.brandName}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          stageKey === "DONE"
                            ? "bg-emerald-100 text-emerald-800"
                            : stageKey === "ON_PROGRESS"
                            ? "bg-indigo-100 text-indigo-800"
                            : isNeedsApproval
                            ? "bg-amber-100 text-amber-800"
                            : stageKey === "REVISION"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {stageKey.replace(/_/g, " ")}
                      </span>
                      {overdue && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-600 text-white animate-pulse">
                          OVERDUE
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => onSelectTask(task)}
                      className="text-sm font-black text-slate-900 hover:text-blue-600 transition cursor-pointer truncate"
                    >
                      {task.title}
                    </h3>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span>
                        Pengerja: <strong className="text-slate-700">{task.user?.name || "Karyawan"}</strong>
                      </span>
                      {task.creator?.name && task.creator.id !== task.user?.id && (
                        <>
                          <span>•</span>
                          <span>
                            Diminta oleh: <strong className="text-slate-600">{task.creator.name}</strong>
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>Target: <strong className={overdue ? "text-rose-600 font-bold" : ""}>{task.expectedDeadline ? formatDateTime(task.expectedDeadline) : "Fleksibel"}</strong></span>
                      {elapsed > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-indigo-700 font-bold flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimerSeconds(elapsed)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {task.deliverableUrl && (
                      <a
                        href={task.deliverableUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition"
                        title="Buka link hasil pengerjaan"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Hasil Kerja</span>
                      </a>
                    )}


                    <button
                      type="button"
                      onClick={() => onSelectTask(task)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Detail</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                Tidak ada tugas yang sesuai kriteria pencarian / filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LIVE ACTIVITY & TIME TRACKERS TIM                                  */}
      {/* ========================================================================= */}
      {activeTab === "TIMERS" && (
        <div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Timer className="h-5 w-5 text-indigo-600" />
              <span>Live Time Tracking: Karyawan yang Sedang Bekerja ({liveTrackingTasks.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau durasi waktu kerja nyata detik demi detik yang sedang dicatat oleh karyawan di masing-masing tugas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveTrackingTasks.map((task) => {
              const elapsed = activeTimers[task.id] !== undefined ? activeTimers[task.id] : Number(task.trackedSeconds) || 0;
              const isCurrentlyRunning = task.isTracking;

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-3xl border transition flex flex-col justify-between gap-3 ${
                    isCurrentlyRunning
                      ? "bg-indigo-50/50 border-indigo-200 shadow-xs"
                      : "bg-slate-50 border-slate-200/80"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border text-indigo-700">
                        {task.departmentCard || "TUGAS"}
                      </span>
                      {isCurrentlyRunning ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Timer Berjalan
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">Jeda / Idle</span>
                      )}
                    </div>

                    <h3
                      onClick={() => onSelectTask(task)}
                      className="text-sm font-black text-slate-900 hover:text-blue-600 transition cursor-pointer line-clamp-1 mb-1"
                    >
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-600">
                      Pengerja: <strong className="text-slate-800">{task.user?.name || "Karyawan"}</strong>
                    </p>
                  </div>

                  {/* Digital Counter Display */}
                  <div className="bg-white p-3 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Durasi Tercatat</div>
                      <div className="font-mono text-xl font-black text-indigo-950">
                        {formatTimerSeconds(elapsed)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTask(task)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Buka Lembar
                    </button>
                  </div>
                </div>
              );
            })}

            {liveTrackingTasks.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400">
                Tidak ada karyawan yang sedang menjalankan timer saat ini.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
