"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CreateTaskModal from "@/components/Tasks/CreateTaskModal";
import TaskDetailModal, { SOSMED_WORKBOARD_STAGES } from "@/components/Tasks/TaskDetailModal";
import FollowUpButton from "@/components/Tasks/FollowUpButton";
import SubmitDeliverableModal from "@/components/Tasks/SubmitDeliverableModal";
import RequestRevisionModal from "@/components/Tasks/RequestRevisionModal";
import DeadlineSuggestionModal from "@/components/Tasks/DeadlineSuggestionModal";
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
  List,
  ChevronRight,
  ArrowUpDown,
  Flame,
  FolderKanban,
  UserCheck,
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

  // View Mode: KANBAN (default as requested) vs GRID vs LIST
  const [viewMode, setViewMode] = useState<"KANBAN" | "GRID" | "LIST">("KANBAN");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedMember, setSelectedMember] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortField, setSortField] = useState<"DEADLINE" | "PRIORITY" | "TITLE">("DEADLINE");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  // Drag and Drop
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any | null>(null);
  const [approvalModalTask, setApprovalModalTask] = useState<any | null>(null);
  const [revisionModalTask, setRevisionModalTask] = useState<any | null>(null);
  const [deadlineModalTask, setDeadlineModalTask] = useState<any | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      const currentUser = data?.user;
      if (!currentUser) {
        router.push("/login");
        return;
      }
      const isAdm = currentUser.role === "ADMIN" || currentUser.role === "MANAGER";
      const dept = (currentUser.department || "").toLowerCase();
      const isSosmed =
        isAdm ||
        dept.includes("sosmed") ||
        dept.includes("social") ||
        dept.includes("konten") ||
        dept.includes("content") ||
        dept.includes("creat") ||
        dept.includes("desain") ||
        dept.includes("design") ||
        dept.includes("marketing");

      if (!isSosmed) {
        router.push("/dashboard/workspace");
        return;
      }

      setUser(currentUser);
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

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    if (dragOverStage !== stageKey) {
      setDragOverStage(stageKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStageKey: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);
    setDragOverStage(null);
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if ((task.kanbanStage || "CONTENT_BRIEF") === targetStageKey) return;

    await handleMoveStage(task, targetStageKey);
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

  // Unique Members for Filter
  const availableMembers = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => {
      if (t.user?.id && t.user?.name) {
        map.set(t.user.id, t.user.name);
      }
      if (t.assignees) {
        t.assignees.forEach((a: any) => {
          const u = a.user || a;
          if (u?.id && u?.name) {
            map.set(u.id, u.name);
          }
        });
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  // Filtered and Sorted Tasks
  const processedTasks = useMemo(() => {
    let result = tasks.filter((task) => {
      // Member filter
      if (selectedMember !== "ALL") {
        const matchesPic = task.user?.id === selectedMember;
        const matchesAssignee = task.assignees?.some(
          (a: any) => (a.user?.id || a.userId) === selectedMember
        );
        if (!matchesPic && !matchesAssignee) return false;
      }
      // Priority filter
      if (priorityFilter !== "ALL") {
        if ((task.priority || "MEDIUM").toUpperCase() !== priorityFilter) return false;
      }
      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortField === "DEADLINE") {
        const timeA = a.expectedDeadline ? new Date(a.expectedDeadline).getTime() : Infinity;
        const timeB = b.expectedDeadline ? new Date(b.expectedDeadline).getTime() : Infinity;
        return sortDirection === "ASC" ? timeA - timeB : timeB - timeA;
      }
      if (sortField === "PRIORITY") {
        const ranks: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const rankA = ranks[a.priority?.toUpperCase()] || 2;
        const rankB = ranks[b.priority?.toUpperCase()] || 2;
        return sortDirection === "ASC" ? rankB - rankA : rankA - rankB;
      }
      if (sortField === "TITLE") {
        return sortDirection === "ASC"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      return 0;
    });
  }, [tasks, selectedMember, priorityFilter, sortField, sortDirection]);

  // Stats calculation
  const totalTasks = processedTasks.length;
  const briefCount = processedTasks.filter((t) => (t.kanbanStage || "CONTENT_BRIEF") === "CONTENT_BRIEF").length;
  const productionCount = processedTasks.filter((t) =>
    ["SHOOTING", "DESIGN", "VIDEO_EDITING"].includes(t.kanbanStage)
  ).length;
  const revisionCount = processedTasks.filter((t) => t.kanbanStage === "REVISION").length;
  const approvalCount = processedTasks.filter((t) => t.kanbanStage === "APPROVAL").length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {user && <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />}

      <div className="flex flex-1">
        {user && (
          <Sidebar
            role={user.role}
            department={user.department}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
          {/* Header with BigBoard Hierarchy Breadcrumbs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              {/* Hierarchy Breadcrumb */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Link
                  href="/dashboard/workspace"
                  className="rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase transition flex items-center gap-1"
                >
                  <Layers className="h-3 w-3 text-red-600" />
                  <span>BigBoard Difitech</span>
                </Link>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <Link
                  href="/dashboard/workspace?card=SOSMED"
                  className="rounded-md bg-pink-100 hover:bg-pink-200 text-pink-800 text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase transition flex items-center gap-1"
                >
                  <span>BigBoard Sosmed</span>
                </Link>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="rounded-md bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 tracking-wider uppercase shadow-2xs">
                  🎬 Pipeline Konten (Kanban 6 Tahap)
                </span>
                <span className="text-[10px] font-extrabold text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full ml-1">
                  Sosmed & Admin Sistem
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                <span>Kanban Produksi Konten Tim Sosmed</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Alur produksi bertahap (1. Brief &rarr; 2. Shooting &rarr; 3. Desain &rarr; 4. Editing &rarr; 5. Revisi &rarr; 6. Approval). Terintegrasi dengan kartu BigBoard.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <Link
                href="/dashboard/workspace?card=SOSMED"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Ke BigBoard Sosmed</span>
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

          {/* Quick KPI Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500">Total Konten</p>
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

          {/* Full BigBoard Toolbar: Multi-View + Priority + Sort + Filters + Search */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Left: View Mode Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
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
                  <span>Pipeline Kanban (Utama)</span>
                </button>
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
                  onClick={() => setViewMode("LIST")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === "LIST"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Tabel List</span>
                </button>
              </div>
            </div>

            {/* Right: Priority, Sort, Member, Brand, and Search Filters */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Priority Filter */}
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-bold focus:border-pink-500 focus:bg-white focus:outline-none transition cursor-pointer shrink-0"
                >
                  <option value="ALL">Semua Prioritas</option>
                  <option value="URGENT">🔥 Urgent</option>
                  <option value="HIGH">⚡ High</option>
                  <option value="MEDIUM">⚖️ Medium</option>
                  <option value="LOW">☕ Low</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={`${sortField}_${sortDirection}`}
                  onChange={(e) => {
                    const [f, d] = e.target.value.split("_");
                    setSortField(f as any);
                    setSortDirection(d as any);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-bold focus:border-pink-500 focus:bg-white focus:outline-none transition cursor-pointer shrink-0"
                >
                  <option value="DEADLINE_ASC">Target Terdekat</option>
                  <option value="DEADLINE_DESC">Target Terjauh</option>
                  <option value="PRIORITY_ASC">Prioritas Tertinggi</option>
                  <option value="TITLE_ASC">Judul A-Z</option>
                </select>
              </div>

              {/* Member Filter */}
              <div className="relative">
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-bold focus:border-pink-500 focus:bg-white focus:outline-none transition cursor-pointer shrink-0"
                >
                  <option value="ALL">Semua Anggota Tim</option>
                  {availableMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.id === user?.id ? "(Saya)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-bold focus:border-pink-500 focus:bg-white focus:outline-none transition cursor-pointer shrink-0"
                >
                  <option value="ALL">Semua Brand</option>
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative w-40 sm:w-56">
                <input
                  type="text"
                  placeholder="Cari konten atau brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Render in Active View Mode */}
          {viewMode === "KANBAN" ? (
            /* ================= MODE 1: PIPELINE KANBAN (Horizontal Drag & Drop Columns) ================= */
            <div className="rounded-3xl border border-slate-200 bg-slate-200/50 p-3 sm:p-4 overflow-x-auto shadow-inner">
              <div className="flex gap-4 min-w-[1550px] items-start">
                {DEFAULT_STAGES.map((stage, idx) => {
                  const stageTasks = processedTasks.filter(
                    (t) => (t.kanbanStage || "CONTENT_BRIEF") === stage.key
                  );
                  const StageIcon = stage.icon;
                  const isHovered = dragOverStage === stage.key;

                  return (
                    <div
                      key={stage.key}
                      onDragOver={(e) => handleDragOver(e, stage.key)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, stage.key)}
                      className={`w-80 shrink-0 rounded-2xl border transition-all duration-150 bg-white shadow-2xs flex flex-col overflow-hidden ${
                        isHovered ? "ring-2 ring-pink-500 border-pink-400 scale-[1.01]" : "border-slate-200"
                      }`}
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
                            title="Tambah Konten Baru"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Column Body with Drag & Drop */}
                      <div className="p-2.5 space-y-2.5 flex-1 min-h-[500px] max-h-[720px] overflow-y-auto bg-slate-50/60">
                        {stageTasks.length === 0 ? (
                          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-400">
                            <StageIcon className="h-6 w-6 text-slate-300 mb-2" />
                            <p className="text-xs font-semibold text-slate-500">Belum ada konten</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Tarik kartu tugas ke sini untuk memindahkan tahap.</p>
                          </div>
                        ) : (
                          stageTasks.map((task) => (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              onClick={() => setSelectedTaskForDetail(task)}
                              className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-pink-300 hover:shadow-xs transition space-y-2 cursor-pointer group active:cursor-grabbing"
                            >
                              <div
                                className="flex items-center justify-between gap-1 flex-wrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="rounded-md bg-red-50 text-red-700 border border-red-200 font-bold text-[9px] px-1.5 py-0.5 flex items-center gap-0.5">
                                    <Tag className="h-2 w-2" /> {task.brandName || "General"}
                                  </span>

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

                              <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-pink-600 transition-colors">
                                {task.title}
                              </h4>

                              {task.revisionTag && (
                                <div className="rounded bg-rose-50 border border-rose-200 p-1.5 text-[10px] text-rose-800 font-bold flex items-center gap-1">
                                  <RefreshCw className="h-2.5 w-2.5 text-rose-600 shrink-0" />
                                  <span className="truncate">{task.revisionTag}</span>
                                </div>
                              )}

                              {/* Assignee Stack & Target Deadline */}
                              <div className="text-[10px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <User className="h-2.5 w-2.5" /> PIC:
                                  </span>
                                  <strong className="text-slate-700 truncate max-w-[130px]">
                                    {task.user?.name || "Belum ditentukan"}
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <Clock className="h-2.5 w-2.5" /> Target:
                                  </span>
                                  <span className="font-bold text-slate-700 flex items-center gap-1">
                                    <span>{formatDateTime(task.expectedDeadline)}</span>
                                    {task.suggestionStatus === "AGREED" ? (
                                      <span className="text-[8px] font-black px-1 rounded bg-emerald-100 text-emerald-800" title="Deadline Disepakati (ACC)">
                                        ✓ ACC
                                      </span>
                                    ) : task.suggestionStatus === "WAITING_ASSIGNEE_CONFIRMATION" || task.suggestionStatus === "WAITING_CREATOR_CONFIRMATION" ? (
                                      <span className="text-[8px] font-black px-1 rounded bg-amber-100 text-amber-800 animate-pulse" title="Sedang Negosiasi / Konsolidasi Deadline">
                                        ⚡ Nego
                                      </span>
                                    ) : null}
                                  </span>
                                </div>
                              </div>

                              {task.deliverableUrl && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded bg-emerald-50 border border-emerald-200 p-1.5 text-[10px] flex items-center justify-between"
                                >
                                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Hasil File
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

                              {/* Stage Navigation Arrow Buttons */}
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
            </div>
          ) : viewMode === "GRID" ? (
            /* ================= MODE 2: GRID 6 TAHAP ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              {DEFAULT_STAGES.map((stage, idx) => {
                const stageTasks = processedTasks.filter(
                  (t) => (t.kanbanStage || "CONTENT_BRIEF") === stage.key
                );
                const StageIcon = stage.icon;

                return (
                  <div
                    key={stage.key}
                    className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col transition hover:shadow-md"
                  >
                    {/* Stage Header */}
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
                            className="rounded-xl bg-white/20 hover:bg-white/30 px-2.5 py-1 text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-white/80 mt-1">{stage.sublabel}</p>
                    </div>

                    {/* Stage Task Cards */}
                    <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto bg-slate-50/50">
                      {stageTasks.length === 0 ? (
                        <div className="h-36 flex flex-col items-center justify-center text-center p-4 text-slate-400">
                          <StageIcon className="h-6 w-6 text-slate-300 mb-2" />
                          <p className="text-xs font-semibold text-slate-500">Tidak ada konten di tahap ini</p>
                        </div>
                      ) : (
                        stageTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTaskForDetail(task)}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-pink-300 hover:shadow-xs transition space-y-3 cursor-pointer group"
                          >
                            <div
                              className="flex items-center justify-between gap-2 flex-wrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold text-[10px] px-2 py-0.5 flex items-center gap-1">
                                  <Tag className="h-2.5 w-2.5" /> {task.brandName || "General"}
                                </span>
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

                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-pink-600 transition-colors">
                              {task.title}
                            </h4>

                            {task.revisionTag && (
                              <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 text-[11px] text-rose-800 font-bold flex items-center gap-1.5">
                                <RefreshCw className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                <span className="truncate">{task.revisionTag}</span>
                              </div>
                            )}

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
            /* ================= MODE 3: TABEL LIST VIEW ================= */
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Konten & Brand</th>
                      <th className="py-3 px-4">Tahap / Stage</th>
                      <th className="py-3 px-4">PIC Editor</th>
                      <th className="py-3 px-4">Prioritas</th>
                      <th className="py-3 px-4">Target Deadline</th>
                      <th className="py-3 px-4 text-center">Aksi Pengerjaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Tidak ada konten yang sesuai dengan filter.
                        </td>
                      </tr>
                    ) : (
                      processedTasks.map((task) => {
                        const currentStage =
                          DEFAULT_STAGES.find((s) => s.key === (task.kanbanStage || "CONTENT_BRIEF")) ||
                          DEFAULT_STAGES[0];
                        const StageIcon = currentStage.icon;

                        return (
                          <tr
                            key={task.id}
                            onClick={() => setSelectedTaskForDetail(task)}
                            className="hover:bg-slate-50/80 transition cursor-pointer group"
                          >
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 group-hover:text-pink-600 transition-colors">
                                {task.title}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="rounded bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold px-1.5 py-0.2">
                                  {task.brandName || "General"}
                                </span>
                                {task.revisionTag && (
                                  <span className="rounded bg-rose-50 text-rose-700 text-[9px] font-bold px-1.5 py-0.2">
                                    {task.revisionTag}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${currentStage.badgeBg}`}>
                                <StageIcon className="h-3 w-3" />
                                <span>{currentStage.label}</span>
                              </span>
                            </td>

                            <td className="py-3 px-4 text-slate-700 font-semibold">
                              {task.user?.name || "-"}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  task.priority === "URGENT"
                                    ? "bg-rose-100 text-rose-700"
                                    : task.priority === "HIGH"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {task.priority || "MEDIUM"}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                              {formatDateTime(task.expectedDeadline)}
                            </td>

                            <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="inline-flex items-center gap-1.5">
                                {currentStage.order < 6 ? (
                                  <button
                                    onClick={() => handleMoveStage(task, DEFAULT_STAGES[currentStage.order].key)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-[10px] hover:bg-slate-800 transition"
                                  >
                                    Lanjut: {DEFAULT_STAGES[currentStage.order].shortLabel}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleMoveStage(task, "APPROVAL")}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition"
                                  >
                                    Approve Selesai
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
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
        customStages={SOSMED_WORKBOARD_STAGES}
        onUpdate={fetchTasks}
        onOpenDeadlineModal={(t) => setDeadlineModalTask(t)}
        onOpenDeliverableModal={(t) => setApprovalModalTask(t)}
        onOpenRevisionModal={(t) => setRevisionModalTask(t)}
      />

      {deadlineModalTask && (
        <DeadlineSuggestionModal
          isOpen={Boolean(deadlineModalTask)}
          onClose={() => setDeadlineModalTask(null)}
          taskId={deadlineModalTask.id}
          taskTitle={deadlineModalTask.title}
          currentExpectedDeadline={deadlineModalTask.expectedDeadline}
          currentlySuggestedDeadline={deadlineModalTask.suggestedDeadline}
          suggestionReason={deadlineModalTask.suggestionReason}
          suggestionStatus={deadlineModalTask.suggestionStatus}
          isCreator={deadlineModalTask.creator?.id === user?.id || user?.role === "ADMIN" || user?.role === "MANAGER"}
          isAssignee={deadlineModalTask.user?.id === user?.id || deadlineModalTask.assignees?.some((a: any) => a.user?.id === user?.id)}
          onSuccess={fetchTasks}
        />
      )}

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
