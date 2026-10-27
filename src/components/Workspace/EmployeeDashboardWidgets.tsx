"use client";

import { useState, useMemo } from "react";
import {
  CheckSquare,
  Clock,
  PlayCircle,
  PauseCircle,
  Timer,
  Inbox,
  CheckCircle2,
  ArrowRight,
  Plus,
  Sparkles,
  Calendar,
  AlertCircle,
  AlertTriangle,
  FolderKanban,
  User,
  Layers,
  ChevronRight,
  TrendingUp,
  Clapperboard,
  Globe,
  ShoppingBag,
  Users,
  Loader2,
  BellRing,
  MessageSquare,
  Flame,
  Check,
  Send,
  Eye,
  Zap,
} from "lucide-react";

interface EmployeeDashboardWidgetsProps {
  user: any;
  tasks: any[];
  onSelectTask: (task: any) => void;
  onStartTask: (taskId: string) => void;
  onToggleTimer: (task: any) => void;
  activeTimers: Record<string, number>;
  onOpenDivision: (divisionKey: string) => void;
  onOpenCreateTask: (defaultDept?: string) => void;
  onOpenDeliverable: (task: any) => void;
  onOpenDeadlineModal?: (task: any) => void;
  userStages: any[];
  cardsDefinition: any[];
  formatTimerSeconds: (sec: number) => string;
  formatDateTime: (iso?: string | null) => string;
  isLoading: boolean;
}

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
  if (
    key === "DM_EXECUTIVE" &&
    (dept.includes("dm executive") || dept.includes("digital marketing") || dept.includes("dme"))
  ) {
    return true;
  }
  if (
    key === "CEO" &&
    (dept.includes("ceo") || dept.includes("chief") || dept.includes("eksekutif"))
  ) {
    return true;
  }
  return false;
};

export default function EmployeeDashboardWidgets({
  user,
  tasks,
  onSelectTask,
  onStartTask,
  onToggleTimer,
  activeTimers,
  onOpenDivision,
  onOpenCreateTask,
  onOpenDeliverable,
  onOpenDeadlineModal,
  userStages,
  cardsDefinition,
  formatTimerSeconds,
  formatDateTime,
  isLoading,
}: EmployeeDashboardWidgetsProps) {
  const [rightTab, setRightTab] = useState<"INCOMING" | "PERSONAL" | "DIVISION">("INCOMING");

  // 1. Filter tugas yang ditugaskan kepada saya (Assigned to Me)
  const myAssignedTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter(
      (t) =>
        t.user?.id === user.id ||
        t.userId === user.id ||
        t.assignees?.some((a: any) => (a.user?.id || a.userId) === user.id)
    );
  }, [tasks, user]);

  // 2. Filter: Tugas yang di-follow up oleh pemberi tugas
  const followedUpTasks = useMemo(() => {
    if (!user) return [];
    return myAssignedTasks.filter(
      (t) =>
        t.status !== "COMPLETED" &&
        t.kanbanStage !== "DONE" &&
        t.followUps &&
        t.followUps.length > 0 &&
        t.followUps.some((fu: any) => fu.sender?.id !== user.id)
    );
  }, [myAssignedTasks, user]);

  // 3. Filter: Tugas H-1 mendekati deadline (atau overdue)
  const deadlineUrgentTasks = useMemo(() => {
    const now = new Date();
    return myAssignedTasks.filter((t) => {
      if (t.status === "COMPLETED" || t.kanbanStage === "DONE") return false;
      if (!t.expectedDeadline) return false;
      const deadline = new Date(t.expectedDeadline);
      const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours <= 36; // <= 36 jam (H-1, Hari ini, atau Overdue)
    });
  }, [myAssignedTasks]);

  // 4. Filter: Tugas dari orang lain (Delegated to Me)
  const allIncomingTasks = useMemo(() => {
    if (!user) return [];
    return myAssignedTasks.filter(
      (t) => t.creator?.id && t.creator.id !== user.id
    );
  }, [myAssignedTasks, user]);

  const activeIncomingRequests = useMemo(() => {
    return allIncomingTasks.filter(
      (t) => t.status !== "COMPLETED" && t.kanbanStage !== "DONE"
    );
  }, [allIncomingTasks]);

  // 5. Filter: Tugas Inisiatif Pribadi (Self-Assigned)
  const allPersonalTasks = useMemo(() => {
    if (!user) return [];
    return myAssignedTasks.filter(
      (t) => !t.creator?.id || t.creator.id === user.id
    );
  }, [myAssignedTasks, user]);

  const activePersonalTasks = useMemo(() => {
    return allPersonalTasks.filter(
      (t) => t.status !== "COMPLETED" && t.kanbanStage !== "DONE"
    );
  }, [allPersonalTasks]);

  // 6. Filter: Tugas Sedang Dikerjakan (In Progress)
  const inProgressTasks = useMemo(() => {
    return myAssignedTasks.filter(
      (t) => t.status === "IN_PROGRESS" || t.isTracking
    );
  }, [myAssignedTasks]);

  // 7. Tugas Selesai
  const completedTasks = useMemo(() => {
    return myAssignedTasks.filter(
      (t) => t.status === "COMPLETED" || t.kanbanStage === "DONE"
    );
  }, [myAssignedTasks]);

  // 8. Divisi Karyawan (Home Division)
  const homeDivisionDef = useMemo(() => {
    if (!user) return cardsDefinition[0] || null;
    return (
      cardsDefinition.find((c) => isHomeCard(c.key, user.department)) ||
      cardsDefinition[0]
    );
  }, [cardsDefinition, user]);

  // 9. Tugas di Divisi Karyawan
  const divisionTasks = useMemo(() => {
    if (!homeDivisionDef) return [];
    return tasks.filter(
      (t) => (t.departmentCard || "").toUpperCase() === homeDivisionDef.key
    );
  }, [tasks, homeDivisionDef]);

  const divInProgressCount = divisionTasks.filter(
    (t) => t.status === "IN_PROGRESS"
  ).length;
  const divReviewCount = divisionTasks.filter(
    (t) =>
      t.reviewStatus === "TO_BE_REVIEWED" ||
      t.reviewStatus === "UNDER_REVIEW" ||
      t.reviewStatus === "REVISION_REQUESTED"
  ).length;
  const divCompletedCount = divisionTasks.filter(
    (t) => t.status === "COMPLETED"
  ).length;

  const activelyTrackingTask = inProgressTasks.find((t) => t.isTracking);

  const getUrgencyBadge = (expectedDeadline: string) => {
    try {
      const now = new Date();
      const deadline = new Date(expectedDeadline);
      const diffMs = deadline.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 0) {
        return {
          label: "🚨 Telat",
          badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
          remainingText: `${Math.abs(Math.round(diffHours))}j terlewat`,
        };
      }
      if (diffHours <= 24) {
        return {
          label: "🔥 Hari Ini",
          badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
          remainingText: `Sisa ${Math.max(1, Math.round(diffHours))} jam`,
        };
      }
      return {
        label: "⚠️ H-1 Besok",
        badgeClass: "bg-orange-50 text-orange-800 border-orange-200",
        remainingText: `Sisa ${Math.round(diffHours / 24)} hari`,
      };
    } catch {
      return {
        label: "Deadline",
        badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
        remainingText: "",
      };
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "baru saja";
      if (diffMins < 60) return `${diffMins}m lalu`;
      if (diffHours < 24) return `${diffHours}j lalu`;
      return `${diffDays}h lalu`;
    } catch {
      return "";
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 gap-3">
      {/* 1. Header Ringkas (Modern Light Glass Header) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 px-4 py-2.5 sm:px-5 sm:py-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "ME"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                Halo, {user?.name || "Karyawan"} 👋
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[10px] font-bold">
                {user?.department || "Difitech"}
              </span>
              {isLoading && (
                <span className="inline-flex items-center gap-1 text-slate-400 text-[10px]">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  <span>Syncing...</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              {activelyTrackingTask ? (
                <span className="inline-flex items-center gap-1.5 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 truncate max-w-md">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                  <span className="truncate">
                    Sedang melacak: <strong>{activelyTrackingTask.title}</strong>
                  </span>
                </span>
              ) : (
                <span className="text-slate-500">
                  {inProgressTasks.length} tugas aktif • {deadlineUrgentTasks.length} deadline mendesak • {activeIncomingRequests.length} request tim
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => onOpenCreateTask(homeDivisionDef?.key)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Buat Tugas</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenDivision(homeDivisionDef?.key)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200/70 transition cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>BigBoard Divisi</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip (5 Modernized Cards in 1 Row) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 shrink-0">
        {/* KPI 1: In Progress */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs hover:border-blue-300 hover:shadow-sm transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Sedang Berjalan</span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PlayCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {inProgressTasks.length}
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {activelyTrackingTask ? "1 Running" : "Standby"}
            </span>
          </div>
        </div>

        {/* KPI 2: Follow Up Masuk */}
        <div
          className={`rounded-2xl border p-3 shadow-xs transition group ${
            followedUpTasks.length > 0
              ? "border-amber-300 bg-amber-50/40 hover:bg-amber-50/70 ring-1 ring-amber-200"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <span>Di-Follow Up</span>
              {followedUpTasks.length > 0 && (
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </span>
            <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <BellRing className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {followedUpTasks.length}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                followedUpTasks.length > 0
                  ? "bg-amber-100 text-amber-900 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {followedUpTasks.length > 0 ? "Perlu Respon" : "Aman"}
            </span>
          </div>
        </div>

        {/* KPI 3: Deadline H-1 */}
        <div
          className={`rounded-2xl border p-3 shadow-xs transition group ${
            deadlineUrgentTasks.length > 0
              ? "border-rose-300 bg-rose-50/30 hover:bg-rose-50/60 ring-1 ring-rose-200"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <span>Deadline H-1</span>
              {deadlineUrgentTasks.length > 0 && (
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </span>
            <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {deadlineUrgentTasks.length}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                deadlineUrgentTasks.length > 0
                  ? "bg-rose-100 text-rose-800 border-rose-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {deadlineUrgentTasks.length > 0 ? "Mendesak" : "Terkendali"}
            </span>
          </div>
        </div>

        {/* KPI 4: Request Masuk (Active only) */}
        <div
          onClick={() => setRightTab("INCOMING")}
          className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs hover:border-purple-300 hover:shadow-sm transition group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Request Tim</span>
            <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Inbox className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {activeIncomingRequests.length}
            </span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              {activeIncomingRequests.length > 0 ? "Belum Selesai" : "Kosong"}
            </span>
          </div>
        </div>

        {/* KPI 5: Selesai */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs hover:border-emerald-300 hover:shadow-sm transition group col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Tugas Selesai</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {completedTasks.length}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Total Done
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Bento Grid (3 Symmetrical Equal Height Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
        {/* ========================================================================= */}
        {/* KOLOM 1: RADAR PERHATIAN & DEADLINE (Follow-Up + Deadline H-1) - 4 Cols */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-0 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
          {/* Header Column 1 */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">
                  Radar Perhatian & Deadline
                </h3>
                <p className="text-[10px] text-slate-400">
                  Teguran follow-up & batas waktu mendesak
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
              {followedUpTasks.length + deadlineUrgentTasks.length} Item
            </span>
          </div>

          {/* Body Column 1: Internal Scroll Container */}
          <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
            {/* SUB-SECTION A: Follow Up Pemberi Tugas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BellRing className="h-3 w-3 text-amber-500" />
                  <span>Follow Up Pemberi Tugas</span>
                </span>
                <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  {followedUpTasks.length}
                </span>
              </div>

              {followedUpTasks.length === 0 ? (
                /* Compact positive state if no follow up - takes only ~38px instead of giant empty box! */
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Tidak ada follow-up baru</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Lancar ✓</span>
                </div>
              ) : (
                followedUpTasks.map((task) => {
                  const latestFu = task.followUps?.[0];
                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50/90 hover:border-amber-300 transition cursor-pointer space-y-2 group shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                              {task.followUps?.length}x Di-follow up
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {latestFu ? formatTimeAgo(latestFu.createdAt) : ""}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-900 transition truncate">
                            {task.title}
                          </h4>
                        </div>
                      </div>

                      {latestFu && (
                        <div className="text-[10px] bg-white p-2 rounded-lg border border-amber-100 text-slate-700 space-y-1">
                          <div className="italic text-slate-600 line-clamp-2">
                            "{latestFu.message || "Tolong dicek perkembangan tugas ini ya."}"
                          </div>
                          <div className="text-right text-[9px] text-amber-800 font-bold">
                            — {latestFu.sender?.name || "Pemberi Tugas"}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* SUB-SECTION B: Mendekati Deadline (H-1 & Hari Ini) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="h-3 w-3 text-rose-500" />
                  <span>Mendekati Deadline</span>
                </span>
                <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                  {deadlineUrgentTasks.length}
                </span>
              </div>

              {deadlineUrgentTasks.length === 0 ? (
                <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Jadwal deadline aman</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Semua Terkendali</span>
                </div>
              ) : (
                deadlineUrgentTasks.map((task) => {
                  const urgency = getUrgencyBadge(task.expectedDeadline);
                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-blue-300 hover:shadow-2xs transition cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-black border uppercase tracking-wider ${urgency.badgeClass}`}
                            >
                              {urgency.label}
                            </span>
                            {urgency.remainingText && (
                              <span className="text-[9px] font-semibold text-slate-500">
                                {urgency.remainingText}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                            {task.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{formatDateTime(task.expectedDeadline)}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {onOpenDeadlineModal && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDeadlineModal(task);
                              }}
                              className="px-2 py-0.5 rounded-md text-[9px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer"
                            >
                              Negosiasi
                            </button>
                          )}
                          <span className="text-[9px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                            Buka &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KOLOM 2: SEDANG DIKERJAKAN & TIME TRACKER - 4 Cols                       */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-0 rounded-2xl border border-blue-200/80 bg-white p-3.5 shadow-xs">
          {/* Header Column 2 */}
          <div className="flex items-center justify-between pb-2.5 border-b border-blue-100/70 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                <Timer className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">
                  Sedang Dikerjakan & Tracker
                </h3>
                <p className="text-[10px] text-slate-400">
                  Tugas aktif dengan live tracking waktu
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
              {inProgressTasks.length} Aktif
            </span>
          </div>

          {/* Body Column 2: Internal Scroll Container */}
          <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {inProgressTasks.length === 0 ? (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
                <PlayCircle className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">Tidak ada tugas berjalan</p>
                <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs">
                  Pilih tugas dari daftar request atau buat tugas mandiri untuk mulai menghitung waktu kerja.
                </p>
              </div>
            ) : (
              <>
                {/* 1. HERO CARD: Actively Tracking Task (Jika ada yang sedang live direkam) */}
                {activelyTrackingTask && (
                  <div
                    onClick={() => onSelectTask(activelyTrackingTask)}
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/40 border-2 border-blue-400/80 shadow-xs cursor-pointer space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white shadow-2xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                        LIVE TRACKING
                      </span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
                        {activelyTrackingTask.departmentCard || "Divisi"}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition line-clamp-2">
                        {activelyTrackingTask.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Brand: {activelyTrackingTask.brandName || "Internal"}
                      </p>
                    </div>

                    {/* Big Digital Monospace Clock */}
                    <div className="bg-slate-900 text-white rounded-xl px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-blue-400 animate-spin" style={{ animationDuration: "3s" }} />
                        <span className="font-mono text-base font-black tracking-wider text-blue-200">
                          {formatTimerSeconds(
                            activeTimers[activelyTrackingTask.id] !== undefined
                              ? activeTimers[activelyTrackingTask.id]
                              : Number(activelyTrackingTask.trackedSeconds) || 0
                          )}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTimer(activelyTrackingTask);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <PauseCircle className="h-3 w-3" />
                          <span>Jeda</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDeliverable(activelyTrackingTask);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Submit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. List Tasks Lainnya yang In Progress (Queued / Paused) */}
                {inProgressTasks
                  .filter((t) => !activelyTrackingTask || t.id !== activelyTrackingTask.id)
                  .map((task) => {
                    const elapsed =
                      activeTimers[task.id] !== undefined
                        ? activeTimers[task.id]
                        : Number(task.trackedSeconds) || 0;

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs transition cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                              {task.title}
                            </h4>
                            <span className="text-[10px] text-slate-400">
                              {task.departmentCard || "Divisi"} • {task.brandName || "Internal"}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Paused
                          </span>
                        </div>

                        {/* Controls Bar */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px]">
                          <span className="font-mono text-slate-600 font-semibold flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {formatTimerSeconds(elapsed)}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleTimer(task);
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[9px] border border-blue-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <PlayCircle className="h-3 w-3" />
                              <span>Lanjut</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDeliverable(task);
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[9px] border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Submit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KOLOM 3: ANTREAN TUGAS & RADAR DIVISI (TABBED VIEW) - 4 Cols              */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-0 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
          {/* Header Segmented Tabs */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full max-w-xs">
              <button
                type="button"
                onClick={() => setRightTab("INCOMING")}
                className={`flex-1 py-1 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                  rightTab === "INCOMING"
                    ? "bg-white text-purple-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Request ({activeIncomingRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setRightTab("PERSONAL")}
                className={`flex-1 py-1 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                  rightTab === "PERSONAL"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Pribadi ({activePersonalTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setRightTab("DIVISION")}
                className={`flex-1 py-1 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                  rightTab === "DIVISION"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Divisi
              </button>
            </div>

            {rightTab === "PERSONAL" && (
              <button
                type="button"
                onClick={() => onOpenCreateTask(homeDivisionDef?.key)}
                className="p-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer ml-2 shadow-2xs shrink-0"
                title="Buat tugas pribadi baru"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* TAB CONTENT: Scroll Container */}
          <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {/* TAB 1: INCOMING REQUESTS */}
            {rightTab === "INCOMING" && (
              <>
                {activeIncomingRequests.length === 0 ? (
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
                    <Inbox className="h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Semua request selesai!</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Tidak ada permintaan aktif yang perlu dikerjakan.
                    </p>
                  </div>
                ) : (
                  activeIncomingRequests.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-purple-300 hover:bg-purple-50/20 transition cursor-pointer space-y-1.5 group shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-50 text-purple-700 border border-purple-200 mb-1">
                            Dari: {task.creator?.name || "Rekan Kerja"}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition truncate">
                            {task.title}
                          </h4>
                        </div>
                        {task.brandName && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                            {task.brandName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                        <span className="flex items-center gap-1 font-medium text-slate-500">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{task.expectedDeadline ? formatDateTime(task.expectedDeadline) : "Fleksibel"}</span>
                        </span>

                        {task.status !== "IN_PROGRESS" ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartTask(task.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-bold text-[9px] transition cursor-pointer shadow-2xs"
                          >
                            <PlayCircle className="h-2.5 w-2.5" />
                            <span>Mulai</span>
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-blue-600">
                            Sedang Jalan
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* TAB 2: PERSONAL TASKS (Active Only) */}
            {rightTab === "PERSONAL" && (
              <>
                {activePersonalTasks.length === 0 ? (
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
                    <CheckSquare className="h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Belum ada tugas mandiri</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Gunakan tombol + untuk membuat to-do inisiatif pribadi Anda.
                    </p>
                  </div>
                ) : (
                  activePersonalTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-2xs transition cursor-pointer space-y-1.5 group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition truncate">
                            {task.title}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {task.departmentCard || "Divisi"} • {task.brandName || "Internal"}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                          {task.kanbanStage || task.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{task.expectedDeadline ? formatDateTime(task.expectedDeadline) : "Fleksibel"}</span>
                        </span>

                        {task.status !== "IN_PROGRESS" ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartTask(task.id);
                            }}
                            className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            <PlayCircle className="h-2.5 w-2.5" />
                            <span>Mulai &rarr;</span>
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-blue-600">
                            Sedang Jalan
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* TAB 3: DIVISION OVERVIEW */}
            {rightTab === "DIVISION" && (
              <div className="space-y-3">
                {/* Quick Stat Bar */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[9px] font-bold text-slate-400">Berjalan</div>
                    <div className="text-base font-black text-blue-600">{divInProgressCount}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[9px] font-bold text-slate-400">Review</div>
                    <div className="text-base font-black text-amber-600">{divReviewCount}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[9px] font-bold text-slate-400">Selesai</div>
                    <div className="text-base font-black text-emerald-600">{divCompletedCount}</div>
                  </div>
                </div>

                {/* Division Pipeline Mini Preview */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>Pipeline Divisi {homeDivisionDef?.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{divisionTasks.length} kartu</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {userStages.slice(0, 5).map((s, idx) => {
                      const count = divisionTasks.filter(
                        (t) => (t.kanbanStage || t.status) === s.key
                      ).length;
                      return (
                        <div
                          key={s.key}
                          className="p-1 rounded-lg bg-white border border-slate-200 text-center"
                        >
                          <div className="text-[8px] font-bold text-slate-400 truncate">
                            {idx + 1}. {s.label}
                          </div>
                          <div className="text-[11px] font-black text-slate-800">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Division Recent Tasks */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Aktivitas Kartu Divisi:
                  </div>
                  {divisionTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer group shadow-2xs"
                    >
                      <div className="min-w-0 pr-1.5">
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 truncate text-[11px]">
                          {task.title}
                        </p>
                        <p className="text-[9px] text-slate-400">
                          PIC: {task.user?.name || "Belum ada"}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                        {task.kanbanStage || task.status}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenDivision(homeDivisionDef?.key)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                >
                  <span>Buka BigBoard {homeDivisionDef?.label}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

