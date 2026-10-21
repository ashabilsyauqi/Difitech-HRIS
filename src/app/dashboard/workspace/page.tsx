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
} from "lucide-react";
import Link from "next/link";

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
  createdAt: string;
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
    isContentHub: true,
  },
  {
    key: "ADS",
    label: "Ads",
    sublabel: "Paid Traffic, Meta & Google",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    headerBg: "bg-gradient-to-r from-blue-600 to-indigo-600",
  },
  {
    key: "SEO",
    label: "SEO",
    sublabel: "Organic Traffic & Articles",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    headerBg: "bg-gradient-to-r from-amber-500 to-orange-600",
  },
  {
    key: "WEB",
    label: "Web",
    sublabel: "Landing Pages & Tech Stack",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    headerBg: "bg-gradient-to-r from-emerald-600 to-teal-600",
  },
  {
    key: "MARKETPLACE",
    label: "Marketplace",
    sublabel: "Shopee, Tokopedia, TikTok Shop",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    headerBg: "bg-gradient-to-r from-purple-600 to-violet-600",
  },
  {
    key: "HR",
    label: "HR",
    sublabel: "Operations & Internal Team",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    headerBg: "bg-gradient-to-r from-slate-700 to-slate-900",
  },
];

export default function WorkspaceCardsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [viewScope, setViewScope] = useState<"ALL" | "MINE" | "DELEGATED">("ALL");

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
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchBrandsAndMetadata();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedBrand, searchQuery]);

  // Oper ke Kanban Content Production (Tim Sosmed)
  const handleSendToContentProduction = async (taskId: string) => {
    try {
      await fetch(`/api/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendToContentProduction: true }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to send to content production:", err);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5">Selesai</span>;
      case "IN_PROGRESS":
        return <span className="rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5">Dikerjakan</span>;
      case "BLOCKED":
        return <span className="rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5">Blocked</span>;
      default:
        return <span className="rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5">Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {user && <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />}

      <div className="flex flex-1">
        {user && <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 tracking-wider uppercase">
                  Central Hub
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs font-semibold text-slate-500">Kolaborasi 6 Card Divisi</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                6 Card Divisi Kerja
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Posting tugas ke divisi tujuan, pantau deadline expectation & suggestion, tag nama brand, dan lakukan follow up.
              </p>
            </div>

            <div className="flex items-center gap-3">
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
                <span>Posting Tugas Baru</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            {/* View Scope Segmented Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
              <button
                type="button"
                onClick={() => setViewScope("ALL")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
                  viewScope === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🏢 Semua Tugas
              </button>
              <button
                type="button"
                onClick={() => setViewScope("MINE")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  viewScope === "MINE"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-blue-600"
                }`}
              >
                <span>👤 Tugas Pribadi Saya</span>
                {user && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${viewScope === "MINE" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {tasks.filter((t) => t.user?.id === user.id).length}
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
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${viewScope === "DELEGATED" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {tasks.filter((t) => t.creator?.id === user.id && t.user?.id !== user.id).length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Cari tugas, brand, atau pembuat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                />
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
                  <Filter className="h-3 w-3" /> Brand:
                </span>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-red-500 outline-none bg-white font-medium w-full sm:w-auto"
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

          {/* 6 Card Besar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {CARDS_DEFINITION.map((cardDef) => {
              const filteredTasks = tasks.filter((t) => {
                if (viewScope === "MINE") {
                  return t.user?.id === user?.id;
                }
                if (viewScope === "DELEGATED") {
                  return t.creator?.id === user?.id && t.user?.id !== user?.id;
                }
                return true;
              });

              const cardTasks = filteredTasks.filter(
                (t) => (t.departmentCard || "").toUpperCase() === cardDef.key
              );

              return (
                <div
                  key={cardDef.key}
                  className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col transition hover:shadow-md"
                >
                  {/* Card Header */}
                  <div className={`p-4 text-white ${cardDef.headerBg}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black tracking-tight">{cardDef.label}</span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black text-white">
                          {cardTasks.length} tugas
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setTargetCardForNew(cardDef.key);
                          setCreateModalOpen(true);
                        }}
                        title={`Tambah tugas ke ${cardDef.label}`}
                        className="rounded-xl bg-white/20 hover:bg-white/30 p-1.5 text-white transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Tambah</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-white/80 mt-0.5">{cardDef.sublabel}</p>
                  </div>

                  {/* Card Body: Task List */}
                  <div className="p-3.5 bg-slate-50/60 flex-1 space-y-3 min-h-[420px] max-h-[700px] overflow-y-auto">
                    {cardTasks.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                        <Layers className="h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-xs font-semibold text-slate-500">Belum ada tugas di {cardDef.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Semua anggota tim dapat memposting tugas di sini
                        </p>
                        <button
                          onClick={() => {
                            setTargetCardForNew(cardDef.key);
                            setCreateModalOpen(true);
                          }}
                          className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                          + Posting Sekarang
                        </button>
                      </div>
                    ) : (
                      cardTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskForDetail(task)}
                          className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-sm transition space-y-2.5 cursor-pointer group"
                        >
                          {/* Tags & Status */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1 flex-wrap">
                              {task.user?.id === user?.id ? (
                                <span className="rounded-md bg-blue-100 text-blue-800 border border-blue-200 font-extrabold text-[9px] px-1.5 py-0.5 flex items-center gap-1">
                                  👤 Tugas Pribadi
                                </span>
                              ) : task.creator?.id === user?.id ? (
                                <span className="rounded-md bg-purple-100 text-purple-800 border border-purple-200 font-extrabold text-[9px] px-1.5 py-0.5 flex items-center gap-1">
                                  📤 Anda Delegasikan
                                </span>
                              ) : null}

                              {task.brandName && (
                                <span className="rounded-md bg-red-50 text-red-700 border border-red-200 font-bold text-[10px] px-2 py-0.5 flex items-center gap-1">
                                  <Tag className="h-2.5 w-2.5" /> {task.brandName}
                                </span>
                              )}
                              {getStatusBadge(task.status)}
                              {task.isContentProduction && (
                                <span className="rounded-md bg-pink-100 text-pink-700 text-[9px] font-black px-1.5 py-0.5 flex items-center gap-1">
                                  <Clapperboard className="h-2.5 w-2.5" /> {task.kanbanStage || "BRIEF"}
                                </span>
                              )}
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

                          {/* Title & Description */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-red-600 transition">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                {task.description.replace(/<[^>]*>?/gm, "").trim()}
                              </p>
                            )}
                          </div>

                          {/* People: Assignee & Creator Info */}
                          <div className="rounded-xl bg-slate-50 p-2.5 text-[10px] text-slate-600 border border-slate-100 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 text-slate-500 font-medium">
                                <User className="h-3 w-3 text-slate-400" /> Penerima:
                              </span>
                              <span className="font-bold text-slate-900 truncate max-w-[150px]">
                                {task.user?.id === user?.id ? (
                                  <span className="text-blue-700 font-extrabold">Saya Sendiri</span>
                                ) : (
                                  `${task.user?.name}${task.user?.department ? ` (${task.user.department})` : ""}`
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-slate-500">
                              <span className="truncate">
                                Pemberi: <strong className="text-slate-800">{task.creator?.id === user?.id ? "Saya" : (task.creator?.name || "Kolega")}</strong>
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono shrink-0">
                                {formatDateTime(task.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Deadline Section */}
                          <div className="text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="flex items-center gap-1 text-[10px]">
                                <Clock className="h-3 w-3 text-slate-400" /> Target:
                              </span>
                              <span className="font-bold text-slate-800 text-[10px]">
                                {formatDateTime(task.expectedDeadline)}
                              </span>
                            </div>

                            {/* Deadline Suggestion Note if any */}
                            {task.suggestedDeadline && (
                              <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-[10px] text-blue-900 space-y-1">
                                <div className="flex items-center justify-between font-bold">
                                  <span>Usulan Deadline:</span>
                                  <span className="text-[9px] uppercase px-1 rounded bg-blue-200">
                                    {task.suggestionStatus}
                                  </span>
                                </div>
                                <p className="font-mono">{formatDateTime(task.suggestedDeadline)}</p>
                                {task.suggestionReason && (
                                  <p className="italic text-[9px] text-blue-700">"{task.suggestionReason}"</p>
                                )}
                              </div>
                            )}

                            {/* Revision Tag */}
                            {task.revisionTag && (
                              <div className="rounded-lg bg-purple-50 border border-purple-200 p-2 text-[10px] text-purple-900 flex items-center gap-1">
                                <RefreshCw className="h-3 w-3 text-purple-600 shrink-0" />
                                <span className="font-bold">{task.revisionTag}</span>
                              </div>
                            )}
                          </div>

                          {/* Deliverable Url if done */}
                          {task.deliverableUrl && (
                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-[11px] flex items-center justify-between">
                              <span className="text-emerald-800 font-bold flex items-center gap-1 text-[10px]">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Hasil Akhir
                              </span>
                              <a
                                href={task.deliverableUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 font-bold hover:underline flex items-center gap-1 text-[10px]"
                              >
                                Tautan <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          )}

                          {/* Specific Actions */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                            {/* Khusus Card Sosmed: Oper ke Kanban Content */}
                            {cardDef.key === "SOSMED" && !task.isContentProduction && task.status !== "COMPLETED" && (
                              <button
                                onClick={() => handleSendToContentProduction(task.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-pink-200 bg-pink-50 px-2.5 py-1 text-[10px] font-bold text-pink-700 hover:bg-pink-100 transition"
                              >
                                <Clapperboard className="h-3 w-3" />
                                <span>Oper ke Kanban</span>
                              </button>
                            )}

                            {/* Tombol Saran Deadline untuk Assignee */}
                            {task.user?.id === user?.id && task.status !== "COMPLETED" && (
                              <button
                                onClick={() => setDeadlineModalTask(task)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline transition"
                              >
                                Nego Deadline
                              </button>
                            )}

                            {/* Tombol Minta Revisi jika sudah COMPLETED (Pemberi Tugas/Tim Ads bisa minta revisi) */}
                            {task.status === "COMPLETED" && (
                              <button
                                onClick={() => setRevisionModalTask(task)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition"
                              >
                                <RefreshCw className="h-2.5 w-2.5" />
                                <span>Minta Revisi</span>
                              </button>
                            )}

                            {/* Submit Selesai cepat */}
                            {task.status !== "COMPLETED" && (
                              <button
                                onClick={() => setDeliverableModalTask(task)}
                                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 transition"
                              >
                                Tandai Selesai &rarr;
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
        </main>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialDepartment={targetCardForNew}
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
