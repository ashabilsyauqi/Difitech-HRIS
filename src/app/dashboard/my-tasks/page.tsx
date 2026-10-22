"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CreateTaskModal from "@/components/Tasks/CreateTaskModal";
import TaskDetailModal from "@/components/Tasks/TaskDetailModal";
import FollowUpButton from "@/components/Tasks/FollowUpButton";
import DeadlineSuggestionModal from "@/components/Tasks/DeadlineSuggestionModal";
import SubmitDeliverableModal from "@/components/Tasks/SubmitDeliverableModal";
import RequestRevisionModal from "@/components/Tasks/RequestRevisionModal";
import {
  Clock,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  ExternalLink,
  RefreshCw,
  Sparkles,
  CheckSquare,
  Calendar,
  History,
  Timer,
  ArrowRight,
  Inbox,
  Filter,
} from "lucide-react";
import { getWIBDateString } from "@/lib/date-utils";

const COLUMNS = [
  {
    id: "REQUESTED",
    title: "User Requested",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Inbox,
    description: "Request divisi kolaborasi",
  },
  {
    id: "PENDING",
    title: "Belum Dikerjakan",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Clock,
    description: "Rencana hari ini",
  },
  {
    id: "IN_PROGRESS",
    title: "Sedang Berjalan",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    icon: PlayCircle,
    description: "Dalam pengerjaan",
  },
  {
    id: "COMPLETED",
    title: "Selesai",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
    description: "Tugas tuntas",
  },
  {
    id: "BLOCKED",
    title: "Terkendala",
    badgeColor: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle,
    description: "Butuh bantuan",
  },
];

export default function UnifiedTasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [counts, setCounts] = useState({ inbox: 0, inProgress: 0, completed: 0, pendingReview: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Daily Fresh Sheet Date Navigator
  const todayStr = getWIBDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [filterByDate, setFilterByDate] = useState(false);

  // Live Timers
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
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
      console.error("Failed to fetch tasks:", err);
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

  // Sync initial tracked seconds
  useEffect(() => {
    const initial: Record<string, number> = {};
    const now = Date.now();
    if (Array.isArray(tasks)) {
      tasks.forEach((t) => {
        if (t && t.id) {
          let baseSec = t.trackedSeconds || Math.round((t.actualHours || 0) * 3600) || 0;
          if (t.status !== "COMPLETED" && t.isTracking && t.trackingStartedAt) {
            const startedAt = new Date(t.trackingStartedAt).getTime();
            const elapsed = isNaN(startedAt) ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
            baseSec += elapsed;
          }
          initial[t.id] = baseSec;
        }
      });
    }
    setActiveTimers(initial);
  }, [tasks]);

  // Live timer interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveTimers((prev) => {
        let changed = false;
        const next = { ...prev };
        if (Array.isArray(tasks)) {
          tasks.forEach((t) => {
            if (t && t.id && t.status !== "COMPLETED" && t.isTracking) {
              let baseSec = t.trackedSeconds || 0;
              if (t.trackingStartedAt) {
                const startedAt = new Date(t.trackingStartedAt).getTime();
                const elapsed = isNaN(startedAt) ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
                next[t.id] = baseSec + elapsed;
              } else {
                next[t.id] = (next[t.id] || 0) + 1;
              }
              changed = true;
            }
          });
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const handleToggleTimer = async (task: any) => {
    if (!task || !task.id) return;
    const isCurrentlyTracking = task.isTracking;
    const currentSeconds = activeTimers[task.id] || 0;

    try {
      await fetch("/api/tasks/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          action: isCurrentlyTracking ? "PAUSE" : "START",
          trackedSeconds: currentSeconds,
        }),
      });

      fetchTasks();
    } catch (err) {
      console.error("Timer toggle error:", err);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const hours = String(Math.floor(sec / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const seconds = String(sec % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleStatusChange = async (taskId: string, targetStatus: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Check deliverable validation when completing delegated task
    if (targetStatus === "COMPLETED" && !task.deliverableUrl && task.creatorId && task.creatorId !== user?.id) {
      setDeliverableModalTask(task);
      return;
    }

    // Optimistic UI update immediately
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

  // Drag and Drop (Native HTML5 matching TaskKanbanBoard)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);
    if (!taskId) return;

    let targetStatus = targetColId;
    if (targetColId === "REQUESTED") {
      targetStatus = "REQUESTED";
    }

    await handleStatusChange(taskId, targetStatus);
  };

  const formatDateSimple = (iso?: string | null) => {
    if (!iso) return "Fleksibel";
    try {
      return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "LOW":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "Mendesak";
      case "HIGH":
        return "Tinggi";
      case "LOW":
        return "Rendah";
      default:
        return "Sedang";
    }
  };

  // Filter tasks based on search, brand, dept, priority, and optional date
  const filteredTasks = (tasks || []).filter((t) => {
    if (!t) return false;
    const title = t.title || "";
    const desc = t.description || "";
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrand === "ALL" || (t.brandName === selectedBrand || t.category === selectedBrand);
    const matchesDept = selectedDepartment === "ALL" || t.departmentCard === selectedDepartment;
    const matchesPriority = selectedPriority === "ALL" || t.priority === selectedPriority;

    let matchesDate = true;
    if (filterByDate && selectedDate) {
      // User Requested tasks are ALWAYS visible regardless of date filter
      const isUserRequested = t.status === "REQUESTED" || (t.status === "PENDING" && t.creatorId && t.creatorId !== user?.id);
      if (!isUserRequested) {
        const target = t.targetDate || (t.expectedDeadline ? t.expectedDeadline.split("T")[0] : null);
        matchesDate = target === selectedDate || !target || target < todayStr;
      }
    }

    return Boolean(matchesSearch && matchesBrand && matchesDept && matchesPriority && matchesDate);
  });

  // Categorize tasks into the 5 stages
  const getTasksForColumn = (colId: string) => {
    return filteredTasks.filter((t) => {
      if (colId === "REQUESTED") {
        return t.status === "REQUESTED" || (t.status === "PENDING" && t.creatorId && t.creatorId !== user?.id);
      }
      if (colId === "PENDING") {
        return t.status === "PENDING" && (!t.creatorId || t.creatorId === user?.id);
      }
      if (colId === "IN_PROGRESS") {
        return t.status === "IN_PROGRESS";
      }
      if (colId === "COMPLETED") {
        return t.status === "COMPLETED";
      }
      if (colId === "BLOCKED") {
        return t.status === "BLOCKED";
      }
      return false;
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {user && <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />}

      <div className="flex flex-1 overflow-hidden">
        {user && <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Banner - Exact styling of Papan Tugas Harian */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-red-100 bg-gradient-to-r from-red-50/70 via-white to-blue-50/40 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <CheckSquare className="h-4 w-4" />
                <span>Lembar Kerja Aktivitas Harian Difitech</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Papan Tugas Harian Karyawan
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Setiap hari adalah lembar tugas baru. Jalankan time tracker langsung pada tugas yang sedang aktif.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/dashboard/tasks/history"
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <History className="h-4 w-4 text-blue-600" />
                <span>Arsip & Riwayat Tugas</span>
              </Link>

              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:bg-red-700 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Daftarkan Tugas Baru</span>
              </button>
            </div>
          </div>

          {/* Date Selector & Search & Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            {/* Daily Fresh Sheet Date Navigator */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-600" />
              <span className="text-xs font-bold text-slate-700">Lembar Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setFilterByDate(true);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-red-500 focus:outline-none"
              />
              {filterByDate ? (
                <button
                  onClick={() => setFilterByDate(false)}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 text-[11px] font-bold transition cursor-pointer"
                >
                  Tampilkan Semua Tanggal
                </button>
              ) : selectedDate !== todayStr && (
                <button
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setFilterByDate(true);
                  }}
                  className="rounded-lg bg-red-50 text-red-700 px-2.5 py-1 text-[11px] font-bold hover:bg-red-100 transition cursor-pointer"
                >
                  Kembali ke Hari Ini
                </button>
              )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
              <div className="relative min-w-[180px] max-w-xs">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari tugas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-red-500 focus:outline-none font-medium"
              >
                <option value="ALL">Semua Brand</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-red-500 focus:outline-none font-medium"
              >
                <option value="ALL">Semua Divisi</option>
                <option value="SOSMED">Sosmed</option>
                <option value="ADS">Ads</option>
                <option value="SEO">SEO</option>
                <option value="WEB">Web Dev</option>
                <option value="MARKETPLACE">Marketplace</option>
                <option value="HR">HR</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-red-500 focus:outline-none font-medium"
              >
                <option value="ALL">Semua Prioritas</option>
                <option value="URGENT">Mendesak</option>
                <option value="HIGH">Tinggi</option>
                <option value="MEDIUM">Sedang</option>
                <option value="LOW">Rendah</option>
              </select>

              {(searchQuery || selectedBrand !== "ALL" || selectedDepartment !== "ALL" || selectedPriority !== "ALL" || filterByDate) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedBrand("ALL");
                    setSelectedDepartment("ALL");
                    setSelectedPriority("ALL");
                    setFilterByDate(false);
                    setSelectedDate(todayStr);
                  }}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Pending Review Alert Banner if needed */}
          {counts.pendingReview > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 px-4 py-2.5 text-xs shadow-2xs">
              <div className="flex items-center gap-2 text-amber-900 font-medium">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Ada <strong>{counts.pendingReview} tugas delegasi</strong> yang menunggu review & persetujuan Anda.
                </span>
              </div>
              <Link
                href="/dashboard/workspace"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 underline shrink-0"
              >
                <span>Buka Divisi Kolaborasi & Review</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Section Bar - Exact match of TaskKanbanBoard */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-red-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Papan Aktivitas Harian Difitech
              </span>
              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs text-slate-700 font-bold font-mono">
                {filteredTasks.length} Tugas
              </span>
            </div>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Tugas Harian</span>
            </button>
          </div>

          {/* 5 Kanban Columns: User Requested, Belum Dikerjakan, Sedang Berjalan, Selesai, Terkendala */}
          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-center text-slate-400">
              <RefreshCw className="h-7 w-7 animate-spin text-red-600 mb-2" />
              <p className="text-xs font-semibold">Memuat tugas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
              {COLUMNS.map((col) => {
                const ColIcon = col.icon;
                const colTasks = getTasksForColumn(col.id);

                return (
                  <div
                    key={col.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className="flex flex-col rounded-2xl border border-slate-200/90 bg-slate-100/70 p-3.5 min-h-[460px]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${col.badgeColor}`}>
                          <ColIcon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{col.title}</h4>
                          <p className="text-[10px] text-slate-500">{col.description}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700 font-mono shadow-xs">
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Task Cards Container */}
                    <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                      {colTasks.length === 0 ? (
                        <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400 p-2">
                          <p className="text-[11px]">Tidak ada tugas di kolom ini</p>
                          {col.id === "PENDING" && (
                            <button
                              onClick={() => setCreateModalOpen(true)}
                              className="mt-1 text-red-600 hover:underline text-[11px] font-semibold cursor-pointer"
                            >
                              + Tambah tugas baru
                            </button>
                          )}
                        </div>
                      ) : (
                        colTasks.map((task) => {
                          const isCompleted = task.status === "COMPLETED";
                          const isTracking = !isCompleted && Boolean(task.isTracking);
                          const seconds = activeTimers[task.id] || task.trackedSeconds || 0;

                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              onClick={() => setSelectedTaskForDetail(task)}
                              className={`group relative rounded-xl border bg-white p-3.5 shadow-2xs transition hover:border-slate-300 hover:shadow-md cursor-grab active:cursor-grabbing ${
                                isTracking
                                  ? "border-blue-500 ring-2 ring-blue-500/20"
                                  : isCompleted
                                  ? "border-emerald-200 bg-emerald-50/20"
                                  : task.reviewStatus === "TO_BE_REVIEWED"
                                  ? "border-amber-300 bg-amber-50/20"
                                  : task.reviewStatus === "REVISION_REQUESTED"
                                  ? "border-rose-300 bg-rose-50/20"
                                  : col.id === "REQUESTED"
                                  ? "border-purple-200 bg-purple-50/15"
                                  : "border-slate-200"
                              }`}
                            >
                              {/* Top Badges */}
                              <div className="flex items-center justify-between gap-1.5 mb-2 flex-wrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                    {task.departmentCard || task.brandName || "General"}
                                  </span>

                                  {/* Delegated from coworker indicator */}
                                  {task.creator && task.creator.id !== user?.id && (
                                    <span className="rounded bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.2 text-[9px] font-bold">
                                      Dari: {task.creator.name}
                                    </span>
                                  )}

                                  {/* Review Gate Badges */}
                                  {task.reviewStatus === "TO_BE_REVIEWED" && (
                                    <span className="rounded bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 text-[9px] font-black animate-pulse">
                                      ⏳ Menunggu Review
                                    </span>
                                  )}
                                  {task.reviewStatus === "UNDER_REVIEW" && (
                                    <span className="rounded bg-amber-200 text-amber-900 border border-amber-400 px-1.5 py-0.2 text-[9px] font-black animate-pulse">
                                      👀 Sedang Di-review
                                    </span>
                                  )}
                                  {task.reviewStatus === "REVISION_REQUESTED" && (
                                    <span className="rounded bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.2 text-[9px] font-black">
                                      ⚠️ Perlu Revisi
                                    </span>
                                  )}
                                  {task.status === "COMPLETED" && (
                                    <span className="rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 text-[9px] font-black">
                                      ✓ ACC / Selesai
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <span
                                    className={`rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getPriorityBadge(
                                      task.priority
                                    )}`}
                                  >
                                    {getPriorityLabel(task.priority)}
                                  </span>

                                  <div onClick={(e) => e.stopPropagation()}>
                                    <FollowUpButton
                                      taskId={task.id}
                                      taskTitle={task.title}
                                      initialFollowUps={task.followUps}
                                      onFollowUpSuccess={fetchTasks}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Title & Description */}
                              <h5 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-red-600 transition">
                                {task.title}
                              </h5>

                              {task.description && (
                                <p className="mt-1 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                  {task.description.replace(/<[^>]*>?/gm, "").trim()}
                                </p>
                              )}

                              {/* Live Time Tracker Bar */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1.5"
                              >
                                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                  <Timer
                                    className={`h-3.5 w-3.5 ${
                                      isTracking
                                        ? "text-blue-600 animate-spin"
                                        : isCompleted
                                        ? "text-emerald-600"
                                        : "text-slate-400"
                                    }`}
                                  />
                                  <span
                                    className={`font-bold ${
                                      isTracking
                                        ? "text-blue-700"
                                        : isCompleted
                                        ? "text-emerald-700"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {formatTimer(seconds)}
                                  </span>
                                </div>

                                {isCompleted ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                                    ✓ Selesai
                                  </span>
                                ) : task.reviewStatus === "TO_BE_REVIEWED" ? (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                    ⏳ Menunggu Review
                                  </span>
                                ) : task.reviewStatus === "UNDER_REVIEW" ? (
                                  <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded border border-amber-400">
                                    👀 Sedang Di-review
                                  </span>
                                ) : task.reviewStatus === "REVISION_REQUESTED" ? (
                                  <button
                                    type="button"
                                    onClick={() => setDeliverableModalTask(task)}
                                    className="text-[10px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded border border-rose-300 transition cursor-pointer"
                                  >
                                    Submit Revisi &rarr;
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleTimer(task)}
                                      className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition cursor-pointer ${
                                        isTracking
                                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                                      }`}
                                    >
                                      {isTracking ? (
                                        <>
                                          <PauseCircle className="h-3 w-3" />
                                          <span>Jeda</span>
                                        </>
                                      ) : (
                                        <>
                                          <PlayCircle className="h-3 w-3" />
                                          <span>Mulai</span>
                                        </>
                                      )}
                                    </button>

                                    {task.status === "IN_PROGRESS" && (
                                      <button
                                        type="button"
                                        onClick={() => setDeliverableModalTask(task)}
                                        className="rounded-md bg-emerald-600 text-white hover:bg-emerald-700 px-2 py-0.5 text-[10px] font-bold transition shadow-2xs cursor-pointer"
                                      >
                                        Submit
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Deliverable Proof of Work Link if present */}
                              {task.deliverableUrl && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-2 flex items-center gap-1.5"
                                >
                                  <a
                                    href={task.deliverableUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition truncate max-w-[160px]"
                                  >
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                    <span className="truncate">Link Hasil Kerja</span>
                                  </a>
                                </div>
                              )}

                              {/* Revision Note snippet if any */}
                              {task.reviewStatus === "REVISION_REQUESTED" && task.revisionNote && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1.5 text-[10px] text-rose-900 bg-rose-50 rounded px-2 py-1 border border-rose-200 leading-tight"
                                >
                                  <strong className="text-rose-700">Revisi:</strong> &ldquo;{task.revisionNote}&rdquo;
                                </div>
                              )}

                              {/* Card Footer: Date on left, Status Dropdown on right */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500"
                              >
                                <div className="flex items-center gap-1 font-medium text-slate-500">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  <span>{formatDateSimple(task.expectedDeadline || task.targetDate)}</span>
                                </div>

                                <select
                                  value={
                                    task.status === "REQUESTED" || (task.status === "PENDING" && task.creatorId && task.creatorId !== user?.id)
                                      ? "REQUESTED"
                                      : task.status
                                  }
                                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                  className="rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-700 px-1.5 py-0.5 focus:border-red-500 focus:outline-none font-semibold cursor-pointer"
                                >
                                  {task.creatorId && task.creatorId !== user?.id && (
                                    <option value="REQUESTED">Requested</option>
                                  )}
                                  <option value="PENDING">Backlog</option>
                                  <option value="IN_PROGRESS">Berjalan</option>
                                  <option value="COMPLETED">Selesai</option>
                                  <option value="BLOCKED">Terkendala</option>
                                </select>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Column Footer */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200 text-right text-[10px] text-slate-500 font-mono">
                      {colTasks.length} Tugas
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
