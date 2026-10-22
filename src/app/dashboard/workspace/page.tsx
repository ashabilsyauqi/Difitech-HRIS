"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CreateTaskModal from "@/components/Tasks/CreateTaskModal";
import TaskDetailModal from "@/components/Tasks/TaskDetailModal";
import FollowUpButton from "@/components/Tasks/FollowUpButton";
import DeadlineSuggestionModal from "@/components/Tasks/DeadlineSuggestionModal";
import RequestRevisionModal from "@/components/Tasks/RequestRevisionModal";
import SubmitDeliverableModal from "@/components/Tasks/SubmitDeliverableModal";
import {
  Layers,
  Plus,
  Search,
  Filter,
  User,
  Clock,
  Tag,
  ExternalLink,
  Clapperboard,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Share2,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Globe,
  ShoppingBag,
  Users,
  PlayCircle,
  PauseCircle,
  Inbox,
  Timer,
  CheckSquare,
  Flame,
  MessageSquare,
} from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  departmentCard: string;
  brandName?: string | null;
  status: string;
  priority: string;
  expectedDeadline?: string | null;
  suggestedDeadline?: string | null;
  suggestionReason?: string | null;
  suggestionStatus?: string;
  isContentProduction: boolean;
  kanbanStage?: string | null;
  revisionTag?: string | null;
  deliverableUrl?: string | null;
  reviewStatus?: string;
  reviewedAt?: string | null;
  createdAt: string;
  totalTimeSeconds?: number;
  timerStartedAt?: string | null;
  user: {
    id: string;
    name: string;
    department?: string | null;
    avatarUrl?: string | null;
  };
  creator?: {
    id: string;
    name: string;
    department?: string | null;
    avatarUrl?: string | null;
  } | null;
  followUps?: any[];
}

const CARDS_DEFINITION = [
  {
    key: "SOSMED",
    label: "Sosmed",
    sublabel: "Social Media & Content Hub",
    badgeColor: "bg-pink-100 text-pink-700 border-pink-200",
    headerBg: "bg-gradient-to-r from-pink-500 to-rose-600",
    borderHover: "hover:border-pink-300",
    accentColor: "text-pink-600",
    icon: Clapperboard,
    desc: "Produksi video reels, feeds, script writing, shooting & editing konten sosmed.",
    isContentHub: true,
  },
  {
    key: "ADS",
    label: "Ads",
    sublabel: "Paid Traffic, Meta & Google",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    headerBg: "bg-gradient-to-r from-blue-600 to-indigo-600",
    borderHover: "hover:border-blue-300",
    accentColor: "text-blue-600",
    icon: TrendingUp,
    desc: "Kampanye iklan berbayar Facebook, Instagram, Google Ads, scale-up ROAS & budgeting.",
  },
  {
    key: "SEO",
    label: "SEO",
    sublabel: "Organic Traffic & Articles",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    headerBg: "bg-gradient-to-r from-amber-500 to-orange-600",
    borderHover: "hover:border-amber-300",
    accentColor: "text-amber-600",
    icon: Search,
    desc: "Optimasi mesin pencari, riset keyword artikel blog, backlink, & traffic organik.",
  },
  {
    key: "WEB",
    label: "Web",
    sublabel: "Landing Pages & Tech Stack",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    headerBg: "bg-gradient-to-r from-emerald-600 to-teal-600",
    borderHover: "hover:border-emerald-300",
    accentColor: "text-emerald-600",
    icon: Globe,
    desc: "Pengembangan web landing page, integrasi payment gateway, bug fixing & maintenance.",
  },
  {
    key: "MARKETPLACE",
    label: "Marketplace",
    sublabel: "Shopee, Tokopedia, TikTok Shop",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    headerBg: "bg-gradient-to-r from-purple-600 to-violet-600",
    borderHover: "hover:border-purple-300",
    accentColor: "text-purple-600",
    icon: ShoppingBag,
    desc: "Manajemen toko online, upload produk, flash sale, live streaming & voucher toko.",
  },
  {
    key: "HR",
    label: "HR",
    sublabel: "Operations & Internal Team",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    headerBg: "bg-gradient-to-r from-slate-700 to-slate-900",
    borderHover: "hover:border-slate-300",
    accentColor: "text-slate-700",
    icon: Users,
    desc: "Rekrutmen karyawan, absensi, payroll gaji, izin cuti, & operasional internal kantor.",
  },
];

const STAGE_COLUMNS = [
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
    description: "Rencana & antrean tugas",
  },
  {
    id: "IN_PROGRESS",
    title: "Sedang Berjalan",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    icon: PlayCircle,
    description: "Dalam pengerjaan aktif",
  },
  {
    id: "COMPLETED",
    title: "Selesai",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
    description: "Tugas tuntas & hasil kerja",
  },
  {
    id: "BLOCKED",
    title: "Terkendala",
    badgeColor: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle,
    description: "Butuh bantuan / blocker",
  },
];

const isHomeCard = (cardKey: string, userDept?: string | null) => {
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

const isCardRelevantForEmployee = (cardKey: string, user: any, allTasks: TaskItem[]) => {
  if (!user) return false;
  // 1. Home division
  if (isHomeCard(cardKey, user.department)) return true;
  // 2. Any active/existing task involving the user in this card (assignee or requester)
  return allTasks.some(
    (t) =>
      (t.departmentCard || "").toUpperCase() === cardKey.toUpperCase() &&
      (t.user?.id === user.id || t.creator?.id === user.id)
  );
};

export default function WorkspaceCardsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active view: null for Thumbnail Overview, or division key (e.g. "WEB") for Stage View
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedMember, setSelectedMember] = useState("ALL");
  const [viewScope, setViewScope] = useState<"ALL" | "MINE" | "DELEGATED" | "RELEVANT">("RELEVANT");
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const isAdmin = user?.role === "ADMIN" || user?.role === "MANAGER";

  // Drag and Drop & Timers
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [targetCardForNew, setTargetCardForNew] = useState<string | undefined>(undefined);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TaskItem | null>(null);
  const [deadlineModalTask, setDeadlineModalTask] = useState<TaskItem | null>(null);
  const [revisionModalTask, setRevisionModalTask] = useState<TaskItem | null>(null);
  const [deliverableModalTask, setDeliverableModalTask] = useState<TaskItem | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      const isAdm = data.user?.role === "ADMIN" || data.user?.role === "MANAGER";
      if (isAdm) {
        setViewScope("ALL");
      } else {
        setViewScope("RELEVANT");
      }
    } catch {
      router.push("/login");
    }
  };

  const fetchBrandsAndMetadata = async () => {
    try {
      const res = await fetch("/api/workspace/metadata");
      if (res.ok) {
        const data = await res.json();
        setAvailableBrands(data.brands || []);
      }
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedBrand !== "ALL") params.set("brandName", selectedBrand);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/workspace/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const loadedTasks = data.tasks || [];
        setTasks(loadedTasks);

        // Sync live active timers
        const timerMap: Record<string, number> = {};
        loadedTasks.forEach((t: TaskItem) => {
          if (t.timerStartedAt && t.status === "IN_PROGRESS") {
            const elapsedSinceStart = Math.floor(
              (Date.now() - new Date(t.timerStartedAt).getTime()) / 1000
            );
            timerMap[t.id] = (t.totalTimeSeconds || 0) + Math.max(0, elapsedSinceStart);
          } else {
            timerMap[t.id] = t.totalTimeSeconds || 0;
          }
        });
        setActiveTimers(timerMap);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Timer interval for in-progress tasks
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers((prev) => {
        const updated = { ...prev };
        tasks.forEach((t) => {
          if (t.timerStartedAt && t.status === "IN_PROGRESS") {
            const elapsedSinceStart = Math.floor(
              (Date.now() - new Date(t.timerStartedAt).getTime()) / 1000
            );
            updated[t.id] = (t.totalTimeSeconds || 0) + Math.max(0, elapsedSinceStart);
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    fetchSession();
    fetchBrandsAndMetadata();

    // Check if URL specifies a division
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const cardParam = searchParams.get("card");
      if (cardParam) {
        const found = CARDS_DEFINITION.find((c) => c.key.toLowerCase() === cardParam.toLowerCase());
        if (found) {
          setSelectedDivision(found.key);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedBrand, searchQuery]);

  // Navigate to division stage view
  const openDivisionStage = (divisionKey: string) => {
    setSelectedDivision(divisionKey);
    setSelectedMember("ALL");
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/dashboard/workspace?card=${divisionKey}`);
    }
  };

  // Back to thumbnail overview
  const backToOverview = () => {
    setSelectedDivision(null);
    setSelectedMember("ALL");
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/dashboard/workspace`);
    }
  };

  // Timer Toggle (Mulai / Jeda)
  const handleToggleTimer = async (task: TaskItem) => {
    try {
      const isRunning = Boolean(task.timerStartedAt);
      const res = await fetch("/api/tasks/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          action: isRunning ? "PAUSE" : "START",
        }),
      });

      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to toggle timer:", err);
    }
  };

  // Status Change
  const handleStatusChange = async (taskId: string, targetStatus: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (targetStatus === "COMPLETED") {
      setDeliverableModalTask(task);
      return;
    }

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

  // Drag and Drop Handlers
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

    await handleStatusChange(taskId, targetColId);
  };

  const handleApproveTask = async (taskId: string) => {
    try {
      await fetch(`/api/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewAction: { action: "APPROVE" } }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to approve task:", err);
    }
  };

  const handleStartReview = async (taskId: string) => {
    try {
      await fetch(`/api/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewAction: { action: "START_REVIEW" } }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to start review:", err);
    }
  };

  const formatTimerSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h}j ${m}m`;
    }
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
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

  // Active division definition
  const currentDivisionDef = useMemo(() => {
    if (!selectedDivision) return null;
    return CARDS_DEFINITION.find((c) => c.key === selectedDivision) || null;
  }, [selectedDivision]);

  // Tasks belonging to active division
  const divisionTasks = useMemo(() => {
    if (!selectedDivision) return [];
    return tasks.filter(
      (t) => (t.departmentCard || "").toUpperCase() === selectedDivision
    );
  }, [tasks, selectedDivision]);

  // Unique members for filter in stage view
  const divisionMembers = useMemo(() => {
    const map = new Map<string, string>();
    divisionTasks.forEach((t) => {
      if (t.user?.id && t.user?.name) {
        map.set(t.user.id, t.user.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [divisionTasks]);

  // Filtered division tasks based on member, brand, search, viewScope
  const filteredDivisionTasks = useMemo(() => {
    return divisionTasks.filter((t) => {
      if (selectedMember !== "ALL" && t.user?.id !== selectedMember) {
        return false;
      }
      if (viewScope === "MINE" && t.user?.id !== user?.id) {
        return false;
      }
      if (viewScope === "DELEGATED" && (t.creator?.id !== user?.id || t.user?.id === user?.id)) {
        return false;
      }
      if (viewScope === "RELEVANT") {
        const isInvolved = t.user?.id === user?.id || t.creator?.id === user?.id;
        if (!isInvolved) return false;
      }
      return true;
    });
  }, [divisionTasks, selectedMember, viewScope, user]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {user && <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />}

      <div className="flex flex-1">
        {user && <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full space-y-6">
          {/* ========================================================================= */}
          {/* VIEW 1: THUMBNAIL OVERVIEW (Default)                                     */}
          {/* ========================================================================= */}
          {!selectedDivision ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 tracking-wider uppercase">
                      {isAdmin ? "Executive Overview" : "Ruang Kerja Kolaborasi"}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {isAdmin ? "Divisi Kolaborasi (6 Card)" : "Divisi & Kolaborasi Terkait Anda"}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                    {isAdmin ? "6 Card Divisi Kerja" : "Divisi Kolaborasi Kerja"}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isAdmin
                      ? "Ringkasan aktivitas 6 divisi kerja. Pantau kolaborasi lintas tim, tugas yang sedang berjalan, dan delegasi antar karyawan."
                      : "Pantau pipeline divisi kerja yang berkolaborasi dengan Anda, request lintas tim, serta tugas yang ditugaskan."}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <Link
                    href="/dashboard/content-production"
                    className="flex items-center gap-1.5 rounded-xl border border-pink-300 bg-pink-50 px-3.5 py-2 text-xs font-bold text-pink-700 hover:bg-pink-100 transition shadow-2xs"
                  >
                    <Clapperboard className="h-4 w-4 text-pink-600" />
                    <span>Kanban Konten (Sosmed)</span>
                  </Link>

                  <button
                    onClick={() => {
                      setTargetCardForNew(undefined);
                      setCreateModalOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Request Tugas Lintas Divisi</span>
                  </button>
                </div>
              </div>

              {/* Toolbar & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                {/* View Scope Filter */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto w-full sm:w-auto">
                  {!isAdmin ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setViewScope("RELEVANT")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          viewScope === "RELEVANT"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-slate-600 hover:text-blue-600"
                        }`}
                      >
                        <span>🎯 Divisi Terkait Saya</span>
                        {user && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              viewScope === "RELEVANT"
                                ? "bg-white/20 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {
                              tasks.filter(
                                (t) => t.user?.id === user.id || t.creator?.id === user.id
                              ).length
                            }
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewScope("DELEGATED")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          viewScope === "DELEGATED"
                            ? "bg-purple-600 text-white shadow-2xs"
                            : "text-slate-600 hover:text-purple-600"
                        }`}
                      >
                        <span>📤 Saya Delegasikan</span>
                        {user && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              viewScope === "DELEGATED"
                                ? "bg-white/20 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {
                              tasks.filter(
                                (t) => t.creator?.id === user.id && t.user?.id !== user.id
                              ).length
                            }
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewScope("ALL")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
                          viewScope === "ALL"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        🏢 Jelajahi Semua 6 Divisi
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setViewScope("ALL")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
                          viewScope === "ALL"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        🏢 Semua 6 Divisi
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewScope("RELEVANT")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          viewScope === "RELEVANT"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-slate-600 hover:text-blue-600"
                        }`}
                      >
                        <span>🎯 Tugas Terkait Saya</span>
                        {user && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              viewScope === "RELEVANT"
                                ? "bg-white/20 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {
                              tasks.filter(
                                (t) => t.user?.id === user.id || t.creator?.id === user.id
                              ).length
                            }
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewScope("DELEGATED")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          viewScope === "DELEGATED"
                            ? "bg-purple-600 text-white shadow-2xs"
                            : "text-slate-600 hover:text-purple-600"
                        }`}
                      >
                        <span>📤 Saya Delegasikan</span>
                        {user && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              viewScope === "DELEGATED"
                                ? "bg-white/20 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {
                              tasks.filter(
                                (t) => t.creator?.id === user.id && t.user?.id !== user.id
                              ).length
                            }
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Search & Brand */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="text"
                      placeholder="Cari tugas / brand / nama..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                    />
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-bold text-slate-500 hidden sm:flex items-center gap-1">
                      <Filter className="h-3 w-3" /> Brand:
                    </span>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-red-500 outline-none bg-white font-medium"
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
              </div>

              {/* CARD THUMBNAIL GRID */}
              {(() => {
                const visibleCardDefs = CARDS_DEFINITION.filter((cardDef) => {
                  if (viewScope === "ALL") return true;
                  if (viewScope === "DELEGATED") {
                    return tasks.some(
                      (t) =>
                        (t.departmentCard || "").toUpperCase() === cardDef.key &&
                        t.creator?.id === user?.id &&
                        t.user?.id !== user?.id
                    );
                  }
                  // viewScope === "RELEVANT" or "MINE"
                  if (isAdmin) return true;
                  return isCardRelevantForEmployee(cardDef.key, user, tasks);
                });

                if (visibleCardDefs.length === 0) {
                  return (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400 space-y-3">
                      <CheckSquare className="h-10 w-10 mx-auto text-slate-300" />
                      <div>
                        <h3 className="text-base font-bold text-slate-800">
                          Belum Ada Kolaborasi Lintas Divisi yang Terhubung
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                          Saat rekan dari divisi lain (misal: Sosmed, Marketing, Ads) meminta bantuan Anda, card divisi mereka akan otomatis muncul di sini.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setTargetCardForNew(undefined);
                          setCreateModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Request Tugas Lintas Divisi</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {visibleCardDefs.map((cardDef) => {
                      const Icon = cardDef.icon;
                      // All tasks in this division
                      const cardAllTasks = tasks.filter(
                        (t) => (t.departmentCard || "").toUpperCase() === cardDef.key
                      );

                      // Tasks filtered by viewScope and role
                      const cardTasks = cardAllTasks.filter((t) => {
                        if (viewScope === "ALL") return true;
                        if (viewScope === "DELEGATED") return t.creator?.id === user?.id && t.user?.id !== user?.id;
                        if (viewScope === "MINE") return t.user?.id === user?.id;
                        // viewScope === "RELEVANT"
                        if (!isAdmin) {
                          return t.user?.id === user?.id || t.creator?.id === user?.id;
                        }
                        return true;
                      });

                  // Calculations
                  const total = cardTasks.length;
                  const runningTasks = cardTasks.filter((t) => t.status === "IN_PROGRESS");
                  const runningCount = runningTasks.length;
                  const requestedCount = cardTasks.filter(
                    (t) => t.status === "REQUESTED" || (t.status === "PENDING" && t.creator?.id && t.creator.id !== t.user?.id)
                  ).length;
                  const reviewCount = cardTasks.filter(
                    (t) => t.reviewStatus === "TO_BE_REVIEWED" || t.reviewStatus === "REVISION_REQUESTED"
                  ).length;
                  const completedCount = cardTasks.filter((t) => t.status === "COMPLETED").length;

                  // Active workers (people assigned to non-completed tasks)
                  const activeWorkerMap = new Map<string, { id: string; name: string; avatarUrl?: string | null }>();
                  cardTasks
                    .filter((t) => t.status !== "COMPLETED" && t.user?.id)
                    .forEach((t) => {
                      activeWorkerMap.set(t.user.id, {
                        id: t.user.id,
                        name: t.user.name,
                        avatarUrl: t.user.avatarUrl,
                      });
                    });
                  const activeWorkers = Array.from(activeWorkerMap.values());

                  // Cross-Department Collaboration Requests ("Biar Bos Tau")
                  // Tasks where creator is different from assignee, or creator department is different
                  const crossRequests = cardTasks.filter(
                    (t) => t.creator?.id && t.creator.id !== t.user?.id && t.status !== "COMPLETED"
                  );

                  return (
                    <div
                      key={cardDef.key}
                      onClick={() => openDivisionStage(cardDef.key)}
                      className={`group rounded-3xl border border-slate-200 bg-white shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col cursor-pointer ${cardDef.borderHover}`}
                    >
                      {/* Thumbnail Header */}
                      <div className={`p-4 text-white ${cardDef.headerBg}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-white">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-black tracking-tight">{cardDef.label}</h3>
                                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">
                                  {total} Tugas
                                </span>
                              </div>
                              <p className="text-[11px] text-white/80 line-clamp-1">{cardDef.sublabel}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetCardForNew(cardDef.key);
                              setCreateModalOpen(true);
                            }}
                            title={`Request tugas ke ${cardDef.label}`}
                            className="rounded-xl bg-white/20 hover:bg-white/30 px-2.5 py-1.5 text-white transition flex items-center gap-1 text-[11px] font-bold cursor-pointer shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Request</span>
                          </button>
                        </div>
                      </div>

                      {/* Thumbnail Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        {/* 1. Live Notification & Metrics Bar */}
                        <div className="grid grid-cols-3 gap-2">
                          {/* Running Tasks Notification */}
                          <div className={`p-2.5 rounded-2xl border transition ${
                            runningCount > 0 
                              ? "bg-blue-50/80 border-blue-200 text-blue-900 shadow-2xs" 
                              : "bg-slate-50 border-slate-200/60 text-slate-500"
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold">Sedang Jalan</span>
                              {runningCount > 0 && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                </span>
                              )}
                            </div>
                            <div className="text-lg font-black mt-0.5">
                              {runningCount}{" "}
                              <span className="text-[10px] font-medium text-slate-500">task</span>
                            </div>
                          </div>

                          {/* User Requested */}
                          <div className={`p-2.5 rounded-2xl border transition ${
                            requestedCount > 0
                              ? "bg-purple-50/80 border-purple-200 text-purple-900 shadow-2xs"
                              : "bg-slate-50 border-slate-200/60 text-slate-500"
                          }`}>
                            <span className="text-[10px] font-bold">Request Masuk</span>
                            <div className="text-lg font-black mt-0.5">
                              {requestedCount}{" "}
                              <span className="text-[10px] font-medium text-slate-500">task</span>
                            </div>
                          </div>

                          {/* Review Gate Pending */}
                          <div className={`p-2.5 rounded-2xl border transition ${
                            reviewCount > 0
                              ? "bg-amber-50/90 border-amber-200 text-amber-900 shadow-2xs"
                              : "bg-slate-50 border-slate-200/60 text-slate-500"
                          }`}>
                            <span className="text-[10px] font-bold">Butuh Review</span>
                            <div className="text-lg font-black mt-0.5">
                              {reviewCount}{" "}
                              <span className="text-[10px] font-medium text-slate-500">task</span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Siapa yang Sedang Kerja di Sana */}
                        <div className="rounded-2xl bg-slate-50/80 border border-slate-200/70 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-500" />
                              Sedang Bekerja di Sini:
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700">
                              {activeWorkers.length} Karyawan
                            </span>
                          </div>

                          {activeWorkers.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">
                              Belum ada karyawan aktif yang mengerjakan tugas saat ini.
                            </p>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {activeWorkers.slice(0, 4).map((worker) => (
                                <span
                                  key={worker.id}
                                  className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2 py-0.8 text-[11px] font-bold text-slate-800 shadow-2xs"
                                >
                                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                  {worker.name}
                                </span>
                              ))}
                              {activeWorkers.length > 4 && (
                                <span className="rounded-lg bg-slate-200 px-2 py-0.8 text-[10px] font-bold text-slate-600">
                                  +{activeWorkers.length - 4} lainnya
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 3. Radar Kolaborasi Lintas Tim ("Biar Bos Tau") */}
                        <div className="rounded-2xl bg-gradient-to-r from-red-50/40 via-amber-50/30 to-purple-50/40 border border-slate-200/80 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                              <Share2 className="h-3.5 w-3.5 text-red-600" />
                              Radar Request Lintas Divisi:
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                              {crossRequests.length} Aktif
                            </span>
                          </div>

                          {crossRequests.length === 0 ? (
                            <p className="text-[11px] text-slate-500">
                              Tidak ada delegasi lintas divisi aktif saat ini.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {crossRequests.slice(0, 2).map((reqTask) => (
                                <div
                                  key={reqTask.id}
                                  className="rounded-xl bg-white/90 border border-slate-200 p-2 text-[11px] text-slate-700 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1 truncate font-bold text-slate-900">
                                      <span className="text-red-700 font-extrabold">{reqTask.creator?.name || "Kolega"}</span>
                                      <span className="text-slate-400">➔</span>
                                      <span className="text-blue-700 truncate">{reqTask.user?.name}</span>
                                    </div>
                                    <span className="text-[9px] font-black uppercase px-1 rounded bg-slate-100 text-slate-600 shrink-0">
                                      {reqTask.status === "IN_PROGRESS"
                                        ? "Sedang Jalan"
                                        : reqTask.reviewStatus === "TO_BE_REVIEWED"
                                        ? "Review"
                                        : "Pending"}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                                    "{reqTask.title}"
                                  </p>
                                </div>
                              ))}
                              {crossRequests.length > 2 && (
                                <p className="text-[10px] text-red-700 font-bold text-center">
                                  +{crossRequests.length - 2} request lintas divisi lainnya
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 4. Action Footer Button */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">
                            {completedCount} tuntas dari {total} tugas
                          </span>
                          <div className="inline-flex items-center gap-1.5 text-xs font-black text-red-600 group-hover:text-red-700 group-hover:translate-x-0.5 transition">
                            <span>Buka Stage Divisi</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          ) : (
            /* ========================================================================= */
            /* VIEW 2: STAGE KANBAN VIEW ("Seperti Tugas Pribadi")                       */
            /* ========================================================================= */
            <div className="space-y-5">
              {/* Top Navigation & Breadcrumb */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={backToOverview}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Semua Divisi</span>
                  </button>

                  <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                  <div className="flex items-center gap-2">
                    {currentDivisionDef && (
                      <span className={`rounded-xl px-2.5 py-1 text-xs font-black border ${currentDivisionDef.badgeColor}`}>
                        {currentDivisionDef.label}
                      </span>
                    )}
                    <div>
                      <h2 className="text-lg font-black text-slate-900 leading-tight">
                        Lembar Kerja Divisi {currentDivisionDef?.label}
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        {currentDivisionDef?.sublabel} • Tampilan Stage Kanban Lintas Tim
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {currentDivisionDef?.isContentHub && (
                    <Link
                      href="/dashboard/content-production"
                      className="flex items-center gap-1.5 rounded-xl border border-pink-300 bg-pink-50 px-3 py-1.5 text-xs font-bold text-pink-700 hover:bg-pink-100 transition shadow-2xs"
                    >
                      <Clapperboard className="h-3.5 w-3.5 text-pink-600" />
                      <span>Pipeline Konten 6-Tahap</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setTargetCardForNew(selectedDivision || undefined);
                      setCreateModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Tugas di {currentDivisionDef?.label}</span>
                  </button>
                </div>
              </div>

              {/* Sub-Filters for Stage View */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                {/* View Scope Filter */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
                  {!isAdmin ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setViewScope("RELEVANT")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          viewScope === "RELEVANT"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-slate-600 hover:text-blue-600"
                        }`}
                      >
                        <span>🎯 Pipeline Terkait Saya</span>
                        {user && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              viewScope === "RELEVANT"
                                ? "bg-white/20 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {
                              divisionTasks.filter(
                                (t) => t.user?.id === user.id || t.creator?.id === user.id
                              ).length
                            }
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewScope("DELEGATED")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          viewScope === "DELEGATED"
                            ? "bg-purple-600 text-white shadow-2xs"
                            : "text-slate-600 hover:text-purple-600"
                        }`}
                      >
                        <span>📤 Delegasi Saya</span>
                        {user && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              viewScope === "DELEGATED"
                                ? "bg-white/20 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {
                              divisionTasks.filter(
                                (t) => t.creator?.id === user.id && t.user?.id !== user.id
                              ).length
                            }
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewScope("ALL")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
                          viewScope === "ALL"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        🏢 Semua Tugas Divisi ({divisionTasks.length})
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setViewScope("ALL")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
                          viewScope === "ALL"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        🏢 Semua Tugas ({divisionTasks.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewScope("RELEVANT")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          viewScope === "RELEVANT"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-slate-600 hover:text-blue-600"
                        }`}
                      >
                        <span>🎯 Tugas Terkait Saya</span>
                        {user && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              viewScope === "RELEVANT"
                                ? "bg-white/20 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {
                              divisionTasks.filter(
                                (t) => t.user?.id === user.id || t.creator?.id === user.id
                              ).length
                            }
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewScope("DELEGATED")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          viewScope === "DELEGATED"
                            ? "bg-purple-600 text-white shadow-2xs"
                            : "text-slate-600 hover:text-purple-600"
                        }`}
                      >
                        <span>📤 Delegasi Saya</span>
                        {user && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              viewScope === "DELEGATED"
                                ? "bg-white/20 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {
                              divisionTasks.filter(
                                (t) => t.creator?.id === user.id && t.user?.id !== user.id
                              ).length
                            }
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Member, Brand, and Search Filters */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Member Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Pengerja:</span>
                    <select
                      value={selectedMember}
                      onChange={(e) => setSelectedMember(e.target.value)}
                      className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-red-500 outline-none bg-white font-medium"
                    >
                      <option value="ALL">Semua Karyawan</option>
                      {divisionMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Brand:</span>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-red-500 outline-none bg-white font-medium"
                    >
                      <option value="ALL">Semua Brand</option>
                      {availableBrands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search */}
                  <div className="relative w-44 sm:w-56">
                    <input
                      type="text"
                      placeholder="Cari tugas di divisi ini..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                    />
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Employee Mode Indicator in Stage View */}
              {!isAdmin && viewScope === "RELEVANT" && (
                <div className="rounded-xl bg-blue-50 border border-blue-200/80 px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0"></span>
                    <span className="font-bold">Mode Karyawan:</span>
                    <span>Hanya menampilkan pipeline stage yang bersangkutan dengan Anda ({filteredDivisionTasks.length} tugas).</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewScope("ALL")}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline text-left sm:text-right cursor-pointer"
                  >
                    Buka semua tugas divisi ({divisionTasks.length}) →
                  </button>
                </div>
              )}

              {/* 5-COLUMN KANBAN BOARD */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start pb-8">
                {STAGE_COLUMNS.map((col) => {
                  const Icon = col.icon;
                  // Filter tasks into columns
                  const colTasks = filteredDivisionTasks.filter((t) => {
                    if (col.id === "REQUESTED") {
                      return (
                        t.status === "REQUESTED" ||
                        (t.status === "PENDING" && t.creator?.id && t.creator.id !== t.user?.id)
                      );
                    }
                    if (col.id === "PENDING") {
                      return (
                        t.status === "PENDING" &&
                        (!t.creator?.id || t.creator.id === t.user?.id)
                      );
                    }
                    if (col.id === "IN_PROGRESS") return t.status === "IN_PROGRESS";
                    if (col.id === "COMPLETED") return t.status === "COMPLETED";
                    if (col.id === "BLOCKED") return t.status === "BLOCKED";
                    return false;
                  });

                  return (
                    <div
                      key={col.id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, col.id)}
                      className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xs flex flex-col min-h-[500px] shadow-2xs overflow-hidden"
                    >
                      {/* Column Header */}
                      <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs font-bold text-slate-900">{col.title}</h3>
                              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full border ${col.badgeColor}`}>
                                {colTasks.length}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight">{col.description}</p>
                          </div>
                        </div>

                        {col.id === "PENDING" && (
                          <button
                            onClick={() => {
                              setTargetCardForNew(selectedDivision || undefined);
                              setCreateModalOpen(true);
                            }}
                            title="Tambah tugas"
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Column Task Cards */}
                      <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto max-h-[700px]">
                        {colTasks.length === 0 ? (
                          <div className="h-40 flex flex-col items-center justify-center text-center p-3 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                            <Icon className="h-6 w-6 text-slate-300 mb-1" />
                            <p className="text-[11px] font-medium text-slate-500">Kosong</p>
                            <p className="text-[9px] text-slate-400">Tarik tugas ke sini</p>
                          </div>
                        ) : (
                          colTasks.map((task) => {
                            const isRunning = Boolean(task.timerStartedAt);
                            const elapsed = activeTimers[task.id] || 0;
                            const isMyTask = task.user?.id === user?.id;
                            const isCreator = task.creator?.id === user?.id;

                            return (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                onClick={() => setSelectedTaskForDetail(task)}
                                className={`rounded-xl border bg-white p-3 shadow-2xs transition-all duration-150 space-y-2 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 ${
                                  task.priority === "URGENT"
                                    ? "border-red-200"
                                    : task.reviewStatus === "TO_BE_REVIEWED"
                                    ? "border-amber-300 bg-amber-50/20"
                                    : "border-slate-200"
                                }`}
                              >
                                {/* Top Badge Row */}
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {task.brandName && (
                                      <span className="rounded-md bg-red-50 text-red-700 border border-red-200 font-bold text-[9px] px-1.5 py-0.2 flex items-center gap-1">
                                        <Tag className="h-2.5 w-2.5" />
                                        {task.brandName}
                                      </span>
                                    )}
                                    <span className={`rounded-md border font-bold text-[9px] px-1.5 py-0.2 ${getPriorityBadge(task.priority)}`}>
                                      {task.priority}
                                    </span>
                                  </div>

                                  {/* Follow Up Button */}
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <FollowUpButton
                                      taskId={task.id}
                                      taskTitle={task.title}
                                      initialFollowUps={task.followUps}
                                      onFollowUpSuccess={fetchTasks}
                                    />
                                  </div>
                                </div>

                                {/* Title & Snippet */}
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 hover:text-red-600 transition">
                                    {task.title}
                                  </h4>
                                  {task.description && (
                                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                      {task.description.replace(/<[^>]*>?/gm, "").trim()}
                                    </p>
                                  )}
                                </div>

                                {/* People Info: Creator & Assignee */}
                                <div className="rounded-lg bg-slate-50 p-2 text-[10px] text-slate-600 border border-slate-100 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-medium">Penerima:</span>
                                    <span className="font-bold text-slate-900 truncate max-w-[130px]">
                                      {isMyTask ? (
                                        <span className="text-blue-700 font-black">Saya Sendiri</span>
                                      ) : (
                                        task.user?.name || "Belum ada"
                                      )}
                                    </span>
                                  </div>
                                  {task.creator?.id && task.creator.id !== task.user?.id && (
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                      <span className="text-slate-500 font-medium">Pemberi:</span>
                                      <span className="font-bold text-purple-700 truncate max-w-[130px]">
                                        {isCreator ? "Saya" : task.creator.name}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Review Gate Alert Banners */}
                                {(task.reviewStatus === "TO_BE_REVIEWED" || task.reviewStatus === "UNDER_REVIEW") && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between font-black">
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-amber-600" />
                                        {task.reviewStatus === "UNDER_REVIEW" ? "👀 SEDANG DI-REVIEW" : "⏳ MENUNGGU REVIEW"}
                                      </span>
                                      {isCreator && (
                                        <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                                          Pemberi Tugas
                                        </span>
                                      )}
                                    </div>

                                    {!isCreator && (
                                      <p className="text-[9px] text-amber-700">
                                        {task.reviewStatus === "UNDER_REVIEW"
                                          ? `Sedang di-review oleh ${task.creator?.name || "pemberi tugas"}.`
                                          : `Menunggu review dari ${task.creator?.name || "pemberi tugas"}.`}
                                      </p>
                                    )}

                                    {/* Action buttons for creator / manager */}
                                    {(isCreator || user?.role === "ADMIN" || user?.role === "MANAGER") ? (
                                      <div className="flex items-center gap-1.5 pt-1 border-t border-amber-200/70">
                                        {task.reviewStatus === "TO_BE_REVIEWED" && (
                                          <button
                                            onClick={() => handleStartReview(task.id)}
                                            className="flex-1 py-1 rounded-lg bg-white border border-amber-400 text-amber-800 text-[9px] font-bold hover:bg-amber-100 transition text-center cursor-pointer"
                                          >
                                            Review
                                          </button>
                                        )}
                                        <button
                                          onClick={() => setRevisionModalTask(task)}
                                          className="flex-1 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 text-[9px] font-bold hover:bg-rose-50 transition text-center cursor-pointer"
                                        >
                                          Revisi
                                        </button>
                                        <button
                                          onClick={() => handleApproveTask(task.id)}
                                          className="flex-1 py-1 rounded-lg bg-emerald-600 text-white text-[9px] font-black hover:bg-emerald-700 transition text-center cursor-pointer shadow-2xs"
                                        >
                                          ACC / Done !
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                )}

                                {task.reviewStatus === "REVISION_REQUESTED" && (
                                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[10px] space-y-1.5">
                                    <div className="flex items-center justify-between font-black">
                                      <span className="flex items-center gap-1">
                                        ⚠️ PERLU REVISI
                                      </span>
                                      <span className="text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-bold">
                                        Catatan Tersedia
                                      </span>
                                    </div>
                                    {isMyTask && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeliverableModalTask(task);
                                        }}
                                        className="w-full mt-1 py-1 rounded-lg bg-rose-600 text-white text-[9px] font-black hover:bg-rose-700 transition text-center cursor-pointer shadow-2xs"
                                      >
                                        Submit Revisi & Bukti Baru
                                      </button>
                                    )}
                                  </div>
                                )}

                                {task.deliverableUrl && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="rounded-lg bg-emerald-50 border border-emerald-200 p-1.5 text-[10px] flex items-center justify-between"
                                  >
                                    <span className="text-emerald-800 font-bold flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Hasil Kerja
                                    </span>
                                    <a
                                      href={task.deliverableUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-700 font-black hover:underline flex items-center gap-1 text-[10px]"
                                    >
                                      Buka Link <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  </div>
                                )}

                                {/* Card Footer: Timer & Status Selector */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                                  {/* Live Timer if applicable */}
                                  <div className="flex items-center gap-1">
                                    {isMyTask && task.status !== "COMPLETED" ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleTimer(task);
                                        }}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                          isRunning
                                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200 animate-pulse"
                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                      >
                                        {isRunning ? (
                                          <>
                                            <PauseCircle className="h-3 w-3 text-amber-700" />
                                            <span>{formatTimerSeconds(elapsed)}</span>
                                          </>
                                        ) : (
                                          <>
                                            <PlayCircle className="h-3 w-3 text-slate-600" />
                                            <span>Mulai</span>
                                          </>
                                        )}
                                      </button>
                                    ) : elapsed > 0 ? (
                                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                        <Timer className="h-3 w-3" />
                                        {formatTimerSeconds(elapsed)}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-slate-400 font-mono">
                                        {formatDateTime(task.expectedDeadline)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Quick Status Dropdown */}
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <select
                                      value={task.status}
                                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                      className="rounded border border-slate-200 px-1 py-0.5 text-[9px] font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer outline-none"
                                    >
                                      <option value="REQUESTED">📥 Requested</option>
                                      <option value="PENDING">🕒 Belum</option>
                                      <option value="IN_PROGRESS">▶️ Berjalan</option>
                                      <option value="COMPLETED">✅ Selesai</option>
                                      <option value="BLOCKED">🛑 Terkendala</option>
                                    </select>
                                  </div>
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
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialDepartment={targetCardForNew}
        initialIsContentProduction={false}
        onSuccess={fetchTasks}
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

      {deliverableModalTask && (
        <SubmitDeliverableModal
          isOpen={Boolean(deliverableModalTask)}
          onClose={() => setDeliverableModalTask(null)}
          taskId={deliverableModalTask.id}
          taskTitle={deliverableModalTask.title}
          onSuccess={fetchTasks}
        />
      )}
    </div>
  );
}
