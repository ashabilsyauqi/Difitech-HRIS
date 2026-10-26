"use client";

import { useMemo } from "react";
import {
  CheckSquare,
  Clock,
  PlayCircle,
  PauseCircle,
  Timer,
  Share2,
  Inbox,
  CheckCircle2,
  ArrowRight,
  Plus,
  Sparkles,
  Calendar,
  AlertCircle,
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
  userStages,
  cardsDefinition,
  formatTimerSeconds,
  formatDateTime,
  isLoading,
}: EmployeeDashboardWidgetsProps) {
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

  // 2. Filter: Tugas dari orang lain (User Requested / Delegated to Me)
  const incomingTasksFromOthers = useMemo(() => {
    if (!user) return [];
    return myAssignedTasks.filter(
      (t) => t.creator?.id && t.creator.id !== user.id
    );
  }, [myAssignedTasks, user]);

  // 3. Filter: Tugas Inisiatif Pribadi (Self-Assigned)
  const personalTasks = useMemo(() => {
    if (!user) return [];
    return myAssignedTasks.filter(
      (t) => !t.creator?.id || t.creator.id === user.id
    );
  }, [myAssignedTasks, user]);

  // 4. Filter: Tugas Sedang Dikerjakan (In Progress)
  const inProgressTasks = useMemo(() => {
    return myAssignedTasks.filter(
      (t) => t.status === "IN_PROGRESS" || t.isTracking
    );
  }, [myAssignedTasks]);

  // 5. Filter: Tugas yang Saya Delegasikan ke Orang Lain
  const myDelegatedTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter(
      (t) => t.creator?.id === user.id && t.user?.id !== user.id
    );
  }, [tasks, user]);

  // 6. Tugas Butuh Review / ACC
  const pendingReviewTasks = useMemo(() => {
    return myAssignedTasks.filter(
      (t) =>
        t.reviewStatus === "TO_BE_REVIEWED" ||
        t.reviewStatus === "UNDER_REVIEW" ||
        t.kanbanStage === "APPROVAL"
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

  // Active running timer task (if any)
  const activelyTrackingTask = inProgressTasks.find((t) => t.isTracking);

  return (
    <div className="space-y-5 pb-8">
      {/* 1. Header Banner Sambutan Karyawan */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white shadow-md border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Dashboard Karyawan • {user?.department || "Difitech"}</span>
              {isLoading && (
                <span className="inline-flex items-center gap-1 text-blue-200">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Sinkronisasi...</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Halo, {user?.name || "Karyawan"} 👋
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Pantau seluruh tugas pribadi, tugas masuk dari rekan kerja, serta overview radar progres divisi Anda dalam satu dashboard terintegrasi.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenCreateTask(homeDivisionDef?.key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Buat Tugas Baru</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenDivision(homeDivisionDef?.key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
            >
              <Layers className="h-4 w-4 text-blue-300" />
              <span>Buka BigBoard Divisi</span>
            </button>
          </div>
        </div>

        {/* Background ambient pattern */}
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Top Metric KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Sedang Dikerjakan */}
        <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-2xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Sedang Dikerjakan</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <PlayCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{inProgressTasks.length}</span>
            <span className="text-[11px] text-slate-400 font-medium">tugas aktif</span>
          </div>
          {activelyTrackingTask && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping"></span>
              <span>1 Timer Berjalan</span>
            </div>
          )}
        </div>

        {/* Card 2: Permintaan Masuk (Dari Orang Lain) */}
        <div className="rounded-2xl border border-purple-200 bg-white p-4 shadow-2xs hover:border-purple-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Permintaan Masuk</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Inbox className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-900">{incomingTasksFromOthers.length}</span>
            <span className="text-[11px] text-purple-500 font-medium">dari rekan kerja</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            Tugas delegasi eksternal
          </div>
        </div>

        {/* Card 3: Tugas Inisiatif Pribadi */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tugas Pribadi</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{personalTasks.length}</span>
            <span className="text-[11px] text-slate-400 font-medium">inisiatif sendiri</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            Self-assigned tasks
          </div>
        </div>

        {/* Card 4: Selesai / ACC */}
        <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tugas Selesai</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">{completedTasks.length}</span>
            <span className="text-[11px] text-emerald-600 font-medium">tuntas disetujui</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            {pendingReviewTasks.length > 0 ? `${pendingReviewTasks.length} menunggu review` : "Semua review clear"}
          </div>
        </div>
      </div>

      {/* 3. ROW 1: 2 Widget Operasional Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* WIDGET 1: Permintaan Masuk (Tugas dari Orang Lain) */}
        <div className="rounded-3xl border border-purple-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Inbox className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Tugas Masuk dari Rekan Kerja
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Permintaan & delegasi tugas yang dialokasikan ke Anda
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
                {incomingTasksFromOthers.length} Tugas
              </span>
            </div>

            {/* List Tugas Masuk */}
            <div className="mt-3.5 space-y-2.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {incomingTasksFromOthers.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed border-purple-200 bg-purple-50/30 p-4">
                  <Inbox className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Tidak ada permintaan tugas baru</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Semua tugas dari rekan kerja sudah diproses atau belum ada permintaan baru.
                  </p>
                </div>
              ) : (
                incomingTasksFromOthers.map((task) => {
                  const elapsed = activeTimers[task.id] !== undefined ? activeTimers[task.id] : (Number(task.trackedSeconds) || 0);
                  const isRunning = Boolean(task.isTracking);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-3.5 rounded-2xl border border-purple-100/90 bg-purple-50/30 hover:bg-purple-50/70 hover:border-purple-300 transition cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-200 mb-1">
                            Request: {task.creator?.name || "Rekan Kerja"}
                          </span>
                          <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-700 transition truncate">
                            {task.title}
                          </h4>
                        </div>
                        {task.brandName && (
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                            {task.brandName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-purple-100/60">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{task.expectedDeadline ? formatDateTime(task.expectedDeadline) : "Deadline Fleksibel"}</span>
                        </div>

                        {task.status !== "IN_PROGRESS" && task.status !== "COMPLETED" ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartTask(task.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] transition shadow-2xs"
                          >
                            <PlayCircle className="h-3 w-3" />
                            <span>Terima & Mulai</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            {isRunning ? "⏱️ Running" : "Sedang Dikerjakan"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={() => onOpenCreateTask(homeDivisionDef?.key)}
              className="w-full text-center text-xs font-bold text-purple-700 hover:text-purple-800 transition flex items-center justify-center gap-1"
            >
              <span>+ Delegasikan Tugas ke Orang Lain</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* WIDGET 2: Sedang Dikerjakan & Time Tracker */}
        <div className="rounded-3xl border border-blue-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Timer className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Sedang Dikerjakan & Tracker Waktu
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Tugas aktif yang sedang dalam progres pengerjaan
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                {inProgressTasks.length} Aktif
              </span>
            </div>

            {/* List Tugas In Progress */}
            <div className="mt-3.5 space-y-2.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {inProgressTasks.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/30 p-4">
                  <PlayCircle className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Belum ada tugas yang berjalan</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pilih tugas dari daftar permintaan atau tugas pribadi Anda untuk mulai dikerjakan.
                  </p>
                </div>
              ) : (
                inProgressTasks.map((task) => {
                  const elapsed = activeTimers[task.id] !== undefined ? activeTimers[task.id] : (Number(task.trackedSeconds) || 0);
                  const isRunning = Boolean(task.isTracking);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2.5 group ${
                        isRunning
                          ? "bg-blue-50/70 border-blue-300 ring-1 ring-blue-200"
                          : "bg-white border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-blue-700 transition truncate">
                            {task.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {task.departmentCard || "Divisi"} • {task.brandName || "Internal"}
                          </span>
                        </div>
                        {isRunning && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white animate-pulse shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                            Running
                          </span>
                        )}
                      </div>

                      {/* Timer Display & Action Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold text-slate-800">
                          <Timer className="h-3.5 w-3.5 text-blue-600" />
                          <span>{formatTimerSeconds(elapsed)}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTimer(task);
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white font-bold text-[10px] transition cursor-pointer shadow-2xs ${
                              isRunning
                                ? "bg-amber-500 hover:bg-amber-600"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                          >
                            {isRunning ? <PauseCircle className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                            <span>{isRunning ? "Jeda" : "Lanjut"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDeliverable(task);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition cursor-pointer shadow-2xs"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Submit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4">
            <p className="text-[11px] text-slate-400 text-center font-medium">
              Timer otomatis mencatat jam lembar kerja ke sistem database
            </p>
          </div>
        </div>
      </div>

      {/* 4. ROW 2: 2 Widget Strategis (Tugas Pribadi & Overview Divisi) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* WIDGET 3: Tugas Inisiatif Pribadi */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Tugas Pribadi (Self-Assigned)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Tugas inisiatif yang dibuat oleh diri sendiri untuk dikerjakan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenCreateTask(homeDivisionDef?.key)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
              >
                <Plus className="h-3 w-3" />
                <span>+ Buat Baru</span>
              </button>
            </div>

            {/* List Tugas Pribadi */}
            <div className="mt-3.5 space-y-2.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
              {personalTasks.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
                  <CheckSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Belum ada tugas pribadi</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Catat to-do kerjaan atau inisiatif pribadi Anda di sini.
                  </p>
                </div>
              ) : (
                personalTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 transition cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-blue-700 transition truncate">
                          {task.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {task.departmentCard || "Divisi"} • {task.brandName || "Internal"}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        {task.kanbanStage || task.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{task.expectedDeadline ? formatDateTime(task.expectedDeadline) : "Fleksibel"}</span>
                      </span>

                      {task.status !== "IN_PROGRESS" && task.status !== "COMPLETED" ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartTask(task.id);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          <PlayCircle className="h-3 w-3" />
                          <span>Mulai Kerjakan &rarr;</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-600">
                          {task.status === "COMPLETED" ? "✅ Selesai" : "⏱️ Sedang Jalan"}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* WIDGET 4: Overview BigBoard Divisi */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Overview BigBoard Divisi {homeDivisionDef?.label || "Tim"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Radar kesehatan & status alur kerja divisi Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenDivision(homeDivisionDef?.key)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition cursor-pointer border border-blue-200"
              >
                <span>Buka Board</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Quick Stat Bar Divisi */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Berjalan
                </div>
                <div className="text-xl font-black text-blue-600 mt-0.5">
                  {divInProgressCount}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Butuh Review
                </div>
                <div className="text-xl font-black text-amber-600 mt-0.5">
                  {divReviewCount}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Selesai
                </div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">
                  {divCompletedCount}
                </div>
              </div>
            </div>

            {/* Pipeline Stage Preview */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Pipeline Divisi ({divisionTasks.length} total kartu)</span>
                <span className="text-[11px] text-slate-400">Tahapan Aktif</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {userStages.slice(0, 5).map((s, idx) => {
                  const count = divisionTasks.filter(
                    (t) => (t.kanbanStage || t.status) === s.key
                  ).length;
                  return (
                    <div
                      key={s.key}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-center space-y-0.5"
                    >
                      <div className="text-[9px] font-bold text-slate-400 truncate">
                        {idx + 1}. {s.label}
                      </div>
                      <div className="text-xs font-black text-slate-800">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Tasks in Division */}
            <div className="mt-3.5 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Aktivitas Kartu Terbaru di Divisi:
              </div>
              {divisionTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 group-hover:text-blue-600 truncate">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      PIC: {task.user?.name || "Belum ada"}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                    {task.kanbanStage || task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={() => onOpenDivision(homeDivisionDef?.key)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
            >
              <span>Buka Full Kanban BigBoard {homeDivisionDef?.label}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
