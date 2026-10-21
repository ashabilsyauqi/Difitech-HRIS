"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CreateTaskModal from "@/components/Tasks/CreateTaskModal";
import TaskDetailModal from "@/components/Tasks/TaskDetailModal";
import FollowUpButton from "@/components/Tasks/FollowUpButton";
import DeadlineSuggestionModal from "@/components/Tasks/DeadlineSuggestionModal";
import SubmitDeliverableModal from "@/components/Tasks/SubmitDeliverableModal";
import RequestRevisionModal from "@/components/Tasks/RequestRevisionModal";
import {
  Inbox,
  Play,
  CheckCircle2,
  Clock,
  Calendar,
  Tag,
  User,
  Plus,
  Search,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Layers,
  ArrowRight,
  Filter,
  Sparkles,
  CheckSquare,
} from "lucide-react";

const KANBAN_COLUMNS = [
  {
    id: "PENDING",
    title: "Tugas Masuk",
    headerBadge: "bg-blue-100 text-blue-800 border-blue-200",
    headerIcon: Inbox,
    accentBorder: "border-blue-200",
    description: "Antrean tugas yang menunggu dikerjakan",
    emptyNotice: "Semua tugas masuk telah Anda proses!",
  },
  {
    id: "IN_PROGRESS",
    title: "Sedang Dikerjakan",
    headerBadge: "bg-amber-100 text-amber-800 border-amber-200",
    headerIcon: Play,
    accentBorder: "border-amber-200",
    description: "Tugas yang sedang aktif diproses",
    emptyNotice: "Belum ada tugas yang sedang aktif dikerjakan.",
  },
  {
    id: "COMPLETED",
    title: "Tugas Selesai",
    headerBadge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    headerIcon: CheckCircle2,
    accentBorder: "border-emerald-200",
    description: "Tuntas & deliverable disetujui",
    emptyNotice: "Belum ada riwayat tugas selesai.",
  },
];

export default function MyTasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [counts, setCounts] = useState({ inbox: 0, inProgress: 0, completed: 0, pendingReview: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any | null>(null);
  const [deadlineModalTask, setDeadlineModalTask] = useState<any | null>(null);
  const [deliverableModalTask, setDeliverableModalTask] = useState<any | null>(null);
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
      params.set("myTasks", "true");
      if (selectedBrand !== "ALL") params.set("brandName", selectedBrand);
      if (selectedDepartment !== "ALL") params.set("departmentCard", selectedDepartment);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/workspace/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error("Failed to fetch my tasks:", err);
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
      console.error("Failed to fetch brands:", err);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedBrand, selectedDepartment, searchQuery]);

  const handleStatusChange = async (taskId: string, targetStatus: string) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await fetch(`/api/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to update status:", err);
      fetchTasks();
    }
  };

  const handleStartTask = async (taskId: string) => {
    await handleStatusChange(taskId, "IN_PROGRESS");
  };

  const handleRespondSuggestion = async (taskId: string, action: "ACCEPT" | "REJECT") => {
    try {
      await fetch(`/api/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respondDeadlineSuggestion: { action } }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to respond to suggestion:", err);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status === targetStatus) return;

    // Jika dipindah ke COMPLETED dan belum ada deliverable URL, buka modal deliverable
    if (targetStatus === "COMPLETED" && !task.deliverableUrl) {
      setDeliverableModalTask(task);
      setDraggedTaskId(null);
      return;
    }

    await handleStatusChange(taskId, targetStatus);
    setDraggedTaskId(null);
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "Tidak ada";
    try {
      return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-rose-100 text-rose-700 border-rose-300 font-black";
      case "HIGH":
        return "bg-amber-100 text-amber-800 border-amber-300 font-bold";
      case "LOW":
        return "bg-slate-100 text-slate-600 border-slate-200 font-medium";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 font-semibold";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {user && <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />}

      <div className="flex flex-1">
        {user && <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-red-100 bg-gradient-to-r from-red-50/70 via-white to-blue-50/40 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
                <CheckSquare className="h-4 w-4" />
                <span>Personal Desk &bull; Kanban View</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Papan Tugas Pribadi
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Tinjau antrean tugas masuk, geser ke kolom sedang dikerjakan, dan submit hasil akhir secara simultan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:bg-red-700 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Tugas Baru</span>
              </button>
            </div>
          </div>

          {/* Pending Review Alert Banner for Pemberi Tugas */}
          {counts.pendingReview > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-4 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-2xs shrink-0">
                  <AlertCircle className="h-5 w-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-amber-950">
                    Ada {counts.pendingReview} Tugas Delegasi Menunggu Review Anda!
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Sebagai pemberi tugas, Anda menentukan apakah tugas tersebut tuntas (Done !) atau perlu revisi.
                  </p>
                </div>
              </div>
              <a
                href="/dashboard/workspace"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs shrink-0"
              >
                <span>Buka Divisi Kolaborasi & Review</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Quick KPI Stats Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tugas</span>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{tasks.length}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Layers className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Tugas Masuk</span>
                <h3 className="text-2xl font-black text-blue-900 mt-0.5">{counts.inbox}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                <Inbox className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Sedang Dikerjakan</span>
                <h3 className="text-2xl font-black text-amber-900 mt-0.5">{counts.inProgress}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Play className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Tugas Selesai</span>
                <h3 className="text-2xl font-black text-emerald-900 mt-0.5">{counts.completed}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Cari tugas, keterangan, atau brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-[11px]">Brand:</span>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-red-500 outline-none bg-white font-medium"
                >
                  <option value="ALL">Semua Brand</option>
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-[11px]">Divisi:</span>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-red-500 outline-none bg-white font-medium"
                >
                  <option value="ALL">Semua Divisi</option>
                  <option value="SOSMED">Sosmed</option>
                  <option value="ADS">Ads</option>
                  <option value="SEO">SEO</option>
                  <option value="WEB">Web Dev</option>
                  <option value="MARKETPLACE">Marketplace</option>
                  <option value="HR">HR</option>
                </select>
              </div>

              {(searchQuery || selectedBrand !== "ALL" || selectedDepartment !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedBrand("ALL");
                    setSelectedDepartment("ALL");
                  }}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Kanban 3-Column Simultaneous Board */}
          {isLoading ? (
            <div className="p-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-red-600" />
              <p className="text-xs font-semibold text-slate-600">Memuat Papan Kanban Tugas Pribadi...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 xl:gap-6 items-start">
              {KANBAN_COLUMNS.map((column) => {
                const ColumnIcon = column.headerIcon;
                const columnTasks = tasks.filter((t) => t.status === column.id);

                return (
                  <div
                    key={column.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                    className="flex flex-col rounded-3xl border border-slate-200/90 bg-slate-100/75 p-4 min-h-[580px] shadow-2xs transition hover:border-slate-300"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 mb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${column.headerBadge}`}>
                          <ColumnIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900">{column.title}</h4>
                          <p className="text-[10px] text-slate-500">{column.description}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-xs font-black text-slate-800 font-mono shadow-2xs">
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Column Task Cards */}
                    <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                      {columnTasks.length === 0 ? (
                        <div className="flex h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300/80 bg-white/50 text-center p-4">
                          <ColumnIcon className="h-6 w-6 text-slate-300 mb-1.5" />
                          <p className="text-xs font-bold text-slate-500">{column.emptyNotice}</p>
                          {column.id === "PENDING" && (
                            <button
                              onClick={() => setCreateModalOpen(true)}
                              className="mt-2 text-red-600 hover:underline text-xs font-bold cursor-pointer"
                            >
                              + Buat tugas baru
                            </button>
                          )}
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onClick={() => setSelectedTaskForDetail(task)}
                            className={`group relative rounded-2xl border bg-white p-4 shadow-2xs transition hover:shadow-md hover:border-slate-300 cursor-grab active:cursor-grabbing space-y-3 ${
                              draggedTaskId === task.id ? "opacity-50 ring-2 ring-red-500" : "border-slate-200"
                            }`}
                          >
                            {/* Card Top Header: Badges & Follow Up */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="rounded-md bg-slate-900 text-white font-black text-[9px] px-2 py-0.5 uppercase tracking-wide">
                                  {task.departmentCard || "GENERAL"}
                                </span>
                                {task.brandName && (
                                  <span className="rounded-md bg-red-50 text-red-700 border border-red-200 font-bold text-[9px] px-2 py-0.5 flex items-center gap-1">
                                    <Tag className="h-2.5 w-2.5" /> {task.brandName}
                                  </span>
                                )}
                                <span className={`rounded-md border text-[9px] px-1.5 py-0.5 uppercase ${getPriorityBadge(task.priority)}`}>
                                  {task.priority || "MEDIUM"}
                                </span>
                                {task.reviewStatus === "TO_BE_REVIEWED" && (
                                  <span className="rounded-md bg-amber-500 text-white font-black text-[9px] px-2 py-0.5 flex items-center gap-1 shadow-2xs animate-pulse">
                                    ⏳ TO BE REVIEWED
                                  </span>
                                )}
                                {task.reviewStatus === "REVISION_REQUESTED" && (
                                  <span className="rounded-md bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 flex items-center gap-1 shadow-2xs">
                                    ⚠️ PERLU REVISI
                                  </span>
                                )}
                                {task.status === "COMPLETED" && (
                                  <span className="rounded-md bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 flex items-center gap-1 shadow-2xs">
                                    ✓ DONE !
                                  </span>
                                )}
                                {task.revisionTag && task.reviewStatus !== "REVISION_REQUESTED" && (
                                  <span className="rounded-md bg-purple-100 text-purple-700 border border-purple-200 text-[9px] font-bold px-1.5 py-0.5 flex items-center gap-1">
                                    <RefreshCw className="h-2.5 w-2.5" /> {task.revisionTag}
                                  </span>
                                )}
                              </div>

                              <div onClick={(e) => e.stopPropagation()}>
                                <FollowUpButton
                                  taskId={task.id}
                                  taskTitle={task.title}
                                  initialFollowUps={task.followUps}
                                  onFollowUpSuccess={fetchTasks}
                                />
                              </div>
                            </div>

                            {/* Title & Description */}
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-red-600 transition">
                                {task.title}
                              </h5>
                              {task.description && (
                                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                  {task.description.replace(/<[^>]*>?/gm, "").trim()}
                                </p>
                              )}
                            </div>

                            {/* Creator & Target Deadline */}
                            <div className="rounded-xl bg-slate-50 p-2.5 text-[10px] text-slate-600 border border-slate-100/90 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 truncate">
                                  <User className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span className="truncate">
                                    Dari: <strong className="text-slate-800">{task.creator?.name || "Kolega"}</strong>
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono shrink-0">
                                  {task.creator?.department || "HRIS"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-slate-600 pt-0.5">
                                <span className="flex items-center gap-1 text-[10px]">
                                  <Clock className="h-2.5 w-2.5 text-slate-400" /> Deadline:
                                </span>
                                <span className="font-bold text-slate-800 text-[10px]">
                                  {formatDateTime(task.expectedDeadline)}
                                </span>
                              </div>
                            </div>

                            {/* Saran Deadline Alert if any */}
                            {task.suggestedDeadline && (
                              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2 text-[10px] space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-blue-900">Saran Deadline:</span>
                                  <span className={`rounded px-1.5 py-0.2 text-[8px] font-black uppercase ${
                                    task.suggestionStatus === "ACCEPTED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : task.suggestionStatus === "REJECTED"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-blue-200 text-blue-900"
                                  }`}>
                                    {task.suggestionStatus}
                                  </span>
                                </div>
                                <p className="text-blue-800 font-mono text-[10px]">
                                  {formatDateTime(task.suggestedDeadline)}
                                </p>
                                {user?.id === task.creatorId && task.suggestionStatus === "PENDING" && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 pt-1 border-t border-blue-200/80"
                                  >
                                    <button
                                      onClick={() => handleRespondSuggestion(task.id, "ACCEPT")}
                                      className="rounded bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white hover:bg-emerald-700"
                                    >
                                      Terima
                                    </button>
                                    <button
                                      onClick={() => handleRespondSuggestion(task.id, "REJECT")}
                                      className="rounded bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-700 hover:bg-slate-300"
                                    >
                                      Tolak
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Catatan Revisi jika REVISION_REQUESTED */}
                            {task.reviewStatus === "REVISION_REQUESTED" && task.revisionNote && (
                              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-[10px] text-rose-900 space-y-0.5">
                                <span className="font-bold flex items-center gap-1 text-rose-700">
                                  <AlertTriangle className="h-3 w-3" /> Catatan Revisi Pemberi Tugas:
                                </span>
                                <p className="italic font-medium text-rose-950">"{task.revisionNote}"</p>
                              </div>
                            )}

                            {/* Info Review jika TO_BE_REVIEWED */}
                            {task.reviewStatus === "TO_BE_REVIEWED" && (
                              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-[10px] text-amber-900 space-y-0.5">
                                <span className="font-bold flex items-center gap-1 text-amber-800">
                                  ⏳ Menunggu Review {task.creator?.name ? `(${task.creator.name})` : "Pemberi Tugas"}
                                </span>
                                {task.completionNote && (
                                  <p className="italic text-amber-800 line-clamp-1">Catatan Anda: "{task.completionNote}"</p>
                                )}
                              </div>
                            )}

                            {/* Deliverable Proof of Work link if present */}
                            {task.deliverableUrl && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-xs flex items-center justify-between"
                              >
                                <span className="font-bold text-emerald-900 text-[10px] truncate">
                                  Deliverable Terlampir
                                </span>
                                <a
                                  href={task.deliverableUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:underline shrink-0"
                                >
                                  Buka Hasil <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              </div>
                            )}

                            {/* Action Buttons based on Column */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2"
                            >
                              {column.id === "PENDING" && (
                                <>
                                  <button
                                    onClick={() => setDeadlineModalTask(task)}
                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                                  >
                                    <Clock className="h-2.5 w-2.5 text-blue-600" />
                                    <span>Nego Target</span>
                                  </button>

                                  <button
                                    onClick={() => handleStartTask(task.id)}
                                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-blue-700 shadow-2xs transition cursor-pointer"
                                  >
                                    <Play className="h-2.5 w-2.5" />
                                    <span>Kerjakan Sekarang</span>
                                  </button>
                                </>
                              )}

                              {column.id === "IN_PROGRESS" && (
                                <>
                                  {task.reviewStatus === "TO_BE_REVIEWED" ? (
                                    <>
                                      <span className="text-[10px] font-black text-amber-700 flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                                        Menunggu Review
                                      </span>

                                      <button
                                        onClick={() => setDeliverableModalTask(task)}
                                        className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                                      >
                                        <ExternalLink className="h-2.5 w-2.5" />
                                        <span>Ubah Link</span>
                                      </button>
                                    </>
                                  ) : task.reviewStatus === "REVISION_REQUESTED" ? (
                                    <>
                                      <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                                        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                                        Perlu Revisi
                                      </span>

                                      <button
                                        onClick={() => setDeliverableModalTask(task)}
                                        className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-rose-700 shadow-2xs transition cursor-pointer"
                                      >
                                        <Play className="h-2.5 w-2.5" />
                                        <span>Submit Revisi</span>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                                        Aktif
                                      </span>

                                      <button
                                        onClick={() => setDeliverableModalTask(task)}
                                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 shadow-2xs transition cursor-pointer"
                                      >
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Submit Hasil</span>
                                      </button>
                                    </>
                                  )}
                                </>
                              )}

                              {column.id === "COMPLETED" && (
                                <>
                                  <span className="text-[10px] font-black text-emerald-700 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    Done !
                                  </span>

                                  {user?.id === task.creatorId && (
                                    <button
                                      onClick={() => setRevisionModalTask(task)}
                                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                                    >
                                      <RefreshCw className="h-2.5 w-2.5" />
                                      <span>Minta Revisi</span>
                                    </button>
                                  )}
                                </>
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
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchTasks}
        defaultToSelf={true}
      />

      <TaskDetailModal
        isOpen={Boolean(selectedTaskForDetail)}
        onClose={() => setSelectedTaskForDetail(null)}
        task={selectedTaskForDetail}
        currentUser={user}
        onUpdate={fetchTasks}
        onOpenDeadlineModal={(t) => setDeadlineModalTask(t)}
        onOpenDeliverableModal={(t) => setDeliverableModalTask(t)}
        onOpenRevisionModal={(t) => setRevisionModalTask(t)}
      />

      {deadlineModalTask && (
        <DeadlineSuggestionModal
          isOpen={Boolean(deadlineModalTask)}
          onClose={() => setDeadlineModalTask(null)}
          taskId={deadlineModalTask.id}
          taskTitle={deadlineModalTask.title}
          currentExpectedDeadline={deadlineModalTask.expectedDeadline}
          onSuccess={fetchTasks}
        />
      )}

      {deliverableModalTask && (
        <SubmitDeliverableModal
          isOpen={Boolean(deliverableModalTask)}
          onClose={() => setDeliverableModalTask(null)}
          taskId={deliverableModalTask.id}
          taskTitle={deliverableModalTask.title}
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
