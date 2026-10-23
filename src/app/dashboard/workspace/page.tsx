"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CreateTaskModal from "@/components/Tasks/CreateTaskModal";
import TaskDetailModal, { WORKBOARD_STAGES, getTaskStageKey } from "@/components/Tasks/TaskDetailModal";
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
  Eye,
  StickyNote,
  Check,
  Play,
  X,
  LayoutGrid,
  Kanban,
  List,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Maximize2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserCheck,
  FolderKanban,
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
  revisionNote?: string | null;
  revisionCount?: number | null;
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
  assignees?: {
    id: string;
    role?: string;
    user: {
      id: string;
      name: string;
      department?: string | null;
      avatarUrl?: string | null;
    };
  }[];
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

const DIVISION_STAGE_COLUMNS = [
  {
    id: "REQUESTED",
    title: "User Requested",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Inbox,
    description: "Request divisi kolaborasi & antrean",
  },
  {
    id: "IN_PROGRESS",
    title: "Sedang Berjalan",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    icon: PlayCircle,
    description: "Dalam pengerjaan aktif anggota divisi",
  },
  {
    id: "UNDER_REVIEW",
    title: "Review & Revisi",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
    description: "Menunggu ACC atau dalam perbaikan",
  },
  {
    id: "COMPLETED",
    title: "Selesai",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
    description: "Tugas tuntas & hasil kerja disetujui",
  },
];

const PERSONAL_MY_TASKS_STAGES = [
  {
    id: "REQUESTED",
    title: "1. User Requested",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Inbox,
    description: "Request masuk dari divisi lain & antrean",
  },
  {
    id: "IN_PROGRESS",
    title: "2. Dikerjakan",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    icon: PlayCircle,
    description: "Sedang Anda kerjakan secara aktif",
  },
  {
    id: "UNDER_REVIEW",
    title: "3. Sedang Di-review / Revisi",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
    description: "Menunggu ACC atau perlu perbaikan",
  },
  {
    id: "COMPLETED",
    title: "4. Selesai (Done !)",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
    description: "Hasil kerja telah disetujui",
  },
];

const PERSONAL_DELEGATED_STAGES = [
  {
    id: "PENDING",
    title: "1. Menunggu Dikerjakan PIC",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Clock,
    description: "PIC belum memulai pengerjaan",
  },
  {
    id: "IN_PROGRESS",
    title: "2. Sedang Dikerjakan PIC",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    icon: PlayCircle,
    description: "PIC sedang aktif mengerjakan",
  },
  {
    id: "TO_BE_REVIEWED",
    title: "3. 🚨 Perlu Review Anda",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Flame,
    description: "Deliverable siap: Minta Revisi atau ACC!",
  },
  {
    id: "COMPLETED",
    title: "4. Selesai (Sudah di-ACC)",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
    description: "Tugas delegasi tuntas & disetujui",
  },
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

const isCardRelevantForEmployee = (cardKey: string, user: any, allTasks: TaskItem[]) => {
  if (!user) return false;
  if (isHomeCard(cardKey, user.department)) return true;
  return allTasks.some(
    (t) =>
      (t.departmentCard || "").toUpperCase() === cardKey.toUpperCase() &&
      (t.user?.id === user.id ||
        t.creator?.id === user.id ||
        t.assignees?.some((a) => a.user?.id === user.id))
  );
};

const getCleanDescriptionSnippet = (desc?: string | null) => {
  if (!desc) return "";
  let text = desc.replace(/<img[^>]*>/gi, "");
  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return text;
};

type SortField = "TITLE" | "PRIORITY" | "STAGE" | "DEADLINE" | "CREATED_AT" | "ASSIGNEE" | "CREATOR" | "BRAND" | "ACTION";
type SortDirection = "ASC" | "DESC";

function WorkspaceCardsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Top-level board mode: "DIVISION" (BigBoard Divisi) vs "PERSONAL" (BigBoard Pribadi)
  const [boardMode, setBoardMode] = useState<"DIVISION" | "PERSONAL">("DIVISION");
  // Subtab under Personal BigBoard: "MY_TASKS" | "DELEGATED"
  const [personalTab, setPersonalTab] = useState<"MY_TASKS" | "DELEGATED">("MY_TASKS");

  // Division stage view: null for Division Overview, or division key (e.g. "WEB") for Stage View
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedMember, setSelectedMember] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [whiteboardStageFilter, setWhiteboardStageFilter] = useState<string>("ALL");
  const [viewScope, setViewScope] = useState<"ALL" | "MINE" | "DELEGATED" | "RELEVANT">("ALL");
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  // Multi-View Customizer: "CARD" | "KANBAN" | "LIST"
  const [currentViewMode, setCurrentViewMode] = useState<"CARD" | "KANBAN" | "LIST">("CARD");
  const [visibleStages, setVisibleStages] = useState<string[]>([
    "NOT_STARTED",
    "ON_PROGRESS",
    "SUBMIT_TO_REVIEW",
    "REVISION",
    "DONE",
  ]);
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});
  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false);
  const [sortField, setSortField] = useState<SortField>("DEADLINE");
  const [sortDirection, setSortDirection] = useState<SortDirection>("ASC");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("difworkboard_view_mode");
      if (saved === "CARD" || saved === "KANBAN" || saved === "LIST") {
        setCurrentViewMode(saved);
      }
    } catch {}
  }, []);

  const handleSetViewMode = (mode: "CARD" | "KANBAN" | "LIST") => {
    setCurrentViewMode(mode);
    try {
      localStorage.setItem("difworkboard_view_mode", mode);
    } catch {}
  };

  const toggleCollapseStage = (stageKey: string) => {
    setCollapsedStages((prev) => ({
      ...prev,
      [stageKey]: !prev[stageKey],
    }));
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "MANAGER";
  const isSosmedUser = isHomeCard("SOSMED", user?.department) || isAdmin;

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
      setViewScope("ALL");
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
    if (typeof document !== "undefined") {
      document.title = "DifWorkBoard - BigBoard 6 Divisi & Kolaborasi";
    }

  }, []);

  // Sync state reactively with searchParams from URL
  useEffect(() => {
    if (!searchParams) return;
    const viewParam = searchParams.get("view");
    const cardParam = searchParams.get("card");
    const tabParam = searchParams.get("tab");

    if (viewParam === "personal") {
      setBoardMode("PERSONAL");
      setSelectedDivision(null);
      if (tabParam === "delegated") {
        setPersonalTab("DELEGATED");
      } else {
        setPersonalTab("MY_TASKS");
      }
    } else if (cardParam) {
      const found = CARDS_DEFINITION.find((c) => c.key.toLowerCase() === cardParam.toLowerCase());
      if (found) {
        setBoardMode("DIVISION");
        setSelectedDivision(found.key);
      } else {
        setBoardMode("DIVISION");
        setSelectedDivision(null);
      }
    } else {
      setBoardMode("DIVISION");
      setSelectedDivision(null);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTasks();
  }, [selectedBrand, searchQuery]);

  // Navigate to division stage view
  const openDivisionStage = (divisionKey: string) => {
    setSelectedMember("ALL");
    router.push(`/dashboard/workspace?card=${divisionKey}`);
  };

  // Back to thumbnail overview
  const backToOverview = () => {
    setSelectedMember("ALL");
    router.push(`/dashboard/workspace`);
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
      const isSelfAssigned = !task.creator?.id || task.creator.id === user?.id;
      if (!isSelfAssigned && task.reviewStatus !== "APPROVED") {
        setDeliverableModalTask(task);
        return;
      }
      if (isSelfAssigned && !task.deliverableUrl) {
        setDeliverableModalTask(task);
        return;
      }
    }

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

    if (targetColId === "REQUESTED") {
      await handleStatusChange(taskId, "PENDING");
    } else if (targetColId === "UNDER_REVIEW" || targetColId === "TO_BE_REVIEWED") {
      // If moving to review, open deliverable modal if not submitted
      const task = tasks.find((t) => t.id === taskId);
      if (task && !task.deliverableUrl) {
        setDeliverableModalTask(task);
      } else {
        await handleStatusChange(taskId, "IN_PROGRESS");
      }
    } else {
      await handleStatusChange(taskId, targetColId);
    }
  };

  const handleDropToStage = async (e: React.DragEvent, targetStageKey: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (targetStageKey === "NOT_STARTED") {
      await handleStatusChange(taskId, "PENDING");
    } else if (targetStageKey === "ON_PROGRESS") {
      await handleStartTask(taskId);
    } else if (targetStageKey === "SUBMIT_TO_REVIEW") {
      setDeliverableModalTask(task);
    } else if (targetStageKey === "REVISION") {
      const isCreatorOrMgr = task.creator?.id === user?.id || user?.role === "ADMIN" || user?.role === "MANAGER";
      if (isCreatorOrMgr) {
        setRevisionModalTask(task);
      } else {
        alert("Hanya pemberi tugas yang dapat meminta revisi.");
      }
    } else if (targetStageKey === "DONE") {
      const isCreatorOrMgr = task.creator?.id === user?.id || user?.role === "ADMIN" || user?.role === "MANAGER";
      if (isCreatorOrMgr) {
        await handleApproveTask(taskId);
      } else {
        alert("Pekerjaan harus di-ACC oleh pemberi tugas untuk berpindah ke status Selesai.");
      }
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await fetch(`/api/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to start task:", err);
    }
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
      if (t.assignees) {
        t.assignees.forEach((a) => {
          if (a.user?.id && a.user?.name) {
            map.set(a.user.id, a.user.name);
          }
        });
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [divisionTasks]);

  // Filtered division tasks based on member, brand, search, viewScope
  const filteredDivisionTasks = useMemo(() => {
    return divisionTasks.filter((t) => {
      const isAssignedToUser =
        t.user?.id === user?.id || t.assignees?.some((a) => a.user?.id === user?.id);
      const isCreator = t.creator?.id === user?.id;

      if (selectedMember !== "ALL") {
        const matchesMember =
          t.user?.id === selectedMember ||
          t.assignees?.some((a) => a.user?.id === selectedMember);
        if (!matchesMember) return false;
      }
      if (viewScope === "MINE" && !isAssignedToUser) {
        return false;
      }
      if (viewScope === "DELEGATED" && (!isCreator || isAssignedToUser)) {
        return false;
      }
      if (viewScope === "RELEVANT") {
        const isInvolved = isAssignedToUser || isCreator;
        if (!isInvolved) return false;
      }
      return true;
    });
  }, [divisionTasks, selectedMember, viewScope, user]);

  // Personal Tasks: Assigned to user (either primary PIC or in assignees)
  const myAssignedTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter((t) => {
      const isDirect = t.user?.id === user.id;
      const isCoAssignee = t.assignees?.some((a) => a.user?.id === user.id);
      return isDirect || isCoAssignee;
    });
  }, [tasks, user]);

  // Delegated Tasks: Created by user where user is NOT the sole assignee
  const myDelegatedTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter((t) => {
      const isCreator = t.creator?.id === user.id;
      const isSelfOnly =
        t.user?.id === user.id &&
        (!t.assignees || t.assignees.length === 0 || t.assignees.every((a) => a.user?.id === user.id));
      return isCreator && !isSelfOnly;
    });
  }, [tasks, user]);

  const pendingReviewForMeCount = useMemo(() => {
    return myDelegatedTasks.filter(
      (t) => t.reviewStatus === "TO_BE_REVIEWED" || t.reviewStatus === "UNDER_REVIEW"
    ).length;
  }, [myDelegatedTasks]);

  // Relevant division keys for this user (home division + divisions with user's tasks)
  const relevantDivisionKeys = useMemo(() => {
    if (!user) return [];
    return CARDS_DEFINITION
      .filter((c) => isCardRelevantForEmployee(c.key, user, tasks))
      .map((c) => c.key);
  }, [user, tasks]);

  // Helper to render individual task cards with multi-assignee avatars and Corong indicators
  const renderCard = (task: TaskItem, isPersonalBoard: boolean = false, isDelegatedView: boolean = false) => {
    const isRunning = Boolean(task.timerStartedAt);
    const elapsed = activeTimers[task.id] || 0;
    const isMyTask = task.user?.id === user?.id || task.assignees?.some((a) => a.user?.id === user?.id);
    const isCreator = task.creator?.id === user?.id;

    // Check if requested from another user / external division
    const isExternalDivisionRequest = Boolean(
      task.creator?.id &&
      task.creator.id !== user?.id &&
      task.departmentCard &&
      !isHomeCard(task.departmentCard, user?.department)
    );

    const isUserRequested = Boolean(
      task.creator?.id &&
      task.creator.id !== user?.id &&
      !isDelegatedView
    );

    // Check if created from another department (Corong Cross-Department)
    const isCrossDepartment =
      task.creator?.id &&
      task.creator.id !== task.user?.id &&
      task.departmentCard;

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onClick={() => setSelectedTaskForDetail(task)}
        className={`rounded-2xl border bg-white p-3.5 shadow-2xs transition-all duration-150 space-y-2.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 ${
          task.priority === "URGENT"
            ? "border-red-200 ring-1 ring-red-100"
            : task.reviewStatus === "TO_BE_REVIEWED"
            ? "border-amber-300 bg-amber-50/20"
            : task.reviewStatus === "REVISION_REQUESTED"
            ? "border-rose-300 bg-rose-50/20"
            : "border-slate-200"
        }`}
      >
        {/* Top Badge Row */}
        <div className="flex items-center justify-between gap-1.5 whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            {/* User Requested Badge */}
            {isUserRequested && (
              <span className="rounded-full bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 shadow-2xs flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Inbox className="h-2.5 w-2.5" />
                User Requested
              </span>
            )}

            {/* Priority: only if URGENT or HIGH */}
            {task.priority === "URGENT" && (
              <span className="rounded-full bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 flex items-center gap-0.5 shadow-2xs shrink-0 whitespace-nowrap">
                <Flame className="h-2.5 w-2.5" />
                Urgent
              </span>
            )}
            {task.priority === "HIGH" && (
              <span className="rounded-full bg-orange-100 text-orange-800 text-[9px] font-bold px-1.5 py-0.5 border border-orange-200 shrink-0 whitespace-nowrap">
                Tinggi
              </span>
            )}

            {/* Division Badge */}
            {task.departmentCard && (
              <span
                className={`rounded-md font-bold text-[9px] px-1.5 py-0.5 border shrink-0 whitespace-nowrap ${
                  isExternalDivisionRequest
                    ? "bg-purple-100 text-purple-800 border-purple-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {task.departmentCard}
              </span>
            )}

            {/* Brand: only if real client brand */}
            {task.brandName &&
              task.brandName !== "Difitech HRIS" &&
              task.brandName !== "Internal Difitech" && (
                <span className="text-[9px] font-semibold text-slate-500 truncate max-w-[80px]">
                  {task.brandName}
                </span>
            )}
          </div>

          {/* Follow Up Button */}
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
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
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {task.description.replace(/<[^>]*>?/gm, "").trim()}
            </p>
          )}
        </div>

        {/* People Info: Multi-Assignee Stack & Creator Corong */}
        <div className="rounded-xl bg-slate-50 p-2.5 text-[10px] text-slate-600 border border-slate-200/70 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Tim Pelaksana:</span>
            <div className="flex items-center gap-1.5">
              {/* Overlapping avatars */}
              <div className="flex -space-x-1.5 overflow-hidden">
                {task.assignees && task.assignees.length > 0 ? (
                  task.assignees.map((asgn) => {
                    const u = asgn.user || task.user;
                    return (
                      <span
                        key={asgn.id || u?.id}
                        title={u?.name}
                        className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-slate-200 text-[9px] font-bold text-slate-700 flex items-center justify-center overflow-hidden shrink-0"
                      >
                        {u?.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} className="h-full w-full object-cover" />
                        ) : (
                          (u?.name || "?").charAt(0).toUpperCase()
                        )}
                      </span>
                    );
                  })
                ) : (
                  <span className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-slate-200 text-[9px] font-bold text-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {(task.user?.name || "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="font-bold text-slate-900 truncate max-w-[110px]">
                {task.assignees && task.assignees.length > 1
                  ? `${task.assignees.length} Orang`
                  : isMyTask
                  ? "Saya Sendiri"
                  : task.user?.name || "Belum ada"}
              </span>
            </div>
          </div>

          {/* Corong Origin: Creator & Department */}
          {task.creator?.id && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">Pemberi:</span>
              <span className="font-bold text-purple-700 truncate max-w-[130px] flex items-center gap-1">
                <span>{isCreator ? "Saya" : task.creator.name}</span>
                {task.creator.department && (
                  <span className="text-[9px] font-normal text-slate-400">({task.creator.department})</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* In-Card 5-Stage Stepper (Teero Mini Style) */}
        {(() => {
          const stageKey = getTaskStageKey(task);
          const currentStage = WORKBOARD_STAGES.find((s) => s.key === stageKey) || WORKBOARD_STAGES[0];
          const isRevision = stageKey === "REVISION";

          return (
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Stage</span>
                <span
                  className={`font-black px-2 py-0.5 rounded-full text-[9px] border ${
                    stageKey === "DONE"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : isRevision
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : stageKey === "SUBMIT_TO_REVIEW"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : stageKey === "ON_PROGRESS"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {currentStage.step}. {currentStage.label}
                </span>
              </div>

              {/* 5-Step Mini Visual Indicator */}
              <div className="grid grid-cols-5 gap-1 items-center pt-0.5">
                {WORKBOARD_STAGES.map((s) => {
                  const isPassed =
                    s.key === "NOT_STARTED"
                      ? stageKey !== "NOT_STARTED"
                      : s.key === "ON_PROGRESS"
                      ? stageKey === "SUBMIT_TO_REVIEW" || stageKey === "REVISION" || stageKey === "DONE"
                      : s.key === "SUBMIT_TO_REVIEW"
                      ? stageKey === "REVISION" || stageKey === "DONE"
                      : s.key === "REVISION"
                      ? stageKey === "DONE" && (Boolean(task.revisionNote) || (task.revisionCount && task.revisionCount > 0))
                      : stageKey === "DONE";

                  const isCurrent = stageKey === s.key;
                  const isSkippedRev =
                    s.key === "REVISION" &&
                    stageKey === "DONE" &&
                    !task.revisionNote &&
                    (!task.revisionCount || task.revisionCount === 0);

                  return (
                    <div
                      key={s.key}
                      title={`${s.step}. ${s.label}`}
                      className={`h-1.5 rounded-full transition-all ${
                        isCurrent
                          ? isRevision
                            ? "bg-rose-500 ring-2 ring-rose-200"
                            : "bg-blue-600 ring-2 ring-blue-200"
                          : isPassed
                          ? "bg-emerald-500"
                          : isSkippedRev
                          ? "bg-slate-200/50"
                          : "bg-slate-200"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Quick Action Button for Not Started Stage */}
              {stageKey === "NOT_STARTED" && isMyTask && (
                <button
                  type="button"
                  onClick={() => handleStartTask(task.id)}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold shadow-2xs transition cursor-pointer"
                >
                  <Play className="h-3 w-3" />
                  <span>Next: Mulai Kerjakan &rarr;</span>
                </button>
              )}
            </div>
          );
        })()}

        {/* Live Timer Section for In-Progress Task */}
        {task.status === "IN_PROGRESS" && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between rounded-xl bg-blue-50/80 border border-blue-200 px-2.5 py-1.5 text-[10px] text-blue-900"
          >
            <div className="flex items-center gap-1.5 font-mono font-bold">
              <Timer className="h-3 w-3 text-blue-600" />
              <span>{formatTimerSeconds(elapsed)}</span>
              {isRunning && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
                </span>
              )}
            </div>

            {isMyTask && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleTimer(task)}
                  className="rounded-lg bg-blue-600 px-2 py-0.5 text-white font-bold hover:bg-blue-700 transition flex items-center gap-1 cursor-pointer"
                >
                  {isRunning ? <PauseCircle className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                  <span>{isRunning ? "Jeda" : "Mulai"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliverableModalTask(task)}
                  className="rounded-lg bg-emerald-600 px-2 py-0.5 text-white font-bold hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Submit</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Review Gate Alert Banners */}
        {(task.reviewStatus === "TO_BE_REVIEWED" || task.reviewStatus === "UNDER_REVIEW" || (Boolean(task.deliverableUrl) && task.status !== "COMPLETED")) && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[10px] space-y-2 shadow-2xs"
          >
            <div className="flex items-center justify-between font-black">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                {task.reviewStatus === "UNDER_REVIEW" ? "👀 SEDANG DI-REVIEW" : "⏳ MENUNGGU REVIEW"}
              </span>
              {isCreator && (
                <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                  Pemberi Tugas
                </span>
              )}
            </div>

            {task.deliverableUrl && (
              <a
                href={task.deliverableUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg bg-white border border-amber-300 px-2 py-1 text-amber-900 font-bold hover:bg-amber-100 transition"
              >
                <span className="truncate">Periksa Deliverable</span>
                <ExternalLink className="h-3 w-3 text-amber-700" />
              </a>
            )}

            {/* Action buttons for creator / manager */}
            {(isCreator || user?.role === "ADMIN" || user?.role === "MANAGER") && (
              <div className="flex items-center gap-1.5 pt-1 border-t border-amber-200/80">
                {task.reviewStatus !== "UNDER_REVIEW" && (
                  <button
                    onClick={() => handleStartReview(task.id)}
                    className="flex-1 py-1 rounded-lg bg-white border border-amber-400 text-amber-800 text-[9px] font-bold hover:bg-amber-100 transition text-center cursor-pointer shadow-2xs"
                  >
                    Mulai Review
                  </button>
                )}
                <button
                  onClick={() => setRevisionModalTask(task)}
                  className="flex-1 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 text-[9px] font-bold hover:bg-rose-50 transition text-center cursor-pointer shadow-2xs"
                >
                  Minta Revisi
                </button>
                <button
                  onClick={() => handleApproveTask(task.id)}
                  className="flex-1 py-1 rounded-lg bg-emerald-600 text-white text-[9px] font-black hover:bg-emerald-700 transition text-center cursor-pointer shadow-2xs"
                >
                  ACC / Done !
                </button>
              </div>
            )}
          </div>
        )}

        {/* Revision Requested Banner */}
        {task.reviewStatus === "REVISION_REQUESTED" && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-[10px] space-y-1.5"
          >
            <div className="flex items-center justify-between font-black">
              <span className="flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5 text-rose-600 animate-spin" />
                ⚠️ PERLU REVISI
              </span>
              <span className="text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-bold">
                Ada Catatan
              </span>
            </div>

            {task.revisionNote && (
              <p className="italic text-[10px] text-rose-800 line-clamp-2 bg-white/70 p-1.5 rounded-lg border border-rose-200">
                "{task.revisionNote.replace(/<[^>]*>?/gm, "").trim()}"
              </p>
            )}

            {isMyTask && (
              <button
                type="button"
                onClick={() => setDeliverableModalTask(task)}
                className="w-full py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition text-center cursor-pointer"
              >
                Submit Hasil Revisi
              </button>
            )}
          </div>
        )}

        {/* Completed Banner */}
        {task.status === "COMPLETED" && (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-[10px] text-emerald-800 font-bold">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Selesai & Di-ACC
            </span>
            {task.deliverableUrl && (
              <a
                href={task.deliverableUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-emerald-700 hover:underline flex items-center gap-0.5 text-[9px]"
              >
                <span>Hasil</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        )}

        {/* Footer date & deadline */}
        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
          <span>{formatDateTime(task.createdAt)}</span>
          {task.expectedDeadline && (
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Clock className="h-2.5 w-2.5 text-slate-400" />
              <span>Target: {formatDateTime(task.expectedDeadline)}</span>
            </span>
          )}
        </div>
      </div>
    );
  };

  // Personal Tasks filtered by search
  const personalDisplayTasks = useMemo(() => {
    const base = personalTab === "MY_TASKS" ? myAssignedTasks : myDelegatedTasks;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter((t) => {
      const titleMatch = (t.title || "").toLowerCase().includes(q);
      const descMatch = (t.description || "").toLowerCase().includes(q);
      const userMatch = (t.user?.name || "").toLowerCase().includes(q);
      const brandMatch = (t.brandName || "").toLowerCase().includes(q);
      const deptMatch = (t.departmentCard || "").toLowerCase().includes(q);
      return titleMatch || descMatch || userMatch || brandMatch || deptMatch;
    });
  }, [personalTab, myAssignedTasks, myDelegatedTasks, searchQuery]);

  const priorityWeight: Record<string, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const stageWeight: Record<string, number> = {
    NOT_STARTED: 1,
    ON_PROGRESS: 2,
    SUBMIT_TO_REVIEW: 3,
    REVISION: 4,
    DONE: 5,
  };

  const getTaskActionRank = (t: TaskItem): number => {
    const stage = getTaskStageKey(t);
    const isMine = t.user?.id === user?.id || t.assignees?.some((a) => a.user?.id === user?.id);
    const isCreatorOrMgr = t.creator?.id === user?.id || user?.role === "ADMIN" || user?.role === "MANAGER";

    if (stage === "ON_PROGRESS" && isMine) return 1; // Submit deliverable
    if (stage === "REVISION" && isMine) return 2; // Submit revision
    if (stage === "NOT_STARTED" && isMine) return 3; // Mulai
    if ((stage === "SUBMIT_TO_REVIEW" || t.reviewStatus === "UNDER_REVIEW") && isCreatorOrMgr) return 4; // ACC / Revisi
    if (stage === "SUBMIT_TO_REVIEW" || t.reviewStatus === "UNDER_REVIEW") return 5; // Menunggu ACC
    if (stage === "DONE") return 6; // Selesai
    return 7; // Detail
  };

  const sortTasks = (items: TaskItem[], field: SortField, direction: SortDirection): TaskItem[] => {
    return [...items].sort((a, b) => {
      // For standard sorts (Deadline, Priority, CreatedAt, Title, Brand, Assignee, Creator),
      // Active tasks ALWAYS come first, and Done/Completed tasks ALWAYS go to the bottom!
      if (field !== "STAGE" && field !== "ACTION") {
        const isDoneA = getTaskStageKey(a) === "DONE";
        const isDoneB = getTaskStageKey(b) === "DONE";
        if (isDoneA !== isDoneB) {
          return isDoneA ? 1 : -1;
        }
      }

      let diff = 0;
      if (field === "TITLE") {
        diff = (a.title || "").localeCompare(b.title || "", "id", { sensitivity: "base" });
      } else if (field === "PRIORITY") {
        const wA = priorityWeight[a.priority?.toUpperCase() || ""] || 0;
        const wB = priorityWeight[b.priority?.toUpperCase() || ""] || 0;
        diff = wA - wB;
      } else if (field === "STAGE") {
        const sA = stageWeight[getTaskStageKey(a)] || 0;
        const sB = stageWeight[getTaskStageKey(b)] || 0;
        diff = sA - sB;
      } else if (field === "ACTION") {
        const rA = getTaskActionRank(a);
        const rB = getTaskActionRank(b);
        diff = rA - rB;
      } else if (field === "DEADLINE") {
        const timeA = a.expectedDeadline ? new Date(a.expectedDeadline).getTime() : null;
        const timeB = b.expectedDeadline ? new Date(b.expectedDeadline).getTime() : null;
        if (timeA === null && timeB === null) {
          diff = 0;
        } else if (timeA === null) {
          return 1;
        } else if (timeB === null) {
          return -1;
        } else {
          diff = timeA - timeB;
        }
      } else if (field === "CREATED_AT") {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        diff = timeA - timeB;
      } else if (field === "ASSIGNEE") {
        const nameA = a.user?.name || "";
        const nameB = b.user?.name || "";
        diff = nameA.localeCompare(nameB, "id", { sensitivity: "base" });
      } else if (field === "CREATOR") {
        const nameA = a.creator?.name || "";
        const nameB = b.creator?.name || "";
        diff = nameA.localeCompare(nameB, "id", { sensitivity: "base" });
      } else if (field === "BRAND") {
        const strA = `${a.departmentCard || ""} ${a.brandName || ""}`.trim();
        const strB = `${b.departmentCard || ""} ${b.brandName || ""}`.trim();
        diff = strA.localeCompare(strB, "id", { sensitivity: "base" });
      }

      // If tie on primary sort field, apply secondary tie-breaker by action rank, deadline, and newest
      if (diff === 0) {
        const rA = getTaskActionRank(a);
        const rB = getTaskActionRank(b);
        const rDiff = rA - rB;
        if (rDiff !== 0) return rDiff;

        const timeA = a.expectedDeadline ? new Date(a.expectedDeadline).getTime() : null;
        const timeB = b.expectedDeadline ? new Date(b.expectedDeadline).getTime() : null;
        if (timeA !== null && timeB !== null && timeA !== timeB) {
          return timeA - timeB;
        }

        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      }

      return direction === "ASC" ? diff : -diff;
    });
  };

  const applyPriorityFilter = (items: TaskItem[]): TaskItem[] => {
    if (priorityFilter === "ALL") return items;
    if (priorityFilter === "URGENT") return items.filter((t) => t.priority === "URGENT");
    if (priorityFilter === "HIGH") return items.filter((t) => t.priority === "HIGH");
    if (priorityFilter === "NORMAL") {
      return items.filter(
        (t) => !t.priority || t.priority === "MEDIUM" || t.priority === "LOW" || t.priority === "NORMAL"
      );
    }
    return items;
  };

  const filterAndSortTasks = (rawTasks: TaskItem[]): TaskItem[] => {
    const filtered = applyPriorityFilter(rawTasks);
    return sortTasks(filtered, sortField, sortDirection);
  };

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortField(field);
      if (field === "PRIORITY" || field === "CREATED_AT") {
        setSortDirection("DESC");
      } else {
        setSortDirection("ASC");
      }
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === "ASC" ? (
        <ArrowUp className="h-3 w-3 text-blue-600 inline ml-1 shrink-0" />
      ) : (
        <ArrowDown className="h-3 w-3 text-blue-600 inline ml-1 shrink-0" />
      );
    }
    return <ArrowUpDown className="h-3 w-3 text-slate-300 group-hover:text-slate-500 inline ml-1 shrink-0" />;
  };

  const getCurrentSortValue = (): string => {
    if (sortField === "DEADLINE" && sortDirection === "ASC") return "DEADLINE_ASC";
    if (sortField === "DEADLINE" && sortDirection === "DESC") return "DEADLINE_DESC";
    if (sortField === "ACTION" && sortDirection === "ASC") return "ACTION_ASC";
    if (sortField === "ACTION" && sortDirection === "DESC") return "ACTION_DESC";
    if (sortField === "PRIORITY" && sortDirection === "DESC") return "PRIORITY_DESC";
    if (sortField === "PRIORITY" && sortDirection === "ASC") return "PRIORITY_ASC";
    if (sortField === "CREATED_AT" && sortDirection === "DESC") return "CREATED_AT_DESC";
    if (sortField === "CREATED_AT" && sortDirection === "ASC") return "CREATED_AT_ASC";
    if (sortField === "TITLE" && sortDirection === "ASC") return "TITLE_ASC";
    if (sortField === "TITLE" && sortDirection === "DESC") return "TITLE_DESC";
    if (sortField === "STAGE" && sortDirection === "ASC") return "STAGE_ASC";
    return "CUSTOM";
  };

  const handleSortSelectChange = (value: string) => {
    if (value === "DEADLINE_ASC") {
      setSortField("DEADLINE");
      setSortDirection("ASC");
    } else if (value === "DEADLINE_DESC") {
      setSortField("DEADLINE");
      setSortDirection("DESC");
    } else if (value === "ACTION_ASC") {
      setSortField("ACTION");
      setSortDirection("ASC");
    } else if (value === "ACTION_DESC") {
      setSortField("ACTION");
      setSortDirection("DESC");
    } else if (value === "PRIORITY_DESC") {
      setSortField("PRIORITY");
      setSortDirection("DESC");
    } else if (value === "PRIORITY_ASC") {
      setSortField("PRIORITY");
      setSortDirection("ASC");
    } else if (value === "CREATED_AT_DESC") {
      setSortField("CREATED_AT");
      setSortDirection("DESC");
    } else if (value === "CREATED_AT_ASC") {
      setSortField("CREATED_AT");
      setSortDirection("ASC");
    } else if (value === "TITLE_ASC") {
      setSortField("TITLE");
      setSortDirection("ASC");
    } else if (value === "TITLE_DESC") {
      setSortField("TITLE");
      setSortDirection("DESC");
    } else if (value === "STAGE_ASC") {
      setSortField("STAGE");
      setSortDirection("ASC");
    }
  };

  const renderViewModeSwitcher = () => (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={() => handleSetViewMode("CARD")}
        title="Tampilan Papan Tulis (Card Grid)"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
          currentViewMode === "CARD"
            ? "bg-white text-slate-900 shadow-2xs"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Card</span>
      </button>

      <button
        type="button"
        onClick={() => handleSetViewMode("KANBAN")}
        title="Tampilan Kanban Columns (Stage Pipeline)"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
          currentViewMode === "KANBAN"
            ? "bg-white text-slate-900 shadow-2xs"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <Kanban className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Kanban</span>
      </button>

      <button
        type="button"
        onClick={() => handleSetViewMode("LIST")}
        title="Tampilan Daftar / Tabel Kompak"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
          currentViewMode === "LIST"
            ? "bg-white text-slate-900 shadow-2xs"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <List className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  );

  const renderStageCustomizer = () => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowCustomizeMenu(!showCustomizeMenu)}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
          showCustomizeMenu || visibleStages.length < WORKBOARD_STAGES.length
            ? "bg-blue-50 border-blue-300 text-blue-700"
            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>Stage</span>
        {visibleStages.length < WORKBOARD_STAGES.length && (
          <span className="rounded-full bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2">
            {visibleStages.length}/5
          </span>
        )}
      </button>

      {showCustomizeMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-3.5 z-40 space-y-3 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900">Kustomisasi Stage</span>
            <button
              type="button"
              onClick={() => setShowCustomizeMenu(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Preset Cepat:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setVisibleStages(WORKBOARD_STAGES.map((s) => s.key))}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Semua (5)
              </button>
              <button
                type="button"
                onClick={() =>
                  setVisibleStages(["NOT_STARTED", "ON_PROGRESS", "SUBMIT_TO_REVIEW", "REVISION"])
                }
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
              >
                Fokus Aktif
              </button>
              <button
                type="button"
                onClick={() => setVisibleStages(["SUBMIT_TO_REVIEW", "REVISION"])}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer"
              >
                Perlu Tindakan
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pilih Tahap Ditampilkan:
            </span>
            {WORKBOARD_STAGES.map((s) => {
              const isChecked = visibleStages.includes(s.key);
              return (
                <label
                  key={s.key}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setVisibleStages([...visibleStages, s.key]);
                        } else {
                          if (visibleStages.length > 1) {
                            setVisibleStages(visibleStages.filter((k) => k !== s.key));
                          }
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span
                      className={`font-bold ${
                        isChecked ? "text-slate-800" : "text-slate-400 line-through"
                      }`}
                    >
                      {s.step}. {s.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderPriorityAndSortControls = () => (
    <>
      <select
        value={priorityFilter}
        onChange={(e) => setPriorityFilter(e.target.value)}
        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-bold focus:border-red-500 focus:bg-white focus:outline-none transition cursor-pointer shrink-0"
      >
        <option value="ALL">Semua Prioritas</option>
        <option value="URGENT">🔥 Urgent</option>
        <option value="HIGH">⚡ Tinggi</option>
        <option value="NORMAL">Normal / Rendah</option>
      </select>

      <select
        value={getCurrentSortValue()}
        onChange={(e) => handleSortSelectChange(e.target.value)}
        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-bold focus:border-red-500 focus:bg-white focus:outline-none transition cursor-pointer shrink-0"
      >
        <option value="DEADLINE_ASC">📅 Deadline Terdekat</option>
        <option value="DEADLINE_DESC">📅 Deadline Terjauh</option>
        <option value="ACTION_ASC">⚡ Tombol Aksi / Butuh Tindakan</option>
        <option value="PRIORITY_DESC">🔥 Prioritas Tertinggi</option>
        <option value="PRIORITY_ASC">Prioritas Terendah</option>
        <option value="CREATED_AT_DESC">🕐 Terbaru Dibuat</option>
        <option value="CREATED_AT_ASC">🕐 Terlama Dibuat</option>
        <option value="TITLE_ASC">🔤 Judul (A-Z)</option>
        <option value="TITLE_DESC">🔤 Judul (Z-A)</option>
        <option value="STAGE_ASC">Stage (1 ➔ 5)</option>
        {getCurrentSortValue() === "CUSTOM" && (
          <option value="CUSTOM" disabled>
            Kustom ({sortField} {sortDirection})
          </option>
        )}
      </select>
    </>
  );

  const renderMultiViewContainer = ({
    tasks: inputTasks,
    isPersonalBoard = false,
    isDelegatedView = false,
    emptyContextText = "di papan ini",
    defaultCardKey,
  }: {
    tasks: TaskItem[];
    isPersonalBoard?: boolean;
    isDelegatedView?: boolean;
    emptyContextText?: string;
    defaultCardKey?: string;
  }) => {
    const processedTasks = filterAndSortTasks(inputTasks);
    const tasksInVisibleStages = processedTasks.filter((t) =>
      visibleStages.includes(getTaskStageKey(t))
    );

    const countNotStarted = processedTasks.filter(
      (t) => getTaskStageKey(t) === "NOT_STARTED"
    ).length;
    const countOnProgress = processedTasks.filter(
      (t) => getTaskStageKey(t) === "ON_PROGRESS"
    ).length;
    const countReview = processedTasks.filter(
      (t) => getTaskStageKey(t) === "SUBMIT_TO_REVIEW"
    ).length;
    const countRevision = processedTasks.filter(
      (t) => getTaskStageKey(t) === "REVISION"
    ).length;
    const countDone = processedTasks.filter(
      (t) => getTaskStageKey(t) === "DONE"
    ).length;

    const displayTasks =
      whiteboardStageFilter === "ALL"
        ? tasksInVisibleStages
        : tasksInVisibleStages.filter(
            (t) => getTaskStageKey(t) === whiteboardStageFilter
          );

    const stageFilterTabs = [
      { id: "ALL", label: "Semua", count: tasksInVisibleStages.length, badgeStyle: "bg-slate-100 text-slate-700" },
      { id: "NOT_STARTED", label: "1. Not Started", count: countNotStarted, badgeStyle: "bg-slate-100 text-slate-700" },
      { id: "ON_PROGRESS", label: "2. On Progress", count: countOnProgress, badgeStyle: "bg-blue-100 text-blue-800" },
      { id: "SUBMIT_TO_REVIEW", label: "3. Review", count: countReview, badgeStyle: "bg-amber-100 text-amber-800" },
      { id: "REVISION", label: "4. Revisi", count: countRevision, badgeStyle: "bg-rose-100 text-rose-800" },
      { id: "DONE", label: "5. Done", count: countDone, badgeStyle: "bg-emerald-100 text-emerald-800" },
    ].filter((tab) => tab.id === "ALL" || visibleStages.includes(tab.id));

    return (
      <div className="space-y-4">
        {/* VIEW 1: CARD VIEW (WHITEBOARD STICKY NOTES GRID) */}
        {currentViewMode === "CARD" && (
          <div className="rounded-3xl border border-slate-200/90 bg-white/70 backdrop-blur-xs p-5 shadow-xs space-y-4 min-h-[580px]">
            <div className="flex items-center justify-between gap-3 flex-wrap pb-3.5 border-b border-slate-200/80">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                  Filter Stage:
                </span>
                {stageFilterTabs.map((filter) => {
                  const isActive = whiteboardStageFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setWhiteboardStageFilter(filter.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        isActive
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span>{filter.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          isActive ? "bg-white/20 text-white" : filter.badgeStyle
                        }`}
                      >
                        {filter.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Menampilkan <span className="font-bold text-slate-700">{displayTasks.length}</span> kartu kerja
              </div>
            </div>

            {displayTasks.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 border border-dashed border-slate-200 rounded-3xl">
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs mb-2">
                  <StickyNote className="h-6 w-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Papan Tulis Kosong</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Belum ada kartu kerja {emptyContextText}
                  {whiteboardStageFilter !== "ALL" ? " untuk filter stage ini." : "."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTargetCardForNew(defaultCardKey);
                    setCreateModalOpen(true);
                  }}
                  className="mt-4 flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Kartu Kerja Baru</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5 items-start">
                {displayTasks.map((t) => renderCard(t, isPersonalBoard, isDelegatedView))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: KANBAN VIEW (STAGE COLUMNS ALA TRELLO) */}
        {currentViewMode === "KANBAN" && (
          <div className="rounded-3xl border border-slate-200/90 bg-slate-100/60 p-4 shadow-xs overflow-x-auto min-h-[620px]">
            <div className="flex items-start gap-4 min-w-[1000px] pb-2">
              {WORKBOARD_STAGES.filter((s) => visibleStages.includes(s.key)).map((stage) => {
                const isCollapsed = Boolean(collapsedStages[stage.key]);
                const colTasks = processedTasks.filter(
                  (t) => getTaskStageKey(t) === stage.key
                );
                const isRevision = stage.key === "REVISION";

                if (isCollapsed) {
                  return (
                    <div
                      key={stage.key}
                      onClick={() => toggleCollapseStage(stage.key)}
                      title={`Klik untuk membuka kolom ${stage.label}`}
                      className="w-12 h-[580px] rounded-2xl border border-slate-200 bg-white/90 shadow-2xs hover:bg-blue-50/40 hover:border-blue-300 transition-all flex flex-col items-center justify-between py-4 px-1 cursor-pointer select-none group shrink-0"
                    >
                      <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-700 transition">
                        <ChevronRight className="h-4 w-4" />
                      </div>

                      <div className="[writing-mode:vertical-rl] rotate-180 flex items-center gap-2 text-xs font-black text-slate-700 tracking-wider">
                        <span>
                          {stage.step}. {stage.label}
                        </span>
                      </div>

                      <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center border border-slate-200">
                        {colTasks.length}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={stage.key}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropToStage(e, stage.key)}
                    className={`flex-1 min-w-[280px] max-w-[340px] rounded-3xl border shadow-2xs flex flex-col min-h-[580px] max-h-[820px] overflow-hidden transition-all ${
                      stage.key === "DONE"
                        ? "bg-emerald-50/30 border-emerald-200/70"
                        : isRevision
                        ? "bg-rose-50/30 border-rose-200/70"
                        : stage.key === "SUBMIT_TO_REVIEW"
                        ? "bg-amber-50/30 border-amber-200/70"
                        : stage.key === "ON_PROGRESS"
                        ? "bg-blue-50/30 border-blue-200/70"
                        : "bg-white/90 border-slate-200"
                    }`}
                  >
                    <div className="p-3.5 border-b border-slate-200/80 bg-white/80 backdrop-blur-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-6 w-6 rounded-full text-white text-[11px] font-black flex items-center justify-center shadow-xs shrink-0 ${
                            stage.key === "DONE"
                              ? "bg-emerald-600"
                              : isRevision
                              ? "bg-rose-600"
                              : stage.key === "SUBMIT_TO_REVIEW"
                              ? "bg-amber-500"
                              : stage.key === "ON_PROGRESS"
                              ? "bg-blue-600"
                              : "bg-slate-700"
                          }`}
                        >
                          {stage.step}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-slate-900">{stage.label}</h3>
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {colTasks.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetCardForNew(defaultCardKey);
                            setCreateModalOpen(true);
                          }}
                          title={`Tambah tugas di ${stage.label}`}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleCollapseStage(stage.key)}
                          title="Ciutkan kolom ini"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Minimize2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 flex-1 space-y-3 overflow-y-auto">
                      {colTasks.length === 0 ? (
                        <div className="h-44 flex flex-col items-center justify-center text-center p-3 text-slate-400 border border-dashed border-slate-300/80 rounded-2xl bg-white/40">
                          <p className="text-xs font-bold text-slate-600">Kosong</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Tarik kartu tugas ke sini</p>
                        </div>
                      ) : (
                        colTasks.map((t) => renderCard(t, isPersonalBoard, isDelegatedView))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: LIST VIEW (TABEL / DAFTAR BARIS KOMPAK ALA NOTION / CLICKUP) */}
        {currentViewMode === "LIST" && (() => {
          const tableTasks = processedTasks.filter((t) =>
            visibleStages.includes(getTaskStageKey(t))
          );

          return (
            <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden min-h-[580px]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-black text-slate-500 uppercase tracking-wider select-none">
                      <th
                        onClick={() => handleSortClick("TITLE")}
                        className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition group"
                      >
                        <div className="flex items-center gap-1">
                          <span className={sortField === "TITLE" ? "text-blue-700 font-black" : ""}>
                            Tugas / Judul
                          </span>
                          {renderSortIcon("TITLE")}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortClick("BRAND")}
                        className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition group"
                      >
                        <div className="flex items-center gap-1">
                          <span className={sortField === "BRAND" ? "text-blue-700 font-black" : ""}>
                            Divisi & Brand
                          </span>
                          {renderSortIcon("BRAND")}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortClick("STAGE")}
                        className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition group"
                      >
                        <div className="flex items-center gap-1">
                          <span className={sortField === "STAGE" ? "text-blue-700 font-black" : ""}>
                            Stage
                          </span>
                          {renderSortIcon("STAGE")}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortClick("PRIORITY")}
                        className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition group"
                      >
                        <div className="flex items-center gap-1">
                          <span className={sortField === "PRIORITY" ? "text-blue-700 font-black" : ""}>
                            Prioritas
                          </span>
                          {renderSortIcon("PRIORITY")}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortClick("ASSIGNEE")}
                        className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition group"
                      >
                        <div className="flex items-center gap-1">
                          <span className={sortField === "ASSIGNEE" ? "text-blue-700 font-black" : ""}>
                            Tim Pelaksana
                          </span>
                          {renderSortIcon("ASSIGNEE")}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortClick("CREATOR")}
                        className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition group"
                      >
                        <div className="flex items-center gap-1">
                          <span className={sortField === "CREATOR" ? "text-blue-700 font-black" : ""}>
                            Pemberi
                          </span>
                          {renderSortIcon("CREATOR")}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortClick("DEADLINE")}
                        className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition group"
                      >
                        <div className="flex items-center gap-1">
                          <span className={sortField === "DEADLINE" ? "text-blue-700 font-black" : ""}>
                            Target Deadline
                          </span>
                          {renderSortIcon("DEADLINE")}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortClick("ACTION")}
                        className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition group select-none"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span className={sortField === "ACTION" ? "text-blue-700 font-black" : ""}>
                            Aksi
                          </span>
                          {renderSortIcon("ACTION")}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {tableTasks.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <List className="h-8 w-8 text-slate-300" />
                            <p className="font-bold text-slate-600">Tidak ada tugas ditemukan</p>
                            <p className="text-xs text-slate-400">Coba ubah filter atau kustomisasi stage.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      tableTasks.map((task) => {
                        const stageKey = getTaskStageKey(task);
                        const stageInfo =
                          WORKBOARD_STAGES.find((s) => s.key === stageKey) || WORKBOARD_STAGES[0];
                        const isMyTask =
                          task.user?.id === user?.id ||
                          task.assignees?.some((a) => a.user?.id === user?.id);
                        const isCreatorOrMgr =
                          task.creator?.id === user?.id ||
                          user?.role === "ADMIN" ||
                          user?.role === "MANAGER";

                        return (
                          <tr
                            key={task.id}
                            onClick={() => setSelectedTaskForDetail(task)}
                            className="hover:bg-blue-50/40 transition cursor-pointer group"
                          >
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-bold text-slate-900 group-hover:text-red-600 transition truncate">
                                {task.title}
                              </div>
                              {task.description && (
                                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {task.description.replace(/<[^>]*>?/gm, "").trim()}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="rounded-md bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                                  {task.departmentCard || "UMUM"}
                                </span>
                                {task.brandName && (
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    {task.brandName}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                                  stageKey === "DONE"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : stageKey === "REVISION"
                                    ? "bg-rose-50 text-rose-800 border-rose-200"
                                    : stageKey === "SUBMIT_TO_REVIEW"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : stageKey === "ON_PROGRESS"
                                    ? "bg-blue-50 text-blue-800 border-blue-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                <span>
                                  {stageInfo.step}. {stageInfo.label}
                                </span>
                              </span>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              {task.priority === "URGENT" ? (
                                <span className="rounded-full bg-red-500 text-white text-[9px] font-black px-2 py-0.5 shadow-2xs">
                                  Urgent
                                </span>
                              ) : task.priority === "HIGH" ? (
                                <span className="rounded-full bg-orange-100 text-orange-800 border border-orange-200 text-[9px] font-bold px-2 py-0.5">
                                  Tinggi
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400">Normal</span>
                              )}
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-white">
                                  {task.user?.avatarUrl ? (
                                    <img
                                      src={task.user.avatarUrl}
                                      alt={task.user.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    (task.user?.name || "?").charAt(0)
                                  )}
                                </span>
                                <span className="text-xs font-semibold text-slate-800 truncate max-w-[100px]">
                                  {task.user?.id === user?.id ? "Saya Sendiri" : task.user?.name || "Belum ada PIC"}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap text-xs text-slate-600">
                              {task.creator?.name ? (
                                <span className="font-semibold text-purple-700">
                                  {task.creator.id === user?.id ? "Saya" : task.creator.name}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                              {task.expectedDeadline ? formatDateTime(task.expectedDeadline) : "Fleksibel"}
                            </td>

                            <td
                              className="py-3 px-4 text-right whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {stageKey === "NOT_STARTED" && isMyTask ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartTask(task.id)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
                                >
                                  <Play className="h-3 w-3" />
                                  <span>Mulai &rarr;</span>
                                </button>
                              ) : stageKey === "ON_PROGRESS" && isMyTask ? (
                                <button
                                  type="button"
                                  onClick={() => setDeliverableModalTask(task)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Submit &rarr;</span>
                                </button>
                              ) : (stageKey === "SUBMIT_TO_REVIEW" || task.reviewStatus === "UNDER_REVIEW") ? (
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  {task.deliverableUrl && (
                                    <a
                                      href={task.deliverableUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition border border-amber-200"
                                      title="Lihat Link Hasil Kerja"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                  {isCreatorOrMgr ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setRevisionModalTask(task)}
                                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-[11px] cursor-pointer"
                                      >
                                        Revisi
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveTask(task.id)}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[11px] cursor-pointer shadow-2xs"
                                      >
                                        ACC ✓
                                      </button>
                                    </>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                                      <Clock className="h-3 w-3 text-amber-600" />
                                      Menunggu ACC
                                    </span>
                                  )}
                                </div>
                              ) : stageKey === "REVISION" && isMyTask ? (
                                <button
                                  type="button"
                                  onClick={() => setDeliverableModalTask(task)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition shadow-xs cursor-pointer"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  <span>Submit Revisi &rarr;</span>
                                </button>
                              ) : stageKey === "DONE" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Selesai
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedTaskForDetail(task)}
                                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

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
            relevantDivisionKeys={relevantDivisionKeys}
          />
        )}

        <main
          className={`flex-1 min-h-0 min-w-0 p-3 sm:p-4 w-full flex flex-col ${
            boardMode === "PERSONAL" || selectedDivision ? "overflow-y-auto space-y-4" : "overflow-hidden space-y-2.5"
          }`}
        >


          {/* ========================================================================= */}
          {/* VIEW MODE 1: BIGBOARD PRIBADI (Tugas Saya & Delegasi Saya)                */}
          {/* ========================================================================= */}
          {boardMode === "PERSONAL" ? (
            <div className="space-y-6">
              {/* Header & Sub-Tabs */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 tracking-wider uppercase">
                      BigBoard Pribadi
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs font-semibold text-slate-600">
                      {user?.name} ({user?.department || "Difitech"})
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                    {personalTab === "MY_TASKS" ? "📋 Lembar Tugas Saya (Pengerjaan)" : "🚀 Tugas yang Saya Delegasikan"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {personalTab === "MY_TASKS"
                      ? "Tugas yang ditugaskan kepada Anda oleh diri sendiri maupun rekan kerja. Geser stage sesuai progres Anda."
                      : "Tugas yang Anda delegasikan ke rekan kerja. Pantau penyelesaian dan setujui (ACC / Revisi) hasil kerja mereka."}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Sub-tab Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPersonalTab("MY_TASKS")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        personalTab === "MY_TASKS"
                          ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                      <span>Tugas Saya</span>
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                        {myAssignedTasks.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPersonalTab("DELEGATED")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        personalTab === "DELEGATED"
                          ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Share2 className="h-3.5 w-3.5 text-purple-600" />
                      <span>Delegasi Saya</span>
                      {pendingReviewForMeCount > 0 ? (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-500 text-white animate-pulse">
                          {pendingReviewForMeCount} Review!
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                          {myDelegatedTasks.length}
                        </span>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setTargetCardForNew(undefined);
                      setCreateModalOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Buat Tugas Baru</span>
                  </button>
                </div>
              </div>

              {/* Sub-Filters / Toolbar for Personal BigBoard */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
                {/* Left: View Mode Switcher + Customize Stage */}
                <div className="flex items-center gap-2 flex-wrap">
                  {renderViewModeSwitcher()}
                  {renderStageCustomizer()}
                </div>

                {/* Right: Priority Filter, Sort Dropdown & Search */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {renderPriorityAndSortControls()}

                  {/* Search Input */}
                  <div className="relative w-40 sm:w-52">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari tugas pribadi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-red-500 focus:bg-white focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-View Container for Personal Board */}
              {renderMultiViewContainer({
                tasks: personalDisplayTasks,
                isPersonalBoard: true,
                isDelegatedView: personalTab === "DELEGATED",
                emptyContextText: personalTab === "MY_TASKS" ? "di tugas pribadi Anda" : "di delegasi Anda",
              })}
            </div>
          ) : !selectedDivision ? (
            /* ========================================================================= */
            /* VIEW MODE 2: BIGBOARD DIVISI (Full Height Kanban 6 Divisi)               */
            /* ========================================================================= */
            <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
              {/* Unified Header & Filter Bar */}
              <div className="shrink-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                {/* Left: Title & Scope/Status */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 mr-1">
                    <div className="h-8 w-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-black shadow-2xs shrink-0">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h1 className="text-sm font-black text-slate-900 leading-none whitespace-nowrap">
                        BigBoard Difitech
                      </h1>
                      <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap mt-0.5">
                        Overview 6 Divisi
                      </p>
                    </div>
                  </div>

                  <div className="h-5 w-px bg-slate-200 hidden sm:block" />


                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setStatusFilter("ALL")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition shrink-0 cursor-pointer whitespace-nowrap ${
                        statusFilter === "ALL"
                          ? "bg-white text-slate-900 shadow-2xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("IN_PROGRESS")}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition shrink-0 cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                        statusFilter === "IN_PROGRESS"
                          ? "bg-blue-600 text-white shadow-2xs font-black"
                          : "text-slate-600 hover:text-blue-600"
                      }`}
                    >
                      <PlayCircle className="h-3 w-3" />
                      <span>Sedang Jalan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("REVIEW")}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition shrink-0 cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                        statusFilter === "REVIEW"
                          ? "bg-amber-500 text-white shadow-2xs font-black"
                          : "text-slate-600 hover:text-amber-600"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span>Butuh Review</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("COMPLETED")}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition shrink-0 cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                        statusFilter === "COMPLETED"
                          ? "bg-emerald-600 text-white shadow-2xs font-black"
                          : "text-slate-600 hover:text-emerald-600"
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Selesai</span>
                    </button>
                  </div>
                </div>

                {/* Right Controls: Priority, Sort, Search, Brand & + Request Button */}
                <div className="flex items-center gap-2 justify-end flex-wrap sm:flex-nowrap">
                  {renderPriorityAndSortControls()}
                  <div className="relative flex-1 sm:w-44">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari kartu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-red-500 focus:bg-white focus:outline-none transition"
                    />
                  </div>

                  {availableBrands.length > 0 && (
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-bold focus:border-red-500 focus:bg-white focus:outline-none transition cursor-pointer shrink-0"
                    >
                      <option value="ALL">Semua Brand</option>
                      {availableBrands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setTargetCardForNew(undefined);
                      setCreateModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Tugas</span>
                  </button>
                </div>
              </div>

              {/* 6 Columns Kanban Container */}
              {(() => {
                const displayedCards = CARDS_DEFINITION;

                return (
                  <div className="flex-1 min-h-0 w-full flex flex-row items-stretch gap-3.5 sm:gap-4 overflow-x-auto pb-2 kanban-scroll">
                    {displayedCards.map((cardDef) => {
                      const Icon = cardDef.icon;
                      const allDivTasks = tasks.filter(
                        (t) => (t.departmentCard || "").toUpperCase() === cardDef.key
                      );
                      const cardTasks = filterAndSortTasks(
                        allDivTasks.filter((t) => {
                          if (statusFilter === "ALL") return true;
                          if (statusFilter === "IN_PROGRESS") return t.status === "IN_PROGRESS";
                          if (statusFilter === "REVIEW") {
                            return (
                              t.reviewStatus === "TO_BE_REVIEWED" ||
                              t.reviewStatus === "UNDER_REVIEW" ||
                              t.reviewStatus === "REVISION_REQUESTED"
                            );
                          }
                          if (statusFilter === "COMPLETED") return t.status === "COMPLETED";
                          return true;
                        })
                      );

                      const runningCount = allDivTasks.filter((t) => t.status === "IN_PROGRESS").length;
                      const reviewCount = allDivTasks.filter(
                        (t) =>
                          t.reviewStatus === "TO_BE_REVIEWED" ||
                          t.reviewStatus === "UNDER_REVIEW" ||
                          t.reviewStatus === "REVISION_REQUESTED"
                      ).length;

                      return (
                        <div
                          key={cardDef.key}
                          className="flex-1 min-w-[260px] h-full flex flex-col bg-slate-100/90 rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
                        >
                          {/* Column Header */}
                          <div className={`p-3 text-white ${cardDef.headerBg} shrink-0`}>
                            <div className="flex items-center justify-between">
                              <div
                                onClick={() => openDivisionStage(cardDef.key)}
                                className="flex items-center gap-2 min-w-0 cursor-pointer group/title"
                                title={`Buka BigBoard Divisi ${cardDef.label}`}
                              >
                                <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-xs text-white shrink-0 group-hover/title:bg-white/30 transition">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className="text-sm font-black tracking-tight truncate group-hover/title:underline">{cardDef.label}</h3>
                                    <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-black shrink-0">
                                      {cardTasks.length}
                                    </span>
                                    {isHomeCard(cardDef.key, user?.department) && !isAdmin && (
                                      <span className="rounded-md bg-white text-slate-900 px-1.5 py-0.2 text-[9px] font-black shrink-0 shadow-2xs">
                                        Divisi Saya
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-white/80 truncate">{cardDef.sublabel}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  title={`Buka BigBoard Divisi ${cardDef.label}`}
                                  onClick={() => openDivisionStage(cardDef.key)}
                                  className="p-1 rounded-lg bg-white/20 hover:bg-white/35 text-white transition shadow-2xs cursor-pointer"
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  title={`Tambah tugas di ${cardDef.label}`}
                                  onClick={() => {
                                    setTargetCardForNew(cardDef.key);
                                    setCreateModalOpen(true);
                                  }}
                                  className="p-1 rounded-lg bg-white/20 hover:bg-white/35 text-white transition shadow-2xs cursor-pointer"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Quick mini indicators */}
                            <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-[10px] font-bold text-white/90">
                              <span className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                                {runningCount} Berjalan
                              </span>
                              {reviewCount > 0 && (
                                <span className="rounded-full bg-amber-400 text-amber-950 px-1.5 py-0.2 text-[9px] font-black">
                                  {reviewCount} Butuh Review
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Column Top Action: Tambah Tugas (Ditaruh di atas) */}
                          <div className="p-2 bg-white/90 border-b border-slate-200/90 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetCardForNew(cardDef.key);
                                setCreateModalOpen(true);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold text-slate-700 bg-white hover:text-red-600 hover:bg-red-50/50 rounded-xl transition border border-dashed border-slate-300 hover:border-red-300 shadow-2xs cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5 text-red-600" />
                              <span>Tambah Tugas</span>
                            </button>
                          </div>

                          {/* Sticky Notes Scrollable Body */}
                          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
                            {cardTasks.length === 0 ? (
                              <div className="p-5 text-center rounded-xl border border-dashed border-slate-300 bg-white/60 space-y-1.5 my-2">
                                <p className="text-xs font-semibold text-slate-500">
                                  {statusFilter !== "ALL"
                                    ? "Tidak ada kartu pada filter ini"
                                    : "Belum ada kartu kerja di divisi ini"}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetCardForNew(cardDef.key);
                                    setCreateModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Buat Kartu Baru</span>
                                </button>
                              </div>
                            ) : (
                              cardTasks.map((task) => (
                                <div
                                  key={task.id}
                                  onClick={() => setSelectedTaskForDetail(task)}
                                  className={`group relative rounded-xl border bg-white p-3 shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer hover:-translate-y-0.5 flex flex-col justify-between ${
                                    task.priority === "URGENT"
                                      ? "border-red-300 ring-1 ring-red-200/60"
                                      : task.reviewStatus === "TO_BE_REVIEWED"
                                      ? "border-amber-300 ring-1 ring-amber-200/60"
                                      : "border-slate-200/90 hover:border-slate-300"
                                  }`}
                                >
                                  {/* Sticky Note Top Accent / Tape */}
                                  <div className={`h-1.5 w-full rounded-full mb-2 ${cardDef.headerBg}`} />

                                  <div>
                                    {/* Tags Row: Priority + Status */}
                                    <div className="flex items-center justify-between gap-1.5 whitespace-nowrap overflow-hidden">
                                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                                        {task.creator?.id &&
                                          task.creator.id !== user?.id &&
                                          (task.user?.id === user?.id ||
                                            task.assignees?.some((a) => a.user?.id === user?.id)) && (
                                            <span className="rounded-full bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 shadow-2xs flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                                              <Inbox className="h-2.5 w-2.5" />
                                              User Requested
                                            </span>
                                          )}
                                        {task.priority === "URGENT" && (
                                          <span className="rounded-full bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 flex items-center gap-0.5 shadow-2xs shrink-0 whitespace-nowrap">
                                            <Flame className="h-2.5 w-2.5" />
                                            Urgent
                                          </span>
                                        )}
                                        {task.priority === "HIGH" && (
                                          <span className="rounded-full bg-orange-100 text-orange-800 text-[9px] font-bold px-1.5 py-0.5 border border-orange-200 shrink-0 whitespace-nowrap">
                                            Tinggi
                                          </span>
                                        )}

                                        {task.brandName &&
                                          task.brandName !== "Difitech HRIS" &&
                                          task.brandName !== "Internal Difitech" && (
                                            <span className="text-[9px] font-semibold text-slate-500 truncate max-w-[75px]">
                                              {task.brandName}
                                            </span>
                                        )}
                                      </div>

                                      {/* Stage Badge: Only when relevant */}
                                      {(() => {
                                        if (task.reviewStatus === "TO_BE_REVIEWED") {
                                          return (
                                            <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-1.5 py-0.5 flex items-center gap-1 shrink-0 whitespace-nowrap">
                                              <Clock className="h-2.5 w-2.5 text-amber-700" />
                                              Butuh Review
                                            </span>
                                          );
                                        }
                                        if (task.reviewStatus === "UNDER_REVIEW") {
                                          return (
                                            <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold px-1.5 py-0.5 flex items-center gap-1 shrink-0 whitespace-nowrap">
                                              <Eye className="h-2.5 w-2.5 text-amber-600" />
                                              Reviewing
                                            </span>
                                          );
                                        }
                                        if (task.reviewStatus === "REVISION_REQUESTED") {
                                          return (
                                            <span className="rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[9px] font-black px-1.5 py-0.5 flex items-center gap-1 shrink-0 whitespace-nowrap">
                                              <AlertCircle className="h-2.5 w-2.5 text-rose-600" />
                                              Revisi
                                            </span>
                                          );
                                        }
                                        if (task.status === "COMPLETED") {
                                          return (
                                            <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 flex items-center gap-1 shrink-0 whitespace-nowrap">
                                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                              Selesai
                                            </span>
                                          );
                                        }
                                        if (task.status === "IN_PROGRESS") {
                                          return (
                                            <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-semibold px-1.5 py-0.5 flex items-center gap-1 shrink-0 whitespace-nowrap">
                                              <PlayCircle className="h-2.5 w-2.5 text-blue-600" />
                                              Dikerjakan
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>

                                    {/* Title */}
                                    <h4 className="text-xs font-black text-slate-800 leading-snug line-clamp-2 mt-2 group-hover:text-red-600 transition">
                                      {task.title}
                                    </h4>

                                    {/* Description snippet (Cleaned of raw HTML & base64) */}
                                    {(() => {
                                      const snippet = getCleanDescriptionSnippet(task.description);
                                      const hasImg = /<img[^>]*>/i.test(task.description || "");
                                      return (
                                        <>
                                          {snippet && (
                                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                                              {snippet}
                                            </p>
                                          )}
                                          {hasImg && (
                                            <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                              <span>📷 Lampiran Screenshot</span>
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}

                                    {/* Corong / Request Delegation Tag */}
                                    {task.creator?.id && task.creator.id !== task.user?.id && (
                                      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 bg-slate-50 p-1.5 rounded-lg border border-slate-100 whitespace-nowrap overflow-hidden">
                                        <Share2 className="h-3 w-3 text-red-500 shrink-0" />
                                        <span className="truncate">
                                          <span className="font-bold text-slate-900">{task.creator.name}</span>
                                          <span className="text-slate-400 mx-1">➔</span>
                                          <span className="font-bold text-blue-700">
                                            {task.assignees && task.assignees.length > 0
                                              ? task.assignees.map((a) => a.user.name).join(", ")
                                              : task.user?.name || "PIC"}
                                          </span>
                                        </span>
                                      </div>
                                    )}

                                    {/* Deliverable preview badge */}
                                    {task.deliverableUrl && (
                                      <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 whitespace-nowrap">
                                        <ExternalLink className="h-3 w-3 text-emerald-600 shrink-0" />
                                        <span className="truncate">Bukti Siap Di-review</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Footer: Multi-Assignee Avatar Stack + Deadline */}
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      {/* Avatar Stack */}
                                      <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                                        {(() => {
                                          const allPeople = [
                                            task.user,
                                            ...(task.assignees?.map((a) => a.user) || []),
                                          ].filter(Boolean);
                                          const uniquePeople = Array.from(
                                            new Map(allPeople.map((p) => [p.id, p])).values()
                                          );
                                          return uniquePeople.slice(0, 3).map((person, idx) => (
                                            <div
                                              key={person.id || idx}
                                              title={person.name}
                                              className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-slate-200 text-slate-700 text-[9px] font-black flex items-center justify-center overflow-hidden shrink-0"
                                            >
                                              {person.avatarUrl ? (
                                                <img src={person.avatarUrl} alt={person.name} className="h-full w-full object-cover" />
                                              ) : (
                                                person.name?.charAt(0) || "U"
                                              )}
                                            </div>
                                          ));
                                        })()}
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-700 truncate">
                                        {task.user?.name}
                                      </span>
                                    </div>

                                    {/* Deadline */}
                                    {task.expectedDeadline && (
                                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 shrink-0">
                                        <Calendar className="h-3 w-3 text-slate-400" />
                                        <span>
                                          {new Date(task.expectedDeadline).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                          })}
                                        </span>
                                      </div>
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
                );
              })()}
            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW MODE 3: BIGBOARD DIVISI STAGE KANBAN                                 */
            /* ========================================================================= */
            <div className="space-y-6">
              {/* Header & Division Scope Tabs */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 tracking-wider uppercase">
                      BigBoard Divisi
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs font-semibold text-slate-600">
                      {currentDivisionDef?.label || selectedDivision} ({currentDivisionDef?.sublabel || "Divisi"})
                    </span>
                    {isHomeCard(selectedDivision, user?.department) && (
                      <span className="rounded-md bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 shrink-0">
                        Divisi Saya
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={backToOverview}
                      className="text-xs font-bold text-slate-400 hover:text-slate-700 hover:underline flex items-center gap-1 transition ml-1 cursor-pointer"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Semua Divisi</span>
                    </button>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                    📋 Lembar Tugas Divisi {currentDivisionDef?.label || selectedDivision}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Papan kerja kolaboratif dan pipeline pengerjaan tim {currentDivisionDef?.label}. Pantau tugas divisi, progres tim, dan serahkan hasil kerja.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Division Scope Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setViewScope("ALL")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        viewScope === "ALL"
                          ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <FolderKanban className="h-3.5 w-3.5 text-blue-600" />
                      <span>Semua Tugas</span>
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                        {divisionTasks.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewScope("RELEVANT")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        viewScope === "RELEVANT"
                          ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Terkait Saya</span>
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                        {
                          divisionTasks.filter(
                            (t) =>
                              t.user?.id === user?.id ||
                              t.assignees?.some((a) => a.user?.id === user?.id) ||
                              t.creator?.id === user?.id
                          ).length
                        }
                      </span>
                    </button>

                    {currentDivisionDef?.isContentHub && isSosmedUser && (
                      <Link
                        href="/dashboard/content-production"
                        className="flex items-center gap-1.5 rounded-lg border border-pink-200 bg-pink-50 px-2.5 py-1 text-xs font-bold text-pink-700 hover:bg-pink-100 transition shadow-2xs ml-1"
                      >
                        <Clapperboard className="h-3.5 w-3.5 text-pink-600" />
                        <span>Pipeline Konten</span>
                      </Link>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setTargetCardForNew(selectedDivision || undefined);
                      setCreateModalOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Buat Tugas Baru</span>
                  </button>
                </div>
              </div>

              {/* Sub-Filters / Toolbar for Division BigBoard */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
                {/* Left: View Mode Switcher + Customize Stage */}
                <div className="flex items-center gap-2 flex-wrap">
                  {renderViewModeSwitcher()}
                  {renderStageCustomizer()}
                </div>

                {/* Right: Priority Filter, Sort Dropdown, Member Filter, Brand Filter & Search */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {renderPriorityAndSortControls()}

                  {/* Filter Member */}
                  <div className="relative">
                    <select
                      value={selectedMember}
                      onChange={(e) => setSelectedMember(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-bold focus:border-red-500 focus:bg-white focus:outline-none transition cursor-pointer shrink-0"
                    >
                      <option value="ALL">Semua Anggota</option>
                      {divisionMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.id === user?.id ? "(Saya)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Brand */}
                  {availableBrands.length > 0 && (
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-bold focus:border-red-500 focus:bg-white focus:outline-none transition cursor-pointer shrink-0"
                    >
                      <option value="ALL">Semua Brand</option>
                      {availableBrands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Search Input */}
                  <div className="relative w-40 sm:w-52">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Cari tugas ${currentDivisionDef?.label || "divisi"}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-red-500 focus:bg-white focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-View Container for Division Board */}
              {renderMultiViewContainer({
                tasks: filteredDivisionTasks,
                isPersonalBoard: false,
                isDelegatedView: false,
                emptyContextText: `di divisi ${currentDivisionDef?.label || ""}`,
                defaultCardKey: selectedDivision || undefined,
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setTargetCardForNew(undefined);
        }}
        onSuccess={fetchTasks}
        initialDepartment={targetCardForNew}
      />

      {selectedTaskForDetail && (
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
      )}

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
          isApprovalAction={deliverableModalTask.reviewStatus === "REVISION_REQUESTED"}
          onSuccess={fetchTasks}
        />
      )}
    </div>
  );
}


export default function WorkspaceCardsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
        </div>
      }
    >
      <WorkspaceCardsPageContent />
    </Suspense>
  );
}
