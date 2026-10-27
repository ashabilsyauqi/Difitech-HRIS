"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  Layers,
  RefreshCw,
  Timer,
  Inbox,
  Eye,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  category?: string;
  priority?: string;
  status: string;
  kanbanStage?: string | null;
  departmentCard?: string | null;
  brandName?: string | null;
  expectedDeadline?: string | null;
  trackedSeconds?: number;
  isTracking?: boolean;
  user?: {
    id: string;
    name: string;
    department?: string | null;
  };
  creator?: {
    id: string;
    name: string;
  } | null;
  assignees?: {
    user: {
      id: string;
      name: string;
    };
  }[];
}

const STAGE_COLUMNS = [
  {
    id: "STAGE_TODO",
    title: "1. Request & To Do",
    description: "Antrean tugas baru & rencana kerja",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    headerBg: "bg-purple-50/70 border-purple-200/80",
    icon: Inbox,
    matchStages: ["TO_DO", "REQUESTED", "CONTENT_BRIEF", "PENDING", "NOT_STARTED"],
  },
  {
    id: "STAGE_IN_PROGRESS",
    title: "2. Sedang Dikerjakan",
    description: "Tugas dalam proses pengerjaan aktif",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    headerBg: "bg-blue-50/70 border-blue-200/80",
    icon: PlayCircle,
    matchStages: ["IN_PROGRESS", "ON_PROGRESS", "SHOOTING", "DESIGN", "VIDEO_EDITING"],
  },
  {
    id: "STAGE_REVIEW",
    title: "3. Review & Revisi",
    description: "Menunggu persetujuan / perbaikan",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    headerBg: "bg-amber-50/70 border-amber-200/80",
    icon: Clock,
    matchStages: ["SUBMIT_TO_REVIEW", "UNDER_REVIEW", "REVISION", "APPROVAL"],
  },
  {
    id: "STAGE_DONE",
    title: "4. Selesai",
    description: "Tuntas & hasil kerja diserahkan",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    headerBg: "bg-emerald-50/70 border-emerald-200/80",
    icon: CheckCircle2,
    matchStages: ["DONE", "COMPLETED", "PUBLISHED"],
  },
];

const DIVISION_OPTIONS = [
  { key: "ALL", label: "Semua Divisi" },
  { key: "WEB", label: "Web Dev" },
  { key: "SOSMED", label: "Sosmed" },
  { key: "ADS", label: "Ads" },
  { key: "SEO", label: "SEO" },
  { key: "MARKETPLACE", label: "Marketplace" },
  { key: "HR", label: "HR & Ops" },
];

export default function ReadOnlyTasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("ALL");
  const [filterScope, setFilterScope] = useState<"MINE" | "ALL">("MINE");

  const DWB_BASE_URL = "https://difworkboard.difitech.id";

  const fetchSessionAndTasks = async () => {
    try {
      setIsLoading(true);
      const resUser = await fetch("/api/auth/me");
      if (!resUser.ok) {
        router.push("/login");
        return;
      }
      const dataUser = await resUser.json();
      setUser(dataUser.user);

      const resTasks = await fetch("/api/workspace/tasks");
      if (resTasks.ok) {
        const dataTasks = await resTasks.json();
        setTasks(dataTasks.tasks || []);
      }
    } catch (err) {
      console.error("Gagal memuat tugas di HRIS:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndTasks();
  }, []);

  const formatTimerSeconds = (sec: number) => {
    if (!sec || sec <= 0) return "0m";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}j ${m}m`;
    return `${m}m`;
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "Fleksibel";
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return iso;
    }
  };

  const getUrgencyBadge = (expectedDeadline?: string | null) => {
    if (!expectedDeadline) return null;
    try {
      const now = new Date();
      const deadline = new Date(expectedDeadline);
      const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < 0) {
        return {
          label: "🚨 Telat",
          className: "bg-rose-50 text-rose-700 border-rose-200",
        };
      }
      if (diffHours <= 24) {
        return {
          label: "🔥 Hari Ini",
          className: "bg-amber-50 text-amber-800 border-amber-200",
        };
      }
      if (diffHours <= 48) {
        return {
          label: "⚠️ H-1",
          className: "bg-orange-50 text-orange-800 border-orange-200",
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Filter Scope: MINE vs ALL
      if (filterScope === "MINE" && user) {
        const isMine =
          t.user?.id === user.id ||
          t.assignees?.some((a) => a.user?.id === user.id);
        if (!isMine) return false;
      }

      // 2. Filter Divisi
      if (
        selectedDivision !== "ALL" &&
        (t.departmentCard || "").toUpperCase() !== selectedDivision
      ) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchBrand = (t.brandName || "").toLowerCase().includes(q);
        const matchUser = (t.user?.name || "").toLowerCase().includes(q);
        if (!matchTitle && !matchBrand && !matchUser) return false;
      }

      return true;
    });
  }, [tasks, filterScope, selectedDivision, searchQuery, user]);

  // Grouping tasks into 4 Stages
  const categorizedTasks = useMemo(() => {
    const buckets: Record<string, TaskItem[]> = {
      STAGE_TODO: [],
      STAGE_IN_PROGRESS: [],
      STAGE_REVIEW: [],
      STAGE_DONE: [],
    };

    filteredTasks.forEach((t) => {
      const stage = (t.kanbanStage || "").toUpperCase();
      const status = (t.status || "").toUpperCase();

      if (stage === "DONE" || stage === "PUBLISHED" || status === "COMPLETED") {
        buckets.STAGE_DONE.push(t);
      } else if (
        stage === "SUBMIT_TO_REVIEW" ||
        stage === "UNDER_REVIEW" ||
        stage === "REVISION" ||
        stage === "APPROVAL"
      ) {
        buckets.STAGE_REVIEW.push(t);
      } else if (
        stage === "IN_PROGRESS" ||
        stage === "ON_PROGRESS" ||
        stage === "SHOOTING" ||
        stage === "DESIGN" ||
        stage === "VIDEO_EDITING" ||
        status === "IN_PROGRESS" ||
        t.isTracking
      ) {
        buckets.STAGE_IN_PROGRESS.push(t);
      } else {
        buckets.STAGE_TODO.push(t);
      }
    });

    return buckets;
  }, [filteredTasks]);

  return (
    <div className="h-screen bg-slate-100 flex flex-col overflow-hidden">
      {user && <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />}

      <div className="flex flex-1 min-w-0 overflow-hidden">
        {user && (
          <Sidebar
            role={user.role}
            department={user.department}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-h-0 min-w-0 p-3 sm:p-4 w-full flex flex-col overflow-hidden space-y-3">
          {/* 1. Header Banner & DWB External Reference */}
          <div className="rounded-2xl bg-white border border-slate-200/80 px-4 py-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Papan Tugas Harian (Stage Kanban)
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                  <Eye className="h-3 w-3 text-slate-500" />
                  <span>Mode Pemantauan (Read-Only)</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Papan kerja real-time tersinkronisasi dengan <strong>DifWorkBoard (DWB)</strong>. Untuk mengedit atau menyelesaikan tugas, silakan gunakan lembar kerja di DWB.
              </p>
            </div>

            {/* Tombol Utama Ref ke DWB */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={fetchSessionAndTasks}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
              </button>

              <a
                href={`${DWB_BASE_URL}/dashboard/workspace`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <span>Buka DifWorkBoard (DWB)</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* 2. Filter & Search Bar */}
          <div className="rounded-2xl bg-white border border-slate-200/80 p-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama tugas, brand, atau rekan kerja..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Scope */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterScope("MINE")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    filterScope === "MINE"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tugas Saya ({tasks.filter((t) => t.user?.id === user?.id).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterScope("ALL")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    filterScope === "ALL"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Semua ({tasks.length})
                </button>
              </div>

              {/* Filter Divisi */}
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                {DIVISION_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Stage Kanban 4 Columns (Read-Only) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 overflow-hidden">
            {STAGE_COLUMNS.map((col) => {
              const colTasks = categorizedTasks[col.id] || [];
              const Icon = col.icon;

              return (
                <div
                  key={col.id}
                  className="flex flex-col h-full min-h-0 rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden"
                >
                  {/* Column Header */}
                  <div className={`p-3 border-b shrink-0 flex items-center justify-between ${col.headerBg}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1 rounded-lg bg-white shadow-2xs">
                        <Icon className="h-3.5 w-3.5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-black text-slate-900 truncate">
                          {col.title}
                        </h3>
                        <p className="text-[9px] text-slate-500 truncate">
                          {col.description}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${col.badgeColor} shrink-0`}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Tasks Scrollable Container */}
                  <div className="p-2.5 flex-1 min-h-0 overflow-y-auto space-y-2.5 custom-scrollbar bg-slate-50/30">
                    {colTasks.length === 0 ? (
                      <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl bg-white/60">
                        <Icon className="h-6 w-6 text-slate-300 mb-1" />
                        <p className="text-xs font-bold text-slate-500">Kosong</p>
                        <p className="text-[10px] text-slate-400">Tidak ada tugas pada tahap ini.</p>
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const urgency = getUrgencyBadge(task.expectedDeadline);
                        const dwbTaskUrl = `${DWB_BASE_URL}/dashboard/workspace?task=${task.id}`;

                        return (
                          <div
                            key={task.id}
                            className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-2xs transition space-y-2 group"
                          >
                            {/* Tags Row */}
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {task.departmentCard || "Divisi"}
                                </span>
                                {task.brandName && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                    {task.brandName}
                                  </span>
                                )}
                              </div>

                              {urgency && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${urgency.className}`}
                                >
                                  {urgency.label}
                                </span>
                              )}
                            </div>

                            {/* Task Title */}
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2">
                              {task.title}
                            </h4>

                            {/* Task Metadata */}
                            <div className="text-[10px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-slate-600 font-medium">
                                  <User className="h-3 w-3 text-slate-400" />
                                  <span className="truncate max-w-[120px]">
                                    {task.user?.name || "Belum ada PIC"}
                                  </span>
                                </span>
                                {task.trackedSeconds ? (
                                  <span className="font-mono font-semibold text-slate-600 flex items-center gap-0.5">
                                    <Timer className="h-3 w-3 text-blue-500" />
                                    <span>{formatTimerSeconds(task.trackedSeconds)}</span>
                                  </span>
                                ) : null}
                              </div>

                              {task.expectedDeadline && (
                                <div className="flex items-center gap-1 text-slate-400">
                                  <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span className="truncate">
                                    Target: {formatDateTime(task.expectedDeadline)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Tombol Referensi ke Lembar Kerja DWB */}
                            <div className="pt-1">
                              <a
                                href={dwbTaskUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-[10px] border border-blue-200 hover:border-blue-600 shadow-2xs transition group/btn cursor-pointer"
                              >
                                <span>Buka Lembar Kerja di DWB</span>
                                <ExternalLink className="h-3 w-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                              </a>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

