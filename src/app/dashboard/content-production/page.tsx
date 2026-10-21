"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CreateTaskModal from "@/components/Tasks/CreateTaskModal";
import TaskDetailModal from "@/components/Tasks/TaskDetailModal";
import FollowUpButton from "@/components/Tasks/FollowUpButton";
import SubmitDeliverableModal from "@/components/Tasks/SubmitDeliverableModal";
import RequestRevisionModal from "@/components/Tasks/RequestRevisionModal";
import {
  Clapperboard,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  User,
  Tag,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Layers,
  FileText,
  Camera,
  Palette,
  Film,
  LayoutGrid,
  Columns,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface KanbanStageDef {
  key: string;
  label: string;
  shortLabel: string;
  sublabel: string;
  order: number;
  headerBg: string;
  badgeBg: string;
  icon: any;
}

const DEFAULT_STAGES: KanbanStageDef[] = [
  {
    key: "CONTENT_BRIEF",
    label: "1. Content Brief",
    shortLabel: "Brief",
    sublabel: "Ideasi, Script & Arahan Konsep",
    order: 1,
    headerBg: "bg-gradient-to-r from-blue-600 to-indigo-600",
    badgeBg: "bg-blue-100 text-blue-700 border-blue-200",
    icon: FileText,
  },
  {
    key: "SHOOTING",
    label: "2. Shooting",
    shortLabel: "Shooting",
    sublabel: "Produksi Rekaman & Talent",
    order: 2,
    headerBg: "bg-gradient-to-r from-purple-600 to-violet-600",
    badgeBg: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Camera,
  },
  {
    key: "DESIGN",
    label: "3. Design",
    shortLabel: "Design",
    sublabel: "Desain Grafis, Banner & Feed",
    order: 3,
    headerBg: "bg-gradient-to-r from-pink-500 to-rose-600",
    badgeBg: "bg-pink-100 text-pink-700 border-pink-200",
    icon: Palette,
  },
  {
    key: "VIDEO_EDITING",
    label: "4. Video Editing",
    shortLabel: "Editing",
    sublabel: "Editing Footage, Audio & Motion",
    order: 4,
    headerBg: "bg-gradient-to-r from-amber-500 to-orange-600",
    badgeBg: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Film,
  },
  {
    key: "REVISION",
    label: "5. Revision",
    shortLabel: "Revision",
    sublabel: "Revisi & Catatan Perbaikan",
    order: 5,
    headerBg: "bg-gradient-to-r from-rose-600 to-red-600",
    badgeBg: "bg-rose-100 text-rose-700 border-rose-200",
    icon: RefreshCw,
  },
  {
    key: "APPROVAL",
    label: "6. Approval",
    shortLabel: "Approval",
    sublabel: "Review Akhir & Sync Selesai",
    order: 6,
    headerBg: "bg-gradient-to-r from-emerald-600 to-teal-600",
    badgeBg: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
];

export default function ContentProductionKanbanPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: GRID (match 6 Card Divisi) vs KANBAN (linear pipeline)
  const [viewMode, setViewMode] = useState<"GRID" | "KANBAN">("GRID");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any | null>(null);
  const [approvalModalTask, setApprovalModalTask] = useState<any | null>(null);
  const [revisionModalTask, setRevisionModalTask] = useState<any | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      router.push("/login");
    }
  };

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("isContentProduction", "true");
      if (selectedBrand !== "ALL") params.set("brandName", selectedBrand);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/workspace/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch kanban tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch("/api/workspace/metadata");
      if (res.ok) {
        const data = await res.json();
        setAvailableBrands(data.brands || []);
      }
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchBrands();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") {
        setCreateModalOpen(true);
        window.history.replaceState({}, "", "/dashboard/content-production");
      }
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedBrand, searchQuery]);

  const handleMoveStage = async (task: any, newStage: string) => {
    if (newStage === "APPROVAL") {
      // Trigger approval modal for deliverable link
      setApprovalModalTask(task);
      return;
    }

    try {
      await fetch(`/api/workspace/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateKanbanStage: { stage: newStage },
        }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to move stage:", err);
    }
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "Fleksibel";
    try {
      return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  // Stats calculation
  const totalTasks = tasks.length;
  const briefCount = tasks.filter((t) => (t.kanbanStage || "CONTENT_BRIEF") === "CONTENT_BRIEF").length;
  const productionCount = tasks.filter((t) =>
    ["SHOOTING", "DESIGN", "VIDEO_EDITING"].includes(t.kanbanStage)
  ).length;
  const revisionCount = tasks.filter((t) => t.kanbanStage === "REVISION").length;
  const approvalCount = tasks.filter((t) => t.kanbanStage === "APPROVAL").length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {user && <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />}

      <div className="flex flex-1">
        {user && <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-pink-100 text-pink-800 text-[10px] font-black px-2 py-0.5 tracking-wider uppercase">
                  Tim Sosmed & Kreatif
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs font-semibold text-slate-500">Pipeline Produksi Konten</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                Kanban Project: Content Production
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Alur produksi konten terintegrasi (Brief &rarr; Shooting &rarr; Design &rarr; Editing &rarr; Revision &rarr; Approval). Auto-sync ke Card Besar saat Approval.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <Link
                href="/dashboard/workspace"
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <Layers className="h-4 w-4 text-slate-500" />
                <span>Lihat 6 Card Divisi</span>
              </Link>

              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-pink-700 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Request Konten Baru</span>
              </button>
            </div>
          </div>

          {/* Quick KPI Stats Summary (Matching Executive Dashboard) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500">Total Proyek</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">{totalTasks}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <Clapperboard className="h-4 w-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-700">1. Ideasi & Brief</p>
                <p className="text-lg font-black text-blue-900 mt-0.5">{briefCount}</p>
              </div>
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                <FileText className="h-4 w-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-purple-700">2-4. Produksi & Edit</p>
                <p className="text-lg font-black text-purple-900 mt-0.5">{productionCount}</p>
              </div>
              <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                <Film className="h-4 w-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-rose-700">5. Butuh Revisi</p>
                <p className="text-lg font-black text-rose-900 mt-0.5">{revisionCount}</p>
              </div>
              <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
                <RefreshCw className="h-4 w-4" />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-700">6. Siap Approval</p>
                <p className="text-lg font-black text-emerald-900 mt-0.5">{approvalCount}</p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Filter Bar & View Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Cari konten atau brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 hidden md:flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" /> Brand:
                </span>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-pink-500 outline-none bg-white font-medium"
                >
                  <option value="ALL">Semua Brand</option>
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode Toggle: Grid 6 Stage vs Pipeline Kanban */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("GRID")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === "GRID"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Grid 6 Tahap</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("KANBAN")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === "KANBAN"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Columns className="h-3.5 w-3.5" />
                <span>Pipeline Kanban</span>
              </button>
            </div>
          </div>

          {/* Render Content in chosen View Mode */}
          {viewMode === "GRID" ? (
            /* ================= MODE 1: GRID 6 TAHAP (Identik dengan 6 Card Divisi) ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              {DEFAULT_STAGES.map((stage, idx) => {
                const stageTasks = tasks.filter(
                  (t) => (t.kanbanStage || "CONTENT_BRIEF") === stage.key
                );
                const StageIcon = stage.icon;

                return (
                  <div
                    key={stage.key}
                    className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col transition hover:shadow-md"
                  >
                    {/* Stage Header with Vibrant Gradient (Consistent with 6 Card Divisi) */}
                    <div className={`p-4 text-white ${stage.headerBg}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StageIcon className="h-5 w-5 text-white/90" />
                          <span className="text-base font-black tracking-tight">{stage.label}</span>
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black text-white">
                            {stageTasks.length} konten
                          </span>
                        </div>

                        {stage.key === "CONTENT_BRIEF" && (
                          <button
                            onClick={() => setCreateModalOpen(true)}
                            title="Buat request brief konten baru"
                            className="rounded-xl bg-white/20 hover:bg-white/30 p-1.5 text-white transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Request</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-white/80 mt-0.5">{stage.sublabel}</p>
                    </div>

                    {/* Stage Body */}
                    <div className="p-3.5 bg-slate-50/60 flex-1 space-y-3 min-h-[380px] max-h-[680px] overflow-y-auto">
                      {stageTasks.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                          <div className="p-3 rounded-2xl bg-white shadow-2xs border border-slate-200/80 mb-2.5">
                            <StageIcon className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="text-xs font-bold text-slate-600">Belum ada konten di tahap ini</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">
                            {stage.key === "CONTENT_BRIEF"
                              ? "Mulai dengan membuat brief request konten baru"
                              : `Konten akan muncul saat dipindahkan ke tahap ${stage.shortLabel}`}
                          </p>
                          {stage.key === "CONTENT_BRIEF" && (
                            <button
                              onClick={() => setCreateModalOpen(true)}
                              className="mt-3 rounded-xl border border-pink-200 bg-pink-50 text-pink-700 px-3 py-1.5 text-[11px] font-bold hover:bg-pink-100 transition cursor-pointer"
                            >
                              + Buat Brief Sekarang
                            </button>
                          )}
                        </div>
                      ) : (
                        stageTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTaskForDetail(task)}
                            className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-sm transition space-y-2.5 cursor-pointer group"
                          >
                            {/* Badges & Follow-up */}
                            <div
                              className="flex items-center justify-between gap-1.5 flex-wrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1 flex-wrap">
                                {task.brandName && (
                                  <span className="rounded-md bg-red-50 text-red-700 border border-red-200 font-bold text-[10px] px-2 py-0.5 flex items-center gap-1">
                                    <Tag className="h-2.5 w-2.5" /> {task.brandName}
                                  </span>
                                )}
                                {task.priority && (
                                  <span
                                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                      task.priority === "URGENT"
                                        ? "bg-rose-100 text-rose-700"
                                        : task.priority === "HIGH"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                )}
                              </div>

                              <FollowUpButton
                                taskId={task.id}
                                taskTitle={task.title}
                                initialFollowUps={task.followUps}
                                onFollowUpSuccess={fetchTasks}
                              />
                            </div>

                            {/* Title */}
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-pink-600 transition-colors">
                              {task.title}
                            </h4>

                            {/* Revision Alert Banner */}
                            {task.revisionTag && (
                              <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 text-[11px] text-rose-800 font-bold flex items-center gap-1.5">
                                <RefreshCw className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                <span className="truncate">{task.revisionTag}</span>
                              </div>
                            )}

                            {/* Assignee & Target Deadline */}
                            <div className="text-[11px] text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-slate-400">
                                  <User className="h-3 w-3" /> PIC / Editor:
                                </span>
                                <span className="font-bold text-slate-700 truncate max-w-[130px]">
                                  {task.user?.name || "Belum ditentukan"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-slate-400">
                                  <Clock className="h-3 w-3" /> Target Deadline:
                                </span>
                                <span className="font-bold text-slate-700">
                                  {formatDateTime(task.expectedDeadline)}
                                </span>
                              </div>
                            </div>

                            {/* Deliverable File on Approval */}
                            {task.deliverableUrl && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-[11px] flex items-center justify-between"
                              >
                                <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Hasil File Konten
                                </span>
                                <a
                                  href={task.deliverableUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                                >
                                  <span>Lihat File</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}

                            {/* Stage Navigation Arrows & Actions */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5"
                            >
                              {idx > 0 ? (
                                <button
                                  onClick={() => handleMoveStage(task, DEFAULT_STAGES[idx - 1].key)}
                                  title={`Kembalikan ke ${DEFAULT_STAGES[idx - 1].shortLabel}`}
                                  className="rounded-xl border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                  <span className="hidden sm:inline">{DEFAULT_STAGES[idx - 1].shortLabel}</span>
                                </button>
                              ) : (
                                <span />
                              )}

                              {stage.key === "APPROVAL" ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setRevisionModalTask(task)}
                                    className="rounded-xl bg-rose-50 border border-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                    <span>Minta Revisi</span>
                                  </button>
                                  <button
                                    onClick={() => handleMoveStage(task, "APPROVAL")}
                                    className="rounded-xl bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer shadow-xs"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Approve</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleMoveStage(task, DEFAULT_STAGES[idx + 1].key)}
                                  className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1 text-[11px] font-bold text-white hover:bg-slate-800 transition cursor-pointer shadow-xs ml-auto"
                                >
                                  <span>Lanjut: {DEFAULT_STAGES[idx + 1].shortLabel}</span>
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ================= MODE 2: PIPELINE KANBAN (Horizontal Scroll View) ================= */
            <div className="rounded-3xl border border-slate-200 bg-slate-200/50 p-3 sm:p-4 overflow-x-auto shadow-inner">
              <div className="flex gap-4 min-w-[1500px]">
                {DEFAULT_STAGES.map((stage, idx) => {
                  const stageTasks = tasks.filter(
                    (t) => (t.kanbanStage || "CONTENT_BRIEF") === stage.key
                  );
                  const StageIcon = stage.icon;

                  return (
                    <div
                      key={stage.key}
                      className="w-80 shrink-0 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col overflow-hidden"
                    >
                      {/* Column Header */}
                      <div className={`p-3.5 text-white ${stage.headerBg} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          <StageIcon className="h-4 w-4 text-white/90" />
                          <span className="text-xs font-black tracking-tight">{stage.label}</span>
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black text-white">
                            {stageTasks.length}
                          </span>
                        </div>

                        {stage.key === "CONTENT_BRIEF" && (
                          <button
                            onClick={() => setCreateModalOpen(true)}
                            className="rounded-lg bg-white/20 hover:bg-white/30 p-1 text-white transition cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Column Body */}
                      <div className="p-2.5 space-y-2.5 flex-1 min-h-[460px] max-h-[700px] overflow-y-auto bg-slate-50/60">
                        {stageTasks.length === 0 ? (
                          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-400">
                            <StageIcon className="h-6 w-6 text-slate-300 mb-2" />
                            <p className="text-xs font-semibold text-slate-500">Tidak ada konten</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Tahap {stage.shortLabel}</p>
                          </div>
                        ) : (
                          stageTasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTaskForDetail(task)}
                              className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-slate-300 hover:shadow-xs transition space-y-2 cursor-pointer group"
                            >
                              <div
                                className="flex items-center justify-between gap-1 flex-wrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="rounded-md bg-red-50 text-red-700 border border-red-200 font-bold text-[9px] px-1.5 py-0.5 flex items-center gap-0.5">
                                  <Tag className="h-2 w-2" /> {task.brandName || "Brand"}
                                </span>

                                <FollowUpButton
                                  taskId={task.id}
                                  taskTitle={task.title}
                                  initialFollowUps={task.followUps}
                                  onFollowUpSuccess={fetchTasks}
                                />
                              </div>

                              <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-pink-600 transition-colors">
                                {task.title}
                              </h4>

                              {task.revisionTag && (
                                <div className="rounded bg-rose-50 border border-rose-200 p-1.5 text-[10px] text-rose-800 font-bold flex items-center gap-1">
                                  <RefreshCw className="h-2.5 w-2.5 text-rose-600 shrink-0" />
                                  <span className="truncate">{task.revisionTag}</span>
                                </div>
                              )}

                              <div className="text-[10px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <User className="h-2.5 w-2.5 text-slate-400" /> PIC:
                                  </span>
                                  <strong className="text-slate-700 truncate max-w-[120px]">
                                    {task.user?.name}
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5 text-slate-400" /> Target:
                                  </span>
                                  <span className="font-bold text-slate-700">
                                    {formatDateTime(task.expectedDeadline)}
                                  </span>
                                </div>
                              </div>

                              {task.deliverableUrl && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded bg-emerald-50 border border-emerald-200 p-1.5 text-[10px] flex items-center justify-between"
                                >
                                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> File Konten
                                  </span>
                                  <a
                                    href={task.deliverableUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                                  >
                                    Buka <ExternalLink className="h-2 w-2" />
                                  </a>
                                </div>
                              )}

                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1"
                              >
                                {idx > 0 ? (
                                  <button
                                    onClick={() => handleMoveStage(task, DEFAULT_STAGES[idx - 1].key)}
                                    title={`Kembalikan ke ${DEFAULT_STAGES[idx - 1].shortLabel}`}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                                  >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <span />
                                )}

                                {stage.key === "APPROVAL" ? (
                                  <button
                                    onClick={() => setRevisionModalTask(task)}
                                    className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <RefreshCw className="h-2.5 w-2.5" />
                                    <span>Minta Revisi</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleMoveStage(task, DEFAULT_STAGES[idx + 1].key)}
                                    className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                                  >
                                    <span>Lanjut</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialDepartment="SOSMED"
        initialIsContentProduction={true}
        onSuccess={fetchTasks}
      />

      <TaskDetailModal
        isOpen={Boolean(selectedTaskForDetail)}
        onClose={() => setSelectedTaskForDetail(null)}
        task={selectedTaskForDetail}
        currentUser={user}
        onUpdate={fetchTasks}
        onOpenDeliverableModal={(t) => setApprovalModalTask(t)}
        onOpenRevisionModal={(t) => setRevisionModalTask(t)}
      />

      {approvalModalTask && (
        <SubmitDeliverableModal
          isOpen={Boolean(approvalModalTask)}
          onClose={() => setApprovalModalTask(null)}
          taskId={approvalModalTask.id}
          taskTitle={approvalModalTask.title}
          isApprovalAction={true}
          onSuccess={fetchTasks}
        />
      )}

      {revisionModalTask && (
        <RequestRevisionModal
          isOpen={Boolean(revisionModalTask)}
          onClose={() => setRevisionModalTask(null)}
          taskId={revisionModalTask.id}
          taskTitle={revisionModalTask.title}
          brandName={revisionModalTask.brandName || "General"}
          onSuccess={fetchTasks}
        />
      )}
    </div>
  );
}
